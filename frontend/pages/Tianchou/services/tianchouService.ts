/**
 * 天筹优化决策系统 API 服务
 */
import type { AssetMode, SimulationComparisonPayload } from '../../../types'

import type {
  AHPResult,
  AHPWeights,
  AllSolutionsResponse,
  EvolutionData,
  LatestCompletedTaskResponse,
  OptimizationRequestParams,
  OptimizationTask,
  ParetoSolution,
  SolutionDetail,
  TaskConstraints,
  TaskSummary,
  TOPSISResult,
} from '../types/tianchou'

const API_BASE = '/api/v1/tianchou'

export interface TaskListQueryParams {
  status?: 'pending' | 'running' | 'completed' | 'failed'
  limit?: number
  offset?: number
  start_date?: string
  end_date?: string
}

export interface TaskListItem {
  task_id: string
  name: string
  industry_type: 'light' | 'heavy'
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  solution_count: number
  recommended_solution_id: string | null
  recommended_reason: string | null
  recommended_total_cost: number | null
  recommended_implementation_days: number | null
  recommended_expected_benefit: number | null
  recommended_expected_loss: number | null
  recommended_topsis_score: number | null
}

export interface TaskListResponse {
  tasks: TaskListItem[]
  total: number
  limit: number
  offset: number
}

export interface SolutionComparisonResponse {
  asset_mode?: AssetMode
  comparison_payload?: SimulationComparisonPayload
}

export const tianchouService = {
  /**
   * 创建优化任务
   */
  async createTask(
    params: OptimizationRequestParams,
    constraints?: TaskConstraints
  ): Promise<OptimizationTask> {
    const payload = constraints ? { ...params, constraints } : params
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<OptimizationTask> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`)

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取帕累托解列表
   */
  async getSolutions(taskId: string, limit = 20): Promise<ParetoSolution[]> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/solutions?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Failed to get solutions: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取方案详情
   */
  async getSolutionDetail(taskId: string, solutionId: string): Promise<SolutionDetail> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/solutions/${solutionId}`)

    if (!response.ok) {
      throw new Error(`Failed to get solution detail: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取方案对比载荷（用于浑天 A/B 对比联动）
   */
  async getSolutionComparison(
    taskId: string,
    solutionId: string
  ): Promise<SolutionComparisonResponse> {
    const detail = await this.getSolutionDetail(taskId, solutionId)
    return {
      asset_mode: detail.asset_mode,
      comparison_payload: detail.comparison_payload,
    }
  },

  /**
   * 计算AHP权重
   */
  async calculateAHP(
    taskId: string,
    matrix: { matrix_01: number; matrix_02: number; matrix_12: number }
  ): Promise<AHPResult> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/decide/ahp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(matrix),
    })

    if (!response.ok) {
      throw new Error(`Failed to calculate AHP: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 运行TOPSIS评分
   */
  async runTOPSIS(taskId: string, weights?: AHPWeights): Promise<TOPSISResult> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/decide/topsis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ weights }),
    })

    if (!response.ok) {
      throw new Error(`Failed to run TOPSIS: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取任务总结
   */
  async getTaskSummary(taskId: string): Promise<TaskSummary> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/summary`)

    if (!response.ok) {
      throw new Error(`Failed to get task summary: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取算法进化过程数据
   */
  async getEvolutionHistory(taskId: string): Promise<EvolutionData> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/evolution`)

    if (!response.ok) {
      throw new Error(`Failed to get evolution history: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取所有解数据（用于帕累托前沿可视化）
   */
  async getAllSolutions(
    taskId: string
  ): Promise<AllSolutionsResponse> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/all-solutions`)

    if (!response.ok) {
      throw new Error(`Failed to get all solutions: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取最近一次已完成任务及默认展示方案
   */
  async getLatestCompletedTask(): Promise<LatestCompletedTaskResponse> {
    const response = await fetch(`${API_BASE}/tasks/latest/completed`)

    if (!response.ok) {
      throw new Error(`Failed to get latest completed task: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取最近一次轻工业已完成任务（用于设备布局）
   */
  async getLatestLightTask(): Promise<LatestCompletedTaskResponse> {
    const response = await fetch(`${API_BASE}/tasks/latest/completed?industry_type=light`)

    if (!response.ok) {
      throw new Error(`Failed to get latest light task: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取布局图片
   */
  async getLayoutImages(
    taskId: string,
    solutionId: string
  ): Promise<{ original_image?: string; optimized_image?: string; error?: string }> {
    const response = await fetch(
      `${API_BASE}/tasks/${taskId}/solutions/${solutionId}/layout-images`
    )

    if (!response.ok) {
      throw new Error(`Failed to get layout images: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 获取历史任务列表
   */
  async getTaskList(params: TaskListQueryParams = {}): Promise<TaskListResponse> {
    const queryParams = new URLSearchParams()

    if (params.status) queryParams.append('status', params.status)
    if (params.limit) queryParams.append('limit', String(params.limit))
    if (params.offset) queryParams.append('offset', String(params.offset))
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)

    const response = await fetch(`${API_BASE}/tasks/history?${queryParams}`)

    if (!response.ok) {
      throw new Error(`Failed to get task list: ${response.statusText}`)
    }

    return response.json()
  },
}
