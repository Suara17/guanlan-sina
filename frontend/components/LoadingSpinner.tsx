import type React from 'react'
import TiangongLogo from './TiangongLogo'

interface LoadingSpinnerProps {
  size?: number
  text?: string
  fullscreen?: boolean
  variant?: 'dark' | 'light' // 主题变体,默认dark
}

/**
 * 天工·弈控 加载动画组件
 *
 * 特性:
 * - 使用品牌齿轮LOGO作为加载指示器
 * - 支持全屏遮罩模式
 * - 可自定义加载文字
 * - 支持深色/浅色主题适配
 * - 响应 prefers-reduced-motion 无障碍设置
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 48,
  text = '加载中...',
  fullscreen = false,
  variant = 'dark',
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* 齿轮旋转动画 */}
      <div className="relative">
        <TiangongLogo size={size} animate={true} variant={variant} />
        {/* 外圈脉冲光环 */}
        <div
          className={`absolute inset-0 rounded-full border-2 animate-ping ${
            variant === 'light' ? 'border-blue-600/40' : 'border-blue-400/30'
          }`}
          style={{
            width: size * 1.5,
            height: size * 1.5,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* 加载文字 */}
      {text && (
        <div className="flex items-center gap-2">
          <span
            className={`font-medium ${variant === 'light' ? 'text-slate-700' : 'text-slate-300'}`}
          >
            {text}
          </span>
          <div className="flex gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                variant === 'light' ? 'bg-blue-600' : 'bg-blue-400'
              }`}
              style={{ animationDelay: '0ms' }}
            />
            <span
              className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                variant === 'light' ? 'bg-blue-600' : 'bg-blue-400'
              }`}
              style={{ animationDelay: '150ms' }}
            />
            <span
              className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                variant === 'light' ? 'bg-blue-600' : 'bg-blue-400'
              }`}
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner
