import { AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react'
import type React from 'react'
import type { KnowledgeNode } from '../types'

interface Props {
  selectedNode: KnowledgeNode | null
}

const NodeDetailPanel: React.FC<Props> = ({ selectedNode }) => {
  if (!selectedNode) {
    return (
      <div className="w-full h-full bg-white rounded-lg border border-slate-200 p-6 flex flex-col items-center justify-center text-slate-400">
        <Info size={48} className="mb-4 opacity-50" />
        <p className="text-sm">点击图谱中的节点查看详细信息</p>
      </div>
    )
  }

  const getNodeIcon = (type: KnowledgeNode['type']) => {
    switch (type) {
      case 'phenomenon':
        return <AlertTriangle size={20} className="text-red-500" />
      case 'cause':
        return <Info size={20} className="text-orange-500" />
      case 'solution':
        return <Lightbulb size={20} className="text-green-500" />
    }
  }

  const getNodeColor = (type: KnowledgeNode['type']) => {
    switch (type) {
      case 'phenomenon':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'cause':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'solution':
        return 'bg-green-50 border-green-200 text-green-800'
    }
  }

  const getNodeTypeLabel = (type: KnowledgeNode['type']) => {
    switch (type) {
      case 'phenomenon':
        return '异常现象'
      case 'cause':
        return '根本原因'
      case 'solution':
        return '解决方案'
    }
  }

  return (
    <div className="w-full h-full bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
      {/* 头部 */}
      <div className={`p-4 border-b border-slate-200 ${getNodeColor(selectedNode.type)}`}>
        <div className="flex items-center gap-3">
          {getNodeIcon(selectedNode.type)}
          <div>
            <h3 className="font-bold text-lg">{selectedNode.label}</h3>
            <p className="text-sm opacity-80">{getNodeTypeLabel(selectedNode.type)}</p>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* 描述 */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">详细描述</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{selectedNode.description}</p>
          </div>

          {/* 针对解决方案的额外信息 */}
          {selectedNode.type === 'solution' && (
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="font-medium text-green-800 text-sm">实施信息</span>
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  <p>• 预计维修时长: 15-30 分钟</p>
                  <p>• 修复成功率: 85%</p>
                  <p>• 所需工具: 扳手、密封圈</p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-800 text-sm">风险评估</span>
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• 继续生产风险: 低 (12%)</p>
                  <p>• 停线影响: 延迟 2 小时</p>
                  <p>• 建议: 优先处理，影响可控</p>
                </div>
              </div>
            </div>
          )}

          {/* 针对原因的额外信息 */}
          {selectedNode.type === 'cause' && (
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-orange-600" />
                <span className="font-medium text-orange-800 text-sm">原因分析</span>
              </div>
              <div className="text-xs text-orange-700 space-y-1">
                <p>• 发生频率: 中等</p>
                <p>• 影响程度: 严重</p>
                <p>• 预防措施: 定期检查和更换</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作区 */}
      {selectedNode.type === 'solution' && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            采纳此解决方案
          </button>
        </div>
      )}
    </div>
  )
}

export default NodeDetailPanel
