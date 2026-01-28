import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Move,
  Play,
  Route,
  Sliders,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AssetMode } from '../types'

// Mock Data for Bottleneck Drift
const DRIFT_DATA = [
  { time: '08:00', upstream: 40, bottleneck: 85, downstream: 30 },
  { time: '09:00', upstream: 55, bottleneck: 92, downstream: 25 },
  { time: '10:00', upstream: 75, bottleneck: 98, downstream: 20 }, // Drift starts
  { time: '11:00', upstream: 90, bottleneck: 60, downstream: 85 }, // Drift moved to downstream (WIP accumulation)
]

/**
 * Metric Card Component
 */
const MetricCard = ({ title, value, sub, color, icon: Icon, trend }: any) => {
  // Dynamic color mapping
  const theme =
    {
      blue: 'border-slate-700 bg-slate-800 text-slate-200',
      green: 'border-slate-700 bg-slate-800 text-slate-200',
      red: 'border-slate-700 bg-slate-800 text-slate-200',
      yellow: 'border-slate-700 bg-slate-800 text-slate-200',
    }[color] || 'border-slate-700 bg-slate-800 text-slate-200'
  const accentValue =
    {
      blue: 'text-sky-400',
      green: 'text-emerald-400',
      red: 'text-red-400',
      yellow: 'text-amber-300',
    }[color] || 'text-slate-100'
  const accentBar =
    {
      blue: 'bg-sky-500',
      green: 'bg-emerald-500',
      red: 'bg-red-500',
      yellow: 'bg-amber-500',
    }[color] || 'bg-slate-600'
  const iconTone =
    {
      blue: 'text-sky-400',
      green: 'text-emerald-400',
      red: 'text-red-400',
      yellow: 'text-amber-300',
    }[color] || 'text-slate-400'

  return (
    <div
      className={`relative p-3 rounded-xl border ${theme} overflow-hidden group shadow-sm transition-all duration-200 hover:ring-1 hover:ring-slate-600/50`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accentBar}`}></div>
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-xs font-medium leading-tight">{title}</span>
        {Icon && <Icon className={`w-4 h-4 ${iconTone}`} />}
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold font-mono tracking-tight leading-none ${accentValue}`}>
          {value}
        </span>
        {color === 'red' && (
          <span className="px-1.5 py-0.5 rounded-md border border-red-500/40 bg-red-500/10 text-[10px] text-red-300 leading-none mb-0.5">
            高
          </span>
        )}
        {color === 'yellow' && (
          <span className="px-1.5 py-0.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-200 leading-none mb-0.5">
            警示
          </span>
        )}
        {color === 'green' && (
          <span className="px-1.5 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-200 leading-none mb-0.5">
            良好
          </span>
        )}
        {trend && <span className="text-xs font-bold mb-0.5 text-green-600 leading-none">↗</span>}
      </div>
      <div className={`text-[10px] mt-2 font-mono flex items-center gap-1 ${color === 'red' ? 'text-red-300' : color === 'yellow' ? 'text-amber-200' : 'text-slate-400'}`}>
        {color === 'red' || color === 'yellow' ? <AlertTriangle className="w-3 h-3 text-amber-300" /> : null}
        {sub}
      </div>
    </div>
  )
}

/**
 * Plan Card Component
 */
const PlanCard = ({ title, recommend, description, metrics, loss, type, onClick }: any) => {
  const isRecommended = type === 'A'

  // Styles
  const containerClasses = isRecommended
    ? 'border border-slate-700/50 bg-slate-900/40 shadow-md ring-1 ring-sky-700/40 rounded-xl'
    : 'border border-slate-700/50 bg-slate-900/40 hover:bg-slate-700/30 shadow-sm rounded-xl'

  const glow = ''

  return (
    <div
      onClick={onClick}
      className={`relative p-4 cursor-pointer transition-all duration-200 group flex flex-col h-full ${containerClasses}`}
    >
      {glow && <div className={glow}></div>}

      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <h3
            className={`text-base font-bold ${isRecommended ? 'text-sky-300' : 'text-slate-200'}`}
          >
            {title}
          </h3>
          {recommend && (
            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] font-semibold rounded border border-amber-500/40 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-300" /> 推荐
            </span>
          )}
        </div>
        {isRecommended ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : type === 'B' ? (
          <AlertTriangle className="w-5 h-5 text-amber-300" />
        ) : (
          <AlertOctagon className="w-5 h-5 text-red-400" />
        )}
      </div>

      <p className="text-slate-300 text-xs mb-4 font-medium leading-relaxed">{description}</p>

      <div className="space-y-3 relative z-10 flex-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-14 text-slate-400">交付影响</span>
          <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${metrics.deliveryColor}`}
              style={{ width: metrics.delivery }}
            ></div>
          </div>
          <span className="w-14 text-right font-mono text-slate-200">{metrics.deliveryVal}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-14 text-slate-400">质量风险</span>
          <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${metrics.riskColor}`}
              style={{ width: metrics.risk }}
            ></div>
          </div>
          <span className="w-14 text-right font-semibold text-slate-200">{metrics.riskVal}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-14 text-slate-400">成本</span>
          <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${metrics.costColor}`}
              style={{ width: metrics.cost }}
            ></div>
          </div>
          <span className="w-14 text-right font-semibold text-slate-200">{metrics.costVal}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-end items-center relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-slate-400">预计总损失</span>
          <span className="text-lg font-mono font-bold text-slate-100">{loss}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Circular Progress Indicator for Loading State
 */
const ProgressRing = ({ progress }: { progress: number }) => {
  const radius = 60
  const stroke = 8
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <div className="absolute inset-0 rounded-full blur-2xl bg-sky-500/20"></div>
      <div className="absolute inset-0 rounded-full blur-3xl bg-sky-400/10"></div>
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] relative z-10">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <circle
          stroke="rgba(56,189,248,0.15)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="url(#ringGrad)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.1s linear' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="shadow-[0_0_20px_rgba(56,189,248,0.8)]"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center z-20">
        <span className="text-4xl font-bold font-mono text-white drop-shadow-[0_0_14px_rgba(56,189,248,0.8)]">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}

/**
 * Loading Overlay View
 */
const LoadingView = ({ progress, awaitDismiss, onDismiss }: { progress: number; awaitDismiss?: boolean; onDismiss?: () => void }) => {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      onClick={awaitDismiss ? onDismiss : undefined}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-500"></div>
      <div
        className="relative bg-slate-900 border-2 border-sky-500/60 ring-4 ring-sky-500/10 p-10 rounded-2xl shadow-[0_0_60px_rgba(14,165,233,0.15)] max-w-3xl w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl text-slate-100 tracking-wide font-medium flex items-center gap-3">
          <Activity className="w-6 h-6 text-sky-400 animate-spin" />
          正在生成最优处置方案...
        </h2>
        <ProgressRing progress={progress} />
        <div className="w-full max-w-md space-y-2.5">
          <div className="flex justify-between items-center text-sm text-slate-200 font-mono bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${progress > 30 ? 'bg-sky-500 shadow-[0_0_6px_rgba(56,189,248,0.8)]' : 'bg-slate-500'}`}></span>
              计算: 维修时长预测
            </span>
            <span className={`${progress > 30 ? 'text-sky-400' : 'text-slate-400'}`}>{progress > 30 ? 'DONE' : '...'}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-200 font-mono bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${progress > 60 ? 'bg-sky-500 shadow-[0_0_6px_rgba(56,189,248,0.8)]' : 'bg-slate-500'}`}></span>
              计算: 流出风险评估
            </span>
            <span className={`${progress > 60 ? 'text-sky-400' : 'text-slate-400'}`}>{progress > 60 ? 'DONE' : '...'}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-200 font-mono bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${progress > 90 ? 'bg-sky-500 shadow-[0_0_6px_rgba(56,189,248,0.8)]' : 'bg-slate-500'}`}></span>
              计算: 交付影响模拟
            </span>
            <span className={`${progress > 90 ? 'text-sky-400' : 'text-slate-400'}`}>{progress > 90 ? 'DONE' : '...'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const Tianchou: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [assetMode, setAssetMode] = useState<AssetMode>('light')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showOptimized, setShowOptimized] = useState(true) // 默认显示优化结果
  const [anomalyData, setAnomalyData] = useState<any>(null)
  const [knowledgeGraph, setKnowledgeGraph] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [awaitDismiss, setAwaitDismiss] = useState(false)

  // Mock data for demonstration
  const mockAnomalyData = {
    phenomenon: '设备振动异常，温度升高',
    rootCauses: ['轴承磨损', '润滑不足', '冷却系统故障'],
    solutions: [
      {
        name: '快速更换轴承',
        description: '更换主轴承并补充润滑',
        estimatedTime: '30分钟',
        successRate: 85,
      },
      {
        name: '系统性检查',
        description: '全面检查冷却和润滑系统',
        estimatedTime: '60分钟',
        successRate: 95,
      },
    ],
    id: 'anomaly-001',
  }

  // 从路由 state 接收数据，如果没有则使用mock数据
  useEffect(() => {
    if (location.state) {
      const { anomaly, knowledgeGraph: graph } = location.state as any
      if (anomaly) {
        setAnomalyData(anomaly)
      } else {
        setAnomalyData(mockAnomalyData)
      }
      if (graph) {
        setKnowledgeGraph(graph)
      }
    } else {
      // 如果没有路由状态，使用mock数据
      setAnomalyData(mockAnomalyData)
    }
  }, [location.state])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setShowOptimized(true)
    }, 1800)
  }

  const handleExecutePlan = (planType: string) => {
    setSelectedPlan(planType)
    setLoading(true)
    setProgress(0)
    setAwaitDismiss(false)

    // Simulation of the loading process
    const duration = 5000
    const target = 96
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(target, (elapsed / duration) * target)
      setProgress(pct)
      if (pct >= target) {
        clearInterval(interval)
        setAwaitDismiss(true)
      }
    }, 100)
  }

  const handleDismiss = () => {
    setLoading(false)
    setAwaitDismiss(false)
  }

  const economicData = useMemo(
    () => [
      { name: '实施成本', value: assetMode === 'light' ? 5000 : 2000, color: '#94a3b8' },
      { name: '期望收益', value: assetMode === 'light' ? 12000 : 8500, color: '#3b82f6' },
      { name: '潜在风险损失', value: assetMode === 'light' ? 1500 : 3000, color: '#ef4444' },
    ],
    [assetMode]
  )

  return (
    <div className="h-full overflow-hidden bg-[#0b1220]">
      {/* Main Content Area (Full Width) */}
      <div className="h-full flex flex-col p-4 gap-4 relative">
        {/* 解决方案列表 - 代码保留但暂时不显示 */}
        {/* {anomalyData?.solutions && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={14} /> 解决方案列表
            </h2>
            <div className="space-y-3">
              {anomalyData.solutions.map((solution: any, index: number) => (
                <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <h4 className="font-medium text-sm text-green-800 mb-1">{solution.name}</h4>
                  <p className="text-xs text-green-700 mb-2">{solution.description}</p>
                  <div className="flex justify-between text-xs text-green-600">
                    <span>时长: {solution.estimatedTime}</span>
                    <span>成功率: {solution.successRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Loading Overlay */}
        {loading && <LoadingView progress={progress} awaitDismiss={awaitDismiss} onDismiss={handleDismiss} />}

        {/* Top: KPI Cards */}
        {showOptimized && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-sm shrink-0">
            <h3 className="font-bold text-sky-400 text-base mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              关键性指标
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                title="预计维修时长"
                value={
                  <>
                    38 <span className="text-xs text-slate-300 ml-1">min</span>
                  </>
                }
                sub="(±12)"
                color="blue"
                icon={Clock}
              />
              <MetricCard
                title="修复成功概率"
                value={<span className="text-emerald-400">82%</span>}
                trend={true}
                sub=""
                color="green"
                icon={TrendingUp}
              />
              <MetricCard
                title="流出风险"
                value={<span className="text-red-400">高 12%</span>}
                sub="(若继续生产)"
                color="red"
                icon={AlertOctagon}
              />
              <MetricCard
                title="交付影响"
                value={<span className="text-amber-300">延迟 0.6天</span>}
                sub="(若立刻停线)"
                color="yellow"
                icon={AlertTriangle}
              />
            </div>
          </div>
        )}
        {/* Center: Plan Cards */}
        {showOptimized && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="h-3.5 w-1 bg-sky-500 rounded-full"></div>
              <h3 className="text-base font-bold text-sky-400">处置方案</h3>
              <span className="text-[11px] text-slate-400 font-mono">(按损失最小化排序)</span>
            </div>
            <div className="grid grid-cols-3 gap-4 flex-1 h-full">
              <PlanCard
                type="A"
                title="方案A"
                recommend={true}
                description="停线隔离 + 快速换件 + 首件确认"
                metrics={{
                  delivery: '30%',
                  deliveryColor: 'bg-amber-400',
                  deliveryVal: '0.3天',
                  risk: '20%',
                  riskColor: 'bg-emerald-500',
                  riskVal: '低',
                  cost: '60%',
                  costColor: 'bg-amber-400',
                  costVal: '中',
                }}
                loss="¥32k"
                onClick={() => handleExecutePlan('A')}
              />
              <PlanCard
                type="B"
                title="方案B"
                description="降速生产 + 100%在线检 + 并行排查"
                metrics={{
                  delivery: '60%',
                  deliveryColor: 'bg-emerald-500',
                  deliveryVal: '交付不延迟',
                  risk: '50%',
                  riskColor: 'bg-amber-400',
                  riskVal: '中',
                  cost: '80%',
                  costColor: 'bg-orange-500',
                  costVal: '高',
                }}
                loss="¥58k"
              />
              <PlanCard
                type="C"
                title="方案C"
                description="继续生产 + 事后抽检返工"
                metrics={{
                  delivery: '10%',
                  deliveryColor: 'bg-emerald-500',
                  deliveryVal: '交付不延迟',
                  risk: '90%',
                  riskColor: 'bg-red-500',
                  riskVal: '高',
                  cost: '90%',
                  costColor: 'bg-red-500',
                  costVal: '不确定',
                }}
                loss="¥110k+"
              />
            </div>
          </div>
        )}

        {/* Footer Area */}
        {showOptimized && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-300 font-semibold">依据</span>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-4">
                <span>相比故障记录30次</span>
                <span className="w-px h-3 bg-slate-500"></span>
                <span>参数偏离: 温度+8°C、振动+12%</span>
                <span className="w-px h-3 bg-slate-500"></span>
                <span>近15分钟不良趋势上升</span>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="text-xs text-red-400 mr-3">建议在5分钟内决策，超过将增加损失</div>
              <button className="px-3 py-2 text-slate-200 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg bg-slate-700/50 transition-colors text-xs font-medium">
                查看明细
              </button>
              <button className="px-3 py-2 text-slate-200 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg bg-slate-700/50 transition-colors text-xs font-medium">
                导出记录
              </button>
              <button
                onClick={() => handleExecutePlan('A')}
                className="px-5 py-2 text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors text-sm font-bold flex items-center gap-2"
              >
                执行方案A
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tianchou
