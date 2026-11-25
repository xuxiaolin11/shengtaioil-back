<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FileText, Download, Trash2, PenLine } from 'lucide-vue-next'
import { UploadFilled } from '@element-plus/icons-vue'
import { apiBase, del, get } from '../api/request'
import type { FileItem } from '../types'

type ParseResult = {
  text: string
  paragraphs: string[]
  warning?: string
}

type UploadResult = {
  file: FileItem
  parsed: ParseResult | null
}

const router = useRouter()
const rows = ref<FileItem[]>([])
const parsing = ref(false)
const current = ref<UploadResult | null>(null)
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('st_token') || ''}` }

const load = () => {
  get<FileItem[]>('/admin/files')
    .then((data) => {
      rows.value = data
    })
    .catch(() => undefined)
}

const onUploaded = (response: { data?: UploadResult }) => {
  parsing.value = false
  if (!response?.data) {
    ElMessage.error('上传结果异常')
    return
  }
  current.value = response.data
  const warning = response.data.parsed?.warning
  if (warning) {
    ElMessage.warning(warning)
  } else {
    ElMessage.success('文档上传并解析成功')
  }
  load()
}

const beforeUpload = (file: File) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
  if (!allowed.includes(file.type)) {
    ElMessage.error('仅支持 PDF、DOCX、DOC 文件')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  parsing.value = true
  return true
}

const onError = () => {
  parsing.value = false
  ElMessage.error('上传或解析失败，请重试')
}

const fillArticle = () => {
  const paragraphs = current.value?.parsed?.paragraphs || []
  if (!paragraphs.length) {
    ElMessage.warning('当前文档没有可填入的正文段落')
    return
  }
  sessionStorage.setItem('st_pending_paragraphs', JSON.stringify(paragraphs))
  router.push({ name: 'news' })
}

const remove = async (item: FileItem) => {
  await ElMessageBox.confirm(`确认删除归档文件「${item.originalName}」？`, '删除确认', { type: 'warning' })
  await del(`/admin/files/${item.id}`)
    .then(() => {
      ElMessage.success('删除成功')
      load()
    })
    .catch(() => undefined)
}

const formatSize = (size: number) => `${(size / 1024).toFixed(1)} KB`

const openFile = (item: FileItem) => {
  window.open(item.url, '_blank')
}

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <div class="page-card p-5">
      <h1 class="section-title">文档上传解析</h1>
      <p class="mt-1 text-sm text-muted">
        上传 PDF / Word 文档，系统自动提取文字并按段落拆分，可一键填入新闻正文；原文件归档保存，支持下载与预览。
      </p>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-5">
        <div class="page-card p-5">
          <el-upload
            :action="`${apiBase}/admin/files/upload`"
            :headers="uploadHeaders"
            name="file"
            accept=".pdf,.doc,.docx"
            drag
            :before-upload="beforeUpload"
            :on-success="onUploaded"
            :on-error="onError"
            :show-file-list="false"
          >
            <div class="py-8 text-center">
              <UploadFilled class="mx-auto text-navy-700" :size="40" />
              <div class="mt-3 font-medium text-ink">拖拽文档到此处，或点击上传</div>
              <div class="mt-1 text-sm text-muted">支持 PDF、DOCX 文档，单个文件不超过 10MB</div>
            </div>
          </el-upload>
          <div v-if="parsing" class="mt-3 text-center text-sm text-navy-700">正在解析文档文字，请稍候…</div>
          <div class="mt-3 rounded-lg bg-surface p-3 text-xs leading-relaxed text-muted">
            说明：扫描版 PDF 无文本层时无法直接提取文字，系统会给出提示，请手动录入正文后保存。
          </div>
        </div>

        <div v-if="current?.parsed" class="page-card p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="section-title">解析结果预览</h2>
              <p class="mt-1 text-sm text-muted">
                {{ current.file.originalName }} · 共 {{ current.parsed.paragraphs.length }} 个段落
              </p>
            </div>
            <el-button type="primary" @click="fillArticle">
              <el-icon class="mr-1"><PenLine /></el-icon>
              填入新闻正文
            </el-button>
          </div>
          <el-alert v-if="current.parsed.warning" :title="current.parsed.warning" type="warning" class="mt-4" show-icon />
          <div class="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-lg border border-navy-900/10 bg-surface p-4">
            <p v-for="(paragraph, index) in current.parsed.paragraphs" :key="index" class="text-sm leading-7 text-ink">
              <span class="mr-2 font-semibold text-muted">{{ index + 1 }}.</span>{{ paragraph }}
            </p>
          </div>
        </div>

        <div class="page-card p-5">
          <h2 class="section-title">历史归档文件</h2>
          <el-table :data="rows" class="mt-4" stripe>
            <el-table-column prop="originalName" label="文件名" min-width="200" />
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.category === 'image' ? 'info' : 'success'">
                  {{ row.category === 'image' ? '图片' : '文档' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="大小" width="100">
              <template #default="{ row }">{{ formatSize(row.size) }}</template>
            </el-table-column>
            <el-table-column prop="createdAt" label="上传时间" width="180" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openFile(row)">
                  <el-icon><Download /></el-icon> 预览
                </el-button>
                <el-button link type="danger" @click="remove(row)">
                  <el-icon><Trash2 /></el-icon> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <aside class="page-card h-fit p-5">
        <div class="flex items-center gap-2 text-navy-800">
          <FileText :size="18" />
          <h2 class="section-title">使用流程</h2>
        </div>
        <ol class="mt-4 space-y-4 text-sm text-ink">
          <li class="flex gap-3"><span class="font-semibold text-navy-700">01</span><span>上传 PDF 或 Word 文档，系统自动解析文字内容。</span></li>
          <li class="flex gap-3"><span class="font-semibold text-navy-700">02</span><span>核对分段预览，确认正文内容是否完整准确。</span></li>
          <li class="flex gap-3"><span class="font-semibold text-navy-700">03</span><span>点击「填入新闻正文」跳转到新闻编辑页继续完善标题与摘要。</span></li>
          <li class="flex gap-3"><span class="font-semibold text-navy-700">04</span><span>保存后前台新闻详情页立即同步展示最新内容。</span></li>
        </ol>
      </aside>
    </div>
  </div>
</template>
