import { Activity, Clock, DollarSign, Target, TrendingUp, Users } from 'lucide-react'
import type React from 'react'
import type { DashboardMetrics } from '../types'

interface Props {
  metrics: DashboardMetrics
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  progress?: number
  trend?: number
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'amber' | 'emerald'
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  unit,
  progress,
  trend,
  color = 'blue',
}) => {
  // 颜色映射
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      progress: 'bg-blue-600',
      trend: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      progress: 'bg-green-600',
      trend: 'text-green-600',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      progress: 'bg-orange-600',
      trend: 'text-orange-600',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      progress: 'bg-purple-600',
      trend: 'text-purple-600',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      progress: 'bg-amber-600',
      trend: 'text-amber-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      progress: 'bg-emerald-600',
      trend: 'text-emerald-600',
    },
  }

  const colors = colorMap[color]

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      {/* 头部：图标和标签 */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${colors.bg} rounded-lg`}>{icon}</div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>

      {/* 数值 */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>

      {/* 进度条 */}
      {progress !== undefined && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
          <div
            className={`${colors.progress} h-1.5 rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {/* 趋势 */}
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          <TrendingUp size={12} className={trend >= 0 ? 'text-green-500' : 'text-red-500'} />
          <span className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">环比昨日</span>
        </div>
      )}
    </div>
  )
}

const DataDashboard: React.FC<Props> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 当日计划完成率 */}
      <MetricCard
        icon={<Target size={18} className="text-blue-600" />}
        label="当日计划完成率"
        value={metrics.completionRate.toFixed(1)}
        unit="%"
        progress={metrics.completionRate}
        trend={2.3}
        color="blue"
      />

      {/* 实际生产/计划生产 */}
      <MetricCard
        icon={<Activity size={18} className="text-green-600" />}
        label="实际 / 计划生产"
        value={`${metrics.actualProduction} / ${metrics.plannedProduction}`}
        unit="件"
        trend={-1.2}
        color="green"
      />

      {/* 出勤人数 */}
      <MetricCard
        icon={<Users size={18} className="text-purple-600" />}
        label="出勤人数"
        value={metrics.attendance}
        unit="人"
        color="purple"
      />

      {/* 工时效率 */}
      <MetricCard
        icon={<Clock size={18} className="text-orange-600" />}
        label="工时效率"
        value={metrics.efficiency.toFixed(1)}
        unit="%"
        progress={metrics.efficiency}
        trend={1.5}
        color="orange"
      />

      {/* 产值 */}
      <MetricCard
        icon={<DollarSign size={18} className="text-emerald-600" />}
        label="产值"
        value={metrics.outputValue.toFixed(1)}
        unit="万元"
        trend={3.2}
        color="emerald"
      />

      {/* OEE (设备综合效率) */}
      <MetricCard
        icon={<Activity size={18} className="text-amber-600" />}
        label="设备综合效率 (OEE)"
        value={((metrics.completionRate + metrics.efficiency) / 2).toFixed(1)}
        unit="%"
        progress={(metrics.completionRate + metrics.efficiency) / 2}
        trend={0.8}
        color="amber"
      />
    </div>
  )
}

export default DataDashboard
