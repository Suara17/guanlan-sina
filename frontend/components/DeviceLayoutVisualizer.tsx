/**
 * 设备布局可视化组件（D3.js 增强版）
 * 用于在浑天页面展示车间设备布局优化前后的对比
 * 基于新设计迁移，支持坐标系、区域划分、设备移动动画
 */

import * as d3 from 'd3'
import { Activity, AlertTriangle, CheckCircle2, DollarSign, Move } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  TEXTILE_MACHINES,
  TEXTILE_METRICS_OPTIMIZED,
  TEXTILE_METRICS_ORIGINAL,
  TEXTILE_PRODUCT_LINES,
  TEXTILE_ZONES,
} from '../constants'
import type { Machine } from '../types'

interface DeviceLayoutVisualizerProps {
  isOptimized: boolean
  layoutData?: {
    zones?: typeof TEXTILE_ZONES
    machines?: typeof TEXTILE_MACHINES
    productLines?: typeof TEXTILE_PRODUCT_LINES
    metricsOriginal?: typeof TEXTILE_METRICS_ORIGINAL
    metricsOptimized?: typeof TEXTILE_METRICS_OPTIMIZED
  }
  layoutImages?: {
    originalImage?: string
    optimizedImage?: string
  }
  decisionContext?: {
    taskId?: string
    taskName?: string
    solutionId?: string
    solutionRank?: number
    totalCost?: number
    implementationDays?: number
    expectedBenefit?: number
    expectedLoss?: number
    topsisScore?: number
  }
  highlightDeviceIds?: string[]
  highlightLineIds?: string[]
  onFocusResources?: (selection: { deviceIds?: string[]; lineIds?: string[] }) => void
}

const SCALE = 10
const WIDTH = 80 * SCALE
const HEIGHT = 60 * SCALE
const MARGIN = { top: 30, right: 30, bottom: 40, left: 40 }
const CHANNEL_BANDS = [
  { id: 'channel-mid', x: 30, y: 0, width: 20, height: 60 },
  { id: 'channel-right', x: 60, y: 0, width: 20, height: 60 },
]

const normalizeResourceId = (id: string): string =>
  id
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')

const createDeviceTokens = (id: string, label: string): string[] => {
  const tokens = new Set<string>()
  const baseTokens = [id, label]
  for (const base of baseTokens) {
    const normalized = normalizeResourceId(base)
    if (!normalized) continue
    tokens.add(normalized)
    const numberToken = normalized.match(/\d+/)?.[0]
    if (!numberToken) continue
    tokens.add(numberToken)
    tokens.add(`m${numberToken}`)
    tokens.add(`d${numberToken}`)
    tokens.add(`device${numberToken}`)
  }
  return Array.from(tokens)
}

const createLineTokens = (id: string, name: string): string[] => {
  const tokens = new Set<string>()
  const baseTokens = [id, name]
  for (const base of baseTokens) {
    const normalized = normalizeResourceId(base)
    if (!normalized) continue
    tokens.add(normalized)
    const numberToken = normalized.match(/\d+/)?.[0]
    if (!numberToken) continue
    tokens.add(numberToken)
    tokens.add(`line${numberToken}`)
    tokens.add(`l${numberToken}`)
  }
  return Array.from(tokens)
}

export const DeviceLayoutVisualizer: React.FC<DeviceLayoutVisualizerProps> = ({
  isOptimized,
  layoutData,
  layoutImages,
  decisionContext,
  highlightDeviceIds = [],
  highlightLineIds = [],
  onFocusResources,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredMachine, setHoveredMachine] = useState<Machine | null>(null)

  const hasBackendImages = false // 暂时禁用后端图片，使用SVG渲染

  // 使用传入数据或默认数据
  const zones = layoutData?.zones || TEXTILE_ZONES
  const machines = layoutData?.machines || TEXTILE_MACHINES
  const productLines = layoutData?.productLines || TEXTILE_PRODUCT_LINES
  const metrics = isOptimized
    ? layoutData?.metricsOptimized || TEXTILE_METRICS_OPTIMIZED
    : layoutData?.metricsOriginal || TEXTILE_METRICS_ORIGINAL
  const highlightDeviceSet = useMemo(
    () => new Set(highlightDeviceIds.map(normalizeResourceId).filter(Boolean)),
    [highlightDeviceIds]
  )
  const highlightLineSet = useMemo(
    () => new Set(highlightLineIds.map(normalizeResourceId).filter(Boolean)),
    [highlightLineIds]
  )
  const hasDeviceHighlights = highlightDeviceSet.size > 0
  const hasLineHighlights = highlightLineSet.size > 0
  const isMachineHighlighted = useCallback(
    (machine: Machine): boolean =>
      createDeviceTokens(machine.id, machine.label).some((token) => highlightDeviceSet.has(token)),
    [highlightDeviceSet]
  )
  const isLineHighlighted = useCallback(
    (lineId: string, lineName: string): boolean =>
      createLineTokens(lineId, lineName).some((token) => highlightLineSet.has(token)),
    [highlightLineSet]
  )

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
    const x = d3.scaleLinear().domain([0, 80]).range([0, WIDTH])
    const y = d3.scaleLinear().domain([0, 60]).range([HEIGHT, 0])

    const defs = svg.append('defs')

    defs
      .append('pattern')
      .attr('id', 'channel-hatch')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 10)
      .attr('height', 10)
      .attr('patternTransform', 'rotate(35)')
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 10)
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)
      .attr('opacity', 0.35)

    defs
      .selectAll('marker.flow-arrow')
      .data(productLines)
      .enter()
      .append('marker')
      .attr('id', (d) => `arrow-${d.id}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', (d) => d.color)

    defs
      .append('marker')
      .attr('id', 'move-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 9)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ef4444')

    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', WIDTH)
      .attr('height', HEIGHT)
      .attr('fill', '#f3f4f6')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1)

    const channelGroup = g.append('g').attr('class', 'channels')
    channelGroup
      .selectAll('.channel')
      .data(CHANNEL_BANDS)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.x))
      .attr('y', (d) => y(d.y + d.height))
      .attr('width', (d) => x(d.width))
      .attr('height', (d) => HEIGHT - y(d.height))
      .attr('fill', 'url(#channel-hatch)')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.75)

    const xGrid = d3
      .axisBottom(x)
      .tickSize(-HEIGHT)
      .tickFormat(() => '')
      .ticks(16)
    const yGrid = d3
      .axisLeft(y)
      .tickSize(-WIDTH)
      .tickFormat(() => '')
      .ticks(12)

    g.append('g')
      .attr('class', 'grid-x')
      .attr('transform', `translate(0,${HEIGHT})`)
      .call(xGrid)
      .attr('stroke', '#d9e0ea')
      .attr('stroke-opacity', 0.9)

    g.append('g')
      .attr('class', 'grid-y')
      .call(yGrid)
      .attr('stroke', '#d9e0ea')
      .attr('stroke-opacity', 0.9)

    g.append('g')
      .attr('transform', `translate(0,${HEIGHT})`)
      .call(d3.axisBottom(x))
      .call((axis) =>
        axis.selectAll('path,line').attr('stroke', '#334155').attr('stroke-width', 1.2)
      )
      .call((axis) => axis.selectAll('text').attr('fill', '#334155').attr('font-size', 12))

    g.append('g')
      .call(d3.axisLeft(y))
      .call((axis) =>
        axis.selectAll('path,line').attr('stroke', '#334155').attr('stroke-width', 1.2)
      )
      .call((axis) => axis.selectAll('text').attr('fill', '#334155').attr('font-size', 12))

    g.append('text')
      .attr('transform', `translate(${WIDTH / 2}, ${HEIGHT + 35})`)
      .style('text-anchor', 'middle')
      .text('X (米)')
      .style('font-size', '12px')
      .style('fill', '#334155')
      .style('font-weight', '600')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -34)
      .attr('x', 0 - HEIGHT / 2)
      .style('text-anchor', 'middle')
      .text('Y (米)')
      .style('font-size', '12px')
      .style('fill', '#334155')
      .style('font-weight', '600')

    const zoneGroup = g.append('g').attr('class', 'zones')
    zoneGroup
      .selectAll('.zone')
      .data(zones)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.x))
      .attr('y', (d) => y(d.y + d.height))
      .attr('width', (d) => x(d.width))
      .attr('height', (d) => HEIGHT - y(d.height))
      .attr('fill', (d) => d.color)
      .attr('stroke', (d) => d.borderColor || d.color)
      .attr('stroke-width', 2.5)
      .attr('opacity', 0.28)

    zoneGroup
      .selectAll('.zone-label')
      .data(zones)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.x + d.width / 2))
      .attr('y', (d) => y(d.y + d.height) + 14)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text((d) => d.label)
      .attr('fill', (d) => d.textColor || '#1e293b')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')

    const lineGroup = g.append('g').attr('class', 'product-lines')
    productLines.forEach((line, idx) => {
      const yPos = y(line.path[0].y)
      const label = `产品线${idx + 1}: ${line.name}`
      const highlighted = isLineHighlighted(line.id, line.name)
      const lineOpacity = hasLineHighlights ? (highlighted ? 1 : 0.2) : 0.75

      lineGroup
        .append('line')
        .attr('x1', x(10))
        .attr('y1', yPos)
        .attr('x2', x(72))
        .attr('y2', yPos)
        .attr('stroke', line.color)
        .attr('stroke-width', highlighted ? 4.5 : 3)
        .attr('stroke-dasharray', '6,4')
        .attr('marker-end', `url(#arrow-${line.id})`)
        .attr('opacity', lineOpacity)
        .style('cursor', 'pointer')
        .on('click', () => onFocusResources?.({ lineIds: [line.id, line.name] }))

      lineGroup
        .append('rect')
        .attr('x', x(4))
        .attr('y', yPos - 12)
        .attr('width', 122)
        .attr('height', 18)
        .attr('fill', 'white')
        .attr('stroke', highlighted ? '#0ea5e9' : line.color)
        .attr('stroke-width', highlighted ? 2.5 : 1.5)
        .attr('opacity', hasLineHighlights ? (highlighted ? 1 : 0.3) : 1)
        .attr('rx', 3)
        .style('cursor', 'pointer')
        .on('click', () => onFocusResources?.({ lineIds: [line.id, line.name] }))

      lineGroup
        .append('text')
        .attr('x', x(5))
        .attr('y', yPos + 1)
        .text(label)
        .attr('font-size', '11px')
        .attr('fill', highlighted ? '#0369a1' : line.color)
        .attr('font-weight', '700')
        .attr('opacity', hasLineHighlights ? (highlighted ? 1 : 0.4) : 1)
        .style('cursor', 'pointer')
        .on('click', () => onFocusResources?.({ lineIds: [line.id, line.name] }))
    })

    const machineGroup = g.append('g').attr('class', 'machines')
    const nodes = machineGroup
      .selectAll('.machine')
      .data(machines)
      .enter()
      .append('g')
      .attr('class', 'machine')
      .attr('transform', (d) => {
        const point = isOptimized ? d.optimized : d.original
        return `translate(${x(point.x) - x(d.width) / 2}, ${y(point.y + d.height)})`
      })
      .on('mouseover', (_e, d) => setHoveredMachine(d))
      .on('mouseout', () => setHoveredMachine(null))
      .style('cursor', 'pointer')
      .attr('opacity', (d) => {
        if (!hasDeviceHighlights) return 1
        return isMachineHighlighted(d) ? 1 : 0.3
      })
      .on('click', (_event, d) => onFocusResources?.({ deviceIds: [d.id, d.label] }))

    nodes
      .append('rect')
      .attr('width', (d) => x(d.width))
      .attr('height', (d) => HEIGHT - y(d.height))
      .attr('x', 2)
      .attr('y', 2)
      .attr('fill', 'rgba(15,23,42,0.15)')
      .attr('rx', 2)

    nodes
      .append('rect')
      .attr('width', (d) => x(d.width))
      .attr('height', (d) => HEIGHT - y(d.height))
      .attr('fill', '#f8fafc')
      .attr('stroke', (d) => (isMachineHighlighted(d) ? '#0ea5e9' : '#1f2937'))
      .attr('stroke-width', (d) => (isMachineHighlighted(d) ? 3 : 1.6))
      .attr('rx', 2)

    nodes
      .append('rect')
      .attr('width', (d) => x(d.width))
      .attr('height', 14)
      .attr('fill', '#e5e7eb')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 0.8)
      .attr('rx', 2)

    nodes
      .append('text')
      .attr('x', (d) => x(d.width) / 2)
      .attr('y', 10)
      .attr('text-anchor', 'middle')
      .text((d) => d.label)
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('fill', '#111827')

    nodes
      .append('line')
      .attr('x1', 0)
      .attr('y1', 14)
      .attr('x2', (d) => x(d.width))
      .attr('y2', 14)
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)

    nodes
      .append('text')
      .attr('x', (d) => x(d.width) / 2)
      .attr('y', (d) => (HEIGHT - y(d.height)) / 2 + 6)
      .attr('text-anchor', 'middle')
      .text((d) => d.type)
      .attr('font-size', '9px')
      .attr('fill', '#334155')
      .attr('font-weight', '600')

    nodes
      .append('text')
      .attr('x', (d) => x(d.width) / 2)
      .attr('y', (d) => HEIGHT - y(d.height) - 4)
      .attr('text-anchor', 'middle')
      .text((d) => d.subLabel || '')
      .attr('font-size', '8px')
      .attr('fill', '#64748b')

    if (isOptimized) {
      const moved = machines.filter(
        (m) => m.original.x !== m.optimized.x || m.original.y !== m.optimized.y
      )

      g.append('g')
        .attr('class', 'ghosts')
        .selectAll('.ghost')
        .data(moved)
        .enter()
        .append('rect')
        .attr(
          'transform',
          (d) => `translate(${x(d.original.x) - x(d.width) / 2}, ${y(d.original.y + d.height)})`
        )
        .attr('width', (d) => x(d.width))
        .attr('height', (d) => HEIGHT - y(d.height))
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '3,2')
        .attr('stroke-opacity', 0.8)
        .attr('rx', 2)

      const vectorGroup = g.append('g').attr('class', 'vectors')
      vectorGroup
        .selectAll('.vector')
        .data(moved)
        .enter()
        .append('line')
        .attr('x1', (d) => x(d.original.x))
        .attr('y1', (d) => y(d.original.y + d.height / 2))
        .attr('x2', (d) => x(d.optimized.x))
        .attr('y2', (d) => y(d.optimized.y + d.height / 2))
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3')
        .attr('marker-end', 'url(#move-arrow)')
        .attr('opacity', 0)
        .transition()
        .duration(800)
        .attr('opacity', 1)

      vectorGroup
        .selectAll('.move-start')
        .data(moved)
        .enter()
        .append('circle')
        .attr('cx', (d) => x(d.original.x))
        .attr('cy', (d) => y(d.original.y + d.height / 2))
        .attr('r', 2.5)
        .attr('fill', '#3b82f6')

      vectorGroup
        .selectAll('.move-end')
        .data(moved)
        .enter()
        .append('circle')
        .attr('cx', (d) => x(d.optimized.x))
        .attr('cy', (d) => y(d.optimized.y + d.height / 2))
        .attr('r', 2.5)
        .attr('fill', '#ef4444')

      const distTags = vectorGroup
        .selectAll('.dist-text')
        .data(moved)
        .enter()
        .append('g')
        .attr(
          'transform',
          (d) =>
            `translate(${(x(d.original.x) + x(d.optimized.x)) / 2}, ${(y(d.original.y + d.height / 2) + y(d.optimized.y + d.height / 2)) / 2})`
        )
        .attr('opacity', 0)

      distTags
        .append('rect')
        .attr('x', -17)
        .attr('y', -11)
        .attr('width', 34)
        .attr('height', 14)
        .attr('rx', 3)
        .attr('fill', '#ffffff')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 1)

      distTags
        .append('text')
        .text((d) => {
          const dist = Math.sqrt(
            (d.optimized.x - d.original.x) ** 2 + (d.optimized.y - d.original.y) ** 2
          )
          return `${dist.toFixed(1)}m`
        })
        .attr('text-anchor', 'middle')
        .attr('y', -1)
        .attr('font-size', '9px')
        .attr('fill', '#dc2626')
        .attr('font-weight', '700')

      distTags.transition().delay(400).duration(400).attr('opacity', 1)
    }
  }, [
    isOptimized,
    zones,
    machines,
    productLines,
    hasDeviceHighlights,
    hasLineHighlights,
    isMachineHighlighted,
    isLineHighlighted,
    onFocusResources,
  ])

  const movedMachines = machines.filter(
    (m) => m.original.x !== m.optimized.x || m.original.y !== m.optimized.y
  ).length
  const fixedMachines = machines.length - movedMachines

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 h-full min-h-0 p-4 lg:p-6 overflow-y-auto">
      <div className="flex-1 min-h-0 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex flex-col">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {isOptimized ? '双轨算法 - 设备优化布局' : '双轨算法 - 原始布局'}
          </h2>
        </div>

        <div className="relative flex-1 min-h-[360px] lg:min-h-[420px] flex items-center justify-center bg-slate-100 border border-slate-200 rounded-lg shadow-inner overflow-hidden">
          {hasBackendImages ? (
            <img
              src={`data:image/png;base64,${
                isOptimized ? layoutImages?.optimizedImage : layoutImages?.originalImage
              }`}
              alt={isOptimized ? '优化后布局' : '原始布局'}
              className="w-full h-full object-contain"
            />
          ) : (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH + MARGIN.left + MARGIN.right} ${HEIGHT + MARGIN.top + MARGIN.bottom}`}
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            />
          )}
        </div>
      </div>

      <div className="w-full lg:w-80 min-h-0 flex flex-col gap-4 lg:overflow-y-auto pr-1">
        {/* 指标面板 */}
        <div className="bg-white rounded-xl shadow p-5 border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-blue-600" />
            性能指标
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <DollarSign size={48} />
              </div>
              <div className="text-blue-700 text-sm font-medium mb-1">物料搬运成本</div>
              <div className="text-2xl font-bold text-blue-900">
                ¥{metrics.materialCost.toLocaleString()}
              </div>
              {isOptimized && (
                <div className="text-green-600 text-xs font-bold mt-1">↓ 18.8% 节省</div>
              )}
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Move size={48} />
              </div>
              <div className="text-orange-700 text-sm font-medium mb-1">设备移动成本</div>
              <div className="text-xl font-bold text-orange-900">
                ¥{metrics.moveCost.toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">移动设备数</div>
                <div className="text-xl font-bold text-slate-800">{metrics.movedCount} 台</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">总移动距离</div>
                <div className="text-xl font-bold text-slate-800">{metrics.totalDistance} m</div>
              </div>
            </div>
          </div>
        </div>

        {/* 本次决策方案卡片 */}
        {decisionContext && (
          <div className="mt-4 p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 size={12} /> 本次决策方案
              </span>
              {decisionContext.taskName && (
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]">
                  {decisionContext.taskName}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/60 rounded-lg p-2">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">
                  方案排名
                </p>
                <p className="text-base font-mono font-bold text-slate-800">
                  #{decisionContext.solutionRank ?? '--'}
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">
                  TOPSIS 得分
                </p>
                <p className="text-base font-mono font-bold text-slate-800">
                  {typeof decisionContext.topsisScore === 'number'
                    ? decisionContext.topsisScore.toFixed(3)
                    : '--'}
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">
                  实施总成本
                </p>
                <p className="text-base font-mono font-bold text-slate-800">
                  ¥{decisionContext.totalCost?.toLocaleString() ?? '--'}
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">
                  实施周期
                </p>
                <p className="text-base font-mono font-bold text-slate-800">
                  {typeof decisionContext.implementationDays === 'number'
                    ? `${decisionContext.implementationDays}天`
                    : '--'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 预期损失卡片 */}
        {decisionContext && (
          <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle size={12} /> 预期损失 / 风险敞口
            </span>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-mono font-bold text-slate-800">
                  ¥{decisionContext.expectedLoss?.toLocaleString() ?? '--'}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">实施期间预计损耗</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-green-600">
                  +¥{decisionContext.expectedBenefit?.toLocaleString() ?? '--'}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">预期年化收益</p>
              </div>
            </div>
          </div>
        )}

        {/* 图例 */}
        <div className="bg-white rounded-xl shadow p-5 border border-slate-100 flex-1">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">图例说明</h3>
          <ul className="space-y-3 text-xs text-slate-600">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-sm border"
                  style={{ backgroundColor: z.color, borderColor: z.borderColor || z.color }}
                ></span>
                {z.label}
              </li>
            ))}
            <div className="h-px bg-slate-200 my-2"></div>
            {productLines.map((line) => (
              <li key={line.id} className="flex items-center gap-2">
                <span
                  className="w-8 h-0.5 border-t-2 border-dashed"
                  style={{ borderColor: line.color }}
                ></span>{' '}
                {line.name}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className="w-4 h-3 rounded-sm border border-slate-600 bg-slate-100"></span>{' '}
              固定设备 ({fixedMachines}台)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-3 rounded-sm border border-blue-500 border-dashed bg-white"></span>{' '}
              可移动设备 ({movedMachines}台)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-8 h-0.5 border-t-2 border-red-500 border-dashed"></span>{' '}
              设备移动方向
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 border border-amber-500 bg-amber-100/70"></span> 通道区域
            </li>
          </ul>
        </div>
      </div>

      {/* 悬停详情 */}
      {hoveredMachine && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white px-4 py-2 rounded-lg text-sm">
          <strong>{hoveredMachine.label}</strong> - {hoveredMachine.type}
          {hoveredMachine.subLabel && ` (${hoveredMachine.subLabel})`}
        </div>
      )}
    </div>
  )
}

export default DeviceLayoutVisualizer
