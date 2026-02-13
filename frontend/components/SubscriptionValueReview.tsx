import type React from 'react'
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

const SubscriptionValueReview: React.FC = () => {
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
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-6">订阅价值复盘</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OEE提升柱状图 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">OEE提升趋势</span>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +35%
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={OEE_IMPROVEMENT_DATA} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
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
                <Bar dataKey="oee" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 成本节省环形图 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">年度成本节省</span>
            <span className="text-lg font-bold text-slate-800">¥128.5万</span>
          </div>
          <div className="h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={COST_SAVING_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
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
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4">
              <span className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                已节省 ¥96.4万
              </span>
              <span className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 bg-slate-200 rounded-full"></span>
                待节省 ¥32.1万
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionValueReview
