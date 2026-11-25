import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { requireAuth } from '../../lib/auth'
import { HttpError } from '../../lib/http-error'
import { prisma } from '../../lib/prisma'
import {
  countFeaturedNews,
  createNews,
  deleteNews,
  getAdminNewsById,
  getFeaturedNews,
  getNewsBySlug,
  getRelatedNews,
  listNews,
  listSitemapNews,
  setNewsFeatured,
  updateNews,
  type NewsInput
} from './news.service'

const str = (value: unknown) => (typeof value === 'string' ? value : '')
const positiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

export const publicNewsRouter = Router()

publicNewsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await listNews({
      category: str(req.query.category) || undefined,
      page: positiveInt(req.query.page, 1),
      pageSize: Math.min(positiveInt(req.query.pageSize, 10), 50),
      status: 'published'
    })
    res.json({ code: 0, message: 'ok', data: result })
  })
)

publicNewsRouter.get(
  '/featured',
  asyncHandler(async (_req, res) => {
    const data = await getFeaturedNews()
    res.json({ code: 0, message: 'ok', data })
  })
)

publicNewsRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.newsArticle.findMany({
      where: { status: 'published' },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    })
    res.json({ code: 0, message: 'ok', data: rows.map((row) => row.category) })
  })
)

publicNewsRouter.get(
  '/sitemap',
  asyncHandler(async (_req, res) => {
    const data = await listSitemapNews()
    res.json({ code: 0, message: 'ok', data })
  })
)

publicNewsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const article = await getNewsBySlug(req.params.slug)
    if (!article) {
      throw new HttpError(404, '新闻不存在')
    }
    const related = await getRelatedNews(article.slug, article.category)
    res.json({ code: 0, message: 'ok', data: { article, related } })
  })
)

export const adminNewsRouter = Router()

adminNewsRouter.use(requireAuth)

adminNewsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await listNews({
      category: str(req.query.category) || undefined,
      status: str(req.query.status) || undefined,
      keyword: str(req.query.keyword) || undefined,
      page: positiveInt(req.query.page, 1),
      pageSize: Math.min(positiveInt(req.query.pageSize, 10), 100)
    })
    res.json({ code: 0, message: 'ok', data: result })
  })
)

adminNewsRouter.get(
  '/featured-count',
  asyncHandler(async (_req, res) => {
    const data = await countFeaturedNews()
    res.json({ code: 0, message: 'ok', data: { count: data } })
  })
)

adminNewsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await getAdminNewsById(Number(req.params.id))
    if (!data) {
      throw new HttpError(404, '新闻不存在')
    }
    res.json({ code: 0, message: 'ok', data })
  })
)

adminNewsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = await createNews(req.body as NewsInput)
    res.json({ code: 0, message: '创建成功', data })
  })
)

adminNewsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await updateNews(Number(req.params.id), req.body as NewsInput)
    res.json({ code: 0, message: '保存成功', data })
  })
)

adminNewsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteNews(Number(req.params.id))
    res.json({ code: 0, message: '删除成功', data: null })
  })
)

adminNewsRouter.patch(
  '/:id/featured',
  asyncHandler(async (req, res) => {
    const { isFeatured, featuredOrder } = (req.body ?? {}) as { isFeatured?: boolean; featuredOrder?: number }
    const data = await setNewsFeatured(Number(req.params.id), Boolean(isFeatured), Number(featuredOrder) || 0)
    res.json({ code: 0, message: '已更新首页展示设置', data })
  })
)
