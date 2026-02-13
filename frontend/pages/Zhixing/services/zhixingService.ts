import type {
  ExecutionResult,
  ExecutionStep,
  ExecutionTask,
  LogEntry,
  MachineDiagram,
} from '../types/zhixing'
import { ExecutionStatus } from '../types/zhixing'

const MOCK_DELAY = 500

const generateMockLogs = (): LogEntry[] => [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    level: 'info',
    message: '任务已初始化',
    source: 'System',
  },
]

const generateMockSteps = (): ExecutionStep[] => [
  { step_id: 1, name: '设备检查', status: 'completed', duration: 15, description: '检查设备状态' },
  { step_id: 2, name: '参数校验', status: 'completed', duration: 8, description: '验证执行参数' },
  { step_id: 3, name: '物料准备', status: 'completed', duration: 25, description: '准备更换物料' },
  { step_id: 4, name: '停机确认', status: 'completed', duration: 12, description: '等待产线停止' },
  { step_id: 5, name: '执行更换', status: 'running', description: '更换吸嘴组件' },
  { step_id: 6, name: '功能测试', status: 'pending', description: '测试设备功能' },
  { step_id: 7, name: '重启验证', status: 'pending', description: '启动并验证' },
  { step_id: 8, name: '记录归档', status: 'pending', description: '完成执行记录' },
]

const generateMockMachineDiagram = (): MachineDiagram => ({
  machine_id: 'M-005',
  machine_name: '贴片机 #5',
  model: 'NPM-D3',
  components: [
    {
      id: 'comp-1',
      name: '真空发生器',
      type: 'actuator',
      status: 'warning',
      position: { x: 150, y: 100 },
      value: '-65',
      unit: 'kPa',
      description: '真空度低于设定值',
    },
    {
      id: 'comp-2',
      name: '吸嘴',
      type: 'mechanical',
      status: 'error',
      position: { x: 300, y: 150 },
      value: '磨损',
      unit: '',
      description: '吸嘴老化严重',
    },
    {
      id: 'comp-3',
      name: '气压传感器',
      type: 'sensor',
      status: 'normal',
      position: { x: 150, y: 200 },
      value: '0.45',
      unit: 'MPa',
    },
    {
      id: 'comp-4',
      name: '控制器',
      type: 'controller',
      status: 'normal',
      position: { x: 300, y: 250 },
      value: '运行中',
      unit: '',
    },
    {
      id: 'comp-5',
      name: '光学识别',
      type: 'sensor',
      status: 'normal',
      position: { x: 200, y: 180 },
      value: '正常',
      unit: '',
    },
  ],
})

const generateMockTask = (): ExecutionTask => ({
  task_id: 'exec-' + Date.now(),
  solution_id: 'A',
  solution_name: '方案 A：立即停机更换吸嘴',
  status: ExecutionStatus.RUNNING,
  progress: 45,
  current_step: 5,
  total_steps: 8,
  started_at: new Date(Date.now() - 60000).toISOString(),
  estimated_remaining_time: 120,
})

export const zhixingService = {
  async startExecution(solutionId: string, solutionName: string): Promise<ExecutionTask> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
    return {
      ...generateMockTask(),
      solution_id: solutionId,
      solution_name: solutionName,
    }
  },

  async getTaskStatus(taskId: string): Promise<ExecutionTask> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
    const task = generateMockTask()
    if (Math.random() > 0.7) {
      task.progress = Math.min(100, task.progress + 5)
      task.current_step = Math.min(
        task.total_steps,
        task.current_step + (task.progress > 80 ? 1 : 0)
      )
    }
    if (task.progress >= 100) {
      task.status = ExecutionStatus.COMPLETED
      task.completed_at = new Date().toISOString()
    }
    return task
  },

  async getExecutionSteps(taskId: string): Promise<ExecutionStep[]> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
    return generateMockSteps()
  },

  async getRealTimeLogs(taskId: string): Promise<LogEntry[]> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const baseLogs = generateMockLogs()
    const additionalLogs: LogEntry[] = [
      {
        id: String(Date.now()),
        timestamp: new Date().toISOString(),
        level: Math.random() > 0.8 ? 'warning' : 'info',
        message: `执行步骤 5/8: 正在更换吸嘴组件...`,
        source: 'Executor',
      },
      {
        id: String(Date.now() - 1),
        timestamp: new Date(Date.now() - 2000).toISOString(),
        level: 'info',
        message: '真空系统已释放压力',
        source: 'System',
      },
    ]
    return [...baseLogs, ...additionalLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  },

  async getMachineDiagram(machineId: string): Promise<MachineDiagram> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
    return generateMockMachineDiagram()
  },

  async pauseExecution(taskId: string): Promise<ExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
    return { success: true, message: '任务已暂停' }
  },

  async resumeExecution(taskId: string): Promise<ExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
    return { success: true, message: '任务已恢复' }
  },

  async cancelExecution(taskId: string): Promise<ExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
    return { success: true, message: '任务已取消' }
  },
}
