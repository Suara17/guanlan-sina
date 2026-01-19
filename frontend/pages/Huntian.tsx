import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Info,
  Maximize2,
  Package,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Truck,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer } from 'recharts'

const Huntian: React.FC = () => {
  const [speed, setSpeed] = useState<1 | 10 | 100>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [conflicts, setConflicts] = useState<string[]>([])
  const [showReport, setShowReport] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const timerRef = useRef<number | null>(null)

  // Simulation Logic
  useEffect(() => {
    if (isPlaying && progress < 100) {
      timerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          const next = prev + speed * 0.15
          if (next >= 100) {
            setIsPlaying(false)
            setShowReport(true)
            return 100
          }
          // Conflict trigger storyline
          if (next > 45 && next < 46 && conflicts.length === 0) {
            setConflicts((prev) => [...prev, `T+2h 预测发生 AGV 路径死锁，已自动规避`])
          }
          return next
        })
      }, 50)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, speed, conflicts, progress])

  const resetSimulation = () => {
    setProgress(0)
    setIsPlaying(false)
    setConflicts([])
    setShowReport(false)
    setIsDeploying(false)
  }

  const handlePushToExecution = () => {
    setIsDeploying(true)
    setTimeout(() => {
      alert('指令已下发至物理层控制内核！物理车间已同步重构指令。')
      setIsDeploying(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full bg-[#050810] text-slate-200 overflow-hidden relative">
      {/* Immersive Background Particles Effect Simulation */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Simulation Header / Toolbar */}
      <div className="h-16 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h2 className="font-bold text-white flex items-center gap-2 text-lg tracking-tight">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]"></span>
              浑天 · 验证仿真中心
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Digital Twin Sandbox v2.4
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0 rounded border border-blue-500/20">
                Active Solution: LOGIC_RECONFIG_09
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 mx-2"></div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Time Warp
            </span>
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              {[1, 10, 100].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s as 1 | 10 | 100)}
                  className={`relative px-4 py-1 text-xs font-bold rounded-lg transition-all ${speed === s ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {s}x
                  {speed === s && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
            <Clock size={16} className="text-blue-400" />
            <span className="text-sm font-mono text-blue-100 tabular-nums">
              推演周期: <span className="text-white">T + {Math.floor(progress * 0.72)}h</span>
            </span>
          </div>
          <button
            type="button"
            onClick={resetSimulation}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all border border-white/5"
          >
            <RotateCcw size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-3 px-8 py-2.5 rounded-xl font-bold text-sm transition-all shadow-2xl ${
              isPlaying
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
            {isPlaying ? '暂停推演' : '启动超实时仿真'}
          </button>
        </div>
      </div>

      {/* Main Viewport Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-12">
        {/* The Digital Twin Canvas (Top-Down Map Simulation) */}
        <div className="relative w-full h-full bg-[#0a0f1d] rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Grid with perspective feel */}
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `
                        linear-gradient(to right, #3b82f6 1px, transparent 1px),
                        linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
                    `,
              backgroundSize: '60px 60px',
            }}
          ></div>

          {/* Factory Layout - Isometric 2D feel */}
          <div className="absolute inset-0 p-20 grid grid-cols-6 grid-rows-4 gap-8">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={`grid-cell-${i}`} className="relative group">
                <div
                  className={`absolute inset-0 rounded-2xl border transition-all duration-500 ${
                    isPlaying
                      ? 'border-blue-500/20 bg-blue-500/5'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                ></div>

                {/* Status Light on each machine */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-500/40 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>

                {/* Logic Flow Line Simulation */}
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[80%] h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent overflow-hidden">
                      <div className="h-full w-20 bg-blue-400 blur-sm animate-marquee-once"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AGV Collision Highlight Layer */}
          {conflicts.map((conflict, i) => (
            <div
              key={`conflict-${i}-${conflict}`}
              className="absolute w-40 h-40 border-4 border-red-500/40 rounded-full flex items-center justify-center animate-ping pointer-events-none"
              style={{ left: `42%`, top: `35%` }}
            >
              <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_20px_#ef4444]"></div>
            </div>
          ))}

          {/* Floating Conflict Alert Tag */}
          {conflicts.length > 0 && (
            <div className="absolute top-[32%] left-[46%] animate-in zoom-in-50 duration-300">
              <div className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xl border border-red-400/50">
                <AlertTriangle size={14} /> {conflicts[0]}
              </div>
              <div className="w-px h-10 bg-gradient-to-b from-red-600 to-transparent mx-auto"></div>
            </div>
          )}

          {/* Simulation Overlay Data */}
          <div className="absolute top-10 left-10 flex flex-col gap-4">
            <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl min-w-[200px]">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Node Status
                </span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">资源负载率</span>
                  <span className="text-xs font-mono text-white">
                    {(82 + Math.random() * 5).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">平均队列长度</span>
                  <span className="text-xs font-mono text-white">1.24 items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Progress Bar */}
          <div className="absolute bottom-10 left-10 right-10">
            <div className="flex justify-between items-end mb-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                  Simulation Progress
                </p>
                <p className="text-xl font-black text-white italic tracking-tighter">
                  7-DAY PROJECTION
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-mono font-black text-blue-500">
                  {Math.floor(progress)}%
                </p>
              </div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-400 transition-all duration-300 relative shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute top-0 right-0 w-8 h-full bg-white/30 blur-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Report Panel (Glassmorphism Floating Panel) */}
        <div
          className={`absolute right-16 top-1/2 -translate-y-1/2 w-96 bg-slate-900/60 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-1000 transform ${
            showReport
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-20 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck size={28} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight italic">
                浑天 · ROI 预演报告
              </h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Verification Passed
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="group relative p-5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-[1.5rem] transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <TrendingUp size={12} /> UPH Increase (产能提升)
                </span>
                <div className="flex items-center text-emerald-400 text-xs font-black">
                  <ArrowUpRight size={14} /> 18%
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-mono font-bold text-white">
                  378.0 <span className="text-xs font-normal text-slate-500">/hr</span>
                </p>
                <div className="w-24 h-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[{ v: 20 }, { v: 25 }, { v: 35 }, { v: 45 }, { v: 60 }, { v: 100 }]}
                    >
                      <Bar dataKey="v" fill="#10b981" radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="group relative p-5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-[1.5rem] transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Truck size={12} /> Logistical Distance (搬运缩减)
                </span>
                <div className="flex items-center text-emerald-400 text-xs font-black">
                  <ArrowDownRight size={14} /> 240m
                </div>
              </div>
              <p className="text-3xl font-mono font-bold text-white">
                - 24%{' '}
                <span className="text-[10px] font-normal text-slate-500 ml-2 uppercase">
                  Per Shift
                </span>
              </p>
            </div>

            <div className="group relative p-5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-[1.5rem] transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Package size={12} /> WIP Decrease (在制品库存)
                </span>
                <div className="flex items-center text-emerald-400 text-xs font-black">
                  <ArrowDownRight size={14} /> 12%
                </div>
              </div>
              <p className="text-3xl font-mono font-bold text-white">
                ¥ 21.1w{' '}
                <span className="text-[10px] font-normal text-slate-500 ml-2 uppercase">
                  Capital Released
                </span>
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <Info size={16} className="text-emerald-500 shrink-0" />
              <p className="text-[10px] text-emerald-400/80 leading-snug">
                仿真结论：当前重构方案满足系统预设的安全阈值（99.8%）与预期的经济回报率（ROI &gt;
                140%）。
              </p>
            </div>
            <button
              type="button"
              onClick={handlePushToExecution}
              disabled={isDeploying}
              className="w-full relative group overflow-hidden py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-bold text-sm shadow-[0_20px_40px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isDeploying ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle2 size={20} />
              )}
              <span className="tracking-widest uppercase">验证通过 - 推送物理层执行</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </div>
        </div>

        {/* Viewport Actions */}
        <div className="absolute bottom-10 right-10 flex flex-col gap-3">
          <button
            type="button"
            className="p-3 bg-slate-900/60 backdrop-blur-md rounded-2xl text-slate-400 border border-white/10 hover:text-white transition-all shadow-xl"
          >
            <Maximize2 size={20} />
          </button>
          <button
            type="button"
            className="p-3 bg-slate-900/60 backdrop-blur-md rounded-2xl text-slate-400 border border-white/10 hover:text-white transition-all shadow-xl"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(500%); }
        }
        .animate-marquee-once {
            animation: marquee 2s linear infinite;
        }
      `}</style>
    </div>
  )
}

const Loader2 = ({ size, className }: { size: number; className: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Loading"
  >
    <title>Loading</title>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

export default Huntian
