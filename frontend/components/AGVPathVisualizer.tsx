/**
 * AGV 路径可视化组件
 * 用于在浑天页面展示 AGV 调度路径优化的��程和结果
 */

import { motion } from 'framer-motion'
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AGVPerformancePanel from './AGVPerformancePanel'

interface Station {
  id: number
  name: string
  position: [number, number]
  utilization?: number // 0-100
  status?: 'busy' | 'idle' | 'blocked'
  type?: 'loading' | 'unloading' | 'processing' | 'storage'
}

interface AGVTask {
  from: number
  to: number
  startTime: number
  endTime: number
  type?: 'pickup' | 'transport' | 'unload' | 'idle'
  status?: 'pending' | 'in_progress' | 'completed'
}

interface AGVRoute {
  agvId: number
  route: Array<[number, number]>
  completionTime: number
  tasks: AGVTask[]
}

interface ConflictPoint {
  id: string
  position: [number, number]
  time: number
  severity: 'warning' | 'critical'
  involvedAGVs: number[]
  resolution?: string
}

interface TimelineMarker {
  time: number
  label: string
  type: 'task' | 'conflict' | 'milestone'
}

interface AGVPathVisualizerProps {
  stations: Station[]
  routes: AGVRoute[]
  isPlaying: boolean
  speed: number
  canvasWidth?: number
  canvasHeight?: number
  conflictPoints?: ConflictPoint[]
  timelineMarkers?: TimelineMarker[]
  onTimeChange?: (time: number) => void
  showPerformancePanel?: boolean
  highlightRouteIds?: string[]
  onFocusResources?: (selection: { agvRouteIds?: string[] }) => void
}

// AGV 颜色配置
const AGV_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// 任务类型图标和颜色
const TASK_STYLES: Record<string, { icon: string; color: string; bgColor: string }> = {
  pickup: { icon: '📦', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.2)' },
  transport: { icon: '🚚', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.2)' },
  unload: { icon: '📥', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.2)' },
  idle: { icon: '⏸️', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.2)' },
}

// 工位状态颜色
const STATION_STATUS_COLORS: Record<string, string> = {
  busy: '#ef4444',
  idle: '#3b82f6',
  blocked: '#f59e0b',
}

// 工位类型图标
const STATION_TYPE_ICONS: Record<string, string> = {
  loading: '📤',
  unloading: '📥',
  processing: '⚙️',
  storage: '🏪',
}

const normalizeResourceId = (id: string): string =>
  id
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')

const createRouteTokens = (agvId: number): string[] => {
  const id = String(agvId)
  return [`agv${id}`, `r${id}`, `route${id}`, id]
}

/**
 * 时间轴控制组件
 */
const TimelineControl: React.FC<{
  duration: number
  currentTime: number
  markers: TimelineMarker[]
  onSeek: (time: number) => void
  onPlayPause: () => void
  isPlaying: boolean
  speed: number
  onSpeedChange: (speed: number) => void
}> = ({ duration, currentTime, markers, onSeek, onPlayPause, isPlaying, speed, onSpeedChange }) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md p-4 rounded-t-xl border-t border-white/10">
      {/* 时间标记点 */}
      <div className="relative h-2 mb-2">
        {markers.map((marker) => {
          const markerPosition = duration > 0 ? (marker.time / duration) * 100 : 0
          const markerColors: Record<string, string> = {
            task: '#3b82f6',
            conflict: '#ef4444',
            milestone: '#22c55e',
          }
          return (
            <div
              key={`marker-${marker.type}-${marker.time}-${marker.label}`}
              className="absolute top-0 w-1 h-full cursor-pointer group"
              style={{ left: `${markerPosition}%` }}
              title={marker.label}
            >
              <div
                className="w-1 h-full rounded"
                style={{ backgroundColor: markerColors[marker.type] }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {marker.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* 进度条 */}
      <button
        type="button"
        className="relative h-2 w-full bg-slate-700 rounded-full cursor-pointer group"
        onClick={(e) => {
          if (duration <= 0) return
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          const percentage = x / rect.width
          onSeek(percentage * duration)
        }}
      >
        <motion.div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-grab"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </button>

      {/* 控制按钮 */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            onClick={onPlayPause}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            type="button"
            onClick={() => onSeek(duration)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">速度:</span>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                speed === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 任务状态指示器组件
 */
const TaskStatusIndicator: React.FC<{
  task: AGVTask
  currentTime: number
  position: [number, number]
}> = ({ task, currentTime, position }) => {
  const isActive = currentTime >= task.startTime && currentTime <= task.endTime
  const isCompleted = currentTime > task.endTime
  const taskType = task.type || 'transport'
  const style = TASK_STYLES[taskType]

  if (!isActive && !isCompleted) return null

  return (
    <g>
      {/* 任务状态圆环 */}
      <circle
        cx={position[0]}
        cy={position[1]}
        r={20}
        fill={style.bgColor}
        stroke={style.color}
        strokeWidth={2}
        strokeDasharray={isCompleted ? 'none' : '5,3'}
        opacity={isActive ? 1 : 0.5}
      />
      {/* 任务类型图标 */}
      <text x={position[0]} y={position[1]} textAnchor="middle" dy=".3em" fontSize={14}>
        {style.icon}
      </text>
      {/* 完成标记 */}
      {isCompleted && (
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          <circle cx={position[0] + 12} cy={position[1] - 12} r={6} fill="#22c55e" />
          <text
            x={position[0] + 12}
            y={position[1] - 12}
            textAnchor="middle"
            dy=".3em"
            fontSize={8}
            fill="white"
          >
            ✓
          </text>
        </motion.g>
      )}
    </g>
  )
}

/**
 * 冲突检测点高亮组件
 */
const ConflictHighlight: React.FC<{
  conflict: ConflictPoint
  currentTime: number
}> = ({ conflict, currentTime }) => {
  // 只在冲突时间点前后显示
  const timeDiff = Math.abs(currentTime - conflict.time)
  if (timeDiff > 5) return null

  const isActive = timeDiff < 1
  const isWarning = conflict.severity === 'warning'
  const color = isWarning ? '#f59e0b' : '#ef4444'

  return (
    <g>
      {/* 预警圈动画 */}
      <motion.circle
        cx={conflict.position[0]}
        cy={conflict.position[1]}
        r={isActive ? 30 : 20}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 3 : 2}
        strokeDasharray="5,5"
        initial={{ opacity: 0.3, scale: 0.8 }}
        animate={{
          opacity: isActive ? [0.5, 1, 0.5] : 0.5,
          scale: isActive ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 1,
          repeat: Number.POSITIVE_INFINITY,
        }}
      />
      {/* 中心标记 */}
      <circle
        cx={conflict.position[0]}
        cy={conflict.position[1]}
        r={8}
        fill={color}
        opacity={0.8}
      />
      {/* 感叹号 */}
      <text
        x={conflict.position[0]}
        y={conflict.position[1]}
        textAnchor="middle"
        dy=".3em"
        fill="white"
        fontSize={10}
        fontWeight="bold"
      >
        !
      </text>
      {/* 冲突信息标签 */}
      {isActive && (
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <rect
            x={conflict.position[0] - 60}
            y={conflict.position[1] + 40}
            width={120}
            height={isWarning ? 24 : 44}
            rx={4}
            fill="rgba(0, 0, 0, 0.8)"
          />
          <text
            x={conflict.position[0]}
            y={conflict.position[1] + 55}
            textAnchor="middle"
            fill={color}
            fontSize={10}
            fontWeight="bold"
          >
            {isWarning ? '⚠️ 潜在冲突' : '🚨 冲突警告'}
          </text>
          {!isWarning && (
            <>
              <text
                x={conflict.position[0]}
                y={conflict.position[1] + 70}
                textAnchor="middle"
                fill="white"
                fontSize={8}
              >
                AGV: {conflict.involvedAGVs.join(', ')}
              </text>
              {conflict.resolution && (
                <text
                  x={conflict.position[0]}
                  y={conflict.position[1] + 80}
                  textAnchor="middle"
                  fill="#22c55e"
                  fontSize={8}
                >
                  {conflict.resolution}
                </text>
              )}
            </>
          )}
        </motion.g>
      )}
    </g>
  )
}

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
const _AGVIcon: React.FC<{
  route: Array<[number, number]>
  color: string
  isPlaying: boolean
  speed: number
  completionTime: number
  agvId: number
}> = ({ route, color, isPlaying, speed, completionTime, agvId }) => {
  const [currentPosition, setCurrentPosition] = useState(route[0])
  const [_progress, setProgress] = useState(0)

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
  isPlaying: externalIsPlaying,
  speed: externalSpeed,
  canvasWidth = 1200,
  canvasHeight = 800,
  conflictPoints = [],
  timelineMarkers = [],
  onTimeChange,
  showPerformancePanel = true,
  highlightRouteIds = [],
  onFocusResources,
}: AGVPathVisualizerProps) {
  // 内部状态管理
  const [isPlaying, setIsPlaying] = useState(externalIsPlaying)
  const [speed, setSpeed] = useState(externalSpeed)
  const [currentTime, setCurrentTime] = useState(0)
  const highlightRouteSet = useMemo(
    () => new Set(highlightRouteIds.map(normalizeResourceId).filter(Boolean)),
    [highlightRouteIds]
  )
  const hasRouteHighlights = highlightRouteSet.size > 0

  // 计算总时长
  const totalDuration = Math.max(...routes.map((r) => r.completionTime), 0)

  // 计算性能指标
  const calculatePerformanceMetrics = () => {
    // 总完工时间
    const totalCompletionTime = totalDuration

    // 瓶颈利用率（最忙碌工位的利用率）
    const bottleneckUtilization =
      stations.length > 0 ? Math.max(...stations.map((s) => s.utilization ?? 0)) : 0

    // 吞吐量（基于任务完成情况估算）
    const totalTasks = routes.reduce((sum, r) => sum + r.tasks.length, 0)
    const throughput = totalDuration > 0 ? (totalTasks / totalDuration) * 3600 : 0

    // AGV 平均利用率
    const avgAGVUtilization = routes.length > 0 ? (currentTime / totalDuration) * 100 : 0

    // 冲突次数
    const conflictCount = conflictPoints.length

    // 整体效率（综合指标）
    const overallEfficiency = Math.min(
      100,
      (100 - bottleneckUtilization * 0.3) * (1 - conflictCount * 0.05)
    )

    return {
      totalCompletionTime,
      bottleneckUtilization,
      throughput,
      avgAGVUtilization,
      conflictCount,
      overallEfficiency,
    }
  }

  const performanceMetrics = calculatePerformanceMetrics()

  // 时间更新
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1 * speed
        if (next >= totalDuration) {
          setIsPlaying(false)
          return totalDuration
        }
        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, speed, totalDuration])

  // 同步外部播放状态
  useEffect(() => {
    setIsPlaying(externalIsPlaying)
  }, [externalIsPlaying])

  useEffect(() => {
    setSpeed(externalSpeed)
  }, [externalSpeed])

  // 时间变化回调
  useEffect(() => {
    onTimeChange?.(currentTime)
  }, [currentTime, onTimeChange])

  const handleSeek = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, totalDuration)))
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
  }

  // 计算每个AGV在当前时间的位置
  const getAGVPosition = (route: AGVRoute): [number, number] => {
    const progress = currentTime / route.completionTime
    if (progress >= 1) return route.route[route.route.length - 1]
    if (progress <= 0) return route.route[0]

    const totalSegments = route.route.length - 1
    const currentSegment = Math.floor(progress * totalSegments)
    const segmentProgress = (progress * totalSegments) % 1

    if (currentSegment < totalSegments) {
      const start = route.route[currentSegment]
      const end = route.route[currentSegment + 1]
      return [
        start[0] + (end[0] - start[0]) * segmentProgress,
        start[1] + (end[1] - start[1]) * segmentProgress,
      ]
    }
    return route.route[route.route.length - 1]
  }

  // 获取当前时间活跃的任务
  const getActiveTasks = () => {
    const tasks: Array<{ task: AGVTask; position: [number, number]; agvId: number }> = []
    for (const route of routes) {
      for (const task of route.tasks) {
        if (currentTime >= task.startTime && currentTime <= task.endTime) {
          // 找到任务对应的位置
          const fromStation = stations.find((s) => s.id === task.from)
          const toStation = stations.find((s) => s.id === task.to)
          if (fromStation && toStation) {
            const taskProgress = (currentTime - task.startTime) / (task.endTime - task.startTime)
            const position: [number, number] = [
              fromStation.position[0] +
                (toStation.position[0] - fromStation.position[0]) * taskProgress,
              fromStation.position[1] +
                (toStation.position[1] - fromStation.position[1]) * taskProgress,
            ]
            tasks.push({ task, position, agvId: route.agvId })
          }
        }
      }
    }
    return tasks
  }

  return (
    <div className="relative w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${canvasWidth} ${canvasHeight - 80}`}
        className="absolute inset-0"
        style={{ background: 'transparent' }}
      >
        <title>AGV路径可视化</title>
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
          const highlighted = createRouteTokens(route.agvId).some((token) =>
            highlightRouteSet.has(token)
          )
          const routeOpacity = hasRouteHighlights ? (highlighted ? 0.95 : 0.2) : 0.6
          return (
            <motion.path
              key={`route-${route.agvId}`}
              d={generatePathD(route.route)}
              stroke={color}
              strokeWidth={highlighted ? 5 : 3}
              fill="none"
              strokeDasharray="10,5"
              opacity={routeOpacity}
              style={{ cursor: 'pointer' }}
              onClick={() =>
                onFocusResources?.({ agvRouteIds: [`AGV-${route.agvId}`, `R${route.agvId}`] })
              }
              initial={{ pathLength: 0 }}
              animate={{ pathLength: isPlaying ? 1 : 0 }}
              transition={{
                duration: route.completionTime / speed,
                ease: 'linear',
              }}
            />
          )
        })}

        {/* 工位节点（增强版 - 含利用率显示） */}
        {stations.map((station) => {
          const statusColor = station.status ? STATION_STATUS_COLORS[station.status] : '#3b82f6'
          const utilization = station.utilization ?? 0
          const circumference = 2 * Math.PI * 28
          const strokeDashoffset = circumference - (utilization / 100) * circumference

          return (
            <g key={`station-${station.id}`}>
              {/* 利用率环 */}
              {station.utilization !== undefined && (
                <circle
                  cx={station.position[0]}
                  cy={station.position[1]}
                  r={28}
                  fill="none"
                  stroke="rgba(100, 116, 139, 0.3)"
                  strokeWidth={4}
                />
              )}
              {station.utilization !== undefined && (
                <motion.circle
                  cx={station.position[0]}
                  cy={station.position[1]}
                  r={28}
                  fill="none"
                  stroke={statusColor}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: `${station.position[0]}px ${station.position[1]}px`,
                  }}
                />
              )}
              {/* 工位圆圈 */}
              <circle
                cx={station.position[0]}
                cy={station.position[1]}
                r={24}
                fill={`${statusColor}20`}
                stroke={statusColor}
                strokeWidth={2}
              />
              {/* 工位类型图标 */}
              {station.type && (
                <text
                  x={station.position[0]}
                  y={station.position[1] - 4}
                  textAnchor="middle"
                  fontSize={10}
                >
                  {STATION_TYPE_ICONS[station.type]}
                </text>
              )}
              {/* 工位名称 */}
              <text
                x={station.position[0]}
                y={station.position[1] + (station.type ? 8 : 4)}
                textAnchor="middle"
                dy=".3em"
                fill="white"
                fontSize={station.type ? 8 : 10}
                fontWeight="bold"
              >
                {station.name}
              </text>
              {/* 利用率百分比 */}
              {station.utilization !== undefined && (
                <text
                  x={station.position[0]}
                  y={station.position[1] + 42}
                  textAnchor="middle"
                  fill={statusColor}
                  fontSize={9}
                  fontWeight="bold"
                >
                  {utilization}%
                </text>
              )}
              {/* 工位编号 */}
              <text
                x={station.position[0]}
                y={station.position[1] + (station.utilization !== undefined ? 55 : 42)}
                textAnchor="middle"
                fill="rgba(255, 255, 255, 0.5)"
                fontSize={10}
              >
                #{station.id}
              </text>
              {/* 状态标签 */}
              {station.status && (
                <rect
                  x={station.position[0] - 20}
                  y={station.position[1] - 45}
                  width={40}
                  height={16}
                  rx={4}
                  fill={statusColor}
                  opacity={0.8}
                />
              )}
              {station.status && (
                <text
                  x={station.position[0]}
                  y={station.position[1] - 35}
                  textAnchor="middle"
                  fill="white"
                  fontSize={8}
                  fontWeight="bold"
                >
                  {station.status === 'busy' ? '忙碌' : station.status === 'idle' ? '空闲' : '阻塞'}
                </text>
              )}
            </g>
          )
        })}

        {/* 冲突检测点 */}
        {conflictPoints.map((conflict) => (
          <ConflictHighlight key={conflict.id} conflict={conflict} currentTime={currentTime} />
        ))}

        {/* 任务状态指示器 */}
        {getActiveTasks().map(({ task, position, agvId }) => (
          <TaskStatusIndicator
            key={`task-${agvId}-${task.from}-${task.to}-${task.startTime}-${task.endTime}`}
            task={task}
            currentTime={currentTime}
            position={position}
          />
        ))}

        {/* AGV 小车 */}
        {routes.map((route, index) => {
          const color = AGV_COLORS[index % AGV_COLORS.length]
          const position = getAGVPosition(route)
          const highlighted = createRouteTokens(route.agvId).some((token) =>
            highlightRouteSet.has(token)
          )
          const agvOpacity = hasRouteHighlights ? (highlighted ? 1 : 0.25) : 1
          return (
            <g key={`agv-${route.agvId}`} opacity={agvOpacity}>
              {/* AGV 小车主体 */}
              <circle
                cx={position[0]}
                cy={position[1]}
                r={12}
                fill={color}
                className="drop-shadow-lg"
              />
              {/* AGV 编号 */}
              <text
                x={position[0]}
                y={position[1]}
                textAnchor="middle"
                dy=".3em"
                fill="white"
                fontSize={10}
                fontWeight="bold"
              >
                {route.agvId}
              </text>
              {/* 方向指示器 */}
              <circle cx={position[0]} cy={position[1] - 18} r={3} fill={color} opacity={0.6} />
            </g>
          )
        })}
      </svg>

      {/* 时间轴控制组件 */}
      <TimelineControl
        duration={totalDuration}
        currentTime={currentTime}
        markers={timelineMarkers}
        onSeek={handleSeek}
        onPlayPause={handlePlayPause}
        isPlaying={isPlaying}
        speed={speed}
        onSpeedChange={handleSpeedChange}
      />

      {/* 性能指标面板 */}
      {showPerformancePanel && (
        <AGVPerformancePanel
          metrics={performanceMetrics}
          currentTime={currentTime}
          isPlaying={isPlaying}
        />
      )}
    </div>
  )
}
