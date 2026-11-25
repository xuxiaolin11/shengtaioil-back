<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { LockKeyhole, ShieldCheck, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('admin')
const password = ref('')
const loading = ref(false)

const submit = async () => {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入账号和密码')
    return
  }

  loading.value = true
  await auth
    .login(username.value, password.value)
    .then(() => {
      ElMessage.success('登录成功')
      router.push({ name: 'dashboard' })
    })
    .catch(() => undefined)
    .finally(() => {
      loading.value = false
    })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4">
    <div class="pointer-events-none absolute inset-0 opacity-25">
      <div class="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-navy-700 blur-3xl"></div>
      <div class="absolute -bottom-32 -right-16 h-[460px] w-[460px] rounded-full bg-steel blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-[420px]">
      <div class="mb-8 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white">
          <ShieldCheck :size="28" />
        </div>
        <h1 class="mt-5 font-serif text-2xl font-semibold tracking-wide text-white">胜泰石油内容管理平台</h1>
        <p class="mt-2 text-sm text-white/50">东营胜泰石油工程技术有限公司 · 官方内容维护系统</p>
      </div>

      <div class="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <h2 class="text-xl font-semibold text-ink">账号登录</h2>
        <p class="mt-2 text-sm text-muted">请使用管理员账号登录，登录后即可维护官网新闻与首页内容。</p>

        <el-form class="mt-7" @submit.prevent="submit">
          <label class="mb-2 block text-sm font-medium text-ink">账号</label>
          <el-input v-model="username" size="large" placeholder="请输入管理员账号" autocomplete="username">
            <template #prefix><UserRound :size="16" class="text-muted" /></template>
          </el-input>

          <label class="mb-2 mt-5 block text-sm font-medium text-ink">密码</label>
          <el-input
            v-model="password"
            type="password"
            size="large"
            show-password
            placeholder="请输入登录密码"
            autocomplete="current-password"
            @keyup.enter="submit"
          >
            <template #prefix><LockKeyhole :size="16" class="text-muted" /></template>
          </el-input>

          <el-button type="primary" size="large" class="mt-7 w-full" :loading="loading" @click="submit">
            登录
          </el-button>
        </el-form>

        <div class="mt-6 border-t border-navy-900/8 pt-5 text-center text-xs text-muted">
          仅限授权人员使用 · 所有操作均记录留痕
        </div>
      </div>
    </div>
  </div>
</template>
