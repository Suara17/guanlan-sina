import { ArrowRight } from 'lucide-react'
import type React from 'react'

interface FlowStep {
  id: string
  label: string
  paths: string[]
}

const FLOW_STEPS: FlowStep[] = [
  { id: 'discover', label: '发现', paths: ['/app/', '/app/sinan'] },
  { id: 'attribute', label: '归因', paths: ['/app/gewu'] },
  { id: 'decide', label: '决策', paths: ['/app/tianchou'] },
  { id: 'verify', label: '验证', paths: ['/app/huntian'] },
]

interface BusinessFlowBarProps {
  currentPath: string
  onNavigate: (path: string) => void
  collapsed: boolean
}

const BusinessFlowBar: React.FC<BusinessFlowBarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
}) => {
  const activeIndex = FLOW_STEPS.findIndex((step) => step.paths.some((p) => currentPath === p))

  if (collapsed) {
    return (
      <div className="px-3 py-3 flex flex-col items-center gap-1.5">
        {FLOW_STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onNavigate(step.paths[0])}
            title={step.label}
            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
              index === activeIndex
                ? 'bg-blue-400 shadow-lg shadow-blue-400/50 scale-125'
                : 'bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-3 mb-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
        业务闭环
      </div>
      <div className="flex items-center justify-between gap-1">
        {FLOW_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onNavigate(step.paths[0])}
              className="flex flex-col items-center gap-1 cursor-pointer group transition-all"
              title={`前往：${step.label}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  index === activeIndex
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40 scale-110'
                    : index < activeIndex
                      ? 'bg-blue-900/60 text-blue-400 border border-blue-700/50'
                      : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-slate-200'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-[9px] font-medium leading-none transition-colors ${
                  index === activeIndex
                    ? 'text-blue-400'
                    : index < activeIndex
                      ? 'text-blue-600'
                      : 'text-slate-500 group-hover:text-slate-300'
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < FLOW_STEPS.length - 1 && (
              <ArrowRight
                size={10}
                className={`flex-shrink-0 mb-3 ${
                  index < activeIndex ? 'text-blue-700' : 'text-slate-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BusinessFlowBar
