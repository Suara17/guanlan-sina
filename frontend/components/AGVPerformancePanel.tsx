/**
 * AGV 性能指标面板组件
 * 用于展示 AGV 调度系统的关键性能指标
 */

import { motion } from 'framer-motion'
import { Activity, AlertTriangle, Clock, Gauge, Package, TrendingUp } from 'lucide-react'

interface PerformanceMetrics {
  totalCompletionTime: number // 总完工时间（秒）
  bottleneckUtilization: number // 瓶颈利用率 (%)
  throughput: number // 吞吐量（件/小时）
  avgAGVUtilization: number // AGV 平均利用率 (%)
  conflictCount: number // 冲突次数
  overallEfficiency: number // 整体效率 (%)
}

interface AGVPerformancePanelProps {
  metrics: PerformanceMetrics
  currentTime?: number
  isPlaying?: boolean
}

/**
 * 指标卡片组件
 */
const MetricCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  progress?: number
  color?: string
  delay?: number
}> = ({ icon, label, value, unit, progress, color = '#3b82f6', delay = 0 }) => {
  return (
    <motion.div
      className="bg-slate-800/50 backdrop-blur-md rounded-lg p-3 border border-white/5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          className="text-xl font-bold"
          style={{ color }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.1 }}
        >
          {value}
        </motion.span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-2">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

/**
 * 格式化时间显示
 */
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(0)}秒`
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}分${secs}秒`
}

/**
 * AGV 性能指标面板主组件
 */
export default function AGVPerformancePanel({
  metrics,
  currentTime = 0,
  isPlaying = false,
}: AGVPerformancePanelProps) {
  // 计算进度
  const timeProgress =
    metrics.totalCompletionTime > 0 ? (currentTime / metrics.totalCompletionTime) * 100 : 0

  return (
    <motion.div
      className="absolute top-4 right-4 w-64 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Activity size={16} className="text-blue-400" />
        <span className="font-bold text-white text-sm">性能指标</span>
        {isPlaying && (
          <motion.div
            className="ml-auto w-2 h-2 bg-green-500 rounded-full"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
          />
        )}
      </div>

      {/* 指标网格 */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {/* 总完工时间 */}
        <MetricCard
          icon={<Clock size={14} className="text-blue-400" />}
          label="总完工时间"
          value={formatTime(metrics.totalCompletionTime)}
          progress={timeProgress}
          color="#3b82f6"
          delay={0}
        />

        {/* 瓶颈利用率 */}
        <MetricCard
          icon={<Gauge size={14} className="text-amber-400" />}
          label="瓶颈利用率"
          value={metrics.bottleneckUtilization.toFixed(1)}
          unit="%"
          progress={metrics.bottleneckUtilization}
          color="#f59e0b"
          delay={0.1}
        />

        {/* 吞吐量 */}
        <MetricCard
          icon={<Package size={14} className="text-green-400" />}
          label="吞吐量"
          value={metrics.throughput.toFixed(0)}
          unit="件/时"
          color="#22c55e"
          delay={0.2}
        />

        {/* AGV 平均利用率 */}
        <MetricCard
          icon={<TrendingUp size={14} className="text-purple-400" />}
          label="AGV利用率"
          value={metrics.avgAGVUtilization.toFixed(1)}
          unit="%"
          progress={metrics.avgAGVUtilization}
          color="#8b5cf6"
          delay={0.3}
        />

        {/* 冲突次数 */}
        <MetricCard
          icon={<AlertTriangle size={14} className="text-red-400" />}
          label="冲突次数"
          value={metrics.conflictCount}
          unit="次"
          color={metrics.conflictCount > 0 ? '#ef4444' : '#22c55e'}
          delay={0.4}
        />

        {/* 整体效率 */}
        <MetricCard
          icon={<Activity size={14} className="text-cyan-400" />}
          label="整体效率"
          value={metrics.overallEfficiency.toFixed(1)}
          unit="%"
          progress={metrics.overallEfficiency}
          color="#06b6d4"
          delay={0.5}
        />
      </div>

      {/* 效率评级 */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">效率评级</span>
          <motion.span
            className="text-sm font-bold"
            style={{
              color:
                metrics.overallEfficiency >= 90
                  ? '#22c55e'
                  : metrics.overallEfficiency >= 70
                    ? '#f59e0b'
                    : '#ef4444',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            {metrics.overallEfficiency >= 90
              ? '优秀'
              : metrics.overallEfficiency >= 80
                ? '良好'
                : metrics.overallEfficiency >= 70
                  ? '一般'
                  : metrics.overallEfficiency >= 60
                    ? '待优化'
                    : '需改进'}
          </motion.span>
        </div>
      </div>
    </motion.div>
  )
}
