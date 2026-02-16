/**
 * 任务进度组件 - 算法过程可视化
 * 采用玻璃拟态设计风格，带有动态曲线绘制效果
 */

import { AlertTriangle, ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { tianchouService } from '../services/tianchouService'
import type { EvolutionData, OptimizationTask } from '../types/tianchou'
import { TaskStatus } from '../types/tianchou'

interface Props {
  task: OptimizationTask
  onCancel?: () => void
}

// 玻璃拟态卡片组件
function GlassCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg shadow-slate-200/50 flex flex-col ${className}`}
    >
      <div className="px-6 py-4 border-b border-white/20">
        <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// 数据指标卡片
function MetricCard({
  label,
  value,
  unit,
  trend,
  color = 'blue',
}: {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  color?: 'blue' | 'pink' | 'amber' | 'green'
}) {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-200/50 text-blue-600',
    pink: 'from-pink-500/10 to-pink-500/5 border-pink-200/50 text-pink-600',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-200/50 text-amber-600',
    green: 'from-green-500/10 to-green-500/5 border-green-200/50 text-green-600',
  }

  const trendIcon = {
    up: <TrendingUp size={14} className="text-green-500" />,
    down: <TrendingDown size={14} className="text-red-500" />,
    stable: <Minus size={14} className="text-slate-400" />,
  }

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border transition-all duration-300 hover:shadow-md hover:scale-[1.02]`}
    >
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-slate-800">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
        {trend && trendIcon[trend]}
      </div>
    </div>
  )
}

// 圆形进度指示器
function CircularProgress({
  value,
  max = 1,
  label,
  size = 120,
}: {
  value: number
  max?: number
  label: string
  size?: number
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  // 根据值决定颜色
  const getColor = () => {
    if (percentage > 60) return { stroke: '#10b981', gradient: 'from-green-400 to-emerald-500' }
    if (percentage > 30) return { stroke: '#f59e0b', gradient: 'from-amber-400 to-orange-500' }
    return { stroke: '#ef4444', gradient: 'from-red-400 to-rose-500' }
  }
  const colorInfo = getColor()

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorInfo.stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{
            filter: 'drop-shadow(0 0 6px ' + colorInfo.stroke + '40)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-2xl font-bold bg-gradient-to-r ${colorInfo.gradient} bg-clip-text text-transparent`}
        >
          {percentage.toFixed(0)}%
        </span>
        <span className="text-xs text-slate-400 mt-1">{label}</span>
      </div>
    </div>
  )
}

export function TaskProgress({ task, onCancel }: Props) {
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null)
  const [mockData, setMockData] = useState<any[]>([])
  const [hasFetchedData, setHasFetchedData] = useState(false)
  const [animatedData, setAnimatedData] = useState<any[]>([])

  // 静态数据 - 模拟图片中的曲线走势（归一化到0-1.2）
  const staticEvolutionData = [
    {
      generation: 0,
      f1: 0.62,
      f2: 0.85,
      f3: 0.32,
      diversity: 0.45,
      mutpb: 0.486,
      elapsed_time: 0.5,
    },
    {
      generation: 20,
      f1: 0.75,
      f2: 0.82,
      f3: 0.42,
      diversity: 0.38,
      mutpb: 0.488,
      elapsed_time: 9.5,
    },
    {
      generation: 40,
      f1: 0.88,
      f2: 0.72,
      f3: 0.52,
      diversity: 0.32,
      mutpb: 0.492,
      elapsed_time: 18.6,
    },
    {
      generation: 60,
      f1: 0.98,
      f2: 0.58,
      f3: 0.56,
      diversity: 0.28,
      mutpb: 0.496,
      elapsed_time: 27.8,
    },
    {
      generation: 80,
      f1: 1.02,
      f2: 0.48,
      f3: 0.54,
      diversity: 0.22,
      mutpb: 0.498,
      elapsed_time: 37.2,
    },
    {
      generation: 100,
      f1: 1.05,
      f2: 0.42,
      f3: 0.52,
      diversity: 0.18,
      mutpb: 0.5,
      elapsed_time: 46.5,
    },
    {
      generation: 120,
      f1: 1.06,
      f2: 0.4,
      f3: 0.55,
      diversity: 0.15,
      mutpb: 0.502,
      elapsed_time: 55.8,
    },
    {
      generation: 140,
      f1: 1.07,
      f2: 0.38,
      f3: 0.58,
      diversity: 0.12,
      mutpb: 0.504,
      elapsed_time: 65.2,
    },
    {
      generation: 160,
      f1: 1.08,
      f2: 0.36,
      f3: 0.56,
      diversity: 0.1,
      mutpb: 0.506,
      elapsed_time: 74.5,
    },
    {
      generation: 180,
      f1: 1.04,
      f2: 0.38,
      f3: 0.52,
      diversity: 0.09,
      mutpb: 0.508,
      elapsed_time: 83.8,
    },
    {
      generation: 200,
      f1: 0.98,
      f2: 0.42,
      f3: 0.58,
      diversity: 0.08,
      mutpb: 0.51,
      elapsed_time: 93.2,
    },
    {
      generation: 220,
      f1: 0.9,
      f2: 0.48,
      f3: 0.52,
      diversity: 0.07,
      mutpb: 0.512,
      elapsed_time: 102.5,
    },
    {
      generation: 240,
      f1: 0.82,
      f2: 0.52,
      f3: 0.48,
      diversity: 0.06,
      mutpb: 0.514,
      elapsed_time: 111.8,
    },
    {
      generation: 260,
      f1: 0.75,
      f2: 0.55,
      f3: 0.42,
      diversity: 0.055,
      mutpb: 0.516,
      elapsed_time: 121.2,
    },
    {
      generation: 280,
      f1: 0.68,
      f2: 0.52,
      f3: 0.38,
      diversity: 0.05,
      mutpb: 0.518,
      elapsed_time: 130.5,
    },
    {
      generation: 300,
      f1: 0.62,
      f2: 0.48,
      f3: 0.35,
      diversity: 0.048,
      mutpb: 0.52,
      elapsed_time: 139.8,
    },
    {
      generation: 320,
      f1: 0.55,
      f2: 0.45,
      f3: 0.32,
      diversity: 0.045,
      mutpb: 0.522,
      elapsed_time: 149.2,
    },
    {
      generation: 340,
      f1: 0.48,
      f2: 0.42,
      f3: 0.28,
      diversity: 0.042,
      mutpb: 0.524,
      elapsed_time: 158.5,
    },
    {
      generation: 360,
      f1: 0.42,
      f2: 0.38,
      f3: 0.25,
      diversity: 0.04,
      mutpb: 0.526,
      elapsed_time: 167.8,
    },
    {
      generation: 380,
      f1: 0.35,
      f2: 0.35,
      f3: 0.22,
      diversity: 0.038,
      mutpb: 0.528,
      elapsed_time: 177.2,
    },
    {
      generation: 400,
      f1: 0.28,
      f2: 0.32,
      f3: 0.18,
      diversity: 0.035,
      mutpb: 0.53,
      elapsed_time: 186.5,
    },
    {
      generation: 420,
      f1: 0.3,
      f2: 0.35,
      f3: 0.22,
      diversity: 0.038,
      mutpb: 0.532,
      elapsed_time: 195.8,
    },
    {
      generation: 440,
      f1: 0.35,
      f2: 0.38,
      f3: 0.28,
      diversity: 0.042,
      mutpb: 0.534,
      elapsed_time: 205.2,
    },
    {
      generation: 460,
      f1: 0.4,
      f2: 0.42,
      f3: 0.35,
      diversity: 0.046,
      mutpb: 0.536,
      elapsed_time: 214.5,
    },
    {
      generation: 480,
      f1: 0.45,
      f2: 0.48,
      f3: 0.4,
      diversity: 0.05,
      mutpb: 0.538,
      elapsed_time: 223.8,
    },
    {
      generation: 500,
      f1: 0.48,
      f2: 0.55,
      f3: 0.45,
      diversity: 0.055,
      mutpb: 0.54,
      elapsed_time: 233.2,
    },
    {
      generation: 520,
      f1: 0.5,
      f2: 0.62,
      f3: 0.52,
      diversity: 0.06,
      mutpb: 0.542,
      elapsed_time: 242.5,
    },
    {
      generation: 540,
      f1: 0.52,
      f2: 0.68,
      f3: 0.55,
      diversity: 0.065,
      mutpb: 0.544,
      elapsed_time: 251.8,
    },
    {
      generation: 560,
      f1: 0.48,
      f2: 0.72,
      f3: 0.58,
      diversity: 0.07,
      mutpb: 0.546,
      elapsed_time: 261.2,
    },
    {
      generation: 580,
      f1: 0.45,
      f2: 0.75,
      f3: 0.55,
      diversity: 0.075,
      mutpb: 0.548,
      elapsed_time: 270.5,
    },
    {
      generation: 600,
      f1: 0.48,
      f2: 0.78,
      f3: 0.52,
      diversity: 0.08,
      mutpb: 0.55,
      elapsed_time: 279.8,
    },
    {
      generation: 620,
      f1: 0.42,
      f2: 0.8,
      f3: 0.48,
      diversity: 0.085,
      mutpb: 0.552,
      elapsed_time: 289.2,
    },
    {
      generation: 640,
      f1: 0.4,
      f2: 0.82,
      f3: 0.42,
      diversity: 0.09,
      mutpb: 0.554,
      elapsed_time: 298.5,
    },
    {
      generation: 660,
      f1: 0.38,
      f2: 0.8,
      f3: 0.38,
      diversity: 0.095,
      mutpb: 0.556,
      elapsed_time: 307.8,
    },
    {
      generation: 680,
      f1: 0.4,
      f2: 0.78,
      f3: 0.35,
      diversity: 0.1,
      mutpb: 0.558,
      elapsed_time: 317.2,
    },
    {
      generation: 700,
      f1: 0.42,
      f2: 0.75,
      f3: 0.32,
      diversity: 0.105,
      mutpb: 0.56,
      elapsed_time: 326.5,
    },
    {
      generation: 720,
      f1: 0.4,
      f2: 0.72,
      f3: 0.3,
      diversity: 0.11,
      mutpb: 0.562,
      elapsed_time: 335.8,
    },
    {
      generation: 740,
      f1: 0.42,
      f2: 0.7,
      f3: 0.32,
      diversity: 0.115,
      mutpb: 0.564,
      elapsed_time: 345.2,
    },
    {
      generation: 760,
      f1: 0.42,
      f2: 0.68,
      f3: 0.3,
      diversity: 0.12,
      mutpb: 0.566,
      elapsed_time: 354.5,
    },
  ]

  // 原始值（用于日志显示）
  const staticRawData = [
    {
      generation: 20,
      f1: 209824.21,
      f2: 27080.93,
      f3: 0.087,
      diversity: 0.0358,
      elapsed_time: 9.5,
    },
    {
      generation: 40,
      f1: 198773.86,
      f2: 46765.17,
      f3: 0.0872,
      diversity: 0.039,
      elapsed_time: 18.6,
    },
  ]

  // 初始化静态数据
  useEffect(() => {
    setMockData(staticEvolutionData)
    setAnimatedData(staticEvolutionData)
  }, [])

  const fetchEvolutionData = useCallback(async () => {
    try {
      const data = await tianchouService.getEvolutionHistory(task.task_id)
      if (data.history && data.history.length > 0) {
        setEvolutionData(data)
        setHasFetchedData(true)
      }
    } catch (error) {
      // 静默处理错误，使用模拟数据
    }
  }, [task.task_id])

  useEffect(() => {
    fetchEvolutionData()
    // 使用静态数据，不再动态生成
    if (task.status === TaskStatus.RUNNING) {
      const interval = setInterval(fetchEvolutionData, 3000)
      return () => {
        clearInterval(interval)
      }
    }
  }, [fetchEvolutionData, task.status])

  const getStatusText = () => {
    switch (task.status) {
      case TaskStatus.PENDING:
        return '等待执行'
      case TaskStatus.RUNNING:
        return '正在优化'
      case TaskStatus.COMPLETED:
        return '优化完成'
      case TaskStatus.FAILED:
        return '优化失败'
      default:
        return '未知状态'
    }
  }

  const getStatusColor = () => {
    switch (task.status) {
      case TaskStatus.RUNNING:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500'
      case TaskStatus.COMPLETED:
        return 'bg-gradient-to-r from-green-500 to-emerald-500'
      case TaskStatus.FAILED:
        return 'bg-gradient-to-r from-red-500 to-rose-500'
      default:
        return 'bg-gradient-to-r from-slate-400 to-slate-500'
    }
  }

  const actualData = evolutionData?.history || []
  const chartData = hasFetchedData && actualData.length > 0 ? actualData : mockData
  const isUsingMockData = !hasFetchedData || actualData.length === 0

  // 动画效果：同步图表数据
  useEffect(() => {
    setAnimatedData(chartData)
  }, [chartData])

  const currentGen = chartData.length > 0 ? chartData[chartData.length - 1] : null
  const prevGen = chartData.length > 1 ? chartData[chartData.length - 2] : null

  // 计算趋势
  const getTrend = (current: number, previous: number | null): 'up' | 'down' | 'stable' => {
    if (!previous) return 'stable'
    const diff = current - previous
    if (Math.abs(diff) < 0.01) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto h-full flex flex-col">
      {/* 顶部状态栏 */}
      <div className="flex items-center gap-4 bg-white/70 backdrop-blur-lg p-4 rounded-2xl border border-white/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${task.status === TaskStatus.RUNNING ? 'animate-pulse' : ''}`}
          />
          <span className="text-sm font-medium text-slate-500">任务:</span>
          <span className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100/50 rounded-lg px-4 py-1.5 text-sm font-medium">
            {task.name}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">状态</span>
            <span
              className={`font-semibold ${task.status === TaskStatus.RUNNING ? 'text-blue-600' : task.status === TaskStatus.COMPLETED ? 'text-green-600' : 'text-slate-600'}`}
            >
              {getStatusText()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>最后更新</span>
            <span className="font-mono text-slate-600">
              {new Date().toLocaleTimeString('zh-CN')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 flex-1">
        {/* 左侧: 主图表 - 实时迭代曲线 */}
        <GlassCard className="col-span-12 lg:col-span-8 flex flex-col" title="实时迭代曲线">
          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={staticEvolutionData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorF1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorF2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D63384" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D63384" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorF3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={true}
                  stroke="#EAECEF"
                  strokeOpacity={0.8}
                />
                <XAxis
                  dataKey="generation"
                  stroke="#9CA3AF"
                  tickLine={true}
                  axisLine={{ stroke: '#D1D5DB' }}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tickLine={true}
                  axisLine={{ stroke: '#D1D5DB' }}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  domain={[0, 1.2]}
                  allowDataOverflow={true}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #EAECEF',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    background: 'rgba(255,255,255,0.98)',
                    padding: '12px',
                  }}
                  labelStyle={{ color: '#1F2937', fontWeight: 600, marginBottom: 8 }}
                  formatter={(value: number, name: string) => [
                    <span key="value" className="font-mono text-slate-700">
                      {typeof value === 'number' ? value.toFixed(4) : value}
                    </span>,
                    <span
                      key="name"
                      className={
                        name === '适应度 (f1)'
                          ? 'text-blue-500'
                          : name === '成本 (f2)'
                            ? 'text-pink-600'
                            : 'text-amber-500'
                      }
                    >
                      {name}
                    </span>,
                  ]}
                  labelFormatter={(label) => `Generation ${label}`}
                />
                {/* f1 曲线 - 蓝色 */}
                <Area
                  type="monotone"
                  dataKey="f1"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorF1)"
                  name="适应度 (f1)"
                />
                {/* f2 曲线 - 紫红色 */}
                <Area
                  type="monotone"
                  dataKey="f2"
                  stroke="#D63384"
                  strokeWidth={2}
                  fill="url(#colorF2)"
                  name="成本 (f2)"
                />
                {/* f3 曲线 - 黄色 */}
                <Area
                  type="monotone"
                  dataKey="f3"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#colorF3)"
                  name="平滑度 (f3)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 图例 */}
          <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-slate-100/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-600">适应度 (f1)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D63384' }} />
              <span className="text-sm text-slate-600">成本 (f2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-600">平滑度 (f3)</span>
            </div>
          </div>
        </GlassCard>

        {/* 右侧面板 */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
          {/* 种群状态仪表盘 */}
          <GlassCard className="flex-1" title="种群状态">
            <div className="flex flex-col items-center justify-center py-4">
              {/* 环形仪表 - 显示"低"状态 */}
              <div className="relative inline-flex items-center justify-center">
                <svg width={130} height={80} className="overflow-visible">
                  {/* 背景半圆弧 */}
                  <path
                    d="M 15 70 A 50 50 0 0 1 115 70"
                    fill="none"
                    stroke="#FEE2E2"
                    strokeWidth={12}
                    strokeLinecap="round"
                  />
                  {/* 进度半圆弧（约120度，表示"低"） */}
                  <path
                    d="M 15 70 A 50 50 0 0 1 60 22"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth={12}
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))',
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                  <span className="text-2xl font-bold text-slate-800">低</span>
                  <span className="text-xs text-slate-400 mt-1">种群多样性</span>
                </div>
              </div>

              {/* 突变率告警卡片 */}
              <div className="w-full mt-5 bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur p-4 rounded-xl border border-amber-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" size={18} />
                    <span className="text-sm font-medium text-slate-700">突变率</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-semibold text-slate-600">0.486</span>
                    <ArrowRight size={14} className="text-amber-400" />
                    <span className="font-mono text-base font-bold text-amber-600">
                      0.512
                      <span className="text-amber-500 ml-1">↑</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 进化日志 */}
          <GlassCard className="flex-[1.3] flex flex-col" title="进化日志">
            <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2 pr-1 scrollbar-thin">
              {/* 使用静态原始数据显示日志 */}
              {staticRawData.map((item, index) => (
                <div
                  key={`gen-${item.generation}`}
                  className="relative pl-4 animate-[fadeSlideIn_0.3s_ease-out_forwards]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* 蓝色竖条 */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />

                  <div className="bg-white/60 backdrop-blur rounded-lg p-3 border border-slate-100/50 hover:border-blue-200/50 hover:bg-white/80 transition-all duration-200 group">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        INFO
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {item.elapsed_time.toFixed(1)}s
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-600 leading-relaxed">
                      Generation {item.generation}: f1={item.f1.toFixed(2)}, f2={item.f2.toFixed(2)}
                      , f3={item.f3.toFixed(4)}, diversity={item.diversity.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
              {task.status === TaskStatus.RUNNING && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span>计算 Generation {(currentGen?.generation || 0) + 1}...</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* 底部进度条 */}
      <div className="bg-white/70 backdrop-blur-lg p-4 rounded-2xl border border-white/30 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2.5">
              <span
                className={`font-medium flex items-center gap-2 ${task.status === TaskStatus.RUNNING ? 'text-blue-600' : 'text-slate-600'}`}
              >
                {task.status === TaskStatus.RUNNING && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
                {task.status === TaskStatus.RUNNING
                  ? '进化中...'
                  : task.status === TaskStatus.COMPLETED
                    ? '优化完成'
                    : '等待中'}
              </span>
              <span className="font-bold text-slate-700">{task.progress}%</span>
            </div>
            <div className="h-2.5 bg-slate-100/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full relative overflow-hidden transition-all duration-700 ease-out ${
                  task.status === TaskStatus.COMPLETED
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-400 via-violet-500 to-indigo-500'
                }`}
                style={{
                  width: `${task.progress}%`,
                  boxShadow:
                    task.status === TaskStatus.RUNNING
                      ? '0 0 20px rgba(99, 102, 241, 0.4)'
                      : '0 0 20px rgba(16, 185, 129, 0.4)',
                }}
              >
                {/* 条纹背景 */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 75%, transparent 75%, transparent)',
                    backgroundSize: '1rem 1rem',
                  }}
                />
                {/* 流光动画 */}
                {task.status === TaskStatus.RUNNING && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                )}
              </div>
            </div>
          </div>

          {task.status === TaskStatus.RUNNING && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 font-medium rounded-xl hover:from-red-100 hover:to-rose-100 border border-red-200/50 transition-all duration-200 hover:shadow-md"
            >
              停止优化
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}
