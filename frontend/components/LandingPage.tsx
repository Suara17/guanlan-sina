import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Zap, Globe, Cpu, Eye, Network, MonitorPlay,
  ArrowRight, Play, CheckCircle, ChevronDown, MessageCircle, BarChart3,
  Factory, Layers, Database, Activity
} from 'lucide-react';
import TiangongLogo from './TiangongLogo';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeEngine, setActiveEngine] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ENGINES = [
    {
      id: 0, name: '洞微 (Dongwei)', sub: '工业感知引擎', icon: Eye,
      desc: '毫秒级数据采集，洞察设备细微波动。通过边缘计算实现数据初筛，构建工厂第一级感知网。'
    },
    {
      id: 1, name: '格物 (Gewu)', sub: '数字孪生引擎', icon: Layers,
      desc: '1:1 还原物理世界，实现虚实映射。建立高精度的数字沙盘，为生产优化提供"上帝视角"。'
    },
    {
      id: 2, name: '天筹 (Tianchou)', sub: '智能决策引擎', icon: Cpu,
      desc: '基于 AI 强化学习算法，实现排产与调度的全局最优解。动态应对扰动，重构柔性制造逻辑。'
    },
    {
      id: 3, name: '浑天 (Huntian)', sub: '全局仿真引擎', icon: MonitorPlay,
      desc: '超实时演练推演，预测未来生产趋势。在决策下发前进行压力测试，确保物理世界"零试错"。'
    }
  ];

  // 保留现有的登录导航功能
  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-blue-100">

      {/* 1. Header - 简约高级悬浮导航 */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 lg:px-20 flex items-center justify-between h-20 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-2">
            <TiangongLogo size={36} variant={scrolled ? "light" : "dark"} animate={true} />
            <span className={`font-bold text-xl tracking-tight uppercase italic transition-colors duration-500 ${
              scrolled ? 'text-slate-900' : 'text-white'
            }`}>天工·弈控</span>
        </div>

        <div className={`hidden md:flex items-center gap-10 text-sm font-semibold transition-colors duration-500 ${
          scrolled ? 'text-slate-500' : 'text-slate-200'
        }`}>
            <a href="#" className={scrolled ? 'text-blue-600' : 'text-white font-bold'}>首页</a>
            <div className={`relative group cursor-pointer flex items-center gap-1 transition-colors ${
              scrolled ? 'hover:text-slate-900' : 'hover:text-white'
            }`}>
                产品系统 <ChevronDown size={14}/>
            </div>
            <a href="#cases" className={scrolled ? 'hover:text-slate-900 transition-colors' : 'hover:text-white transition-colors'}>监控演示</a>
            <a href="#cases" className={scrolled ? 'hover:text-slate-900 transition-colors' : 'hover:text-white transition-colors'}>客户案例</a>
            <a href="#about" className={scrolled ? 'hover:text-slate-900 transition-colors' : 'hover:text-white transition-colors'}>关于我们</a>
        </div>

        <div className="flex items-center gap-4">
            <button onClick={handleLoginClick} className={`text-sm font-bold transition-colors duration-500 px-4 py-2 ${
              scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-slate-200 hover:text-white'
            }`}>登录系统</button>
            <button onClick={handleDashboardClick} className={`px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all duration-500 ${
              scrolled
                ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                : 'bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white shadow-white/10'
            }`}>申请试用</button>
        </div>
      </nav>

      {/* 2. Hero Section - 优化后的科技感背景 */}
      <section className="relative min-h-[85vh] flex items-center pt-20 pb-12 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* 动态网格背景 */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
             style={{backgroundImage: 'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)', backgroundSize: '80px 80px'}}></div>

        {/* 光晕效果 */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/30 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse delay-700"></div>

        <div className="container mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6 shadow-lg">
                    <Shield size={16} className="text-blue-400" />
                    <span className="text-xs font-bold text-blue-300 tracking-wider uppercase">新一代工业数字孪生操作系统</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-[1.1]">
                    赋能制造 <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">智控未来</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed">
                    打破数据孤岛，实现物理车间与数字世界的毫秒级虚实共生。
                    基于"1+N+X"架构，为现代工厂提供全栈式算法支撑。
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <button onClick={handleDashboardClick} className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-base hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer">
                        立即体验 Demo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="group w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-bold text-base hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer">
                        <Play size={18} fill="currentColor" /> 观看宣传片
                    </button>
                </div>

                <div className="mt-12 flex items-center gap-10">
                    <div className="flex flex-col">
                        <span className="text-3xl font-black text-white tracking-tight">85% +</span>
                        <span className="text-xs font-semibold text-blue-300 uppercase">平均 OEE 提升</span>
                    </div>
                    <div className="w-px h-10 bg-white/20"></div>
                    <div className="flex flex-col">
                        <span className="text-3xl font-black text-white tracking-tight">100ms</span>
                        <span className="text-xs font-semibold text-blue-300 uppercase">端到端同步延迟</span>
                    </div>
                    <div className="w-px h-10 bg-white/20"></div>
                    <div className="flex flex-col">
                        <span className="text-3xl font-black text-white tracking-tight">1+N+X</span>
                        <span className="text-xs font-semibold text-blue-300 uppercase">生态架构</span>
                    </div>
                </div>
            </div>

            {/* 右侧装饰：增强的工业科技可视化 */}
            <div className="hidden lg:block relative h-[500px]">
                {/* 主要六边形框架 */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* 外层旋转环 */}
                    <div className="absolute w-[420px] h-[420px] border-2 border-blue-400/30 rounded-full animate-spin-slow"></div>
                    <div className="absolute w-[380px] h-[380px] border border-cyan-400/20 rounded-full animate-spin-reverse"></div>

                    {/* 中心六边形 */}
                    <div className="relative w-72 h-72 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/20 rounded-3xl rotate-45 flex items-center justify-center shadow-2xl">
                        <div className="w-60 h-60 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl -rotate-45 flex items-center justify-center">
                            <Layers className="text-blue-400" size={80} />
                        </div>
                    </div>

                    {/* 四个卫星节点 */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/50 animate-float">
                        <Eye className="text-white" size={28} />
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 -right-6 w-20 h-20 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/50 animate-float delay-300">
                        <Cpu className="text-white" size={28} />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/50 animate-float delay-500">
                        <MonitorPlay className="text-white" size={28} />
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 -left-6 w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/50 animate-float delay-700">
                        <Database className="text-white" size={28} />
                    </div>
                </div>

                {/* 连接线 */}
                <svg className="absolute inset-0 w-full h-full opacity-30">
                    <line x1="50%" y1="15%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse"/>
                    <line x1="85%" y1="50%" x2="50%" y2="50%" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse"/>
                    <line x1="50%" y1="85%" x2="50%" y2="50%" stroke="#a855f7" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse"/>
                    <line x1="15%" y1="50%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse"/>
                </svg>
            </div>
        </div>
      </section>

      {/* 3. Four Engines Section - 优化后的紧凑卡片布局 */}
      <section className="py-24 px-6 lg:px-16 bg-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none"
             style={{backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>

        <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                <div>
                    <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter text-slate-900">四大引擎系统</h2>
                    <p className="text-slate-600 max-w-lg text-base">
                        天工操作系统核心能力矩阵，覆盖感知、建模、决策与仿真全生命周期。
                    </p>
                </div>
                <div className="flex gap-2">
                    {ENGINES.map(e => (
                        <button
                            key={e.id}
                            onClick={() => setActiveEngine(e.id)}
                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${activeEngine === e.id ? 'bg-blue-600 w-10' : 'bg-slate-300 hover:bg-slate-400'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {ENGINES.map((engine) => {
                    const Icon = engine.icon;
                    const isActive = activeEngine === engine.id;
                    return (
                        <div
                            key={engine.id}
                            onMouseEnter={() => setActiveEngine(engine.id)}
                            onClick={() => setActiveEngine(engine.id)}
                            className={`group relative rounded-3xl border-2 overflow-hidden transition-all duration-500 cursor-pointer flex flex-col p-8 ${
                                isActive
                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 shadow-2xl shadow-blue-600/30 scale-105'
                                    : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:shadow-xl'
                            }`}
                        >
                            {/* 图标 */}
                            <div className={`mb-6 p-4 rounded-2xl w-fit transition-all duration-500 ${
                                isActive ? 'bg-white/20 backdrop-blur-sm' : 'bg-white group-hover:bg-blue-50'
                            }`}>
                                <Icon className={`transition-colors ${isActive ? 'text-white' : 'text-blue-600'}`} size={32} />
                            </div>

                            {/* 标题 */}
                            <h3 className={`font-black tracking-tight mb-2 transition-all ${isActive ? 'text-white text-2xl' : 'text-slate-900 text-xl group-hover:text-blue-600'}`}>
                                {engine.name.split(' ')[0]}
                            </h3>

                            {/* 英文名称 */}
                            <p className={`text-xs font-bold uppercase tracking-wider mb-4 transition-all ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                                {engine.name.match(/\(([^)]+)\)/)?.[1]}
                            </p>

                            {/* 副标题 */}
                            <p className={`text-sm font-semibold mb-3 transition-all ${isActive ? 'text-white/90' : 'text-blue-600'}`}>
                                {engine.sub}
                            </p>

                            {/* 描述 */}
                            <p className={`text-sm leading-relaxed transition-all ${isActive ? 'text-white/80' : 'text-slate-600'}`}>
                                {engine.desc}
                            </p>

                            {/* 底部按钮 */}
                            <div className={`mt-6 pt-6 border-t transition-all ${isActive ? 'border-white/20' : 'border-slate-200'}`}>
                                <button className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider group/btn transition-all ${isActive ? 'text-white' : 'text-blue-600'}`}>
                                    <span>进入控制台</span>
                                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            {/* 背景装饰 */}
                            {isActive && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
      </section>

      {/* 4. Customer Cases - 优化后紧凑布局 */}
      <section id="cases" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6 lg:px-16">
            <div className="text-center mb-14">
                <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter text-slate-900">赋能头部企业</h2>
                <p className="text-slate-600">深耕汽车、电子、半导体等 12 个关键制造行业</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16 items-center justify-items-center">
                {['天汽工业', '中国钢铁', '通用机械', '未来能源', '精密模具', '新能材料'].map(l => (
                    <div key={l} className="group cursor-pointer">
                        <div className="text-lg font-black tracking-tight text-slate-400 group-hover:text-slate-900 transition-colors">{l}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[
                    { label: '产能提升', value: '+18.5%', color: 'blue', gradient: 'from-blue-500 to-blue-600', icon: BarChart3 },
                    { label: '能耗降低', value: '-12.0%', color: 'emerald', gradient: 'from-emerald-500 to-emerald-600', icon: Zap },
                    { label: '故障停机', value: '-35.0%', color: 'red', gradient: 'from-red-500 to-red-600', icon: Shield },
                ].map(card => (
                    <div key={card.label} className={`group relative p-8 bg-gradient-to-br ${card.gradient} rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-${card.color}-500/30`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <card.icon className="mb-4 text-white/80" size={32} />
                        <h4 className="text-white/90 font-semibold text-xs uppercase tracking-wider mb-2">{card.label}</h4>
                        <p className="text-4xl font-black text-white tracking-tight">{card.value}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 5. Footer - 优化后紧凑布局 */}
      <footer className="bg-slate-950 text-white py-16 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                    <TiangongLogo size={28} variant="dark" animate={true} />
                    <span className="font-bold text-base tracking-tight uppercase">天工·弈控</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">让每一次工业生产都成为一场精密的博弈，以算法之名，弈控未来生产。</p>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-10 lg:justify-items-end">
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">产品矩阵</p>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><a href="#" className="hover:text-blue-400 transition-colors">洞微感知</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">格物孪生</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">天筹决策</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">浑天仿真</a></li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">支持与资源</p>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><a href="#" className="hover:text-blue-400 transition-colors">开发者中心</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">白皮书下载</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">API 文档</a></li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">联系我们</p>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li>400-223608838</li>
                        <li>admin@tiangongna.com</li>
                    </ul>
                </div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600 uppercase font-semibold tracking-wider">
            <span>© 2024 TIANGONG YIKONG OS</span>
            <div className="flex gap-6">
                <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
                <a href="#" className="hover:text-slate-400 transition-colors">Security</a>
            </div>
        </div>
      </footer>

      {/* Floating Action */}
      <button
        onClick={handleDashboardClick}
        className="fixed bottom-10 right-10 z-40 px-8 py-4 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/30 flex items-center gap-3 font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
      >
          <MessageCircle size={20} /> 在线咨询
      </button>

    </div>
  );
};

export default LandingPage;
