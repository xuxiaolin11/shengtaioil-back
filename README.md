# 胜泰石油官网后台管理系统

为官网新闻内容提供集中管理：账号登录、新闻发布、首页轮播维护、首页最新动态设置，以及 PDF / Word 文档上传解析后自动填入新闻正文。

## 技术栈

- 后端：Node.js 22 + TypeScript + Express + Prisma + SQLite
- 管理后台：Vue 3 + Vite 5 + Element Plus + Tailwind CSS
- 文档解析：pdf-parse（PDF）、mammoth（DOCX）
- 鉴权：bcryptjs + JWT

## 目录结构

```
shengtai-oil-back/
├── prisma/              数据库模型与迁移、种子脚本
├── src/                 后端接口服务
├── admin/               管理后台前端
├── uploads/             上传文件存储目录（需持久化备份）
└── .env                 本地环境变量
```

## 首次启动

### 1. 后端接口服务

```bash
cd shengtai-oil-back
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

服务默认运行于 `http://localhost:3001`。

默认管理员账号：`admin` / `admin123456`（来自 `.env`，部署前务必修改）。

### 2. 管理后台

```bash
cd shengtai-oil-back/admin
npm install
npm run dev
```

后台访问 `http://localhost:5173`，已配置 `/api` 代理到 3001 端口。

### 3. 官网

```bash
cd shengtai-oil-website
npm install
NUXT_PUBLIC_API_BASE=http://localhost:3001 npm run dev
```

官网访问 `http://localhost:3000`。

## 环境变量说明

后端 `.env`：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| PORT | 接口服务端口 | 3001 |
| DATABASE_URL | SQLite 数据库文件位置 | file:./dev.db |
| JWT_SECRET | JWT 签名密钥，部署时必须修改 | 本地开发值 |
| ADMIN_USERNAME | 初始管理员账号 | admin |
| ADMIN_PASSWORD | 初始管理员密码 | admin123456 |
| UPLOAD_DIR | 上传文件存储目录 | uploads |
| PUBLIC_BASE_URL | 对外访问基础地址 | http://localhost:3001 |

官网环境变量：

| 变量 | 说明 |
| --- | --- |
| NUXT_PUBLIC_API_BASE | 后端接口服务对外地址，例如 `https://api.example.com` |

## 核心功能

- 账号密码登录，JWT 鉴权，未登录无法访问管理接口。
- 新闻新建、编辑、删除、草稿/发布；关键词、正文段落、配图维护。
- 设置新闻为首页右侧「最新动态」展示项并调整顺序。
- 首页轮播图新增、编辑、排序、上下线。
- 上传 PDF / DOCX 自动提取文字并分段，一键填入新闻正文；原文件归档可下载。

## 接口一览

| 接口 | 用途 |
| --- | --- |
| POST `/api/admin/auth/login` | 登录 |
| GET `/api/admin/auth/me` | 当前管理员 |
| GET/POST `/api/admin/news` | 新闻列表 / 新建 |
| PUT/DELETE `/api/admin/news/:id` | 编辑 / 删除新闻 |
| PATCH `/api/admin/news/:id/featured` | 设置首页展示 |
| GET/POST `/api/admin/carousel` | 轮播列表 / 新建 |
| PUT `/api/admin/carousel/reorder` | 轮播排序 |
| PUT/DELETE `/api/admin/carousel/:id` | 编辑 / 删除轮播 |
| POST `/api/admin/files/upload` | 上传并解析 PDF / Word / 图片 |
| GET/DELETE `/api/admin/files` | 归档文件列表 / 删除 |
| GET `/api/public/news` | 官网新闻列表 |
| GET `/api/public/news/featured` | 首页最新动态 |
| GET `/api/public/news/:slug` | 新闻详情与相关文章 |
| GET `/api/public/carousel` | 首页轮播 |
| GET `/api/public/news/sitemap` | 站点地图新闻条目 |

## 数据迁移说明

`npm run seed` 会从官网 `content/news.ts` 与首页原有轮播配置幂等导入全部新闻与轮播数据，重复执行不会重复写入。该脚本仅在初始化时需要，后续内容全部通过后台维护。

## 生产部署建议

1. 后端执行 `npm run build` 后用 `npm run start` 运行，`uploads/` 与 SQLite 数据库文件需纳入定期备份。
2. 管理后台执行 `npm run build`，将 `admin/dist` 交由 Nginx 或后端静态托管；若由后端托管需保证 `/api` 与 `/uploads` 路由正常转发。
3. 官网执行 `npm run build` 后用 `npm run start` 运行，并设置 `NUXT_PUBLIC_API_BASE` 为后端对外地址。
4. 上线前替换 `.env` 中的 JWT 密钥与管理员密码，配置 HTTPS 与访问控制。

## 已知边界

- 扫描版 PDF 无文本层，无法直接提取文字，界面会给出提示，请手动录入正文。
- 旧版 `.doc` 建议另存为 `.docx` 后上传，以获得完整解析效果。
