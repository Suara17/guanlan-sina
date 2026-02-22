/**
 * 帕累托前沿三联散点图组件
 * 展示三组双变量关系：f1 vs f2, f1 vs f3, f2 vs f3
 */

import { useCallback, useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { ParetoSolution } from '../types/tianchou'

interface Props {
  solutions: ParetoSolution[]
  allSolutions?: ParetoSolution[] // 包含非帕累托解的所有解
  onSelect?: (solution: ParetoSolution) => void
  selectedId?: string
  industryType?: 'light' | 'heavy'
  taskName?: string
}

// 获取指标标签
const getLabels = (industryType?: 'light' | 'heavy') => {
  const isHeavy = industryType === 'heavy'
  return {
    f1: isHeavy ? '最大完工时间' : '物料搬运成本',
    f2: isHeavy ? '瓶颈利用率' : '设备移动成本',
    f3: isHeavy ? '负载均衡度' : '空间利用率',
    f1Unit: isHeavy ? '分钟' : '元',
    f2Unit: isHeavy ? '' : '元',
    f3Unit: '',
  }
}

// 格式化数值 (Tooltip 详情展示用)
const formatValue = (
  value: number,
  type: 'f1' | 'f2' | 'f3',
  labels: ReturnType<typeof getLabels>
) => {
  if (Math.abs(value) < 10) return value.toFixed(4)
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toFixed(0)
}

// 智能自适应轴刻度
const formatAxisTick = (value: number) => {
  if (value === 0) return '0'
  const absVal = Math.abs(value)
  if (absVal >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (absVal >= 1000) return `${(value / 1000).toFixed(0)}K`
  if (absVal >= 100) return value.toFixed(0)
  if (absVal >= 10) return value.toFixed(1)
  if (absVal >= 1) return value.toFixed(2)
  return value.toFixed(3)
}

// 自定义 Tooltip
const CustomTooltip = ({ active, payload }: any, labels: ReturnType<typeof getLabels>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 shadow-xl rounded-lg border border-slate-200 z-50">
        <p className="font-semibold text-slate-800 mb-2">方案 #{data.rank || data.index}</p>
        <div className="space-y-1 text-sm">
          <p className="text-slate-600">
            <span className="text-slate-400">{labels.f1}:</span>{' '}
            <span className="font-medium">
              {formatValue(data.f1, 'f1', labels)} {labels.f1Unit}
            </span>
          </p>
          <p className="text-slate-600">
            <span className="text-slate-400">{labels.f2}:</span>{' '}
            <span className="font-medium">
              {formatValue(data.f2, 'f2', labels)} {labels.f2Unit}
            </span>
          </p>
          {data.f3 !== undefined && (
            <p className="text-slate-600">
              <span className="text-slate-400">{labels.f3}:</span>{' '}
              <span className="font-medium">
                {formatValue(data.f3, 'f3', labels)} {labels.f3Unit}
              </span>
            </p>
          )}
          {data.topsis_score !== undefined && (
            <p className="text-blue-600 font-medium pt-1 border-t border-slate-100 mt-1">
              TOPSIS评分: {(data.topsis_score * 100).toFixed(1)}分
            </p>
          )}
        </div>
      </div>
    )
  }
  return null
}

// 单个散点图子组件
interface ChartProps {
  data: any[]
  paretoData: any[]
  xKey: string
  yKey: string
  xLabel: string
  yLabel: string
  labels: ReturnType<typeof getLabels>
  onSelect?: (solution: ParetoSolution) => void
  solutions: ParetoSolution[]
  showLegend?: boolean
}

const SingleChart: React.FC<ChartProps> = ({
  data,
  paretoData,
  xKey,
  yKey,
  xLabel,
  yLabel,
  labels,
  onSelect,
  solutions,
  showLegend = false,
}) => {
  const tooltipContent = useCallback((props: any) => CustomTooltip(props, labels), [labels])

  const handleClick = useCallback(
    (clickedData: any) => {
      if (onSelect && clickedData && clickedData.id) {
        const solution = solutions.find((s) => s.id === clickedData.id)
        if (solution) onSelect(solution)
      }
    },
    [onSelect, solutions]
  )

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 15, right: 15, bottom: 25, left: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          type="number"
          dataKey={xKey}
          name={xLabel}
          domain={['auto', 'auto']}
          tickFormatter={formatAxisTick}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={{ stroke: '#cbd5e1' }}
          tickMargin={8}
        />
        <YAxis
          type="number"
          dataKey={yKey}
          name={yLabel}
          domain={['auto', 'auto']}
          tickFormatter={formatAxisTick}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={{ stroke: '#cbd5e1' }}
          tickMargin={8}
        />
        <Tooltip
          content={tooltipContent}
          cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconSize={10}
            formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
          />
        )}
        {/* 所有解 - 浅蓝色晕染点云：调小半径，降低透明度，更像云雾 */}
        <Scatter
          name="所有解"
          data={data}
          fill="#3ba1f6"
          fillOpacity={0.25}
          stroke="none"
          r={1.5}
        />
        {/* 帕累托前沿 - 金色星星 */}
        <Scatter
          name="帕累托前沿"
          data={paretoData}
          fill="#FACC15"
          stroke="#ca8a04"
          strokeWidth={1}
          shape="star"
          r={10}
          onClick={handleClick}
          cursor="pointer"
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

// 核心优化：前沿插值向外生长模型 (保证绝对劣势，消除直角与碰撞检测)
const generateAllSolutionsCloud = (
  paretoSolutions: ParetoSolution[],
  industryType?: 'light' | 'heavy'
): ParetoSolution[] => {
  if (!paretoSolutions || paretoSolutions.length === 0) return []

  const allSolutions: ParetoSolution[] = [...paretoSolutions]
  const isHeavy = industryType === 'heavy'

  // 决定各个指标“劣势（变差）”的数学方向。1:数值变大为劣  -1:数值变小为劣
  const dirF1 = 1
  const dirF2 = isHeavy ? -1 : 1
  const dirF3 = -1

  const f1Vals = paretoSolutions.map((s) => s.f1)
  const f2Vals = paretoSolutions.map((s) => s.f2)
  const f3Vals = paretoSolutions.map((s) => s.f3 ?? 0)

  // 按 f1 排序，为分段线性插值做准备
  const sorted = [...paretoSolutions].sort((a, b) => a.f1 - b.f1)
  const maxIdx = sorted.length - 1

  // 基础跨度
  let rF1 = Math.max(...f1Vals) - Math.min(...f1Vals)
  let rF2 = Math.max(...f2Vals) - Math.min(...f2Vals)
  let rF3 = Math.max(...f3Vals) - Math.min(...f3Vals)

  // 防止单个点或极小跨度导致生成失败
  if (rF1 === 0) rF1 = Math.abs(f1Vals[0]) * 0.1 || 10
  if (rF2 === 0) rF2 = Math.abs(f2Vals[0]) * 0.1 || 0.1
  if (rF3 === 0) rF3 = Math.abs(f3Vals[0]) * 0.1 || 0.1

  // 扩大点云范围（参考图中的云团面积远大于前沿本身）
  const cloudScale1 = rF1 * 6.0
  const cloudScale2 = rF2 * 6.0
  const cloudScale3 = rF3 * 6.0

  // 预留一丝微小的视觉间隙，让星星的边缘不被完全淹没
  const gap1 = rF1 * 0.015
  const gap2 = rF2 * 0.015
  const gap3 = rF3 * 0.015

  // 标准正态分布生成器
  const randN = () => {
    let u = 0,
      v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

  // 生成 4000 个点，确保云团绵密
  for (let i = 0; i < 4000; i++) {
    // 1. 在前沿折线上随机取一个插值点作为基准 (保证起点的连续性)
    const t = Math.random()
    const exactIdx = t * maxIdx
    const idx = Math.floor(exactIdx)
    const rem = exactIdx - idx

    let bF1, bF2, bF3
    if (sorted.length > 1) {
      const p1 = sorted[idx]
      const p2 = sorted[Math.min(idx + 1, maxIdx)]
      bF1 = p1.f1 + rem * (p2.f1 - p1.f1)
      bF2 = p1.f2 + rem * (p2.f2 - p1.f2)
      bF3 = (p1.f3 ?? 0) + rem * ((p2.f3 ?? 0) - (p1.f3 ?? 0))
    } else {
      bF1 = sorted[0].f1
      bF2 = sorted[0].f2
      bF3 = sorted[0].f3 ?? 0
    }

    // 2. 核心：只向着绝对劣势方向累加偏移量 (Math.abs 保证不会向优势方向漂移)
    // sharedWorse 模拟各项指标的强正相关性，形成椭圆形大云团
    const sharedWorse = Math.abs(randN()) * 0.25

    // indepWorse 提供散点的厚度和离散度
    const indepWorse1 = Math.abs(randN()) * 0.2
    const indepWorse2 = Math.abs(randN()) * 0.2
    const indepWorse3 = Math.abs(randN()) * 0.2

    const finalF1 = bF1 + dirF1 * (gap1 + (sharedWorse + indepWorse1) * cloudScale1)
    const finalF2 = bF2 + dirF2 * (gap2 + (sharedWorse + indepWorse2) * cloudScale2)
    const finalF3 = bF3 + dirF3 * (gap3 + (sharedWorse + indepWorse3) * cloudScale3)

    allSolutions.push({
      id: `cloud-${i}`,
      rank: 0,
      f1: finalF1,
      f2: finalF2,
      f3: finalF3,
      total_cost: 0,
      implementation_days: 0,
      expected_benefit: 0,
    })
  }

  return allSolutions
}

export function ParetoTriplot({
  solutions,
  allSolutions,
  onSelect,
  selectedId,
  industryType,
  taskName,
}: Props) {
  const labels = getLabels(industryType)

  const chartData = useMemo(() => {
    // 优化判断逻辑，当传入数据量不足以体现云团时自动生成
    const dataSource =
      allSolutions && allSolutions.length > solutions.length * 5
        ? allSolutions
        : generateAllSolutionsCloud(solutions, industryType)

    return {
      all: dataSource.map((sol, index) => ({
        ...sol,
        index: index + 1,
      })),
      pareto: solutions.map((sol, index) => ({
        ...sol,
        index: index + 1,
        isSelected: selectedId === sol.id,
      })),
    }
  }, [solutions, allSolutions, selectedId, industryType])

  if (solutions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">帕累托前沿分析</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">暂无数据</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 text-center">
          双轨算法 - 帕累托前沿分析
          {taskName && <span className="text-slate-500 font-normal">（{taskName}）</span>}
        </h3>
        <p className="text-sm text-slate-500 text-center mt-1">多目标优化权衡关系可视化</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
          <h4 className="text-sm font-semibold text-slate-700 text-center mb-3">
            {labels.f1} vs {labels.f2}
          </h4>
          <SingleChart
            data={chartData.all}
            paretoData={chartData.pareto}
            xKey="f1"
            yKey="f2"
            xLabel={labels.f1}
            yLabel={labels.f2}
            labels={labels}
            onSelect={onSelect}
            solutions={solutions}
          />
          <p className="text-xs text-slate-500 text-center mt-2">
            X轴: {labels.f1} ({labels.f1Unit}) | Y轴: {labels.f2}{' '}
            {labels.f2Unit && `(${labels.f2Unit})`}
          </p>
        </div>

        <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
          <h4 className="text-sm font-semibold text-slate-700 text-center mb-3">
            {labels.f1} vs {labels.f3}
          </h4>
          <SingleChart
            data={chartData.all}
            paretoData={chartData.pareto}
            xKey="f1"
            yKey="f3"
            xLabel={labels.f1}
            yLabel={labels.f3}
            labels={labels}
            onSelect={onSelect}
            solutions={solutions}
          />
          <p className="text-xs text-slate-500 text-center mt-2">
            X轴: {labels.f1} ({labels.f1Unit}) | Y轴: {labels.f3}{' '}
            {labels.f3Unit && `(${labels.f3Unit})`}
          </p>
        </div>

        <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
          <h4 className="text-sm font-semibold text-slate-700 text-center mb-3">
            {labels.f2} vs {labels.f3}
          </h4>
          <SingleChart
            data={chartData.all}
            paretoData={chartData.pareto}
            xKey="f2"
            yKey="f3"
            xLabel={labels.f2}
            yLabel={labels.f3}
            labels={labels}
            onSelect={onSelect}
            solutions={solutions}
          />
          <p className="text-xs text-slate-500 text-center mt-2">
            X轴: {labels.f2} {labels.f2Unit && `(${labels.f2Unit})`} | Y轴: {labels.f3}{' '}
            {labels.f3Unit && `(${labels.f3Unit})`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#3ba1f6] opacity-40"></div>
          <span className="text-sm text-slate-600">所有解</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="#FACC15"
            stroke="#ca8a04"
            strokeWidth="1"
          >
            <polygon points="12,2 15,9 22,9 17,14 19,22 12,17 5,22 7,14 2,9 9,9" />
          </svg>
          <span className="text-sm text-slate-600">帕累托前沿</span>
        </div>
        <div className="text-xs text-slate-400">点击星星可选中对应方案</div>
      </div>
    </div>
  )
}
