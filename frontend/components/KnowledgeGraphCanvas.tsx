import * as d3 from 'd3'
import type React from 'react'
import { useEffect, useRef } from 'react'
import type { KnowledgeEdge, KnowledgeGraph, KnowledgeNode } from '../types'

interface Props {
  graphData: KnowledgeGraph
  onNodeClick: (node: KnowledgeNode) => void
  selectedNodeId?: string
  isCompactView?: boolean
}

const KnowledgeGraphCanvas: React.FC<Props> = ({ graphData, onNodeClick, selectedNodeId, isCompactView = false }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) return

    const svg = d3.select(svgRef.current)
    const width = 800
    const height = 600

    // 紧凑模式下调整圆盘中心位置，向左偏移
    const centerX = isCompactView ? width / 2 - 100 : width / 2 - 60
    const centerY = height / 2

    // 清空之前的渲染
    svg.selectAll('*').remove()

    // 定义渐变
    const defs = svg.append('defs')

    // 现象节点渐变 (红色)
    const gradPhenom = defs.append('linearGradient').attr('id', 'grad-phenom').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%')
    gradPhenom.append('stop').attr('offset', '0%').attr('stop-color', '#f87171')
    gradPhenom.append('stop').attr('offset', '100%').attr('stop-color', '#dc2626')

    // 原因节点渐变 (橙色)
    const gradCause = defs.append('linearGradient').attr('id', 'grad-cause').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%')
    gradCause.append('stop').attr('offset', '0%').attr('stop-color', '#fb923c')
    gradCause.append('stop').attr('offset', '100%').attr('stop-color', '#ea580c')

    // 方案节点渐变 (蓝绿)
    const gradSolution = defs.append('linearGradient').attr('id', 'grad-solution').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%')
    gradSolution.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6')
    gradSolution.append('stop').attr('offset', '100%').attr('stop-color', '#22c55e')

    // 箭头标记
    // 紧凑模式下使用更小的箭头
    const arrowSize = isCompactView ? 0.5 : 1
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', isCompactView ? 20 : 30) // 紧凑模式调整箭头位置
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8 * arrowSize)
      .attr('markerHeight', 8 * arrowSize)
      .append('path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#64748b')

    // 创建力导向图模拟
    // 紧凑模式下调整参数以适应更多节点
    const linkDistance = isCompactView ? 80 : 180
    const chargeStrength = isCompactView ? -400 : -1000
    const collideRadius = isCompactView ? 35 : 60

    const simulation = d3
      .forceSimulation(graphData.nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(graphData.edges)
          .id((d: any) => d.id)
          .distance(linkDistance) // 紧凑模式距离更短
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength)) // 紧凑模式排斥力更小
      .force('center', d3.forceCenter(centerX, centerY))
      .force('collide', d3.forceCollide().radius(collideRadius)) // 紧凑模式防止重叠半径更小

    // 紧凑模式下添加径向约束力，形成圆形布局
    if (isCompactView) {
      const maxRadius = Math.min(width, height) / 2 - 50 // 最大半径，留边距

      simulation.force('radial', d3.forceRadial((d: any, i: number) => {
        // 根据节点索引计算目标半径，形成同心圆效果
        const nodeCount = graphData.nodes.length
        const layer = Math.floor(i / (nodeCount / 5)) // 分成5层
        return (layer + 1) * (maxRadius / 5)
      }, centerX, centerY).strength(0.5))
    }

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

    // 创建边
    const strokeWidth = isCompactView ? 1 : 2
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.edges)
      .enter()
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', strokeWidth)
      .attr('marker-end', 'url(#arrowhead)')

    // 创建边标签背景 (为了清晰度)
    const linkLabelBgs = svg
      .append('g')
      .selectAll('rect')
      .data(graphData.edges)
      .enter()
      .append('rect')
      .attr('fill', 'white')
      .attr('rx', 4)
      
    // 创建边标签
    const edgeFontSize = isCompactView ? '8px' : '11px'
    const linkLabels = svg
      .append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(graphData.edges)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', edgeFontSize)
      .attr('fill', '#64748b')
      .attr('dy', 4)
      .text((d: KnowledgeEdge) => {
        switch (d.type) {
          case 'leads_to': return '导致'
          case 'caused_by': return '源于'
          case 'solved_by': return '解决'
          default: return d.label || ''
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
      .call(drag as any)

    // 渲染节点形状
    // 紧凑模式下缩小节点尺寸
    const nodeScale = isCompactView ? 0.6 : 1

    node.each(function (d: KnowledgeNode) {
      const nodeGroup = d3.select(this)

      if (d.type === 'phenomenon') {
        // 现象：圆形
        nodeGroup
          .append('circle')
          .attr('r', 40 * nodeScale)
          .attr('fill', 'url(#grad-phenom)')
          .attr('stroke', selectedNodeId === d.id ? '#991b1b' : 'none')
          .attr('stroke-width', selectedNodeId === d.id ? 3 : 0)

      } else if (d.type === 'cause') {
        // 原因：圆角菱形 (旋转的圆角矩形)
        nodeGroup
          .append('rect')
          .attr('width', 60 * nodeScale)
          .attr('height', 60 * nodeScale)
          .attr('x', -30 * nodeScale)
          .attr('y', -30 * nodeScale)
          .attr('rx', 4)
          .attr('transform', 'rotate(45)')
          .attr('fill', 'url(#grad-cause)')
          .attr('stroke', selectedNodeId === d.id ? '#c2410c' : 'none')
          .attr('stroke-width', selectedNodeId === d.id ? 3 : 0)

      } else if (d.type === 'solution') {
        // 方案：大圆角矩形
        nodeGroup
          .append('rect')
          .attr('x', -60 * nodeScale)
          .attr('y', -24 * nodeScale)
          .attr('width', 120 * nodeScale)
          .attr('height', 48 * nodeScale)
          .attr('rx', 24 * nodeScale) // 胶囊形状
          .attr('fill', 'url(#grad-solution)')
          .attr('stroke', selectedNodeId === d.id ? '#15803d' : 'none')
          .attr('stroke-width', selectedNodeId === d.id ? 3 : 0)
      }
    })

    // 添加节点文本
    // 紧凑模式下使用更小的字体
    const fontSize = isCompactView ? '9px' : '13px'
    const maxLabelLength = isCompactView ? 4 : 6

    node.each(function(d: KnowledgeNode) {
      const nodeGroup = d3.select(this)

      // 所有节点文本都居中
      nodeGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', d.type === 'cause' ? '5px' : '5px') // 微调位置
        .attr('font-size', fontSize)
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .text(d.label)
        .call((text) => {
          // 简单的换行处理
          text.each(function(d: KnowledgeNode) {
              if (d.label.length > maxLabelLength) {
                  const el = d3.select(this)
                  const mid = Math.floor(d.label.length / 2)
                  const first = d.label.substring(0, mid)
                  const second = d.label.substring(mid)
                  el.text('')
                  el.append('tspan').attr('x', 0).attr('dy', '-0.2em').text(first)
                  el.append('tspan').attr('x', 0).attr('dy', '1.2em').text(second)
              }
          })
        })
    })

    // 鼠标交互动画
    node
      .on('mouseover', function (event, d: KnowledgeNode) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', (d: KnowledgeNode) => `translate(${d.x},${d.y}) scale(1.1)`)
      })
      .on('mouseout', function (event, d: KnowledgeNode) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', (d: KnowledgeNode) => `translate(${d.x},${d.y}) scale(1)`)
      })

    // 更新位置
    simulation.on('tick', () => {
      // 限制节点在画布范围内
      if (isCompactView) {
        // 紧凑模式：限制在圆形区域内
        const maxRadius = Math.min(width, height) / 2 - 50

        graphData.nodes.forEach((d: any) => {
          const dx = d.x - centerX
          const dy = d.y - centerY
          const distance = Math.sqrt(dx * dx + dy * dy)

          // 如果节点超出圆形边界，将其拉回
          if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx)
            d.x = centerX + Math.cos(angle) * maxRadius
            d.y = centerY + Math.sin(angle) * maxRadius
          }
        })
      } else {
        // 正常模式：矩形边界
        graphData.nodes.forEach((d: any) => {
          d.x = Math.max(40, Math.min(width - 40, d.x))
          d.y = Math.max(40, Math.min(height - 40, d.y))
        })
      }

      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
      
      // 更新连线标签背景位置
      const labelBgSize = isCompactView ? { width: 24, height: 16 } : { width: 30, height: 20 }
      linkLabelBgs
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2 - labelBgSize.width / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - labelBgSize.height / 2)
        .attr('width', labelBgSize.width)
        .attr('height', labelBgSize.height)

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [graphData, onNodeClick, selectedNodeId, isCompactView])

  return (
    <svg 
      ref={svgRef} 
      className="w-full h-full"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid meet"
    />
  )
}

export default KnowledgeGraphCanvas