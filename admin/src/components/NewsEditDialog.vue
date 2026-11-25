<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { apiBase, post, put } from '../api/request'
import type { NewsItem, NewsPayload } from '../types'

const props = defineProps<{
  modelValue: boolean
  item: NewsItem | null
  categories: string[]
  pendingParagraphs: string[]
  featuredCount: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const form = ref<NewsPayload>(emptyForm())
const submitting = ref(false)
const documentParsing = ref(false)
const parsedDocument = ref<{ name: string; paragraphs: string[]; warning?: string } | null>(null)
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('st_token') || ''}` }

function emptyForm(): NewsPayload {
  return {
    slug: '',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    category: '公司要闻',
    summary: '',
    keywords: [],
    paragraphs: [],
    images: [],
    status: 'published',
    isFeatured: false,
    featuredOrder: 0
  }
}

const keywordText = ref('')
const paragraphText = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    parsedDocument.value = null
    const source = props.item
    form.value = source
      ? {
          slug: source.slug,
          title: source.title,
          date: source.date,
          category: source.category,
          summary: source.summary,
          keywords: [...source.keywords],
          paragraphs: [...source.paragraphs],
          images: source.images.map((image) => ({ ...image })),
          status: source.status,
          isFeatured: source.isFeatured,
          featuredOrder: source.featuredOrder
        }
      : { ...emptyForm(), paragraphs: [...props.pendingParagraphs] }
    keywordText.value = form.value.keywords.join('、')
    paragraphText.value = form.value.paragraphs.join('\n\n')
  }
)

watch(paragraphText, (value) => {
  form.value.paragraphs = value
    .split(/\n\s*\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
})

watch(keywordText, (value) => {
  form.value.keywords = value
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
})

const onFeaturedChange = (value: boolean | string | number) => {
  const next = Boolean(value)
  const wasFeatured = Boolean(props.item?.isFeatured)
  if (next && !wasFeatured && props.featuredCount >= 3) {
    form.value.isFeatured = false
    ElMessage.warning('最多只允许展示三个')
  }
}

const onImageUploaded = (response: { data?: { file?: { url: string } } }) => {
  const url = response?.data?.file?.url
  if (url) {
    form.value.images.push({ path: url, alt: form.value.title || '新闻配图' })
  }
}

const beforeImageUpload = (file: File) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    ElMessage.error('仅支持 JPG、PNG、WebP、GIF 图片')
    return false
  }
  return true
}

const beforeDocumentUpload = (file: File) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
  if (!allowed.includes(file.type)) {
    ElMessage.error('仅支持 PDF、DOCX、DOC 文档')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  documentParsing.value = true
  return true
}

type DocumentUploadResponse = {
  data?: {
    file: { originalName: string }
    parsed: { text: string; paragraphs: string[]; warning?: string } | null
  }
}

const onDocumentUploaded = (response: DocumentUploadResponse) => {
  documentParsing.value = false
  const parsed = response?.data?.parsed

  if (!parsed || !parsed.paragraphs.length) {
    ElMessage.warning(parsed?.warning || '未提取到文字，请手动录入正文')
    return
  }

  const name = response?.data?.file?.originalName || '文档'
  parsedDocument.value = { name, paragraphs: parsed.paragraphs, warning: parsed.warning }
  paragraphText.value = parsed.paragraphs.join('\n\n')

  if (parsed.warning) {
    ElMessage.warning(parsed.warning)
  } else {
    ElMessage.success(`已解析 ${parsed.paragraphs.length} 段文字并填入正文`)
  }
}

const onDocumentError = () => {
  documentParsing.value = false
  ElMessage.error('文档上传或解析失败，请重试')
}

const refillParsedText = () => {
  if (!parsedDocument.value) return
  paragraphText.value = parsedDocument.value.paragraphs.join('\n\n')
  ElMessage.success('已将解析文字填入正文')
}

const save = async () => {
  if (!form.value.title.trim() || !form.value.summary.trim() || !form.value.date) {
    ElMessage.warning('请填写标题、日期与摘要')
    return
  }

  const wasFeatured = Boolean(props.item?.isFeatured)
  if (form.value.isFeatured && !wasFeatured && props.featuredCount >= 3) {
    ElMessage.warning('最多只允许展示三个')
    return
  }

  submitting.value = true
  const payload = {
    ...form.value,
    paragraphs: form.value.paragraphs.length ? form.value.paragraphs : paragraphText.value.split(/\n+/).filter(Boolean)
  }
  const action = props.item ? put(`/admin/news/${props.item.id}`, payload) : post('/admin/news', payload)
  await action
    .then(() => {
      ElMessage.success(props.item ? '新闻已更新' : '新闻已创建')
      emit('saved')
      emit('update:modelValue', false)
    })
    .catch(() => undefined)
    .finally(() => {
      submitting.value = false
    })
}

defineExpose({ form })
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="item ? '编辑新闻' : '新建新闻'"
    width="min(900px, 94vw)"
    top="4vh"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="grid gap-5 md:grid-cols-2">
      <div>
        <label class="mb-2 block text-sm font-medium text-ink">新闻标题</label>
        <el-input v-model="form.title" placeholder="请输入新闻标题" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium text-ink">URL 标识（可不填）</label>
        <el-input v-model="form.slug" placeholder="留空自动生成，如 news-2026" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium text-ink">发布日期</label>
        <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" class="w-full" />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium text-ink">新闻分类</label>
        <el-select v-model="form.category" filterable allow-create class="w-full">
          <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
        </el-select>
      </div>
    </div>

    <div class="mt-5">
      <label class="mb-2 block text-sm font-medium text-ink">摘要</label>
      <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="用于新闻列表与首页展示的简要说明" />
    </div>

    <div class="mt-5">
      <label class="mb-2 block text-sm font-medium text-ink">关键词（用顿号或逗号分隔）</label>
      <el-input v-model="keywordText" placeholder="例如：安全生产、钻井攻坚、冬季施工" />
    </div>

    <div class="mt-5 rounded-lg border border-navy-900/10 bg-surface p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-ink">从文档导入正文</div>
          <div class="mt-1 text-xs text-muted">上传 PDF / Word，系统自动提取文字并填入下方正文，上传后可查看解析结果</div>
        </div>
        <el-upload
          :action="`${apiBase}/admin/files/upload`"
          :headers="uploadHeaders"
          name="file"
          accept=".pdf,.doc,.docx"
          :before-upload="beforeDocumentUpload"
          :on-success="onDocumentUploaded"
          :on-error="onDocumentError"
          :show-file-list="false"
        >
          <el-button type="primary" plain :loading="documentParsing">上传文档解析</el-button>
        </el-upload>
      </div>

      <div v-if="parsedDocument" class="mt-4 rounded-md border border-navy-800/15 bg-white p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-xs font-semibold text-navy-800">
            解析结果：{{ parsedDocument.name }} · 共 {{ parsedDocument.paragraphs.length }} 段
          </div>
          <el-button link type="primary" size="small" @click="refillParsedText">重新填入正文</el-button>
        </div>
        <el-alert v-if="parsedDocument.warning" :title="parsedDocument.warning" type="warning" class="mt-2" show-icon />
        <div class="mt-2 max-h-32 overflow-y-auto rounded bg-surface p-2 text-xs leading-6 text-ink">
          <p v-for="(paragraph, index) in parsedDocument.paragraphs" :key="index" class="mb-1">
            <span class="mr-1 font-semibold text-muted">{{ index + 1 }}.</span>{{ paragraph }}
          </p>
        </div>
      </div>
    </div>

    <div class="mt-5">
      <label class="mb-2 block text-sm font-medium text-ink">正文段落（空行分段，可直接编辑）</label>
      <el-input
        v-model="paragraphText"
        type="textarea"
        :rows="8"
        placeholder="在此录入正文内容，或通过上方上传 PDF / Word 文档自动填入"
      />
    </div>

    <div class="mt-5 grid gap-5 md:grid-cols-2">
      <div>
        <label class="mb-2 block text-sm font-medium text-ink">新闻配图</label>
        <el-upload
          :action="`${apiBase}/admin/files/upload`"
          :headers="uploadHeaders"
          name="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          :before-upload="beforeImageUpload"
          :on-success="onImageUploaded"
          :show-file-list="false"
        >
          <el-button type="primary" plain>上传配图</el-button>
        </el-upload>
        <div v-if="form.images.length" class="mt-3 flex flex-wrap gap-2">
          <div v-for="(image, index) in form.images" :key="index" class="relative">
            <img :src="image.path" class="h-16 w-24 rounded border border-navy-900/10 object-cover" />
            <button
              type="button"
              class="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-duty text-xs text-white"
              @click="form.images.splice(index, 1)"
            >
              ×
            </button>
          </div>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex items-center justify-between rounded-lg border border-navy-900/10 p-3">
          <div>
            <div class="text-sm font-medium text-ink">展示状态</div>
            <div class="text-xs text-muted">下架后不会在前台显示</div>
          </div>
          <el-radio-group v-model="form.status" size="small">
            <el-radio-button value="published">发布</el-radio-button>
            <el-radio-button value="draft">下架</el-radio-button>
          </el-radio-group>
        </div>
        <div class="flex items-center justify-between rounded-lg border border-navy-900/10 p-3">
          <div>
            <div class="text-sm font-medium text-ink">首页新闻展示</div>
            <div class="text-xs text-muted">开启后显示在首页右侧最新动态</div>
          </div>
          <el-switch v-model="form.isFeatured" @change="onFeaturedChange" />
        </div>
        <div v-if="form.isFeatured" class="rounded-md bg-surface p-2 text-xs text-muted">
          展示顺序可在新闻列表页顶部的「首页展示顺序」区域拖拽调整
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="save">保存新闻</el-button>
    </template>
  </el-dialog>
</template>
