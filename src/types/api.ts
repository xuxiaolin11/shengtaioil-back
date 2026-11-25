export type NewsItem = {
  id: number
  slug: string
  title: string
  date: string
  category: string
  summary: string
  keywords: string[]
  paragraphs: string[]
  images: { path: string; alt: string }[]
  status: 'draft' | 'published'
  isFeatured: boolean
  featuredOrder: number
  createdAt: string
  updatedAt: string
}

export type CarouselItem = {
  id: number
  date: string
  title: string
  imageUrl: string
  linkUrl: string | null
  sortOrder: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type FileItem = {
  id: number
  originalName: string
  url: string
  mimeType: string
  size: number
  category: 'image' | 'document'
  parsedText: string | null
  createdAt: string
}

export type PageResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}
