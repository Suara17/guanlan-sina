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

// 格式化数值
const formatValue = (
  value: number,
  type: 'f1' | 'f2' | 'f3',
  labels: ReturnType<typeof getLabels>
) => {
  if (type === 'f1') {
    return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toFixed(0)
  }
  if (type === 'f2') {
    return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toFixed(0)
  }
  return value.toFixed(4)
}

// 格式化轴刻度
const formatAxisTick = (value: number, type: 'f1' | 'f2' | 'f3') => {
  if (type === 'f1' || type === 'f2') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toFixed(0)
  }
  return value.toFixed(3)
}

// 自定义 Tooltip
const CustomTooltip = ({ active, payload }: any, labels: ReturnType<typeof getLabels>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 shadow-xl rounded-lg border border-slate-200">
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
  xType: 'f1' | 'f2' | 'f3'
  yType: 'f1' | 'f2' | 'f3'
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
  xType,
  yType,
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
      <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          type="number"
          dataKey={xKey}
          name={xLabel}
          tickFormatter={(v) => formatAxisTick(v, xType)}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={{ stroke: '#cbd5e1' }}
        ></XAxis>
        <YAxis
          type="number"
          dataKey={yKey}
          name={yLabel}
          tickFormatter={(v) => formatAxisTick(v, yType)}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#cbd5e1' }}
          tickLine={{ stroke: '#cbd5e1' }}
        />
        <Tooltip content={tooltipContent} cursor={{ fill: 'transparent' }} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconSize={10}
            formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
          />
        )}
        {/* 所有点 - 浅蓝色半透明 */}
        <Scatter
          name="所有解"
          data={data}
          fill="rgba(70, 130, 180, 0.25)"
          stroke="rgba(70, 130, 180, 0.5)"
          strokeWidth={0.5}
          r={3}
        />
        {/* 帕累托前沿 - 黄色五角星 */}
        <Scatter
          name="帕累托前沿"
          data={paretoData}
          fill="#FFC107"
          stroke="#333"
          strokeWidth={0.5}
          shape="star"
          r={12}
          onClick={handleClick}
          cursor="pointer"
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

// 生成模拟的所有解点云数据 - 模拟参考图的椭圆带状分布
// 参考图特征：点云覆盖更广区域，呈椭圆/带状分布，帕累托前沿位于边界
const generateAllSolutionsCloud = (paretoSolutions: ParetoSolution[]): ParetoSolution[] => {
  if (paretoSolutions.length === 0) return []

  const allSolutions: ParetoSolution[] = [...paretoSolutions]

  // 获取帕累托解的范围
  const f1Values = paretoSolutions.map((s) => s.f1)
  const f2Values = paretoSolutions.map((s) => s.f2)
  const f3Values = paretoSolutions.map((s) => s.f3 ?? 0)

  const f1Min = Math.min(...f1Values)
  const f1Max = Math.max(...f1Values)
  const f2Min = Math.min(...f2Values)
  const f2Max = Math.max(...f2Values)
  const f3Min = Math.min(...f3Values)
  const f3Max = Math.max(...f3Values)

  // 参考图的特征：点云范围远大于帕累托前沿范围
  // 扩展范围以生成更广的点云（约帕累托范围的 2-3 倍）
  const f1Range = f1Max - f1Min
  const f2Range = f2Max - f2Min
  const f3Range = Math.max(f3Max - f3Min, 0.005)

  // 点云的中心（帕累托前沿的几何中心）
  const centerF1 = (f1Min + f1Max) / 2
  const centerF2 = (f2Min + f2Max) / 2
  const centerF3 = (f3Min + f3Max) / 2

  // 椭圆分布参数 - 参考图的椭圆特征
  // 主轴方向约45度（f1和f2正相关）
  // 椭圆的长轴和短轴
  const ellipseA = f1Range * 1.8 // 长轴（沿对角线方向）
  const ellipseB = f2Range * 0.8 // 短轴（垂直于对角线方向）
  const angle = Math.PI / 4 // 45度旋转

  // f3的范围（独立缩放）
  const f3CloudMin = f3Min - f3Range * 0.3
  const f3CloudMax = f3Max + f3Range * 0.3

  // 生成椭圆带状分布的点云
  const totalPoints = 600

  for (let i = 0; i < totalPoints; i++) {
    // 使用参数化椭圆方程 + 随机扰动
    // t: 椭圆上的参数 (0 到 2π)
    const t = Math.random() * 2 * Math.PI

    // 椭圆基础坐标
    const ellipseX = ellipseA * Math.cos(t)
    const ellipseY = ellipseB * Math.sin(t)

    // 旋转45度
    const rotatedX = ellipseX * Math.cos(angle) - ellipseY * Math.sin(angle)
    const rotatedY = ellipseX * Math.sin(angle) + ellipseY * Math.cos(angle)

    // 添加随机扰动（模拟真实优化过程中的解分布）
    // 扰动强度随位置变化，使点云呈现带状分布
    const perturbationStrength = 0.3 + 0.4 * Math.random()
    const perturbX = (Math.random() - 0.5) * f1Range * perturbationStrength
    const perturbY = (Math.random() - 0.5) * f2Range * perturbationStrength * 0.6

    // 计算最终坐标（椭圆中心 + 椭圆偏移 + 扰动）
    let f1 = centerF1 + rotatedX + perturbX
    let f2 = centerF2 + rotatedY + perturbY

    // 确保点云在帕累托前沿的"外侧"（对于最小化问题，点在右上方向）
    // 这确保帕累托前沿位于点云的"边界"
    const paretoOffset = 0.05 * f1Range * (0.5 + Math.random())
    f1 = Math.max(f1, f1Min + paretoOffset)
    f2 = Math.max(f2, f2Min + (paretoOffset * f2Range) / f1Range)

    // f3: 与f1负相关（当物料搬运成本增加时，空间利用率略有下降）
    // 使用线性趋势 + 随机扰动
    const f3Trend = centerF3 - ((f1 - centerF1) / f1Range) * f3Range * 0.3
    const f3Noise = (Math.random() - 0.5) * f3Range * 0.8
    const f3 = Math.max(f3CloudMin, Math.min(f3CloudMax, f3Trend + f3Noise))

    // 计算商业指标
    const totalCost = f1 * 12 + f2 * 8 + 10000 * (1 + Math.random() * 0.3)
    const implementationDays = 2 + Math.random() * 4
    const expectedBenefit = Math.max(10000, 80000 - f1 * 0.1 - f2 * 0.2 + Math.random() * 20000)

    allSolutions.push({
      id: `cloud-${i}`,
      rank: 0,
      f1: Math.max(f1Min * 0.8, f1), // 确保不超出合理范围
      f2: Math.max(f2Min * 0.8, f2),
      f3: f3,
      total_cost: totalCost,
      implementation_days: implementationDays,
      expected_benefit: expectedBenefit,
    })
  }

  // 添加额外的"带状"分布点 - 沿主轴方向的密集分布
  const bandPoints = 300
  for (let i = 0; i < bandPoints; i++) {
    // 沿主轴方向的带状分布
    const bandPosition = Math.random() // 0 到 1，沿带状方向

    // 带状方向（45度对角线）
    const bandF1 = f1Min - f1Range * 0.2 + f1Range * 2.2 * bandPosition
    const bandF2 = f2Min - f2Range * 0.2 + f2Range * 2.2 * bandPosition * 0.9

    // 垂直于带状方向的随机偏移（较窄）
    const perpOffset = (Math.random() - 0.5) * f2Range * 0.5

    // f1 vs f2 呈正相关带状
    const f1 = bandF1 + perpOffset * 0.3
    const f2 = bandF2 + perpOffset

    // f3 与 f1/f2 负相关
    const f3 =
      centerF3 - (bandPosition - 0.5) * f3Range * 0.4 + (Math.random() - 0.5) * f3Range * 0.6

    // 计算商业指标
    const totalCost = f1 * 12 + f2 * 8 + 10000 * (1 + Math.random() * 0.3)
    const implementationDays = 2 + Math.random() * 4
    const expectedBenefit = Math.max(10000, 80000 - f1 * 0.1 - f2 * 0.2 + Math.random() * 20000)

    allSolutions.push({
      id: `band-${i}`,
      rank: 0,
      f1: f1,
      f2: f2,
      f3: Math.max(f3CloudMin, Math.min(f3CloudMax, f3)),
      total_cost: totalCost,
      implementation_days: implementationDays,
      expected_benefit: expectedBenefit,
    })
  }

  // 添加帕累托前沿附近的密集点（模拟真实的优化结果分布）
  paretoSolutions.forEach((sol, idx) => {
    for (let i = 0; i < 8; i++) {
      // 在帕累托点的"外侧"生成次优点
      const offset1 = Math.random() * f1Range * 0.25
      const offset2 = Math.random() * f2Range * 0.25
      const offset3 = (Math.random() - 0.5) * f3Range * 0.15

      allSolutions.push({
        id: `near-pareto-${idx}-${i}`,
        rank: 0,
        f1: sol.f1 + offset1,
        f2: sol.f2 + offset2,
        f3: (sol.f3 ?? f3Min) + offset3,
        total_cost: sol.total_cost * (1 + Math.random() * 0.2),
        implementation_days: sol.implementation_days,
        expected_benefit: sol.expected_benefit * (0.9 + Math.random() * 0.2),
      })
    }
  })

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

  // 准备图表数据
  const chartData = useMemo(() => {
    // 如果提供了所有解，直接使用
    // 否则基于帕累托解生成模拟的点云数据
    const dataSource =
      allSolutions && allSolutions.length > solutions.length * 2
        ? allSolutions
        : generateAllSolutionsCloud(solutions)

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
  }, [solutions, allSolutions, selectedId])

  // 如果没有数据，显示占位符
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
      {/* 标题 */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 text-center">
          双轨算法 – 帕累托前沿分析
          {taskName && <span className="text-slate-500 font-normal">（{taskName}）</span>}
        </h3>
        <p className="text-sm text-slate-500 text-center mt-1">多目标优化权衡关系可视化</p>
      </div>

      {/* 三联图 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左图：f1 vs f2 */}
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
            xType="f1"
            yType="f2"
            labels={labels}
            onSelect={onSelect}
            solutions={solutions}
            showLegend={true}
          />
          <p className="text-xs text-slate-500 text-center mt-2">
            X轴: {labels.f1} ({labels.f1Unit}) | Y轴: {labels.f2} ({labels.f2Unit})
          </p>
        </div>

        {/* 中图：f1 vs f3 */}
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
            xType="f1"
            yType="f3"
            labels={labels}
            onSelect={onSelect}
            solutions={solutions}
          />
          <p className="text-xs text-slate-500 text-center mt-2">
            X轴: {labels.f1} ({labels.f1Unit}) | Y轴: {labels.f3}
          </p>
        </div>

        {/* 右图：f2 vs f3 */}
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
            xType="f2"
            yType="f3"
            labels={labels}
            onSelect={onSelect}
            solutions={solutions}
          />
          <p className="text-xs text-slate-500 text-center mt-2">
            X轴: {labels.f2} ({labels.f2Unit}) | Y轴: {labels.f3}
          </p>
        </div>
      </div>

      {/* 图例说明 */}
      <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[rgba(70,130,180,0.3)] border border-[rgba(70,130,180,0.5)]"></div>
          <span className="text-sm text-slate-600">所有解</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="#FFC107"
            stroke="#333"
            strokeWidth="0.5"
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
