import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from './configs/env.js'
import { authRateLimiter } from './middelwares/rateLimiter.js'
import { errorHandler, notFoundHandler } from './middelwares/errorHandler.js'
import apiRoutes from './routes/index.js'

const app = express()

const allowedOrigins = new Set(env.CORS_ORIGINS)
const isLocalhostOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests without Origin and local frontend dev ports.
      if (!origin || allowedOrigins.has(origin) || isLocalhostOrigin(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' })
})

app.use('/api/v1/auth', authRateLimiter)
app.use('/api/v1', apiRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app