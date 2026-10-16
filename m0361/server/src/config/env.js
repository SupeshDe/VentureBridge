import 'dotenv/config'
import os from 'os'

function required(name, fallback) {
  const v = process.env[name] ?? fallback
  if (v === undefined || v === '') throw new Error(`Missing required env: ${name}`)
  return v
}

function detectLanIp() {
  try {
    for (const nets of Object.values(os.networkInterfaces())) {
      for (const n of nets || []) {
        if (n.family === 'IPv4' && !n.internal) return n.address
      }
    }
  } catch {
    // non-critical — callers fall back to localhost
  }
  return null
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/venturebridge',
  jwtSecret: required('JWT_SECRET', 'dev-jwt-secret-change-in-production-min-32chars'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@venturebridge.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'VentureBridge2024!',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  mailFrom: process.env.MAIL_FROM || 'VentureBridge <no-reply@venturebridge.local>',
  // Public URL used inside emails (must be reachable from the reader's device).
  // Set CLIENT_URL_PUBLIC=http://<your-lan-ip>:5173 to reach phones on the same Wi-Fi.
  mailPublicUrl: process.env.CLIENT_URL_PUBLIC || '',
  lanIp: detectLanIp(),
  isProduction: process.env.NODE_ENV === 'production',
}

if (env.jwtSecret.length < 16 && env.isProduction) {
  throw new Error('JWT_SECRET must be at least 16 characters in production')
}
