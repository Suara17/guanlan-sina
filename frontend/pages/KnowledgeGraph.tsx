import { AlertTriangle, RefreshCw, Settings, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KnowledgeGraphCanvas from '../components/KnowledgeGraphCanvas'
import NodeDetailPanel from '../components/NodeDetailPanel'
import { getAllKnowledgeGraphsMerged } from '../mockData'
import { KnowledgeGraphAdapter } from '../services/dataAdapter'
import type { KnowledgeGraph, KnowledgeNode } from '../types'

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

  // 将Neo4j返回的所有异常数据转换为知识图谱格式
  const convertAnomaliesToGraph = (anomalies: any[]): KnowledgeGraph => {
    const nodes: KnowledgeNode[] = []
    const edges: Array<{
      id: string
      source: string
      target: string
      type: 'leads_to' | 'caused_by' | 'solved_by'
      label?: string
    }> = []

    anomalies.forEach((anomaly, index) => {
      // 创建现象节点
      const phenomenonId = `phenomenon-${anomaly.sequence}`
      nodes.push({
        id: phenomenonId,
        type: 'phenomenon',
        label: `${anomaly.line_type}-异常${anomaly.sequence}`,
        description: anomaly.phenomenon,
      })

      // 处理原因节点
      const causeNodeIds: string[] = []
      if (anomaly.causes && Array.isArray(anomaly.causes)) {
        anomaly.causes.forEach((cause: any, cIndex: number) => {
          const causeId = `cause-${anomaly.sequence}-${cIndex}`
          causeNodeIds.push(causeId)

          nodes.push({
            id: causeId,
            type: 'cause',
            label: cause.type || '原因',
            description: cause.description || '未知原因',
          })

          // 现象到原因的关系
          edges.push({
            id: `edge-phenomenon-${anomaly.sequence}-cause-${cIndex}`,
            source: phenomenonId,
            target: causeId,
            type: 'caused_by',
            label: '导致',
          })
        })
      }

      // 处理解决方案节点
      if (anomaly.solutions && Array.isArray(anomaly.solutions)) {
        anomaly.solutions.forEach((solution: any, sIndex: number) => {
          const solutionId = `solution-${anomaly.sequence}-${sIndex}`

          nodes.push({
            id: solutionId,
            type: 'solution',
            label: solution.type || '解决方案',
            description: solution.method || '未知解决方案',
          })

          // 将解决方案连接到对应的原因（如果有的话）
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

  useEffect(() => {
    const loadKnowledgeGraph = async () => {
      try {
        setLoading(true)
        setError(null)

        // 从URL参数获取异常ID
        const searchParams = new URLSearchParams(location.search)
        const anomalyId = searchParams.get('anomalyId')

        // 如果没有ID，展示所有知识图谱数据（从Neo4j获取）
        if (!anomalyId) {
          // 首先检查Neo4j可用性
          const neo4jAvailable = await KnowledgeGraphAdapter.checkNeo4jAvailability()

          if (neo4jAvailable) {
            try {
              // 从Neo4j获取所有异常数据
              const allAnomalies = await KnowledgeGraphAdapter.getAllAnomalies()

              if (allAnomalies && allAnomalies.length > 0) {
                // 将所有异常数据转换为知识图谱格式
                const mergedGraph = convertAnomaliesToGraph(allAnomalies)
                setGraphData(mergedGraph)
                setIsDefaultView(false)
                setIsCompactView(true)
                setDataSource('neo4j')
                setLoading(false)
                return
              }
            } catch (error) {
              console.error('Failed to load all anomalies from Neo4j:', error)
            }
          }

          // 如果Neo4j不可用或查询失败，降级到模拟数据
          const allData = getAllKnowledgeGraphsMerged()
          setGraphData(allData)
          setIsDefaultView(false)
          setIsCompactView(true)
          setDataSource('mock')
          setLoading(false)
          return
        }

        // 首先检查Neo4j可用性
        const neo4jAvailable = await KnowledgeGraphAdapter.checkNeo4jAvailability()

        let data: KnowledgeGraph | null = null

        if (neo4jAvailable) {
          // 尝试从Neo4j获取数据
          data = await KnowledgeGraphAdapter.getKnowledgeGraph(anomalyId)
          if (data) {
            setDataSource('neo4j')
          }
        }

        // 如果Neo4j失败或无数据，已在适配器内部降级到模拟数据
        if (!data) {
          setDataSource('mock')
        }

        if (data) {
          setGraphData(data)
          setIsDefaultView(false)
          setIsCompactView(false)

          // 默认选中第一个现象节点
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
        // 如果没有异常ID，刷新所有数据
        const neo4jAvailable = await KnowledgeGraphAdapter.checkNeo4jAvailability()

        if (neo4jAvailable) {
          try {
            // 从Neo4j获取所有异常数据
            const allAnomalies = await KnowledgeGraphAdapter.getAllAnomalies()

            if (allAnomalies && allAnomalies.length > 0) {
              // 将所有异常数据转换为知识图谱格式
              const mergedGraph = convertAnomaliesToGraph(allAnomalies)
              setGraphData(mergedGraph)
              setDataSource('neo4j')
            }
          } catch (error) {
            console.error('Failed to refresh all anomalies from Neo4j:', error)
          }
        }

        // 如果Neo4j不可用或查询失败，降级到模拟数据
        if (!graphData || dataSource === 'mock') {
          const allData = getAllKnowledgeGraphsMerged()
          setGraphData(allData)
          setDataSource('mock')
        }
      } else {
        // 有异常ID的情况，按原有逻辑处理
        const neo4jAvailable = await KnowledgeGraphAdapter.checkNeo4jAvailability()
        let data: KnowledgeGraph | null = null

        if (neo4jAvailable) {
          data = await KnowledgeGraphAdapter.getKnowledgeGraph(anomalyId)
          if (data) {
            setDataSource('neo4j')
          }
        }

        if (!data) {
          setDataSource('mock')
        }

        if (data) {
          setGraphData(data)
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
    if (graphData) {
      navigate('/app/tianchou', {
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

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex-none z-20 shadow-sm">
        <div className="relative flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <h1 className="text-xl font-bold text-slate-800">知识图谱</h1>
              <p className="text-xs text-slate-500">
                {graphData.anomalyId === 'all' ? '全部异常数据' : `异常ID: ${graphData.anomalyId}`}
              </p>
            </div>

            {/* 数据源指示器 */}
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
              转到天筹决策
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
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

      {/* 主要内容区域 - 相对定位容器 */}
      <div className="flex-1 relative overflow-hidden">
        {/* 图谱画布 - 占据整个区域 */}
        <div className="absolute inset-0 bg-slate-50">
          <KnowledgeGraphCanvas
            graphData={graphData}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNode?.id}
            isCompactView={isCompactView}
          />
        </div>

        {/* 节点详情面板 - 悬浮在右侧 */}
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

        {/* 提示遮罩 - 如果未选中节点且面板关闭，可以显示一个小的提示按钮或文字（可选） */}
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
