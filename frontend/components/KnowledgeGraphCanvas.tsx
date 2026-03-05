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

    nodes.forEach((node, index) => {
      const ratio = Math.sqrt((index + 0.5) / nodes.length)
      const radius = ratio * maxRadius
      const theta = index * goldenAngle
      const x = centerX + Math.cos(theta) * radius
      const y = centerY + Math.sin(theta) * radius
      node.x = x
      node.y = y
      anchorMap.set(node.id, { x, y })
    })

    const simulation = d3
      .forceSimulation<SimNode, SimEdge>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimEdge>(edges)
          .id((node) => node.id)
          .distance(isCompactView ? 88 : 108)
          .strength(0.12)
      )
      .force('charge', d3.forceManyBody().strength(isCompactView ? -40 : -55))
      .force('center', d3.forceCenter(centerX, centerY).strength(0.06))
      .force('collide', d3.forceCollide().radius(isCompactView ? 48 : 58))
      // 锚定到均匀圆盘位置，避免节点向边缘扎堆
      .force(
        'anchorX',
        d3
          .forceX<SimNode>((node) => anchorMap.get(node.id)?.x ?? centerX)
          .strength(0.16)
      )
      .force(
        'anchorY',
        d3
          .forceY<SimNode>((node) => anchorMap.get(node.id)?.y ?? centerY)
          .strength(0.16)
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

    const rootSelection = svg.select<SVGGElement>('g.graph-root')
    const root = rootSelection.empty() ? svg.append('g').attr('class', 'graph-root') : rootSelection

    const nodeMap = new Map(visibleNodes.map((node) => [node.id, node]))

    const linkJoin = root.selectAll<SVGGElement, SimEdge>('g.link').data(visibleEdges, (edge: any) => edge.id)
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

    const nodeJoin = root
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
