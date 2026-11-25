import fs from 'node:fs'
import cors from 'cors'
import express from 'express'
import { config } from './config'
import { HttpError } from './lib/http-error'
import { authRouter } from './modules/auth/auth.routes'
import { adminCarouselRouter, publicCarouselRouter } from './modules/carousel/carousel.routes'
import { adminFileRouter } from './modules/files/file.routes'
import { adminNewsRouter, publicNewsRouter } from './modules/news/news.routes'
import { adminStatsRouter } from './modules/stats.routes'

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

fs.mkdirSync(config.uploadDir, { recursive: true })
app.use('/uploads', express.static(config.uploadDir, { maxAge: '1h' }))

app.get('/api/health', (_req, res) => {
  res.json({ code: 0, message: 'ok', data: { time: new Date().toISOString() } })
})

app.use('/api/admin/auth', authRouter)
app.use('/api/admin/news', adminNewsRouter)
app.use('/api/admin/carousel', adminCarouselRouter)
app.use('/api/admin/files', adminFileRouter)
app.use('/api/admin/stats', adminStatsRouter)

app.use('/api/public/news', publicNewsRouter)
app.use('/api/public/carousel', publicCarouselRouter)

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' })
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = error instanceof HttpError ? error.status : 500
  const message = error instanceof Error ? error.message : '服务器内部错误'

  if (status === 500) {
    console.error(error)
  }

  res.status(status).json({ code: status, message })
})

app.listen(config.port, () => {
  console.log(`胜泰石油后台接口已启动：http://localhost:${config.port}`)
})
