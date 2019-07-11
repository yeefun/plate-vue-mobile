const _ = require('lodash')
const Cookies = require( "cookies" )
const LRU = require('lru-cache')
const compression = require('compression')
const express = require('express')
const favicon = require('serve-favicon')
const fs = require('fs')
const http = require('http')
const maxMemUsageLimit = 1000 * 1024 * 1024
const memwatch = require('node-memwatch')
const moment = require('moment')
const microcache = require('route-cache')
const path = require('path')
const requestIp = require('request-ip')
const resolve = file => path.resolve(__dirname, file)
const uuidv4 = require('uuid/v4')
const { VALID_PREVIEW_IP_ADD } = require('./api/config')
const { createBundleRenderer } = require('vue-server-renderer')
const { fetchFromRedis, redisWriting } = require('./api/middle/redisHandler') 
// const { fetchFromRedis, insertIntoRedis } = require('./api/middle/redis')
const { monitorAfterRequest } = require('./prometheus/index')

const formatMem = (bytes) => {
  return (bytes / 1024 / 1024).toFixed(2) + ' Mb'
}

const isProd = process.env.NODE_ENV === 'production'
// const useMicroCache = process.env.MICRO_CACHE !== 'false'
const serverInfo =
  `express/${require('express/package.json').version} ` +
  `vue-server-renderer/${require('vue-server-renderer/package.json').version}`

const app = express()
http.globalAgent.maxSockets = Infinity
const debug = require('debug')('PLATEVUE:server')
const template = fs.readFileSync(resolve('./src/index.template.html'), 'utf-8')

if (isProd) {
  require('@google-cloud/profiler').start({
    serviceContext: {
      service: 'plate-vue-mobile-profiler',
      version: '1.0.0'
    }
  })
}

function createRenderer (bundle, options) {
  // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
  return createBundleRenderer(bundle, Object.assign(options, {
    template,
    // for component caching
    cache: LRU({
      max: 1000,
      maxAge: 1000 * 60 * 15
    }),
    // this is only needed when vue-server-renderer is npm-linked
    basedir: resolve('./dist'),
    // recommended for performance
    runInNewContext: false
  }))
}

app.use(requestIp.mw())
app.set('views', path.join(__dirname, 'src/views'))
app.set('view engine', 'ejs')

let renderer
let readyPromise
const templatePath = resolve('./src/index.template.html')
if (isProd) {
  // In production: create server renderer using built server bundle.
  // The server bundle is generated by vue-ssr-webpack-plugin.
  const template = fs.readFileSync(templatePath, 'utf-8')
  const bundle = require('./dist/vue-ssr-server-bundle.json')
  // The client manifests are optional, but it allows the renderer
  // to automatically infer preload/prefetch links and directly add <script>
  // tags for any async chunks used during render, avoiding waterfall requests.
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  renderer = createRenderer(bundle, {
    template,
    clientManifest
  })
} else {
  // In development: setup the dev server with watch and hot-reload,
  // and create a new renderer on bundle / index template update.
  readyPromise = require('./build/setup-dev-server')(
    app,
    templatePath,
    (bundle, options) => {
      renderer = createRenderer(bundle, options)
    }
  )
}

const serve = (path, cache) => express.static(resolve(path), {
  maxAge: cache && isProd ? 1000 * 60 * 60 : 0
})
const staticNotFound = (req, res) => res.status(404).send('404 | Not Found')
app.use(compression({ threshold: 0 }))
app.use(favicon('./assets/mirrormedia/favicon-48x48.png'))
app.use('/dist', serve('./dist', true), staticNotFound)
app.use('/assets', serve('./assets', true), staticNotFound)
app.use('/public', (req, res) => {
  res.redirect('/assets/mirrormedia' + req.url)
})
app.use('/manifest.json', serve('./manifest.json', true), staticNotFound)
app.use('/service-worker.js', serve('./dist/service-worker.js'), staticNotFound)

app.use(function(req, res, next) {
  let err = null
  try {
    decodeURIComponent(req.path)
  }
  catch(e) {
    err = e
  }
  if (err){
    console.error('Bad request:', req.path)
    return res.status(400).send('400 | Bad Request')
  }
  next()
})

// since this app has no user-specific content, every page is micro-cacheable.
// if your app involves user-specific content, you need to implement custom
// logic to determine whether a request is cacheable based on its url and
// headers.
// 1-second microcache.
// https://www.nginx.com/blog/benefits-of-microcaching-nginx/
// app.use(microcache.cacheSeconds(1, req => useMicroCache && req.originalUrl))
 
const exp_preview_mode = /\b(preview=true)\b/
const exp_dev = /^(dev|localhost)\b/
function render (req, res, next) {
  const s = Date.now()
  let isPageNotFound = false
  let isErrorOccurred = false  

  const checkoutMem = () => {
    const mem = process.memoryUsage()
    //console.error('MEMORY STAT(heapUsed):', formatMem(mem.heapUsed), `${moment().format('YYYY-MM-DD HH:mm:SS')}`)
    if (mem.heapUsed > maxMemUsageLimit) {
      for (let i = 0; i < 10; i += 1) {
        console.error('MEMORY WAS RUNNING OUT')
      } 
      console.error(`KILLING PROCESS IN 1 SECOND(At ${moment().format('YYYY-MM-DD HH:mm:SS')})`)
      process.exit(1)
    }
    if (isPageNotFound || isErrorOccurred) {
      try {
        global.gc()
      } catch (e) {
        // process.exit(1)
      }
    }    
  }
  const isPreview = exp_preview_mode.test(req.url)
  const rendererEjsCB = function (err, html) { 
    if (!err) {
      res.status(rendererEjsCB.code).send(html)

      /**
       * Save every single page which's processing with problem.
      */
      isProd && !isPreview && redisWriting(req.hostname + req.url, rendererEjsCB.code || 500, null, 60)

    } else {
      console.error('ERROR OCCURRED WHEN RENDERING EJS. \n', err)
      res.status(500).send('Internal Server Error')
    }
    checkoutMem()
  }

  if (!isPreview) {
    res.setHeader('Cache-Control', 'public, max-age=600')
  } else {
    const isValidReq = _.filter(VALID_PREVIEW_IP_ADD, i => (req.clientIp.indexOf(i) > -1)).length > 0
    console.info('Is there any preview permission limit?', _.get(VALID_PREVIEW_IP_ADD, 'length', 0) > 0)
    console.info('Is allowed?', isValidReq)
    res.header("Cache-Control", "no-cache, no-store, must-revalidate")
    res.header("Pragma", "no-cache")
    res.header("Expires", "0")
    if (!isValidReq) {

      rendererEjsCB.code = 404
      res.render('404', rendererEjsCB)
      // response 404 instead of 403 to avoid this page be indexed by search engin.
      // res.status(403).send('Forbidden')
      console.warn(`Attempted to access draft in fail: 403 Forbidden \nclientIp: ${req.connection.remoteAddress} \nreq.url: ${req.url}`)
      return
    }
  }
  console.info(`request target: ${req.url} (from ${req.clientIp})`)
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Server', serverInfo)

  const cookies = new Cookies( req, res, {} )
  const mmid = cookies.get('mmid')
  if (!mmid) {
    // cookies.set('mmid', uuidv4(), { httpOnly: false, expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
  }
  const handleError = err => {
    if (err.url) {
      res.redirect(err.url)
    } else if (err && err.code == 404) {
      isPageNotFound = true
      rendererEjsCB.code = 404
      res.render('404', rendererEjsCB)

      console.error(`##########REQUEST URL(404)############\n`,
        `ERROR OCCURRED WHEN RUNNING renderToString()\n`,
        `REQUEST URL: ${req.url}\n`,
        `REQUEST IP: ${req.clientIp}\n`,
        `REFERER: ${req.headers.referer}\n`,
        `${err}\n`, '######################')

      return
    } else {
      console.error(`ERROR OCCURRED WHEN RUNNING renderToString()\n`,
        `REQUEST URL: ${req.url}\n`,
        `REQUEST IP: ${req.clientIp}\n`,
        `REFERER: ${req.headers.referer}\n`,
        `${err}`)

      isErrorOccurred = true
      err.status = err.status || 500

      if ('403' == err.status) {
        res.status(403).send('403 | Forbidden')
        return
      } else if ('404' == err.status) {
        rendererEjsCB.code = 404
        res.render('404', rendererEjsCB)
        return
      } else {
        rendererEjsCB.code = 500
        res.render('500', { err, timestamp: (new Date).toString() }, rendererEjsCB)
        return
      }
    } 
  }
  
  const context = {
    title: '',
    meta: '',    
    url: req.url,
    link: '',
    adTrace: '',
    custom: '',
    resStack: '',
  }
  
  res.on('finish', function () {
    checkoutMem()
  })

  renderer.renderToString(context, (err, html) => {
    if (err) { return handleError(err) }
    res.send(html)
    !isProd && console.info(`whole request: ${Date.now() - s}ms`)

    /**
     * Save all pages in redis for 1 min for now.
     */

    // Don't save any page for now.
    console.log("final url: " + req.hostname + req.url)
    isProd && !isPreview && redisWriting(req.hostname + req.url, html, null, 600)
    monitorAfterRequest(req, res)
  })
}

app.use('/api', require('./api/index'), () => { /** END */ })
app.get('*', (req, res, next) => {
  req.s = Date.now()
  console.log('CURRENT HOST:', _.get(req, 'headers.host', ''), exp_dev.test(_.get(req, 'headers.host', '')))
  let urlRegex
  if (req.url.match(/\/story\//) && !req.url.match(exp_preview_mode)) {
    req.url = req.url.split('?')[0]
	if (urlRegex = req.url.match(/(\/story\/[\w\d-_]*)/)) {
		req.url = urlRegex[1]
	}
  }
  next()
}, fetchFromRedis, (req, res, next) => {
  if (res.redis) {
    console.log('Fetch page from Redis.', decodeURIComponent(req.hostname + "/" + req.url), `${Date.now() - req.s}ms\n`)
    if (res.redis.length > 3) {
      res.status(200).send(res.redis)
    } else {
      if (res.redis != '500') {
        res.status(res.redis).render(res.redis)
      } else {
        res.status(res.redis).render(res.redis, { err: '', timestamp: (new Date).toString() })
      }
    }
  } else {
    debug('Didnt see any html data.', req.url)
    next()
  }
}, isProd ? render : (req, res, next) => {
  readyPromise.then(() => render(req, res, next))
})

/*
app.get('*', (req, res, next) => {
  req.s = Date.now()
  console.log('CURRENT HOST:', _.get(req, 'headers.host', ''), exp_dev.test(_.get(req, 'headers.host', '')))
  next()
}, (req, res, next) => {
  if (res.redis && typeof res.redis === 'string') {
    console.log(`Fetch page from Redis. ${decodeURIComponent(req.url)}`)
    res.status(200).send(res.redis)
  } else {
    next()
  }
  next()
}, isProd ? render : (req, res, next) => {
  readyPromise.then(() => render(req, res, next))
})
*/
process.on('unhandledRejection', reason => {
  console.error(`\n[Unhandled Rejection]`)
  console.error(`${reason}\n`)
})

const port = process.env.PORT || 8080
const server = http.createServer(app).listen(port, () => console.log(`server started at localhost:${port}`))

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}

memwatch.on('leak', function(info) {
  const growth = formatMem(info.growth)
  const mem = process.memoryUsage()
  console.error('GETING MEMORY LEAK:', [ 'growth ' + growth, 'reason ' + info.reason ].join(', '))
  //console.error('MEMORY STAT(heapUsed):', formatMem(mem.heapUsed), `${moment().format('YYYY-MM-DD HH:mm:SS')}`)
})
memwatch.on('stats', function(stats) {
  const estBase = formatMem(stats.estimated_base)
  const currBase = formatMem(stats.current_base)
  const min = formatMem(stats.min)
  const max = formatMem(stats.max)
	/*
  console.info(`=======================================\n`,
    `GC STATs(${moment().format('YYYY-MM-DD HH:mm:SS')}):\n`, [
    'num_full_gc ' + stats.num_full_gc,
    'num_inc_gc ' + stats.num_inc_gc,
    'heap_compactions ' + stats.heap_compactions,
    'usage_trend ' + stats.usage_trend,
    'estimated_base ' + estBase,
    'current_base ' + currBase,
    'min ' + min,
    'max ' + max
  ].join(', '), `\n=======================================`)
	*/
  if (stats.current_base > maxMemUsageLimit) {
    //for (let i = 0; i < 10; i += 1) {
      console.error('MEMORY WAS RUNNING OUT')
    //} 
    /**
     * kill this process gracefully
     */
    const killTimer = setTimeout(() => {
      process.exit(1)
    }, 1000)
    killTimer.unref()
    server.close()
    console.error(`GOING TO KILL PROCESS IN 1 SECOND(At ${moment().format('YYYY-MM-DD HH:mm:SS')})`)
  }
})
