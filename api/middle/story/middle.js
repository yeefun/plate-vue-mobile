const { get, isEmpty, } = require('lodash')
const superagent = require('superagent')
const { getDate, getSectionColorModifier, getCredit, getStoryHeroImageSrc } = require('./util')
const { API_PROTOCOL, API_HOST, API_PORT, API_TIMEOUT, API_DEADLINE } = require('../../config')

const apiHost = API_PROTOCOL + '://' + API_HOST + ':' + API_PORT

const validateSlugIsEmpty = (req, res, next) => {
  const slug = get(req, [ 'params', 'slug' ], '')
  if (isEmpty(slug)) {
    res.status(404).render('404')
  } else {
    next()
  }
}

const fetchStory = (req, res, next) => {
  const slug = req.params.slug

  // const url = `${apiHost}/posts?where={"slug":{"$in":["20180124soc003"]}}&clean=content`
  const url = `${apiHost}/posts?where={"slug":{"$in":["${slug}"]}}&clean=content`
  // TODO: redis
  superagent
  .get(url)
  .timeout({
    response: API_TIMEOUT,  // Wait 5 seconds for the server to start sending,
    deadline: API_DEADLINE ? API_DEADLINE : 60000, // but allow 1 minute for the file to finish loading.
  })
  .end((error, response) => {
    if (!error && response) {
      let res_data
      try {
        res_data = JSON.parse(response.text)
      } catch (e) {
        res.send(e)
        console.error(`>>> Got bad data from api.`)
        console.error(`>>> ${req.url}`)
        console.error(e) 
        return 
      }
      const res_num = get(res_data, [ '_meta', 'total' ])
      // if (res_num && res_num > 0) {
      //   res.dataString = response.text
      //   next()
      // }
      // res.send(res_data)
      req.resData = res_data
      next()
    } else {
      const status = get(response, 'status') || get(error, 'status') || 500
      res.header('Cache-Control', 'no-cache')
      res.status(status).send(error)
      if (status !== 404) {
        console.error(`>>> Error occurred during fetching data from api.`)
        console.error(`>>> ${url}`)
        console.error(error)  
      } else {
        console.error(`Not Found: ${url}`)
      }
    }
  })

}

const getArticleData = (req, res, next) => {
  const data = req.resData
  const articleData = get(data, [ '_items', 0 ], {})
  req.articleData = articleData
  next()
}

const sendArticleData = (req, res, next) => {
  const articleData = {
    storyInfo: {
      sectionName: get(req.articleData, [ 'categories', 0, 'title' ], get(req.articleData, [ 'sections', 0, 'title' ], '')),
      sectionColorModifier: getSectionColorModifier(get(req.articleData, [ 'sections', 0, '_id' ])),
      storyDate: getDate(get(req.articleData, [ 'publishedDate' ], '')),
      storyTitle: get(req.articleData, [ 'title' ], ''),
      storyCredits: getCredit(req.articleData)
    },
    storyHeroVideo: {
      src: get(req.articleData, [ 'heroVideo', 'video', 'url' ], '')
    },
    storyHeroImage: {
      src: getStoryHeroImageSrc(req.articleData.heroImage),
      caption: get(req.articleData, [ 'heroCaption' ], '')
    }
  }
  res.status(200).render('amp/index.amp.ejs', articleData)
}

module.exports = {
  validateSlugIsEmpty,
  fetchStory,
  getArticleData,
  sendArticleData
}