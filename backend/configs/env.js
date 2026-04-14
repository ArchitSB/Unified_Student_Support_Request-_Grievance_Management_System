import dotenv from 'dotenv'

dotenv.config()

const parseOrigins = (origins) =>
  origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGINS: parseOrigins(process.env.CORS_ORIGINS || 'http://localhost:5173'),
}

const requiredKeys = ['MONGODB_URI', 'JWT_SECRET']
const missingKeys = requiredKeys.filter((key) => !env[key])

if (missingKeys.length > 0) {
  throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`)
}