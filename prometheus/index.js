const client = require('prom-client')

const Counter = client.Counter

const countRequest = new Counter({
  name: 'vue_mobile_http_request_total',
  help: 'HTTP request Total Count',
  labelNames: [ 'method', 'path', 'status' ]
})

const countRequestIncrement = (req, res) => {
  countRequest.inc({ method: req.method, path: req.url, status: res.statusCode })
}

const monitorAfterRequest = (req, res, next) => {
  countRequestIncrement(req, res)
  next && next()
}

module.exports = {
  monitorAfterRequest
} 