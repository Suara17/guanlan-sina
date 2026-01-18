import { useContext } from 'react'
import AuthContext, { type AuthContextType } from '../contexts/AuthContext'

/**
 * 认证相关的自定义hook
 * 提供认证状态和函数的便捷访问
 * @returns 认证上下文，包含用户状态、登录、登出等功能
 * @throws 如果在AuthProvider之外使用会抛出错误
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // 在开发环境中提供更详细的错误信息
    const error = new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    )
    // 在生产环境中抛出错误，在开发环境中记录到控制台
    if (process.env.NODE_ENV === 'development') {
      console.error('AuthContext Error:', error.message)
      // 返回一个临时的loading状态而不是抛出错误
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: '正在初始化认证系统...',
        login: async () => false,
        logout: () => {},
        checkAuth: async () => {},
        clearError: () => {},
      } as AuthContextType
    }
    throw error
  }
  return context
}

export default useAuth
