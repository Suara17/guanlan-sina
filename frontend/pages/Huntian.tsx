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
  Settings2,
  ShieldCheck,
  TrendingUp,
  Truck,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer } from 'recharts'
import { AGVLayoutVisualizer } from '../components/AGVLayoutVisualizer'
import AGVPathVisualizer from '../components/AGVPathVisualizer'
// 新版可视化组件（D3.js 增强版）
import { DeviceLayoutVisualizer } from '../components/DeviceLayoutVisualizer'
import LayoutVisualizer from '../components/LayoutVisualizer'
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

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `¥${value.toLocaleString()}` : '--'

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
  const [visualMode, setVisualMode] = useState<'new' | 'legacy'>('new')
  const timerRef = useRef<number | null>(null)
  const [agvData, setAgvData] = useState<Record<string, unknown> | null>(null)
  const [layoutData, setLayoutData] = useState<Record<string, unknown> | null>(null)
  const [decisionContext, setDecisionContext] = useState<HuntianDecisionContext | null>(null)

  const currentModeState = modeSimulationState[simulationMode]
  const progress = currentModeState.progress
  const conflicts = currentModeState.conflicts
  const showReport = currentModeState.showReport
  const isOptimized = currentModeState.isOptimized

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
    setModeSimulationState((prev) => ({
      ...prev,
      [simulationMode]: {
        progress: 0,
        conflicts: [],
        showReport: false,
        isOptimized: false,
      },
    }))
  }

  const handleBackToTianchou = (focus: 'solution' | 'pareto') => {
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

  const renderCurrentSimulationView = () => {
    if (simulationMode === 'device_rearrangement') {
      if (visualMode === 'new') {
        return (
          <div className="absolute inset-0 bg-white rounded-xl overflow-hidden">
            <DeviceLayoutVisualizer
              isOptimized={isOptimized}
              layoutData={layoutData}
              decisionContext={decisionContext ?? undefined}
            />
          </div>
        )
      }

      if (layoutData) {
        return <LayoutVisualizer layoutData={layoutData} isPlaying={isPlaying} />
      }

      return <LayoutVisualizer layoutData={mockLayoutData} isPlaying={isPlaying} />
    }

    if (visualMode === 'new') {
      return (
        <div className="absolute inset-0 bg-white rounded-xl overflow-hidden">
          <AGVLayoutVisualizer isOptimized={isOptimized} agvData={agvData} />
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
        showPerformancePanel={true}
      />
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
              Simulation Mode
            </span>
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false)
                  setSimulationMode('device_rearrangement')
                }}
                className={`relative px-3 py-1 text-xs font-bold rounded-lg transition-all ${simulationMode === 'device_rearrangement' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                设备重排
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false)
                  setSimulationMode('route_optimization')
                }}
                className={`relative px-3 py-1 text-xs font-bold rounded-lg transition-all ${simulationMode === 'route_optimization' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                线路优化
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10"></div>

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

          {renderCurrentSimulationView()}

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
          className={`absolute right-8 top-1/2 -translate-y-1/2 w-80 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-1000 transform ${
            showReport
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-20 pointer-events-none'
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
          <button
            type="button"
            className="p-3 bg-slate-900/60 backdrop-blur-md rounded-2xl text-slate-400 border border-white/10 hover:text-white transition-all shadow-xl"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      {isViewportFullscreen && (
        <div className="fixed inset-0 z-[120] bg-[#050810] p-3 sm:p-4">
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/15 shadow-[0_30px_120px_rgba(0,0,0,0.8)]">
            {renderCurrentSimulationView()}

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
