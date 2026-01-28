import type React from 'react'
import { useMemo } from 'react'

interface TiangongLogoProps {
  size?: number
  className?: string
  animate?: boolean // 是否启用旋转动画
  variant?: 'dark' | 'light' // 主题变体: dark用于深色背景, light用于浅色背景
}

/**
 * 天工·弈控 品牌LOGO组件 - 齿轮版
 *
 * 设计理念:
 * - 齿轮造型: 象征工业制造、精密控制
 * - 科技蓝: 专业SaaS蓝色系 (#2563EB, #3B82F6, #60A5FA)
 * - 发光效果: 体现智能化和未来感
 * - 旋转动画: 象征持续运转(可选,默认开启)
 * - 主题适配: dark(深色背景)/light(浅色背景)自动调整配色
 */
const TiangongLogo: React.FC<TiangongLogoProps> = ({
  size = 32,
  className = '',
  animate = true,
  variant = 'dark',
}) => {
  // 生成唯一ID避免多个实例的渐变定义冲突
  const uniqueId = useMemo(() => `logo-${Math.random().toString(36).substr(2, 9)}`, [])

  // 根据主题选择配色方案
  const colors =
    variant === 'light'
      ? {
          // 浅色背景(白色/浅灰) - 使用浅蓝色LOGO(高亮度)
          gearLight: '#93C5FD', // blue-300 (更浅)
          gearMid: '#60A5FA', // blue-400
          gearDark: '#3B82F6', // blue-500
          mainStart: '#60A5FA', // blue-400
          mainMid: '#3B82F6', // blue-500
          mainEnd: '#2563EB', // blue-600
          holeStart: '#E0F2FE', // blue-50
          holeEnd: '#BAE6FD', // blue-200
          triangleStart: '#93C5FD', // blue-300
          triangleEnd: '#60A5FA', // blue-400
          strokeLight: '#93C5FD', // blue-300
          strokeDark: '#3B82F6', // blue-500
          innerStroke: '#2563EB', // blue-600
          innerHoleFill: '#DBEAFE', // blue-100
          innerHoleStroke: '#60A5FA', // blue-400
          glowColor: 'rgba(96, 165, 250, 0.25)',
          glowBlur: '0 0 12px rgba(96, 165, 250, 0.5)',
        }
      : {
          // 深色背景(深灰/黑色) - 使用深蓝色LOGO(低亮度,高对比)
          gearLight: '#3B82F6', // blue-500
          gearMid: '#2563EB', // blue-600
          gearDark: '#1D4ED8', // blue-700
          mainStart: '#2563EB', // blue-600
          mainMid: '#1D4ED8', // blue-700
          mainEnd: '#1E40AF', // blue-800
          holeStart: '#1E293B', // slate-800
          holeEnd: '#0F172A', // slate-900
          triangleStart: '#3B82F6', // blue-500
          triangleEnd: '#2563EB', // blue-600
          strokeLight: '#3B82F6', // blue-500
          strokeDark: '#1D4ED8', // blue-700
          innerStroke: '#1E40AF', // blue-800
          innerHoleFill: '#0F172A', // slate-900
          innerHoleStroke: '#2563EB', // blue-600
          glowColor: 'rgba(37, 99, 235, 0.3)',
          glowBlur: '0 0 16px rgba(37, 99, 235, 0.7)',
        }
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(${colors.glowBlur})` }}
      >
        {/* 齿轮主体 */}
        <g
          className={animate ? 'animate-[spin_8s_linear_infinite]' : ''}
          style={{ transformOrigin: '16px 16px' }}
        >
          {/* 外齿轮齿 - 12个齿 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180
            const outerX = 16 + Math.cos(angle) * 14
            const outerY = 16 + Math.sin(angle) * 14
            const innerX = 16 + Math.cos(angle) * 11
            const innerY = 16 + Math.sin(angle) * 11

            // 齿的左右边界点
            const leftAngle = ((i * 30 - 4) * Math.PI) / 180
            const rightAngle = ((i * 30 + 4) * Math.PI) / 180

            const leftOuterX = 16 + Math.cos(leftAngle) * 14
            const leftOuterY = 16 + Math.sin(leftAngle) * 14
            const rightOuterX = 16 + Math.cos(rightAngle) * 14
            const rightOuterY = 16 + Math.sin(rightAngle) * 14

            const leftInnerX = 16 + Math.cos(leftAngle) * 11
            const leftInnerY = 16 + Math.sin(leftAngle) * 11
            const rightInnerX = 16 + Math.cos(rightAngle) * 11
            const rightInnerY = 16 + Math.sin(rightAngle) * 11

            return (
              <path
                key={i}
                d={`M ${leftInnerX} ${leftInnerY} L ${leftOuterX} ${leftOuterY} L ${rightOuterX} ${rightOuterY} L ${rightInnerX} ${rightInnerY} Z`}
                fill={`url(#gradient-gear-${uniqueId})`}
                stroke={`url(#gradient-stroke-${uniqueId})`}
                strokeWidth="0.5"
              />
            )
          })}

          {/* 齿轮主圆环 */}
          <circle
            cx="16"
            cy="16"
            r="10.5"
            fill={`url(#gradient-main-${uniqueId})`}
            stroke={`url(#gradient-stroke-${uniqueId})`}
            strokeWidth="0.8"
          />

          {/* 中心圆孔 */}
          <circle
            cx="16"
            cy="16"
            r="5"
            fill={`url(#gradient-hole-${uniqueId})`}
            stroke={colors.innerStroke}
            strokeWidth="0.5"
          />

          {/* 中心三角形 - 代表"弈控"精准控制 */}
          <path
            d="M16 12 L19 17 L13 17 Z"
            fill={`url(#gradient-triangle-${uniqueId})`}
            style={{ filter: `drop-shadow(0 2px 4px ${colors.glowColor})` }}
          />

          {/* 三个内部圆孔(对称分布) */}
          {[0, 120, 240].map((angle, i) => {
            const x = 16 + Math.cos((angle * Math.PI) / 180) * 7.5
            const y = 16 + Math.sin((angle * Math.PI) / 180) * 7.5
            return (
              <circle
                key={`hole-${i}`}
                cx={x}
                cy={y}
                r="1.2"
                fill={colors.innerHoleFill}
                stroke={colors.innerHoleStroke}
                strokeWidth="0.3"
              />
            )
          })}
        </g>

        {/* 渐变定义 */}
        <defs>
          {/* 齿轮齿渐变 */}
          <linearGradient id={`gradient-gear-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gearLight} />
            <stop offset="50%" stopColor={colors.gearMid} />
            <stop offset="100%" stopColor={colors.gearDark} />
          </linearGradient>

          {/* 主圆环渐变 */}
          <radialGradient id={`gradient-main-${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.mainStart} />
            <stop offset="70%" stopColor={colors.mainMid} />
            <stop offset="100%" stopColor={colors.mainEnd} />
          </radialGradient>

          {/* 中心孔渐变 */}
          <radialGradient id={`gradient-hole-${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.holeStart} />
            <stop offset="100%" stopColor={colors.holeEnd} />
          </radialGradient>

          {/* 三角形渐变 */}
          <linearGradient id={`gradient-triangle-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.triangleStart} />
            <stop offset="100%" stopColor={colors.triangleEnd} />
          </linearGradient>

          {/* 描边渐变 */}
          <linearGradient id={`gradient-stroke-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.strokeLight} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.strokeDark} stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* 发光背景 - 增强科技感 */}
      <div
        className="absolute inset-0 rounded-full blur-lg -z-10"
        style={{
          width: size * 1.3,
          height: size * 1.3,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${colors.glowColor} 0%, transparent 70%)`,
        }}
      />
    </div>
  )
}

export default TiangongLogo
