/**
 * 异常模拟情境选择器组件
 * 用于展示预设模拟情境，支持选择后执行模拟
 */
import { AlertTriangle, Beaker, Clock, Loader2, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

interface SimulationScenario {
  id: string
  scenario_code: string
  scenario_name: string
  severity: 'critical' | 'error' | 'warning'
  description: string | null
}

interface SimulationSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (scenarioId: string) => void
}

const severityConfig = {
  critical: {
    label: '严重影响',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-500',
    badge: 'bg-red-100 text-red-700',
  },
  error: {
    label: '高影响',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    iconColor: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700',
  },
  warning: {
    label: '中等影响',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
}

// 默认模拟数据（API不可用时使用）
const DEFAULT_SCENARIOS: SimulationScenario[] = [
  { id: 'sim-001', scenario_code: 'SIM-001', scenario_name: '锡焊不到位连续10个不良', severity: 'critical', description: 'SMT产线锡焊工位连续出现焊接不良' },
  { id: 'sim-002', scenario_code: 'SIM-002', scenario_name: '贴片机抛料率超8%', severity: 'error', description: '贴片机抛料率异常升高' },
  { id: 'sim-003', scenario_code: 'SIM-003', scenario_name: '回流焊温度异常', severity: 'error', description: '回流焊炉温区温度波动异常' },
  { id: 'sim-004', scenario_code: 'SIM-004', scenario_name: 'AOI误检率过高', severity: 'warning', description: 'AOI检测设备误检率升高' },
  { id: 'sim-005', scenario_code: 'SIM-005', scenario_name: '印刷机刮刀磨损', severity: 'critical', description: '锡膏印刷机刮刀磨损严重' },
  { id: 'sim-006', scenario_code: 'SIM-006', scenario_name: 'AGV路径冲突', severity: 'warning', description: '多台AGV在交叉路口发生路径冲突' },
  { id: 'sim-007', scenario_code: 'SIM-007', scenario_name: '波峰焊锡炉液位低', severity: 'critical', description: '波峰焊锡炉液位低于安全线' },
  { id: 'sim-008', scenario_code: 'SIM-008', scenario_name: '贴片吸嘴堵塞', severity: 'warning', description: '贴片机吸嘴堵塞导致吸取失败率上升' },
  { id: 'sim-009', scenario_code: 'SIM-009', scenario_name: '钢网张力不足', severity: 'error', description: '锡膏印刷钢网张力不足' },
  { id: 'sim-010', scenario_code: 'SIM-010', scenario_name: '元件供料器卡料', severity: 'warning', description: '贴片机供料器卡料导致贴装中断' },
]

const SimulationSelector: React.FC<SimulationSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(DEFAULT_SCENARIOS)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)

  // 加载模拟情境数据
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch('/api/v1/simulation/scenarios')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setScenarios(data)
          }
        })
        .catch(() => {
          // 使用默认数据
          setScenarios(DEFAULT_SCENARIOS)
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  const handleSelect = async (scenarioId: string) => {
    setSelectedId(scenarioId)
    setExecuting(true)
    try {
      await onSelect(scenarioId)
    } finally {
      setExecuting(false)
      setSelectedId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Beaker className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">异常模拟</h2>
              <p className="text-xs text-slate-500">选择情境开始模拟演示</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 情境列表 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario) => {
                const config = severityConfig[scenario.severity]
                const isSelected = selectedId === scenario.id
                const isExecuting = executing && isSelected

                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => handleSelect(scenario.id)}
                    disabled={executing}
                    className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 group
                      ${config.borderColor} ${config.bgColor}
                      hover:shadow-lg hover:scale-[1.02]
                      disabled:opacity-50 disabled:cursor-wait
                      ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  >
                    {/* 严重程度标签 */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-400">
                        {scenario.scenario_code}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>

                    {/* 标题 */}
                    <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors">
                      {scenario.scenario_name}
                    </h3>

                    {/* 描述 */}
                    {scenario.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {scenario.description}
                      </p>
                    )}

                    {/* 图标 */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isExecuting ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : (
                        <AlertTriangle className={`w-5 h-5 ${config.iconColor}`} />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4" />
            <span>共 {scenarios.length} 个预设情境</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

export default SimulationSelector
