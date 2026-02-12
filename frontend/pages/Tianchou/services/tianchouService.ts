/**
 * 天筹优化决策系统 API 服务
 */

import type {
  AHPResult,
  AHPWeights,
  OptimizationRequestParams,
  OptimizationTask,
  ParetoSolution,
  SolutionDetail,
  TaskSummary,
  TOPSISResult,
} from '../types/tianchou'

const API_BASE = '/api/v1/tianchou'

export const tianchouService = {
  /**
   * 创建优化任务
   */
  async createTask(params: OptimizationRequestParams): Promise<OptimizationTask> {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
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
}
