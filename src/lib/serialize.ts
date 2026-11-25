import type { CarouselSlide, FileRecord, NewsArticle } from '@prisma/client'
import type { CarouselItem, FileItem, NewsItem } from '../types/api'

const parseArray = <T>(value: string): T[] => {
  const parsed: unknown = JSON.parse(value)
  return Array.isArray(parsed) ? (parsed as T[]) : []
}

export const toNewsItem = (row: NewsArticle): NewsItem => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  date: row.date,
  category: row.category,
  summary: row.summary,
  keywords: parseArray<string>(row.keywords),
  paragraphs: parseArray<string>(row.paragraphs),
  images: parseArray<{ path: string; alt: string }>(row.images),
  status: row.status === 'draft' ? 'draft' : 'published',
  isFeatured: row.isFeatured,
  featuredOrder: row.featuredOrder,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
})

export const toCarouselItem = (row: CarouselSlide): CarouselItem => ({
  id: row.id,
  date: row.date,
  title: row.title,
  imageUrl: row.imageUrl,
  linkUrl: row.linkUrl,
  sortOrder: row.sortOrder,
  enabled: row.enabled,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
})

export const toFileItem = (row: FileRecord): FileItem => ({
  id: row.id,
  originalName: row.originalName,
  url: row.url,
  mimeType: row.mimeType,
  size: row.size,
  category: row.category === 'image' ? 'image' : 'document',
  parsedText: row.parsedText,
  createdAt: row.createdAt.toISOString()
})
