import { CheckCircle, Circle, Loader2, Pause, Play, XCircle } from 'lucide-react'
import type { ExecutionStep, ExecutionTask } from '../types/zhixing'
import { ExecutionStatus } from '../types/zhixing'

interface Props {
  task: ExecutionTask
  steps: ExecutionStep[]
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
}

export function ExecutionProgress({ task, steps, onPause, onResume, onCancel }: Props) {
  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.RUNNING:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      case ExecutionStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case ExecutionStatus.FAILED:
        return <XCircle className="w-5 h-5 text-red-600" />
      case ExecutionStatus.PAUSED:
        return <Pause className="w-5 h-5 text-amber-600" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStepIcon = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Circle className="w-4 h-4 text-gray-300" />
    }
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return '--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getStatusIcon(task.status)}
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{task.solution_name}</h3>
            <p className="text-sm text-slate-500">任务ID: {task.task_id}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {task.status === ExecutionStatus.RUNNING && onPause && (
            <button
              onClick={onPause}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-amber-200 transition-colors"
            >
              <Pause size={16} />
              暂停
            </button>
          )}
          {task.status === ExecutionStatus.PAUSED && onResume && (
            <button
              onClick={onResume}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-green-200 transition-colors"
            >
              <Play size={16} />
              继续
            </button>
          )}
          {(task.status === ExecutionStatus.RUNNING || task.status === ExecutionStatus.PAUSED) &&
            onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-red-200 transition-colors"
              >
                <XCircle size={16} />
                取消
              </button>
            )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">执行进度</span>
          <span className="text-sm font-semibold text-slate-800">
            {task.current_step}/{task.total_steps} 步骤 ({task.progress}%)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              task.status === ExecutionStatus.FAILED
                ? 'bg-red-500'
                : task.status === ExecutionStatus.COMPLETED
                  ? 'bg-green-500'
                  : 'bg-blue-600'
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
        {task.status === ExecutionStatus.RUNNING && task.estimated_remaining_time && (
          <p className="mt-2 text-xs text-slate-500">
            预计剩余时间: {formatTime(task.estimated_remaining_time)}
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">执行步骤</h4>
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step) => (
            <div
              key={step.step_id}
              className={`p-3 rounded-lg border transition-all ${
                step.status === 'running'
                  ? 'border-blue-300 bg-blue-50'
                  : step.status === 'completed'
                    ? 'border-green-200 bg-green-50'
                    : step.status === 'failed'
                      ? 'border-red-200 bg-red-50'
                      : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {getStepIcon(step.status)}
                <span className="text-xs font-medium text-slate-600">{step.name}</span>
              </div>
              {step.duration && <span className="text-xs text-slate-400">{step.duration}s</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
