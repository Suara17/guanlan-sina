import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Factory,
  Globe,
  Globe2,
  Layers,
  MessageCircle,
  MonitorDot,
  Network,
  Orbit,
  Play,
  Radar,
  Server,
  Shield,
  Target,
  Users,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TiangongLogo from './TiangongLogo'

// 行业数据类型定义
interface IndustryData {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  gradient: string
  description: string
  highlights: string[]
  companies: { name: string; desc: string }[]
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [activeEngine, setActiveEngine] = useState<number>(0)
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const ENGINES = [
    {
      id: 0,
      name: '洞微 (Dongwei)',
      sub: '工业感知引擎',
      icon: Eye,
      desc: '毫秒级数据采集，洞察设备细微波动。通过边缘计算实现数据初筛，构建工厂第一级感知网。',
    },
    {
      id: 1,
      name: '格物 (Gewu)',
      sub: '知识图谱引擎',
      icon: Layers,
      desc: '构建工业知识图谱，沉淀领域专家经验。通过语义关联实现知识推理，为智能决策提供知识支撑。',
    },
    {
      id: 2,
      name: '天筹 (Tianchou)',
      sub: '智能决策引擎',
      icon: Cpu,
      desc: '基于 AI 强化学习算法，实现排产与调度的全局最优解。动态应对扰动，重构柔性制造逻辑。',
    },
    {
      id: 3,
      name: '浑天 (Huntian)',
      sub: '全局仿真引擎',
      icon: MonitorDot,
      desc: '超实时演练推演，预测未来生产趋势。在决策下发前进行压力测试，确保物理世界"零试错"。',
    },
  ]

  // 行业数据 - 基于行业数据.txt文件内容
  const INDUSTRIES: IndustryData[] = [
    {
      id: 'autoparts',
      name: '汽配制造',
      icon: Factory,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      description: '汽配行业智能化解决方案，专注高混流产线的动态瓶颈治理与工艺参数自适应优化。成都某汽配厂试点将瓶颈响应从30分钟缩短至45秒。',
      highlights: [
        '视-空协同：实时感知瓶颈漂移，自动调整AGV路径',
        '缺陷趋势反向优化工艺参数',
        '分钟级自适应调度响应',
      ],
      companies: [
        { name: '西门子', desc: '18.5%市场份额，Opcenter系列，实施周期12-18个月，首年TCO 300-500万元，面向大型车企汽配厂' },
        { name: '成都某汽配厂', desc: '天工·弈控试点项目，瓶颈响应从30分钟缩短至45秒，ROI周期5.8个月' },
      ],
    },
    {
      id: 'electronics',
      name: '电子组装',
      icon: Cpu,
      color: 'violet',
      gradient: 'from-violet-500 to-violet-600',
      description: '电子组装行业轻量级智能协同方案，实现生产数据在线化与透明化，专注长三角地区中小型离散制造企业。',
      highlights: [
        '云原生SaaS架构，即开即用',
        '移动端无缝连接一线工人',
        '实时进度追踪与异常预警',
      ],
      companies: [
        { name: '黑湖科技', desc: '超3万家付费工厂用户，国产轻量级MES榜首，部署周期2-4周，首年投入5-15万元，中小微企业渗透率60%+' },
        { name: '长三角电子组装厂', desc: '云原生SaaS模式，按年订阅约7万元/年，快速部署解决管理协同问题' },
      ],
    },
    {
      id: 'aerospace',
      name: '航空航天',
      icon: Orbit,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      description: '航空航天高端制造业数字化双胞胎方案，提供高保真静态仿真与虚拟验证能力，确保物理世界"零试错"。',
      highlights: [
        '全栈数字化双胞胎方案',
        'Teamcenter统一数据底座，PLM打通设计到制造',
        '虚拟环境下的压力测试验证',
      ],
      companies: [
        { name: '西门子', desc: '目标客户为大型国企、跨国车企、航空航天企业，基于Teamcenter实现高保真静态仿真' },
        { name: '达索', desc: '国际全能型厂商，提供全栈式数字化双胞胎方案，面向高端制造业' },
      ],
    },
    {
      id: 'automotive',
      name: '汽车制造',
      icon: Globe,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      description: '汽车整车制造智能排产与调度方案，应对多车型混线生产的复杂场景，支持EV产线适应性改造。',
      highlights: [
        '多车型混线智能排产',
        'EV产线输送设备适应性改造',
        '涂装车间智能调度',
      ],
      companies: [
        { name: '广汽传祺', desc: '一线涂装车间EV车型输送设备适应性改造项目，首年投入约550万元人民币' },
        { name: '西门子', desc: '汽配厂中标公告显示单项目金额超300万元，工艺变更重配置需14-21天' },
      ],
    },
    {
      id: 'precision',
      name: '精密加工',
      icon: Target,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      description: '精密加工行业机器视觉质检方案，基于深度学习实现高精度缺陷识别，单点检测精度可达99.9%。',
      highlights: [
        'VM算法平台，深度学习缺陷识别',
        'OK/NG信号实时输出',
        '硬件销售+点位授权模式',
      ],
      companies: [
        { name: '海康机器人', desc: '25%+市场份额，机器视觉领域第一，单条产线投入20-80万元，检测精度99.9%' },
        { name: '成都电子厂', desc: 'AOI检测设备采购，单套设备3-15万元，但76%设备未与MES系统打通' },
      ],
    },
    {
      id: 'equipment',
      name: '智能装备',
      icon: Server,
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600',
      description: '智能装备制造业视-空协同解决方案，RK3588边缘计算盒子成本控制在3000元以内，系统部署门槛降低90%。',
      highlights: [
        '视-空协同智能决策',
        '边缘计算毫秒级响应',
        '若无法提升OEE达8%以上，退还服务费',
      ],
      companies: [
        { name: '宝信软件', desc: '国产协同型厂商代表，侧重流程在线化与轻量化协同' },
        { name: '凌云光', desc: '单点技术型厂商，专注图像处理与缺陷识别，输出OK/NG信号' },
      ],
    },
  ]

  // 保留现有的登录导航功能
  const handleLoginClick = () => {
    navigate('/login')
  }

  const handleDashboardClick = () => {
    navigate('/dashboard')
  }

  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-blue-100">
      {/* 1. Header - 简约高级悬浮导航 */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 lg:px-20 flex items-center justify-between h-20 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center gap-2">
          <TiangongLogo size={36} variant={scrolled ? 'light' : 'dark'} animate={true} />
          <span
            className={`font-bold text-xl tracking-tight uppercase italic transition-colors duration-500 ${
              scrolled ? 'text-slate-900' : 'text-white'
            }`}
          >
            天工·弈控
          </span>
        </div>

        <div
          className={`hidden md:flex items-center gap-10 text-sm font-semibold transition-colors duration-500 ${
            scrolled ? 'text-slate-500' : 'text-slate-200'
          }`}
        >
          <a
            href="#"
            className={`inline-block transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 ${
              scrolled ? 'text-blue-600' : 'text-white font-bold'
            }`}
          >
            首页
          </a>
          <a
            href="#engines"
            className={`relative group cursor-pointer flex items-center gap-1 transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 ${
              scrolled ? 'hover:text-slate-900' : 'hover:text-white'
            }`}
          >
            产品系统 <ChevronDown size={14} />
          </a>
          <button
            type="button"
            onClick={() => navigate('/monitoring-demo')}
            className={`inline-block transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 ${
              scrolled ? 'hover:text-slate-900' : 'hover:text-white'
            }`}
          >
            监控演示
          </button>
          <button
            type="button"
            onClick={() => navigate('/customer-cases')}
            className={`inline-block transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 ${
              scrolled ? 'hover:text-slate-900' : 'hover:text-white'
            }`}
          >
            客户案例
          </button>
          <button
            type="button"
            onClick={() => navigate('/about-us')}
            className={`inline-block transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 ${
              scrolled ? 'hover:text-slate-900' : 'hover:text-white'
            }`}
          >
            关于我们
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLoginClick}
            className={`text-sm font-bold transition-colors duration-500 px-4 py-2 ${
              scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-slate-200 hover:text-white'
            }`}
          >
            登录系统
          </button>
          <button
            onClick={handleDashboardClick}
            className={`px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all duration-500 ${
              scrolled
                ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                : 'bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white shadow-white/10'
            }`}
          >
            申请试用
          </button>
        </div>
      </nav>

      {/* 2. Hero Section - 优化后的科技感背景 */}
      <section className="relative min-h-[85vh] flex items-center pt-20 pb-12 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* 动态网格背景 */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        ></div>

        {/* 光晕效果 */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/30 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse delay-700"></div>

        <div className="container mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6 shadow-lg">
              <Shield size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-300 tracking-wider uppercase">
                新一代工业数字孪生操作系统
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-[1.1]">
              赋能制造 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                智控未来
              </span>
            </h1>
            <div className="text-xs md:text-sm lg:text-base text-slate-400 mb-10 leading-relaxed space-y-1 md:space-y-2">
              <p className="whitespace-nowrap">
                打破数据孤岛，实现物理车间与数字世界的毫秒级虚实共生。
              </p>
              <p className="whitespace-nowrap">
                基于"1+N+X"架构，为现代工厂提供全栈式算法支撑。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <button
                onClick={handleDashboardClick}
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-base hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
              >
                立即体验 Demo{' '}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
                <span className="text-xs font-semibold text-blue-300 uppercase">
                  端到端同步延迟
                </span>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-white tracking-tight">1+N+X</span>
                <span className="text-xs font-semibold text-blue-300 uppercase">生态架构</span>
              </div>
            </div>
          </div>

          {/* 右侧装饰：抽象几何科技感 */}
          <div className="hidden lg:block relative h-[500px]">
            {/* 背景光晕效果 */}
            <div className="absolute inset-0 overflow-hidden">
              {/* 主光晕 - 蓝色 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/25 rounded-full blur-[120px] animate-pulse"></div>
              {/* 辅助光晕 - 青色 */}
              <div className="absolute top-1/4 right-1/4 w-[250px] h-[250px] bg-cyan-400/20 rounded-full blur-[100px] animate-pulse delay-300"></div>
              {/* 辅助光晕 - 紫色 */}
              <div className="absolute bottom-1/4 left-1/3 w-[200px] h-[200px] bg-violet-500/15 rounded-full blur-[80px] animate-pulse delay-700"></div>
            </div>

            {/* 核心视觉：渐变球体组合 */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* 主球体 - 核心 */}
              <div className="relative">
                {/* 外层光圈 */}
                <div className="absolute -inset-10 rounded-full border border-blue-400/20 animate-spin" style={{ animationDuration: '20s' }}></div>
                <div className="absolute -inset-16 rounded-full border border-cyan-400/10 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }}></div>
                
                {/* 主球体 */}
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-400 shadow-2xl shadow-blue-500/50">
                  {/* 内部高光 */}
                  <div className="absolute top-3 left-5 w-12 h-8 bg-white/30 rounded-full blur-xl"></div>
                  {/* 底部反光 */}
                  <div className="absolute bottom-5 right-5 w-8 h-4 bg-cyan-300/20 rounded-full blur-lg"></div>
                  {/* 核心图标 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Globe2 size={44} className="text-white/90" strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* 卫星球体 - 左上 (洞微-感知) */}
              <div className="absolute top-16 left-16">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 shadow-xl shadow-violet-500/40 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="absolute top-1.5 left-2.5 w-5 h-3 bg-white/30 rounded-full blur-md"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Radar size={24} className="text-white/90" strokeWidth={1.5} />
                  </div>
                </div>
                {/* 连接线 */}
                <div className="absolute top-1/2 left-full w-16 h-px bg-gradient-to-r from-violet-400/60 to-transparent"></div>
                {/* 标签 */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs font-semibold text-violet-300">洞微·感知</span>
                </div>
              </div>

              {/* 卫星球体 - 右上 (天筹-决策) */}
              <div className="absolute top-16 right-16">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-xl shadow-cyan-500/40 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                  <div className="absolute top-1.5 left-2 w-5 h-3 bg-white/30 rounded-full blur-sm"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target size={24} className="text-white/90" strokeWidth={1.5} />
                  </div>
                </div>
                {/* 连接线 */}
                <div className="absolute top-1/2 right-full w-16 h-px bg-gradient-to-l from-cyan-400/60 to-transparent"></div>
                {/* 标签 */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs font-semibold text-cyan-300">天筹·决策</span>
                </div>
              </div>

              {/* 卫星球体 - 左下 (格物-图谱) */}
              <div className="absolute bottom-24 left-20">
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-xl shadow-blue-500/40 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                  <div className="absolute top-1 left-1.5 w-4 h-2.5 bg-white/30 rounded-full blur-sm"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Network size={20} className="text-white/90" strokeWidth={1.5} />
                  </div>
                </div>
                {/* 标签 */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs font-semibold text-blue-300">格物·图谱</span>
                </div>
              </div>

              {/* 卫星球体 - 右下 (浑天-仿真) */}
              <div className="absolute bottom-24 right-20">
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/40 animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '0.8s' }}>
                  <div className="absolute top-1 left-1.5 w-4 h-2.5 bg-white/30 rounded-full blur-sm"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Orbit size={20} className="text-white/90" strokeWidth={1.5} />
                  </div>
                </div>
                {/* 标签 */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs font-semibold text-emerald-300">浑天·仿真</span>
                </div>
              </div>

              {/* 装饰性粒子 */}
              <div className="absolute top-1/3 left-1/4 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping opacity-60"></div>
              <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '2s' }}></div>
              <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1.5s' }}></div>
            </div>

            {/* 底部数据指标条 */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-8 pb-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">12 产线在线</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <Zap size={12} className="text-amber-400" />
                <span className="text-xs text-slate-400">实时同步</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <Shield size={12} className="text-blue-400" />
                <span className="text-xs text-slate-400">99.9% 可用</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Engines Section - 优化后的紧凑卡片布局 */}
      <section id="engines" className="py-24 px-6 lg:px-16 bg-white overflow-hidden relative">
        <div
          className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        ></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter text-slate-900">
                四大引擎系统
              </h2>
              <p className="text-slate-600 max-w-lg text-sm md:text-base whitespace-nowrap">
                天工操作系统核心能力矩阵，覆盖感知、建模、决策与仿真全生命周期。
              </p>
            </div>
            <div className="flex gap-2">
              {ENGINES.map((e) => (
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
              const Icon = engine.icon
              const isActive = activeEngine === engine.id
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
                  <div
                    className={`mb-6 p-4 rounded-2xl w-fit transition-all duration-500 ${
                      isActive ? 'bg-white/20 backdrop-blur-sm' : 'bg-white group-hover:bg-blue-50'
                    }`}
                  >
                    <Icon
                      className={`transition-colors ${isActive ? 'text-white' : 'text-blue-600'}`}
                      size={32}
                    />
                  </div>

                  {/* 标题 */}
                  <h3
                    className={`font-black tracking-tight mb-2 transition-all ${isActive ? 'text-white text-2xl' : 'text-slate-900 text-xl group-hover:text-blue-600'}`}
                  >
                    {engine.name.split(' ')[0]}
                  </h3>

                  {/* 英文名称 */}
                  <p
                    className={`text-xs font-bold uppercase tracking-wider mb-4 transition-all ${isActive ? 'text-blue-100' : 'text-slate-500'}`}
                  >
                    {engine.name.match(/\(([^)]+)\)/)?.[1]}
                  </p>

                  {/* 副标题 */}
                  <p
                    className={`text-sm font-semibold mb-3 transition-all ${isActive ? 'text-white/90' : 'text-blue-600'}`}
                  >
                    {engine.sub}
                  </p>

                  {/* 描述 */}
                  <p
                    className={`text-sm leading-relaxed transition-all ${isActive ? 'text-white/80' : 'text-slate-600'}`}
                  >
                    {engine.desc}
                  </p>

                  {/* 底部按钮 */}
                  <div
                    className={`mt-6 pt-6 border-t transition-all ${isActive ? 'border-white/20' : 'border-slate-200'}`}
                  >
                    <button
                      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider group/btn transition-all ${isActive ? 'text-white' : 'text-blue-600'}`}
                    >
                      <span>进入控制台</span>
                      <ArrowRight
                        size={14}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
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

      {/* 4. Customer Cases - 行业交互展示 */}
      <section id="cases" className="py-20 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter text-slate-900">
              赋能头部行业
            </h2>
            <p className="text-slate-600 mb-4">深耕离散制造 6 个关键领域，点击查看行业详情与案例</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm md:text-base">
              <span className="flex items-center gap-2">
                <span className="text-slate-500">产能提升</span>
                <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xl font-bold rounded-lg shadow-sm">+18.5%</span>
              </span>
              <span className="hidden md:inline text-slate-300">|</span>
              <span className="flex items-center gap-2">
                <span className="text-slate-500">能耗降低</span>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl font-bold rounded-lg shadow-sm">-12.0%</span>
              </span>
              <span className="hidden md:inline text-slate-300">|</span>
              <span className="flex items-center gap-2">
                <span className="text-slate-500">故障停机</span>
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xl font-bold rounded-lg shadow-sm">-35.0%</span>
              </span>
            </div>
          </div>

          {/* 行业标签卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {INDUSTRIES.map((industry) => {
              const Icon = industry.icon
              const isActive = activeIndustry === industry.id
              return (
                <button
                  key={industry.id}
                  onClick={() => setActiveIndustry(isActive ? null : industry.id)}
                  className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left ${
                    isActive
                      ? `bg-gradient-to-br ${industry.gradient} border-transparent shadow-xl scale-105`
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg'
                  }`}
                >
                  {/* 背景装饰 */}
                  {isActive && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                  )}
                  
                  {/* 图标 */}
                  <div
                    className={`mb-3 p-2 rounded-xl w-fit transition-all ${
                      isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      size={20}
                      className={`transition-colors ${isActive ? 'text-white' : 'text-slate-600'}`}
                    />
                  </div>

                  {/* 行业名称 */}
                  <h3
                    className={`font-bold text-sm transition-colors ${
                      isActive ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'
                    }`}
                  >
                    {industry.name}
                  </h3>

                  {/* 展开指示器 */}
                  <div
                    className={`absolute bottom-2 right-2 transition-all ${
                      isActive ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* 展开详情面板 */}
          <div
            className={`transition-all duration-500 ease-out overflow-hidden ${
              activeIndustry ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {activeIndustry && (() => {
              const industry = INDUSTRIES.find((i) => i.id === activeIndustry)
              if (!industry) return null
              const Icon = industry.icon
              
              return (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 lg:p-10 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 左侧：行业描述 */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${industry.gradient}`}>
                          <Icon size={24} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{industry.name}</h3>
                      </div>
                      
                      <p className="text-slate-600 mb-6 leading-relaxed">{industry.description}</p>

                      {/* 核心亮点 */}
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                          核心能力
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {industry.highlights.map((h, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 代表企业 */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                          代表企业
                        </h4>
                        <div className="space-y-3">
                          {industry.companies.map((company, idx) => (
                            <div
                              key={idx}
                              className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${industry.gradient} flex-shrink-0`}>
                                  <Users size={16} className="text-white" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-900 mb-1">{company.name}</h5>
                                  <p className="text-sm text-slate-600 leading-relaxed">{company.desc}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
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
            <p className="text-sm text-slate-400 leading-relaxed">
              让每一次工业生产都成为一场精密的博弈，以算法之名，弈控未来生产。
            </p>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-10 lg:justify-items-end">
            <div className="space-y-3">
              <p className="text-base font-bold uppercase tracking-wider text-slate-300">产品矩阵</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    洞微感知
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    格物图谱
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    天筹决策
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    浑天仿真
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-base font-bold uppercase tracking-wider text-slate-300">
                支持与资源
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    开发者中心
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    白皮书下载
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    API 文档
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-base font-bold uppercase tracking-wider text-slate-300">联系我们</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>400-223608838</li>
                <li>admin@tiangongna.com</li>
              </ul>
            </div>
          </div>
        </div>
          <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600 uppercase font-semibold tracking-wider">
          <span>© 2025 天工·弈控 Tiangong·Yikong. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Security
            </a>
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
  )
}

export default LandingPage
