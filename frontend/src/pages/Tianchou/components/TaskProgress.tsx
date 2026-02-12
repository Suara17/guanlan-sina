/**
 * 任务进度条组件
 */

import { type OptimizationTask, TaskStatus } from '../types/tianchou'

interface Props {
  task: OptimizationTask
  onCancel?: () => void
}

export function TaskProgress({ task, onCancel }: Props) {
  const getStatusText = () => {
    switch (task.status) {
      case TaskStatus.PENDING:
        return '等待执行'
      case TaskStatus.RUNNING:
        return '正在优化'
      case TaskStatus.COMPLETED:
        return '优化完成'
      case TaskStatus.FAILED:
        return '优化失败'
      default:
        return '未知状态'
    }
  }

  const getStatusColor = () => {
    switch (task.status) {
      case TaskStatus.PENDING:
        return 'text-gray-600'
      case TaskStatus.RUNNING:
        return 'text-blue-600'
      case TaskStatus.COMPLETED:
        return 'text-green-600'
      case TaskStatus.FAILED:
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{task.name}</h2>
        {onCancel && task.status === TaskStatus.RUNNING && (
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            取消
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* 状态 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">状态:</span>
          <span className={`font-semibold ${getStatusColor()}`}>{getStatusText()}</span>
        </div>

        {/* 进度条 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">优化进度</span>
            <span className="text-sm font-semibold">{task.progress}%</span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>

        {/* 时间信息 */}
        <div className="text-sm text-gray-600 space-y-1">
          <div>创建时间: {new Date(task.created_at).toLocaleString('zh-CN')}</div>
          {task.started_at && (
            <div>开始时间: {new Date(task.started_at).toLocaleString('zh-CN')}</div>
          )}
          {task.completed_at && (
            <div>完成时间: {new Date(task.completed_at).toLocaleString('zh-CN')}</div>
          )}
        </div>

        {/* 加载动画 */}
        {task.status === TaskStatus.RUNNING && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600">正在生成优化方案...</span>
          </div>
        )}

        {/* 完成信息 */}
        {task.status === TaskStatus.COMPLETED && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-semibold mb-1">优化完成!</div>
            <div className="text-green-700 text-sm">
              已生成 {task.solution_count} 个帕累托最优方案
            </div>
          </div>
        )}

        {/* 失败信息 */}
        {task.status === TaskStatus.FAILED && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-semibold mb-1">优化失败</div>
            <div className="text-red-700 text-sm">请检查参数设置或联系管理员</div>
          </div>
        )}
      </div>
    </div>
  )
}
