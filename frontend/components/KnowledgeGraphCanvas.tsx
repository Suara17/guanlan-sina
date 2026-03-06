import * as d3 from 'd3'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KnowledgeEdge, KnowledgeGraph, KnowledgeNode } from '../types'

type SimNode = KnowledgeNode & d3.SimulationNodeDatum
type SimEdge = KnowledgeEdge &
  d3.SimulationLinkDatum<SimNode> & {
    source: string | SimNode
    target: string | SimNode
  }

interface Props {
  graphData: KnowledgeGraph
  visibleNodeIds?: Set<string>
  onNodeClick: (node: KnowledgeNode) => void
  selectedNodeId?: string
  isCompactView?: boolean
}

interface PositionedNode extends SimNode {
  x: number
  y: number
}

const getNodeId = (value: string | SimNode): string => (typeof value === 'string' ? value : value.id)

const getEdgeLabel = (edge: KnowledgeEdge): string => {
  switch (edge.type) {
    case 'leads_to':
      return '导致'
    case 'caused_by':
      return '源于'
    case 'solved_by':
      return '解决'
    default:
      return edge.label || ''
  }
}

const getSelectedStroke = (type: KnowledgeNode['type']): string => {
  switch (type) {
    case 'phenomenon':
      return '#991b1b'
    case 'cause':
      return '#9a3412'
    case 'solution':
      return '#166534'
  }
}

const truncateLabel = (label: string): string => (label.length > 10 ? `${label.slice(0, 8)}...` : label)

const getIntersection = (node: PositionedNode, angle: number, isTarget: boolean) => {
  const padding = isTarget ? 10 : 8
  let distance = 0

  if (node.type === 'phenomenon') {
    distance = 30 + padding
  } else if (node.type === 'cause') {
    const size = 28
    distance = size / (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle))) + padding
  } else {
    const w = 30
    const h = 15
    const cos = Math.abs(Math.cos(angle))
    const sin = Math.abs(Math.sin(angle))
    const rX = w / (cos || 0.001)
    const rY = h / (sin || 0.001)
    distance = Math.min(rX, rY) + padding
  }

  return {
    x: node.x + Math.cos(angle) * distance,
    y: node.y + Math.sin(angle) * distance,
  }
}

const KnowledgeGraphCanvas: React.FC<Props> = ({
  graphData,
  visibleNodeIds,
  onNodeClick,
  selectedNodeId,
  isCompactView = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [layoutMap, setLayoutMap] = useState<Map<string, { x: number; y: number }>>(new Map())
  const graphSignatureRef = useRef('')

  const activeVisibleNodeIds = useMemo(() => {
    if (visibleNodeIds) return visibleNodeIds
    return new Set(graphData.nodes.map((node) => node.id))
  }, [visibleNodeIds, graphData.nodes])

  useEffect(() => {
    if (!containerRef.current) return

    const updateSize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      })
    }

    const observer = new ResizeObserver(updateSize)
    observer.observe(containerRef.current)
    updateSize()

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (dimensions.width <= 1 || dimensions.height <= 1) return
    if (graphData.nodes.length === 0) return

    const graphSignature = `${graphData.nodes.map((node) => node.id).join('|')}::${graphData.edges
      .map((edge) => edge.id)
      .join('|')}::${dimensions.width}x${dimensions.height}::${isCompactView ? 'compact' : 'normal'}`

    if (graphSignatureRef.current === graphSignature) return
    graphSignatureRef.current = graphSignature

    const width = dimensions.width
    const height = dimensions.height
    const centerX = width / 2
    const centerY = height / 2

    const nodes: SimNode[] = graphData.nodes.map((node) => ({ ...node }))
    const edges: SimEdge[] = graphData.edges.map((edge) => ({
      ...edge,
      source: getNodeId(edge.source as string | SimNode),
      target: getNodeId(edge.target as string | SimNode),
    }))

    const maxRadius = Math.min(width, height) / 2 - 60
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    const anchorMap = new Map<string, { x: number; y: number }>()

    // 计算节点的拓扑层级（从现象节点开始BFS）
    const nodeLayerMap = new Map<string, number>()
    const adjacency = new Map<string, string[]>()
    nodes.forEach((node) => adjacency.set(node.id, []))
    edges.forEach((edge) => {
      const sourceId = getNodeId(edge.source as string | SimNode)
      const targetId = getNodeId(edge.target as string | SimNode)
      adjacency.get(sourceId)?.push(targetId)
      adjacency.get(targetId)?.push(sourceId)
    })

    // 从现象节点开始BFS，确定每个节点的层级
    const queue: { id: string; layer: number }[] = []
    const visited = new Set<string>()

    // 先将所有现象节点放入队列（第0层）
    nodes.forEach((node) => {
      if (node.type === 'phenomenon') {
        queue.push({ id: node.id, layer: 0 })
        visited.add(node.id)
        nodeLayerMap.set(node.id, 0)
      }
    })

    // 如果没有现象节点，从第一个节点开始
    if (queue.length === 0 && nodes.length > 0) {
      queue.push({ id: nodes[0].id, layer: 0 })
      visited.add(nodes[0].id)
      nodeLayerMap.set(nodes[0].id, 0)
    }

    // BFS遍历确定层级
    while (queue.length > 0) {
      const { id, layer } = queue.shift()!
      const neighbors = adjacency.get(id) || []
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          const newLayer = layer + 1
          nodeLayerMap.set(neighborId, newLayer)
          queue.push({ id: neighborId, layer: newLayer })
        }
      }
    }

    // 未访问的节点放到最外层
    const maxLayer = Math.max(...Array.from(nodeLayerMap.values()), 0) + 1
    nodes.forEach((node) => {
      if (!nodeLayerMap.has(node.id)) {
        nodeLayerMap.set(node.id, maxLayer)
      }
    })

    // 按层级分组统计
    const layerGroups = new Map<number, { nodes: SimNode[]; count: number }>()
    nodes.forEach((node) => {
      const layer = nodeLayerMap.get(node.id) || 0
      if (!layerGroups.has(layer)) {
        layerGroups.set(layer, { nodes: [], count: 0 })
      }
      const group = layerGroups.get(layer)!
      group.nodes.push(node)
      group.count++
    })

    // 根据层级分配位置：层级越小越靠近中心
    const sortedLayers = Array.from(layerGroups.keys()).sort((a, b) => a - b)
    let globalIndex = 0

    // 计算每层的节点数量，用于动态调整半径
    const totalNodes = nodes.length
    let cumulativeNodes = 0

    sortedLayers.forEach((layer) => {
      const group = layerGroups.get(layer)!
      const nodesInLayer = group.nodes
      const nodesCountInLayer = nodesInLayer.length

      // 使用累积节点比例来分配半径，中心更密集
      // 前面的层（中心层）占更小的半径比例
      const currentRatio = cumulativeNodes / totalNodes
      const nextRatio = (cumulativeNodes + nodesCountInLayer) / totalNodes

      // 使用平方根压缩中心，让中心区域节点更密集
      // 平方根函数：y = sqrt(x)，x小的时候y增长快，x大的时候y增长慢
      // 这样前50%的节点只占约70%的半径空间
      const innerRadius = Math.sqrt(currentRatio) * maxRadius * 0.85
      const outerRadius = Math.sqrt(nextRatio) * maxRadius * 0.85

      // 该层的平均半径
      const baseRadius = (innerRadius + outerRadius) / 2

      nodesInLayer.forEach((node, indexInLayer) => {
        // 在同一层内均匀分布
        const theta = globalIndex * goldenAngle
        // 同层节点有小的半径变化，避免完全重合
        const radiusVariation = (indexInLayer % 3 - 1) * 6
        // 中心层（layer 0）半径固定较小
        const layerRadius = layer === 0 ? Math.min(baseRadius, 60) : baseRadius
        const radius = Math.max(15, layerRadius + radiusVariation)

        const x = centerX + Math.cos(theta) * radius
        const y = centerY + Math.sin(theta) * radius
        node.x = x
        node.y = y
        anchorMap.set(node.id, { x, y })
        globalIndex++
      })

      cumulativeNodes += nodesCountInLayer
    })

    const simulation = d3
      .forceSimulation<SimNode, SimEdge>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimEdge>(edges)
          .id((node) => node.id)
          .distance(isCompactView ? 55 : 70)
          .strength(0.25)
      )
      .force('charge', d3.forceManyBody().strength(isCompactView ? -35 : -45))
      .force('center', d3.forceCenter(centerX, centerY).strength(0.08))
      .force('collide', d3.forceCollide().radius(isCompactView ? 38 : 45))
      // 中等锚定力，保持层级分布同时允许微调
      .force(
        'anchorX',
        d3
          .forceX<SimNode>((node) => anchorMap.get(node.id)?.x ?? centerX)
          .strength(0.12)
      )
      .force(
        'anchorY',
        d3
          .forceY<SimNode>((node) => anchorMap.get(node.id)?.y ?? centerY)
          .strength(0.12)
      )
      .stop()

    for (let i = 0; i < 180; i += 1) {
      simulation.tick()
    }

    nodes.forEach((node) => {
      const currentX = node.x ?? centerX
      const currentY = node.y ?? centerY
      const dx = currentX - centerX
      const dy = currentY - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > maxRadius) {
        const angle = Math.atan2(dy, dx)
        node.x = centerX + Math.cos(angle) * maxRadius
        node.y = centerY + Math.sin(angle) * maxRadius
      }
    })

    const nextMap = new Map<string, { x: number; y: number }>()
    nodes.forEach((node) => {
      nextMap.set(node.id, {
        x: node.x ?? centerX,
        y: node.y ?? centerY,
      })
    })
    setLayoutMap(nextMap)
  }, [graphData, dimensions, isCompactView])

  const visibleNodes = useMemo<PositionedNode[]>(() => {
    const centerX = dimensions.width / 2 || 0
    const centerY = dimensions.height / 2 || 0
    return graphData.nodes
      .filter((node) => activeVisibleNodeIds.has(node.id))
      .map((node) => {
        const pos = layoutMap.get(node.id)
        return {
          ...node,
          x: pos?.x ?? centerX,
          y: pos?.y ?? centerY,
        }
      })
  }, [graphData.nodes, activeVisibleNodeIds, layoutMap, dimensions])

  const visibleEdges = useMemo<SimEdge[]>(() => {
    return graphData.edges
      .filter((edge) => {
        const sourceId = getNodeId(edge.source as string | SimNode)
        const targetId = getNodeId(edge.target as string | SimNode)
        return activeVisibleNodeIds.has(sourceId) && activeVisibleNodeIds.has(targetId)
      })
      .map((edge) => ({
        ...edge,
        source: getNodeId(edge.source as string | SimNode),
        target: getNodeId(edge.target as string | SimNode),
      }))
  }, [graphData.edges, activeVisibleNodeIds])

  useEffect(() => {
    if (!svgRef.current) return
    if (!visibleNodes.length) return

    const svg = d3.select(svgRef.current)
    const defs = svg.select('defs')
    if (defs.empty()) {
      const newDefs = svg.append('defs')

      const phenom = newDefs.append('radialGradient').attr('id', 'grad-phenom').attr('r', '50%')
      phenom.append('stop').attr('offset', '0%').attr('stop-color', '#f87171')
      phenom.append('stop').attr('offset', '100%').attr('stop-color', '#dc2626')

      const cause = newDefs
        .append('linearGradient')
        .attr('id', 'grad-cause')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%')
      cause.append('stop').attr('offset', '0%').attr('stop-color', '#fb923c')
      cause.append('stop').attr('offset', '100%').attr('stop-color', '#ea580c')

      const solution = newDefs
        .append('linearGradient')
        .attr('id', 'grad-solution')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%')
      solution.append('stop').attr('offset', '0%').attr('stop-color', '#34d399')
      solution.append('stop').attr('offset', '100%').attr('stop-color', '#0f766e')

      newDefs
        .append('marker')
        .attr('id', 'kg-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 11)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#94a3b8')
    }

    // 创建分层结构：边层在下面，节点层在上面
    let rootSelection = svg.select<SVGGElement>('g.graph-root')
    if (rootSelection.empty()) {
      const root = svg.append('g').attr('class', 'graph-root')
      // 先创建边层（底层）
      root.append('g').attr('class', 'links-layer')
      // 再创建节点层（顶层）
      root.append('g').attr('class', 'nodes-layer')
      rootSelection = root
    }

    const linksLayer = rootSelection.select<SVGGElement>('g.links-layer')
    const nodesLayer = rootSelection.select<SVGGElement>('g.nodes-layer')

    const nodeMap = new Map(visibleNodes.map((node) => [node.id, node]))

    // 边的渲染 - 在 links-layer 中
    const linkJoin = linksLayer.selectAll<SVGGElement, SimEdge>('g.link').data(visibleEdges, (edge: any) => edge.id)
    const linkEnter = linkJoin.enter().append('g').attr('class', 'link').attr('opacity', 0)

    linkEnter
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.62)
      .attr('stroke-width', 1.6)
      .attr('marker-end', 'url(#kg-arrow)')

    linkEnter
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -6)
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .text((edge) => getEdgeLabel(edge))

    linkEnter.transition().duration(360).attr('opacity', 1)
    linkJoin.exit().transition().duration(220).attr('opacity', 0).remove()
    const linkMerged = linkEnter.merge(linkJoin as any)

    linkMerged
      .select('line')
      .attr('x1', (edge) => {
        const source = nodeMap.get(getNodeId(edge.source)) as PositionedNode
        const target = nodeMap.get(getNodeId(edge.target)) as PositionedNode
        const angle = Math.atan2(target.y - source.y, target.x - source.x)
        return getIntersection(source, angle, false).x
      })
      .attr('y1', (edge) => {
        const source = nodeMap.get(getNodeId(edge.source)) as PositionedNode
        const target = nodeMap.get(getNodeId(edge.target)) as PositionedNode
        const angle = Math.atan2(target.y - source.y, target.x - source.x)
        return getIntersection(source, angle, false).y
      })
      .attr('x2', (edge) => {
        const source = nodeMap.get(getNodeId(edge.source)) as PositionedNode
        const target = nodeMap.get(getNodeId(edge.target)) as PositionedNode
        const angle = Math.atan2(source.y - target.y, source.x - target.x)
        return getIntersection(target, angle, true).x
      })
      .attr('y2', (edge) => {
        const source = nodeMap.get(getNodeId(edge.source)) as PositionedNode
        const target = nodeMap.get(getNodeId(edge.target)) as PositionedNode
        const angle = Math.atan2(source.y - target.y, source.x - target.x)
        return getIntersection(target, angle, true).y
      })

    linkMerged
      .select('text')
      .text((edge) => getEdgeLabel(edge))
      .attr('x', (edge) => {
        const source = nodeMap.get(getNodeId(edge.source)) as PositionedNode
        const target = nodeMap.get(getNodeId(edge.target)) as PositionedNode
        return (source.x + target.x) / 2
      })
      .attr('y', (edge) => {
        const source = nodeMap.get(getNodeId(edge.source)) as PositionedNode
        const target = nodeMap.get(getNodeId(edge.target)) as PositionedNode
        return (source.y + target.y) / 2
      })

    // 节点的渲染 - 在 nodes-layer 中
    const nodeJoin = nodesLayer
      .selectAll<SVGGElement, PositionedNode>('g.node')
      .data(visibleNodes, (node: any) => node.id)
    const nodeEnter = nodeJoin.enter().append('g').attr('class', 'node').attr('cursor', 'pointer').attr('opacity', 0)

    nodeEnter.each(function (node) {
      const group = d3.select(this)

      if (node.type === 'phenomenon') {
        group.append('circle').attr('class', 'node-shape').attr('r', 30).attr('fill', 'url(#grad-phenom)')
      } else if (node.type === 'cause') {
        group
          .append('rect')
          .attr('class', 'node-shape')
          .attr('width', 40)
          .attr('height', 40)
          .attr('x', -20)
          .attr('y', -20)
          .attr('rx', 5)
          .attr('transform', 'rotate(45)')
          .attr('fill', 'url(#grad-cause)')
      } else {
        group
          .append('rect')
          .attr('class', 'node-shape')
          .attr('width', 60)
          .attr('height', 30)
          .attr('x', -30)
          .attr('y', -15)
          .attr('rx', 15)
          .attr('fill', 'url(#grad-solution)')
      }

      group
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .text(truncateLabel(node.label))

      group.append('title').text(node.description || node.label)
    })

    nodeEnter
      .attr('transform', (node) => `translate(${node.x},${node.y}) scale(0.92)`)
      .transition()
      .duration(420)
      .attr('opacity', 1)
      .attr('transform', (node) => `translate(${node.x},${node.y}) scale(1)`)

    nodeJoin.exit().transition().duration(220).attr('opacity', 0).remove()
    const nodeMerged = nodeEnter.merge(nodeJoin as any)

    nodeMerged
      .on('click', (_, node) => onNodeClick(node))
      .attr('transform', (node) => `translate(${node.x},${node.y})`)

    nodeMerged.each(function (node) {
      d3.select(this)
        .select<SVGElement>('.node-shape')
        .attr('stroke', selectedNodeId === node.id ? getSelectedStroke(node.type) : 'none')
        .attr('stroke-width', selectedNodeId === node.id ? 3 : 0)
      d3.select(this).select('text').text(truncateLabel(node.label))
    })
  }, [visibleNodes, visibleEdges, onNodeClick, selectedNodeId])

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-200"
    >
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  )
}

export default KnowledgeGraphCanvas
