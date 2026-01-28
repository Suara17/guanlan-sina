import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Battery,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  RefreshCw,
  Settings,
  TrendingUp,
  Wifi,
  Zap,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

// --- Components ---

/**
 * Top Header Bar
 */
const Header = () => (
  <header className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 relative z-20">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.6)]">
        <Zap className="w-5 h-5 text-white fill-white" />
      </div>
      <h1 className="text-xl font-bold tracking-wider text-blue-100 shadow-blue-500/20">
        天工奕控系统
      </h1>
    </div>

    <div className="text-slate-400 font-mono text-sm tracking-wide">A线-设备#03</div>

    <div className="flex items-center gap-6">
      <div className="font-mono text-slate-200">10:42:16</div>
      <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-bold animate-pulse">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        异常处理中
      </div>
      <div className="flex items-center gap-4 text-slate-400">
        <Bell className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono">85%</span>
          <Battery className="w-5 h-5" />
        </div>
        <Settings className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
      </div>
    </div>
  </header>
)

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
      {/* Background glow */}
      <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>

      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] relative z-10">
        <circle
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#22d3ee"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.1s linear' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="shadow-[0_0_10px_#22d3ee]"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center z-20">
        <span className="text-4xl font-bold font-mono text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}

/**
 * Loading Overlay View
 */
const LoadingView = ({ progress }: { progress: number }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
      {/* Blurred Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>

      {/* Glass Card */}
      <div className="relative bg-slate-800/40 border border-slate-600/30 p-12 rounded-3xl shadow-2xl backdrop-blur-xl max-w-3xl w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
        {/* Scanning Line Effect */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="w-full h-1 bg-cyan-400/30 absolute top-0 shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-[scan_3s_linear_infinite]"></div>
        </div>

        <h2 className="text-2xl text-slate-100 tracking-wide font-medium flex items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400 animate-spin-slow" />
          正在生成最优处置方案...
        </h2>

        <ProgressRing progress={progress} />

        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between items-center text-sm text-cyan-300/80 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${progress > 30 ? 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]' : 'bg-slate-600'}`}
              ></span>
              计算: 维修时长预测
            </span>
            <span>{progress > 30 ? 'DONE' : '...'}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-cyan-300/80 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${progress > 60 ? 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]' : 'bg-slate-600'}`}
              ></span>
              计算: 流出风险评估
            </span>
            <span>{progress > 60 ? 'DONE' : '...'}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-cyan-300/80 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${progress > 90 ? 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]' : 'bg-slate-600'}`}
              ></span>
              计算: 交付影响模拟
            </span>
            <span>{progress > 90 ? 'DONE' : '...'}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 flex gap-4 opacity-50 pointer-events-none">
        <button className="px-6 py-2 bg-slate-700 text-slate-400 rounded border border-slate-600">
          执行方案A (加载中)
        </button>
        <button className="px-6 py-2 bg-slate-800 text-slate-500 rounded border border-slate-700">
          查看明细 (不可用)
        </button>
      </div>
    </div>
  )
}

/**
 * Metric Card Component
 */
const MetricCard = ({ title, value, sub, color, icon: Icon, trend }: any) => {
  // Dynamic color mapping
  const theme =
    {
      blue: 'border-blue-500/30 bg-blue-900/10 text-blue-400',
      green: 'border-green-500/30 bg-green-900/10 text-green-400',
      red: 'border-red-500/30 bg-red-900/10 text-red-400',
      yellow: 'border-yellow-500/30 bg-yellow-900/10 text-yellow-400',
    }[color] || 'border-slate-700 bg-slate-800 text-slate-400'

  return (
    <div
      className={`relative p-5 rounded-xl border ${theme} backdrop-blur-sm overflow-hidden group hover:border-opacity-60 transition-all duration-300`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        {Icon && (
          <Icon className={`w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity`} />
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold font-mono tracking-tighter text-white">{value}</span>
        {trend && <span className="text-lg font-bold mb-1">↗</span>}
      </div>
      <div className="text-xs mt-2 opacity-80 font-mono flex items-center gap-2">
        {color === 'red' || color === 'yellow' ? <AlertTriangle className="w-3 h-3" /> : null}
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
    ? 'border-2 border-blue-500 bg-blue-900/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02]'
    : 'border border-slate-700 bg-slate-800/40 hover:bg-slate-800/60'

  const glow = isRecommended
    ? 'absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none'
    : ''

  return (
    <div
      onClick={onClick}
      className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 group ${containerClasses}`}
    >
      {glow && <div className={glow}></div>}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <h3 className={`text-lg font-bold ${isRecommended ? 'text-white' : 'text-slate-200'}`}>
            {title}
          </h3>
          {recommend && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded border border-yellow-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-yellow-300" /> 推荐
            </span>
          )}
        </div>
        {isRecommended ? (
          <CheckCircle2 className="w-6 h-6 text-green-400 fill-green-900" />
        ) : type === 'B' ? (
          <AlertTriangle className="w-6 h-6 text-orange-400" />
        ) : (
          <AlertOctagon className="w-6 h-6 text-red-500" />
        )}
      </div>

      <p className="text-slate-300 text-sm mb-6 font-medium h-10">{description}</p>

      <div className="space-y-3 relative z-10">
        {/* Metric Bars */}
        <div className="flex items-center gap-3 text-xs">
          <span className="w-16 text-slate-500">交付影响</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${metrics.deliveryColor}`}
              style={{ width: metrics.delivery }}
            ></div>
          </div>
          <span className="w-12 text-right font-mono text-slate-300">{metrics.deliveryVal}</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="w-16 text-slate-500">质量风险</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${metrics.riskColor}`}
              style={{ width: metrics.risk }}
            ></div>
          </div>
          <span className="w-12 text-right font-bold">{metrics.riskVal}</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="w-16 text-slate-500">成本</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${metrics.costColor}`}
              style={{ width: metrics.cost }}
            ></div>
          </div>
          <span className="w-12 text-right font-bold">{metrics.costVal}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-end items-end relative z-10">
        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">预计总损失</div>
          <div className="text-2xl font-mono font-bold text-slate-100">{loss}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Dashboard Content View
 */
const DashboardView = ({ onRefresh }: { onRefresh: () => void }) => {
  return (
    <main className="flex-1 p-6 flex flex-col gap-6 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Title Section */}
      <div className="flex items-center gap-2 border-l-4 border-blue-500 pl-3">
        <h2 className="text-lg font-bold text-white">关键性积</h2>
      </div>

      {/* Top Row: KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="预计维修时长"
          value={
            <>
              38 <span className="text-sm text-slate-400 ml-1">min</span>
            </>
          }
          sub="(±12)"
          color="blue"
          icon={Clock}
        />
        <MetricCard
          title="修复成功概率"
          value="82%"
          trend={true}
          sub=""
          color="green"
          icon={TrendingUp}
        />
        <MetricCard
          title="流出风险"
          value="高 12%"
          sub="(若继续生产)"
          color="red"
          icon={AlertOctagon}
        />
        <MetricCard
          title="交付影响"
          value="延迟 0.6天"
          sub="(若立刻停线)"
          color="yellow"
          icon={AlertTriangle}
        />
      </div>

      {/* Divider Title */}
      <div className="flex items-center gap-3 mt-2">
        <div className="h-4 w-1 bg-slate-600 rounded-full"></div>
        <h2 className="text-lg font-bold text-white">处置方案</h2>
        <span className="text-xs text-slate-500 font-mono">(按损失最小化排序)</span>
      </div>

      {/* Middle Row: Plan Cards */}
      <div className="grid grid-cols-3 gap-6 flex-1">
        <PlanCard
          type="A"
          title="方案A"
          recommend={true}
          description="停线隔离 + 快速换件 + 首件确认"
          metrics={{
            delivery: '30%',
            deliveryColor: 'bg-yellow-400',
            deliveryVal: '0.3天',
            risk: '20%',
            riskColor: 'bg-green-500',
            riskVal: '低',
            cost: '60%',
            costColor: 'bg-yellow-400',
            costVal: '中',
          }}
          loss="¥32k"
        />
        <PlanCard
          type="B"
          title="方案B"
          description="降速生产 + 100%在线检 + 并行排查"
          metrics={{
            delivery: '60%',
            deliveryColor: 'bg-green-500',
            deliveryVal: '交付不延迟',
            risk: '50%',
            riskColor: 'bg-yellow-400',
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
            deliveryColor: 'bg-green-500',
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

      {/* Footer Area */}
      <div className="h-20 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between pt-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-300 font-bold">依据</span>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-4">
            <span>相比故障记录30次</span>
            <span className="w-px h-3 bg-slate-700"></span>
            <span>参数偏离: 温度+8°C、振动+12%</span>
            <span className="w-px h-3 bg-slate-700"></span>
            <span>近15分钟不良趋势上升</span>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="text-xs text-red-400/70 mr-4">建议在5分钟内决策，超过将增加损失</div>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded bg-slate-800 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="px-6 py-2.5 text-slate-300 border border-slate-600 rounded bg-slate-800/50 hover:bg-slate-700 transition-colors text-sm font-medium">
            查看明细
          </button>
          <button className="px-6 py-2.5 text-slate-300 border border-slate-600 rounded bg-slate-800/50 hover:bg-slate-700 transition-colors text-sm font-medium">
            导出记录
          </button>
          <button className="px-8 py-2.5 text-white bg-blue-600 hover:bg-blue-500 rounded shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:scale-105 text-sm font-bold flex items-center gap-2">
            执行方案A
          </button>
        </div>
      </div>
    </main>
  )
}

/**
 * Main App Container
 */
const App = () => {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [showDashboard, setShowDashboard] = useState(false)

  // Simulation of the loading process
  useEffect(() => {
    if (loading) {
      let currentProgress = 0
      const interval = setInterval(() => {
        // Non-linear progress for realism
        const increment = Math.random() * 3 + 0.5
        currentProgress += increment

        if (currentProgress >= 100) {
          currentProgress = 100
          clearInterval(interval)
          // Wait a split second at 100% before showing dashboard
          setTimeout(() => {
            setLoading(false)
            setShowDashboard(true)
          }, 600)
        }

        setProgress(currentProgress)
      }, 50) // Updates every 50ms

      return () => clearInterval(interval)
    }
  }, [loading])

  const handleRefresh = () => {
    setLoading(true)
    setProgress(0)
    setShowDashboard(false)
  }

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      {/* Background Industrial Grid/Noise Texture */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#334155 1px, transparent 1px), radial-gradient(#334155 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      ></div>

      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <Header />

      <div className="relative flex-1 flex flex-col z-10">
        {/* We render DashboardView but blur it if loading */}
        <div
          className={`absolute inset-0 flex flex-col transition-all duration-700 ${loading ? 'scale-95 opacity-30 filter blur-sm' : 'scale-100 opacity-100 blur-0'}`}
        >
          {/* Always render dashboard structure so it's visible behind the glass */}
          <DashboardView onRefresh={handleRefresh} />
        </div>

        {/* Loading Overlay */}
        {loading && <LoadingView progress={progress} />}
      </div>
    </div>
  )
}

export default App
