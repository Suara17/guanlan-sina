import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Info,
  Maximize2,
  Minimize2,
  Package,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Truck,
} from 'lucide-react'
import type React from 'react'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer } from 'recharts'
import { AGVLayoutVisualizer } from '../components/AGVLayoutVisualizer'
import AGVPathVisualizer from '../components/AGVPathVisualizer'
// 新版可视化组件（D3.js 增强版）
import { DeviceLayoutVisualizer } from '../components/DeviceLayoutVisualizer'
import LayoutVisualizer from '../components/LayoutVisualizer'
import type {
  AssetMode,
  CompareViewMode,
  ScheduleBar,
  SimulationComparisonPayload,
  TimelineBinding,
} from '../types'
import { tianchouService } from './Tianchou/services/tianchouService'

// 模拟布局数据（轻工业场景）
const mockLayoutData = {
  workshopDimensions: { length: 800, width: 500 },
  devices: [
    {
      id: 1,
      name: 'CNC-1',
      originalPosition: [50, 50] as [number, number],
      newPosition: [50, 50] as [number, number],
      size: { width: 80, height: 60 },
    },
    {
      id: 2,
      name: 'CNC-2',
      originalPosition: [200, 50] as [number, number],
      newPosition: [150, 150] as [number, number],
      size: { width: 80, height: 60 },
    },
    {
      id: 3,
      name: '装配线',
      originalPosition: [400, 100] as [number, number],
      newPosition: [350, 200] as [number, number],
      size: { width: 120, height: 80 },
    },
    {
      id: 4,
      name: '检测站',
      originalPosition: [600, 50] as [number, number],
      newPosition: [550, 300] as [number, number],
      size: { width: 60, height: 60 },
    },
    {
      id: 5,
      name: '包装区',
      originalPosition: [200, 350] as [number, number],
      newPosition: [200, 350] as [number, number],
      size: { width: 100, height: 80 },
    },
    {
      id: 6,
      name: '仓库',
      originalPosition: [600, 350] as [number, number],
      newPosition: [600, 350] as [number, number],
      size: { width: 120, height: 100 },
    },
  ],
  movedDevices: [
    { deviceId: 2, distance: 120.5, cost: 5000 },
    { deviceId: 3, distance: 150.2, cost: 8000 },
    { deviceId: 4, distance: 280.7, cost: 3000 },
  ],
  materialFlows: [
    { fromDeviceId: 1, toDeviceId: 2, frequency: 'high' as const, dailyVolume: 450 },
    { fromDeviceId: 2, toDeviceId: 3, frequency: 'high' as const, dailyVolume: 380 },
    { fromDeviceId: 3, toDeviceId: 4, frequency: 'medium' as const, dailyVolume: 200 },
    { fromDeviceId: 4, toDeviceId: 5, frequency: 'medium' as const, dailyVolume: 180 },
    { fromDeviceId: 5, toDeviceId: 6, frequency: 'low' as const, dailyVolume: 100 },
  ],
  heatmapZones: [
    { x: 100, y: 80, width: 150, height: 120, intensity: 0.85, label: '高频作业区' },
    { x: 320, y: 180, width: 180, height: 140, intensity: 0.65, label: '中频作业区' },
    { x: 520, y: 280, width: 120, height: 100, intensity: 0.45, label: '低频作业区' },
  ],
  originalTotalDistance: 2450.5,
  optimizedTotalDistance: 1860.2,
}

// 模拟 AGV 数据（重工业场景）
const mockAGVData = {
  stations: [
    {
      id: 1,
      name: '上料站',
      position: [150, 200] as [number, number],
      utilization: 85,
      status: 'busy' as const,
      type: 'loading' as const,
    },
    {
      id: 2,
      name: '加工站A',
      position: [350, 150] as [number, number],
      utilization: 72,
      status: 'busy' as const,
      type: 'processing' as const,
    },
    {
      id: 3,
      name: '加工站B',
      position: [350, 350] as [number, number],
      utilization: 45,
      status: 'idle' as const,
      type: 'processing' as const,
    },
    {
      id: 4,
      name: '检测站',
      position: [550, 200] as [number, number],
      utilization: 60,
      status: 'busy' as const,
      type: 'processing' as const,
    },
    {
      id: 5,
      name: '下料站',
      position: [750, 250] as [number, number],
      utilization: 90,
      status: 'blocked' as const,
      type: 'unloading' as const,
    },
    {
      id: 6,
      name: '仓库',
      position: [950, 400] as [number, number],
      utilization: 30,
      status: 'idle' as const,
      type: 'storage' as const,
    },
  ],
  agvRoutes: [
    {
      agvId: 1,
      route: [
        [150, 200],
        [250, 200],
        [350, 150],
        [450, 175],
        [550, 200],
      ] as Array<[number, number]>,
      completionTime: 45,
      tasks: [
        {
          from: 1,
          to: 2,
          startTime: 0,
          endTime: 15,
          type: 'transport' as const,
          status: 'completed' as const,
        },
        {
          from: 2,
          to: 4,
          startTime: 15,
          endTime: 35,
          type: 'transport' as const,
          status: 'in_progress' as const,
        },
      ],
    },
    {
      agvId: 2,
      route: [
        [350, 350],
        [450, 300],
        [550, 200],
        [650, 225],
        [750, 250],
      ] as Array<[number, number]>,
      completionTime: 38,
      tasks: [
        {
          from: 3,
          to: 4,
          startTime: 0,
          endTime: 20,
          type: 'pickup' as const,
          status: 'completed' as const,
        },
        {
          from: 4,
          to: 5,
          startTime: 20,
          endTime: 38,
          type: 'unload' as const,
          status: 'in_progress' as const,
        },
      ],
    },
    {
      agvId: 3,
      route: [
        [750, 250],
        [850, 350],
        [950, 400],
      ] as Array<[number, number]>,
      completionTime: 25,
      tasks: [
        {
          from: 5,
          to: 6,
          startTime: 0,
          endTime: 25,
          type: 'transport' as const,
          status: 'in_progress' as const,
        },
      ],
    },
  ],
  conflictPoints: [
    {
      id: 'conflict-1',
      position: [450, 200] as [number, number],
      time: 20,
      severity: 'warning' as const,
      involvedAGVs: [1, 2],
      resolution: 'AGV-2 优先通过',
    },
    {
      id: 'conflict-2',
      position: [550, 220] as [number, number],
      time: 35,
      severity: 'critical' as const,
      involvedAGVs: [1, 2, 3],
      resolution: 'AGV-1 等待',
    },
  ],
  timelineMarkers: [
    { time: 0, label: '仿真开始', type: 'milestone' as const },
    { time: 15, label: 'AGV-1 到达加工站', type: 'task' as const },
    { time: 20, label: '潜在冲突点', type: 'conflict' as const },
    { time: 35, label: '关键冲突', type: 'conflict' as const },
    { time: 45, label: '仿真结束', type: 'milestone' as const },
  ],
}

type HuntianDecisionContext = {
  taskId?: string
  taskName?: string
  solutionId?: string
  solutionRank?: number
  totalCost?: number
  implementationDays?: number
  expectedBenefit?: number
  expectedLoss?: number
  topsisScore?: number
}

type HuntianRouteState = {
  optimizationResult?: {
    type?: string
    taskId?: string
    asset_mode?: AssetMode
    comparison_payload?: SimulationComparisonPayload
    agvData?: Record<string, unknown>
    layoutData?: Record<string, unknown>
    solution?: {
      id?: string
      rank?: number
      total_cost?: number
      implementation_days?: number
      expected_benefit?: number
      topsis_score?: number
    }
  }
  decisionContext?: HuntianDecisionContext
}

type SimulationMode = 'device_rearrangement' | 'route_optimization'

type ModeSimulationState = {
  progress: number
  conflicts: string[]
  showReport: boolean
  isOptimized: boolean
}
type SimulationTaskStatus = 'idle' | 'running' | 'completed'

type LegacyLayoutData = typeof mockLayoutData
type LinkedResourceSelection = {
  deviceIds?: string[]
  lineIds?: string[]
  agvRouteIds?: string[]
}

const DEFAULT_BASELINE_TASKS: ScheduleBar[] = [
  { id: 'base-1', label: '上料准备', start: 0, end: 10, resourceIds: ['D1'], lane: 'A' },
  { id: 'base-2', label: '设备切换', start: 12, end: 26, resourceIds: ['D2'], lane: 'A' },
  { id: 'base-3', label: '首件验证', start: 28, end: 42, resourceIds: ['D3'], lane: 'A' },
  { id: 'base-4', label: '稳定生产', start: 45, end: 70, resourceIds: ['D4'], lane: 'A' },
]

const DEFAULT_OPTIMIZED_TASKS: ScheduleBar[] = [
  { id: 'opt-1', label: '上料准备', start: 0, end: 8, resourceIds: ['D1'], lane: 'B' },
  { id: 'opt-2', label: '设备切换', start: 9, end: 20, resourceIds: ['D2'], lane: 'B' },
  { id: 'opt-3', label: '首件验证', start: 21, end: 31, resourceIds: ['D3'], lane: 'B' },
  { id: 'opt-4', label: '稳定生产', start: 33, end: 52, resourceIds: ['D4'], lane: 'B' },
]

const normalizeResourceId = (id: string): string =>
  id
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')

const extractResourceNumber = (id: string): string | null => {
  const matched = id.match(/\d+/)
  return matched ? matched[0] : null
}

const buildResourceTokenSet = (
  ids: string[] = [],
  kind: 'device' | 'line' | 'agv'
): Set<string> => {
  const tokens = new Set<string>()
  for (const id of ids) {
    if (!id) continue
    const normalized = normalizeResourceId(id)
    if (!normalized) continue
    tokens.add(normalized)
    const numberToken = extractResourceNumber(normalized)
    if (!numberToken) continue
    tokens.add(numberToken)
    if (kind === 'device') {
      tokens.add(`d${numberToken}`)
      tokens.add(`m${numberToken}`)
      tokens.add(`device${numberToken}`)
    } else if (kind === 'line') {
      tokens.add(`line${numberToken}`)
      tokens.add(`l${numberToken}`)
    } else {
      tokens.add(`agv${numberToken}`)
      tokens.add(`r${numberToken}`)
      tokens.add(`route${numberToken}`)
    }
  }
  return tokens
}

const hasBindingIntersection = (
  selectedTokens: Set<string>,
  bindingIds: string[] = [],
  kind: 'device' | 'line' | 'agv'
): boolean => {
  if (selectedTokens.size === 0 || bindingIds.length === 0) return false
  const bindingTokens = buildResourceTokenSet(bindingIds, kind)
  for (const token of bindingTokens) {
    if (selectedTokens.has(token)) return true
  }
  return false
}

type ABTimelineComparisonProps = {
  baselineTasks: ScheduleBar[]
  optimizedTasks: ScheduleBar[]
  timelineBindings: TimelineBinding[]
  selectedSlotId: string | null
  onSelectSlot: (slotId: string) => void
  currentTime: number
  deltaSummary?: string
}

type ToolbarIconButtonProps = {
  active: boolean
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

const ToolbarIconButton: React.FC<ToolbarIconButtonProps> = ({
  active,
  label,
  onClick,
  disabled = false,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`group relative h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
      disabled ? 'bg-white/[0.03] text-slate-600 border-white/5 cursor-not-allowed' : ''
    } ${
      active
        ? 'bg-blue-600 text-white border-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.45)]'
        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
    }`}
    aria-label={label}
  >
    {children}
    <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-[10px] font-medium bg-slate-950/95 border border-white/15 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-40">
      {label}
    </span>
  </button>
)

const ABTimelineComparison: React.FC<ABTimelineComparisonProps> = ({
  baselineTasks,
  optimizedTasks,
  timelineBindings,
  selectedSlotId,
  onSelectSlot,
  currentTime,
  deltaSummary,
}) => {
  const resolveSlotId = (task: ScheduleBar): string | null => {
    const exact = timelineBindings.find(
      (binding) =>
        Math.abs(binding.start - task.start) < 1e-6 && Math.abs(binding.end - task.end) < 1e-6
    )
    if (exact) return exact.slotId
    const overlap = timelineBindings.find(
      (binding) => task.start < binding.end && task.end > binding.start
    )
    return overlap?.slotId ?? null
  }

  const selectedBinding =
    timelineBindings.find((binding) => binding.slotId === selectedSlotId) ?? null
  const stageColumns = useMemo(() => {
    const allTasks = [...baselineTasks, ...optimizedTasks]
    if (timelineBindings.length > 0) {
      return timelineBindings
        .slice()
        .sort((a, b) => a.start - b.start)
        .map((binding, index) => {
          const matchedTask =
            allTasks.find(
              (task) =>
                Math.abs(task.start - binding.start) < 1e-6 &&
                Math.abs(task.end - binding.end) < 1e-6
            ) ?? allTasks.find((task) => task.start < binding.end && task.end > binding.start)
          return {
            slotId: binding.slotId,
            label: matchedTask?.label ?? `阶段 ${index + 1}`,
          }
        })
    }

    const fallbackTasks = baselineTasks.length > 0 ? baselineTasks : optimizedTasks
    return fallbackTasks.map((task, index) => ({
      slotId: `fallback-${index}`,
      label: task.label || `阶段 ${index + 1}`,
    }))
  }, [baselineTasks, optimizedTasks, timelineBindings])
  const getTaskForStage = (
    tasks: ScheduleBar[],
    stageSlotId: string,
    stageIndex: number
  ): ScheduleBar | null => {
    const matchedBySlot = stageSlotId.startsWith('fallback-')
      ? null
      : tasks.find((candidate) => resolveSlotId(candidate) === stageSlotId)
    return matchedBySlot ?? tasks[stageIndex] ?? null
  }
  const baselineTotalHours = useMemo(
    () => baselineTasks.reduce((sum, task) => sum + Math.max(task.end - task.start, 0), 0),
    [baselineTasks]
  )
  const optimizedTotalHours = useMemo(
    () => optimizedTasks.reduce((sum, task) => sum + Math.max(task.end - task.start, 0), 0),
    [optimizedTasks]
  )
  const savedHours = baselineTotalHours - optimizedTotalHours
  const savedRate = baselineTotalHours > 0 ? (savedHours / baselineTotalHours) * 100 : 0
  const stageDiffs: Array<{
    slotId: string
    label: string
    saved: number
    baselineHours: number
    optimizedHours: number
  }> = []
  for (let index = 0; index < stageColumns.length; index += 1) {
    const stage = stageColumns[index]
    const baselineTask = getTaskForStage(baselineTasks, stage.slotId, index)
    const optimizedTask = getTaskForStage(optimizedTasks, stage.slotId, index)
    if (!baselineTask || !optimizedTask) continue
    const baselineHours = Math.max(baselineTask.end - baselineTask.start, 0)
    const optimizedHours = Math.max(optimizedTask.end - optimizedTask.start, 0)
    stageDiffs.push({
      slotId: stage.slotId,
      label: stage.label,
      saved: baselineHours - optimizedHours,
      baselineHours,
      optimizedHours,
    })
  }
  stageDiffs.sort((a, b) => Math.abs(b.saved) - Math.abs(a.saved))

  const lanes: Array<{
    key: 'A' | 'B'
    title: string
    tasks: ScheduleBar[]
    tone: string
    activeTone: string
  }> = [
    {
      key: 'A',
      title: 'A 基线方案',
      tasks: baselineTasks,
      tone: 'bg-slate-600/70 hover:bg-slate-500/80',
      activeTone: 'ring-2 ring-slate-200',
    },
    {
      key: 'B',
      title: 'B 优化方案',
      tasks: optimizedTasks,
      tone: 'bg-blue-600/70 hover:bg-blue-500/80',
      activeTone: 'ring-2 ring-blue-200',
    },
  ]

  return (
    <div className="h-full flex flex-col rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-900/85 backdrop-blur-xl shadow-[0_20px_80px_rgba(2,132,199,0.18)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
            A/B 时间轴对比
          </p>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
            {deltaSummary || '点击任务条可查看关联时段与资源绑定'}
          </p>
        </div>
        <div className="text-right shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-wider text-slate-400">Cursor</p>
          <p className="text-sm font-mono text-cyan-100">
            T+{Math.max(0, currentTime).toFixed(1)}h
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-slate-400">基线工序</p>
          <p className="text-sm font-mono text-white">{baselineTasks.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-slate-400">优化工序</p>
          <p className="text-sm font-mono text-white">{optimizedTasks.length}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="h-full flex flex-col gap-3">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `6.25rem repeat(${stageColumns.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-1.5">
              方案
            </div>
            {stageColumns.map((stage) => (
              <button
                key={`header-${stage.slotId}`}
                type="button"
                onClick={() => {
                  if (!stage.slotId.startsWith('fallback-')) onSelectSlot(stage.slotId)
                }}
                className={`h-8 rounded-md border px-2 text-center text-[12px] font-semibold transition-colors ${
                  selectedSlotId === stage.slotId
                    ? 'bg-cyan-500/20 border-cyan-300/70 text-cyan-100'
                    : 'bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.08]'
                }`}
                title={stage.label}
              >
                <span className="block whitespace-nowrap overflow-hidden text-ellipsis">
                  {stage.label}
                </span>
              </button>
            ))}

            {lanes.map((lane) => (
              <Fragment key={lane.key}>
                <div className="h-9 rounded-md border border-white/10 bg-white/[0.03] px-2 flex items-center text-[11px] text-slate-100 font-semibold">
                  {lane.title}
                </div>
                {stageColumns.map((stage, index) => {
                  const task = getTaskForStage(lane.tasks, stage.slotId, index)
                  const active =
                    task !== null && currentTime >= task.start && currentTime <= task.end
                  const selected = selectedSlotId === stage.slotId
                  const selectable = task !== null && !stage.slotId.startsWith('fallback-')
                  return (
                    <button
                      key={`${lane.key}-${stage.slotId}`}
                      type="button"
                      disabled={!selectable}
                      onClick={() => {
                        if (selectable) onSelectSlot(stage.slotId)
                      }}
                      className={`h-9 rounded-md px-2 text-center text-[11px] font-mono border transition-colors ${
                        task === null
                          ? 'bg-white/[0.03] border-white/10 text-slate-500 cursor-not-allowed'
                          : `${lane.tone} text-white border-white/20`
                      } ${selected ? lane.activeTone : ''} ${active ? 'brightness-110' : ''}`}
                      title={
                        task
                          ? `${stage.label}: ${task.start.toFixed(1)}h - ${task.end.toFixed(1)}h`
                          : `${stage.label}: 暂无数据`
                      }
                    >
                      {task ? `${task.start.toFixed(1)}-${task.end.toFixed(1)}h` : '--'}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">效率概览</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-md bg-slate-900/60 border border-white/10 px-2 py-1.5">
                  <p className="text-[9px] text-slate-400">A 总时长</p>
                  <p className="text-[12px] font-mono text-slate-100">
                    {baselineTotalHours.toFixed(1)}h
                  </p>
                </div>
                <div className="rounded-md bg-slate-900/60 border border-white/10 px-2 py-1.5">
                  <p className="text-[9px] text-slate-400">B 总时长</p>
                  <p className="text-[12px] font-mono text-cyan-100">
                    {optimizedTotalHours.toFixed(1)}h
                  </p>
                </div>
                <div className="rounded-md bg-slate-900/60 border border-cyan-400/30 px-2 py-1.5">
                  <p className="text-[9px] text-slate-400">净节省</p>
                  <p
                    className={`text-[12px] font-mono ${savedHours >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}
                  >
                    {savedHours >= 0 ? '-' : '+'}
                    {Math.abs(savedHours).toFixed(1)}h
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-300">
                相比基线方案，优化方案整体
                <span
                  className={`${savedRate >= 0 ? 'text-emerald-300' : 'text-amber-300'} font-semibold`}
                >
                  {' '}
                  {savedRate >= 0 ? '缩短' : '增加'} {Math.abs(savedRate).toFixed(1)}%
                </span>
                的执行时间。
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">阶段收益</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stageDiffs.length > 0 ? (
                  stageDiffs.slice(0, 6).map((item) => (
                    <button
                      key={`delta-${item.slotId}`}
                      type="button"
                      onClick={() => {
                        if (!item.slotId.startsWith('fallback-')) onSelectSlot(item.slotId)
                      }}
                      className={`px-2 py-1 rounded border text-[10px] transition-colors ${
                        item.saved >= 0
                          ? 'bg-emerald-500/15 border-emerald-300/40 text-emerald-200 hover:bg-emerald-500/25'
                          : 'bg-amber-500/15 border-amber-300/40 text-amber-200 hover:bg-amber-500/25'
                      }`}
                      title={`${item.label}: A ${item.baselineHours.toFixed(1)}h / B ${item.optimizedHours.toFixed(1)}h`}
                    >
                      {item.label} {item.saved >= 0 ? '-' : '+'}
                      {Math.abs(item.saved).toFixed(1)}h
                    </button>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400">暂无可用对比数据</p>
                )}
              </div>
              <p className="mt-2 text-[10px] text-slate-400">
                点击阶段标签可联动下方“联动时段”详情。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-slate-800/70 border border-white/10 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">联动时段</p>
          {selectedBinding ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
              <div className="lg:col-span-4 rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-2">
                <p className="text-[9px] uppercase tracking-wider text-cyan-200/80">时段</p>
                <p className="text-[12px] font-semibold text-cyan-50">
                  {selectedBinding.slotId}: {selectedBinding.start.toFixed(1)} -{' '}
                  {selectedBinding.end.toFixed(1)}h
                </p>
              </div>
              <div className="lg:col-span-4 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-2">
                <p className="text-[9px] uppercase tracking-wider text-slate-400">设备 / 产线</p>
                <p className="text-[11px] text-slate-100">
                  设备 {selectedBinding.deviceIds.join(', ') || '--'} · 产线{' '}
                  {selectedBinding.lineIds.join(', ') || '--'}
                </p>
              </div>
              <div className="lg:col-span-4 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-2">
                <p className="text-[9px] uppercase tracking-wider text-slate-400">AGV 路径</p>
                <p className="text-[11px] text-slate-100">
                  {selectedBinding.agvRouteIds.join(', ') || '--'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">暂无选中时段</p>
          )}
        </div>

        <div className="bg-slate-800/70 border border-white/10 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">时段列表</p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {timelineBindings.slice(0, 10).map((binding) => (
              <button
                key={binding.slotId}
                type="button"
                onClick={() => onSelectSlot(binding.slotId)}
                className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                  selectedSlotId === binding.slotId
                    ? 'bg-blue-600/70 text-white border-blue-300/60'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {binding.slotId}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const Huntian: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [speed, setSpeed] = useState<1 | 10 | 100>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('device_rearrangement')
  const [modeSimulationState, setModeSimulationState] = useState<
    Record<SimulationMode, ModeSimulationState>
  >({
    device_rearrangement: {
      progress: 0,
      conflicts: [],
      showReport: false,
      isOptimized: false,
    },
    route_optimization: {
      progress: 0,
      conflicts: [],
      showReport: false,
      isOptimized: false,
    },
  })
  const [isViewportFullscreen, setIsViewportFullscreen] = useState(false)
  // 新增：可视化模式切换（'new' = 新版 D3.js 组件, 'legacy' = 旧版组件）
  const [visualMode, _setVisualMode] = useState<'new' | 'legacy'>('new')
  const timerRef = useRef<number | null>(null)
  const [agvData, setAgvData] = useState<Record<string, unknown> | null>(null)
  const [layoutData, setLayoutData] = useState<Record<string, unknown> | null>(null)
  const [decisionContext, setDecisionContext] = useState<HuntianDecisionContext | null>(null)
  const [assetMode, setAssetMode] = useState<AssetMode>('light')
  const [compareViewMode, setCompareViewMode] = useState<CompareViewMode>('single_toggle')
  const [comparisonPayload, setComparisonPayload] = useState<SimulationComparisonPayload | null>(
    null
  )
  const [selectedTimelineSlotId, setSelectedTimelineSlotId] = useState<string | null>(null)
  const [isTimelineDrawerOpen, setIsTimelineDrawerOpen] = useState(false)
  const [isRoiPanelVisible, setIsRoiPanelVisible] = useState(false)
  const [taskStatusByMode, setTaskStatusByMode] = useState<
    Record<SimulationMode, SimulationTaskStatus>
  >({
    device_rearrangement: 'idle',
    route_optimization: 'idle',
  })
  const completionNotifiedRef = useRef<Record<SimulationMode, boolean>>({
    device_rearrangement: false,
    route_optimization: false,
  })

  const currentModeState = modeSimulationState[simulationMode]
  const progress = currentModeState.progress
  const conflicts = currentModeState.conflicts
  const showReport = currentModeState.showReport
  const isOptimized = currentModeState.isOptimized
  const baselineTasks = useMemo(() => {
    const fromPayload = comparisonPayload?.scheduleComparison?.baselineTasks
    return fromPayload && fromPayload.length > 0 ? fromPayload : DEFAULT_BASELINE_TASKS
  }, [comparisonPayload?.scheduleComparison?.baselineTasks])
  const optimizedTasks = useMemo(() => {
    const fromPayload = comparisonPayload?.scheduleComparison?.optimizedTasks
    return fromPayload && fromPayload.length > 0 ? fromPayload : DEFAULT_OPTIMIZED_TASKS
  }, [comparisonPayload?.scheduleComparison?.optimizedTasks])
  const timelineBindings = useMemo(() => {
    const fromPayload = comparisonPayload?.timelineBindings
    if (fromPayload && fromPayload.length > 0) return fromPayload
    return optimizedTasks.map((task, index) => ({
      slotId: `slot-${index + 1}`,
      start: task.start,
      end: task.end,
      deviceIds: task.resourceIds,
      lineIds: [],
      agvRouteIds: [],
    }))
  }, [comparisonPayload?.timelineBindings, optimizedTasks])
  const timelineMaxEnd = useMemo(
    () =>
      Math.max(
        ...baselineTasks.map((task) => task.end),
        ...optimizedTasks.map((task) => task.end),
        1
      ),
    [baselineTasks, optimizedTasks]
  )
  const timelineCurrentTime = (progress / 100) * timelineMaxEnd
  const selectedTimelineBinding =
    timelineBindings.find((binding) => binding.slotId === selectedTimelineSlotId) ?? null
  const highlightedResources = useMemo(
    () => ({
      deviceIds: Array.from(buildResourceTokenSet(selectedTimelineBinding?.deviceIds, 'device')),
      lineIds: Array.from(buildResourceTokenSet(selectedTimelineBinding?.lineIds, 'line')),
      agvRouteIds: Array.from(buildResourceTokenSet(selectedTimelineBinding?.agvRouteIds, 'agv')),
    }),
    [selectedTimelineBinding]
  )
  const handleViewportResourceFocus = useCallback(
    (selection: LinkedResourceSelection) => {
      const deviceTokens = buildResourceTokenSet(selection.deviceIds, 'device')
      const lineTokens = buildResourceTokenSet(selection.lineIds, 'line')
      const agvTokens = buildResourceTokenSet(selection.agvRouteIds, 'agv')
      const matched = timelineBindings.filter((binding) => {
        const deviceMatched = hasBindingIntersection(deviceTokens, binding.deviceIds, 'device')
        const lineMatched = hasBindingIntersection(lineTokens, binding.lineIds, 'line')
        const agvMatched = hasBindingIntersection(agvTokens, binding.agvRouteIds, 'agv')
        return deviceMatched || lineMatched || agvMatched
      })
      if (matched.length === 0) return
      const nearest = matched.reduce((best, current) => {
        const bestCenter = (best.start + best.end) / 2
        const currentCenter = (current.start + current.end) / 2
        const bestGap = Math.abs(bestCenter - timelineCurrentTime)
        const currentGap = Math.abs(currentCenter - timelineCurrentTime)
        return currentGap < bestGap ? current : best
      })
      setSelectedTimelineSlotId(nearest.slotId)
    },
    [timelineBindings, timelineCurrentTime]
  )

  useEffect(() => {
    if (timelineBindings.length === 0) {
      setSelectedTimelineSlotId(null)
      return
    }
    setSelectedTimelineSlotId((previous) => {
      if (previous && timelineBindings.some((binding) => binding.slotId === previous)) {
        return previous
      }
      return timelineBindings[0].slotId
    })
  }, [timelineBindings])

  useEffect(() => {
    if (!showReport) {
      setIsRoiPanelVisible(false)
    }
  }, [showReport])

  // 从路由 state 接收数据，无数据时兜底读取最近已完成任务
  useEffect(() => {
    const state = location.state as HuntianRouteState | null

    // 优先级1：直接传入 decisionContext
    if (state?.decisionContext) {
      setDecisionContext(state.decisionContext)
    }

    // 优先级2：从 optimizationResult.solution 组装
    if (state?.optimizationResult?.solution) {
      const sol = state.optimizationResult.solution
      setDecisionContext((prev) => ({
        ...prev,
        taskId: state.optimizationResult?.taskId,
        solutionId: sol.id,
        solutionRank: sol.rank,
        totalCost: sol.total_cost,
        implementationDays: sol.implementation_days,
        expectedBenefit: sol.expected_benefit,
        topsisScore: sol.topsis_score,
      }))
    }

    // 优先级3：处理仿真模式与可视化数据
    const { optimizationResult } = state ?? {}
    if (optimizationResult) {
      if (optimizationResult.asset_mode) {
        setAssetMode(optimizationResult.asset_mode)
      } else if (optimizationResult.type === 'heavy') {
        setAssetMode('heavy')
      } else {
        setAssetMode('light')
      }
      if (optimizationResult.comparison_payload) {
        setComparisonPayload(optimizationResult.comparison_payload)
        if (optimizationResult.comparison_payload.viewMode) {
          setCompareViewMode(optimizationResult.comparison_payload.viewMode)
        }
      }

      if (optimizationResult.type === 'heavy') {
        setSimulationMode('route_optimization')
        if (optimizationResult.agvData) setAgvData(optimizationResult.agvData)
      } else if (optimizationResult.type === 'light') {
        setSimulationMode('device_rearrangement')
        if (optimizationResult.layoutData) setLayoutData(optimizationResult.layoutData)
      }
    }

    // 优先级4（兜底）：无任何路由数据时，从数据库读取最近已完成任务
    if (!state?.decisionContext && !state?.optimizationResult?.solution) {
      // 优先尝试获取轻工业任务（用于设备布局）
      const fetchTask =
        simulationMode === 'device_rearrangement'
          ? tianchouService.getLatestLightTask()
          : tianchouService.getLatestCompletedTask()

      fetchTask
        .then((data) => {
          const sol = data.solution
          setDecisionContext({
            taskId: data.task.task_id,
            taskName: data.task.name,
            solutionId: sol ? String(sol.id) : undefined,
            solutionRank: sol?.rank,
            totalCost: sol?.total_cost,
            implementationDays: sol?.implementation_days,
            expectedBenefit: sol?.expected_benefit,
            expectedLoss: sol?.expected_loss,
            topsisScore: sol?.topsis_score,
          })
        })
        .catch(() => {
          // 无历史任务，保持 decisionContext 为 null
        })
    }
  }, [location.state, simulationMode])

  // Simulation Logic
  useEffect(() => {
    if (isPlaying && currentModeState.progress < 100) {
      timerRef.current = window.setInterval(() => {
        setModeSimulationState((prev) => {
          const modeState = prev[simulationMode]
          const next = modeState.progress + speed * 0.15

          if (next >= 100) {
            setIsPlaying(false)
            return {
              ...prev,
              [simulationMode]: {
                ...modeState,
                progress: 100,
                showReport: true,
                isOptimized: true,
              },
            }
          }

          if (next > 45 && next < 46 && modeState.conflicts.length === 0) {
            return {
              ...prev,
              [simulationMode]: {
                ...modeState,
                progress: next,
                conflicts: [...modeState.conflicts, 'T+2h 预测发生 AGV 路径死锁，已自动规避'],
              },
            }
          }

          return {
            ...prev,
            [simulationMode]: {
              ...modeState,
              progress: next,
            },
          }
        })
      }, 50)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, speed, simulationMode, currentModeState.progress])

  useEffect(() => {
    if (currentModeState.progress < 100) return
    if (completionNotifiedRef.current[simulationMode]) return
    completionNotifiedRef.current[simulationMode] = true
    setTaskStatusByMode((prev) => ({
      ...prev,
      [simulationMode]: 'completed',
    }))
    alert(
      `${simulationMode === 'device_rearrangement' ? '设备重排仿真' : '线路优化仿真'}已完成，任务状态已更新为“已完成”。`
    )
  }, [currentModeState.progress, simulationMode])

  useEffect(() => {
    if (!isViewportFullscreen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsViewportFullscreen(false)
      }
    }

    const originalBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalBodyOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isViewportFullscreen])

  const resetSimulation = () => {
    setIsPlaying(false)
    setIsDeploying(false)
    setIsRoiPanelVisible(false)
    completionNotifiedRef.current[simulationMode] = false
    setModeSimulationState((prev) => ({
      ...prev,
      [simulationMode]: {
        progress: 0,
        conflicts: [],
        showReport: false,
        isOptimized: false,
      },
    }))
    setTaskStatusByMode((prev) => ({
      ...prev,
      [simulationMode]: 'idle',
    }))
  }

  const handleSimulationToggle = () => {
    if (isPlaying) {
      setIsPlaying(false)
      setTaskStatusByMode((prev) => ({
        ...prev,
        [simulationMode]: 'idle',
      }))
      return
    }

    completionNotifiedRef.current[simulationMode] = false
    setModeSimulationState((prev) => {
      const modeState = prev[simulationMode]
      if (modeState.progress < 100) return prev
      return {
        ...prev,
        [simulationMode]: {
          progress: 0,
          conflicts: [],
          showReport: false,
          isOptimized: false,
        },
      }
    })
    setTaskStatusByMode((prev) => ({
      ...prev,
      [simulationMode]: 'running',
    }))
    setIsRoiPanelVisible(false)
    setIsPlaying(true)
  }

  const _handleBackToTianchou = (focus: 'solution' | 'pareto') => {
    navigate('/app/tianchou', {
      state: {
        fromHuntian: true,
        taskId: decisionContext?.taskId,
        solutionId: decisionContext?.solutionId,
        focus,
      },
    })
  }

  const handlePushToExecution = () => {
    setIsDeploying(true)
    setTimeout(() => {
      alert('指令已下发至物理层控制内核！物理车间已同步重构指令。')
      setIsDeploying(false)
    }, 1500)
  }
  const currentTaskStatus = taskStatusByMode[simulationMode]
  const currentTaskStatusLabel =
    currentTaskStatus === 'running'
      ? '仿真中'
      : currentTaskStatus === 'completed'
        ? '已完成'
        : '待运行'
  const currentTaskStatusTone =
    currentTaskStatus === 'running'
      ? 'bg-blue-500/15 border-blue-400/40 text-blue-200'
      : currentTaskStatus === 'completed'
        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
        : 'bg-slate-700/40 border-white/10 text-slate-300'

  const renderCurrentSimulationView = (variant: 'single' | 'baseline' | 'optimized' = 'single') => {
    const paneOptimized = variant === 'single' ? isOptimized : variant === 'optimized'
    const effectiveVisualMode = variant === 'single' ? visualMode : 'new'

    if (simulationMode === 'device_rearrangement') {
      if (effectiveVisualMode === 'new') {
        return (
          <div className="h-full w-full bg-white rounded-xl overflow-hidden">
            <DeviceLayoutVisualizer
              isOptimized={paneOptimized}
              layoutData={
                layoutData as React.ComponentProps<typeof DeviceLayoutVisualizer>['layoutData']
              }
              decisionContext={decisionContext ?? undefined}
              highlightDeviceIds={highlightedResources.deviceIds}
              highlightLineIds={highlightedResources.lineIds}
              onFocusResources={handleViewportResourceFocus}
            />
          </div>
        )
      }

      if (layoutData) {
        return (
          <LayoutVisualizer layoutData={layoutData as LegacyLayoutData} isPlaying={isPlaying} />
        )
      }

      return <LayoutVisualizer layoutData={mockLayoutData} isPlaying={isPlaying} />
    }

    if (effectiveVisualMode === 'new') {
      return (
        <div className="h-full w-full bg-white rounded-xl overflow-hidden">
          <AGVLayoutVisualizer
            isOptimized={paneOptimized}
            agvData={agvData}
            highlightRouteIds={highlightedResources.agvRouteIds}
            onFocusResources={handleViewportResourceFocus}
          />
        </div>
      )
    }

    if (agvData) {
      return (
        <AGVPathVisualizer
          stations={(agvData.stations as typeof mockAGVData.stations) || mockAGVData.stations}
          routes={(agvData.agvRoutes as typeof mockAGVData.agvRoutes) || mockAGVData.agvRoutes}
          isPlaying={isPlaying}
          speed={speed}
          canvasWidth={1200}
          canvasHeight={800}
          conflictPoints={
            (agvData.conflictPoints as typeof mockAGVData.conflictPoints) ||
            mockAGVData.conflictPoints
          }
          timelineMarkers={
            (agvData.timelineMarkers as typeof mockAGVData.timelineMarkers) ||
            mockAGVData.timelineMarkers
          }
          highlightRouteIds={highlightedResources.agvRouteIds}
          onFocusResources={handleViewportResourceFocus}
          showPerformancePanel={true}
        />
      )
    }

    return (
      <AGVPathVisualizer
        stations={mockAGVData.stations}
        routes={mockAGVData.agvRoutes}
        isPlaying={isPlaying}
        speed={speed}
        canvasWidth={1200}
        canvasHeight={800}
        conflictPoints={mockAGVData.conflictPoints}
        timelineMarkers={mockAGVData.timelineMarkers}
        highlightRouteIds={highlightedResources.agvRouteIds}
        onFocusResources={handleViewportResourceFocus}
        showPerformancePanel={true}
      />
    )
  }

  const renderViewportContent = () => {
    if (compareViewMode === 'single_toggle') {
      return <div className="absolute inset-0">{renderCurrentSimulationView('single')}</div>
    }

    const splitClass = compareViewMode === 'split_tb' ? 'grid-rows-2' : 'grid-cols-2'
    return (
      <div className={`absolute inset-0 p-3 grid ${splitClass} gap-3`}>
        {[
          { variant: 'baseline' as const, title: '基线方案 A', subtitle: '优化前' },
          { variant: 'optimized' as const, title: '优化方案 B', subtitle: '优化后' },
        ].map((panel) => (
          <div
            key={panel.variant}
            className="relative min-h-0 rounded-2xl border border-white/15 bg-slate-900/50 overflow-hidden"
          >
            <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-md bg-slate-950/70 border border-white/15">
              <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
                {panel.title}
              </p>
              <p className="text-[10px] text-slate-400">{panel.subtitle}</p>
            </div>
            <div className="h-full">{renderCurrentSimulationView(panel.variant)}</div>
          </div>
        ))}
      </div>
    )
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
        <div className="flex items-center gap-4 min-w-0 flex-1 overflow-visible pr-2">
          <div className="flex items-center gap-2 shrink-0">
            <span className="group relative inline-flex">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]"></span>
              <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-[10px] font-medium bg-slate-950/95 border border-white/15 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                仿真在线
              </span>
            </span>
            <span className="group relative inline-flex">
              <span
                className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px] ${
                  assetMode === 'heavy'
                    ? 'bg-amber-400 shadow-amber-500/60'
                    : 'bg-emerald-400 shadow-emerald-500/60'
                }`}
              ></span>
              <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-[10px] font-medium bg-slate-950/95 border border-white/15 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                {assetMode === 'heavy' ? '重资产' : '轻资产'}
              </span>
            </span>
          </div>

          <div className="h-8 w-px bg-white/10 mx-1 shrink-0"></div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <ToolbarIconButton
                active={simulationMode === 'device_rearrangement'}
                label="设备重排"
                onClick={() => {
                  setTaskStatusByMode((prev) => ({
                    ...prev,
                    [simulationMode]: isPlaying ? 'idle' : prev[simulationMode],
                  }))
                  setIsPlaying(false)
                  setSimulationMode('device_rearrangement')
                }}
              >
                <Package size={15} />
              </ToolbarIconButton>
              <ToolbarIconButton
                active={simulationMode === 'route_optimization'}
                label="线路优化"
                onClick={() => {
                  setTaskStatusByMode((prev) => ({
                    ...prev,
                    [simulationMode]: isPlaying ? 'idle' : prev[simulationMode],
                  }))
                  setIsPlaying(false)
                  setSimulationMode('route_optimization')
                }}
              >
                <Truck size={15} />
              </ToolbarIconButton>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 shrink-0"></div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <ToolbarIconButton
                active={compareViewMode === 'single_toggle'}
                label="单屏视图"
                onClick={() => setCompareViewMode('single_toggle')}
              >
                <span className="inline-block w-3.5 h-3.5 border border-current rounded-[3px]"></span>
              </ToolbarIconButton>
              <ToolbarIconButton
                active={compareViewMode === 'split_lr'}
                label="左右分屏"
                onClick={() => setCompareViewMode('split_lr')}
              >
                <span className="inline-grid grid-cols-2 gap-[2px] w-3.5 h-3.5">
                  <span className="border border-current rounded-[2px]"></span>
                  <span className="border border-current rounded-[2px]"></span>
                </span>
              </ToolbarIconButton>
              <ToolbarIconButton
                active={compareViewMode === 'split_tb'}
                label="上下分屏"
                onClick={() => setCompareViewMode('split_tb')}
              >
                <span className="inline-grid grid-rows-2 gap-[2px] w-3.5 h-3.5">
                  <span className="border border-current rounded-[2px]"></span>
                  <span className="border border-current rounded-[2px]"></span>
                </span>
              </ToolbarIconButton>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 shrink-0"></div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              {[1, 10, 100].map((s) => (
                <ToolbarIconButton
                  key={s}
                  active={speed === s}
                  label={`${s}x 播放速度`}
                  onClick={() => setSpeed(s as 1 | 10 | 100)}
                >
                  <span className="relative flex items-center justify-center">
                    <Clock size={14} />
                    <span className="absolute -bottom-1 -right-1 text-[8px] font-bold leading-none">
                      {s}
                    </span>
                  </span>
                  {speed === s && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></span>
                  )}
                </ToolbarIconButton>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 shrink-0"></div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <ToolbarIconButton
                active={isTimelineDrawerOpen}
                label={isTimelineDrawerOpen ? '收起时间轴侧栏' : '展开时间轴侧栏'}
                onClick={() => setIsTimelineDrawerOpen((prev) => !prev)}
              >
                <Clock size={15} />
              </ToolbarIconButton>
              <ToolbarIconButton
                active={isRoiPanelVisible}
                disabled={!showReport}
                label={showReport ? '显示或隐藏 ROI 报告' : 'ROI 报告未生成'}
                onClick={() => {
                  if (!showReport) return
                  setIsRoiPanelVisible((prev) => !prev)
                }}
              >
                <ShieldCheck size={15} />
              </ToolbarIconButton>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium tracking-wide ${currentTaskStatusTone}`}
          >
            任务状态 · {currentTaskStatusLabel}
          </div>
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
            onClick={handleSimulationToggle}
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
      <div className="flex-1 relative overflow-hidden flex items-center justify-center pt-2 px-5 pb-5 lg:pt-3 lg:px-8 lg:pb-8">
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
            {Array.from({ length: 24 }, (_, i) => ({ id: i })).map((cell) => (
              <div key={cell.id} className="relative group">
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

          {renderViewportContent()}

          {selectedTimelineBinding && (
            <div className="absolute top-6 right-6 z-20 px-3 py-2 rounded-lg bg-slate-950/80 border border-cyan-400/40">
              <p className="text-[10px] text-cyan-300 uppercase tracking-wider">
                Active Timeline Slot
              </p>
              <p className="text-xs text-white font-semibold">
                {selectedTimelineBinding.slotId}: {selectedTimelineBinding.start.toFixed(1)}-
                {selectedTimelineBinding.end.toFixed(1)}h
              </p>
            </div>
          )}

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
        </div>

        {/* ROI Report Panel (Toggleable) */}
        <div
          className={`absolute z-30 right-6 top-6 bottom-6 w-80 bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-500 transform overflow-y-auto ${
            showReport && isRoiPanelVisible
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-24 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">浑天 · ROI 预演报告</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Verification Passed
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="group relative p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <TrendingUp size={10} /> UPH Increase (产能提升)
                </span>
                <div className="flex items-center text-emerald-400 text-xs font-black">
                  <ArrowUpRight size={12} /> 18%
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-mono font-bold text-white">
                  378.0 <span className="text-xs font-normal text-slate-500">/hr</span>
                </p>
                <div className="w-16 h-4">
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

            <div className="group relative p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Truck size={10} /> Logistical Distance (搬运缩减)
                </span>
                <div className="flex items-center text-emerald-400 text-xs font-black">
                  <ArrowDownRight size={12} /> 240m
                </div>
              </div>
              <p className="text-2xl font-mono font-bold text-white">
                - 24%{' '}
                <span className="text-[10px] font-normal text-slate-500 ml-1 uppercase">
                  Per Shift
                </span>
              </p>
            </div>

            <div className="group relative p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Package size={10} /> WIP Decrease (在制品库存)
                </span>
                <div className="flex items-center text-emerald-400 text-xs font-black">
                  <ArrowDownRight size={12} /> 12%
                </div>
              </div>
              <p className="text-2xl font-mono font-bold text-white">
                ¥ 21.1w{' '}
                <span className="text-[10px] font-normal text-slate-500 ml-1 uppercase">
                  Capital Released
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {comparisonPayload && (
              <div className="space-y-2">
                <div className="p-2 bg-slate-800/70 border border-white/10 rounded-lg">
                  <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mb-1">
                    物流方案摘要
                  </p>
                  <p className="text-[10px] text-slate-300 leading-snug">
                    {comparisonPayload.logisticsSummary?.textSummary || '暂无物流摘要'}
                  </p>
                </div>
                <div className="p-2 bg-slate-800/70 border border-white/10 rounded-lg">
                  <p className="text-[9px] font-bold text-amber-300 uppercase tracking-widest mb-1">
                    布局变更摘要
                  </p>
                  <p className="text-[10px] text-slate-300 leading-snug">
                    {comparisonPayload.layoutSummary?.textSummary || '暂无布局变更摘要'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/70 border border-white/10 rounded-lg p-2">
                    <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">
                      物料搬运成本
                    </p>
                    <p className="text-xs font-mono font-bold text-white">
                      ¥
                      {(
                        comparisonPayload.costBinding?.materialHandlingCost ??
                        decisionContext?.totalCost ??
                        0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-800/70 border border-white/10 rounded-lg p-2">
                    <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">
                      设备移动成本
                    </p>
                    <p className="text-xs font-mono font-bold text-white">
                      ¥
                      {(
                        comparisonPayload.costBinding?.equipmentMoveCost ??
                        decisionContext?.totalCost ??
                        0
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <Info size={14} className="text-emerald-400 shrink-0" />
              <p className="text-[9px] text-emerald-300/80 leading-snug">
                仿真结论：当前重构方案满足系统预设的安全阈值（99.8%）与预期的经济回报率（ROI &gt;
                140%）。
              </p>
            </div>
            <button
              type="button"
              onClick={handlePushToExecution}
              disabled={isDeploying}
              className="w-full relative group overflow-hidden py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-[0_20px_40px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDeploying ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span className="tracking-widest uppercase">验证通过 - 推送物理层执行</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </div>
        </div>

        <div
          className={`absolute z-30 top-6 bottom-6 w-[24rem] transition-all duration-500 ${
            showReport && isRoiPanelVisible ? 'right-[22.5rem]' : 'right-6'
          } ${isTimelineDrawerOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}
        >
          <ABTimelineComparison
            baselineTasks={baselineTasks}
            optimizedTasks={optimizedTasks}
            timelineBindings={timelineBindings}
            selectedSlotId={selectedTimelineSlotId}
            onSelectSlot={setSelectedTimelineSlotId}
            currentTime={timelineCurrentTime}
            deltaSummary={comparisonPayload?.scheduleComparison?.deltaSummary}
          />
        </div>

        {/* Viewport Actions */}
        <div className="absolute z-30 flex flex-col gap-3 bottom-10 right-10">
          <button
            type="button"
            onClick={() => setIsViewportFullscreen(true)}
            aria-label="全屏显示仿真视图"
            className="p-3 bg-slate-900/60 backdrop-blur-md rounded-2xl text-slate-400 border border-white/10 hover:text-white transition-all shadow-xl"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      {isViewportFullscreen && (
        <div className="fixed inset-0 z-[120] bg-[#050810] p-3 sm:p-4">
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/15 shadow-[0_30px_120px_rgba(0,0,0,0.8)]">
            {renderViewportContent()}

            <div
              className={`absolute z-40 top-4 bottom-4 w-[24rem] transition-all duration-500 ${
                showReport && isRoiPanelVisible ? 'right-[22.5rem]' : 'right-4'
              } ${
                isTimelineDrawerOpen
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-[120%] opacity-0 pointer-events-none'
              }`}
            >
              <ABTimelineComparison
                baselineTasks={baselineTasks}
                optimizedTasks={optimizedTasks}
                timelineBindings={timelineBindings}
                selectedSlotId={selectedTimelineSlotId}
                onSelectSlot={setSelectedTimelineSlotId}
                currentTime={timelineCurrentTime}
                deltaSummary={comparisonPayload?.scheduleComparison?.deltaSummary}
              />
            </div>

            <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
              <span className="hidden sm:block text-xs text-slate-300 bg-slate-900/70 border border-white/10 px-2 py-1 rounded-lg">
                Esc 退出全屏
              </span>
              <button
                type="button"
                onClick={() => setIsViewportFullscreen(false)}
                aria-label="退出全屏视图"
                className="p-3 bg-slate-900/70 backdrop-blur-md rounded-2xl text-slate-200 border border-white/10 hover:text-white transition-all shadow-xl"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

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
