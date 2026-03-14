import type React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 受保护的路由组件
 * 只有登录用户才能访问的路由
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* 动态网格背景 */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        ></div>

        {/* 光晕效果 */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/15 blur-[100px] rounded-full animate-pulse"></div>

        <div className="text-center relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <svg
              viewBox="0 0 64 64"
              className="w-16 h-16 mx-auto"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="弈控经纬 Logo"
            >
              <circle cx="32" cy="32" r="30" stroke="url(#logoGrad)" strokeWidth="3" />
              <circle
                cx="32"
                cy="32"
                r="22"
                stroke="url(#logoGrad)"
                strokeWidth="2"
                opacity="0.6"
              />
              <circle
                cx="32"
                cy="32"
                r="12"
                stroke="url(#logoGrad)"
                strokeWidth="2"
                opacity="0.3"
              />
              <circle cx="32" cy="32" r="4" fill="url(#logoGrad)" />
              <path
                d="M32 8 L32 16 M32 48 L32 56 M8 32 L16 32 M48 32 L56 32"
                stroke="url(#logoGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />
              <path
                d="M18 18 L24 24 M40 40 L46 46 M18 46 L24 40 M40 24 L46 18"
                stroke="url(#logoGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.3"
              />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64">
                  <stop stopColor="#60a5fa" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* 加载动画 */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            <div
              className="absolute inset-2 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"
              style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
            ></div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">欢迎回来</h2>
          <p className="text-blue-300 mb-4">正在快速加载中..</p>

          {/* 进度指示器 */}
          <div className="flex items-center justify-center gap-1 mt-6">
            <div
              className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 已认证，渲染子组件
  return <>{children}</>
}

export default ProtectedRoute
