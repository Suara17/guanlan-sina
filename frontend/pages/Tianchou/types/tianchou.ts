/**
 * 天筹优化决策系统类型定义
 */

export enum IndustryType {
  LIGHT = 'light',
  HEAVY = 'heavy',
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface EvolutionHistoryItem {
  generation: number
  f1: number
  f2: number
  f3: number
  diversity: number
  mutpb: number
  best_fitness?: number
  elapsed_time: number
}

export interface EvolutionData {
  task_id: string
  status: TaskStatus
  progress: number
  history: EvolutionHistoryItem[]
}

export interface OptimizationTask {
  task_id: string
  name: string
  status: TaskStatus
  progress: number
  solution_count: number
  recommended_solution_id?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface ParetoSolution {
  id: string
  rank: number
  // 技术指标
  f1: number
  f2: number
  f3?: number
  // 商业指标
  total_cost: number
  implementation_days: number
  expected_benefit: number
  topsis_score?: number
}

export interface SolutionDetail extends ParetoSolution {
  solution_data: Record<string, any>
  technical_details: Record<string, any>
}

export interface AHPWeights {
  cost: number
  time: number
  benefit: number
}

export interface AHPResult {
  weights: AHPWeights
  consistency_ratio: number
  is_valid: boolean
}

export interface TOPSISScore {
  solution_id: string
  score: number
}

export interface TOPSISResult {
  best_solution_id: string
  scores: TOPSISScore[]
}

export interface RepresentativeSolutions {
  min_cost: ParetoSolution
  min_time: ParetoSolution
  max_benefit: ParetoSolution
  best_overall: ParetoSolution
}

export interface TaskSummary {
  task: OptimizationTask
  representative_solutions: RepresentativeSolutions
}

export interface OptimizationRequestParams {
  name: string
  industry_type: IndustryType
  // 轻工业参数
  workshop_length?: number
  workshop_width?: number
  device_count?: number
  transport_matrix?: number[][]
  // 重工业参数
  station_count?: number
  agv_count?: number
  station_coords?: number[][]
  task_assignments?: number[][]
  // 商业参数
  daily_output_value?: number
  base_cost?: number
  construction_rate?: number
  benefit_multiplier?: number
}

// 优化结果类型 - 用于可视化
export interface HeavyIndustryAGVData {
  stations: Array<{ id: number; name: string; position: number[] }>
  agvRoutes: Array<{
    agvId: number
    route: number[][]
    completionTime: number
    tasks: Array<{ from: number; to: number; startTime: number; endTime: number }>
  }>
  metrics: {
    totalCompletionTime: number
    bottleneckUtilization: number
  }
}

export interface LightIndustryLayoutData {
  workshopDimensions: { length: number; width: number }
  devices: Array<{
    id: number
    name: string
    originalPosition: number[]
    newPosition: number[]
    size: { width: number; height: number }
  }>
  movedDevices: Array<{ deviceId: number; distance: number; cost: number }>
}

export interface HeavyIndustryResult {
  type: 'heavy'
  solution: ParetoSolution
  taskId: string
  agvData: HeavyIndustryAGVData
}

export interface LightIndustryResult {
  type: 'light'
  solution: ParetoSolution
  taskId: string
  layoutData: LightIndustryLayoutData
}

export type OptimizationResult = HeavyIndustryResult | LightIndustryResult
