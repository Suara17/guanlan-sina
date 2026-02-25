/**
 * 生产计划卡片组件
 * 用于展示当前工单信息和下一工单预览
 * 支持产品切换预警和一键优化功能
 */

import { AlertTriangle, ArrowRight, ChevronRight, Clock, Package, Settings2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { NextPlan, OptimizationParams, ProductChangeWarning } from '../types'

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
  } | null
  nextPlan: NextPlan | null
  productChangeWarning: ProductChangeWarning | null
  loading?: boolean
  onViewDetails?: () => void
  onOptimize?: (params: OptimizationParams) => void
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
        </div>

        {/* 下一工单预览 */}
        {nextPlan && (
          <div className="space-y-3">
            <div className="h-px bg-slate-100" />

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
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

              {/* 工艺流程差异提示 */}
              {hasProductChange && productChangeWarning?.flow_differences && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700">
                  <p className="font-medium mb-1">工艺变化:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {productChangeWarning.flow_differences.slice(0, 3).map((diff, idx) => (
                      <li key={idx}>{diff}</li>
                    ))}
                    {productChangeWarning.flow_differences.length > 3 && (
                      <li className="text-amber-500">
                        ...还有 {productChangeWarning.flow_differences.length - 3} 项变化
                      </li>
                    )}
                  </ul>
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
