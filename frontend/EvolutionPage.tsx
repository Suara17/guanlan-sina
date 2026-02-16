import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  TrendingUp,
  Zap,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/Card'

const mockChartData = Array.from({ length: 20 }, (_, i) => ({
  generation: i * 40,
  f1: Math.sin(i * 0.3) * 0.4 + 0.6 + Math.random() * 0.1,
  f2: Math.cos(i * 0.3) * 0.3 + 0.5 + Math.random() * 0.1,
  f3: Math.sin(i * 0.5) * 0.2 + 0.3 + Math.random() * 0.1,
}))

const logs = [
  {
    id: 4,
    text: 'Generation 40: f1=198773.86, f2=46765.17, f3=0.0872, diversity=0.0390',
    time: '18.6s',
    type: 'normal',
  },
  {
    id: 3,
    text: 'Generation 20: f1=209824.21, f2=27080.93, f3=0.0870, diversity=0.0358',
    time: '9.5s',
    type: 'normal',
  },
  {
    id: 2,
    text: 'Generation 0: f1=216500.06, f2=38452.46, f3=0.0872, diversity=0.0171',
    time: '0.4s',
    type: 'normal',
  },
  { id: 1, text: '开始进化 process initialized with seed 48291...', time: '0.0s', type: 'info' },
  { id: 5, text: '警告：种群多样性过低，增加变异率到 0.480', time: '19.2s', type: 'warning' },
]

export default function EvolutionPage() {
  const [progress, setProgress] = useState(73)

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      {/* Top Filter Bar (Reused style) */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500 px-2">筛选:</span>
          <select className="bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-4 py-1.5 text-sm font-medium outline-none">
            <option>设备ID: 204-A</option>
          </select>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>
            最后更新: <span className="font-mono font-bold text-slate-800">20:17:04</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Left: Main Chart */}
        <Card className="col-span-12 lg:col-span-8 flex flex-col" title="实时迭代曲线">
          <div className="flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorF1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorF2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="generation" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="f1"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorF1)"
                  name="适应度 F1"
                />
                <Area
                  type="monotone"
                  dataKey="f2"
                  stroke="#ec4899"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorF2)"
                  name="成本 F2"
                />
                <Line
                  type="monotone"
                  dataKey="f3"
                  stroke="#eab308"
                  strokeWidth={3}
                  dot={false}
                  name="平滑度 F3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Custom */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-3 h-1 bg-blue-500 rounded-full"></div> 适应度 (f1)
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-3 h-1 bg-pink-500 rounded-full"></div> 成本 (f2)
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-3 h-1 bg-yellow-500 rounded-full"></div> 平滑度 (f3)
            </div>
          </div>
        </Card>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Gauge / Status */}
          <Card className="flex-1" title="种群状态">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-48 h-24 overflow-hidden mb-4">
                {/* Simple CSS Gauge Half Circle */}
                <div
                  className="w-48 h-48 rounded-full border-[12px] border-slate-100 border-t-red-500 border-r-red-400 border-l-red-400 box-border absolute top-0 left-0"
                  style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }}
                ></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-2">
                  <div className="text-3xl font-bold text-slate-800">低</div>
                  <div className="text-xs text-slate-400">种群多样性</div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-100 w-full">
                <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={24} />
                <div>
                  <div className="text-amber-900 font-bold text-lg">突变率</div>
                  <div className="text-amber-700 font-mono text-xl flex items-center gap-2">
                    0.486 <ArrowRight size={16} />
                    <span className="font-bold text-amber-600">0.512↑</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Logs */}
          <Card className="flex-[1.5] flex flex-col" title="进化日志">
            <div className="flex-1 overflow-y-auto max-h-[300px] scrollbar-thin pr-2 space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`text-xs p-3 rounded border border-l-4 ${
                    log.type === 'warning'
                      ? 'bg-amber-50 border-amber-100 border-l-amber-500 text-amber-800'
                      : 'bg-slate-50 border-slate-100 border-l-blue-400 text-slate-600'
                  }`}
                >
                  <div className="flex justify-between mb-1 opacity-70">
                    <span>{log.type === 'warning' ? 'ALERT' : 'INFO'}</span>
                    <span>{log.time}</span>
                  </div>
                  <div className="font-mono leading-relaxed break-all">{log.text}</div>
                </div>
              ))}
              <div className="text-center text-xs text-slate-400 italic py-2 animate-pulse">
                正在计算 Generation 60...
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-6">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-blue-600 animate-pulse">进化中...</span>
            <span className="font-bold text-slate-700">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500 striped-bg relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 border border-red-200 transition-colors">
            <Pause size={18} fill="currentColor" />
            停止进化
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors">
            <Settings2 size={18} />
            手动调整
          </button>
        </div>
      </div>

      <style>{`
        .striped-bg {
          background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
          background-size: 1rem 1rem;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
