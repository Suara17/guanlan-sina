import type React from 'react'
import { useEffect, useState } from 'react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AiAssistant from './components/AiAssistant'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import OnboardingTour from './components/OnboardingTour'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// 新手教程存储键
const TUTORIAL_COMPLETED_KEY = 'tiangong_tutorial_completed'
import AboutUs from './pages/AboutUs'
import CustomerCases from './pages/CustomerCases'
import Dashboard from './pages/Dashboard'
import Ecosystem from './pages/Ecosystem'
import Huntian from './pages/Huntian'
import KernelConnect from './pages/KernelConnect'
import KnowledgeGraph from './pages/KnowledgeGraph'
import Marketplace from './pages/Marketplace'
import MonitoringDemo from './pages/MonitoringDemo'
import ScenarioBuilder from './pages/ScenarioBuilder'
import Settings from './pages/Settings'
import Simulation from './pages/Simulation'
import SinanAnalysis from './pages/SinanAnalysis'
import SubscriptionValue from './pages/SubscriptionValue'
import Tianchou from './pages/Tianchou'
import Zhixing from './pages/Zhixing'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, showTutorial, clearShowTutorial } = useAuth()

  // 完成教程
  const handleTutorialComplete = () => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true')
    clearShowTutorial()
  }

  const getTitle = (path: string) => {
    switch (path) {
      case '/app/':
        return '生产可视化'
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
        return '天工·弈控'
    }
  }

  // AI Assistant temporarily disabled on all pages
  const showGlobalAi = false

  // Simulated context data for the AI Assistant based on current view
  const getContextData = () => {
    if (location.pathname === '/app/') {
      return {
        page: 'Dashboard',
        metrics: { oee: 0.89, downtime: 14, efficiencyTrend: 'up' },
      }
    } else if (location.pathname === '/app/kernel') {
      return { page: 'Kernel', deviceCount: 3, protocol: 'Modbus' }
    }
    return { page: location.pathname }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        currentPath={location.pathname}
        onNavigate={(path) => {
          navigate(path)
          setSidebarOpen(false)
        }}
        isOpen={sidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar
          title={getTitle(location.pathname)}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto scroll-smooth">{children}</main>

        {showGlobalAi && <AiAssistant contextData={getContextData()} />}
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/monitoring-demo" element={<MonitoringDemo />} />
          <Route path="/customer-cases" element={<CustomerCases />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/sinan" element={<SinanAnalysis />} />
                    <Route path="/zhixing" element={<Zhixing />} />
                    <Route path="/subscription-value" element={<SubscriptionValue />} />
                    <Route path="/gewu" element={<KnowledgeGraph />} />
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
      </MemoryRouter>
    </AuthProvider>
  )
}

export default App
