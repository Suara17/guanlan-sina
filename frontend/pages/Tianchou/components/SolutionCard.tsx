/**
 * 方案卡片组件
 */

import { Eye } from 'lucide-react'
import type React from 'react'
import type { ParetoSolution } from '../types/tianchou'

export interface SolutionCardProps {
  solution: ParetoSolution
  isSelected: boolean
  onClick: () => void
  onViewSimulation?: (solution: ParetoSolution) => void
}

/**
 * 评分点组件 - 显示1-5星评级
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
 * 计算评分的视觉表示 (1-5)
 */
const calculateRating = (value: number, min: number, max: number): number => {
  if (max === min) return 3
  const normalized = (value - min) / (max - min)
  return Math.max(1, Math.min(5, Math.round(normalized * 4) + 1))
}

const SolutionCard: React.FC<SolutionCardProps> = ({
  solution,
  isSelected,
  onClick,
  onViewSimulation,
}) => {
  const handleViewSimulation = (e: React.MouseEvent) => {
    e.stopPropagation()
    onViewSimulation?.(solution)
  }

  // 计算综合得分 (0-100)
  // 如果有TOPSIS分数则使用，否则使用简化的评分公式
  // 成本、工期越小越好（取反），收益越大越好
  const calculateBackupScore = () => {
    // 归一化到0-1范围，使用合理的数值边界
    // 成本：假设范围 30000-300000，越低越好
    const costScore = Math.max(0, Math.min(1, (300000 - solution.total_cost) / 270000))
    // 工期：假设范围 1-30天，越短越好
    const timeScore = Math.max(0, Math.min(1, (30 - solution.implementation_days) / 29))
    // 收益：假设范围 0-500000，越高越好
    const benefitScore = Math.max(0, Math.min(1, solution.expected_benefit / 500000))
    // 综合评分（等权重）
    return Math.round((costScore * 0.4 + timeScore * 0.3 + benefitScore * 0.3) * 100)
  }

  const score =
    solution.topsis_score != null ? Math.round(solution.topsis_score * 100) : calculateBackupScore()

  // 计算评分点显示 (基于相对值)
  const costRating = calculateRating(solution.total_cost, 100000, 300000)
  const scheduleRating = calculateRating(solution.implementation_days, 10, 60)
  const benefitRating = calculateRating(solution.expected_benefit, 100000, 800000)

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col p-5 rounded-xl transition-all duration-300 cursor-pointer
        ${
          isSelected
            ? 'bg-white border-2 border-blue-500 shadow-xl shadow-blue-100 scale-105 z-10'
            : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* 头部 */}
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-bold text-slate-800 text-base">方案 #{solution.rank || '?'}</h4>
        <span className="text-xs font-mono text-slate-400">ID:{solution.rank || '?'}</span>
      </div>

      {/* 评分指标 - 类似 OptimizationPage 的设计 */}
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

      {/* 数值详情 */}
      <div className="space-y-1 text-sm mb-4">
        <div className="flex justify-between items-center py-1 border-b border-slate-100">
          <span className="text-slate-500 text-xs">总成本</span>
          <span className="font-medium text-slate-700">
            ¥{solution.total_cost.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-100">
          <span className="text-slate-500 text-xs">工期</span>
          <span className="font-medium text-slate-700">
            {solution.implementation_days.toFixed(1)} 天
          </span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 text-xs">预期收益</span>
          <span className="font-medium text-green-600">
            ¥{solution.expected_benefit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 综合得分进度条 */}
      <div className="mt-2">
        <div className="flex justify-between text-sm mb-2 font-medium text-slate-500">
          <span>综合得分</span>
          <span className="text-blue-600">{score}分</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>

      {/* 技术指标 */}
      <div className="mt-2 pt-3 border-t border-slate-100 text-xs text-slate-400">
        <div className="flex gap-3">
          <span>f1: {solution.f1.toFixed(2)}</span>
          <span>f2: {solution.f2.toFixed(2)}</span>
          {solution.f3 !== undefined && <span>f3: {solution.f3.toFixed(2)}</span>}
        </div>
      </div>

      {/* 查看仿真按钮 */}
      {onViewSimulation && (
        <div className="mt-4">
          <button
            onClick={handleViewSimulation}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Eye size={16} />
              查看仿真
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export default SolutionCard
