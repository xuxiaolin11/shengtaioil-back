<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  FileText,
  LayoutDashboard,
  Images,
  FolderOpen,
  LogOut,
  Menu,
  ShieldCheck
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const collapsed = ref(false)

const menus = [
  { name: 'dashboard', label: '工作台', icon: LayoutDashboard },
  { name: 'news', label: '新闻管理', icon: FileText },
  { name: 'carousel', label: '轮播管理', icon: Images },
  { name: 'files', label: '文档解析', icon: FolderOpen }
]

const currentTitle = computed(() => {
  const item = menus.find((menu) => menu.name === route.name)
  return item?.label || '内容管理平台'
})

const onLogout = async () => {
  await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen bg-mist">
    <aside
      class="fixed inset-y-0 left-0 z-30 flex flex-col bg-navy-900 text-white transition-all duration-300"
      :class="collapsed ? 'w-[76px]' : 'w-[232px]'"
    >
      <div class="flex h-[68px] items-center gap-3 border-b border-white/10 px-5">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <ShieldCheck :size="20" />
        </div>
        <div v-if="!collapsed" class="leading-tight">
          <div class="text-sm font-semibold tracking-wide">胜泰石油</div>
          <div class="text-[11px] text-white/50">内容管理平台</div>
        </div>
      </div>

      <nav class="flex-1 space-y-1 px-3 py-5">
        <button
          v-for="menu in menus"
          :key="menu.name"
          type="button"
          class="flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm transition-colors"
          :class="route.name === menu.name ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'"
          @click="router.push({ name: menu.name })"
        >
          <component :is="menu.icon" :size="18" class="shrink-0" />
          <span v-if="!collapsed">{{ menu.label }}</span>
        </button>
      </nav>

      <div class="border-t border-white/10 p-3">
        <button
          type="button"
          class="flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm text-white/65 transition-colors hover:bg-white/8 hover:text-white"
          @click="onLogout"
        >
          <LogOut :size="18" />
          <span v-if="!collapsed">退出登录</span>
        </button>
      </div>
    </aside>

    <div class="flex min-h-screen flex-1 flex-col transition-all duration-300" :class="collapsed ? 'ml-[76px]' : 'ml-[232px]'">
      <header class="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-navy-900/8 bg-white/90 px-6 backdrop-blur">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-mist"
            @click="collapsed = !collapsed"
          >
            <Menu :size="18" />
          </button>
          <div>
            <div class="text-base font-semibold text-ink">{{ currentTitle }}</div>
            <div class="text-xs text-muted">东营胜泰石油工程技术有限公司 · 官方内容维护</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-sm font-medium text-ink">{{ auth.user?.username || '管理员' }}</div>
            <div class="text-[11px] text-muted">系统管理员</div>
          </div>
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-semibold text-white">
            {{ (auth.user?.username || '管').slice(0, 1).toUpperCase() }}
          </div>
        </div>
      </header>

      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
