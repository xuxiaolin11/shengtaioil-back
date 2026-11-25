<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Images, FolderOpen, FileClock, ArrowRight } from 'lucide-vue-next'
import { get } from '../api/request'

const router = useRouter()
const stats = ref({ news: 0, carousel: 0, files: 0, drafts: 0 })

const cards = [
  { key: 'news', label: '已发布新闻', icon: FileText, tone: 'bg-navy-800' },
  { key: 'drafts', label: '已下架新闻', icon: FileClock, tone: 'bg-duty' },
  { key: 'carousel', label: '首页轮播', icon: Images, tone: 'bg-steel' },
  { key: 'files', label: '归档文档', icon: FolderOpen, tone: 'bg-muted' }
] as const

const shortcuts = [
  { title: '发布新闻', desc: '新建新闻并支持设为首页展示', name: 'news' },
  { title: '维护轮播', desc: '调整首页轮播图片与展示顺序', name: 'carousel' },
  { title: '文档解析', desc: '上传 PDF / Word 自动提取正文', name: 'files' }
]

onMounted(() => {
  get<typeof stats.value>('/admin/stats')
    .then((data) => {
      stats.value = data
    })
    .catch(() => undefined)
})
</script>

<template>
  <div class="space-y-6">
    <div class="page-card relative overflow-hidden bg-gradient-to-r from-navy-900 to-navy-700 p-7 text-white">
      <div class="relative z-10">
        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-honor">Content Console</div>
        <h1 class="mt-3 font-serif text-2xl font-semibold">官网内容维护工作台</h1>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
          集中管理新闻动态、首页轮播与文档资料。内容保存后，官网首页与新闻页面将自动同步更新，无需手动修改代码。
        </p>
      </div>
      <div class="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10"></div>
      <div class="pointer-events-none absolute -bottom-24 right-24 h-64 w-64 rounded-full border border-white/10"></div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in cards" :key="card.key" class="page-card flex items-center gap-4 p-5">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg text-white" :class="card.tone">
          <component :is="card.icon" :size="22" />
        </div>
        <div>
          <div class="text-2xl font-semibold text-ink">{{ stats[card.key] }}</div>
          <div class="text-sm text-muted">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <div class="page-card p-6">
      <h2 class="section-title">快捷操作</h2>
      <p class="mt-1 text-sm text-muted">常用内容维护入口</p>
      <div class="mt-5 grid gap-4 md:grid-cols-3">
        <button
          v-for="item in shortcuts"
          :key="item.name"
          type="button"
          class="group flex cursor-pointer items-center justify-between rounded-lg border border-navy-900/10 bg-surface p-5 text-left transition-all hover:border-navy-800/30 hover:shadow-md"
          @click="router.push({ name: item.name })"
        >
          <div>
            <div class="font-semibold text-ink">{{ item.title }}</div>
            <div class="mt-1 text-sm text-muted">{{ item.desc }}</div>
          </div>
          <ArrowRight :size="18" class="text-muted transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  </div>
</template>
