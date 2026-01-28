import * as d3 from 'd3'
import type React from 'react'
import { useEffect, useRef } from 'react'
import type { KnowledgeEdge, KnowledgeGraph, KnowledgeNode } from '../types'

interface Props {
  graphData: KnowledgeGraph
  onNodeClick: (node: KnowledgeNode) => void
  selectedNodeId?: string
}

const KnowledgeGraphCanvas: React.FC<Props> = ({ graphData, onNodeClick, selectedNodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) return

    const svg = d3.select(svgRef.current)
    const width = 800
    const height = 600

    // 清空之前的渲染
    svg.selectAll('*').remove()

    // 创建力导向图模拟
    const simulation = d3
      .forceSimulation(graphData.nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(graphData.edges)
          .id((d: any) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1))

    // 创建箭头标记
    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#64748b')

    // 创建边
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.edges)
      .enter()
      .append('line')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)')

    // 创建边标签
    const linkLabels = svg
      .append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(graphData.edges)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .text((d: KnowledgeEdge) => {
        switch (d.type) {
          case 'leads_to':
            return '导致'
          case 'caused_by':
            return '源于'
          case 'solved_by':
            return '解决'
          default:
            return d.label || ''
        }
      })

    // 创建节点组
    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => onNodeClick(d))

    // 根据节点类型创建不同形状
    node.each(function (d) {
      const nodeGroup = d3.select(this)

      if (d.type === 'phenomenon') {
        // 现象节点：红色圆形
        nodeGroup
          .append('circle')
          .attr('r', 25)
          .attr('fill', selectedNodeId === d.id ? '#dc2626' : '#ef4444')
          .attr('stroke', '#dc2626')
          .attr('stroke-width', selectedNodeId === d.id ? 3 : 2)
      } else if (d.type === 'cause') {
        // 原因节点：橙色菱形
        nodeGroup
          .append('polygon')
          .attr('points', '0,-25 25,0 0,25 -25,0')
          .attr('fill', selectedNodeId === d.id ? '#ea580c' : '#f97316')
          .attr('stroke', '#ea580c')
          .attr('stroke-width', selectedNodeId === d.id ? 3 : 2)
      } else if (d.type === 'solution') {
        // 解决方案节点：绿色矩形
        nodeGroup
          .append('rect')
          .attr('x', -30)
          .attr('y', -15)
          .attr('width', 60)
          .attr('height', 30)
          .attr('rx', 5)
          .attr('fill', selectedNodeId === d.id ? '#16a34a' : '#22c55e')
          .attr('stroke', '#16a34a')
          .attr('stroke-width', selectedNodeId === d.id ? 3 : 2)
      }
    })

    // 添加节点标签
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '11px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text((d: KnowledgeNode) => d.label)

    // 鼠标悬停效果
    node
      .on('mouseover', function (event, d) {
        d3.select(this)
          .select('circle, polygon, rect')
          .transition()
          .duration(200)
          .attr('stroke-width', 4)
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .select('circle, polygon, rect')
          .transition()
          .duration(200)
          .attr('stroke-width', selectedNodeId === d.id ? 3 : 2)
      })

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // 拖拽功能
    const drag = d3
      .drag()
      .on('start', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d: any) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    node.call(drag as any)

    return () => {
      simulation.stop()
    }
  }, [graphData, onNodeClick, selectedNodeId])

  return (
    <div className="w-full h-full bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      />
    </div>
  )
}

export default KnowledgeGraphCanvas
