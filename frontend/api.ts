import { createClient } from './src/client'

// 创建客户端实例
const client = createClient()

// 配置客户端
client.setConfig({
  baseUrl: '', // 使用相对路径，让vite proxy处理
  headers: {
    'Content-Type': 'application/json',
  },
})

// 设置认证token（备用方式，用于非security配置的请求）
client.interceptors.request.use((request) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
  return request
})

// 导出客户端供其他模块使用
export { client }
