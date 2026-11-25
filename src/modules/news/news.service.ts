import { HttpError } from '../../lib/http-error'
import { prisma } from '../../lib/prisma'
import { toNewsItem } from '../../lib/serialize'
import type { NewsItem, PageResult } from '../../types/api'

export const MAX_FEATURED_NEWS = 3
export const FEATURED_LIMIT_MESSAGE = '最多只允许展示三个'

export type NewsInput = {
  slug?: string
  title: string
  date: string
  category: string
  summary: string
  keywords?: string[]
  paragraphs?: string[]
  images?: { path: string; alt: string }[]
  status?: string
  isFeatured?: boolean
  featuredOrder?: number
}

const toRowData = (input: NewsInput) => ({
  title: input.title.trim(),
  date: input.date.trim(),
  category: input.category.trim(),
  summary: input.summary.trim(),
  keywords: JSON.stringify(input.keywords ?? []),
  paragraphs: JSON.stringify(input.paragraphs ?? []),
  images: JSON.stringify(input.images ?? []),
  status: input.status === 'draft' ? 'draft' : 'published',
  isFeatured: Boolean(input.isFeatured),
  featuredOrder: Number(input.featuredOrder) || 0
})

const ensureUniqueSlug = async (candidate: string, excludeId?: number) => {
  const base = candidate.trim() || `news-${Date.now().toString(36)}`
  let slug = base
  let suffix = 1

  while (true) {
    const existing = await prisma.newsArticle.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) {
      return slug
    }
    suffix += 1
    slug = `${base}-${suffix}`
  }
}

const validate = (input: NewsInput) => {
  if (!input.title?.trim()) {
    throw new HttpError(400, '标题不能为空')
  }
  if (!input.date?.trim()) {
    throw new HttpError(400, '发布日期不能为空')
  }
  if (!input.category?.trim()) {
    throw new HttpError(400, '分类不能为空')
  }
  if (!input.summary?.trim()) {
    throw new HttpError(400, '摘要不能为空')
  }
}

export const listNews = async (options: {
  category?: string
  status?: string
  featured?: boolean
  keyword?: string
  page: number
  pageSize: number
}): Promise<PageResult<NewsItem>> => {
  const where = {
    ...(options.category ? { category: options.category } : {}),
    ...(options.status ? { status: options.status } : {}),
    ...(options.featured ? { isFeatured: true } : {}),
    ...(options.keyword
      ? { title: { contains: options.keyword } }
      : {})
  }

  const [rows, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize
    }),
    prisma.newsArticle.count({ where })
  ])

  return {
    items: rows.map(toNewsItem),
    total,
    page: options.page,
    pageSize: options.pageSize
  }
}

export const countFeaturedNews = async (): Promise<number> =>
  prisma.newsArticle.count({ where: { isFeatured: true } })

const assertFeaturedCapacity = async (willBeFeatured: boolean, isAlreadyFeatured = false) => {
  if (!willBeFeatured || isAlreadyFeatured) return
  if ((await countFeaturedNews()) >= MAX_FEATURED_NEWS) {
    throw new HttpError(400, FEATURED_LIMIT_MESSAGE)
  }
}

export const getFeaturedNews = async (): Promise<NewsItem[]> => {
  const rows = await prisma.newsArticle.findMany({
    where: { status: 'published', isFeatured: true },
    orderBy: [{ featuredOrder: 'asc' }, { date: 'desc' }],
    take: MAX_FEATURED_NEWS
  })
  return rows.map(toNewsItem)
}

export const getNewsBySlug = async (slug: string): Promise<NewsItem | null> => {
  const row = await prisma.newsArticle.findFirst({
    where: { slug, status: 'published' }
  })
  return row ? toNewsItem(row) : null
}

export const getAdminNewsById = async (id: number): Promise<NewsItem | null> => {
  const row = await prisma.newsArticle.findUnique({ where: { id } })
  return row ? toNewsItem(row) : null
}

export const getRelatedNews = async (excludeSlug: string, category: string): Promise<NewsItem[]> => {
  const rows = await prisma.newsArticle.findMany({
    where: { status: 'published', slug: { not: excludeSlug } },
    orderBy: [{ date: 'desc' }],
    take: 4
  })
  const sorted = [...rows].sort((a, b) => Number(b.category === category) - Number(a.category === category))
  return sorted.map(toNewsItem)
}

export const createNews = async (input: NewsInput): Promise<NewsItem> => {
  validate(input)
  await assertFeaturedCapacity(Boolean(input.isFeatured))
  const slug = await ensureUniqueSlug(input.slug || '')
  const row = await prisma.newsArticle.create({
    data: { slug, ...toRowData(input) }
  })
  return toNewsItem(row)
}

export const updateNews = async (id: number, input: NewsInput): Promise<NewsItem> => {
  validate(input)
  const existing = await prisma.newsArticle.findUnique({ where: { id } })
  if (!existing) {
    throw new HttpError(404, '新闻不存在')
  }

  await assertFeaturedCapacity(Boolean(input.isFeatured), existing.isFeatured)
  const slug = await ensureUniqueSlug(input.slug || existing.slug, id)
  const row = await prisma.newsArticle.update({
    where: { id },
    data: { slug, ...toRowData(input) }
  })
  return toNewsItem(row)
}

export const deleteNews = async (id: number): Promise<void> => {
  const existing = await prisma.newsArticle.findUnique({ where: { id } })
  if (!existing) {
    throw new HttpError(404, '新闻不存在')
  }
  await prisma.newsArticle.delete({ where: { id } })
}

export const setNewsFeatured = async (id: number, isFeatured: boolean, featuredOrder: number): Promise<NewsItem> => {
  const existing = await prisma.newsArticle.findUnique({ where: { id } })
  if (!existing) {
    throw new HttpError(404, '新闻不存在')
  }

  await assertFeaturedCapacity(isFeatured, existing.isFeatured)
  const row = await prisma.newsArticle.update({
    where: { id },
    data: { isFeatured, featuredOrder }
  })
  return toNewsItem(row)
}

export const listSitemapNews = async (): Promise<{ slug: string; date: string }[]> => {
  const rows = await prisma.newsArticle.findMany({
    where: { status: 'published' },
    select: { slug: true, date: true },
    orderBy: { date: 'desc' }
  })
  return rows
}
