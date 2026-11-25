<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FileText, Plus, Search, Star, Pencil, Trash2 } from 'lucide-vue-next'
import { del, get, patch } from '../api/request'
import type { NewsItem, PageResult } from '../types'
import NewsEditDialog from '../components/NewsEditDialog.vue'

const rows = ref<NewsItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const statusFilter = ref('')
const categories = ref<string[]>([])
const featuredCount = ref(0)
const dialogOpen = ref(false)
const editing = ref<NewsItem | null>(null)
const pendingParagraphs = ref<string[]>([])

const load = () => {
  get<PageResult<NewsItem>>('/admin/news', {
    page: page.value,
    pageSize: pageSize.value,
    keyword: keyword.value,
    status: statusFilter.value
  })
    .then((data) => {
      rows.value = data.items
      total.value = data.total
    })
    .catch(() => undefined)
}

const loadCategories = () => {
  get<string[]>('/public/news/categories')
    .then((data) => {
      categories.value = data
    })
    .catch(() => undefined)
}

const loadFeaturedCount = () => {
  get<{ count: number }>('/admin/news/featured-count')
    .then((data) => {
      featuredCount.value = data.count
    })
    .catch(() => undefined)
}

const openCreate = () => {
  editing.value = null
  pendingParagraphs.value = readPendingParagraphs()
  dialogOpen.value = true
}

const readPendingParagraphs = () => {
  const raw = sessionStorage.getItem('st_pending_paragraphs')
  if (!raw) return []
  sessionStorage.removeItem('st_pending_paragraphs')
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

const openEdit = (item: NewsItem) => {
  editing.value = item
  pendingParagraphs.value = []
  dialogOpen.value = true
}

const toggleFeatured = async (item: NewsItem) => {
  const willBeFeatured = !item.isFeatured
  if (willBeFeatured && featuredCount.value >= 3) {
    ElMessage.warning('最多只允许展示三个')
    return
  }

  const data = await patch<NewsItem>(`/admin/news/${item.id}/featured`, {
    isFeatured: willBeFeatured,
    featuredOrder: item.featuredOrder || item.id
  })
    .then((result) => result)
    .catch(() => null)
  if (data) {
    item.isFeatured = data.isFeatured
    featuredCount.value += data.isFeatured ? 1 : -1
    ElMessage.success(data.isFeatured ? '已设为首页展示' : '已取消首页展示')
  }
}

const remove = async (item: NewsItem) => {
  await ElMessageBox.confirm(`确认删除新闻「${item.title}」？删除后不可恢复。`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
  await del(`/admin/news/${item.id}`)
    .then(() => {
      ElMessage.success('删除成功')
      if (item.isFeatured) featuredCount.value = Math.max(0, featuredCount.value - 1)
      load()
    })
    .catch(() => undefined)
}

const onDialogSaved = () => {
  load()
  loadFeaturedCount()
}

onMounted(() => {
  load()
  loadCategories()
  loadFeaturedCount()
})
</script>

<template>
  <div class="space-y-5">
    <div class="page-card flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <h1 class="section-title">新闻管理</h1>
        <p class="mt-1 text-sm text-muted">维护新闻列表、详情内容以及首页右侧最新动态展示项。</p>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建新闻
      </el-button>
    </div>

    <div class="page-card p-5">
      <div class="flex flex-wrap items-center gap-3">
        <el-input v-model="keyword" placeholder="搜索新闻标题" clearable class="w-64" @keyup.enter="load">
          <template #prefix><Search :size="15" /></template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="全部状态" clearable class="w-36">
          <el-option label="已发布" value="published" />
          <el-option label="已下架" value="draft" />
        </el-select>
        <el-button @click="load">查询</el-button>
      </div>

      <el-table :data="rows" class="mt-5" v-loading="!rows.length" stripe>
        <el-table-column prop="title" label="新闻标题" min-width="260" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="date" label="发布日期" width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'danger'" size="small" effect="dark">
              {{ row.status === 'published' ? '已发布' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="首页展示" width="110">
          <template #default="{ row }">
            <button
              type="button"
              class="flex cursor-pointer items-center gap-1 text-sm"
              :class="row.isFeatured ? 'text-duty' : 'text-muted'"
              @click="toggleFeatured(row)"
            >
              <Star :size="16" :fill="row.isFeatured ? 'currentColor' : 'none'" />
              {{ row.isFeatured ? '已展示' : '未展示' }}
            </button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">
              <el-icon><Pencil /></el-icon> 编辑
            </el-button>
            <el-button link type="danger" @click="remove(row)">
              <el-icon><Trash2 /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-5 flex justify-end">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50]"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </div>

    <NewsEditDialog
      v-model="dialogOpen"
      :item="editing"
      :categories="categories"
      :pending-paragraphs="pendingParagraphs"
      :featured-count="featuredCount"
      @saved="onDialogSaved"
    />
  </div>
</template>
