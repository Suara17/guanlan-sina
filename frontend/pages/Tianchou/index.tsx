/**
 * 天筹优化决策系统主页面
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AHPWizard } from './components/AHPWizard'
import { ParetoFrontChart } from './components/ParetoFrontChart'
import { SolutionCard } from './components/SolutionCard'
import { TaskConfigForm } from './components/TaskConfigForm'
import { TaskProgress } from './components/TaskProgress'
import { useTianchou } from './hooks/useTianchou'
import { tianchouService } from './services/tianchouService'
import {
  type OptimizationRequestParams,
  type OptimizationResult,
  type ParetoSolution,
  TaskStatus,
} from './types/tianchou'

type ViewType = 'config' | 'optimizing' | 'results'

export default function TianchouPage() {
  const navigate = useNavigate()
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

  // 创建优化任务
  const handleCreateTask = useCallback(
    async (params: OptimizationRequestParams) => {
      try {
        setLoading(true)
        const newTask = await tianchouService.createTask(params)
        setTask(newTask)
        setView('optimizing')

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

      // TODO: 从后端获取实际的可视化数据
      // 这里先使用 Mock 数据

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

      // 使用 React Router 的 state 传递数据
      navigate('/app/huntian', {
        state: { optimizationResult },
      })
    },
    [task, navigate]
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">天筹优化决策系统</h1>
        <p className="text-gray-600 mt-2">基于多目标遗传算法的智能制造优化方案</p>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* 配置阶段 */}
        {view === 'config' && <TaskConfigForm onSubmit={handleCreateTask} />}

        {/* 优化执行阶段 */}
        {view === 'optimizing' && task && (
          <TaskProgress task={task} onCancel={() => setView('config')} />
        )}

        {/* 结果展示阶段 */}
        {view === 'results' && task && (
          <div className="grid grid-cols-12 gap-6">
            {/* 左侧：帕累托前沿图 */}
            <div className="col-span-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">帕累托最优解集</h2>
                <ParetoFrontChart
                  solutions={solutions}
                  onSelect={handleSelectSolution}
                  selectedId={selectedSolution?.id}
                />
              </div>

              {/* 方案详情 */}
              {selectedSolution && (
                <div className="mt-6 bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">方案详情</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">商业指标</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">总成本:</span>
                          <span className="font-medium">
                            ¥{selectedSolution.total_cost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">实施工期:</span>
                          <span className="font-medium">
                            {selectedSolution.implementation_days.toFixed(1)} 天
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">预期收益:</span>
                          <span className="font-medium text-green-600">
                            ¥{selectedSolution.expected_benefit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">技术指标</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">f1:</span>
                          <span className="font-medium">{selectedSolution.f1.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">f2:</span>
                          <span className="font-medium">{selectedSolution.f2.toFixed(2)}</span>
                        </div>
                        {selectedSolution.f3 !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">f3:</span>
                            <span className="font-medium">{selectedSolution.f3.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：方案列表和决策面板 */}
            <div className="col-span-4 space-y-6">
              {/* 决策面板 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">智能决策</h2>
                <p className="text-sm text-gray-600 mb-4">
                  使用AHP-TOPSIS方法，根据您的偏好找出最优方案
                </p>
                <button
                  onClick={() => setShowAHPWizard(true)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  启动AHP决策向导
                </button>
                {ahpWeights && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="font-medium mb-1">当前权重:</p>
                    <div className="space-y-1 text-xs">
                      <div>成本: {(ahpWeights.cost * 100).toFixed(1)}%</div>
                      <div>工期: {(ahpWeights.time * 100).toFixed(1)}%</div>
                      <div>收益: {(ahpWeights.benefit * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 方案列表 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">候选方案列表</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {solutions.slice(0, 10).map((solution) => (
                    <SolutionCard
                      key={solution.id}
                      solution={solution}
                      isSelected={selectedSolution?.id === solution.id}
                      onClick={() => handleSelectSolution(solution)}
                      onViewSimulation={handleViewSimulation}
                    />
                  ))}
                </div>
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
