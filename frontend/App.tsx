import type React from 'react'
import { lazy, Suspense, useCallback, useEffect, useState, useTransition } from 'react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AiAssistant from './components/AiAssistant'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import OnboardingTour from './components/OnboardingTour'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import SinanAvatar from './components/SinanAvatar'
import TopBar from './components/TopBar'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SinanQaPageContextProvider } from './contexts/SinanQaContext'

// 新手教程存储键
const TUTORIAL_COMPLETED_KEY = 'yikong_tutorial_completed'

type SinanQaSource =
  | 'global'
  | 'dashboard'
  | 'sinan'
  | 'gewu'
  | 'kernel'
  | 'huntian'
  | 'tianchou'
  | 'zhixing'

type SinanQaContext = Record<string, unknown>

type SinanQaState = {
  open: boolean
  source: SinanQaSource
  context: SinanQaContext
  draftQuestion: string
}

const AboutUs = lazy(() => import('./pages/AboutUs'))
const CustomerCases = lazy(() => import('./pages/CustomerCases'))
const DashboardCompactDemo = lazy(() => import('./pages/DashboardCompactDemo'))
const Dongwei = lazy(() => import('./pages/Dongwei'))
const Ecosystem = lazy(() => import('./pages/Ecosystem'))
const Huntian = lazy(() => import('./pages/Huntian'))
const KernelConnect = lazy(() => import('./pages/KernelConnect'))
const KnowledgeGraph3DDemo = lazy(() => import('./pages/KnowledgeGraph3DDemo'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const MonitoringDemo = lazy(() => import('./pages/MonitoringDemo'))
const ScenarioBuilder = lazy(() => import('./pages/ScenarioBuilder'))
const Settings = lazy(() => import('./pages/Settings'))
const Simulation = lazy(() => import('./pages/Simulation'))
const SinanAnalysis = lazy(() => import('./pages/SinanAnalysis'))
const SubscriptionValue = lazy(() => import('./pages/SubscriptionValue'))
const Tianchou = lazy(() => import('./pages/Tianchou'))
const Zhixing = lazy(() => import('./pages/Zhixing'))
const VideoPlayer = lazy(() => import('./pages/VideoPlayer'))

// 顶部加载进度条组件
const LoadingBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      setProgress(0)
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + 10
        })
      }, 100)
      return () => clearInterval(timer)
    } else {
      setProgress(100)
      const timer = setTimeout(() => setProgress(0), 200)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (progress === 0 && !isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-[100]">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

const normalizeAppPath = (pathname: string): string => {
  if (pathname === '/app') return '/app/'
  return pathname
}

const shouldShowFloatingSinan = (pathname: string): boolean => {
  const normalizedPath = normalizeAppPath(pathname)
  return (
    normalizedPath === '/app/' || normalizedPath === '/app/sinan' || normalizedPath === '/app/gewu'
  )
}

const shouldShowLightweightSinan = (pathname: string): boolean => {
  const normalizedPath = normalizeAppPath(pathname)
  return (
    normalizedPath === '/app/kernel' ||
    normalizedPath === '/app/huntian' ||
    normalizedPath === '/app/tianchou' ||
    normalizedPath === '/app/zhixing'
  )
}

const getSinanQaSource = (pathname: string): SinanQaSource => {
  const normalizedPath = normalizeAppPath(pathname)
  switch (normalizedPath) {
    case '/app/':
      return 'dashboard'
    case '/app/sinan':
      return 'sinan'
    case '/app/gewu':
      return 'gewu'
    case '/app/kernel':
      return 'kernel'
    case '/app/huntian':
      return 'huntian'
    case '/app/tianchou':
      return 'tianchou'
    case '/app/zhixing':
      return 'zhixing'
    default:
      return 'global'
  }
}

const getSinanQaContext = (
  pathname: string,
  search: string,
  locationState: unknown
): SinanQaContext => {
  const normalizedPath = normalizeAppPath(pathname)
  const params = new URLSearchParams(search)
  const stateRecord =
    locationState && typeof locationState === 'object'
      ? (locationState as Record<string, unknown>)
      : undefined
  const searchSequence = params.get('sequence')
  const stateSequence =
    typeof stateRecord?.sequence === 'number'
      ? stateRecord.sequence
      : typeof stateRecord?.anomalyId === 'number'
        ? stateRecord.anomalyId
        : undefined
  const sequence =
    typeof searchSequence === 'string' && searchSequence.length > 0
      ? Number(searchSequence)
      : stateSequence

  if (normalizedPath === '/app/') {
    return {
      page: 'dashboard',
      metrics: { oee: 0.89, downtime: 14, efficiencyTrend: 'up' },
    }
  }

  if (normalizedPath === '/app/sinan') {
    const anomalyRecord =
      stateRecord?.anomaly && typeof stateRecord.anomaly === 'object'
        ? (stateRecord.anomaly as Record<string, unknown>)
        : undefined
    return {
      page: 'sinan',
      anomalyId: params.get('anomalyId') || undefined,
      sequence: Number.isFinite(sequence) ? sequence : undefined,
      anomalySummary:
        typeof anomalyRecord?.phenomenon === 'string'
          ? anomalyRecord.phenomenon
          : typeof anomalyRecord?.defectType === 'string'
            ? anomalyRecord.defectType
            : undefined,
      recommendedSolution:
        typeof stateRecord?.solutionName === 'string' ? stateRecord.solutionName : undefined,
      source: stateRecord,
    }
  }

  if (normalizedPath === '/app/gewu') {
    const anomalyRecord =
      stateRecord?.anomaly && typeof stateRecord.anomaly === 'object'
        ? (stateRecord.anomaly as Record<string, unknown>)
        : undefined
    return {
      page: 'gewu',
      anomalyId: params.get('anomalyId') || undefined,
      lineType: params.get('lineType') || undefined,
      sequence: Number.isFinite(sequence) ? sequence : undefined,
      anomalySummary:
        typeof anomalyRecord?.phenomenon === 'string'
          ? anomalyRecord.phenomenon
          : typeof anomalyRecord?.defectType === 'string'
            ? anomalyRecord.defectType
            : undefined,
      source: stateRecord,
    }
  }

  if (normalizedPath === '/app/kernel') {
    return {
      page: 'kernel',
      scanJobId:
        typeof stateRecord?.scan_job_id === 'string'
          ? stateRecord.scan_job_id
          : params.get('scanJobId') || undefined,
      deviceCount:
        typeof stateRecord?.discovered_count === 'number'
          ? stateRecord.discovered_count
          : typeof stateRecord?.deviceCount === 'number'
            ? stateRecord.deviceCount
            : 3,
      protocol:
        typeof stateRecord?.protocol === 'string'
          ? stateRecord.protocol
          : params.get('protocol') || 'Modbus',
      source: stateRecord,
    }
  }

  if (normalizedPath === '/app/huntian') return { page: 'huntian' }
  if (normalizedPath === '/app/tianchou') return { page: 'tianchou' }
  if (normalizedPath === '/app/zhixing') return { page: 'zhixing' }

  return { page: normalizedPath }
}

const FloatingSinanDock: React.FC<{
  state: SinanQaState
  onOpen: (source: SinanQaSource, context: SinanQaContext, draftQuestion?: string) => void
  onClose: () => void
}> = ({ state, onOpen, onClose }) => {
  const previewMessage =
    state.source === 'dashboard'
      ? '问我异常原因或SOP'
      : state.source === 'sinan'
        ? '问我这条诊断依据'
        : state.source === 'gewu'
          ? '问我当前异常怎么处理'
          : '问我知识图谱或文档依据'

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {!state.open && (
        <div className="relative">
          <div className="pointer-events-none">
            <SinanAvatar
              mode="qa"
              previewMessage={previewMessage}
              showBubble={false}
              className="h-48 w-48"
              onOpen={() => onOpen(state.source, state.context, state.draftQuestion)}
            />
          </div>
          <button
            type="button"
            onClick={() => onOpen(state.source, state.context, state.draftQuestion)}
            className="group absolute inset-0 z-10 rounded-[2rem]"
            aria-label="打开司南问答"
          >
            <div className="absolute -left-48 bottom-28 w-40 rounded-2xl rounded-br-none border border-blue-100 bg-white px-3 py-2 text-left text-xs text-slate-600 shadow-xl transition-all duration-200 group-hover:translate-y-[-2px]">
              <div className="font-semibold text-slate-800">
                {state.source === 'dashboard' ? '司南在线' : '问司南'}
              </div>
              <div className="mt-1 leading-5">{previewMessage}</div>
            </div>
          </button>
        </div>
      )}

      <AiAssistant
        open={state.open}
        onClose={onClose}
        contextData={state.context}
        entrySource={state.source}
        draftQuestion={state.draftQuestion}
      />
    </div>
  )
}

const LightweightSinanEntry: React.FC<{
  state: SinanQaState
  onOpen: (source: SinanQaSource, context: SinanQaContext, draftQuestion?: string) => void
  onClose: () => void
}> = ({ state, onOpen, onClose }) => {
  const defaultQuestion =
    state.source === 'kernel'
      ? '当前设备接入状态有哪些风险需要优先处理？'
      : state.source === 'huntian'
        ? '这次仿真结果说明了什么风险？'
        : state.source === 'tianchou'
          ? '当前优化结果对应的执行建议是什么？'
          : state.source === 'zhixing'
            ? '当前执行状态有哪些异常需要优先处理？'
            : ''

  return (
    <>
      {!state.open && (
        <button
          type="button"
          onClick={() =>
            onOpen(state.source, state.context, state.draftQuestion || defaultQuestion)
          }
          className="fixed bottom-6 right-6 z-50 rounded-full border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-blue-50"
        >
          问司南
        </button>
      )}

      <AiAssistant
        open={state.open}
        onClose={onClose}
        contextData={state.context}
        entrySource={state.source}
        draftQuestion={state.draftQuestion}
      />
    </>
  )
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pageContext, setPageContext] = useState<SinanQaContext>({})
  const location = useLocation()
  const navigate = useNavigate()
  const { showTutorial, clearShowTutorial } = useAuth()
  const [isPending, startTransition] = useTransition()
  const baseContext = getSinanQaContext(location.pathname, location.search, location.state)
  const mergedContext = {
    ...baseContext,
    ...pageContext,
  }
  const [sinanQaState, setSinanQaState] = useState<SinanQaState>({
    open: false,
    source: getSinanQaSource(location.pathname),
    context: mergedContext,
    draftQuestion: '',
  })

  // 完成教程
  const handleTutorialComplete = () => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true')
    clearShowTutorial()
  }

  const handleNavigate = (path: string) => {
    startTransition(() => {
      navigate(path)
    })
    setSidebarOpen(false)
  }

  const handleSetPageContext = useCallback((context: SinanQaContext) => {
    setPageContext(context)
  }, [])

  const handleClearPageContext = useCallback(() => {
    setPageContext({})
  }, [])

  useEffect(() => {
    const routeKey = `${location.pathname}?${location.search}`
    void routeKey
    setPageContext({})
  }, [location.pathname, location.search])

  useEffect(() => {
    setSinanQaState((prev) => ({
      ...prev,
      source: getSinanQaSource(location.pathname),
      context: {
        ...getSinanQaContext(location.pathname, location.search, location.state),
        ...pageContext,
      },
      open:
        shouldShowFloatingSinan(location.pathname) || shouldShowLightweightSinan(location.pathname)
          ? prev.open
          : false,
      draftQuestion: prev.draftQuestion,
    }))
  }, [location.pathname, location.search, location.state, pageContext])

  const getTitle = (path: string) => {
    switch (path) {
      case '/app/':
        return '生产可视化'
      case '/app/dashboard-demo':
        return '生产可视化 DEMO'
      case '/app/sinan':
        return '司南智能诊断'
      case '/app/gewu':
        return '格物图谱分析'
      case '/app/huntian':
        return '浑天仿真验证'
      case '/app/tianchou':
        return '天筹优化决策'
      case '/app/zhixing':
        return '执行监控'
      case '/app/subscription-value':
        return '订阅价值复盘'
      case '/app/kernel':
        return 'OS 内核接入'
      case '/app/marketplace':
        return '能力商店'
      case '/app/builder':
        return '场景编排'
      case '/app/ecosystem':
        return '开发者生态'
      case '/app/settings':
        return '系统设置'
      default:
        return '弈控经纬'
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 顶部加载进度条 */}
      <LoadingBar isLoading={isPending} />

      <Sidebar currentPath={location.pathname} onNavigate={handleNavigate} isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar
          title={getTitle(location.pathname)}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <SinanQaPageContextProvider
          value={{
            setPageContext: handleSetPageContext,
            clearPageContext: handleClearPageContext,
          }}
        >
          <main className="flex-1 overflow-auto scroll-smooth">{children}</main>

          {shouldShowFloatingSinan(location.pathname) ? (
            <FloatingSinanDock
              state={{
                ...sinanQaState,
                context: mergedContext,
              }}
              onOpen={(source, context, draftQuestion = '') => {
                setSinanQaState({
                  open: true,
                  source,
                  context,
                  draftQuestion,
                })
              }}
              onClose={() => {
                setSinanQaState((prev) => ({ ...prev, open: false }))
              }}
            />
          ) : shouldShowLightweightSinan(location.pathname) ? (
            <LightweightSinanEntry
              state={{
                ...sinanQaState,
                context: mergedContext,
              }}
              onOpen={(source, context, draftQuestion = '') => {
                setSinanQaState({
                  open: true,
                  source,
                  context,
                  draftQuestion,
                })
              }}
              onClose={() => {
                setSinanQaState((prev) => ({ ...prev, open: false }))
              }}
            />
          ) : null}
        </SinanQaPageContextProvider>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="关闭侧边栏"
        ></button>
      )}

      {/* 新手教程 */}
      <OnboardingTour isActive={showTutorial} onComplete={handleTutorialComplete} />
    </div>
  )
}

// 首次加载的占位组件（保持简洁）
const PageLoader: React.FC = () => (
  <div className="flex h-screen bg-slate-50">
    <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse z-50" />
  </div>
)

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MemoryRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dongwei" element={<Dongwei />} />
            <Route path="/monitoring-demo" element={<MonitoringDemo />} />
            <Route path="/customer-cases" element={<CustomerCases />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/video" element={<VideoPlayer />} />
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<DashboardCompactDemo />} />
                      <Route path="/dashboard-demo" element={<DashboardCompactDemo />} />
                      <Route path="/sinan" element={<SinanAnalysis />} />
                      <Route path="/zhixing" element={<Zhixing />} />
                      <Route path="/subscription-value" element={<SubscriptionValue />} />
                      <Route path="/gewu" element={<KnowledgeGraph3DDemo />} />
                      <Route path="/huntian" element={<Huntian />} />
                      <Route path="/tianchou" element={<Tianchou />} />
                      <Route path="/simulation" element={<Simulation />} />
                      <Route path="/kernel" element={<KernelConnect />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/builder" element={<ScenarioBuilder />} />
                      <Route path="/ecosystem" element={<Ecosystem />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </MemoryRouter>
    </AuthProvider>
  )
}

export default App
