import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Beaker,
  Clock3,
  Cpu,
  Gauge,
  ShieldAlert,
  Users,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import FactoryVisualization from '../components/FactoryVisualization'
import ProductionLineSelector from '../components/ProductionLineSelector'
import { DASHBOARD_METRICS, getAnomaliesByLineType, PRODUCTION_LINES } from '../mockData'
import type { NextPlan, ProductionLine, ProductionPlan, ProductChangeWarning } from '../types'

const PRODUCTION_DATA = [
  { time: '08:00', planned: 200, actual: 198 },
  { time: '09:00', planned: 220, actual: 215 },
  { time: '10:00', planned: 220, actual: 180 },
  { time: '11:00', planned: 200, actual: 205 },
  { time: '12:00', planned: 150, actual: 150 },
  { time: '13:00', planned: 220, actual: 218 },
  { time: '14:00', planned: 220, actual: 175 },
]

const QUALITY_DATA = [
  { name: '良品', value: 92, color: '#22c55e' },
  { name: '不良品', value: 8, color: '#ef4444' },
]

const CURRENT_PROCESS_FLOW = [
  { step: 1, name: '上料', station_type: '上料机', cycle_time: 15 },
  { step: 2, name: '锡膏印刷', station_type: '印刷机', cycle_time: 25 },
  { step: 3, name: 'SPI检测', station_type: '检测机', cycle_time: 20 },
  { step: 4, name: '贴片', station_type: '贴片机', cycle_time: 45 },
  { step: 5, name: '回流焊', station_type: '回流焊炉', cycle_time: 180 },
  { step: 6, name: 'AOI检测', station_type: 'AOI', cycle_time: 30 },
  { step: 7, name: '分板', station_type: '分板机', cycle_time: 20 },
  { step: 8, name: '下料', station_type: '下料机', cycle_time: 15 },
]

const NEXT_PROCESS_FLOW = [
  { step: 1, name: '上料', station_type: '上料机', cycle_time: 15 },
  { step: 2, name: '锡膏印刷', station_type: '印刷机', cycle_time: 30 },
  { step: 3, name: 'SPI检测', station_type: '检测机', cycle_time: 25 },
  { step: 4, name: '贴片', station_type: '贴片机', cycle_time: 60 },
  { step: 5, name: '回流焊', station_type: '回流焊炉', cycle_time: 200 },
  { step: 6, name: '翻转', station_type: '翻转机', cycle_time: 10 },
  { step: 7, name: 'B面贴片', station_type: '贴片机', cycle_time: 45 },
  { step: 8, name: '回流焊', station_type: '回流焊炉', cycle_time: 200 },
  { step: 9, name: 'AOI检测', station_type: 'AOI', cycle_time: 35 },
  { step: 10, name: 'ICT测试', station_type: 'ICT', cycle_time: 25 },
  { step: 11, name: '分板', station_type: '分板机', cycle_time: 20 },
  { step: 12, name: '下料', station_type: '下料机', cycle_time: 15 },
]

const formatTime = (value: Date) =>
  value.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

const getStatusTone = (rate: number) => {
  if (rate >= 90) return 'text-emerald-300'
  if (rate >= 75) return 'text-amber-300'
  return 'text-red-300'
}

const formatShortTime = (value: string | null) => {
  if (!value) return '--'
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const formatDuration = (hours?: number) => {
  if (!hours) return '--'
  if (hours < 24) return `${hours}小时`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours === 0 ? `${days}天` : `${days}天${remainHours}小时`
}

const DashboardCompactDemo: React.FC = () => {
  const navigate = useNavigate()
  const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(PRODUCTION_LINES[0])
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [productionPlan, setProductionPlan] = useState<{
    currentPlan: ProductionPlan | null
    nextPlan: NextPlan | null
    productChangeWarning: ProductChangeWarning | null
  }>({
    currentPlan: null,
    nextPlan: null,
    productChangeWarning: null,
  })

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setProductionPlan({
      currentPlan: {
        work_order_no: 'WO-20260224-001',
        product_id: 'p-001',
        product_code: 'PCB-A',
        product_name: 'PCB-A型',
        line_id: selectedLine?.id || 'line-001',
        planned_quantity: 5000,
        actual_quantity: 3250,
        progress_percent: 65,
        estimated_completion_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: 'running',
        process_flow: CURRENT_PROCESS_FLOW,
      },
      nextPlan: {
        work_order_no: 'WO-20260224-002',
        product_id: 'p-002',
        product_code: 'PCB-B',
        product_name: 'PCB-B型',
        planned_quantity: 3000,
        estimated_start_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        estimated_duration_hours: 72,
        process_flow: NEXT_PROCESS_FLOW,
      },
      productChangeWarning: {
        change_detected: true,
        current_product: 'PCB-A',
        next_product: 'PCB-B',
        requires_optimization: true,
        flow_differences: [
          '新增翻转工序（双面贴片）',
          '新增B面贴片工序',
          '新增二次回流焊工序',
          '新增ICT测试工序',
          '印刷周期时间增加5s',
          'AOI检测时间增加5s',
        ],
        current_flow: CURRENT_PROCESS_FLOW,
        next_flow: NEXT_PROCESS_FLOW,
        layout_switch_minutes: 3,
      },
    })
  }, [selectedLine])

  const dashboardMetrics = selectedLine
    ? DASHBOARD_METRICS[selectedLine.id]
    : DASHBOARD_METRICS[PRODUCTION_LINES[0].id]

  const anomalies = useMemo(() => {
    if (!selectedLine) return []
    return getAnomaliesByLineType(selectedLine.type)
  }, [selectedLine])

  const criticalCount = anomalies.filter((item) => item.level === 'critical').length
  const errorCount = anomalies.filter((item) => item.level === 'error').length
  const warningCount = anomalies.filter((item) => item.level === 'warning').length

  const oee = ((dashboardMetrics.completionRate + dashboardMetrics.efficiency) / 2).toFixed(1)
  const qualityRate = QUALITY_DATA[0].value
  const currentPlan = productionPlan.currentPlan
  const nextPlan = productionPlan.nextPlan
  const currentProgress = currentPlan
    ? Math.min(Math.round((currentPlan.actual_quantity / currentPlan.planned_quantity) * 100), 100)
    : 0

  const compactMetrics = [
    {
      label: '计划达成',
      value: `${dashboardMetrics.completionRate.toFixed(1)}%`,
      detail: `${dashboardMetrics.actualProduction}/${dashboardMetrics.plannedProduction} 件`,
      icon: TargetMini,
      tone: 'text-cyan-300',
    },
    {
      label: '设备 OEE',
      value: `${oee}%`,
      detail: '综合效率',
      icon: Gauge,
      tone: getStatusTone(Number(oee)),
    },
    {
      label: '良品率',
      value: `${qualityRate}%`,
      detail: '质量稳定',
      icon: BadgeCheck,
      tone: 'text-emerald-300',
    },
    {
      label: '出勤人数',
      value: `${dashboardMetrics.attendance}`,
      detail: '本班在线',
      icon: Users,
      tone: 'text-violet-300',
    },
    {
      label: '设备状态',
      value:
        selectedLine?.status === 'running'
          ? '在线'
          : selectedLine?.status === 'idle'
            ? '空闲'
            : '异常',
      detail: selectedLine?.name || '--',
      icon: Cpu,
      tone: selectedLine?.status === 'error' ? 'text-red-300' : 'text-emerald-300',
    },
  ]

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,#12314c_0%,#081523_48%,#050b14_100%)] p-2.5 text-slate-100 md:p-3">
      <div className="flex flex-col gap-2.5">
        <section className="rounded-xl border border-cyan-500/20 bg-slate-950/75 px-3 py-2.5 shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_20px_40px_rgba(2,6,23,0.35)]">
          <div className="grid gap-2.5 xl:grid-cols-[1.05fr_1.55fr_0.95fr]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
                <Activity size={16} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/70">
                  联机作业
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-wide text-white">系统正常</h1>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    在线监控
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 xl:grid-cols-3">
              {[
                ['车间名称', 'SMT车间A01'],
                ['班组', '甲班'],
                ['班次', '早班 08:00-20:00'],
                ['负责人', '张工'],
                ['产线类型', selectedLine?.type || '--'],
                ['运行时长', '14:23:04'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-lg bg-white/5 px-2.5 py-1.5 ring-1 ring-white/5"
                >
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                    {label}
                  </div>
                  <div className="mt-0.5 truncate text-[13px] font-medium text-slate-100">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col justify-between gap-2 xl:items-end">
              <div className="w-full max-w-sm">
                <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  当前产线
                </div>
                <ProductionLineSelector
                  lines={PRODUCTION_LINES}
                  selectedLine={selectedLine}
                  onSelect={setSelectedLine}
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/5 px-2.5 py-1.5 text-[13px] text-cyan-100">
                <Clock3 size={14} className="text-cyan-300" />
                <span className="font-mono">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          <aside className="flex h-full flex-col rounded-xl border border-white/10 bg-slate-950/70 p-2.5 shadow-lg backdrop-blur xl:min-h-[520px]">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  生产概览
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">关键指标</div>
              </div>
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">
                刷新中
              </span>
            </div>

            <div className="grid gap-1.5">
              {compactMetrics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-white/8 bg-white/[0.04] px-2.5 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] tracking-wide text-slate-400">{item.label}</div>
                      <div className={`mt-0.5 text-lg font-semibold ${item.tone}`}>{item.value}</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">{item.detail}</div>
                    </div>
                    <item.icon size={15} className={`${item.tone} mt-1`} />
                  </div>
                </div>
              ))}
            </div>

          </aside>

          <section className="flex h-full flex-col rounded-xl border border-white/10 bg-slate-950/70 p-2.5 shadow-lg backdrop-blur xl:min-h-[520px]">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    主监控区
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-white">
                    产线运行态势 · {selectedLine?.name}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['计划数', `${dashboardMetrics.plannedProduction}`],
                    ['实际数', `${dashboardMetrics.actualProduction}`],
                    ['产值', `${dashboardMetrics.outputValue.toFixed(1)} 万元`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg bg-white/5 px-2.5 py-1.5 text-right ring-1 ring-white/5"
                    >
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        {label}
                      </div>
                      <div className="mt-0.5 text-[13px] font-semibold text-cyan-200">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 [&>div]:h-full [&>div]:bg-transparent [&>div]:border-0 [&>div]:p-0 [&_.text-slate-700]:!text-slate-100 [&_.text-slate-600]:!text-slate-300 [&_.text-slate-800]:!text-white [&_.bg-white]:!bg-transparent [&_.border-slate-100]:!border-white/10">
                <FactoryVisualization />
              </div>
          </section>

          <aside className="flex h-full flex-col rounded-xl border border-white/10 bg-slate-950/70 p-2.5 shadow-lg backdrop-blur xl:min-h-[520px]">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    事件中心
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-white">告警日志</div>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-300">
                    严重 {criticalCount}
                  </span>
                  <span className="rounded-full bg-orange-500/10 px-2 py-1 text-orange-300">
                    错误 {errorCount}
                  </span>
                  <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-yellow-300">
                    警告 {warningCount}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-1.5 overflow-auto pr-1">
                {anomalies.slice(0, 5).map((item) => {
                  const statusColor =
                    item.level === 'critical'
                      ? 'bg-red-400'
                      : item.level === 'error'
                        ? 'bg-orange-400'
                        : 'bg-yellow-300'

                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => navigate(`/app/gewu?anomalyId=${item.id}`)}
                      className="flex w-full items-start gap-2.5 rounded-lg border border-white/8 bg-white/[0.04] px-2.5 py-2 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
                    >
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${statusColor}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-medium text-slate-100">
                            {item.message}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">{item.time}</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-400">{item.location}</div>
                        <div className="mt-0.5 line-clamp-1 text-[10px] leading-4 text-slate-500">
                          {item.rootCause}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/app/simulation')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:from-cyan-400 hover:to-blue-400"
                >
                  <Beaker size={14} />
                  异常模拟
                </button>
              </div>
          </aside>

          <section className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-lg backdrop-blur xl:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    生产计划
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">当前工单 / 下一工单</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/app/tianchou')}
                  className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-[11px] font-medium text-cyan-200 transition hover:bg-cyan-400/10"
                >
                  查看换型优化
                </button>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-white/8 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        当前工单
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {currentPlan?.work_order_no || '--'}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">
                      运行中
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-slate-900/60 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        产品
                      </div>
                      <div className="mt-1 text-slate-100">
                        {currentPlan ? `${currentPlan.product_code} · ${currentPlan.product_name}` : '--'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/60 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        预计完单
                      </div>
                      <div className="mt-1 text-slate-100">
                        {formatShortTime(currentPlan?.estimated_completion_time ?? null)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/60 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        计划数量
                      </div>
                      <div className="mt-1 text-slate-100">
                        {currentPlan?.planned_quantity.toLocaleString() || '--'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900/60 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        实际数量
                      </div>
                      <div className="mt-1 text-slate-100">
                        {currentPlan?.actual_quantity.toLocaleString() || '--'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">完成进度</span>
                      <span className="font-semibold text-cyan-200">{currentProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                      工艺流程
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {currentPlan?.process_flow?.slice(0, 6).map((step) => (
                        <div key={`current-${step.step}`} className="rounded-lg bg-slate-900/60 px-2.5 py-2">
                          <div className="text-[10px] text-slate-500">
                            {step.step}. {step.station_type}
                          </div>
                          <div className="mt-1 truncate text-[12px] text-slate-100">{step.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-amber-400/15 bg-amber-400/5 px-3 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                      <AlertTriangle size={14} />
                      换型预警
                    </div>
                    <div className="mt-2 text-sm text-slate-200">
                      当前工单 PCB-A 型，下一工单 PCB-B 型
                    </div>
                    <div className="mt-1 text-[11px] leading-5 text-slate-400">
                      新增翻转、B 面贴片、ICT 测试，建议提前做布局优化。
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/app/tianchou')}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
                    >
                      <Beaker size={14} />
                      进入优化评估
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.06] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-amber-200/80">
                        下一工单
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {nextPlan?.work_order_no || '--'}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                      待切换
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-slate-950/40 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-amber-100/40">
                        产品
                      </div>
                      <div className="mt-1 text-slate-100">
                        {nextPlan ? `${nextPlan.product_code} · ${nextPlan.product_name}` : '--'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-950/40 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-amber-100/40">
                        预计开工
                      </div>
                      <div className="mt-1 text-slate-100">
                        {formatShortTime(nextPlan?.estimated_start_time ?? null)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-950/40 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-amber-100/40">
                        计划数量
                      </div>
                      <div className="mt-1 text-slate-100">
                        {nextPlan?.planned_quantity.toLocaleString() || '--'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-950/40 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-amber-100/40">
                        预计时长
                      </div>
                      <div className="mt-1 text-slate-100">
                        {formatDuration(nextPlan?.estimated_duration_hours)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-amber-400/10 bg-slate-950/35 px-3 py-2.5">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-amber-100/50">
                      换型差异
                    </div>
                    <div className="mt-2 grid gap-1">
                      {productionPlan.productChangeWarning?.flow_differences.slice(0, 5).map((item) => (
                        <div key={item} className="text-[12px] text-slate-200">
                          · {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-[11px] text-amber-100/70">
                      布局切换预计 {productionPlan.productChangeWarning?.layout_switch_minutes || '--'} 分钟
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-amber-100/50">
                      下一单工艺
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {nextPlan?.process_flow?.slice(0, 6).map((step) => (
                        <div key={`next-${step.step}`} className="rounded-lg bg-slate-950/40 px-2.5 py-2">
                          <div className="text-[10px] text-amber-100/40">
                            {step.step}. {step.station_type}
                          </div>
                          <div className="mt-1 truncate text-[12px] text-slate-100">{step.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-2 xl:col-span-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-lg backdrop-blur">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">实时产量监控</div>
                  <div className="text-[11px] text-slate-400">计划 / 实际 / 差异高亮</div>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PRODUCTION_DATA} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(30, 41, 59, 0.35)' }}
                        contentStyle={{
                          backgroundColor: '#020617',
                          border: '1px solid rgba(148,163,184,0.2)',
                          borderRadius: '10px',
                          color: '#e2e8f0',
                        }}
                      />
                      <Bar dataKey="planned" fill="#334155" radius={[3, 3, 0, 0]} barSize={14} />
                      <Bar dataKey="actual" radius={[3, 3, 0, 0]} barSize={14}>
                        {PRODUCTION_DATA.map((entry) => (
                          <Cell
                            key={entry.time}
                            fill={entry.actual < entry.planned * 0.95 ? '#f97316' : '#22d3ee'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 shadow-lg backdrop-blur">
                <div className="mb-2 text-sm font-semibold text-white">质量与节拍</div>
                <div className="grid h-[208px] grid-cols-[140px_1fr] gap-3">
                  <div className="relative rounded-lg bg-white/[0.04] p-2 ring-1 ring-white/5">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={QUALITY_DATA}
                          dataKey="value"
                          innerRadius={40}
                          outerRadius={54}
                          paddingAngle={3}
                        >
                          {QUALITY_DATA.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      <div className="text-[28px] font-semibold leading-none text-emerald-300">
                        {qualityRate}%
                      </div>
                      <div className="mt-1 text-[11px] leading-none text-slate-400">良品率</div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {[
                      ['设备 OEE', `${oee}%`, Number(oee)],
                      [
                        '班次完成率',
                        `${dashboardMetrics.completionRate.toFixed(1)}%`,
                        dashboardMetrics.completionRate,
                      ],
                      ['平均节拍 CT', '24s', 60],
                    ].map(([label, value, percent]) => (
                      <div
                        key={label}
                        className="rounded-lg bg-white/[0.04] px-3 py-3 ring-1 ring-white/5"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{label}</span>
                          <span className="font-semibold text-white">{value}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                            style={{ width: `${Math.min(Number(percent), 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          </section>

        </section>
      </div>
    </div>
  )
}

const TargetMini = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <Gauge size={size} className={className} />
)

export default DashboardCompactDemo
