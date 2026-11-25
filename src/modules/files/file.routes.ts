import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { requireAuth } from '../../lib/auth'
import { HttpError } from '../../lib/http-error'
import { decodeOriginalName, getFileCategory, upload } from '../../middlewares/upload.middleware'
import { deleteFile, listFiles, saveFile } from './file.service'
import { parseDocument, type ParsedDocument } from './parser'

export const adminFileRouter = Router()

adminFileRouter.use(requireAuth)

adminFileRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const data = await listFiles()
    res.json({ code: 0, message: 'ok', data })
  })
)

adminFileRouter.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file
    if (!file) {
      throw new HttpError(400, '请选择要上传的文件')
    }

    const originalName = decodeOriginalName(file.originalname)
    const isDocument = getFileCategory(file.mimetype) === 'document'
    let parsed: ParsedDocument | null = null

    if (isDocument) {
      parsed = await parseDocument(file.path, file.mimetype)
    }

    const saved = await saveFile(file, originalName, parsed?.text ?? null)

    res.json({
      code: 0,
      message: parsed?.warning ? '上传成功，但解析存在提示' : '上传成功',
      data: { file: saved, parsed }
    })
  })
)

adminFileRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteFile(Number(req.params.id))
    res.json({ code: 0, message: '删除成功', data: null })
  })
)
