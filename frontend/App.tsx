import type React from 'react'
import { useState } from 'react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AiAssistant from './components/AiAssistant'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { AuthProvider } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Huntian from './pages/Huntian'
import KernelConnect from './pages/KernelConnect'
import KnowledgeGraph from './pages/KnowledgeGraph'
import Marketplace from './pages/Marketplace'
import ScenarioBuilder from './pages/ScenarioBuilder'
import SinanAnalysis from './pages/SinanAnalysis'
import Tianchou from './pages/Tianchou'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

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
      case '/app/kernel':
        return 'OS 内核接入'
      case '/app/marketplace':
        return '能力商店'
      case '/app/builder':
        return '场景编排'
      case '/app/ecosystem':
        return '开发者生态'
      default:
        return '天工·弈控'
    }
  }

  // Only show the floating global AI Assistant on pages where Sinan isn't the main focus
  // On Dashboard and Sinan Analysis, Sinan is integrated into the UI
  const showGlobalAi = !['/app/', '/app/sinan'].includes(location.pathname)

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
    </div>
  )
}

const EcosystemPlaceholder = () => (
  <div className="p-10 flex flex-col items-center justify-center text-slate-400 h-full">
    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">
      🛠️
    </div>
    <h2 className="text-xl font-bold text-slate-600">开发者生态</h2>
    <p className="mt-2">OpenAPI 门户与开发者沙箱正在建设中...</p>
  </div>
)

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/sinan" element={<SinanAnalysis />} />
                    <Route path="/gewu" element={<KnowledgeGraph />} />
                    <Route path="/huntian" element={<Huntian />} />
                    <Route path="/tianchou" element={<Tianchou />} />
                    <Route path="/kernel" element={<KernelConnect />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/builder" element={<ScenarioBuilder />} />
                    <Route path="/ecosystem" element={<EcosystemPlaceholder />} />
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
