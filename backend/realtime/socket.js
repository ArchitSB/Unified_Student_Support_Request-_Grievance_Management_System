import { Server } from 'socket.io'

import { env } from '../configs/env.js'
import { verifyAccessToken } from '../utils/jwt.js'
import { registerIo } from '../services/realtime.service.js'

const allowedOrigins = new Set(env.CORS_ORIGINS)

export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          callback(null, true)
          return
        }

        callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
    },
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '')
      if (!token) {
        next(new Error('Unauthorized'))
        return
      }

      const decoded = verifyAccessToken(token)
      socket.data.userId = decoded.userId
      socket.join(`user:${decoded.userId}`)
      next()
    } catch (_error) {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('request:subscribe', (requestId) => {
      if (requestId) {
        socket.join(`request:${requestId}`)
      }
    })

    socket.on('request:unsubscribe', (requestId) => {
      if (requestId) {
        socket.leave(`request:${requestId}`)
      }
    })
  })

  registerIo(io)
  return io
}
