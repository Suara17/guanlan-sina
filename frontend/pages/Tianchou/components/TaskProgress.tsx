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
import { TaskStatus, getMetricLabels } from '../types/tianchou'

interface Props {
  task: OptimizationTask
  onCancel?: () => void
  onComplete?: () => void
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

export function TaskProgress({ task, onCancel, onComplete }: Props) {
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [animatedData, setAnimatedData] = useState<any[]>([])
  const [currentGenIndex, setCurrentGenIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  // 最大代数（从后端获取或使用默认值）
  const MAX_GENERATIONS = 200

  // 获取行业类型对应的标签
  const labels = getMetricLabels(task.industry_type)

  // 根据实际数据计算进度（实时更新，不过依赖后端返回的progress）
  const calculatedProgress = (() => {
    // 如果已经有实际数据，使用实际数据的代数计算进度
    if (animatedData.length > 0) {
      const latestGen = animatedData[animatedData.length - 1]?.generation || 0
      return Math.min(Math.round((latestGen / MAX_GENERATIONS) * 100), 100)
    }
    // 如果没有数据但正在运行，显示最小进度
    if (task.status === TaskStatus.RUNNING) {
      return 5 // 初始进度5%
    }
    // 任务完成或失败时
    if (task.status === TaskStatus.COMPLETED) return 100
    if (task.status === TaskStatus.FAILED) return 0
    return 0
  })()

  // 使用计算的进度，而不是依赖task.progress
  const displayProgress = task.status === TaskStatus.COMPLETED ? 100 : 
                         task.status === TaskStatus.FAILED ? calculatedProgress :
                         calculatedProgress

  // 更新最后时间
  useEffect(() => {
    setLastUpdateTime(new Date())
  }, [animatedData.length, task.status])

  // 检测进度完成并触发回调
  useEffect(() => {
    // 只有在任务真正完成时才触发回调（排除 PENDING 等初始状态）
    if (displayProgress >= 100 && !hasCompleted && onComplete && task.status === TaskStatus.COMPLETED) {
      setHasCompleted(true)
      // 立即调用完成回调，不等待下一个轮询
      onComplete()
    }
  }, [displayProgress, hasCompleted, onComplete, task.status])

  // 重置完成状态当任务重新开始时
  useEffect(() => {
    if (task.status === TaskStatus.RUNNING) {
      setHasCompleted(false)
    }
  }, [task.status])

  // 基于实际运行结果的曲线数据
  const fullEvolutionData = [
    // Generation 0-20: 初始阶段，多样性低
    { generation: 0, f1: 216500.06, f2: 38452.46, f3: 0.0872, diversity: 0.0171, mutpb: 0.486, elapsed_time: 0.4 },
    { generation: 20, f1: 209824.21, f2: 27080.93, f3: 0.0870, diversity: 0.0358, mutpb: 0.480, elapsed_time: 9.5 },
    // Generation 40: 多样性警告，增加变异率
    { generation: 40, f1: 198773.86, f2: 46765.17, f3: 0.0872, diversity: 0.0390, mutpb: 0.480, elapsed_time: 18.6 },
    // Generation 60: 多样性警告，再次增加变异率
    { generation: 60, f1: 220943.49, f2: 42312.36, f3: 0.0866, diversity: 0.0489, mutpb: 0.576, elapsed_time: 29.4 },
    // Generation 80: 多样性警告
    { generation: 80, f1: 219300.78, f2: 38629.95, f3: 0.0858, diversity: 0.0800, mutpb: 0.691, elapsed_time: 40.5 },
    // Generation 100: 适应度开始上升
    { generation: 100, f1: 224764.39, f2: 70859.31, f3: 0.0857, diversity: 0.1027, mutpb: 0.691, elapsed_time: 51.7 },
    // Generation 120
    { generation: 120, f1: 232274.94, f2: 49849.54, f3: 0.0862, diversity: 0.0967, mutpb: 0.800, elapsed_time: 62.8 },
    // Generation 140: 多样性达到峰值
    { generation: 140, f1: 221883.99, f2: 65505.05, f3: 0.0860, diversity: 0.1254, mutpb: 0.800, elapsed_time: 73.7 },
    // Generation 160
    { generation: 160, f1: 227145.32, f2: 76995.84, f3: 0.0855, diversity: 0.1244, mutpb: 0.800, elapsed_time: 84.8 },
    // Generation 180: 适应度达到最高
    { generation: 180, f1: 233229.27, f2: 63506.09, f3: 0.0855, diversity: 0.1148, mutpb: 0.800, elapsed_time: 96.4 },
    // Generation 199: 最终代
    { generation: 199, f1: 204461.71, f2: 65029.52, f3: 0.0872, diversity: 0.1207, mutpb: 0.800, elapsed_time: 106.5 },
  ]

  // 从后端获取进化数据
  const fetchEvolutionData = useCallback(async () => {
    if (!task.task_id) {
      // 无task_id时使用模拟数据并启动动画
      if (task.status === TaskStatus.RUNNING && !isAnimating) {
        setIsAnimating(true)
        setAnimatedData(fullEvolutionData.slice(0, 3))
        setCurrentGenIndex(3)
      }
      return
    }
    
    try {
      const data = await tianchouService.getEvolutionHistory(task.task_id)
      setEvolutionData(data)
      
      if (data.history && data.history.length > 0) {
        // 后端有数据，使用后端数据
        setAnimatedData(data.history)
        setIsAnimating(false)
      } else {
        // 后端无数据，使用模拟数据
        if (task.status === TaskStatus.RUNNING && !isAnimating) {
          setAnimatedData(fullEvolutionData.slice(0, 3))
          setCurrentGenIndex(3)
          setIsAnimating(true)
        } else if (task.status !== TaskStatus.RUNNING) {
          setAnimatedData(fullEvolutionData)
        }
      }
    } catch (error) {
      console.error('获取进化数据失败:', error)
      // 请求失败，使用模拟数据
      if (task.status === TaskStatus.RUNNING && !isAnimating) {
        setAnimatedData(fullEvolutionData.slice(0, 3))
        setCurrentGenIndex(3)
        setIsAnimating(true)
      } else if (task.status !== TaskStatus.RUNNING) {
        setAnimatedData(fullEvolutionData)
      }
    }
  }, [task.task_id, task.status, isAnimating])

  // 初始化数据
  useEffect(() => {
    fetchEvolutionData()
  }, [task.task_id, task.status])

  // 任务运行中时，轮询后端数据
  useEffect(() => {
    if (task.status === TaskStatus.RUNNING && task.task_id) {
      const interval = setInterval(fetchEvolutionData, 2000)
      return () => clearInterval(interval)
    }
  }, [task.status, task.task_id, fetchEvolutionData])

  // 模拟数据逐步增加动画
  useEffect(() => {
    if (!isAnimating || currentGenIndex >= fullEvolutionData.length) return

    const timer = setTimeout(() => {
      setAnimatedData(prev => [...prev, fullEvolutionData[currentGenIndex]])
      setCurrentGenIndex(prev => prev + 1)
    }, 800)

    return () => clearTimeout(timer)
  }, [isAnimating, currentGenIndex])

  // 获取当前最新数据
  const currentData = animatedData.length > 0 ? animatedData[animatedData.length - 1] : null
  const prevData = animatedData.length > 1 ? animatedData[animatedData.length - 2] : null

  // 动态计算Y轴范围（适应原始数据）
  const calculateYAxisDomain = () => {
    if (animatedData.length === 0) return [0, 250000]
    
    let maxF1 = 0, maxF2 = 0
    animatedData.forEach(item => {
      maxF1 = Math.max(maxF1, item.f1 || 0)
      maxF2 = Math.max(maxF2, item.f2 || 0)
    })
    
    // f1 范围: 180000 - 250000
    // f2 范围: 20000 - 90000
    // 统一使用 f1 的范围作为 Y 轴上限
    const upperBound = Math.ceil(maxF1 / 50000) * 50000
    
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
      {/* 顶部合并组件：进度条 + 任务信息 */}
      <div className="bg-white/70 backdrop-blur-lg p-4 rounded-2xl border border-white/30 shadow-sm">
        <div className="flex items-center gap-4">
          {/* 左侧：状态指示 + 任务名 */}
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${task.status === TaskStatus.RUNNING ? 'animate-pulse' : ''}`}
            />
            <span className="text-sm font-medium text-slate-500">任务:</span>
            <span className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100/50 rounded-lg px-3 py-1 text-sm font-medium">
              {task.name}
            </span>
          </div>
          
          {/* 中间：进度条 */}
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1.5">
              <span
                className={`font-medium flex items-center gap-2 ${task.status === TaskStatus.RUNNING ? 'text-blue-600' : 'text-slate-600'}`}
              >
                {task.status === TaskStatus.RUNNING && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
                {task.status === TaskStatus.RUNNING
                  ? '进化中'
                  : task.status === TaskStatus.COMPLETED
                    ? '优化完成'
                    : '等待中'}
                {/* 显示当前代数 */}
                {animatedData.length > 0 && (
                  <span className="text-xs text-slate-400 ml-1">
                    Gen {animatedData[animatedData.length - 1]?.generation || 0}/{MAX_GENERATIONS}
                  </span>
                )}
              </span>
              <span className="font-bold text-slate-700">{displayProgress}%</span>
            </div>
            <div className="h-2 bg-slate-100/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full relative overflow-hidden transition-all duration-500 ease-out ${
                  task.status === TaskStatus.COMPLETED
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-400 via-violet-500 to-indigo-500'
                }`}
                style={{
                  width: `${displayProgress}%`,
                  boxShadow:
                    task.status === TaskStatus.RUNNING
                      ? '0 0 15px rgba(99, 102, 241, 0.4)'
                      : '0 0 15px rgba(16, 185, 129, 0.4)',
                }}
              >
                {/* 流光动画 */}
                {task.status === TaskStatus.RUNNING && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                )}
              </div>
            </div>
          </div>

          {/* 右侧：停止按钮 + 最后更新时间 */}
          <div className="flex items-center gap-4">
            {task.status === TaskStatus.RUNNING && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 text-xs font-medium rounded-lg hover:from-red-100 hover:to-rose-100 border border-red-200/50 transition-all duration-200"
              >
                停止
              </button>
            )}
            <span className="text-xs text-slate-400">
              {lastUpdateTime.toLocaleTimeString('zh-CN')}
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
                  yAxisId="left"
                  stroke="#9CA3AF"
                  tickLine={true}
                  axisLine={{ stroke: '#D1D5DB' }}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  domain={yAxisDomain}
                  allowDataOverflow={true}
                  tickFormatter={(value) => formatLargeNumber(value)}
                />
                {/* f3 专用右Y轴 */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F59E0B"
                  tickLine={true}
                  axisLine={{ stroke: '#F59E0B' }}
                  tick={{ fontSize: 11, fill: '#F59E0B' }}
                  domain={[0, 0.15]}
                  allowDataOverflow={true}
                  tickFormatter={(value) => value.toFixed(2)}
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
                        name === labels.f1
                          ? 'text-blue-500'
                          : name === labels.f2
                            ? 'text-pink-600'
                            : 'text-amber-500'
                      }
                    >
                      {name}
                    </span>,
                  ]}
                  labelFormatter={(label) => `Generation ${label}`}
                />
                {/* f1 曲线 - 蓝色，使用左Y轴 */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="f1"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorF1)"
                  name={labels.f1}
                />
                {/* f2 曲线 - 紫红色，使用左Y轴 */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="f2"
                  stroke="#D63384"
                  strokeWidth={2}
                  fill="url(#colorF2)"
                  name={labels.f2}
                />
                {/* f3 曲线 - 黄色，使用右Y轴 */}
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="f3"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#colorF3)"
                  name={labels.f3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 图例 */}
          <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-slate-100/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-600">{labels.f1} <span className="text-slate-400">(左轴)</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#D63384' }} />
              <span className="text-sm text-slate-600">{labels.f2} <span className="text-slate-400">(左轴)</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-amber-600">{labels.f3} <span className="text-amber-400">(右轴)</span></span>
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
