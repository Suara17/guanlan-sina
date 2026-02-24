/**
 * 产品切换预警弹窗组件
 * 当检测到产品切换时显示预警，提供优化建议
 */

import { AlertTriangle, ArrowRight, Settings2, X } from 'lucide-react'

interface ProductChangeAlertProps {
  visible: boolean
  currentProduct: string
  nextProduct: string
  differences: string[]
  onOptimize?: () => void
  onDismiss?: () => void
}

export const ProductChangeAlert: React.FC<ProductChangeAlertProps> = ({
  visible,
  currentProduct,
  nextProduct,
  differences = [],
  onOptimize,
  onDismiss,
}) => {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onDismiss} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">产品切换预警</h3>
              <p className="text-white/80 text-sm">检测到即将发生产品切换</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* 产品切换对比 */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 mb-1">当前产品</p>
              <p className="font-semibold text-slate-800">{currentProduct}</p>
            </div>
            <div className="px-4">
              <ArrowRight size={24} className="text-slate-300" />
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 mb-1">下一产品</p>
              <p className="font-semibold text-blue-600">{nextProduct}</p>
            </div>
          </div>

          {/* 工艺差异 */}
          {differences.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">工艺流程差异:</p>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 max-h-32 overflow-y-auto">
                <ul className="space-y-1">
                  {differences.map((diff, idx) => (
                    <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      {diff}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 建议 */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              建议在切换前进行布局优化，以减少换线时间并提升生产效率。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            暂不优化
          </button>
          <button
            onClick={onOptimize}
            className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
          >
            <Settings2 size={18} />
            立即优化
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductChangeAlert
