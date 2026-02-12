/**
 * AGV 路径可视化组件
 * 用于在浑天页面展示 AGV 调度路径优化的过程和结果
 */

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Station {
  id: number
  name: string
  position: [number, number]
}

interface AGVRoute {
  agvId: number
  route: Array<[number, number]>
  completionTime: number
  tasks: Array<{
    from: number
    to: number
    startTime: number
    endTime: number
  }>
}

interface AGVPathVisualizerProps {
  stations: Station[]
  routes: AGVRoute[]
  isPlaying: boolean
  speed: number
  canvasWidth?: number
  canvasHeight?: number
}

// AGV 颜色配置
const AGV_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

/**
 * 生成 SVG 路径字符串（使用贝塞尔曲线平滑）
 */
const generatePathD = (points: Array<[number, number]>): string => {
  if (points.length < 2) return ''

  let path = `M ${points[0][0]} ${points[0][1]}`

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    if (next) {
      // 使用二次贝塞尔曲线平滑路径
      const cp1x = prev[0] + (curr[0] - prev[0]) * 0.5
      const cp1y = prev[1] + (curr[1] - prev[1]) * 0.5
      path += ` Q ${cp1x} ${cp1y} ${curr[0]} ${curr[1]}`
    } else {
      path += ` L ${curr[0]} ${curr[1]}`
    }
  }

  return path
}

/**
 * AGV 图标组件
 */
const AGVIcon: React.FC<{
  route: Array<[number, number]>
  color: string
  isPlaying: boolean
  speed: number
  completionTime: number
  agvId: number
}> = ({ route, color, isPlaying, speed, completionTime, agvId }) => {
  const [currentPosition, setCurrentPosition] = useState(route[0])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isPlaying) {
      setProgress(0)
      setCurrentPosition(route[0])
      return
    }

    const startTime = Date.now()
    const duration = (completionTime / speed) * 1000 // 转换为毫秒

    const animate = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / duration, 1)
      setProgress(newProgress)

      // 根据进度计算当前位置
      const totalSegments = route.length - 1
      const currentSegment = Math.floor(newProgress * totalSegments)
      const segmentProgress = (newProgress * totalSegments) % 1

      if (currentSegment < totalSegments) {
        const start = route[currentSegment]
        const end = route[currentSegment + 1]
        const x = start[0] + (end[0] - start[0]) * segmentProgress
        const y = start[1] + (end[1] - start[1]) * segmentProgress
        setCurrentPosition([x, y])
      }

      if (newProgress < 1) {
        requestAnimationFrame(animate)
      }
    }

    const animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isPlaying, speed, completionTime, route])

  return (
    <g>
      {/* AGV 小车主体 */}
      <circle
        cx={currentPosition[0]}
        cy={currentPosition[1]}
        r={12}
        fill={color}
        className="drop-shadow-lg"
      />
      {/* AGV 编号 */}
      <text
        x={currentPosition[0]}
        y={currentPosition[1]}
        textAnchor="middle"
        dy=".3em"
        fill="white"
        fontSize={10}
        fontWeight="bold"
      >
        {agvId}
      </text>
      {/* 方向指示器 */}
      <circle
        cx={currentPosition[0]}
        cy={currentPosition[1] - 18}
        r={3}
        fill={color}
        opacity={0.6}
      />
    </g>
  )
}

/**
 * AGV 路径可视化主组件
 */
export default function AGVPathVisualizer({
  stations,
  routes,
  isPlaying,
  speed,
  canvasWidth = 1200,
  canvasHeight = 800,
}: AGVPathVisualizerProps) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      className="absolute inset-0"
      style={{ background: 'transparent' }}
    >
      {/* 背景网格 */}
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke="rgba(59, 130, 246, 0.1)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* AGV 路径线 */}
      {routes.map((route, index) => {
        const color = AGV_COLORS[index % AGV_COLORS.length]
        return (
          <motion.path
            key={`route-${route.agvId}`}
            d={generatePathD(route.route)}
            stroke={color}
            strokeWidth={3}
            fill="none"
            strokeDasharray="10,5"
            opacity={0.6}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: isPlaying ? 1 : 0 }}
            transition={{
              duration: route.completionTime / speed,
              ease: 'linear',
            }}
          />
        )
      })}

      {/* 工位节点 */}
      {stations.map((station) => (
        <g key={`station-${station.id}`}>
          {/* 工位圆圈 */}
          <circle
            cx={station.position[0]}
            cy={station.position[1]}
            r={30}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth={2}
          />
          {/* 工位名称 */}
          <text
            x={station.position[0]}
            y={station.position[1]}
            textAnchor="middle"
            dy=".3em"
            fill="white"
            fontSize={12}
            fontWeight="bold"
          >
            {station.name}
          </text>
          {/* 工位编号 */}
          <text
            x={station.position[0]}
            y={station.position[1] + 45}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.5)"
            fontSize={10}
          >
            #{station.id}
          </text>
        </g>
      ))}

      {/* AGV 小车 */}
      {routes.map((route, index) => {
        const color = AGV_COLORS[index % AGV_COLORS.length]
        return (
          <AGVIcon
            key={`agv-${route.agvId}`}
            route={route.route}
            color={color}
            isPlaying={isPlaying}
            speed={speed}
            completionTime={route.completionTime}
            agvId={route.agvId}
          />
        )
      })}
    </svg>
  )
}
