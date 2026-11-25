import { Router } from 'express'
import { asyncHandler } from '../lib/async-handler'
import { requireAuth } from '../lib/auth'
import { prisma } from '../lib/prisma'

export const adminStatsRouter = Router()

adminStatsRouter.use(requireAuth)

adminStatsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [news, carousel, files, drafts] = await Promise.all([
      prisma.newsArticle.count({ where: { status: 'published' } }),
      prisma.carouselSlide.count(),
      prisma.fileRecord.count(),
      prisma.newsArticle.count({ where: { status: 'draft' } })
    ])

    res.json({ code: 0, message: 'ok', data: { news, carousel, files, drafts } })
  })
)
