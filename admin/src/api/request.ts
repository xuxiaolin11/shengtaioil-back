import axios from 'axios'
import { ElMessage } from 'element-plus'

export type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
}

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('st_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiEnvelope<unknown>
    if (payload.code !== 0) {
      ElMessage.error(payload.message || '请求失败')
      return Promise.reject(new Error(payload.message))
    }
    return response
  },
  (error) => {
    console.error(error)
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '网络异常'
    ElMessage.error(message)
    if (status === 401) {
      localStorage.removeItem('st_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const get = <T>(url: string, params?: Record<string, unknown>) =>
  request.get<ApiEnvelope<T>>(url, { params }).then((res) => res.data.data)

export const post = <T>(url: string, body?: unknown) =>
  request.post<ApiEnvelope<T>>(url, body).then((res) => res.data.data)

export const put = <T>(url: string, body?: unknown) =>
  request.put<ApiEnvelope<T>>(url, body).then((res) => res.data.data)

export const patch = <T>(url: string, body?: unknown) =>
  request.patch<ApiEnvelope<T>>(url, body).then((res) => res.data.data)

export const del = <T>(url: string) => request.delete<ApiEnvelope<T>>(url).then((res) => res.data.data)

export const apiBase = '/api'
