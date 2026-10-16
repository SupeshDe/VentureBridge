import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
fs.mkdirSync(UPLOAD_ROOT, { recursive: true })

const ALLOWED = new Map([
  ['.pdf', 'pdf'],
  ['.doc', 'doc'],
  ['.docx', 'docx'],
  ['.ppt', 'ppt'],
  ['.pptx', 'pptx'],
  ['.png', 'png'],
  ['.jpg', 'jpg'],
  ['.jpeg', 'jpeg'],
])

export const MAX_FILE_MB = Number(process.env.UPLOAD_MAX_MB || 25)

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_ROOT)
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
  },
})

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED.has(ext)) {
    const err = new Error(`File type ${ext || 'unknown'} is not allowed. Use PDF, Word, PowerPoint, PNG or JPG.`)
    err.statusCode = 400
    return cb(err)
  }
  cb(null, true)
}

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 1 },
}).single('file')

export function typeOf(filename) {
  return ALLOWED.get(path.extname(filename).toLowerCase()) || 'other'
}

export { UPLOAD_ROOT }
