import { useContext } from 'react'
import AuthContext, { type AuthContextType } from '../contexts/AuthContext'

/**
 * 认证相关的自定义hook
 * 提供认证状态和函数的便捷访问 *
 * @returns 认证上下文，包含用户状态、登录、登出等功能
 * @throws 如果在AuthProvider之外使用会抛出错�? */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default useAuth
