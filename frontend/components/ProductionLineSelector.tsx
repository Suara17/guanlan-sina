import { Activity, AlertCircle, ChevronDown, Clock } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import type { ProductionLine } from '../types'

interface Props {
  lines: ProductionLine[]
  selectedLine: ProductionLine | null
  onSelect: (line: ProductionLine) => void
}

const ProductionLineSelector: React.FC<Props> = ({ lines, selectedLine, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false)

  // 状态图标映射
  const getStatusIcon = (status: ProductionLine['status']) => {
    switch (status) {
      case 'running':
        return <Activity size={14} className="text-green-500" />
      case 'error':
        return <AlertCircle size={14} className="text-red-500" />
      case 'idle':
        return <Clock size={14} className="text-gray-400" />
    }
  }

  // 状态文本映射
  const getStatusText = (status: ProductionLine['status']) => {
    switch (status) {
      case 'running':
        return '运行中'
      case 'error':
        return '异常'
      case 'idle':
        return '空闲'
    }
  }

  // 状态颜色映射
  const getStatusColor = (status: ProductionLine['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'idle':
        return 'bg-gray-50 border-gray-200 text-gray-600'
    }
  }

  return (
    <div className="relative">
      {/* 选择器按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-64 bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between hover:border-blue-300 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-3">
          {selectedLine && getStatusIcon(selectedLine.status)}
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800 leading-tight">
              {selectedLine ? selectedLine.name : '请选择产线'}
            </p>
            {selectedLine && (
              <p className="text-xs text-slate-500 leading-tight">
                {selectedLine.type} 产线 · {getStatusText(selectedLine.status)}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          />

          {/* 下拉列表 */}
          <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-96 overflow-y-auto w-80">
            {/* 按产线类型分组 */}
            {['SMT', 'PCB', '3C'].map((type) => {
              const linesOfType = lines.filter((line) => line.type === type)
              if (linesOfType.length === 0) return null

              return (
                <div key={type}>
                  {/* 分组标题 */}
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-600">{type} 产线</p>
                  </div>

                  {/* 产线列表 */}
                  {linesOfType.map((line) => (
                    <button
                      type="button"
                      key={line.id}
                      onClick={() => {
                        onSelect(line)
                        setIsOpen(false)
                      }}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-b-0
                        ${selectedLine?.id === line.id ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(line.status)}
                        <div className="text-left">
                          <p className="text-sm font-semibold text-slate-800">{line.name}</p>
                          <p className="text-xs text-slate-500">{line.id.toUpperCase()}</p>
                        </div>
                      </div>

                      {/* 状态标签 */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(line.status)}`}
                      >
                        {getStatusText(line.status)}
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default ProductionLineSelector
