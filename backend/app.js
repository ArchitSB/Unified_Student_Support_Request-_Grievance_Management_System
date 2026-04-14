import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from './configs/env.js'
import { authRateLimiter } from './middelwares/rateLimiter.js'
import { errorHandler, notFoundHandler } from './middelwares/errorHandler.js'
import apiRoutes from './routes/index.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGINS,
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