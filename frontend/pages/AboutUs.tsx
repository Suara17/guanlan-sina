import {
  Award,
  Building2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Flame,
  Gauge,
  Globe,
  Heart,
  Layers,
  Mail,
  MapPin,
  Medal,
  Network,
  Phone,
  Rocket,
  Shield,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TiangongLogo from '../components/TiangongLogo'

interface TimelineItem {
  year: string
  title: string
  description: string
}

interface TeamMember {
  name: string
  position: string
  background: string
  avatar: string
}

interface Honor {
  title: string
  organization: string
  year: string
}

const AboutUs: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'vision' | 'mission' | 'values'>('vision')
  const [isExpanded, setIsExpanded] = useState(false)

  const timeline: TimelineItem[] = [
    {
      year: '2025 Q1',
      title: '项目启动',
      description:
        '天工·弈控项目正式启动，完成核心架构设计，确定"1+N+X"技术路线。',
    },
    {
      year: '2025 Q2',
      title: '洞微感知引擎',
      description:
        '完成洞微感知引擎基础版开发，实现设备数据采集与边缘计算功能。',
    },
    {
      year: '2025 Q3',
      title: '格物孪生引擎',
      description:
        '格物数字孪生引擎上线，支持工厂数字化建模与虚实映射可视化。',
    },
    {
      year: '2025 Q4',
      title: '天筹决策引擎',
      description:
        '天筹智能决策引擎投入开发，基于多目标优化算法实现排产调度优化。',
    },
  ]

  const team: TeamMember[] = [
    {
      name: '刘同学',
      position: '项目负责人 · 商业分析',
      background: '经管学院，负责项目统筹与商业模式设计',
      avatar: 'L',
    },
    {
      name: '陈同学',
      position: '技术研发负责人',
      background: '计算机学院，专注前端架构与算法实现',
      avatar: 'C',
    },
    {
      name: '张同学',
      position: '技术研发',
      background: '电子信息学院，负责后端开发与系统架构',
      avatar: 'Z',
    },
    {
      name: '王同学',
      position: '美工设计',
      background: '人文学院，负责UI设计与产品视觉呈现',
      avatar: 'W',
    },
  ]

  const honors: Honor[] = [
    { title: '工业数字孪生操作系统', organization: '自主研发', year: '2025' },
    { title: '多目标优化排产算法', organization: '核心技术', year: '2025' },
    { title: '边缘计算数据采集', organization: '自主研发', year: '2025' },
    { title: '虚实映射可视化引擎', organization: '核心技术', year: '2025' },
    { title: '知识图谱构建与应用', organization: '自主研发', year: '2025' },
    { title: '生产数据分析平台', organization: '核心技术', year: '2025' },
  ]

  const capabilities = [
    { icon: Cpu, title: '智能感知', desc: '毫秒级数据采集', color: 'blue' },
    { icon: Network, title: '知识图谱', desc: '沉淀专家经验', color: 'cyan' },
    { icon: Gauge, title: '智能决策', desc: '算法驱动优化', color: 'emerald' },
    { icon: Shield, title: '仿真验证', desc: '超实时推演', color: 'violet' },
  ]

  const values = [
    {
      id: 'vision',
      title: '企业愿景',
      icon: Target,
      summary: '打造国内领先的工业数字孪生操作系统',
      details: '以"视-空协同"技术为核心，构建覆盖感知、建模、决策、验证全生命周期的智能操作系统。我们致力于成为离散制造业数字化转型的首选合作伙伴，通过数字孪生技术打通设备层、边缘层、平台层与应用层的数据壁垒，实现生产过程的透明化、可控化与智能化。在工业4.0时代背景下，天工·弈控将持续深耕离散制造领域，帮助汽配、电子、机械等行业的制造企业突破传统生产模式的效率瓶颈，实现降本增效、提质增能的核心目标。我们期望通过技术创新与场景落地，推动中国制造向中国智造的跨越式发展，为建设制造强国贡献一份力量。未来，我们将继续拓展行业边界，让数字孪生技术惠及更多制造企业，共同开启智能制造的新篇章。',
    },
    {
      id: 'mission',
      title: '企业使命',
      icon: Rocket,
      summary: '打破工业数据孤岛，赋能智能制造',
      details: '以"视-空协同"技术为核心，为离散制造企业提供从数据采集、知识沉淀、智能决策到仿真验证的全栈式解决方案。长期以来，制造企业面临着数据分散、系统割裂、决策滞后等痛点，生产线上的海量数据难以转化为有效的决策支撑。天工·弈控通过构建统一的数字孪生底座，打破工业数据孤岛，实现物理车间与数字世界的毫秒级虚实共生。我们的四大核心引擎——洞微感知引擎实现设备数据的实时采集与边缘处理，格物知识图谱引擎沉淀领域专家经验与工艺知识，天筹智能决策引擎提供排产调度的最优方案，浑天仿真验证引擎支持决策下发前的压力测试与推演预演。让每一次生产决策都有数据支撑，每一次工艺优化都有科学依据，真正实现从经验驱动到数据驱动的转型跨越。',
    },
    {
      id: 'values',
      title: '核心价值观',
      icon: Heart,
      summary: '技术为本 · 客户优先 · 持续创新 · 务实进取',
      details: '技术为本——我们坚信技术是推动行业进步的核心动力，持续投入研发资源，打造具有自主知识产权的核心技术体系。从感知算法到知识图谱，从优化引擎到仿真平台，每一项技术突破都凝聚着团队的智慧与汗水。客户优先——始终以客户需求为导向，深入理解制造企业的真实痛点，提供切实可行的解决方案。我们不仅交付产品，更注重客户价值的实现，陪伴客户走过数字化转型的每一步。持续创新——不断探索工业智能化的新边界，紧跟技术发展趋势，将人工智能、知识图谱、数字孪生等前沿技术与制造场景深度融合。务实进取——在追求技术创新的同时，我们保持务实的态度，脚踏实地解决客户实际问题，不追求华而不实的概念，而是用可靠的产品和专业的服务赢得市场信任，用实际效果说话。',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white font-sans">
      {/* 动态网格背景 */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* 光晕效果 */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-80 h-80 bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed top-1/2 right-1/4 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 lg:px-20 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm">返回首页</span>
            </button>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="flex items-center gap-2">
              <TiangongLogo size={28} variant="dark" animate={true} />
              <span className="font-bold text-lg tracking-tight">天工·弈控</span>
              <span className="text-slate-400 text-sm ml-2">| 关于我们</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              登录系统
            </button>
            <button
              onClick={() => navigate('/monitoring-demo')}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              申请试用
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="pt-24 pb-16 relative z-10">
        {/* Hero区域 - 居中布局 */}
        <section className="px-6 lg:px-20 mb-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center">
              {/* 标签 */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8">
                <Users size={16} className="text-blue-400" />
                <span className="text-sm font-bold text-blue-300 tracking-wider uppercase">
                  ABOUT US
                </span>
              </div>

              {/* 主标题 */}
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">
                  天工·弈控
                </span>
              </h1>

              {/* 副标题 */}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">赋能制造，智控未来</h2>

              {/* 企业简介 */}
              <div className="text-base md:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-12 space-y-2">
                <p className="whitespace-nowrap">
                  天工·弈控是一家专注于工业数字孪生操作系统研发的科技企业。 我们以
                  <span className="text-cyan-400 font-semibold">"视-空协同"</span>
                  技术为核心，
                </p>
                <p className="whitespace-nowrap">
                  致力于为离散制造业提供从数据采集、数字孪生建模、智能决策到仿真验证的全栈式解决方案。
                </p>
              </div>

              {/* 核心能力展示 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mb-12 max-w-4xl mx-auto">
                {capabilities.map((cap, idx) => (
                  <div key={idx} className="group flex flex-col items-center text-center">
                    <div
                      className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${
                        cap.color === 'blue'
                          ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
                          : cap.color === 'cyan'
                            ? 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30'
                            : cap.color === 'emerald'
                              ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30'
                              : 'from-violet-500/20 to-violet-600/20 border-violet-500/30'
                      } border backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300`}
                    >
                      <cap.icon
                        size={36}
                        className={`${
                          cap.color === 'blue'
                            ? 'text-blue-400'
                            : cap.color === 'cyan'
                              ? 'text-cyan-400'
                              : cap.color === 'emerald'
                                ? 'text-emerald-400'
                                : 'text-violet-400'
                        }`}
                      />
                    </div>
                    <div className="text-base md:text-lg font-semibold text-white mb-1">{cap.title}</div>
                    <div className="text-sm text-slate-400">{cap.desc}</div>
                  </div>
                ))}
              </div>

              {/* 分隔线 */}
              <div className="w-full max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-8"></div>

              {/* 数据统计 - 极简风格 */}
              <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-slate-400">
                <div className="text-center">
                  <span className="text-2xl md:text-3xl font-bold text-white mr-1">4</span>
                  <span className="text-sm">核心引擎</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl md:text-3xl font-bold text-white mr-1">10+</span>
                  <span className="text-sm">技术团队</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl md:text-3xl font-bold text-white mr-1">3</span>
                  <span className="text-sm">试点产线</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl md:text-3xl font-bold text-white mr-1">5+</span>
                  <span className="text-sm">研发成果</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 愿景使命价值观 */}
        <section className="px-6 lg:px-20 mb-24">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden">
              {/* Tab导航 */}
              <div className="flex border-b border-white/10">
                {values.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as typeof activeTab)
                        setIsExpanded(false)
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-5 text-sm font-semibold transition-all ${
                        activeTab === item.id
                          ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} />
                      {item.title}
                    </button>
                  )
                })}
              </div>

              {/* 内容区 */}
              <div className="p-10">
                {values.map((item) => (
                  <div
                    key={item.id}
                    className={`transition-all duration-300 ${
                      activeTab === item.id ? 'block' : 'hidden'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <item.icon size={28} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                    </div>
                    <div className="mb-4">
                      <p className="text-xl text-white font-medium leading-relaxed inline">{item.summary}</p>
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-white hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center ml-2 align-middle"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="text-base text-slate-400 leading-relaxed border-l-2 border-blue-500/30 pl-4">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 发展历程 */}
        <section className="px-6 lg:px-20 mb-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
                <Flame size={16} className="text-orange-400" />
                <span className="text-sm font-bold text-orange-300 tracking-wider uppercase">
                  MILESTONE
                </span>
              </div>
              <h2 className="text-3xl font-black mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  发展历程
                </span>
              </h2>
              <p className="text-slate-400">聚焦核心技术突破，稳步推进产品研发</p>
            </div>

            <div className="relative">
              {/* 时间线 */}
              <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-cyan-500 to-blue-500"></div>

              <div className="space-y-8">
                {timeline.map((item, idx) => (
                  <div
                    key={item.year}
                    className={`relative flex items-start gap-8 ${
                      idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                    }`}
                  >
                    {/* 时间节点 */}
                    <div className="absolute left-8 lg:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-4 border-slate-900 z-10 shadow-lg shadow-blue-500/50"></div>

                    {/* 内容卡片 */}
                    <div
                      className={`flex-1 ml-16 lg:ml-0 ${idx % 2 === 0 ? 'lg:pr-16 lg:text-right' : 'lg:pl-16'}`}
                    >
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-blue-500/30 transition-all group">
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                          {item.year}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    {/* 占位 */}
                    <div className="hidden lg:block flex-1"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 核心团队 */}
        <section className="px-6 lg:px-20 mb-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
                <Users size={16} className="text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300 tracking-wider uppercase">
                  TEAM
                </span>
              </div>
              <h2 className="text-3xl font-black mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  核心团队
                </span>
              </h2>
              <p className="text-slate-400">技术驱动，专注产品研发与创新</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 hover:border-blue-500/30 transition-all group"
                >
                  {/* 头像 */}
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-black text-white group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                    {member.avatar}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-sm text-blue-400 mb-3">{member.position}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{member.background}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 技术研发 */}
        <section className="px-6 lg:px-20 mb-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
                <Medal size={16} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-300 tracking-wider uppercase">
                  R&amp;D
                </span>
              </div>
              <h2 className="text-3xl font-black mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  技术研发
                </span>
              </h2>
              <p className="text-slate-400">专注核心技术攻关，持续迭代产品能力</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {honors.map((honor, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex items-start gap-4 hover:bg-white/10 hover:border-amber-500/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/30">
                    <Trophy size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{honor.title}</h3>
                    <p className="text-xs text-slate-400">
                      {honor.organization} · {honor.year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 底部联系信息栏 */}
        <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur-sm mt-12">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-base font-bold text-white">天工·弈控</span>
                <span className="text-slate-600">|</span>
                <span className="text-sm text-slate-400">赋能制造，智控未来</span>
              </div>
              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
                  <Phone size={14} className="text-blue-400" />
                  <span>400-223608838</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
                  <Mail size={14} className="text-emerald-400" />
                  <span>admin@tiangongna.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
                  <MapPin size={14} className="text-violet-400" />
                  <span>天津市西青区</span>
                </div>
              </div>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <button
                  onClick={() => navigate('/monitoring-demo')}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-md text-sm font-medium transition-all"
                >
                  预约演示
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-sm font-medium transition-all"
                >
                  登录系统
                </button>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-white/5 text-center text-xs text-slate-500">
              © 2025 天工·弈控 Tiangong·Yikong. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default AboutUs
