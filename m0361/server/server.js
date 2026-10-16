import 'dotenv/config'
import { createServer } from 'http'
import app from './src/app.js'
import connectDB from './src/config/db.js'
import { initializeSocket } from './src/socket/socketHandler.js'
import logger from './src/utils/logger.js'
import { env } from './src/config/env.js'

const port = env.port

try {
  await connectDB()
} catch (error) {
  logger.warn('MongoDB connection failed - running without DB', { error: error.message })
}

const httpServer = createServer(app)
initializeSocket(httpServer)

const server = httpServer.listen(port, () => {
  logger.info(`VentureBridge API listening`, { port, env: env.nodeEnv, clientUrl: env.clientUrl })
  if (!env.mailPublicUrl && /localhost|127\.0\.0\.1/.test(env.clientUrl)) {
    logger.info(
      'Email links point at localhost and will not open on other devices.',
      env.lanIp
        ? { hint: `Set CLIENT_URL_PUBLIC=http://${env.lanIp}:${5173} to reach phones on your Wi-Fi` }
        : { hint: 'Set CLIENT_URL_PUBLIC to your network URL (run ipconfig to find it)' }
    )
  }
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('127.0.0.1:27017')) {
    logger.info('To set up MongoDB: see mongodb-atlas-setup.md or setup-mongodb-windows.md')
  }
})

// Graceful shutdown — enterprise requirement
function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`)
  server.close(() => {
    logger.info('HTTP server closed')
    import('mongoose').then(({ default: mongoose }) => mongoose.connection.close().finally(() => process.exit(0)))
  })
  setTimeout(() => {
    logger.warn('Force shutdown after 10s')
    process.exit(1)
  }, 10000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', err => { logger.error('Unhandled rejection', { error: err.message }) })
process.on('uncaughtException', err => { logger.error('Uncaught exception', { error: err.message, stack: err.stack }); process.exit(1) })

