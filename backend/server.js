import app from './app.js'
import { connectDB } from './configs/db.js'
import { env } from './configs/env.js'

const startServer = async () => {
  try {
    await connectDB()

    app.listen(env.PORT, () => {
      console.log(`🚀 Backend server running on port ${env.PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
