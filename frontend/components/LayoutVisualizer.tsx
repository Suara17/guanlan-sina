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

interface LayoutData {
  workshopDimensions: { length: number; width: number }
  devices: Device[]
  movedDevices: MovedDevice[]
}

interface LayoutVisualizerProps {
  layoutData: LayoutData
  isPlaying: boolean
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
        className="relative border-2 border-blue-500/30 bg-slate-900/20 rounded-lg"
        style={{
          width: `${Math.min(layoutData.workshopDimensions.length, 1000)}px`,
          height: `${Math.min(layoutData.workshopDimensions.width, 600)}px`,
        }}
      >
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

        {/* 图例 */}
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-lg border border-white/10">
          <div className="text-xs text-white space-y-2">
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
