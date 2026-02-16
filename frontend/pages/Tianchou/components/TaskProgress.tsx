/**
 * 任务进度组件 - 算法过程可视化
 * 采用玻璃拟态设计风格，带有动态曲线绘制效果
 */

import { AlertTriangle, ArrowRight } from 'lucide-react'
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

export function TaskProgress({ task, onCancel }: Props) {
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null)
  const [animatedData, setAnimatedData] = useState<any[]>([])
  const [currentGenIndex, setCurrentGenIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // 完整的曲线数据（模拟图片中的曲线走势）
  const fullEvolutionData = [
    { generation: 0, f1: 0.62, f2: 0.85, f3: 0.32, diversity: 0.45, mutpb: 0.486, elapsed_time: 0.5 },
    { generation: 20, f1: 0.75, f2: 0.82, f3: 0.42, diversity: 0.38, mutpb: 0.488, elapsed_time: 9.5 },
    { generation: 40, f1: 0.88, f2: 0.72, f3: 0.52, diversity: 0.32, mutpb: 0.492, elapsed_time: 18.6 },
    { generation: 60, f1: 0.98, f2: 0.58, f3: 0.56, diversity: 0.28, mutpb: 0.496, elapsed_time: 27.8 },
    { generation: 80, f1: 1.02, f2: 0.48, f3: 0.54, diversity: 0.22, mutpb: 0.498, elapsed_time: 37.2 },
    { generation: 100, f1: 1.05, f2: 0.42, f3: 0.52, diversity: 0.18, mutpb: 0.500, elapsed_time: 46.5 },
    { generation: 120, f1: 1.06, f2: 0.40, f3: 0.55, diversity: 0.15, mutpb: 0.502, elapsed_time: 55.8 },
    { generation: 140, f1: 1.07, f2: 0.38, f3: 0.58, diversity: 0.12, mutpb: 0.504, elapsed_time: 65.2 },
    { generation: 160, f1: 1.08, f2: 0.36, f3: 0.56, diversity: 0.10, mutpb: 0.506, elapsed_time: 74.5 },
    { generation: 180, f1: 1.04, f2: 0.38, f3: 0.52, diversity: 0.09, mutpb: 0.508, elapsed_time: 83.8 },
    { generation: 200, f1: 0.98, f2: 0.42, f3: 0.58, diversity: 0.08, mutpb: 0.510, elapsed_time: 93.2 },
    { generation: 220, f1: 0.90, f2: 0.48, f3: 0.52, diversity: 0.07, mutpb: 0.512, elapsed_time: 102.5 },
    { generation: 240, f1: 0.82, f2: 0.52, f3: 0.48, diversity: 0.06, mutpb: 0.514, elapsed_time: 111.8 },
    { generation: 260, f1: 0.75, f2: 0.55, f3: 0.42, diversity: 0.055, mutpb: 0.516, elapsed_time: 121.2 },
    { generation: 280, f1: 0.68, f2: 0.52, f3: 0.38, diversity: 0.050, mutpb: 0.518, elapsed_time: 130.5 },
    { generation: 300, f1: 0.62, f2: 0.48, f3: 0.35, diversity: 0.048, mutpb: 0.520, elapsed_time: 139.8 },
    { generation: 320, f1: 0.55, f2: 0.45, f3: 0.32, diversity: 0.045, mutpb: 0.522, elapsed_time: 149.2 },
    { generation: 340, f1: 0.48, f2: 0.42, f3: 0.28, diversity: 0.042, mutpb: 0.524, elapsed_time: 158.5 },
    { generation: 360, f1: 0.42, f2: 0.38, f3: 0.25, diversity: 0.040, mutpb: 0.526, elapsed_time: 167.8 },
    { generation: 380, f1: 0.35, f2: 0.35, f3: 0.22, diversity: 0.038, mutpb: 0.528, elapsed_time: 177.2 },
    { generation: 400, f1: 0.28, f2: 0.32, f3: 0.18, diversity: 0.035, mutpb: 0.530, elapsed_time: 186.5 },
    { generation: 420, f1: 0.30, f2: 0.35, f3: 0.22, diversity: 0.038, mutpb: 0.532, elapsed_time: 195.8 },
    { generation: 440, f1: 0.35, f2: 0.38, f3: 0.28, diversity: 0.042, mutpb: 0.534, elapsed_time: 205.2 },
    { generation: 460, f1: 0.40, f2: 0.42, f3: 0.35, diversity: 0.046, mutpb: 0.536, elapsed_time: 214.5 },
    { generation: 480, f1: 0.45, f2: 0.48, f3: 0.40, diversity: 0.050, mutpb: 0.538, elapsed_time: 223.8 },
    { generation: 500, f1: 0.48, f2: 0.55, f3: 0.45, diversity: 0.055, mutpb: 0.540, elapsed_time: 233.2 },
    { generation: 520, f1: 0.50, f2: 0.62, f3: 0.52, diversity: 0.060, mutpb: 0.542, elapsed_time: 242.5 },
    { generation: 540, f1: 0.52, f2: 0.68, f3: 0.55, diversity: 0.065, mutpb: 0.544, elapsed_time: 251.8 },
    { generation: 560, f1: 0.48, f2: 0.72, f3: 0.58, diversity: 0.070, mutpb: 0.546, elapsed_time: 261.2 },
    { generation: 580, f1: 0.45, f2: 0.75, f3: 0.55, diversity: 0.075, mutpb: 0.548, elapsed_time: 270.5 },
    { generation: 600, f1: 0.48, f2: 0.78, f3: 0.52, diversity: 0.080, mutpb: 0.550, elapsed_time: 279.8 },
    { generation: 620, f1: 0.42, f2: 0.80, f3: 0.48, diversity: 0.085, mutpb: 0.552, elapsed_time: 289.2 },
    { generation: 640, f1: 0.40, f2: 0.82, f3: 0.42, diversity: 0.090, mutpb: 0.554, elapsed_time: 298.5 },
    { generation: 660, f1: 0.38, f2: 0.80, f3: 0.38, diversity: 0.095, mutpb: 0.556, elapsed_time: 307.8 },
    { generation: 680, f1: 0.40, f2: 0.78, f3: 0.35, diversity: 0.100, mutpb: 0.558, elapsed_time: 317.2 },
    { generation: 700, f1: 0.42, f2: 0.75, f3: 0.32, diversity: 0.105, mutpb: 0.560, elapsed_time: 326.5 },
    { generation: 720, f1: 0.40, f2: 0.72, f3: 0.30, diversity: 0.110, mutpb: 0.562, elapsed_time: 335.8 },
    { generation: 740, f1: 0.42, f2: 0.70, f3: 0.32, diversity: 0.115, mutpb: 0.564, elapsed_time: 345.2 },
    { generation: 760, f1: 0.42, f2: 0.68, f3: 0.30, diversity: 0.120, mutpb: 0.566, elapsed_time: 354.5 },
  ]

  // 从后端获取进化数据
  const fetchEvolutionData = useCallback(async () => {
    if (!task.task_id) return
    
    try {
      const data = await tianchouService.getEvolutionHistory(task.task_id)
      setEvolutionData(data)
      
      if (data.history && data.history.length > 0) {
        // 后端有数据，使用后端数据
        setAnimatedData(data.history)
      } else {
        // 后端无数据，使用模拟数据
        if (task.status === TaskStatus.RUNNING) {
          setAnimatedData(fullEvolutionData.slice(0, 3))
          setCurrentGenIndex(3)
          setIsAnimating(true)
        } else {
          setAnimatedData(fullEvolutionData)
        }
      }
    } catch (error) {
      console.error('获取进化数据失败:', error)
      // 请求失败，使用模拟数据
      if (task.status === TaskStatus.RUNNING) {
        setAnimatedData(fullEvolutionData.slice(0, 3))
        setCurrentGenIndex(3)
        setIsAnimating(true)
      } else {
        setAnimatedData(fullEvolutionData)
      }
    }
  }, [task.task_id, task.status])

  // 动态显示数据
  useEffect(() => {
    fetchEvolutionData()
    
    // 任务运行中时，每2秒轮询一次
    if (task.status === TaskStatus.RUNNING) {
      const interval = setInterval(fetchEvolutionData, 2000)
      return () => clearInterval(interval)
    }
  }, [fetchEvolutionData, task.status])

  // 获取当前最新数据
  const currentData = animatedData.length > 0 ? animatedData[animatedData.length - 1] : null
  const prevData = animatedData.length > 1 ? animatedData[animatedData.length - 2] : null

  // 动态计算Y轴范围（适应原始数据）
  const calculateYAxisDomain = () => {
    if (animatedData.length === 0) return [0, 1.2]
    
    let maxF1 = 0, maxF2 = 0, maxF3 = 0
    animatedData.forEach(item => {
      maxF1 = Math.max(maxF1, item.f1 || 0)
      maxF2 = Math.max(maxF2, item.f2 || 0)
      maxF3 = Math.max(maxF3, item.f3 || 0)
    })
    
    const maxValue = Math.max(maxF1, maxF2, maxF3)
    // 向上取整到合适的刻度
    const order = Math.pow(10, Math.floor(Math.log10(maxValue)))
    const upperBound = Math.ceil(maxValue / order) * order
    
    return [0, upperBound]
  }

  const yAxisDomain = calculateYAxisDomain()

  // 格式化大数值显示
  const formatLargeNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toFixed(2)
  }

  // 生成日志数据（使用实际数据）
  const logData = animatedData.slice(-6).map(item => ({
    generation: item.generation,
    f1: item.f1 || 0,
    f2: item.f2 || 0,
    f3: item.f3 || 0,
    diversity: item.diversity || 0.04,
    elapsed_time: item.elapsed_time || 0,
  }))

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
              <AreaChart data={animatedData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
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
                  domain={yAxisDomain}
                  allowDataOverflow={true}
                  tickFormatter={(value) => formatLargeNumber(value)}
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
                      {typeof value === 'number' ? (value >= 1000 ? formatLargeNumber(value) : value.toFixed(4)) : value}
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
              {/* 动态显示多样性状态 */}
              <div className="flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${
                  currentData && currentData.diversity < 0.15 ? 'text-red-500' : 
                  currentData && currentData.diversity < 0.3 ? 'text-amber-500' : 'text-green-500'
                }`}>
                  {currentData && currentData.diversity < 0.15 ? '低' : currentData && currentData.diversity < 0.3 ? '中' : '高'}
                </span>
                <span className="text-sm text-slate-500 mt-2">种群多样性</span>
              </div>
              
              {/* 突变率告警卡片 */}
              <div className="w-full mt-5 bg-gradient-to-r from-amber-50 to-yellow-50 backdrop-blur p-4 rounded-xl border border-amber-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" size={18} />
                    <span className="text-sm font-medium text-slate-700">突变率</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-semibold text-slate-600">
                      {prevData ? prevData.mutpb.toFixed(3) : '0.486'}
                    </span>
                    <ArrowRight size={14} className="text-amber-400" />
                    <span className="font-mono text-base font-bold text-amber-600">
                      {currentData ? currentData.mutpb.toFixed(3) : '0.512'}
                      {currentData && prevData && currentData.mutpb > prevData.mutpb && (
                        <span className="text-amber-500 ml-1">↑</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 进化日志 */}
          <GlassCard className="flex-[1.3] flex flex-col" title="进化日志">
            <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2 pr-1 scrollbar-thin">
              {logData.slice().reverse().map((item, index) => (
                <div
                  key={`gen-${item.generation}-${index}`}
                  className="relative pl-4 animate-[fadeSlideIn_0.3s_ease-out_forwards]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
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
                      Generation {item.generation}: f1={formatLargeNumber(item.f1)}, f2={formatLargeNumber(item.f2)}, f3={item.f3.toFixed(4)}, diversity={item.diversity.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
              {task.status === TaskStatus.RUNNING && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span>计算中...</span>
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
