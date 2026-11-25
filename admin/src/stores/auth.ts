import { defineStore } from 'pinia'
import { get, post } from '../api/request'

type AdminUser = {
  id: number
  username: string
  createdAt: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('st_token') || '',
    user: null as AdminUser | null,
    ready: false
  }),
  actions: {
    async login(username: string, password: string) {
      const data = await post<{ token: string; admin: AdminUser }>('/admin/auth/login', { username, password })
      this.token = data.token
      this.user = data.admin
      localStorage.setItem('st_token', data.token)
    },
    async fetchMe() {
      if (!this.token) {
        this.ready = true
        return
      }
      this.user = await get<AdminUser>('/admin/auth/me')
      this.ready = true
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('st_token')
    }
  }
})
