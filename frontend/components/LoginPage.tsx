import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import YikongLogo from './YikongLogo'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuth()

  // 获取重定向路径（如果用户被重定向到登录页面）
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app'
  const [formData, setFormData] = useState({
    username: 'admin@example.com',
    password: 'changethis',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear errors when user starts typing
    if (error) clearError()
    if (validationError) setValidationError(null)
  }

  const validateForm = (): boolean => {
    setValidationError(null) // Clear previous validation error

    if (!formData.username.trim()) {
      setValidationError('请输入邮箱地址')
      return false
    }
    if (!formData.password.trim()) {
      setValidationError('请输入密码')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username)) {
      setValidationError('请输入有效的邮箱地址')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // 使用认证上下文的登录方法
    const success = await login(formData.username, formData.password)

    if (success) {
      // 登录成功，导航到原本想要访问的页面或应用主界面
      navigate(from, { replace: true })
    }
    // 错误处理由useAuth内部处理
  }

  const handleBackToLanding = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 动态网格背景 */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      ></div>

      {/* 光晕效果 */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/30 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <button
          type="button"
          onClick={handleBackToLanding}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          返回首页
        </button>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <YikongLogo size={64} animate={true} variant="light" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">登录弈控经纬</h1>
          <p className="text-center text-slate-600 mb-8">请输入您的账号信息</p>

          {/* Error Message */}
          {(error || validationError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {validationError || error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                邮箱地址
              </label>
              <input
                id="username"
                name="username"
                type="email"
                autoComplete="email"
                required
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-900 placeholder-slate-400"
                placeholder="请输入邮箱地址"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-900 placeholder-slate-400"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-blue-600/50 disabled:to-blue-500/50 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录系统'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">忘记密码？请联系系统管理员</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
