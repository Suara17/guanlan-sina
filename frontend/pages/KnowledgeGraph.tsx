import { Settings } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KnowledgeGraphCanvas from '../components/KnowledgeGraphCanvas'
import NodeDetailPanel from '../components/NodeDetailPanel'
import { getKnowledgeGraphByAnomalyId } from '../mockData'
import type { KnowledgeGraph, KnowledgeNode } from '../types'

const KnowledgeGraph: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [graphData, setGraphData] = useState<KnowledgeGraph | null>(null)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从URL参数获取异常ID
    const searchParams = new URLSearchParams(location.search)
    const anomalyId = searchParams.get('anomalyId')

    if (anomalyId) {
      // 从Mock数据获取知识图谱
      const data = getKnowledgeGraphByAnomalyId(anomalyId)
      if (data) {
        setGraphData(data)
        // 默认选中第一个现象节点
        const phenomenonNode = data.nodes.find((node) => node.type === 'phenomenon')
        if (phenomenonNode) {
          setSelectedNode(phenomenonNode)
        }
      }
    }

    setLoading(false)
  }, [location.search])

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node)
  }

  const handleBackToDashboard = () => {
    navigate('/app/')
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
          <p className="text-slate-600">加载知识图谱中...</p>
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
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">格物图谱分析</h1>
            <p className="text-sm text-slate-500">异常ID: {graphData.anomalyId}</p>
          </div>

          <button
            onClick={handleGenerateSolution}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <Settings size={16} />
            生成优化方案
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 图谱画布区域 */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">知识图谱</h2>
              <p className="text-sm text-slate-500 mt-1">点击节点查看详细信息，支持拖拽调整布局</p>
            </div>
            <div className="p-4 h-[calc(100%-80px)]">
              <KnowledgeGraphCanvas
                graphData={graphData}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNode?.id}
              />
            </div>
          </div>
        </div>

        {/* 节点详情面板 */}
        <div className="w-80 p-6">
          <NodeDetailPanel selectedNode={selectedNode} />
        </div>
      </div>
    </div>
  )
}

export default KnowledgeGraph
