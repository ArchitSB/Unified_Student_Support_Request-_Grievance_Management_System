import fs from 'fs'
import path from 'path'

import multer from 'multer'

import { ApiError } from '../utils/ApiError.js'

const uploadsDirectory = path.resolve(process.cwd(), 'uploads', 'request-attachments')
fs.mkdirSync(uploadsDirectory, { recursive: true })

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDirectory)
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')
    callback(null, `${Date.now()}-${safeName}`)
  },
})

const fileFilter = (_req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new ApiError(400, 'Unsupported attachment format'))
    return
  }

  callback(null, true)
}

export const uploadRequestAttachmentMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
})
