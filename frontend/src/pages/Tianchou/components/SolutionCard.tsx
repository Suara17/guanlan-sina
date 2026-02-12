/**
 * 方案卡片组件
 */

import type { ParetoSolution } from '../types/tianchou'

interface Props {
  solution: ParetoSolution
  isSelected: boolean
  onClick: () => void
}

export function SolutionCard({ solution, isSelected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-lg">方案 #{solution.rank || '?'}</span>
        {solution.topsis_score && (
          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
            评分: {solution.topsis_score.toFixed(4)}
          </span>
        )}
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">总成本:</span>
          <span className="font-medium">¥{solution.total_cost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">工期:</span>
          <span className="font-medium">{solution.implementation_days.toFixed(1)} 天</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">预期收益:</span>
          <span className="font-medium text-green-600">
            ¥{solution.expected_benefit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 技术指标 */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex gap-3">
          <span>f1: {solution.f1.toFixed(2)}</span>
          <span>f2: {solution.f2.toFixed(2)}</span>
          {solution.f3 !== undefined && <span>f3: {solution.f3.toFixed(2)}</span>}
        </div>
      </div>
    </button>
  )
}
