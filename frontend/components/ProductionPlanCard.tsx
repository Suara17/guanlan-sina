/**
 * 生产计划卡片组件
 * 用于展示当前工单信息和下一工单预览
 * 支持产品切换预警和一键优化功能
 * 支持工艺流程折叠展开和差异对比
 */

import { AlertTriangle, ArrowRight, ChevronDown, ChevronRight, Clock, Package, Settings2, Timer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import type { NextPlan, OptimizationParams, ProductChangeWarning, ProcessStep } from '../types'

interface ProductionPlanCardProps {
  className?: string
  currentPlan: {
    work_order_no: string
    product_id: string
    product_code: string
    product_name: string
    line_id: string
    planned_quantity: number
    actual_quantity: number
    progress_percent: number
    estimated_completion_time: string | null
    status: 'running' | 'paused' | 'completed'
    process_flow?: ProcessStep[]
  } | null
  nextPlan: NextPlan | null
  productChangeWarning: ProductChangeWarning | null
  loading?: boolean
  onViewDetails?: () => void
  onOptimize?: (params: OptimizationParams) => void
}

// 比较两个工艺流程的差异
const compareProcessFlows = (flowA: ProcessStep[], flowB: ProcessStep[]) => {
  const differences: {
    type: 'added' | 'removed' | 'modified'
    stepA?: ProcessStep
    stepB?: ProcessStep
    index: number
  }[] = []

  const maxLen = Math.max(flowA.length, flowB.length)

  for (let i = 0; i < maxLen; i++) {
    const stepA = flowA[i]
    const stepB = flowB[i]

    if (stepA && !stepB) {
      differences.push({ type: 'removed', stepA, index: i })
    } else if (!stepA && stepB) {
      differences.push({ type: 'added', stepB, index: i })
    } else if (stepA && stepB) {
      if (stepA.name !== stepB.name || stepA.station_type !== stepB.station_type || stepA.cycle_time !== stepB.cycle_time) {
        differences.push({ type: 'modified', stepA, stepB, index: i })
      }
    }
  }

  return differences
}

// 检查某个步骤是否有差异
const isStepDifferent = (step: ProcessStep, index: number, differences: ReturnType<typeof compareProcessFlows>) => {
  return differences.some(d => d.index === index)
}

// 获取差异类型
const getDifferenceType = (index: number, differences: ReturnType<typeof compareProcessFlows>, isFlowA: boolean) => {
  const diff = differences.find(d => d.index === index)
  if (!diff) return null
  if (diff.type === 'added') return isFlowA ? null : 'added'
  if (diff.type === 'removed') return isFlowA ? 'removed' : null
  return 'modified'
}

export const ProductionPlanCard: React.FC<ProductionPlanCardProps> = ({
  className = '',
  currentPlan,
  nextPlan,
  productChangeWarning,
  loading = false,
  onViewDetails,
  onOptimize,
}) => {
  const navigate = useNavigate()
  const [showCurrentFlow, setShowCurrentFlow] = useState(false)
  const [showNextFlow, setShowNextFlow] = useState(false)

  const hasProductChange = productChangeWarning?.change_detected ?? false

  // 计算进度百分比
  const progressPercent = currentPlan
    ? Math.round((currentPlan.actual_quantity / currentPlan.planned_quantity) * 100)
    : 0

  // 格式化预计完单时间
  const formatCompletionTime = (isoString: string | null) => {
    if (!isoString) return '--'
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 格式化时长
  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours}小时`
    }
    const days = Math.floor(hours / 24)
    const remainHours = hours % 24
    if (remainHours === 0) {
      return `${days}天`
    }
    return `${days}天${remainHours}小时`
  }

  // 计算工艺流程差异
  const flowDifferences = useMemo(() => {
    const currentFlow = currentPlan?.process_flow || productChangeWarning?.current_flow || []
    const nextFlow = nextPlan?.process_flow || productChangeWarning?.next_flow || []
    if (currentFlow.length === 0 || nextFlow.length === 0) return []
    return compareProcessFlows(currentFlow, nextFlow)
  }, [currentPlan?.process_flow, nextPlan?.process_flow, productChangeWarning])

  // 处理优化按钮点击
  const handleOptimize = () => {
    if (!currentPlan || !nextPlan || !onOptimize) return

    const params: OptimizationParams = {
      mode: 'product_switch',
      current_product_id: currentPlan.product_id,
      next_product_id: nextPlan.product_id,
      current_layout: {
        devices: [],
        workshopDimensions: { length: 100, width: 60 },
      },
      process_flow: {
        steps: [],
      },
      line_id: currentPlan.line_id,
    }

    onOptimize(params)
  }

  // 处理详情按钮点击
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails()
    } else {
      navigate('/app/production-plan')
    }
  }

  // 渲染工艺流程步骤
  const renderProcessFlow = (
    flow: ProcessStep[],
    isFlowA: boolean,
    differences: ReturnType<typeof compareProcessFlows>
  ) => {
    if (!flow || flow.length === 0) {
      return (
        <div className="text-sm text-slate-400 py-2 text-center">
          暂无工艺流程数据
        </div>
      )
    }

    return (
      <div className="space-y-1.5">
        {flow.map((step, index) => {
          const diffType = getDifferenceType(index, differences, isFlowA)
          const isDifferent = diffType !== null

          let bgClass = 'bg-slate-50'
          let textClass = 'text-slate-700'
          let borderClass = 'border-transparent'

          if (diffType === 'added') {
            bgClass = 'bg-green-50'
            textClass = 'text-green-700'
            borderClass = 'border-l-2 border-green-500'
          } else if (diffType === 'removed') {
            bgClass = 'bg-red-50'
            textClass = 'text-red-700 line-through opacity-60'
            borderClass = 'border-l-2 border-red-500'
          } else if (diffType === 'modified') {
            bgClass = 'bg-amber-50'
            textClass = 'text-amber-700'
            borderClass = 'border-l-2 border-amber-500'
          }

          return (
            <div
              key={index}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${bgClass} ${borderClass}`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-500">
                {step.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${textClass}`}>{step.name}</p>
                <p className="text-xs text-slate-400">{step.station_type}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-slate-500">{step.cycle_time}s</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-slate-100 shadow-sm p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!currentPlan) {
    return (
      <div className={`bg-white rounded-xl border border-slate-100 shadow-sm p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">生产计划</h3>
        </div>
        <div className="text-center py-8 text-slate-500">
          <Package size={40} className="mx-auto mb-2 opacity-50" />
          <p>暂无生产计划数据</p>
        </div>
      </div>
    )
  }

  const currentFlow = currentPlan.process_flow || productChangeWarning?.current_flow || []
  const nextFlow = nextPlan?.process_flow || productChangeWarning?.next_flow || []

  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">生产计划</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* 当前工单信息 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">当前工单</span>
              <p className="font-semibold text-slate-800 text-lg">{currentPlan.work_order_no}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">产品</span>
              <p className="font-semibold text-slate-800">
                {currentPlan.product_code} - {currentPlan.product_name}
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* 数量与进度 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">计划数量</p>
              <p className="font-semibold text-slate-700">
                {currentPlan.planned_quantity.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">实际数量</p>
              <p className="font-semibold text-slate-700">
                {currentPlan.actual_quantity.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">预计完单</p>
              <p className="font-semibold text-slate-700 flex items-center gap-1">
                <Clock size={14} className="text-slate-400" />
                {formatCompletionTime(currentPlan.estimated_completion_time)}
              </p>
            </div>
          </div>

          {/* 进度条 */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">完成进度</span>
              <span className="font-semibold text-blue-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent >= 100
                    ? 'bg-green-500'
                    : progressPercent >= 70
                      ? 'bg-blue-500'
                      : progressPercent >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* 当前工单工艺流程 - 可折叠 */}
          {currentFlow.length > 0 && (
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowCurrentFlow(!showCurrentFlow)}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700">工艺流程 ({currentFlow.length}道工序)</span>
                {showCurrentFlow ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {showCurrentFlow && (
                <div className="p-3 border-t border-slate-100">
                  {renderProcessFlow(currentFlow, true, flowDifferences)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 下一工单预览 */}
        {nextPlan && (
          <div className="space-y-3">
            <div className="h-px bg-slate-100" />

            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  下一工单预览
                </span>
                {hasProductChange && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={12} />
                    产品变化预警
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-700">{nextPlan.work_order_no}</p>
                  <p className="text-sm text-slate-500">
                    产品: {nextPlan.product_code} - {nextPlan.product_name}
                  </p>
                </div>
                <ArrowRight size={20} className="text-slate-300" />
              </div>

              {/* 下一单产量和预计时长 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Package size={12} />
                    计划产量
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {nextPlan.planned_quantity?.toLocaleString() || '--'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Timer size={12} />
                    预计时长
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {nextPlan.estimated_duration_hours 
                      ? formatDuration(nextPlan.estimated_duration_hours) 
                      : '--'}
                  </p>
                </div>
              </div>

              {/* 下一单工艺流程 - 可折叠 */}
              {nextFlow.length > 0 && (
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowNextFlow(!showNextFlow)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">工艺流程 ({nextFlow.length}道工序)</span>
                      {flowDifferences.length > 0 && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          {flowDifferences.length}处差异
                        </span>
                      )}
                    </div>
                    {showNextFlow ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {showNextFlow && (
                    <div className="p-3 border-t border-slate-100">
                      {renderProcessFlow(nextFlow, false, flowDifferences)}
                    </div>
                  )}
                </div>
              )}

              {/* 图例说明 */}
              {showNextFlow && flowDifferences.length > 0 && (
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-100 border-l-2 border-green-500"></span>
                    新增工序
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-amber-100 border-l-2 border-amber-500"></span>
                    变更工序
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-100 border-l-2 border-red-500"></span>
                    移除工序
                  </span>
                </div>
              )}
            </div>

            {/* 一键优化按钮 - 仅产品切换时显示 */}
            {hasProductChange && (
              <button
                onClick={handleOptimize}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-600 transition-all shadow-md shadow-blue-200"
              >
                <Settings2 size={18} />
                一键优化布局
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductionPlanCard