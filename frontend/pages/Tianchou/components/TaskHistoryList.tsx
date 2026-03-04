import type React from 'react'
import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Filter, ChevronDown, ChevronRight, Loader2, Star } from 'lucide-react'
import { tianchouService, type TaskListItem } from '../services/tianchouService'
import type { ParetoSolution } from '../types/tianchou'

interface Props {
  onSelectTask: (task: TaskListItem) => void
  selectedTaskId?: string
}

type DateFilter = '7days' | '30days' | '90days' | 'all'

interface TaskSolutions {
  taskId: string
  solutions: ParetoSolution[]
  loading: boolean
}

export function TaskHistoryList({ onSelectTask, selectedTaskId }: Props) {
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [taskSolutions, setTaskSolutions] = useState<Map<string, TaskSolutions>>(new Map())

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

  const loadTaskSolutions = async (taskId: string) => {
    if (taskSolutions.has(taskId)) return

    setTaskSolutions((prev) => {
      const newMap = new Map(prev)
      newMap.set(taskId, { taskId, solutions: [], loading: true })
      return newMap
    })

    try {
      const solutions = await tianchouService.getSolutions(taskId)
      setTaskSolutions((prev) => {
        const newMap = new Map(prev)
        newMap.set(taskId, { taskId, solutions, loading: false })
        return newMap
      })
    } catch (error) {
      console.error('Failed to load solutions:', error)
      setTaskSolutions((prev) => {
        const newMap = new Map(prev)
        newMap.set(taskId, { taskId, solutions: [], loading: false })
        return newMap
      })
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

  const handleExpand = (taskId: string) => {
    const newExpandedId = expandedTaskId === taskId ? null : taskId
    setExpandedTaskId(newExpandedId)
    if (newExpandedId) {
      loadTaskSolutions(newExpandedId)
    }
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
              className={`bg-white rounded-lg border transition-all ${
                selectedTaskId === task.task_id
                  ? 'border-blue-500 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-4" onClick={() => onSelectTask(task)}>
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
                      handleExpand(task.task_id)
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
                    <div className="text-blue-600 font-medium flex items-center gap-1">
                      <Star size={12} className="fill-current" />
                      推荐方案
                    </div>
                    <div className="text-slate-600 text-xs mt-1">
                      {task.recommended_reason}
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-slate-400">总成本</div>
                        <div className="font-medium text-slate-700">
                          ¥{task.recommended_total_cost?.toLocaleString() ?? '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">工期</div>
                        <div className="font-medium text-slate-700">
                          {task.recommended_implementation_days != null 
                            ? `${task.recommended_implementation_days.toFixed(1)}天` 
                            : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">预期收益</div>
                        <div className="font-medium text-green-600">
                          ¥{task.recommended_expected_benefit?.toLocaleString() ?? '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">预期损失</div>
                        <div className="font-medium text-red-500">
                          {task.recommended_expected_loss != null 
                            ? `¥${task.recommended_expected_loss.toLocaleString()}` 
                            : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {expandedTaskId === task.task_id && (
                <div className="border-t border-slate-100 bg-slate-50">
                  {taskSolutions.get(task.task_id)?.loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-200">
                            <th className="pb-2 font-medium">方案</th>
                            <th className="pb-2 font-medium">总成本</th>
                            <th className="pb-2 font-medium">工期</th>
                            <th className="pb-2 font-medium">预期收益</th>
                            <th className="pb-2 font-medium">预期损失</th>
                            <th className="pb-2 font-medium">TOPSIS</th>
                          </tr>
                        </thead>
                                                  <tbody>
                          {taskSolutions.get(task.task_id)?.solutions.slice(0, 10).map((solution, idx) => {
                            const isRecommended = solution.id === task.recommended_solution_id
                            return (
                              <tr
                                key={solution.id}
                                className={`border-b border-slate-100 ${
                                  isRecommended ? 'bg-blue-50' : ''
                                }`}
                              >
                                <td className="py-2">
                                  <span className="flex items-center gap-1">
                                    {isRecommended && (
                                      <Star size={10} className="text-amber-500 fill-current" />
                                    )}
                                    方案 #{solution.rank || idx + 1}
                                  </span>
                                </td>
                                <td className="py-2">¥{solution.total_cost.toLocaleString()}</td>
                                <td className="py-2">{solution.implementation_days.toFixed(1)}天</td>
                                <td className="py-2 text-green-600">
                                  ¥{solution.expected_benefit.toLocaleString()}
                                </td>
                                <td className="py-2 text-red-500">
                                  {solution.expected_loss != null
                                    ? `¥${solution.expected_loss.toLocaleString()}`
                                    : '-'}
                                </td>
                                <td className="py-2">
                                  {solution.topsis_score != null
                                    ? `${(solution.topsis_score * 100).toFixed(1)}`
                                    : '-'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
