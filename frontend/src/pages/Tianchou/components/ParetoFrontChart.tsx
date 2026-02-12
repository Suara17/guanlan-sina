/**
 * 帕累托前沿图组件
 */

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ParetoSolution } from '../types/tianchou'

interface Props {
  solutions: ParetoSolution[]
  onSelect: (solution: ParetoSolution) => void
  selectedId?: string
}

export function ParetoFrontChart({ solutions, onSelect, selectedId }: Props) {
  // 准备图表数据
  const chartData = solutions.map((sol, index) => ({
    ...sol,
    x: sol.total_cost,
    y: sol.implementation_days,
    z: sol.expected_benefit,
    index: index + 1,
    name: `方案${index + 1}`,
  }))

  // 找出推荐方案
  const maxScore = Math.max(...solutions.map((s) => s.topsis_score || 0))
  const recommendedData = chartData.filter((s) => s.topsis_score === maxScore)
  const otherData = chartData.filter((s) => s.topsis_score !== maxScore)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold">方案 #{data.index}</p>
          <p className="text-sm">总成本: ¥{data.total_cost.toLocaleString()}</p>
          <p className="text-sm">工期: {data.implementation_days.toFixed(1)}天</p>
          <p className="text-sm">预期收益: ¥{data.expected_benefit.toLocaleString()}</p>
          {data.topsis_score && (
            <p className="text-sm font-medium text-blue-600">
              TOPSIS评分: {data.topsis_score.toFixed(4)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          name="总成本"
          unit="元"
          tickFormatter={(v) => `${(v / 10000).toFixed(1)}万`}
        />
        <YAxis type="number" dataKey="y" name="工期" unit="天" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Scatter
          name="候选方案"
          data={otherData}
          fill="#3b82f6"
          onClick={(data: any) => {
            const solution = solutions.find((s) => s.id === data.id)
            if (solution) onSelect(solution)
          }}
          cursor="pointer"
        />
        {recommendedData.length > 0 && (
          <Scatter
            name="推荐方案"
            data={recommendedData}
            fill="#ef4444"
            shape="star"
            onClick={(data: any) => {
              const solution = solutions.find((s) => s.id === data.id)
              if (solution) onSelect(solution)
            }}
            cursor="pointer"
          />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  )
}
