const client = require('prom-client')
// const register = client.register

// const Histogram = client.Histogram
const Counter = client.Counter

// const h = new Histogram({
// 	name: 'test_histogram',
// 	help: 'Example of a histogram',
// 	labelNames: [ 'code' ]
// })

const countRequest = new Counter({
  name: 'vue_mobile_http_request_total',
  help: 'HTTP request Total Count',
  labelNames: [ 'method', 'path', 'status' ]
})

const countRequestIncrement = (req, res, next) => {
  countRequest.inc({ method: req.method, path: req.url, status: res.statusCode })
  next && next()
}

module.exports = {
  countRequestIncrement
}