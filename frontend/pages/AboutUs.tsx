import {
  Award,
  Building2,
  Cpu,
  Factory,
  Flame,
  Gauge,
  Globe,
  Heart,
  Hexagon,
  Layers,
  Lightbulb,
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

  const timeline: TimelineItem[] = [
    {
      year: '2019',
      title: '创立起步',
      description: '天工·弈控在杭州成立，核心团队来自清华大学、浙江大学等知名院校，专注于工业互联网与智能制造领域。',
    },
    {
      year: '2020',
      title: '技术突破',
      description: '发布洞微感知引擎1.0，实现毫秒级设备数据采集。完成Pre-A轮融资，获得国内头部汽车制造商首个订单。',
    },
    {
      year: '2021',
      title: '产品矩阵',
      description: '格物数字孪生平台上线，支持1:1高精度工厂数字化建模。团队规模突破100人，服务企业超过50家。',
    },
    {
      year: '2022',
      title: 'AI赋能',
      description: '天筹智能决策引擎发布，AI驱动的排产优化系统投入商用。入选工信部智能制造系统解决方案供应商推荐目录。',
    },
    {
      year: '2023',
      title: '生态扩展',
      description: '浑天仿真引擎上线，实现超实时生产推演。完成B轮融资，估值超10亿，服务企业突破300家，覆盖12个行业。',
    },
    {
      year: '2024',
      title: '行业领先',
      description: '发布天工·弈控2.0，构建"1+N+X"生态架构。荣获国家级专精特新"小巨人"企业称号，服务客户超500家。',
    },
  ]

  const team: TeamMember[] = [
    {
      name: '陈博士',
      position: '创始人 & CEO',
      background: '清华大学自动化系博士，前西门子智能制造首席架构师，15年工业自动化经验',
      avatar: 'C',
    },
    {
      name: '李博士',
      position: '联合创始人 & CTO',
      background: '浙江大学计算机系博士，前阿里云工业互联网技术总监，AI算法专家',
      avatar: 'L',
    },
    {
      name: '王总',
      position: '首席运营官 COO',
      background: '中欧国际工商学院EMBA，前富士康智能制造事业群总经理，20年制造业管理经验',
      avatar: 'W',
    },
    {
      name: '张博士',
      position: '首席科学家',
      background: 'MIT博士后，IEEE Fellow，工业AI与数字孪生领域国际知名学者',
      avatar: 'Z',
    },
  ]

  const honors: Honor[] = [
    { title: '国家级专精特新"小巨人"企业', organization: '工信部', year: '2024' },
    { title: '智能制造系统解决方案供应商', organization: '工信部', year: '2022' },
    { title: '中国工业互联网50强', organization: '中国工业互联网研究院', year: '2023' },
    { title: '浙江省数字经济领军企业', organization: '浙江省经信厅', year: '2023' },
    { title: '国家高新技术企业', organization: '科技部', year: '2020' },
    { title: '工信部智能制造试点示范', organization: '工信部', year: '2022' },
  ]

  const stats = [
    { value: '500+', label: '服务企业', icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { value: '300+', label: '专业团队', icon: Users, color: 'from-emerald-500 to-teal-500' },
    { value: '12', label: '覆盖行业', icon: Globe, color: 'from-violet-500 to-purple-500' },
    { value: '20+', label: '发明专利', icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
  ]

  const capabilities = [
    { icon: Cpu, title: '智能感知', desc: '毫秒级数据采集', color: 'blue' },
    { icon: Network, title: '数字孪生', desc: '1:1高精度建模', color: 'cyan' },
    { icon: Gauge, title: '智能决策', desc: 'AI驱动优化', color: 'emerald' },
    { icon: Shield, title: '仿真验证', desc: '超实时推演', color: 'violet' },
  ]

  const values = [
    {
      id: 'vision',
      title: '企业愿景',
      icon: Target,
      content: '成为全球领先的工业数字孪生操作系统提供商，赋能百万制造企业实现智能化转型升级。',
    },
    {
      id: 'mission',
      title: '企业使命',
      icon: Rocket,
      content: '以"视-空协同"技术为核心，打破工业数据孤岛，让每一次生产决策都有数据支撑，让每一个工厂都拥有智慧大脑。',
    },
    {
      id: 'values',
      title: '核心价值观',
      icon: Heart,
      content: '客户至上 · 技术创新 · 诚信务实 · 合作共赢 · 追求卓越',
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
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                <span className="text-sm font-bold text-blue-300 tracking-wider uppercase">ABOUT US</span>
              </div>

              {/* 主标题 */}
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">
                  天工·弈控
                </span>
              </h1>
              
              {/* 副标题 */}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
                赋能制造，智控未来
              </h2>

              {/* 企业简介 */}
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-12">
                天工·弈控是一家专注于工业数字孪生操作系统研发的国家高新技术企业。
                我们以<span className="text-cyan-400 font-semibold">"视-空协同"</span>技术为核心，为离散制造业提供从数据采集、数字孪生建模、
                智能决策到仿真验证的全栈式解决方案。
              </p>

              {/* 核心能力图标 */}
              <div className="flex justify-center gap-6 mb-16">
                {capabilities.map((cap, idx) => (
                  <div key={idx} className="group">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                      cap.color === 'blue' ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30' :
                      cap.color === 'cyan' ? 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30' :
                      cap.color === 'emerald' ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' :
                      'from-violet-500/20 to-violet-600/20 border-violet-500/30'
                    } border backdrop-blur-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
                      <cap.icon size={28} className={`${
                        cap.color === 'blue' ? 'text-blue-400' :
                        cap.color === 'cyan' ? 'text-cyan-400' :
                        cap.color === 'emerald' ? 'text-emerald-400' :
                        'text-violet-400'
                      }`} />
                    </div>
                    <div className="text-sm font-semibold text-white">{cap.title}</div>
                    <div className="text-xs text-slate-400">{cap.desc}</div>
                  </div>
                ))}
              </div>

              {/* 数据统计卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {stats.map((stat, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                      <stat.icon size={24} className="text-white" />
                    </div>
                    <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 愿景使命价值观 */}
        <section className="px-6 lg:px-20 mb-24">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden">
              {/* Tab导航 */}
              <div className="flex border-b border-white/10">
                {values.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as typeof activeTab)}
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
                    <p className="text-lg text-slate-300 leading-relaxed">{item.content}</p>
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
                <span className="text-sm font-bold text-orange-300 tracking-wider uppercase">MILESTONE</span>
              </div>
              <h2 className="text-3xl font-black mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  发展历程
                </span>
              </h2>
              <p className="text-slate-400">从创立到行业领先，我们始终专注工业数字化转型</p>
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
                    <div className={`flex-1 ml-16 lg:ml-0 ${idx % 2 === 0 ? 'lg:pr-16 lg:text-right' : 'lg:pl-16'}`}>
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-blue-500/30 transition-all group">
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">{item.year}</div>
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
                <span className="text-sm font-bold text-emerald-300 tracking-wider uppercase">TEAM</span>
              </div>
              <h2 className="text-3xl font-black mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  核心团队
                </span>
              </h2>
              <p className="text-slate-400">汇聚行业顶尖人才，引领工业智能化变革</p>
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

        {/* 企业荣誉 */}
        <section className="px-6 lg:px-20 mb-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
                <Medal size={16} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-300 tracking-wider uppercase">HONORS</span>
              </div>
              <h2 className="text-3xl font-black mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  企业荣誉
                </span>
              </h2>
              <p className="text-slate-400">专业认可，实力见证</p>
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

        {/* 联系我们 */}
        <section className="px-6 lg:px-20 mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-600/20 border border-blue-500/30 rounded-3xl p-10 relative overflow-hidden">
              {/* 装饰元素 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full"></div>
              
              <div className="text-center mb-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-4">
                  <Hexagon size={16} className="text-cyan-400" />
                  <span className="text-sm font-bold text-cyan-300 tracking-wider uppercase">CONTACT</span>
                </div>
                <h2 className="text-2xl font-black mb-2">联系我们</h2>
                <p className="text-slate-400">期待与您携手，共创智能制造新未来</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 hover:border-blue-500/30 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div className="text-sm text-slate-400 mb-1">服务热线</div>
                  <div className="font-semibold text-white">400-223608838</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 hover:border-emerald-500/30 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div className="text-sm text-slate-400 mb-1">商务合作</div>
                  <div className="font-semibold text-white">admin@tiangongna.com</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 hover:border-violet-500/30 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/30">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div className="text-sm text-slate-400 mb-1">公司地址</div>
                  <div className="font-semibold text-white">杭州市滨江区</div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <button
                  onClick={() => navigate('/monitoring-demo')}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-base font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:scale-105"
                >
                  预约产品演示
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-base font-semibold transition-all hover:scale-105"
                >
                  登录系统
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AboutUs