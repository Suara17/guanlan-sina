/**
 * 天筹优化状态管理 Hook
 */

import { useState } from 'react'
import type {
  AHPWeights,
  OptimizationTask,
  ParetoSolution,
  SolutionDetail,
} from '../types/tianchou'

export function useTianchou() {
  const [task, setTask] = useState<OptimizationTask | null>(null)
  const [solutions, setSolutions] = useState<ParetoSolution[]>([])
  const [selectedSolution, setSelectedSolution] = useState<SolutionDetail | null>(null)
  const [ahpWeights, setAhpWeights] = useState<AHPWeights | null>(null)

  return {
    task,
    setTask,
    solutions,
    setSolutions,
    selectedSolution,
    setSelectedSolution,
    ahpWeights,
    setAhpWeights,
  }
}
