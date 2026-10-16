import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import authRoutes from './routes/authRoutes.js'
import matchingRoutes from './routes/matchingRoutes.js'
import startupRoutes from './routes/startupRoutes.js'
import investorRoutes from './routes/investorRoutes.js'
import requestRoutes from './routes/requestRoutes.js'
import connectionRoutes from './routes/connectionRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import favouriteRoutes from './routes/favouriteRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import industryRoutes from './routes/industryRoutes.js'
import interestRoutes from './routes/interestRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import meetingRoutes from './routes/meetingRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import { requestId } from './middleware/requestId.js'
import { mongoSanitize, hpp, noCache } from './middleware/security.js'
import logger from './utils/logger.js'

const app = express()

// Trust proxy for rate-limit + secure cookies behind nginx
app.set('trust proxy', 1)

app.use(requestId)
app.use(noCache)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s=>s.trim())
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    // allow all in dev for convenience
    if (process.env.NODE_ENV !== 'production') return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Request-Id'],
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(mongoSanitize)
app.use(hpp)

// Structured request logging
app.use(morgan('tiny', { stream: { write: msg => logger.http(msg.trim()) } }))

// Granular rate limiting
const generalLimiter = rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15*60*1000), limit: Number(process.env.RATE_LIMIT_MAX || 300), standardHeaders: true, legacyHeaders: false, message: { success:false, message:'Too many requests, please try again later' } })
const authLimiter = rateLimit({ windowMs: 15*60*1000, limit: 20, standardHeaders: true, legacyHeaders:false, message: { success:false, message:'Too many auth attempts, try again in 15 minutes' } })
app.use('/api', generalLimiter)
app.use('/api/auth', authLimiter)

// Health + readiness
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'VentureBridge API is healthy', timestamp: new Date().toISOString(), uptime: process.uptime() }))
app.get('/api/ready', async (_req, res) => {
  const mongoose = await import('mongoose')
  const dbState = mongoose.default.connection.readyState === 1 ? 'connected' : 'disconnected'
  res.json({ success: true, db: dbState })
})
// API docs placeholder
app.get('/api', (_req,res)=> res.json({ success:true, message:'VentureBridge API v1', docs:'/api/health', version:'1.0.0' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/startups', startupRoutes)
app.use('/api/investors', investorRoutes)
app.use('/api/matching', matchingRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/connections', connectionRoutes)
app.use('/api/chat', chatRoutes)
  app.use('/api/favourites', favouriteRoutes)
  app.use('/api/notifications', notificationRoutes)
  app.use('/api/documents', documentRoutes)
  app.use('/api/industries', industryRoutes)
  app.use('/api/interests', interestRoutes)
  app.use('/api/reports', reportRoutes)
  app.use('/api/meetings', meetingRoutes)
  app.use('/api/reviews', reviewRoutes)
  app.use('/api/ai', aiRoutes)
  app.use('/api/admin', adminRoutes)

// Error handling
app.use(notFound)
app.use(errorHandler)
export default app
