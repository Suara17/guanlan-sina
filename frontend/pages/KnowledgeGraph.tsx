import { AlertTriangle, Settings, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KnowledgeGraphCanvas from '../components/KnowledgeGraphCanvas'
import NodeDetailPanel from '../components/NodeDetailPanel'
import { getAllKnowledgeGraphsMerged, getKnowledgeGraphByAnomalyId } from '../mockData'
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

  useEffect(() => {
    // 从URL参数获取异常ID
    const searchParams = new URLSearchParams(location.search)
    const anomalyId = searchParams.get('anomalyId')
    const isDefault = false

    // 如果没有ID，展示所有知识图谱数据（紧凑模式）
    if (!anomalyId) {
      const allData = getAllKnowledgeGraphsMerged()
      setGraphData(allData)
      setIsDefaultView(false)
      setIsCompactView(true)
      setLoading(false)
      return
    }

    if (anomalyId) {
      // 从Mock数据获取知识图谱
      const data = getKnowledgeGraphByAnomalyId(anomalyId)
      if (data) {
        setGraphData(data)
        setIsDefaultView(isDefault)
        setIsCompactView(false)
        // 默认选中第一个现象节点
        const phenomenonNode = data.nodes.find((node) => node.type === 'phenomenon')
        if (phenomenonNode) {
          setSelectedNode(phenomenonNode)
          setShowDetailPanel(true)
        }
      } else {
        // 如果指定的ID找不到数据，尝试加载默认数据
        if (!isDefault) {
          const defaultData = getKnowledgeGraphByAnomalyId('smt-001')
          if (defaultData) {
            setGraphData(defaultData)
            setIsDefaultView(true)
            setIsCompactView(false)
            const pNode = defaultData.nodes.find((node) => node.type === 'phenomenon')
            if (pNode) {
              setSelectedNode(pNode)
              setShowDetailPanel(true)
            }
          }
        }
      }
    }

    setLoading(false)
  }, [location.search])

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node)
    setShowDetailPanel(true)
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
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex-none z-20 shadow-sm">
        <div className="relative flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <h1 className="text-xl font-bold text-slate-800">知识图谱</h1>
              <p className="text-xs text-slate-500">异常ID: {graphData.anomalyId}</p>
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
