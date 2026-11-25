<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-vue-next'
import { del, get, patch, post, put } from '../api/request'
import type { CarouselItem } from '../types'

const rows = ref<CarouselItem[]>([])
const dialogOpen = ref(false)
const editing = ref<CarouselItem | null>(null)
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('st_token') || ''}` }
const form = ref({ date: '', title: '', imageUrl: '', linkUrl: '', sortOrder: 0, enabled: true })

const load = () => {
  get<CarouselItem[]>('/admin/carousel')
    .then((data) => {
      rows.value = data
    })
    .catch(() => undefined)
}

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().slice(0, 10),
    title: '',
    imageUrl: '',
    linkUrl: '',
    sortOrder: rows.value.length,
    enabled: true
  }
}

const openCreate = () => {
  editing.value = null
  resetForm()
  dialogOpen.value = true
}

const openEdit = (item: CarouselItem) => {
  editing.value = item
  form.value = {
    date: item.date,
    title: item.title,
    imageUrl: item.imageUrl,
    linkUrl: item.linkUrl || '',
    sortOrder: item.sortOrder,
    enabled: item.enabled
  }
  dialogOpen.value = true
}

const onUploaded = (response: { data?: { file?: { url: string } } }) => {
  const url = response?.data?.file?.url
  if (url) {
    form.value.imageUrl = url
  }
}

const save = async () => {
  if (!form.value.title.trim() || !form.value.imageUrl) {
    ElMessage.warning('请填写标题并上传图片')
    return
  }
  const payload = { ...form.value }
  const action = editing.value ? put(`/admin/carousel/${editing.value.id}`, payload) : post('/admin/carousel', payload)
  await action
    .then(() => {
      ElMessage.success(editing.value ? '轮播已更新' : '轮播已创建')
      dialogOpen.value = false
      load()
    })
    .catch(() => undefined)
}

const toggleEnabled = async (item: CarouselItem) => {
  const data = await patch<CarouselItem>(`/admin/carousel/${item.id}/enabled`, { enabled: !item.enabled })
    .then((result) => result)
    .catch(() => null)
  if (data) {
    item.enabled = data.enabled
    ElMessage.success(data.enabled ? '轮播已上线' : '轮播已下线')
  }
}

const move = async (index: number, offset: number) => {
  const target = index + offset
  if (target < 0 || target >= rows.value.length) return
  const next = [...rows.value]
  const current = next[index]
  next[index] = next[target]
  next[target] = current
  rows.value = next
  const ids = next.map((item) => item.id)
  await put('/admin/carousel/reorder', { ids }).catch(() => undefined)
  ElMessage.success('顺序已保存')
}

const remove = async (item: CarouselItem) => {
  await ElMessageBox.confirm(`确认删除轮播「${item.title}」？`, '删除确认', { type: 'warning' })
  await del(`/admin/carousel/${item.id}`)
    .then(() => {
      ElMessage.success('删除成功')
      load()
    })
    .catch(() => undefined)
}

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <div class="page-card flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <h1 class="section-title">轮播管理</h1>
        <p class="mt-1 text-sm text-muted">维护首页主视觉轮播图，支持排序、上下线与图片替换。</p>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增轮播
      </el-button>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div v-for="(item, index) in rows" :key="item.id" class="page-card overflow-hidden">
        <img :src="item.imageUrl" :alt="item.title" class="h-44 w-full object-cover" />
        <div class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate font-semibold text-ink" :title="item.title">{{ item.title }}</div>
              <div class="mt-1 text-xs text-muted">{{ item.date }} · 排序 {{ item.sortOrder + 1 }}</div>
            </div>
            <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
              {{ item.enabled ? '已上线' : '已下线' }}
            </el-tag>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <el-button size="small" @click="openEdit(item)">编辑</el-button>
            <el-button size="small" @click="toggleEnabled(item)">{{ item.enabled ? '下线' : '上线' }}</el-button>
            <el-button size="small" :disabled="index === 0" @click="move(index, -1)">
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button size="small" :disabled="index === rows.length - 1" @click="move(index, 1)">
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-button size="small" type="danger" plain @click="remove(item)">
              <el-icon><Trash2 /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogOpen" :title="editing ? '编辑轮播' : '新增轮播'" width="min(640px, 94vw)">
      <div class="space-y-4">
        <div>
          <label class="mb-2 block text-sm font-medium text-ink">展示日期</label>
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" class="w-full" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-ink">轮播标题</label>
          <el-input v-model="form.title" placeholder="请输入轮播标题" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-ink">跳转链接（选填）</label>
          <el-input v-model="form.linkUrl" placeholder="例如 /news 或完整网址" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-ink">轮播图片</label>
          <el-upload
            action="/api/admin/files/upload"
            :headers="uploadHeaders"
            name="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            :on-success="onUploaded"
            :show-file-list="false"
          >
            <el-button type="primary" plain>上传图片</el-button>
          </el-upload>
          <img v-if="form.imageUrl" :src="form.imageUrl" class="mt-3 h-32 w-full rounded object-cover" />
        </div>
        <div class="flex items-center justify-between rounded-lg border border-navy-900/10 p-3">
          <span class="text-sm font-medium text-ink">立即上线</span>
          <el-switch v-model="form.enabled" />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
