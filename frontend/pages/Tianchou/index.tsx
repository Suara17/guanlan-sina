/**
 * 天筹优化决策系统主页面
 */

import {
  Anchor,
  Building2,
  Clock,
  Eye,
  Factory,
  Hash,
  LayoutGrid,
  Lock,
  Move,
  Settings2,
  TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AHPWizard } from './components/AHPWizard'
import { ParetoTriplot } from './components/ParetoTriplot'
import { TaskConfigForm } from './components/TaskConfigForm'
import { TaskProgress } from './components/TaskProgress'
import { useTianchou } from './hooks/useTianchou'
import { tianchouService } from './services/tianchouService'
import {
  getMetricLabels,
  type OptimizationRequestParams,
  type OptimizationResult,
  type ParetoSolution,
  TaskStatus,
} from './types/tianchou'

type ViewType = 'config' | 'optimizing' | 'results'

/**
 * 简单的 Card 组件
 */
const Card: React.FC<{
  children: React.ReactNode
  title?: string
  className?: string
}> = ({ children, title, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
)

/**
 * 评分点组件
 */
const RatingDots: React.FC<{ count: number; color?: string }> = ({
  count,
  color = 'bg-blue-500',
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`w-2 h-2 rounded-full ${i <= count ? color : 'bg-slate-200'}`} />
    ))}
  </div>
)

/**
 * 计算评分 (1-5)
 */
const calculateRating = (value: number, min: number, max: number): number => {
  if (max === min) return 3
  const normalized = (value - min) / (max - min)
  return Math.max(1, Math.min(5, Math.round(normalized * 4) + 1))
}

export default function TianchouPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    task,
    setTask,
    solutions,
    setSolutions,
    selectedSolution,
    setSelectedSolution,
    ahpWeights,
    setAhpWeights,
  } = useTianchou()

  const [view, setView] = useState<ViewType>('config')
  const [showAHPWizard, setShowAHPWizard] = useState(false)
  const [loading, setLoading] = useState(false)

  // 任务配置参数（用于显示任务信息）
  const [taskConfig, setTaskConfig] = useState<{
    industryType?: string
    taskName?: string
    // 轻工业参数
    workshopLength?: number
    workshopWidth?: number
    deviceCount?: number
    movableDeviceCount?: number
    fixedDeviceCount?: number
    // 重工业参数
    stationCount?: number
    agvCount?: number
    // 商业参数
    dailyOutputValue?: number
    baseCost?: number
    // 3.2 优化路线：产品切换参数
    currentProduct?: string
    nextProduct?: string
  } | null>(null)

  // 3.2 优化路线：检测产品切换模式
  useEffect(() => {
    const optimizationMode = location.state?.optimizationMode
    if (optimizationMode === 'product_switch') {
      const params = location.state
      
      // 设置任务配置
      setTaskConfig({
        industryType: 'light',
        taskName: `产品切换优化: ${params.current_product_code || '当前产品'} → ${params.next_product_code || '下一产品'}`,
        currentProduct: params.current_product_code,
        nextProduct: params.next_product_code,
        workshopLength: params.current_layout?.workshopDimensions?.length || 100,
        workshopWidth: params.current_layout?.workshopDimensions?.width || 60,
        deviceCount: params.current_layout?.devices?.length || 20,
        movableDeviceCount: 15,
        fixedDeviceCount: 5,
        dailyOutputValue: 20000,
        baseCost: 20000,
      })

      // 自动开始优化
      handleCreateTask({
        industry_type: 'light',
        name: `${params.current_product_code || '产品A'} → ${params.next_product_code || '产品B'} 切换优化`,
        workshop_length: params.current_layout?.workshopDimensions?.length || 100,
        workshop_width: params.current_layout?.workshopDimensions?.width || 60,
        device_count: params.current_layout?.devices?.length || 20,
        daily_output_value: 20000,
        base_cost: 20000,
      })
    }
  }, [location.state])

  // 获取行业类型对应的标签
  const labels = getMetricLabels(task?.industry_type)

  // 计算统计数据 (用于蓝色统计卡片)
  const stats =
    solutions.length > 0
      ? {
          minCost: Math.min(...solutions.map((s) => s.total_cost)),
          maxCost: Math.max(...solutions.map((s) => s.total_cost)),
          minDays: Math.min(...solutions.map((s) => s.implementation_days)),
          maxDays: Math.max(...solutions.map((s) => s.implementation_days)),
          maxBenefit: Math.max(...solutions.map((s) => s.expected_benefit)),
          avgScore: solutions.reduce((sum, s) => sum + (s.topsis_score || 0), 0) / solutions.length,
        }
      : null

  // 自动选中第一个方案
  useEffect(() => {
    if (solutions.length > 0 && !selectedSolution) {
      // 默认选中第一个方案
      const firstSolution = solutions[0]
      // 直接使用列表中的数据，不需要再次请求详情
      setSelectedSolution(firstSolution)
    }
  }, [solutions, selectedSolution, setSelectedSolution])

  // 创建优化任务
  const handleCreateTask = useCallback(
    async (params: OptimizationRequestParams) => {
      try {
        setLoading(true)
        const newTask = await tianchouService.createTask(params)
        setTask(newTask)
        setView('optimizing')

        // 保存任务配置参数
        if (params.industry_type === 'light') {
          const deviceCount = params.device_count || 25
          const movableCount = Math.max(0, deviceCount - 5) // 默认最后5台固定
          setTaskConfig({
            industryType: 'light',
            taskName: params.name,
            workshopLength: params.workshop_length,
            workshopWidth: params.workshop_width,
            deviceCount: deviceCount,
            movableDeviceCount: movableCount,
            fixedDeviceCount: deviceCount - movableCount,
            dailyOutputValue: params.daily_output_value,
            baseCost: params.base_cost,
          })
        } else {
          setTaskConfig({
            industryType: 'heavy',
            taskName: params.name,
            stationCount: params.station_count,
            agvCount: params.agv_count,
            dailyOutputValue: params.daily_output_value,
            baseCost: params.base_cost,
          })
        }

        // 开始轮询任务状态
        pollTaskStatus(newTask.task_id)
      } catch (error) {
        console.error('创建任务失败:', error)
        alert('创建任务失败，请重试')
      } finally {
        setLoading(false)
      }
    },
    [setTask]
  )

  // 轮询任务状态
  const pollTaskStatus = useCallback(
    async (taskId: string) => {
      const poll = async () => {
        try {
          const status = await tianchouService.getTaskStatus(taskId)
          setTask(status)

          if (status.status === TaskStatus.RUNNING) {
            setTimeout(poll, 2000)
          } else if (status.status === TaskStatus.COMPLETED) {
            // 加载方案列表
            const sols = await tianchouService.getSolutions(taskId)
            setSolutions(sols)
            setView('results')
          } else if (status.status === TaskStatus.FAILED) {
            alert('任务执行失败，请检查参数或联系管理员')
          }
        } catch (error) {
          console.error('获取任务状态失败:', error)
        }
      }
      poll()
    },
    [setTask, setSolutions]
  )

  // 选择方案查看详情
  const handleSelectSolution = useCallback(
    async (solution: any) => {
      if (!task) return
      try {
        const detail = await tianchouService.getSolutionDetail(task.task_id, solution.id)
        setSelectedSolution(detail)
      } catch (error) {
        console.error('获取方案详情失败:', error)
      }
    },
    [task, setSelectedSolution]
  )

  // 运行AHP-TOPSIS决策
  const handleRunDecision = useCallback(
    async (weights: any) => {
      if (!task) return
      try {
        setAhpWeights(weights)
        const result = await tianchouService.runTOPSIS(task.task_id, weights)

        // 重新加载方案列表以获取更新的排名
        const sols = await tianchouService.getSolutions(task.task_id)
        setSolutions(sols)

        setShowAHPWizard(false)
        alert(`决策完成！推荐方案ID: ${result.best_solution_id}`)
      } catch (error) {
        console.error('决策失败:', error)
        alert('决策失败，请重试')
      }
    },
    [task, setAhpWeights, setSolutions]
  )

  // 跳转到浑天页面查看仿真
  const handleViewSimulation = useCallback(
    (solution: ParetoSolution) => {
      if (!task) return

      // 根据任务类型生成不同的数据
      const isHeavyIndustry = true // TODO: 从 task 中获取实际的行业类型

      const optimizationResult: OptimizationResult = isHeavyIndustry
        ? {
            // 重工业 - AGV 路径优化
            type: 'heavy',
            solution,
            taskId: task.task_id,
            agvData: {
              stations: [
                { id: 1, name: '上料区', position: [200, 200] },
                { id: 2, name: '加工区A', position: [500, 200] },
                { id: 3, name: '加工区B', position: [800, 200] },
                { id: 4, name: '检测区', position: [500, 500] },
                { id: 5, name: '下料区', position: [200, 500] },
              ],
              agvRoutes: [
                {
                  agvId: 1,
                  route: [
                    [200, 200],
                    [500, 200],
                    [500, 500],
                    [200, 500],
                  ],
                  completionTime: 120,
                  tasks: [
                    { from: 1, to: 2, startTime: 0, endTime: 30 },
                    { from: 2, to: 4, startTime: 30, endTime: 80 },
                    { from: 4, to: 5, startTime: 80, endTime: 120 },
                  ],
                },
                {
                  agvId: 2,
                  route: [
                    [200, 200],
                    [800, 200],
                    [500, 500],
                    [200, 500],
                  ],
                  completionTime: 150,
                  tasks: [
                    { from: 1, to: 3, startTime: 0, endTime: 50 },
                    { from: 3, to: 4, startTime: 50, endTime: 110 },
                    { from: 4, to: 5, startTime: 110, endTime: 150 },
                  ],
                },
              ],
              metrics: {
                totalCompletionTime: 150,
                bottleneckUtilization: 0.85,
              },
            },
          }
        : {
            // 轻工业 - 设备布局优化
            type: 'light',
            solution,
            taskId: task.task_id,
            layoutData: {
              workshopDimensions: { length: 1000, width: 600 },
              devices: [
                {
                  id: 1,
                  name: '冲压机',
                  originalPosition: [100, 100],
                  newPosition: [300, 100],
                  size: { width: 80, height: 60 },
                },
                {
                  id: 2,
                  name: '焊接机',
                  originalPosition: [300, 100],
                  newPosition: [100, 100],
                  size: { width: 80, height: 60 },
                },
                {
                  id: 3,
                  name: '喷涂机',
                  originalPosition: [500, 100],
                  newPosition: [500, 100],
                  size: { width: 80, height: 60 },
                },
                {
                  id: 4,
                  name: '检测台',
                  originalPosition: [700, 100],
                  newPosition: [700, 300],
                  size: { width: 80, height: 60 },
                },
                {
                  id: 5,
                  name: '包装台',
                  originalPosition: [100, 300],
                  newPosition: [100, 300],
                  size: { width: 80, height: 60 },
                },
              ],
              movedDevices: [
                { deviceId: 1, distance: 200, cost: 5000 },
                { deviceId: 2, distance: 200, cost: 5000 },
                { deviceId: 4, distance: 200, cost: 5000 },
              ],
            },
          }

      navigate('/app/huntian', { state: { optimizationResult } })
    },
    [task, navigate]
  )

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">天筹优化决策系统</h1>
        <p className="text-slate-600 mt-2">基于多目标遗传算法的智能制造优化方案</p>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* 配置阶段 */}
        {view === 'config' && (
          <div data-tour="tianchou-config">
            <TaskConfigForm onSubmit={handleCreateTask} />
          </div>
        )}

        {/* 优化执行阶段 */}
        {view === 'optimizing' && task && (
          <TaskProgress
            task={task}
            onCancel={() => setView('config')}
            onComplete={async () => {
              // 任务完成后立即加载方案列表并跳转
              if (task.task_id) {
                const sols = await tianchouService.getSolutions(task.task_id)
                setSolutions(sols)
                setView('results')
              }
            }}
          />
        )}

        {/* 结果展示阶段 */}
        {view === 'results' && task && (
          <div className="space-y-6">
            {/* 顶部操作栏 */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">优化结果</h2>
                <p className="text-sm text-slate-500">
                  任务: {task.name} (ID: {task.task_id.slice(0, 8)}...)
                </p>
              </div>
              <button
                onClick={() => {
                  setTask(null)
                  setSolutions([])
                  setSelectedSolution(null)
                  setTaskConfig(null)
                  setView('config')
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium inline-flex items-center gap-2"
              >
                <Settings2 size={18} />
                新建任务
              </button>
            </div>

            {/* 帕累托前沿可视化 */}
            <div data-tour="tianchou-results">
              <ParetoTriplot
                solutions={solutions}
                onSelect={handleSelectSolution}
                selectedId={selectedSolution?.id}
                industryType={task.industry_type}
                taskName={task.name}
                taskId={task.task_id}
              />
            </div>

            {/* 顶部：蓝色统计卡片 */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-9">
                <Card title="优化方案详情">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">方案序号</th>
                          <th className="px-4 py-3">总成本</th>
                          <th className="px-4 py-3">实施工期</th>
                          <th className="px-4 py-3">预期收益</th>
                          <th className="px-4 py-3">TOPSIS评分</th>
                          <th className="px-4 py-3 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {solutions.slice(0, 10).map((solution, idx) => {
                          const score = solution.topsis_score || 0
                          const isSelected = selectedSolution?.id === solution.id
                          return (
                            <tr
                              key={solution.id}
                              className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                              onClick={() => handleSelectSolution(solution)}
                            >
                              <td className="px-4 py-3 font-medium text-slate-700">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-slate-300'}`}
                                  ></span>
                                  #{solution.rank || idx + 1}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                ¥{solution.total_cost.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {solution.implementation_days.toFixed(1)} 天
                              </td>
                              <td className="px-4 py-3 text-green-600 font-medium">
                                ¥{solution.expected_benefit.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{ width: `${score * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-slate-400">
                                    {(score * 100).toFixed(0)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewSimulation(solution)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium underline decoration-blue-200 underline-offset-2 inline-flex items-center gap-1"
                                >
                                  <Eye size={12} />
                                  查看仿真
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* 右侧：蓝色任务配置卡片 */}
              <div className="col-span-12 lg:col-span-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg shadow-blue-200">
                {taskConfig?.industryType === 'light' ? (
                  // 轻工业配置
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Factory size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">车间尺寸</span>
                      <span className="ml-auto font-semibold">
                        {taskConfig?.workshopLength || 80}×{taskConfig?.workshopWidth || 60}m
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Hash size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">设备总数</span>
                      <span className="ml-auto font-semibold">{taskConfig?.deviceCount || 25} 台</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Move size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">可移动设备</span>
                      <span className="ml-auto font-semibold">
                        {taskConfig?.movableDeviceCount || 20} 台
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Lock size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">固定设备</span>
                      <span className="ml-auto font-semibold">
                        {taskConfig?.fixedDeviceCount || 5} 台
                      </span>
                    </div>
                    <div className="border-t border-blue-400/30 my-3 pt-3">
                      <div className="flex items-center gap-3">
                        <TrendingUp size={20} className="text-blue-100" />
                        <span className="text-blue-100 text-sm">每日产值</span>
                        <span className="ml-auto font-semibold">
                          ¥{(taskConfig?.dailyOutputValue || 20000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">基础成本</span>
                      <span className="ml-auto font-semibold">
                        ¥{(taskConfig?.baseCost || 20000).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-blue-400/30 my-3 pt-3">
                      <div className="flex items-center gap-3">
                        <Clock size={20} className="text-blue-100" />
                        <span className="text-blue-100 text-sm">方案数量</span>
                        <span className="ml-auto font-semibold">{solutions.length} 个</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Anchor size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">任务状态</span>
                      <span className="ml-auto font-semibold text-green-300">已完成</span>
                    </div>
                  </div>
                ) : (
                  // 重工业配置
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Factory size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">工位数量</span>
                      <span className="ml-auto font-semibold">{taskConfig?.stationCount || 8} 个</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Hash size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">AGV数量</span>
                      <span className="ml-auto font-semibold">{taskConfig?.agvCount || 3} 台</span>
                    </div>
                    <div className="border-t border-blue-400/30 my-3 pt-3">
                      <div className="flex items-center gap-3">
                        <TrendingUp size={20} className="text-blue-100" />
                        <span className="text-blue-100 text-sm">每日产值</span>
                        <span className="ml-auto font-semibold">
                          ¥{(taskConfig?.dailyOutputValue || 50000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">基础成本</span>
                      <span className="ml-auto font-semibold">
                        ¥{(taskConfig?.baseCost || 30000).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-blue-400/30 my-3 pt-3">
                      <div className="flex items-center gap-3">
                        <Clock size={20} className="text-blue-100" />
                        <span className="text-blue-100 text-sm">方案数量</span>
                        <span className="ml-auto font-semibold">{solutions.length} 个</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Anchor size={20} className="text-blue-100" />
                      <span className="text-blue-100 text-sm">任务状态</span>
                      <span className="ml-auto font-semibold text-green-300">已完成</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 中间：决策偏好设置 */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-9">
                {/* 方案详情 (当选择方案时显示) */}
                {selectedSolution && (
                  <Card title="选中的方案详情">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <LayoutGrid size={18} className="text-blue-500" />
                          商业指标
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500">总成本</span>
                            <span className="font-semibold text-slate-700">
                              ¥{selectedSolution.total_cost.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500">实施工期</span>
                            <span className="font-semibold text-slate-700">
                              {selectedSolution.implementation_days.toFixed(1)} 天
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-slate-500">预期收益</span>
                            <span className="font-semibold text-green-600">
                              ¥{selectedSolution.expected_benefit.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Settings2 size={18} className="text-indigo-500" />
                          技术指标
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500">f1 ({labels.f1})</span>
                            <span className="font-semibold text-slate-700">
                              {selectedSolution.f1.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500">f2 ({labels.f2})</span>
                            <span className="font-semibold text-slate-700">
                              {selectedSolution.f2.toFixed(2)}
                            </span>
                          </div>
                          {selectedSolution.f3 !== undefined && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-slate-500">f3 ({labels.f3})</span>
                              <span className="font-semibold text-slate-700">
                                {selectedSolution.f3.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleViewSimulation(selectedSolution)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2 shadow-md shadow-blue-200 transition-colors"
                      >
                        <Eye size={18} />
                        查看仿真效果
                      </button>
                    </div>
                  </Card>
                )}
              </div>

              {/* 右侧：决策偏好设置 */}
              <div className="col-span-12 lg:col-span-3">
                <Card title="决策偏好设置">
                  <div className="space-y-6 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium text-slate-700">
                        <span>成本权重</span>
                        <span className="text-blue-600">
                          {ahpWeights ? (ahpWeights.cost * 100).toFixed(0) : 33}%
                        </span>
                      </div>
                      <input
                        type="range"
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        defaultValue={ahpWeights ? ahpWeights.cost * 100 : 33}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium text-slate-700">
                        <span>工期权重</span>
                        <span className="text-amber-500">
                          {ahpWeights ? (ahpWeights.time * 100).toFixed(0) : 33}%
                        </span>
                      </div>
                      <input
                        type="range"
                        className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        defaultValue={ahpWeights ? ahpWeights.time * 100 : 33}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium text-slate-700">
                        <span>收益权重</span>
                        <span className="text-green-500">
                          {ahpWeights ? (ahpWeights.benefit * 100).toFixed(0) : 34}%
                        </span>
                      </div>
                      <input
                        type="range"
                        className="w-full accent-green-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        defaultValue={ahpWeights ? ahpWeights.benefit * 100 : 34}
                      />
                    </div>

                    <div className="pt-4 flex gap-2">
                      <button
                        onClick={() => setAhpWeights(null)}
                        className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-200"
                      >
                        重置
                      </button>
                      <button
                        onClick={() => setShowAHPWizard(true)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                      >
                        AHP决策
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 底部：代表方案网格 */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-bold text-slate-800 text-lg">候选方案</h3>
                <div className="flex items-center gap-4 text-xs font-medium ml-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div> 已选择
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div> 未选择
                  </div>
                </div>
                <div className="flex-1"></div>
                <span className="text-sm text-slate-500">共 {solutions.length} 个方案</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {solutions.slice(0, 10).map((solution, idx) => {
                  const isSelected = selectedSolution?.id === solution.id
                  const score = solution.topsis_score || 0
                  const costRating = calculateRating(
                    solution.total_cost,
                    stats?.minCost || 0,
                    stats?.maxCost || 300000
                  )
                  const scheduleRating = calculateRating(
                    solution.implementation_days,
                    stats?.minDays || 0,
                    stats?.maxDays || 60
                  )
                  const benefitRating = calculateRating(
                    solution.expected_benefit,
                    0,
                    stats?.maxBenefit || 800000
                  )

                  return (
                    <div
                      key={solution.id}
                      onClick={() => handleSelectSolution(solution)}
                      className={`
                        relative flex flex-col p-5 rounded-xl transition-all duration-300 cursor-pointer
                        ${
                          isSelected
                            ? 'bg-white border-2 border-blue-500 shadow-xl shadow-blue-100 scale-105 z-10'
                            : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-slate-800">
                          方案 #{solution.rank || idx + 1}
                        </h4>
                        <span className="text-xs font-mono text-slate-400">
                          ID:{solution.rank || idx + 1}
                        </span>
                      </div>

                      <div className="space-y-3 mb-6 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-slate-300'}`}
                            ></div>
                            <span className="text-sm text-slate-600">总投入</span>
                          </div>
                          <RatingDots count={costRating} color="bg-blue-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-slate-300'}`}
                            ></div>
                            <span className="text-sm text-slate-600">工期</span>
                          </div>
                          <RatingDots count={scheduleRating} color="bg-indigo-500" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-slate-300'}`}
                            ></div>
                            <span className="text-sm text-slate-600">年收益</span>
                          </div>
                          <RatingDots count={benefitRating} color="bg-amber-500" />
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-2 font-medium text-slate-500">
                          <span>综合得分</span>
                          <span className="text-blue-600">{(score * 100).toFixed(0)}分</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                            style={{ width: `${score * 100}%` }}
                          ></div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewSimulation(solution)
                          }}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            isSelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Eye size={14} />
                          查看仿真
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AHP向导弹窗 */}
      {showAHPWizard && task && (
        <AHPWizard
          taskId={task.task_id}
          onComplete={handleRunDecision}
          onClose={() => setShowAHPWizard(false)}
        />
      )}
    </div>
  )
}
