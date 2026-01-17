import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, Eye, Zap } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    // 导航到登录页面
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Company Logo/Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 mb-8">
            <Cpu className="w-8 h-8 text-white" />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            天工·弈控
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-slate-600 mb-8 leading-relaxed">
            面向离散制造业的"视-空协同"智适应操作系统
          </p>

          {/* Description */}
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 sm:p-8 mb-12 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed mb-6">
              基于 1+N+X 生态架构，为离散制造业提供全面的智能化解决方案
            </p>

            {/* Architecture Icons */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <span className="text-sm text-slate-600 font-medium">基础设施层</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">视觉算法</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-slate-600 font-medium">优化引擎</span>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-12">
            <h2 className="text-xl font-semibold mb-4">核心技术栈</h2>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {[
                { name: 'FastAPI', color: 'bg-emerald-500' },
                { name: 'React', color: 'bg-blue-500' },
                { name: 'PostgreSQL', color: 'bg-slate-600' },
                { name: 'Redis', color: 'bg-red-500' },
                { name: 'Celery', color: 'bg-green-500' }
              ].map((tech) => (
                <div
                  key={tech.name}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${tech.color} shadow-sm`}
                >
                  {tech.name}
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleLoginClick}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-105"
            >
              登录系统
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>© 2024 天工·弈控 智适应操作系统</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
