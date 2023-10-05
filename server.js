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
const init = require('./scripts/init')
const { NODE_ENV } = process.env
const loggerMiddleware = expressWinston.logger({ winstonInstance: log })

// Accept crazy weird CERTs
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

module.exports = (async () => {
  try {
    const server = express()
    // Apply middlewares
    server.use(helmet())
    server.use(cors())
    server.use(compression())
    server.use(express.json({limit: '50mb'}))
    server.use(express.urlencoded({ limit: '50mb', extended: false }))
    server.use(loggerMiddleware)
    server.use(json2xls.middleware)
    server.use(session({
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      store: mongoStore
    }))
    server.use(keycloak.middleware())
    // Apply API routes
    server.use('/', require('./api'))
    await init.checkInit()
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
