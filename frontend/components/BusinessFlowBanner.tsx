import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

interface FlowCard {
  id: string
  step: string
  title: string
  subtitle: string
  navigateTo: string
  color: ColorKey
}

const FLOW_CARDS: FlowCard[] = [
  {
    id: 'discover',
    step: '不良发现',
    title: '生产可视化 / 司南智控',
    subtitle: '实时监控异常，触发分析',
    navigateTo: '/app/',
    color: 'blue',
  },
  {
    id: 'attribute',
    step: '归因分析',
    title: '格物图谱',
    subtitle: '知识图谱定位根因',
    navigateTo: '/app/gewu',
    color: 'violet',
  },
  {
    id: 'decide',
    step: '方案与决策',
    title: '天筹优化',
    subtitle: '多目标优化，生成方案',
    navigateTo: '/app/tianchou',
    color: 'amber',
  },
  {
    id: 'verify',
    step: '仿真验证',
    title: '浑天仿真',
    subtitle: '验证方案可行性',
    navigateTo: '/app/huntian',
    color: 'emerald',
  },
]

// Tailwind 不支持动态类名，需要静态映射；使用 as const 推导精确类型，避免 Record<string, ...> 导致的越界风险
const COLOR_MAP = {
  blue: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
  },
  violet: {
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/10 hover:bg-violet-500/20',
    text: 'text-violet-400',
    dot: 'bg-violet-500',
  },
  amber: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  emerald: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
} as const

// 从 COLOR_MAP 键推导联合类型，FlowCard.color 只能取合法值
type ColorKey = keyof typeof COLOR_MAP

interface BusinessFlowBannerProps {
  currentPath: string
  onNavigate: (path: string) => void
}

const BusinessFlowBanner: React.FC<BusinessFlowBannerProps> = ({ currentPath, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div className="mx-6 mt-4 mb-2">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/40 border border-slate-700/50 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer"
          aria-label="展开业务闭环导航"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider">业务闭环</span>
            <div className="flex items-center gap-1.5">
              {FLOW_CARDS.map((card, index) => (
                <div key={card.id} className="flex items-center gap-1.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-all ${COLOR_MAP[card.color].dot} ${
                      currentPath === card.navigateTo ? 'scale-150' : 'opacity-40'
                    }`}
                  />
                  {index < FLOW_CARDS.length - 1 && (
                    <div className="w-4 h-px bg-slate-600" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <ChevronDown size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="mx-6 mt-4 mb-2">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            业务闭环导航
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title="折叠"
            aria-label="折叠业务闭环导航"
          >
            <ChevronUp size={14} />
          </button>
        </div>

        {/* 流程卡片 */}
        <div className="flex items-stretch gap-2">
          {FLOW_CARDS.map((card, index) => {
            const isActive = currentPath === card.navigateTo
            const colors = COLOR_MAP[card.color]
            return (
              <div key={card.id} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => onNavigate(card.navigateTo)}
                  aria-label={`前往 ${card.step}：${card.title}`}
                  className={`flex-1 flex flex-col gap-1.5 p-3 rounded-lg border transition-all cursor-pointer text-left ${colors.border} ${colors.bg} ${
                    isActive ? 'ring-1 ring-inset ring-white/20' : ''
                  }`}
                >
                  {/* 步骤名 */}
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                    {card.step}
                  </div>
                  {/* 菜单名 */}
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {card.title}
                  </div>
                  {/* 业务说明 */}
                  <div className="text-[11px] text-slate-400 leading-tight">{card.subtitle}</div>
                </button>
                {/* ArrowRight 连接相邻卡片 */}
                {index < FLOW_CARDS.length - 1 && (
                  <ArrowRight
                    size={14}
                    className="flex-shrink-0 text-slate-600"
                    aria-hidden="true"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BusinessFlowBanner
