import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['668wd4ta0871.vicp.fun'],
      proxy: {
        // 所有 /api 开头的请求都转发到本地后端
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return
            if (id.includes('node_modules/three/examples')) {
              return 'three-examples'
            }
            if (id.includes('node_modules/three/')) {
              return 'three-core'
            }
            if (id.includes('@react-three/drei') || id.includes('@react-three/fiber')) {
              return 'r3-stack'
            }
            if (id.includes('gsap')) {
              return 'gsap-vendor'
            }
          },
        },
      },
    },
  }
})
