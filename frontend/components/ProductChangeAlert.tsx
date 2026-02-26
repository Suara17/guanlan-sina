/**
 * 产品切换预警悬浮通知组件
 * 改为悬浮通知气泡，而非全屏弹窗
 * 支持展开详情查看工艺差异
 */

import { AlertTriangle, ChevronDown, ChevronUp, Settings2, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ProductChangeAlertProps {
  visible: boolean
  currentProduct: string
  nextProduct: string
  differences: string[]
  layoutSwitchDays?: number // 布局切换所需天数
  layoutSwitchMinutes?: number // 布局切换所需分钟
  onOptimize?: () => void
  onDismiss?: () => void
}

export const ProductChangeAlert: React.FC<ProductChangeAlertProps> = ({
  visible,
  currentProduct,
  nextProduct,
  differences = [],
  layoutSwitchDays,
  layoutSwitchMinutes,
  onOptimize,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // 动画效果
  useEffect(() => {
    if (visible) {
      setIsAnimating(true)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 transition-all duration-300 ease-out ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-100 w-80 overflow-hidden max-h-[calc(100vh-200px)] flex flex-col">
        {/* Header - 固定 */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">产品切换预警</h3>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content - 可滚动区域 */}
        <div className="overflow-y-auto flex-1">
          {/* 产品切换对比 */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
              <div className="text-center flex-1">
                <p className="text-xs text-slate-500 mb-0.5">当前</p>
                <p className="font-semibold text-sm text-slate-800">{currentProduct}</p>
              </div>
              <div className="px-3 text-slate-300">
                →
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-slate-500 mb-0.5">下一单</p>
                <p className="font-semibold text-sm text-blue-600">{nextProduct}</p>
              </div>
            </div>

            {/* 布局切换时间提示 */}
            {(layoutSwitchMinutes || (layoutSwitchDays && layoutSwitchDays > 0)) && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-600">
                  预计布局切换时间：
                  <span className="font-semibold">
                    {layoutSwitchMinutes 
                      ? `${layoutSwitchMinutes}分钟` 
                      : layoutSwitchDays 
                        ? `${layoutSwitchDays}天` 
                        : ''}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* 工艺差异 - 可折叠 */}
          {differences.length > 0 && (
            <div className="border-b border-slate-100">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">工艺差异</span>
                  <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    {differences.length}项
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-slate-400" />
                ) : (
                  <ChevronDown size={14} className="text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 max-h-32 overflow-y-auto">
                    <ul className="space-y-1">
                      {differences.map((diff, idx) => (
                        <li key={idx} className="text-xs text-amber-700 flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 建议信息 */}
          <div className="p-4">
            <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700">
                检测到产品切换，建议进行布局优化以减少换线时间，提升生产效率。
              </p>
            </div>
          </div>
        </div>

        {/* Footer - 固定 */}
        <div className="px-4 py-3 bg-slate-50 flex gap-2 flex-shrink-0 border-t border-slate-100">
          <button
            onClick={onDismiss}
            className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            稍后处理
          </button>
          <button
            onClick={onOptimize}
            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Settings2 size={14} />
            立即优化
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductChangeAlert