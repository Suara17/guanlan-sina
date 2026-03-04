import type React from 'react'
import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Filter, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { tianchouService, type TaskListItem } from '../services/tianchouService'

interface Props {
  onSelectTask: (task: TaskListItem) => void
  selectedTaskId?: string
}

type DateFilter = '7days' | '30days' | '90days' | 'all'

export function TaskHistoryList({ onSelectTask, selectedTaskId }: Props) {
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  useEffect(() => {
    loadTasks()
  }, [dateFilter])

  const getDateRange = () => {
    const now = new Date()
    const startDate = new Date()

    switch (dateFilter) {
      case '7days':
        startDate.setDate(now.getDate() - 7)
        break
      case '30days':
        startDate.setDate(now.getDate() - 30)
        break
      case '90days':
        startDate.setDate(now.getDate() - 90)
        break
      case 'all':
        return { start_date: undefined, end_date: undefined }
    }

    return {
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const { start_date, end_date } = getDateRange()
      const response = await tianchouService.getTaskList({
        status: 'completed',
        limit: 50,
        start_date,
        end_date,
      })
      setTasks(response.tasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-3 mb-4">
        <Filter size={16} className="text-slate-400" />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7days">最近7天</option>
          <option value="30days">最近30天</option>
          <option value="90days">最近90天</option>
          <option value="all">全部</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">暂无已完成的任务</div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.task_id}
              className={`bg-white rounded-lg border transition-all cursor-pointer ${
                selectedTaskId === task.task_id
                  ? 'border-blue-500 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onSelectTask(task)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{task.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(task.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={12} className="text-green-500" />
                        已完成
                      </span>
                      <span>{task.solution_count} 个方案</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedTaskId(
                        expandedTaskId === task.task_id ? null : task.task_id
                      )
                    }}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    {expandedTaskId === task.task_id ? (
                      <ChevronDown size={16} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                  </button>
                </div>

                {task.recommended_solution_id && (
                  <div className="mt-3 px-3 py-2 bg-blue-50 rounded text-sm">
                    <div className="text-blue-600 font-medium">推荐方案</div>
                    <div className="text-slate-600 text-xs mt-1">
                      {task.recommended_reason}
                    </div>
                  </div>
                )}
              </div>

              {expandedTaskId === task.task_id && (
                <div className="border-t border-slate-100 p-4 bg-slate-50">
                  <div className="text-sm text-slate-600">
                    点击查看详情和方案对比
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
