import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { newsArticles } from '../../shengtai-oil-website/content/news'

const prisma = new PrismaClient()

const projectRoot = path.resolve(__dirname, '../..')
const websiteAssets = path.join(projectRoot, 'shengtai-oil-website/assets/images')
const seedUploads = path.join(projectRoot, 'shengtai-oil-back/uploads/seed')

const copySeedImage = (assetRelativePath: string, targetName: string) => {
  const source = path.join(websiteAssets, assetRelativePath)
  const target = path.join(seedUploads, targetName)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  if (fs.existsSync(source) && !fs.existsSync(target)) {
    fs.copyFileSync(source, target)
  }
  return `/uploads/seed/${targetName}`
}

const carouselSeed = [
  {
    date: '2026-04-27',
    title: '公司持续强化石油工程主业能力建设，重点井场项目组织运行平稳有序',
    image: 'culture/culture_1.jpg'
  },
  {
    date: '2026-04-18',
    title: '坚持安全生产与规范管理并重，推进现场管理标准化、精细化、数字化',
    image: 'culture/culture_2.jpg'
  },
  {
    date: '2026-04-08',
    title: '深耕油气工程服务主业，稳步拓展地热井施工与新能源相关业务领域',
    image: 'culture/culture_3.jpg'
  },
  {
    date: '2026-03-26',
    title: '持续强化技术队伍建设与现场执行能力，夯实复杂工况施工组织基础',
    image: 'culture/culture_4.jpg'
  },
  {
    date: '2026-03-09',
    title: '坚持标准化作业与精细化管控并行，稳步提升钻井施工品质与安全水平',
    image: 'culture/culture_5.jpg'
  },
  {
    date: '2026-02-22',
    title: '聚焦一线实战与人才培养并重，推动项目执行、技术提升与团队成长协同发力',
    image: 'culture/culture_6.jpg'
  }
]

const seed = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123456'

  const existingAdmin = await prisma.admin.findUnique({ where: { username } })
  if (!existingAdmin) {
    await prisma.admin.create({
      data: { username, passwordHash: bcrypt.hashSync(password, 10) }
    })
  }

  for (const [index, article] of newsArticles.entries()) {
    const images = (article.images ?? []).map((image) => {
      const assetRelativePath = image.path.replace(/^images\//, '')
      const targetName = path.basename(assetRelativePath)
      return { path: copySeedImage(assetRelativePath, targetName), alt: image.alt }
    })
    const data = {
      slug: article.slug,
      title: article.title,
      date: article.date,
      category: article.category,
      summary: article.summary,
      keywords: JSON.stringify(article.keywords),
      paragraphs: JSON.stringify(article.paragraphs),
      images: JSON.stringify(images),
      status: 'published',
      isFeatured: index < 3,
      featuredOrder: index < 3 ? index : 0
    }

    await prisma.newsArticle.upsert({
      where: { slug: article.slug },
      create: data,
      update: data
    })
  }

  const carouselCount = await prisma.carouselSlide.count()
  if (carouselCount === 0) {
    for (const [index, slide] of carouselSeed.entries()) {
      const imageUrl = copySeedImage(slide.image, path.basename(slide.image))
      await prisma.carouselSlide.create({
        data: {
          date: slide.date,
          title: slide.title,
          imageUrl,
          sortOrder: index,
          enabled: true
        }
      })
    }
  }

  console.log('种子数据初始化完成：管理员、新闻、轮播图')
}

seed()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
