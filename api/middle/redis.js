const redis = require('redis')
const { promisify } = require('util')

const { 
  REDIS_AUTH,
  REDIS_CONNECTION_TIMEOUT,
  REDIS_READ_HOST,
  REDIS_READ_PORT,
  REDIS_TIMEOUT,
  REDIS_WRITE_HOST,
  REDIS_WRITE_PORT,
} = require('../config')

const retryStrategy = (options) => {
  if (options.error && options.error.code === 'ECONNREFUSED') {
    // End reconnecting on a specific error and flush all commands with
    // a individual error
    return new Error('The server refused the connection')
  }
  if (options.error && options.error.code === 'ETIMEDOUT') {
    return new Error('Timeout occured while connecting to redis.')      
  }
  if (options.total_retry_time > 1000 * 5) {
    // End reconnecting after a specific timeout and flush all commands
    // with a individual error
    return new Error('Retry time exhausted')
  }
  if (options.attempt > 0 || options.times_connected > 0) {
    // End reconnecting with built in error
    return undefined
  }
  // reconnect after
  return 100
}

const readClient = redis.createClient(REDIS_READ_PORT, REDIS_READ_HOST, {
  password: REDIS_AUTH,
  retry_strategy: retryStrategy
})

const writeClient = redis.createClient(REDIS_WRITE_PORT, REDIS_WRITE_HOST, {
  password: REDIS_AUTH,
  retry_strategy: retryStrategy
})

readClient.on('error', (err) => {
  console.error(`[Redis] Some error occurred in read client.`, err)
})

writeClient.on('error', (err) => {
  console.error(`[Redis] Some error occurred in write client.`, err)
})

const getAsync = promisify(readClient.get).bind(readClient)
const setAsync = promisify(writeClient.set).bind(writeClient)
const expireAsync = promisify(writeClient.expire).bind(writeClient)

const promiseTimeout = (promise) => {
  const time = REDIS_CONNECTION_TIMEOUT || 200
  let timeout = new Promise((resolve, reject) => {
    let timer = setTimeout(() => {
      clearTimeout(timer)
      reject('Timed out in '+ time + 'ms.')
    }, time)
  })
  return Promise.race([
    promise,
    timeout
  ])
}

const fetchFromRedis = (req, res, next) => {
  if (!req.redis) {
    next()
  } else {
    promiseTimeout(getAsync(`plate-vue-mobile-${req.redis}`))
      .then(response => {
        res.redis = response
        next()
      })
      .catch(err => {
        next()
        console.error('[Redis] Fetch data from Redis in fail.', req.redis, err)
      })
  }
}

const insertIntoRedis = (key, data, timeout) => {
  const redisTimeout = timeout || REDIS_TIMEOUT || 5000
  if (key) {
    setAsync(`plate-vue-mobile-${key}`, data)
      .then(() => expireAsync(`plate-vue-mobile-${key}`, redisTimeout))
      .catch(err => {
        console.error('[Redis] Write data to Redis in fail.', key, err)
      })
  }
}

module.exports = {
  fetchFromRedis,
  insertIntoRedis
}

