import {
  Activity,
  DollarSign,
  Loader2,
  MonitorPlay,
  Move,
  Play,
  Route,
  Sliders,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const Tianchou: React.FC = () => {
  const navigate = useNavigate()
  const [assetMode, setAssetMode] = useState<AssetMode>('light')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showOptimized, setShowOptimized] = useState(false)
  const [weights, setWeights] = useState({ throughput: 70, cost: 40, risk: 20 })

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setShowOptimized(true)
    }, 1800)
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
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50">
      {/* Left Panel: Configuration & Asset Selection (25%) */}
      <div className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto flex flex-col gap-8 shadow-sm">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={14} /> 资产属性定义
          </h2>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setAssetMode('light')
                setShowOptimized(false)
              }}
              className={`py-2 text-xs font-bold rounded-md transition-all ${assetMode === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              轻资产 (组装)
            </button>
            <button
              type="button"
              onClick={() => {
                setAssetMode('heavy')
                setShowOptimized(false)
              }}
              className={`py-2 text-xs font-bold rounded-md transition-all ${assetMode === 'heavy' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              重资产 (精加)
            </button>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-8">
            <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">重构策略类型</p>
            <p className="text-xs font-medium text-blue-800 flex items-center gap-2">
              {assetMode === 'light' ? (
                <>
                  <Move size={14} /> 空间重构：物理布局优化
                </>
              ) : (
                <>
                  <Route size={14} /> 逻辑重构：物流分流重排
                </>
              )}
            </p>
          </div>

          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Sliders size={14} /> 多目标优化权重
          </h2>
          <div className="space-y-6">
            {[
              { key: 'throughput', label: '吞吐量最大化', color: 'accent-blue-600' },
              { key: 'cost', label: '重构成本最小化', color: 'accent-slate-600' },
              { key: 'risk', label: '客诉风险规避', color: 'accent-red-500' },
            ].map((item) => (
              <div key={item.key} className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-mono font-bold">
                    {weights[item.key as keyof typeof weights]}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights[item.key as keyof typeof weights]}
                  onChange={(e) =>
                    setWeights({ ...weights, [item.key]: parseInt(e.target.value, 10) })
                  }
                  className={`w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer ${item.color}`}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-auto w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
          启动决策计算
        </button>
      </div>

      {/* Main Content Area (75%) */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Top: Bottleneck Drift Monitoring */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                瓶颈漂移实时监测 (WIP)
              </h3>
              <p className="text-xs text-slate-500">检测到由上游产能提升引发的下游在制品堆积</p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> 上游检测
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> 漂移瓶颈
              </span>
              <span className="flex items-center gap-1 text-blue-500">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> 下游产线
              </span>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DRIFT_DATA}>
                <defs>
                  <linearGradient id="colorBottleneck" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="upstream"
                  stroke="#94a3b8"
                  fill="transparent"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="bottleneck"
                  stroke="#ef4444"
                  fill="url(#colorBottleneck)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="downstream"
                  stroke="#3b82f6"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Center: Strategy Visualization Dual-Track */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-[400px]">
          {/* View A: Current State */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              当前瓶颈状态
            </h4>
            <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl relative overflow-hidden bg-slate-50/50 p-4">
              {/* Simplified Factory Layout Grid */}
              <div className="grid grid-cols-4 grid-rows-3 gap-4 h-full">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`workstation-${i}`}
                    className={`rounded-lg border-2 flex items-center justify-center text-[10px] font-bold transition-all
                                ${i === 6 ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    {i === 6 ? '瓶颈点: #3 工位' : `工序 ${i + 1}`}
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-red-500/10 w-32 h-32 rounded-full blur-2xl"></div>
              </div>
            </div>
          </div>

          {/* View B: Reconstruction Strategy */}
          <div
            className={`rounded-2xl border p-6 flex flex-col transition-all duration-700 ${
              showOptimized
                ? 'bg-white border-blue-500 shadow-xl'
                : 'bg-slate-100 border-dashed border-slate-300'
            }`}
          >
            {!showOptimized ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <p className="font-bold animate-pulse text-blue-600">
                      正在计算{assetMode === 'light' ? '空间重构' : '逻辑重构'}方案...
                    </p>
                  </>
                ) : (
                  <p className="text-sm">点击左侧“启动决策”生成优化建议</p>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col animate-in fade-in duration-1000">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-blue-700 uppercase tracking-widest">
                    {assetMode === 'light' ? '空间重构方案 (物理搬移)' : '逻辑重构方案 (柔性路由)'}
                  </h4>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                    最短路径 📉 -28%
                  </span>
                </div>
                <div className="flex-1 border-2 border-blue-100 rounded-xl relative overflow-hidden bg-blue-50/30 p-4">
                  {/* Animated Result Visualization */}
                  <div className="grid grid-cols-4 grid-rows-3 gap-4 h-full">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const isMoved = assetMode === 'light' && (i === 6 || i === 7)
                      const isRoute = assetMode === 'heavy' && (i === 1 || i === 5 || i === 9)
                      return (
                        <div
                          key={`result-cell-${i}`}
                          className={`rounded-lg border-2 flex flex-col items-center justify-center text-[10px] font-bold transition-all
                                            ${
                                              isMoved
                                                ? 'bg-blue-600 border-blue-600 text-white translate-x-2'
                                                : isRoute
                                                  ? 'bg-white border-blue-400 text-blue-600 border-dashed animate-pulse'
                                                  : 'bg-white border-slate-200 text-slate-400'
                                            }`}
                        >
                          {isMoved ? (
                            <>
                              <Move size={12} />
                              位置调优
                            </>
                          ) : isRoute ? (
                            <>
                              <Route size={12} />
                              AGV分流
                            </>
                          ) : (
                            `工序 ${i + 1}`
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Economic Arbitration Model */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="text-emerald-500" />
              <h3 className="font-bold text-slate-800">基于期望损失模型的经济性裁决</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 flex-1">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">实施停机损失</p>
                <p className="text-xl font-bold text-slate-700">
                  ¥ {assetMode === 'light' ? '5,200' : '1,200'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  预计耗时 {assetMode === 'light' ? '120min' : '15min'}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-[10px] font-bold text-red-400 uppercase mb-2">潜在客诉风险值</p>
                <p className="text-xl font-bold text-red-600">
                  ¥ {assetMode === 'light' ? '800' : '3,500'}
                </p>
                <p className="text-[10px] text-red-400 mt-1">基于当前交付延期概率计算</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">
                  综合商业期望值 (ROI)
                </p>
                <p className="text-xl font-bold text-blue-600">+ 145%</p>
                <p className="text-[10px] text-blue-400 mt-1">建议采纳方案</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">成本与风险分布</h4>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={economicData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={45}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {economicData.map((entry, index) => (
                      <Cell key={`cell-${entry.name || index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> 收益
              </div>
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> 成本
              </div>
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                <span className="w-2 h-2 rounded-full bg-red-400"></span> 风险
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sinan Insight Overlay (when optimized) */}
      {showOptimized && (
        <div className="absolute top-20 right-8 w-80 bg-slate-900/90 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-right-4 duration-500 z-30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500 rounded-lg shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-tighter mb-1">
                司南智能推演
              </p>
              <p className="text-sm font-medium leading-relaxed mb-4">
                {assetMode === 'light'
                  ? "检测到组装段 WIP 堆积。建议采用'空间重构'：将 #3 工位前移 1.5 米，物理缩短搬运功，可消除 85% 的滞留环节。"
                  : "检测到精加设备不可移动。建议采用'逻辑重构'：重调度 AGV-04 至 #2 备用路由，绕开过载节点，实现负载动态平衡。"}
              </p>
              <button
                type="button"
                onClick={() => navigate('/app/huntian')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg"
              >
                <MonitorPlay size={14} /> 去仿真验证 (浑天)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tianchou
