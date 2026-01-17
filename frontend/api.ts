import { createClient } from './src/client';

// 创建客户端实例
const client = createClient();

// 配置客户端
client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 设置认证token
client.interceptors.request.use((request) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

console.log("Client baseUrl:", client.getConfig().baseUrl)
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL)

// 导出客户端供其他模块使用
export { client };