// frontend/components/FactoryVisualization/IsometricBlock.tsx
// 等轴测方块：三面体（顶/左/右）+ 可选状态脉冲点 + 点击回调
import { motion } from 'framer-motion'
import type React from 'react'
import type { StatusType } from './factoryData'
import { STATUS_COLORS } from './factoryData'

export const TILE_W = 120  // 等轴测砖块宽度（像素）
export const TILE_H = 60   // 等轴测砖块高度（像素）
export const BLOCK_DEPTH = 36  // 方块厚度

/** 将网格坐标转换为 SVG 屏幕坐标 */
export function isoToScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  }
}

interface IsometricBlockProps {
  col: number
  row: number
  status: StatusType
  label: string
  subLabel?: string
  onClick?: () => void
  /** 是否显示状态脉冲圆点 */
  showPulse?: boolean
  /** 缩放比例（用于不同层级的尺寸调整）*/
  scale?: number
}

const IsometricBlock: React.FC<IsometricBlockProps> = ({
  col,
  row,
  status,
  label,
  subLabel,
  onClick,
  showPulse = true,
  scale = 1,
}) => {
  const colors = STATUS_COLORS[status]
  const { x, y } = isoToScreen(col, row)
  const w = TILE_W * scale
  const h = TILE_H * scale
  const d = BLOCK_DEPTH * scale

  // 顶面：菱形四个顶点
  const topPoints = [
    `${x},${y - d}`,
    `${x + w / 2},${y + h / 2 - d}`,
    `${x},${y + h - d}`,
    `${x - w / 2},${y + h / 2 - d}`,
  ].join(' ')

  // 左面：平行四边形
  const leftPoints = [
    `${x - w / 2},${y + h / 2 - d}`,
    `${x},${y + h - d}`,
    `${x},${y + h}`,
    `${x - w / 2},${y + h / 2}`,
  ].join(' ')

  // 右面：平行四边形
  const rightPoints = [
    `${x + w / 2},${y + h / 2 - d}`,
    `${x},${y + h - d}`,
    `${x},${y + h}`,
    `${x + w / 2},${y + h / 2}`,
  ].join(' ')

  return (
    <motion.g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 右面 */}
      <polygon points={rightPoints} fill={colors.right} stroke="white" strokeWidth={0.5} />
      {/* 左面 */}
      <polygon points={leftPoints} fill={colors.left} stroke="white" strokeWidth={0.5} />
      {/* 顶面 */}
      <polygon points={topPoints} fill={colors.top} stroke="white" strokeWidth={0.5} />

      {/* 主标签（顶面中心）*/}
      <text
        x={x}
        y={y + h / 2 - d - 4}
        textAnchor="middle"
        fontSize={11 * scale}
        fontWeight="700"
        fill={colors.text}
      >
        {label}
      </text>

      {/* 副标签 */}
      {subLabel && (
        <text
          x={x}
          y={y + h / 2 - d + 10 * scale}
          textAnchor="middle"
          fontSize={9 * scale}
          fill={colors.text}
          opacity={0.75}
        >
          {subLabel}
        </text>
      )}

      {/* 状态脉冲点（右上角）*/}
      {showPulse && (
        <>
          <circle
            cx={x + w / 2 - 8 * scale}
            cy={y - d + 8 * scale}
            r={5 * scale}
            fill={colors.pulse}
            opacity={0.3}
          >
            <animate attributeName="r" values={`${4 * scale};${8 * scale};${4 * scale}`} dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle
            cx={x + w / 2 - 8 * scale}
            cy={y - d + 8 * scale}
            r={4 * scale}
            fill={colors.pulse}
          />
        </>
      )}
    </motion.g>
  )
}

export default IsometricBlock
