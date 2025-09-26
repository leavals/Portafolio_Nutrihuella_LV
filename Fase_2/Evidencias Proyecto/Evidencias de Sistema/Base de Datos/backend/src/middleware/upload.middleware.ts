// backend/src/middleware/upload.middleware.ts
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import type { Request } from 'express'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (err: Error | null, dest: string) => void) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (err: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const name = `pet_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, name)
  }
})

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ok = /image\/(png|jpe?g|webp|gif)/i.test(file.mimetype)
  // Opción A: rechazar silenciosamente
  // cb(null, ok)
  // Opción B: rechazar con error (recomendado si quieres mensaje claro):
  if (ok) cb(null, true)
  else cb(new Error('Formato de imagen no permitido'))
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
})
