/**
 * 设备布局可视化组件
 * 用于在浑天页面展示车间设备布局优化前后的对比
 */

import { motion } from 'framer-motion'
import { useState } from 'react'

interface Device {
  id: number
  name: string
  originalPosition: [number, number]
  newPosition: [number, number]
  size: { width: number; height: number }
}

interface MovedDevice {
  deviceId: number
  distance: number
  cost: number
}

interface MaterialFlow {
  fromDeviceId: number
  toDeviceId: number
  frequency: 'high' | 'medium' | 'low'
  dailyVolume: number
}

interface HeatmapZone {
  x: number
  y: number
  width: number
  height: number
  intensity: number // 0-1
  label?: string
}

interface LayoutData {
  workshopDimensions: { length: number; width: number }
  devices: Device[]
  movedDevices: MovedDevice[]
  materialFlows?: MaterialFlow[]
  heatmapZones?: HeatmapZone[]
  originalTotalDistance?: number
  optimizedTotalDistance?: number
}

interface LayoutVisualizerProps {
  layoutData: LayoutData
  isPlaying: boolean
}

/**
 * 根据物料流频率获取样式配置
 */
const getFlowStyle = (frequency: 'high' | 'medium' | 'low') => {
  switch (frequency) {
    case 'high':
      return { color: '#ef4444', width: 4, opacity: 0.8 }
    case 'medium':
      return { color: '#f59e0b', width: 3, opacity: 0.6 }
    case 'low':
      return { color: '#22c55e', width: 2, opacity: 0.4 }
  }
}

/**
 * 根据热力图强度获取颜色（HSL 映射：黄→红）
 */
const getHeatmapColor = (intensity: number) => {
  // 从黄色 (60) 到红色 (0) 的色相变化
  const hue = 60 - intensity * 60
  return `hsl(${hue}, 80%, 50%)`
}

/**
 * 计算贝塞尔曲线路径
 */
const getBezierPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curveOffset: number = 50
) => {
  // 使用中间点作为控制点，创建平滑曲线
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  // 计算垂直偏移方向
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)

  // 垂直方向的控制点偏移
  const offsetX = (-dy / len) * curveOffset
  const offsetY = (dx / len) * curveOffset

  const ctrlX = midX + offsetX
  const ctrlY = midY + offsetY

  return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`
}

/**
 * 设备布局可视化主组件
 */
export default function LayoutVisualizer({ layoutData, isPlaying }: LayoutVisualizerProps) {
  const [showOptimized, setShowOptimized] = useState(false)

  // 当播放时自动切换到优化布局
  useState(() => {
    if (isPlaying) {
      setShowOptimized(true)
    }
  })

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 车间边界 */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          width: `${Math.min(layoutData.workshopDimensions.length, 1000)}px`,
          height: `${Math.min(layoutData.workshopDimensions.width, 600)}px`,
          background:
            'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          boxShadow: `
            0 0 0 2px rgba(59, 130, 246, 0.3),
            0 4px 20px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        {/* 四角标记 */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500/60 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500/60 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500/60 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500/60 rounded-br-lg" />

        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, #3b82f6 1px, transparent 1px),
              linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* 车间尺寸标注 */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-400 flex items-center gap-2">
          <span className="font-mono">{layoutData.workshopDimensions.length}m</span>
          <span>×</span>
          <span className="font-mono">{layoutData.workshopDimensions.width}m</span>
        </div>

        {/* 设备 */}
        {layoutData.devices.map((device) => {
          const isMoved = layoutData.movedDevices.some((m) => m.deviceId === device.id)

          return (
            <motion.div
              key={device.id}
              className={`absolute rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                isMoved ? 'bg-blue-600' : 'bg-slate-600'
              }`}
              style={{
                width: device.size.width,
                height: device.size.height,
              }}
              initial={{
                x: device.originalPosition[0],
                y: device.originalPosition[1],
              }}
              animate={{
                x: showOptimized ? device.newPosition[0] : device.originalPosition[0],
                y: showOptimized ? device.newPosition[1] : device.originalPosition[1],
              }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            >
              <div className="text-center">
                <div>{device.name}</div>
                <div className="text-[10px] opacity-70">#{device.id}</div>
              </div>
            </motion.div>
          )
        })}

        {/* 移动路径指示 */}
        {showOptimized && (
          <svg className="absolute inset-0 pointer-events-none">
            {layoutData.movedDevices.map((moved) => {
              const device = layoutData.devices.find((d) => d.id === moved.deviceId)
              if (!device) return null

              const x1 = device.originalPosition[0] + device.size.width / 2
              const y1 = device.originalPosition[1] + device.size.height / 2
              const x2 = device.newPosition[0] + device.size.width / 2
              const y2 = device.newPosition[1] + device.size.height / 2

              return (
                <g key={`path-${moved.deviceId}`}>
                  <motion.line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                  {/* 箭头 */}
                  <motion.polygon
                    points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
                    fill="#f59e0b"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ duration: 0.5, delay: 2 }}
                  />
                  {/* 距离标签 */}
                  <motion.text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 10}
                    textAnchor="middle"
                    fill="#f59e0b"
                    fontSize={10}
                    fontWeight="bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 2 }}
                  >
                    {moved.distance.toFixed(1)}m
                  </motion.text>
                </g>
              )
            })}
          </svg>
        )}

        {/* 物料流路径 */}
        {layoutData.materialFlows && layoutData.materialFlows.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
            <defs>
              {/* 流动动画 */}
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
                <animate attributeName="x1" values="-100%;100%" dur="2s" repeatCount="indefinite" />
                <animate attributeName="x2" values="0%;200%" dur="2s" repeatCount="indefinite" />
              </linearGradient>
              {/* 高频流动动画 */}
              <linearGradient id="flowGradientHigh" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
                <animate attributeName="x1" values="-100%;100%" dur="1s" repeatCount="indefinite" />
                <animate attributeName="x2" values="0%;200%" dur="1s" repeatCount="indefinite" />
              </linearGradient>
              {/* 中频流动动画 */}
              <linearGradient id="flowGradientMedium" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                <animate
                  attributeName="x1"
                  values="-100%;100%"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate attributeName="x2" values="0%;200%" dur="1.5s" repeatCount="indefinite" />
              </linearGradient>
              {/* 低频流动动画 */}
              <linearGradient id="flowGradientLow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
                <animate attributeName="x1" values="-100%;100%" dur="2s" repeatCount="indefinite" />
                <animate attributeName="x2" values="0%;200%" dur="2s" repeatCount="indefinite" />
              </linearGradient>
            </defs>
            {layoutData.materialFlows.map((flow, index) => {
              const fromDevice = layoutData.devices.find((d) => d.id === flow.fromDeviceId)
              const toDevice = layoutData.devices.find((d) => d.id === flow.toDeviceId)
              if (!fromDevice || !toDevice) return null

              // 使用优化后的位置
              const x1 =
                (showOptimized ? fromDevice.newPosition[0] : fromDevice.originalPosition[0]) +
                fromDevice.size.width / 2
              const y1 =
                (showOptimized ? fromDevice.newPosition[1] : fromDevice.originalPosition[1]) +
                fromDevice.size.height / 2
              const x2 =
                (showOptimized ? toDevice.newPosition[0] : toDevice.originalPosition[0]) +
                toDevice.size.width / 2
              const y2 =
                (showOptimized ? toDevice.newPosition[1] : toDevice.originalPosition[1]) +
                toDevice.size.height / 2

              const style = getFlowStyle(flow.frequency)
              const gradientId = `flowGradient${flow.frequency.charAt(0).toUpperCase() + flow.frequency.slice(1)}`
              const curveOffset = 30 + index * 15 // 每条曲线有不同的偏移量，避免重叠

              return (
                <g key={`flow-${flow.fromDeviceId}-${flow.toDeviceId}-${index}`}>
                  {/* 流动路径 */}
                  <motion.path
                    d={getBezierPath(x1, y1, x2, y2, curveOffset)}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={style.width}
                    fill="none"
                    opacity={style.opacity}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: style.opacity }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                  {/* 箭头 */}
                  <motion.polygon
                    points={`${x2},${y2} ${x2 - 6},${y2 - 3} ${x2 - 6},${y2 + 3}`}
                    fill={style.color}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                  />
                  {/* 日流量标签 */}
                  <motion.text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 8}
                    textAnchor="middle"
                    fill={style.color}
                    fontSize={9}
                    fontWeight="bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.9 }}
                    transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                  >
                    {flow.dailyVolume}件/日
                  </motion.text>
                </g>
              )
            })}
          </svg>
        )}

        {/* 热力图区域 */}
        {layoutData.heatmapZones && layoutData.heatmapZones.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            {layoutData.heatmapZones.map((zone, index) => (
              <motion.rect
                key={`heatmap-${index}`}
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                fill={getHeatmapColor(zone.intensity)}
                opacity={0.3 + zone.intensity * 0.4}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.3 + zone.intensity * 0.4, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                style={{
                  filter: `blur(${zone.intensity * 10}px)`,
                  transformOrigin: `${zone.x + zone.width / 2}px ${zone.y + zone.height / 2}px`,
                }}
              />
            ))}
          </svg>
        )}

        {/* 图例 */}
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-lg border border-white/10">
          <div className="text-xs text-white space-y-2">
            <div className="font-bold text-blue-400 mb-2">设备图例</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>需要移动</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-600 rounded"></div>
              <span>保持原位</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-amber-500" style={{ strokeDasharray: '5,5' }}></div>
              <span>移动路径</span>
            </div>
            {/* 物料流图例 */}
            {layoutData.materialFlows && layoutData.materialFlows.length > 0 && (
              <>
                <div className="border-t border-white/10 my-2 pt-2">
                  <div className="font-bold text-green-400 mb-2">物料流频率</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-red-500 rounded"></div>
                  <span>高频流动</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-amber-500 rounded"></div>
                  <span>中频流动</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-green-500 rounded"></div>
                  <span>低频流动</span>
                </div>
              </>
            )}
            {/* 热力图图例 */}
            {layoutData.heatmapZones && layoutData.heatmapZones.length > 0 && (
              <>
                <div className="border-t border-white/10 my-2 pt-2">
                  <div className="font-bold text-orange-400 mb-2">热力图强度</div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-3 rounded"
                    style={{
                      background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444)',
                    }}
                  ></div>
                  <span>低 → 高</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-lg border border-white/10">
          <div className="text-xs text-white space-y-1">
            <div className="font-bold text-blue-400 mb-2">优化统计</div>
            <div>移动设备数: {layoutData.movedDevices.length}</div>
            <div>
              总移动距离:{' '}
              {layoutData.movedDevices.reduce((sum, m) => sum + m.distance, 0).toFixed(1)}m
            </div>
            <div>
              总成本: ¥
              {layoutData.movedDevices.reduce((sum, m) => sum + m.cost, 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 搬运距离对比面板 */}
        {layoutData.originalTotalDistance !== undefined &&
          layoutData.optimizedTotalDistance !== undefined && (
            <motion.div
              className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-lg border border-white/10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-xs text-white space-y-3">
                <div className="font-bold text-blue-400">搬运距离对比</div>
                {/* 原始距离柱状图 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">原始布局</span>
                    <span className="font-mono">
                      {layoutData.originalTotalDistance.toFixed(0)}m
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-red-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
                {/* 优化后距离柱状图 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">优化后</span>
                    <span className="font-mono text-green-400">
                      {layoutData.optimizedTotalDistance.toFixed(0)}m
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(layoutData.optimizedTotalDistance / layoutData.originalTotalDistance) * 100}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                </div>
                {/* 优化效果 */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">减少量</span>
                    <span className="font-mono text-green-400">
                      -
                      {(
                        layoutData.originalTotalDistance - layoutData.optimizedTotalDistance
                      ).toFixed(0)}
                      m
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">优化率</span>
                    <motion.span
                      className="font-mono text-green-400 font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      {(
                        ((layoutData.originalTotalDistance - layoutData.optimizedTotalDistance) /
                          layoutData.originalTotalDistance) *
                        100
                      ).toFixed(1)}
                      %
                    </motion.span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </div>

      {/* 控制按钮 */}
      <button
        onClick={() => setShowOptimized(!showOptimized)}
        className="absolute bottom-8 right-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all"
      >
        {showOptimized ? '显示原始布局' : '显示优化布局'}
      </button>
    </div>
  )
}
