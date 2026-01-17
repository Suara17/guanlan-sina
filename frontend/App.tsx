
import React, { useState } from 'react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import KernelConnect from './pages/KernelConnect';
import Marketplace from './pages/Marketplace';
import ScenarioBuilder from './pages/ScenarioBuilder';
import SinanAnalysis from './pages/SinanAnalysis';
import AiAssistant from './components/AiAssistant';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = (path: string) => {
    switch (path) {
      case '/': return '生产可视化';
      case '/sinan': return '司南智能诊断';
      case '/kernel': return 'OS 内核接入';
      case '/marketplace': return '能力商店';
      case '/builder': return '场景编排';
      case '/ecosystem': return '开发者生态';
      default: return '天工·弈控';
    }
  };

  // Only show the floating global AI Assistant on pages where Sinan isn't the main focus
  // On Dashboard and Sinan Analysis, Sinan is integrated into the UI
  const showGlobalAi = !['/', '/sinan'].includes(location.pathname);

  // Simulated context data for the AI Assistant based on current view
  const getContextData = () => {
     if (location.pathname === '/') {
        return { page: 'Dashboard', metrics: { oee: 0.89, downtime: 14, efficiencyTrend: 'up' } };
     } else if (location.pathname === '/kernel') {
        return { page: 'Kernel', deviceCount: 3, protocol: 'Modbus' };
     }
     return { page: location.pathname };
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentPath={location.pathname} 
        onNavigate={(path) => {
            navigate(path);
            setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar 
            title={getTitle(location.pathname)} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-auto scroll-smooth">
          {children}
        </main>

        {showGlobalAi && <AiAssistant contextData={getContextData()} />}
      </div>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

const EcosystemPlaceholder = () => (
    <div className="p-10 flex flex-col items-center justify-center text-slate-400 h-full">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">
            🛠️
        </div>
        <h2 className="text-xl font-bold text-slate-600">开发者生态</h2>
        <p className="mt-2">OpenAPI 门户与开发者沙箱正在建设中...</p>
    </div>
);

const App: React.FC = () => {
  return (
    <MemoryRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sinan" element={<SinanAnalysis />} />
          <Route path="/kernel" element={<KernelConnect />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/builder" element={<ScenarioBuilder />} />
          <Route path="/ecosystem" element={<EcosystemPlaceholder />} />
        </Routes>
      </Layout>
    </MemoryRouter>
  );
};

export default App;