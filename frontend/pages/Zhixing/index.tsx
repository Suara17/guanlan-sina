import { ArrowLeft, CheckCircle2, Clock, DollarSign, Play, RotateCcw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SolutionCostMatrix } from '../types'
import { ExecutionProgress } from './components/ExecutionProgress'
import { MachineDiagram } from './components/MachineDiagram'
import { RealTimeLogs } from './components/RealTimeLogs'
import { zhixingService } from './services/zhixingService'
import type {
  ExecutionStep,
  ExecutionTask,
  LogEntry,
  MachineDiagram as MachineDiagramType,
} from './types/zhixing'
import { ExecutionStatus } from './types/zhixing'

interface LocationState {
  solutionId?: string
  solutionName?: string
  anomalyId?: string
  costMatrix?: SolutionCostMatrix
  workOrderId?: string
}

export default function ZhixingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [task, setTask] = useState<ExecutionTask | null>(null)
  const [steps, setSteps] = useState<ExecutionStep[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [machineDiagram, setMachineDiagram] = useState<MachineDiagramType | null>(null)
  const [loading, setLoading] = useState(true)
  const [solutionInfo, setSolutionInfo] = useState<{
    id: string
    name: string
    costMatrix?: SolutionCostMatrix
  } | null>(null)

  const searchParams = new URLSearchParams(location.search)
  const urlSolutionId = searchParams.get('solutionId')
  const urlAnomalyId = searchParams.get('anomalyId')
  const urlWorkOrderId = searchParams.get('order_id')

  const initializeExecution = useCallback(async () => {
    const solutionId = state?.solutionId || urlSolutionId
    const solutionName = state?.solutionName || '方案执行'

    if (!solutionId) {
      setLoading(false)
      return
    }

    setSolutionInfo({
      id: solutionId,
      name: solutionName,
      costMatrix: state?.costMatrix,
    })

    try {
      setLoading(true)
      const newTask = await zhixingService.startExecution(solutionId, solutionName)
      setTask(newTask)

      const executionSteps = await zhixingService.getExecutionSteps(newTask.task_id)
      setSteps(executionSteps)

      const diagram = await zhixingService.getMachineDiagram('M-005')
      setMachineDiagram(diagram)

      const initialLogs = await zhixingService.getRealTimeLogs(newTask.task_id)
      setLogs(initialLogs)
    } catch (error) {
      console.error('初始化执行失败:', error)
    } finally {
      setLoading(false)
    }
  }, [state?.solutionId, state?.solutionName, urlSolutionId])

  useEffect(() => {
    initializeExecution()
  }, [initializeExecution])

  useEffect(() => {
    if (
      !task ||
      task.status === ExecutionStatus.COMPLETED ||
      task.status === ExecutionStatus.FAILED
    ) {
      return
    }

    const interval = setInterval(async () => {
      try {
        const status = await zhixingService.getTaskStatus(task.task_id)
        setTask(status)

        const newLogs = await zhixingService.getRealTimeLogs(task.task_id)
        setLogs((prev) => [...prev.slice(-100), ...newLogs])
      } catch (error) {
        console.error('更新状态失败:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [task?.task_id, task?.status])

  const handlePause = useCallback(async () => {
    if (!task) return
    try {
      await zhixingService.pauseExecution(task.task_id)
      setTask((prev) => (prev ? { ...prev, status: ExecutionStatus.PAUSED } : null))
    } catch (error) {
      console.error('暂停失败:', error)
    }
  }, [task])

  const handleResume = useCallback(async () => {
    if (!task) return
    try {
      await zhixingService.resumeExecution(task.task_id)
      setTask((prev) => (prev ? { ...prev, status: ExecutionStatus.RUNNING } : null))
    } catch (error) {
      console.error('恢复失败:', error)
    }
  }, [task])

  const handleCancel = useCallback(async () => {
    if (!task) return
    if (!confirm('确定要取消执行吗？')) return

    try {
      await zhixingService.cancelExecution(task.task_id)
      const anomalyId = state?.anomalyId || urlAnomalyId
      if (anomalyId) {
        navigate(`/app/sinan?anomalyId=${anomalyId}`)
      } else {
        navigate('/app/sinan')
      }
    } catch (error) {
      console.error('取消失败:', error)
    }
  }, [task, navigate, state?.anomalyId, urlAnomalyId])

  const handleRestart = useCallback(() => {
    initializeExecution()
  }, [initializeExecution])

  const formatCost = (cost: number | undefined) => {
    if (cost === undefined || cost === null) return '¥0'
    if (cost >= 10000) {
      return `¥${(cost / 10000).toFixed(1)}万`
    }
    return `¥${cost.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">正在初始化执行任务...</p>
        </div>
      </div>
    )
  }

  if (!task && !urlWorkOrderId) {
    return (
      <div className="p-6 max-w-7xl mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 mb-4">
            <Sparkles size={48} className="mx-auto opacity-50" />
          </div>
          <p className="text-slate-600 mb-4">请从司南页面选择方案后跳转</p>
          <button
            onClick={() => navigate('/app/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => {
            const anomalyId = state?.anomalyId || urlAnomalyId
            if (anomalyId) {
              navigate(`/app/sinan?anomalyId=${anomalyId}`)
            } else {
              navigate('/app/sinan')
            }
          }}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            执行 · 方案实施监控
            <span className="text-xs font-normal text-white bg-blue-600 px-2 py-0.5 rounded-full">
              Live
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {solutionInfo?.name || '方案执行'} | 工单ID: {urlWorkOrderId || task?.task_id || 'NEW'}
          </p>
        </div>

        {task?.status === ExecutionStatus.COMPLETED && (
          <button
            type="button"
            onClick={handleRestart}
            className="ml-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw size={16} />
            重新执行
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          {task && (
            <div className="flex-shrink-0">
              <ExecutionProgress
                task={task}
                steps={steps}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
              />
            </div>
          )}

          <div className="flex-1 min-h-[400px]">
            <RealTimeLogs logs={logs} isLive={task?.status === ExecutionStatus.RUNNING} />
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
          {solutionInfo?.costMatrix && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <DollarSign size={16} className="text-blue-500" />
                成本预估
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">维修成本</span>
                  <span className="font-medium text-slate-700">
                    {formatCost(solutionInfo.costMatrix.repairCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">交期影响</span>
                  <span className="font-medium text-slate-700">
                    {formatCost(solutionInfo.costMatrix.deliveryImpactCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">品质风险</span>
                  <span className="font-medium text-slate-700">
                    {formatCost(solutionInfo.costMatrix.qualityRiskCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">停产损失</span>
                  <span className="font-medium text-slate-700">
                    {formatCost(solutionInfo.costMatrix.downtimeCost)}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 font-medium">综合损失</span>
                    <span className="font-bold text-red-600">
                      {formatCost(solutionInfo.costMatrix.totalExpectedLoss)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {machineDiagram && <MachineDiagram diagram={machineDiagram} />}
        </div>
      </div>

      {task?.status === ExecutionStatus.COMPLETED && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-800">执行完成</h3>
          </div>
          <p className="text-green-700 text-sm">
            方案已成功执行完毕。请返回诊断页面确认设备状态，或执行其他操作。
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                const anomalyId = state?.anomalyId || urlAnomalyId
                if (anomalyId) {
                  navigate(`/app/sinan?anomalyId=${anomalyId}`)
                } else {
                  navigate('/app/sinan')
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
            >
              返回诊断
            </button>
            <button
              onClick={() => navigate('/app/')}
              className="px-4 py-2 bg-white text-slate-700 rounded-lg font-medium text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
