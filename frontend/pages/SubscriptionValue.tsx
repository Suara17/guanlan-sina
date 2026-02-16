import { ArrowLeft, BarChart3, TrendingUp, Wallet } from 'lucide-react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const OEE_IMPROVEMENT_DATA = [
  { month: '1月', oee: 12 },
  { month: '2月', oee: 18 },
  { month: '3月', oee: 15 },
  { month: '4月', oee: 22 },
  { month: '5月', oee: 28 },
  { month: '6月', oee: 35 },
]

const COST_SAVING_DATA = [
  { name: '已节省', value: 75, color: '#22c55e' },
  { name: '待节省', value: 25, color: '#e2e8f0' },
]

const MONTHLY_SAVING_DATA = [
  { month: '1月', saving: 12.5 },
  { month: '2月', saving: 15.3 },
  { month: '3月', saving: 14.8 },
  { month: '4月', saving: 18.2 },
  { month: '5月', saving: 17.6 },
  { month: '6月', saving: 18.0 },
]

const SubscriptionValue: React.FC = () => {
  const navigate = useNavigate()

  const renderActiveShape = (props: {
    cx: number
    cy: number
    innerRadius: number
    outerRadius: number
    startAngle: number
    endAngle: number
    payload: { name: string; value: number }
  }) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, payload } = props
    return (
      <g>
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#334155" className="text-2xl font-bold">
          {payload.value}%
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill="#64748b" className="text-xs">
          节省进度
        </text>
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill={payload.name === '已节省' ? '#22c55e' : '#e2e8f0'}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={payload.name === '已节省' ? '#22c55e' : '#e2e8f0'}
        />
      </g>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate('/app/')}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            订阅价值复盘
            <span className="text-xs font-normal text-white bg-green-600 px-2 py-0.5 rounded-full">
              数据概览
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">订阅服务价值分析与成本节省汇报</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm text-slate-500">OEE提升</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">+35%</p>
          <p className="text-xs text-green-600 mt-1">较基线提升显著</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <span className="text-sm text-slate-500">年度节省</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">¥128.5万</p>
          <p className="text-xs text-green-600 mt-1">已完成75%目标</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <span className="text-sm text-slate-500">月均节省</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">¥16.1万</p>
          <p className="text-xs text-slate-500 mt-1">持续稳定收益</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm text-slate-500">ROI</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">3.2x</p>
          <p className="text-xs text-green-600 mt-1">投资回报率</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              OEE提升趋势
            </h3>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +35%
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={OEE_IMPROVEMENT_DATA} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [`+${value}%`, 'OEE提升']}
                />
                <Bar dataKey="oee" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Wallet size={18} className="text-green-500" />
              年度成本节省
            </h3>
            <span className="text-lg font-bold text-slate-800">¥128.5万</span>
          </div>
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={COST_SAVING_DATA}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  activeIndex={0}
                  activeShape={renderActiveShape}
                >
                  {COST_SAVING_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-6">
              <span className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                已节省 ¥96.4万
              </span>
              <span className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 bg-slate-200 rounded-full"></span>
                待节省 ¥32.1万
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-500" />
              月度节省明细
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_SAVING_DATA} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `¥${value}万`}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [`¥${value}万`, '节省金额']}
                />
                <Bar dataKey="saving" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionValue
