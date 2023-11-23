const express = require('express')
const compression = require('compression')
const helmet = require('helmet')
const session = require('express-session')
const cors = require('cors')
const expressWinston = require('express-winston')
const json2xls = require('json2xls')
const { keycloak } = require('./services/auth')
const mongoStore = require('./services/sessions')
const config = require('./config')
const log = require('./services/logger')
// const init = require('./scripts/init')
const migration = require('./scripts/migration')
const { NODE_ENV } = process.env
const loggerMiddleware = expressWinston.logger({ winstonInstance: log })

// Accept crazy weird CERTs
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

module.exports = (async () => {
  try {
    const server = express()
    // Apply middlewares
    server.use(helmet()) // Security
    server.use(cors()) // CORS
    server.use(compression()) // Compression
    server.use(express.json({limit: '50mb'})) // JSON parser
    server.use(express.urlencoded({ limit: '50mb', extended: false })) // URL parser
    server.use(loggerMiddleware) // Logger
    server.use(json2xls.middleware) // XLS parser
    server.use(session({ // Sessions
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      store: mongoStore
    }))
    // Initialize Keycloak
    server.use(keycloak.middleware())
    // Apply API routes
    server.use('/', require('./api'))
    // Run migrations
    await migration.init()
    // Start the server
    return server.listen(config.PORT, (err) => {
      if (err) {
        throw err
      }
      log.info('> Ready on http://localhost:' + config.PORT + ' [' + NODE_ENV + ']')
    })
  } catch (err) {
    log.error('An error occurred, unable to start the server')
    log.error(err)
  }
})()
