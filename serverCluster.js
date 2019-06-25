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

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) { 
    cluster.fork()
  }
  metricsServer.get('/metrics', (req, res) => {
		aggregatorRegistry.clusterMetrics((err, metrics) => {
			if (err) console.error('metricsServer error', err);
			res.set('Content-Type', aggregatorRegistry.contentType);
			res.send(metrics)
		})
  })
  metricsServer.listen(3001)
} else {
  require('./server.js')
}

cluster.on('disconnect', function(worker) { 
  console.log('a process disconnect!') // This can probably use some work. cluster.fork();
  cluster.fork()
});
