import fs from 'node:fs'
import path from 'node:path'
import { HttpError } from '../../lib/http-error'
import { prisma } from '../../lib/prisma'
import { toFileItem } from '../../lib/serialize'
import type { FileItem } from '../../types/api'
import { getFileCategory } from '../../middlewares/upload.middleware'

export const saveFile = async (
  file: Express.Multer.File,
  originalName: string,
  parsedText: string | null
): Promise<FileItem> => {
  const category = getFileCategory(file.mimetype)
  const row = await prisma.fileRecord.create({
    data: {
      originalName,
      storedPath: file.path,
      url: `/uploads/${category === 'image' ? 'images' : 'documents'}/${path.basename(file.path)}`,
      mimeType: file.mimetype,
      size: file.size,
      category,
      parsedText
    }
  })
  return toFileItem(row)
}

export const listFiles = async (): Promise<FileItem[]> => {
  const rows = await prisma.fileRecord.findMany({ orderBy: { id: 'desc' } })
  return rows.map(toFileItem)
}

export const deleteFile = async (id: number): Promise<void> => {
  const row = await prisma.fileRecord.findUnique({ where: { id } })
  if (!row) {
    throw new HttpError(404, '文件不存在')
  }

  if (fs.existsSync(row.storedPath)) {
    fs.unlinkSync(row.storedPath)
  }

  await prisma.fileRecord.delete({ where: { id } })
}
