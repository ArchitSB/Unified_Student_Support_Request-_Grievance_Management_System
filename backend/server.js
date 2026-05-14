import http from 'http'

import app from './app.js'
import { connectDB } from './configs/db.js'
import { env } from './configs/env.js'
import { createSocketServer } from './realtime/socket.js'

const startServer = async () => {
  try {
    await connectDB()

    const httpServer = http.createServer(app)
    createSocketServer(httpServer)

    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Backend server running on port ${env.PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
