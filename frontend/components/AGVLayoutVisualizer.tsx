/**
 * AGV 路径可视化组件（D3.js 增强版）
 * 用于在浑天页面展示 AGV 调度路径优化的过程和结果
 * 基于新设计迁移，支持坐标系、区域划分、AGV 动画
 */

import clsx from 'clsx'
import * as d3 from 'd3'
import { BarChart3, Clock, Truck, Zap } from 'lucide-react'
import { useEffect, useRef } from 'react'
import {
  AUTO_METRICS_OPTIMIZED,
  AUTO_METRICS_ORIGINAL,
  AUTO_NODES,
  AUTO_ROUTES,
  AUTO_ZONES,
} from '../constants'

interface AGVLayoutVisualizerProps {
  isOptimized: boolean
  onToggle: (val: boolean) => void
  agvData?: {
    zones?: typeof AUTO_ZONES
    routes?: typeof AUTO_ROUTES
    nodes?: typeof AUTO_NODES
    metricsOriginal?: typeof AUTO_METRICS_ORIGINAL
    metricsOptimized?: typeof AUTO_METRICS_OPTIMIZED
  }
}

const SCALE = 10
const WIDTH = 80 * SCALE
const HEIGHT = 80 * SCALE
const MARGIN = { top: 30, right: 30, bottom: 40, left: 40 }

export const AGVLayoutVisualizer: React.FC<AGVLayoutVisualizerProps> = ({
  isOptimized,
  onToggle,
  agvData,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  // 使用传入数据或默认数据
  const zones = agvData?.zones || AUTO_ZONES
  const routes = agvData?.routes || AUTO_ROUTES
  const nodes = agvData?.nodes || AUTO_NODES
  const metrics = isOptimized
    ? agvData?.metricsOptimized || AUTO_METRICS_OPTIMIZED
    : agvData?.metricsOriginal || AUTO_METRICS_ORIGINAL

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // 坐标比例尺
    const x = d3.scaleLinear().domain([0, 80]).range([0, WIDTH])
    const y = d3.scaleLinear().domain([0, 80]).range([HEIGHT, 0])

    // 网格
    const xGrid = d3
      .axisBottom(x)
      .tickSize(-HEIGHT)
      .tickFormat(() => '')
      .ticks(10)
    const yGrid = d3
      .axisLeft(y)
      .tickSize(-WIDTH)
      .tickFormat(() => '')
      .ticks(10)
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${HEIGHT})`)
      .call(xGrid)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-opacity', 0.5)
    g.append('g')
      .attr('class', 'grid')
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
    const zoneElements = g.selectAll('.zone').data(zones).enter().append('g')

    zoneElements
      .append('rect')
      .attr('x', (d) => x(d.x))
      .attr('y', (d) => y(d.y + d.height))
      .attr('width', (d) => x(d.width))
      .attr('height', (d) => HEIGHT - y(d.height))
      .attr('fill', (d) => d.color)
      .attr('stroke', (d) => d.borderColor || d.color)
      .attr('stroke-width', 2)
      .attr('opacity', 0.8)
      .attr('rx', 0)

    zoneElements
      .append('text')
      .attr('x', (d) => x(d.x + d.width / 2))
      .attr('y', (d) => y(d.y + d.height / 2))
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .style('text-shadow', '0px 1px 2px rgba(0,0,0,0.3)')
      .text((d) => d.label)

    // 路径
    const defs = svg.append('defs')
    routes.forEach((route) => {
      defs
        .append('marker')
        .attr('id', `arrow-${route.id}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 5)
        .attr('refY', 0)
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', route.color)
    })

    const lineGenerator = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveLinear)

    const routeGroup = g.append('g').attr('class', 'routes')

    routes.forEach((route, i) => {
      const pathData = isOptimized ? route.pathOptimized : route.pathOriginal

      // 渲染路径线
      const path = routeGroup
        .append('path')
        .datum(pathData)
        .attr('fill', 'none')
        .attr('stroke', route.color)
        .attr('stroke-width', 3)
        .attr('d', lineGenerator)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.8)

      // 路径中点箭头
      for (let j = 0; j < pathData.length - 1; j++) {
        const p1 = pathData[j]
        const p2 = pathData[j + 1]
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2
        const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI

        routeGroup
          .append('path')
          .attr('d', 'M-3,-3 L3,0 L-3,3 Z')
          .attr('fill', 'white')
          .attr('stroke', route.color)
          .attr('stroke-width', 1)
          .attr('transform', `translate(${x(midX)}, ${y(midY)}) rotate(${-angle})`)
      }

      // AGV 动画
      if (path.node()) {
        const pathNode = path.node() as SVGPathElement
        const length = pathNode.getTotalLength()

        const agvGroup = g.append('g')

        // AGV 主体
        agvGroup
          .append('rect')
          .attr('x', -6)
          .attr('y', -6)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', route.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .attr('rx', 2)

        // AGV 标签
        const agvLabel = g
          .append('text')
          .text(`AGV${i + 1}`)
          .attr('font-size', '10px')
          .attr('fill', '#1e293b')
          .attr('font-weight', 'bold')
          .attr('text-anchor', 'middle')

        const animate = () => {
          agvGroup
            .transition()
            .duration(isOptimized ? 5000 : 8000)
            .ease(d3.easeLinear)
            .attrTween('transform', () => {
              return (t) => {
                const point = pathNode.getPointAtLength(t * length)
                agvLabel.attr('x', point.x).attr('y', point.y - 10)
                return `translate(${point.x},${point.y})`
              }
            })
            .on('end', animate)
        }
        animate()
      }
    })

    // 工位节点
    const nodeGroup = g.append('g').attr('class', 'nodes')
    const nodeElements = nodeGroup
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${x(d.x)},${y(d.y)})`)

    // 工位框
    nodeElements
      .append('rect')
      .attr('x', -20)
      .attr('y', -12)
      .attr('width', 40)
      .attr('height', 24)
      .attr('fill', '#334155')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('rx', 4)

    // 状态灯
    nodeElements
      .append('circle')
      .attr('cx', 14)
      .attr('cy', -8)
      .attr('r', 3)
      .attr('fill', (d) => (d.id.startsWith('agv') ? '#f59e0b' : '#22c55e'))

    nodeElements
      .append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .text((d) => d.label.split(' ')[0])
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')

    nodeElements
      .append('text')
      .attr('dy', 26)
      .attr('text-anchor', 'middle')
      .text((d) => d.label.split(' ')[1] || '')
      .attr('font-size', '9px')
      .attr('fill', '#475569')
      .attr('font-weight', '600')
  }, [isOptimized, zones, routes, nodes])

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-6">
      <div className="flex-1 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {isOptimized ? 'AGV 路径优化图 (解 2)' : '原始路径布局'}
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggle(!isOptimized)}
              className={clsx(
                'relative inline-flex h-7 w-36 items-center justify-center rounded-lg transition-colors focus:outline-none border font-medium text-sm',
                isOptimized
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              )}
            >
              {isOptimized ? '显示原始路径' : '显示优化路径'}
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
            <BarChart3 size={20} className="text-indigo-600" />
            物流指标
          </h3>

          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-700 text-sm mb-1">
                <Clock size={16} />
                <span>最大完工时间</span>
              </div>
              <div className="text-2xl font-bold text-indigo-900">
                {metrics.maxTime}h{' '}
                {isOptimized && <span className="text-xs font-normal text-indigo-500">(-26%)</span>}
              </div>
            </div>

            <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
              <div className="flex items-center gap-2 text-teal-700 text-sm mb-1">
                <Zap size={16} />
                <span>瓶颈利用率</span>
              </div>
              <div className="text-xl font-bold text-teal-900">{metrics.bottleneckRate}%</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">负载均衡度</div>
                <div className="text-xl font-bold text-slate-800">{metrics.loadBalance}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">总运输距离</div>
                <div className="text-xl font-bold text-slate-800">{metrics.totalDistance}m</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                <Truck size={12} /> AGV 使用率
              </div>
              <div className="text-lg font-bold text-slate-800">{metrics.agvUsage} 运行中</div>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className="bg-white rounded-xl shadow p-5 border border-slate-100 flex-1">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">图例说明</h3>
          <ul className="space-y-2 text-xs text-slate-600">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm border"
                  style={{ backgroundColor: z.color, borderColor: z.borderColor || z.color }}
                ></span>
                {z.label}
              </li>
            ))}
            <div className="h-px bg-slate-200 my-2"></div>
            {routes.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <span className="w-6 h-1 rounded" style={{ backgroundColor: r.color }}></span>{' '}
                {r.name}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span> 正常运行设备
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> 任务节点
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AGVLayoutVisualizer
