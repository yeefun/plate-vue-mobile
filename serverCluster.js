const cluster = require('cluster')
const numCPUs = require('os').cpus().length

const express = require('express')
const metricsServer = express()
const client = require('prom-client')
const AggregatorRegistry = client.AggregatorRegistry
const aggregatorRegistry = new AggregatorRegistry()

// Ask the number of CPU-s for optimal forking (one fork per CPU) var numCPUs = require('os').cpus().length;
// cluster.setupMaster({
//   exec : './server.js' // Points to the index file you want to fork
// });
// Fork workers.
// for (let i = 0; i < numCPUs; i++) { 
//   cluster.fork()
// }
// cluster.on('disconnect', function(worker) { 
//   console.log('a process disconnect!') // This can probably use some work. cluster.fork();
//   cluster.fork()
// });

if (cluster.isMaster) {
  console.log(`[Cluster] Master ${process.pid} is running. Fork ${numCPUs} workers.`)
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  metricsServer.get('/metrics', (req, res) => {
    aggregatorRegistry.clusterMetrics((err, metrics) => {
      if (err) console.error('[Cluster] Prometheus clusterMetrics', err)
      res.set('Content-Type', aggregatorRegistry.contentType)
      res.send(metrics)
    })
  })

  metricsServer.listen(3001)
  console.log('[Cluster] Cluster metrics server listening to 3001, metrics exposed on /metrics')

  cluster.on('online', (worker) => {
    console.log (`[Cluster] worker is running on ${worker.process.pid} pid`)
  })
  cluster.on('exit', (worker, code, signal) => {
    console.error(`[Cluster] worker with ${worker.process.pid} is closed`)
  })
} else {
  require('./server.js')
  console.log(`[Cluster] Worker ${process.pid} started`)
}
