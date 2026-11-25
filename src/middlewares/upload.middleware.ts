import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { config } from '../config'
import { HttpError } from '../lib/http-error'

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DOCUMENT_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
]

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const folder = IMAGE_MIMES.includes(file.mimetype) ? 'images' : 'documents'
    const target = path.join(config.uploadDir, folder)
    fs.mkdirSync(target, { recursive: true })
    cb(null, target)
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    cb(null, `${unique}${extension}`)
  }
})

export const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadSizeBytes },
  fileFilter: (_req, file, cb) => {
    if ([...IMAGE_MIMES, ...DOCUMENT_MIMES].includes(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new HttpError(400, '仅支持 PDF、Word 或常见图片格式'))
  }
})

export const getFileCategory = (mimeType: string): 'image' | 'document' =>
  IMAGE_MIMES.includes(mimeType) ? 'image' : 'document'

export const decodeOriginalName = (name: string) => {
  try {
    return Buffer.from(name, 'latin1').toString('utf8')
  } catch {
    return name
  }
}
