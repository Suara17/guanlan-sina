import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Eye,
  Factory,
  Lightbulb,
  Network,
  Play,
  Settings,
  SkipForward,
  Sparkles,
  Target,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// 教程步骤配置
export interface TourStep {
  id: string
  target: string // CSS选择器
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  icon?: React.ReactNode
  features?: Array<{
    icon: React.ReactNode
    title: string
    description: string
  }>
  flowChart?: Array<{
    step: number
    label: string
    description: string
  }>
}

// 教程步骤配置 - 导出供外部使用
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="logo"]',
    title: '欢迎使用天工·弈控',
    description: '您的智能制造控制中心。让我们快速了解系统的主要功能和操作流程。',
    position: 'right',
    icon: <Factory className="w-5 h-5" />,
    features: [
      {
        icon: <Eye className="w-4 h-4 text-indigo-500" />,
        title: '实时监控',
        description: '生产可视化、异常诊断',
      },
      {
        icon: <Cpu className="w-4 h-4 text-indigo-500" />,
        title: '智能决策',
        description: '优化调度、方案执行',
      },
      {
        icon: <Network className="w-4 h-4 text-indigo-500" />,
        title: '知识沉淀',
        description: '图谱分析、经验复用',
      },
    ],
  },
  {
    id: 'factory-switch',
    target: '[data-tour="factory-switch"]',
    title: '多工厂管理',
    description: '支持多地工厂统一管理，点击切换不同工厂的生产视图。',
    position: 'right',
    icon: <Factory className="w-5 h-5" />,
    features: [
      {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        title: '苏州一厂',
        description: 'SMT贴片生产线',
      },
      {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        title: '越南工厂',
        description: 'PCB组装线',
      },
    ],
  },
  {
    id: 'monitoring-group',
    target: '[data-tour="monitoring-group"]',
    title: '实时监控模块',
    description: '生产状态实时可视化，智能异常诊断与预警。',
    position: 'right',
    icon: <Eye className="w-5 h-5" />,
    flowChart: [
      { step: 1, label: '生产可视化', description: '查看OEE、产量、质量指标' },
      { step: 2, label: '异常检测', description: '自动识别生产异常' },
      { step: 3, label: '司南诊断', description: 'AI分析异常原因' },
    ],
  },
  {
    id: 'subscription-group',
    target: '[data-tour="subscription-group"]',
    title: '高级分析功能',
    description: '专业分析工具，助力生产优化决策。',
    position: 'right',
    icon: <Lightbulb className="w-5 h-5" />,
    features: [
      {
        icon: <Network className="w-4 h-4 text-blue-500" />,
        title: '格物图谱',
        description: '异常-原因-方案知识图谱',
      },
      {
        icon: <Cpu className="w-4 h-4 text-purple-500" />,
        title: '天筹优化',
        description: '多目标帕累托优化决策',
      },
      {
        icon: <Sparkles className="w-4 h-4 text-amber-500" />,
        title: '浑天仿真',
        description: '方案效果预演验证',
      },
    ],
  },
  {
    id: 'dashboard',
    target: '[data-tour="dashboard-menu"]',
    title: '开始探索：生产可视化',
    description: '从这里进入生产大屏，查看实时生产状态和关键指标。',
    position: 'right',
    icon: <BarChart3 className="w-5 h-5" />,
    flowChart: [
      { step: 1, label: '选择产线', description: '切换查看不同产线' },
      { step: 2, label: '查看指标', description: 'OEE、产量、良率' },
      { step: 3, label: '异常告警', description: '点击异常卡片查看详情' },
      { step: 4, label: '发起诊断', description: 'AI分析异常原因' },
    ],
  },
]

// 页面功能指引配置
export const PAGE_GUIDES: Record<string, TourStep[]> = {
  dashboard: [
    {
      id: 'dashboard-overview',
      target: '[data-tour="dashboard-metrics"]',
      title: '生产指标概览',
      description: '实时显示OEE、产量、良率等核心指标',
      position: 'bottom',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'dashboard-anomaly',
      target: '[data-tour="dashboard-anomaly"]',
      title: '异常告警面板',
      description: '点击异常卡片可查看详情并发起AI诊断',
      position: 'left',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ],
  tianchou: [
    {
      id: 'tianchou-config',
      target: '[data-tour="tianchou-config"]',
      title: '优化任务配置',
      description: '设置优化目标、约束条件和算法参数',
      position: 'right',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'tianchou-results',
      target: '[data-tour="tianchou-results"]',
      title: '帕累托前沿',
      description: '多目标优化结果可视化，选择最佳方案',
      position: 'left',
      icon: <Target className="w-5 h-5" />,
    },
  ],
  gewu: [
    {
      id: 'gewu-canvas',
      target: '[data-tour="gewu-canvas"]',
      title: '知识图谱画布',
      description: '拖拽、缩放查看异常-原因-方案关系',
      position: 'bottom',
      icon: <Network className="w-5 h-5" />,
    },
  ],
}

interface OnboardingTourProps {
  steps?: TourStep[]
  onComplete: () => void
  isActive: boolean
}

// 获取目标元素的位置信息
const getTargetPosition = (selector: string): DOMRect | null => {
  const element = document.querySelector(selector)
  return element?.getBoundingClientRect() || null
}

// 计算提示框位置
const calculateTooltipPosition = (
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  preferredPosition: TourStep['position'] = 'auto'
): { top: number; left: number; position: string } => {
  const padding = 16
  const offset = 12
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let top = 0
  let left = 0
  let position = preferredPosition

  // 自动选择最佳位置
  if (position === 'auto') {
    const spaceRight = viewportWidth - targetRect.right
    const spaceLeft = targetRect.left
    const spaceBottom = viewportHeight - targetRect.bottom
    const spaceTop = targetRect.top

    if (spaceRight >= tooltipWidth + padding) {
      position = 'right'
    } else if (spaceLeft >= tooltipWidth + padding) {
      position = 'left'
    } else if (spaceBottom >= tooltipHeight + padding) {
      position = 'bottom'
    } else {
      position = 'top'
    }
  }

  switch (position) {
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
      left = targetRect.right + offset
      break
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
      left = targetRect.left - tooltipWidth - offset
      break
    case 'bottom':
      top = targetRect.bottom + offset
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
      break
    case 'top':
    default:
      top = targetRect.top - tooltipHeight - offset
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
      break
  }

  // 边界检测
  top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding))
  left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))

  return { top, left, position }
}

// 流程图组件
const FlowChart: React.FC<{
  steps: Array<{ step: number; label: string; description: string }>
}> = ({ steps }) => (
  <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2">
    {steps.map((step, index) => (
      <div key={step.step} className="flex items-center flex-shrink-0">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/30">
            {step.step}
          </div>
          <div className="mt-1.5 text-center max-w-[72px]">
            <div className="text-xs font-medium text-slate-700 truncate">{step.label}</div>
            <div className="text-[10px] text-slate-400 truncate">{step.description}</div>
          </div>
        </div>
        {index < steps.length - 1 && (
          <ArrowRight className="w-4 h-4 text-slate-300 mx-1 flex-shrink-0" />
        )}
      </div>
    ))}
  </div>
)

// 功能特性列表组件
const FeatureList: React.FC<{
  features: Array<{ icon: React.ReactNode; title: string; description: string }>
}> = ({ features }) => (
  <div className="mt-4 space-y-2">
    {features.map((feature, index) => (
      <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50/80">
        <div className="flex-shrink-0 mt-0.5">{feature.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-700">{feature.title}</div>
          <div className="text-[10px] text-slate-500">{feature.description}</div>
        </div>
      </div>
    ))}
  </div>
)

// 提示气泡组件
const TooltipPopover: React.FC<{
  step: TourStep
  currentStep: number
  totalSteps: number
  targetRect: DOMRect | null
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}> = ({ step, currentStep, totalSteps, targetRect, onNext, onPrev, onSkip }) => {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (targetRect && tooltipRef.current) {
      const { offsetWidth, offsetHeight } = tooltipRef.current
      const newPos = calculateTooltipPosition(targetRect, offsetWidth, offsetHeight, step.position)
      setPosition({ top: newPos.top, left: newPos.left })
    }
  }, [targetRect, step.position])

  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[10002] w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ top: position.top, left: position.left }}
    >
      {/* 进度条 */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* 内容区 */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {step.icon && (
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                {step.icon}
              </div>
            )}
            <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="跳过教程"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>

        {/* 功能特性列表 */}
        {step.features && <FeatureList features={step.features} />}

        {/* 流程图 */}
        {step.flowChart && <FlowChart steps={step.flowChart} />}
      </div>

      {/* 底部操作区 */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        {/* 步骤指示器 */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep ? 'bg-indigo-500' : i < currentStep ? 'bg-indigo-300' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* 按钮组 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <SkipForward size={14} />
            跳过
          </button>
          {!isFirstStep && (
            <button
              type="button"
              onClick={onPrev}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              上一步
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          >
            {isLastStep ? '开始使用' : '下一步'}
            {!isLastStep && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// 聚光灯遮罩组件
const SpotlightOverlay: React.FC<{
  targetRect: DOMRect | null
}> = ({ targetRect }) => {
  const padding = 8
  const borderRadius = 8

  if (!targetRect) {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-900/70" />
    )
  }

  // 计算镂空区域
  const cutout = {
    x: targetRect.left - padding,
    y: targetRect.top - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  }

  return (
    <svg className="fixed inset-0 z-[10000] w-full h-full pointer-events-none">
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={cutout.x}
            y={cutout.y}
            width={cutout.width}
            height={cutout.height}
            rx={borderRadius}
            ry={borderRadius}
            fill="black"
          />
        </mask>
        <filter id="spotlight-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* 遮罩层 */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(15, 23, 42, 0.8)"
        mask="url(#spotlight-mask)"
      />
      {/* 高亮边框 */}
      <rect
        x={cutout.x}
        y={cutout.y}
        width={cutout.width}
        height={cutout.height}
        rx={borderRadius}
        ry={borderRadius}
        fill="none"
        stroke="rgba(99, 102, 241, 0.8)"
        strokeWidth="2"
        filter="url(#spotlight-glow)"
        className="animate-pulse"
      />
    </svg>
  )
}

// 主组件
const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps = TOUR_STEPS,
  onComplete,
  isActive,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const currentStepData = steps[currentStep]

  // 更新目标元素位置
  const updateTargetPosition = useCallback(() => {
    if (currentStepData) {
      const rect = getTargetPosition(currentStepData.target)
      setTargetRect(rect)
    }
  }, [currentStepData])

  // 监听步骤变化
  useEffect(() => {
    if (isActive && currentStepData) {
      // 延迟一帧确保DOM已更新
      requestAnimationFrame(() => {
        updateTargetPosition()
        setIsVisible(true)
      })
    }
  }, [isActive, currentStep, currentStepData, updateTargetPosition])

  // 监听窗口大小变化
  useEffect(() => {
    if (isActive) {
      window.addEventListener('resize', updateTargetPosition)
      window.addEventListener('scroll', updateTargetPosition, true)
      return () => {
        window.removeEventListener('resize', updateTargetPosition)
        window.removeEventListener('scroll', updateTargetPosition, true)
      }
    }
  }, [isActive, updateTargetPosition])

  // 键盘导航
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          handleNext()
          break
        case 'ArrowLeft':
          handlePrev()
          break
        case 'Escape':
          handleSkip()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, currentStep])

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }, [currentStep, steps.length])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    handleComplete()
  }, [])

  const handleComplete = useCallback(() => {
    setIsVisible(false)
    onComplete()
  }, [onComplete])

  // 滚动到目标元素
  useEffect(() => {
    if (currentStepData && isActive) {
      const element = document.querySelector(currentStepData.target)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentStepData, isActive])

  if (!isActive || !isVisible || !currentStepData) {
    return null
  }

  return (
    <>
      <SpotlightOverlay targetRect={targetRect} />
      <TooltipPopover
        step={currentStepData}
        currentStep={currentStep}
        totalSteps={steps.length}
        targetRect={targetRect}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
      />
    </>
  )
}

export default OnboardingTour