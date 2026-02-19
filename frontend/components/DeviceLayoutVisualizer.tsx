/**
 * 设备布局可视化组件（D3.js 增强版）
 * 用于在浑天页面展示车间设备布局优化前后的对比
 * 基于新设计迁移，支持坐标系、区域划分、设备移动动画
 */

import clsx from 'clsx'
import * as d3 from 'd3'
import { Activity, DollarSign, Move } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
  onToggle: (val: boolean) => void
  layoutData?: {
    zones?: typeof TEXTILE_ZONES
    machines?: typeof TEXTILE_MACHINES
    productLines?: typeof TEXTILE_PRODUCT_LINES
    metricsOriginal?: typeof TEXTILE_METRICS_ORIGINAL
    metricsOptimized?: typeof TEXTILE_METRICS_OPTIMIZED
  }
}

const SCALE = 10
const WIDTH = 80 * SCALE
const HEIGHT = 60 * SCALE
const MARGIN = { top: 30, right: 30, bottom: 40, left: 40 }

export const DeviceLayoutVisualizer: React.FC<DeviceLayoutVisualizerProps> = ({
  isOptimized,
  onToggle,
  layoutData,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredMachine, setHoveredMachine] = useState<Machine | null>(null)

  // 使用传入数据或默认数据
  const zones = layoutData?.zones || TEXTILE_ZONES
  const machines = layoutData?.machines || TEXTILE_MACHINES
  const productLines = layoutData?.productLines || TEXTILE_PRODUCT_LINES
  const metrics = isOptimized
    ? layoutData?.metricsOptimized || TEXTILE_METRICS_OPTIMIZED
    : layoutData?.metricsOriginal || TEXTILE_METRICS_ORIGINAL

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    const x = d3.scaleLinear().domain([0, 80]).range([0, WIDTH])
    const y = d3.scaleLinear().domain([0, 60]).range([HEIGHT, 0])

    // 网格
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
      .attr('stroke', '#e2e8f0')
      .attr('stroke-opacity', 0.5)
    g.append('g')
      .attr('class', 'grid-y')
      .call(yGrid)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-opacity', 0.5)

    // 坐标轴
    g.append('g').attr('transform', `translate(0,${HEIGHT})`).call(d3.axisBottom(x))
    g.append('g').call(d3.axisLeft(y))

    // 坐标轴标签
    g.append('text')
      .attr('transform', `translate(${WIDTH / 2}, ${HEIGHT + 35})`)
      .style('text-anchor', 'middle')
      .text('X (米)')
      .style('font-size', '12px')
      .style('fill', '#64748b')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -30)
      .attr('x', 0 - HEIGHT / 2)
      .style('text-anchor', 'middle')
      .text('Y (米)')
      .style('font-size', '12px')
      .style('fill', '#64748b')

    // 区域
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
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.8)

    zoneGroup
      .selectAll('.zone-label')
      .data(zones)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.x + d.width / 2))
      .attr('y', (d) => y(d.y + d.height / 2))
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text((d) => d.label)
      .attr('fill', (d) => d.textColor || '#000')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')

    // 产品线（背景箭头）
    const lineGroup = g.append('g').attr('class', 'product-lines')

    // 定义箭头标记
    svg
      .append('defs')
      .selectAll('marker')
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

    productLines.forEach((line) => {
      // 虚线
      lineGroup
        .append('line')
        .attr('x1', x(line.path[0].x))
        .attr('y1', y(line.path[0].y))
        .attr('x2', x(line.path[1].x))
        .attr('y2', y(line.path[1].y))
        .attr('stroke', line.color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,4')
        .attr('marker-end', `url(#arrow-${line.id})`)
        .attr('opacity', 0.6)

      // 标签框
      const labelX = x(line.path[0].x) + 10
      const labelY = y(line.path[0].y) + 12

      lineGroup
        .append('rect')
        .attr('x', labelX)
        .attr('y', labelY - 10)
        .attr('width', 100)
        .attr('height', 16)
        .attr('fill', 'white')
        .attr('stroke', line.color)
        .attr('rx', 2)

      lineGroup
        .append('text')
        .attr('x', labelX + 5)
        .attr('y', labelY + 2)
        .text(line.name)
        .attr('font-size', '10px')
        .attr('fill', line.color)
        .attr('font-weight', '600')
    })

    // 设备
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

    // 阴影
    nodes
      .append('rect')
      .attr('width', (d) => x(d.width))
      .attr('height', (d) => HEIGHT - y(d.height))
      .attr('x', 2)
      .attr('y', 2)
      .attr('fill', 'rgba(0,0,0,0.1)')
      .attr('rx', 2)

    // 主体框
    nodes
      .append('rect')
      .attr('width', (d) => x(d.width))
      .attr('height', (d) => HEIGHT - y(d.height))
      .attr('fill', 'white')
      .attr('stroke', '#475569')
      .attr('stroke-width', 1.5)
      .attr('rx', 2)

    // 编号标签（顶部）
    nodes
      .append('text')
      .attr('x', (d) => x(d.width) / 2)
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .text((d) => d.label)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')

    // 分隔线
    nodes
      .append('line')
      .attr('x1', 0)
      .attr('y1', 16)
      .attr('x2', (d) => x(d.width))
      .attr('y2', 16)
      .attr('stroke', '#e2e8f0')

    // 类型标签（底部）
    nodes
      .append('text')
      .attr('x', (d) => x(d.width) / 2)
      .attr('y', (d) => HEIGHT - y(d.height) - 6)
      .attr('text-anchor', 'middle')
      .text((d) => d.subLabel || d.type)
      .attr('font-size', '10px')
      .attr('fill', '#64748b')

    // 优化箭头（位移）
    if (isOptimized) {
      const moved = machines.filter(
        (m) => m.original.x !== m.optimized.x || m.original.y !== m.optimized.y
      )

      // 位移箭头标记
      svg
        .append('defs')
        .append('marker')
        .attr('id', 'move-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#ef4444')

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
        .attr('stroke-dasharray', '4,2')
        .attr('marker-end', 'url(#move-arrow)')
        .attr('opacity', 0)
        .transition()
        .duration(800)
        .attr('opacity', 1)

      // 距离文本
      vectorGroup
        .selectAll('.dist-text')
        .data(moved)
        .enter()
        .append('text')
        .attr('x', (d) => (x(d.original.x) + x(d.optimized.x)) / 2)
        .attr('y', (d) => (y(d.original.y) + y(d.optimized.y)) / 2 - 5)
        .text((d) => {
          const dist = Math.sqrt(
            (d.optimized.x - d.original.x) ** 2 + (d.optimized.y - d.original.y) ** 2
          )
          return `${dist.toFixed(1)}m`
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#ef4444')
        .attr('font-weight', 'bold')
        .style('text-shadow', '0 1px 2px white')
        .attr('opacity', 0)
        .transition()
        .delay(400)
        .duration(400)
        .attr('opacity', 1)

      // 原位置虚线框
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
        .attr('stroke', '#ef4444')
        .attr('stroke-dasharray', '2,2')
        .attr('stroke-opacity', 0.5)
        .attr('rx', 2)
    }
  }, [isOptimized, zones, machines, productLines])

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-6">
      <div className="flex-1 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {isOptimized ? '优化后布局 (解 2)' : '原始布局'}
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggle(!isOptimized)}
              className={clsx(
                'relative inline-flex h-7 w-36 items-center justify-center rounded-lg transition-colors focus:outline-none border font-medium text-sm',
                isOptimized
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              )}
            >
              {isOptimized ? '显示原始布局' : '显示优化布局'}
            </button>
          </div>
        </div>

        <div className="relative overflow-x-auto flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg shadow-inner">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH + MARGIN.left + MARGIN.right} ${HEIGHT + MARGIN.top + MARGIN.bottom}`}
            className="w-full h-auto max-h-[600px]"
            preserveAspectRatio="xMidYMid meet"
          />
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-4">
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
              <span className="w-8 h-0.5 border-t-2 border-dashed border-red-500"></span>{' '}
              设备移动方向
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
