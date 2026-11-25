import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { requireAuth } from '../../lib/auth'
import { HttpError } from '../../lib/http-error'
import { prisma } from '../../lib/prisma'
import { toCarouselItem } from '../../lib/serialize'

export type CarouselInput = {
  date: string
  title: string
  imageUrl: string
  linkUrl?: string | null
  sortOrder?: number
  enabled?: boolean
}

const toData = (input: CarouselInput) => ({
  date: input.date.trim(),
  title: input.title.trim(),
  imageUrl: input.imageUrl.trim(),
  linkUrl: input.linkUrl?.trim() ? input.linkUrl.trim() : null,
  sortOrder: Number(input.sortOrder) || 0,
  enabled: input.enabled !== false
})

const validate = (input: CarouselInput) => {
  if (!input.title?.trim()) {
    throw new HttpError(400, '轮播标题不能为空')
  }
  if (!input.imageUrl?.trim()) {
    throw new HttpError(400, '请上传轮播图片')
  }
  if (!input.date?.trim()) {
    throw new HttpError(400, '展示日期不能为空')
  }
}

export const publicCarouselRouter = Router()

publicCarouselRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.carouselSlide.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    })
    res.json({ code: 0, message: 'ok', data: rows.map(toCarouselItem) })
  })
)

export const adminCarouselRouter = Router()

adminCarouselRouter.use(requireAuth)

adminCarouselRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.carouselSlide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    })
    res.json({ code: 0, message: 'ok', data: rows.map(toCarouselItem) })
  })
)

adminCarouselRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = req.body as CarouselInput
    validate(input)
    const row = await prisma.carouselSlide.create({ data: toData(input) })
    res.json({ code: 0, message: '创建成功', data: toCarouselItem(row) })
  })
)

adminCarouselRouter.put(
  '/reorder',
  asyncHandler(async (req, res) => {
    const { ids } = (req.body ?? {}) as { ids?: number[] }
    if (!Array.isArray(ids)) {
      throw new HttpError(400, '排序参数不正确')
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.carouselSlide.update({ where: { id: Number(id) }, data: { sortOrder: index } })
      )
    )

    const rows = await prisma.carouselSlide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    })
    res.json({ code: 0, message: '排序已保存', data: rows.map(toCarouselItem) })
  })
)

adminCarouselRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const existing = await prisma.carouselSlide.findUnique({ where: { id } })
    if (!existing) {
      throw new HttpError(404, '轮播不存在')
    }
    const input = req.body as CarouselInput
    validate(input)
    const row = await prisma.carouselSlide.update({ where: { id }, data: toData(input) })
    res.json({ code: 0, message: '保存成功', data: toCarouselItem(row) })
  })
)

adminCarouselRouter.patch(
  '/:id/enabled',
  asyncHandler(async (req, res) => {
    const { enabled } = (req.body ?? {}) as { enabled?: boolean }
    const row = await prisma.carouselSlide.update({
      where: { id: Number(req.params.id) },
      data: { enabled: Boolean(enabled) }
    })
    res.json({ code: 0, message: '状态已更新', data: toCarouselItem(row) })
  })
)

adminCarouselRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.carouselSlide.delete({ where: { id: Number(req.params.id) } })
    res.json({ code: 0, message: '删除成功', data: null })
  })
)
