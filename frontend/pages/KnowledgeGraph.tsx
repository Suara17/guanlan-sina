import { AlertTriangle, RefreshCw, Settings, X } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KnowledgeGraphCanvas from '../components/KnowledgeGraphCanvas'
import NodeDetailPanel from '../components/NodeDetailPanel'
import { getAllKnowledgeGraphsMerged } from '../mockData'
import { KnowledgeGraphAdapter } from '../services/dataAdapter'
import type { KnowledgeGraph, KnowledgeNode } from '../types'

const MAX_NODES = 150

const getEdgeNodeId = (node: string | { id: string }) => (typeof node === 'string' ? node : node.id)

const limitGraphNodes = (graph: KnowledgeGraph, maxNodes: number): KnowledgeGraph => {
  if (graph.nodes.length <= maxNodes) return graph

  const nodeOrder = graph.nodes.map((node) => node.id)
  const adjacency = new Map<string, string[]>()
  nodeOrder.forEach((nodeId) => adjacency.set(nodeId, []))

  graph.edges.forEach((edge) => {
    const sourceId = getEdgeNodeId(edge.source)
    const targetId = getEdgeNodeId(edge.target)
    adjacency.set(sourceId, [...(adjacency.get(sourceId) || []), targetId])
    adjacency.set(targetId, [...(adjacency.get(targetId) || []), sourceId])
  })

  const selected = new Set<string>()
  const queue: string[] = []
  const seeds = graph.nodes.filter((node) => node.type === 'phenomenon')
  const initialSeeds = (seeds.length > 0 ? seeds : graph.nodes.slice(0, 1))
    .map((node) => node.id)
    .slice(0, maxNodes)

  initialSeeds.forEach((nodeId) => {
    selected.add(nodeId)
    queue.push(nodeId)
  })

  while (queue.length > 0 && selected.size < maxNodes) {
    const currentId = queue.shift()
    if (!currentId) continue
    const neighbors = adjacency.get(currentId) || []
    for (const neighborId of neighbors) {
      if (selected.size >= maxNodes) break
      if (selected.has(neighborId)) continue
      selected.add(neighborId)
      queue.push(neighborId)
    }
  }

  if (selected.size < maxNodes) {
    for (const nodeId of nodeOrder) {
      if (selected.size >= maxNodes) break
      if (!selected.has(nodeId)) selected.add(nodeId)
    }
  }

  const nodes = graph.nodes.filter((node) => selected.has(node.id))
  const edges = graph.edges.filter((edge) => {
    const sourceId = getEdgeNodeId(edge.source)
    const targetId = getEdgeNodeId(edge.target)
    return selected.has(sourceId) && selected.has(targetId)
  })

  return {
    ...graph,
    nodes,
    edges,
  }
}

const KnowledgeGraphPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [graphData, setGraphData] = useState<KnowledgeGraph | null>(null)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDefaultView, setIsDefaultView] = useState(false)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [isCompactView, setIsCompactView] = useState(false)
  const [dataSource, setDataSource] = useState<'neo4j' | 'mock'>('mock')
  const [error, setError] = useState<string | null>(null)
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set())
  const [isGrowthFinished, setIsGrowthFinished] = useState(false)
  const visibleNodeIdsRef = useRef<Set<string>>(new Set())

  const convertAnomaliesToGraph = (anomalies: any[]): KnowledgeGraph => {
    const nodes: KnowledgeNode[] = []
    const edges: Array<{
      id: string
      source: string
      target: string
      type: 'leads_to' | 'caused_by' | 'solved_by'
      label?: string
    }> = []

    const addNode = (node: KnowledgeNode) => {
      if (nodes.length < MAX_NODES) {
        nodes.push(node)
        return true
      }
      return false
    }

    anomalies.forEach((anomaly) => {
      if (nodes.length >= MAX_NODES) return

      const phenomenonId = `phenomenon-${anomaly.sequence}`
      if (
        !addNode({
          id: phenomenonId,
          type: 'phenomenon',
          label: `${anomaly.line_type}-异常${anomaly.sequence}`,
          description: anomaly.phenomenon,
        })
      ) {
        return
      }

      const causeNodeIds: string[] = []
      if (anomaly.causes && Array.isArray(anomaly.causes)) {
        anomaly.causes.forEach((cause: any, cIndex: number) => {
          if (nodes.length >= MAX_NODES) return
          const causeId = `cause-${anomaly.sequence}-${cIndex}`
          if (
            !addNode({
              id: causeId,
              type: 'cause',
              label: cause.type || '原因',
              description: cause.description || '未知原因',
            })
          ) {
            return
          }

          causeNodeIds.push(causeId)
          edges.push({
            id: `edge-phenomenon-${anomaly.sequence}-cause-${cIndex}`,
            source: phenomenonId,
            target: causeId,
            type: 'caused_by',
            label: '导致',
          })
        })
      }

      if (anomaly.solutions && Array.isArray(anomaly.solutions)) {
        anomaly.solutions.forEach((solution: any, sIndex: number) => {
          if (nodes.length >= MAX_NODES) return
          const solutionId = `solution-${anomaly.sequence}-${sIndex}`
          if (
            !addNode({
              id: solutionId,
              type: 'solution',
              label: solution.type || '解决方案',
              description: solution.method || '未知解决方案',
            })
          ) {
            return
          }

          if (causeNodeIds.length > 0) {
            const targetCause = causeNodeIds[sIndex % causeNodeIds.length]
            edges.push({
              id: `edge-${targetCause}-${solutionId}`,
              source: targetCause,
              target: solutionId,
              type: 'solved_by',
              label: '解决',
            })
          }
        })
      }
    })

    return {
      nodes,
      edges,
      anomalyId: 'all',
    }
  }

  const nodeClusterMap = useMemo(() => {
    const map = new Map<string, string>()
    if (!graphData) return map

    const adjacency = new Map<string, string[]>()
    graphData.nodes.forEach((node) => adjacency.set(node.id, []))
    graphData.edges.forEach((edge) => {
      const sourceId = getEdgeNodeId(edge.source)
      const targetId = getEdgeNodeId(edge.target)
      adjacency.set(sourceId, [...(adjacency.get(sourceId) || []), targetId])
    })

    const roots = graphData.nodes.filter((node) => node.type === 'phenomenon')
    const seeds = roots.length > 0 ? roots : graphData.nodes.slice(0, 1)

    seeds.forEach((root) => {
      if (!map.has(root.id)) map.set(root.id, root.id)
      const queue = [root.id]
      while (queue.length > 0) {
        const current = queue.shift()
        if (!current) continue
        const neighbors = adjacency.get(current) || []
        neighbors.forEach((neighborId) => {
          if (!map.has(neighborId)) {
            map.set(neighborId, root.id)
            queue.push(neighborId)
          }
        })
      }
    })

    graphData.nodes.forEach((node) => {
      if (!map.has(node.id)) map.set(node.id, node.id)
    })

    return map
  }, [graphData])

  const initializeGrowth = useCallback((graph: KnowledgeGraph) => {
    const roots = graph.nodes.filter((node) => node.type === 'phenomenon')
    const seeds = roots.length > 0 ? roots : graph.nodes.slice(0, 1)
    const initialVisible = new Set(seeds.map((node) => node.id))
    visibleNodeIdsRef.current = initialVisible
    setVisibleNodeIds(initialVisible)
    setIsGrowthFinished(initialVisible.size >= graph.nodes.length)

    setSelectedNode((current) => {
      if (current && initialVisible.has(current.id)) return current
      return seeds[0] || current
    })
  }, [])

  const growOneStep = useCallback(() => {
    if (!graphData) return
    const current = visibleNodeIdsRef.current
    const total = graphData.nodes.length
    if (current.size >= total) {
      setIsGrowthFinished(true)
      return
    }

    const candidates = new Set<string>()
    graphData.edges.forEach((edge) => {
      const sourceId = getEdgeNodeId(edge.source)
      const targetId = getEdgeNodeId(edge.target)
      if (current.has(sourceId) && !current.has(targetId)) {
        candidates.add(targetId)
      }
    })

    if (candidates.size === 0) {
      const remaining = graphData.nodes.find((node) => !current.has(node.id))
      if (remaining) candidates.add(remaining.id)
    }

    if (candidates.size === 0) {
      setIsGrowthFinished(true)
      return
    }

    // 每步添加约15%的剩余节点，确保动画在约6-7步内完成
    const remaining = total - current.size
    const nodesToAdd = Math.max(1, Math.ceil(remaining * 0.15))

    const bucket = new Map<string, string[]>()
    candidates.forEach((nodeId) => {
      const key = nodeClusterMap.get(nodeId) || nodeId
      if (!bucket.has(key)) bucket.set(key, [])
      bucket.get(key)?.push(nodeId)
    })

    const nextIds: string[] = []
    bucket.forEach((ids) => {
      // 每个聚类可以添加多个节点
      const take = Math.ceil(nodesToAdd / bucket.size)
      ids.slice(0, take).forEach((id) => nextIds.push(id))
    })

    // 确保至少添加nodesToAdd个节点
    const sortedCandidates = Array.from(candidates)
    while (nextIds.length < nodesToAdd && sortedCandidates.length > 0) {
      const nextId = sortedCandidates.shift()!
      if (!nextIds.includes(nextId)) {
        nextIds.push(nextId)
      }
    }

    const nextVisible = new Set(current)
    nextIds.forEach((id) => nextVisible.add(id))
    visibleNodeIdsRef.current = nextVisible
    setVisibleNodeIds(nextVisible)
    if (nextVisible.size >= total) setIsGrowthFinished(true)
  }, [graphData, nodeClusterMap])

  useEffect(() => {
    const loadKnowledgeGraph = async () => {
      try {
        setLoading(true)
        setError(null)

        const searchParams = new URLSearchParams(location.search)
        const anomalyId = searchParams.get('anomalyId')

        if (!anomalyId) {
          const neo4jAvailable = await KnowledgeGraphAdapter.checkNeo4jAvailability()
          if (neo4jAvailable) {
            try {
              const allAnomalies = await KnowledgeGraphAdapter.getAllAnomalies()
              if (allAnomalies && allAnomalies.length > 0) {
                const mergedGraph = convertAnomaliesToGraph(allAnomalies)
                setGraphData(limitGraphNodes(mergedGraph, MAX_NODES))
                setIsDefaultView(false)
                setIsCompactView(true)
                setDataSource('neo4j')
                setLoading(false)
                return
              }
            } catch (loadError) {
              console.error('Failed to load all anomalies from Neo4j:', loadError)
            }
          }

          const allData = getAllKnowledgeGraphsMerged()
          setGraphData(limitGraphNodes(allData, MAX_NODES))
          setIsDefaultView(false)
          setIsCompactView(true)
          setDataSource('mock')
          setLoading(false)
          return
        }

        const neo4jAvailable = await KnowledgeGraphAdapter.checkNeo4jAvailability()
        let data: KnowledgeGraph | null = null
        if (neo4jAvailable) {
          data = await KnowledgeGraphAdapter.getKnowledgeGraph(anomalyId)
          if (data) setDataSource('neo4j')
        }
        if (!data) setDataSource('mock')

        if (data) {
          setGraphData(limitGraphNodes(data, MAX_NODES))
          setIsDefaultView(false)
          setIsCompactView(false)
          const phenomenonNode = data.nodes.find((node) => node.type === 'phenomenon')
          if (phenomenonNode) {
            setSelectedNode(phenomenonNode)
            setShowDetailPanel(true)
          }
        } else {
          setError('无法加载知识图谱数据')
        }
      } catch (err) {
        console.error('Failed to load knowledge graph:', err)
        setError('数据加载失败，请稍后重试')
        setDataSource('mock')
      } finally {
        setLoading(false)
      }
    }

    loadKnowledgeGraph()
  }, [location.search])

  useEffect(() => {
    if (!graphData) return
    initializeGrowth(graphData)
  }, [graphData, initializeGrowth])

  useEffect(() => {
    if (!graphData || isGrowthFinished) return
    // 每步约400ms，6-7步完成 = 约3秒
    const timer = setInterval(growOneStep, 400)
    return () => clearInterval(timer)
  }, [graphData, isGrowthFinished, growOneStep])

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node)
    setShowDetailPanel(true)
  }

  const handleBackToDashboard = () => {
    navigate('/app/')
  }

  const handleRefresh = async () => {
    const searchParams = new URLSearchParams(location.search)
    const anomalyId = searchParams.get('anomalyId')

    try {
      setLoading(true)
      setError(null)
      if (!anomalyId) {
        const neo4jAvailable = await KnowledgeGraphAdapter.checkNeo4jAvailability()
        if (neo4jAvailable) {
          try {
            const allAnomalies = await KnowledgeGraphAdapter.getAllAnomalies()
            if (allAnomalies && allAnomalies.length > 0) {
              const mergedGraph = convertAnomaliesToGraph(allAnomalies)
              setGraphData(limitGraphNodes(mergedGraph, MAX_NODES))
              setDataSource('neo4j')
              return
            }
          } catch (refreshError) {
            console.error('Failed to refresh all anomalies from Neo4j:', refreshError)
          }
        }
        const allData = getAllKnowledgeGraphsMerged()
        setGraphData(limitGraphNodes(allData, MAX_NODES))
        setDataSource('mock')
      } else {
        const neo4jAvailable = await KnowledgeGraphAdapter.checkNeo4jAvailability()
        let data: KnowledgeGraph | null = null
        if (neo4jAvailable) {
          data = await KnowledgeGraphAdapter.getKnowledgeGraph(anomalyId)
          if (data) setDataSource('neo4j')
        }
        if (!data) setDataSource('mock')

        if (data) {
          setGraphData(limitGraphNodes(data, MAX_NODES))
          const phenomenonNode = data.nodes.find((node) => node.type === 'phenomenon')
          if (phenomenonNode) {
            setSelectedNode(phenomenonNode)
            setShowDetailPanel(true)
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh knowledge graph:', err)
      setError('刷新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSolution = () => {
    if (!graphData) return
    navigate(`/app/sinan?anomalyId=${graphData.anomalyId}`, {
      state: {
        anomaly: {
          id: graphData.anomalyId,
          phenomenon: selectedNode?.description || '未知异常',
          rootCauses: graphData.nodes
            .filter((node) => node.type === 'cause')
            .map((node) => node.description),
          solutions: graphData.nodes
            .filter((node) => node.type === 'solution')
            .map((node) => ({
              id: node.id,
              name: node.label,
              description: node.description,
              estimatedTime: '15-30分钟',
              successRate: 85,
              risk: 12,
            })),
        },
        knowledgeGraph: graphData,
      },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">
            {dataSource === 'neo4j' ? '从知识图谱数据库加载...' : '加载知识图谱中...'}
          </p>
        </div>
      </div>
    )
  }

  if (!graphData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Settings size={48} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">未找到知识图谱数据</h2>
          <p className="text-slate-600 mb-4">可能的原因：异常ID不存在或数据加载失败</p>
          <button
            onClick={handleBackToDashboard}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            返回Dashboard
          </button>
        </div>
      </div>
    )
  }

  const totalNodes = graphData.nodes.length
  const visibleCount = visibleNodeIds.size
  const growthPercent = totalNodes > 0 ? Math.round((visibleCount / totalNodes) * 100) : 0

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex-none z-20 shadow-sm">
        <div className="relative flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <h1 className="text-xl font-bold text-slate-800">知识图谱</h1>
              <p className="text-xs text-slate-500">
                {graphData.anomalyId === 'all' ? '全部异常数据' : `异常ID: ${graphData.anomalyId}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  dataSource === 'neo4j' ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs text-slate-600">
                {dataSource === 'neo4j' ? '实时数据' : '演示数据'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isGrowthFinished ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${growthPercent}%` }}
                />
              </div>
              <span className="text-xs text-slate-600 min-w-[60px]">
                {isGrowthFinished ? '已完成' : `${growthPercent}%`}
              </span>
            </div>

            {isDefaultView && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-md text-sm flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>当前为示例展示，请在异常列表中选择具体条目查看详情</span>
              </div>
            )}
          </div>

          <div className="absolute right-0 flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-slate-600 hover:text-slate-800 px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? '刷新中...' : '刷新数据'}
            </button>
            <button
              onClick={handleBackToDashboard}
              className="text-slate-600 hover:text-slate-800 px-3 py-2 text-sm font-medium transition-colors"
            >
              返回列表
            </button>
            <button
              onClick={handleGenerateSolution}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Settings size={16} />
              智能决策
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={16} />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50" data-tour="gewu-canvas">
          <KnowledgeGraphCanvas
            graphData={graphData}
            visibleNodeIds={visibleNodeIds}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNode?.id}
            isCompactView={isCompactView}
          />
        </div>

        {showDetailPanel && (
          <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-32px)] flex flex-col z-10 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-right-10 duration-300">
            <div className="bg-white flex-1 overflow-hidden flex flex-col rounded-xl border border-slate-200">
              <div className="absolute top-2 right-2 z-20">
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className="p-1 rounded-full bg-white/80 hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <NodeDetailPanel selectedNode={selectedNode} />
            </div>
          </div>
        )}

        {!showDetailPanel && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowDetailPanel(true)}
              className="bg-white p-3 rounded-full shadow-lg text-blue-600 hover:bg-blue-50 border border-slate-200 transition-all"
              title="显示详情"
            >
              <AlertTriangle size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgeGraphPage
