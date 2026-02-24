import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Cpu,
  Factory,
  Globe,
  Layers,
  Leaf,
  MapPin,
  Quote,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TiangongLogo from '../components/TiangongLogo'

interface CaseStudy {
  id: string
  company: string
  industry: string
  location: string
  scale: string
  challenge: string
  solution: string
  highlights: string[]
  results: {
    label: string
    value: string
    description: string
  }[]
  testimonial?: {
    quote: string
    author: string
    position: string
  }
  tags: string[]
  gradient: string
}

const CustomerCases: React.FC = () => {
  const navigate = useNavigate()
  const [activeCase, setActiveCase] = useState<string>('1')

  const CASES: CaseStudy[] = [
    {
      id: '1',
      company: '某汽车零部件加工厂',
      industry: '汽车制造',
      location: '华北地区',
      scale: '员工150+ | 2条生产线',
      challenge:
        '生产线设备老化，数据采集依赖人工记录，生产进度难以实时掌握。排产计划主要依靠经验，效率较低。设备故障无法提前预警，影响生产连续性。',
      solution:
        '试点部署洞微感知引擎，实现关键设备数据自动采集；搭建基础数字孪生模型，可视化展示生产状态；基于历史数据建立简单的设备预警模型。',
      highlights: [
        '设备数据自动采集',
        '生产状态可视化',
        '基础预警功能',
        '数字化改造起步',
      ],
      results: [
        { label: '数据采集', value: '自动化', description: '替代人工记录' },
        { label: '可视化', value: '实时', description: '生产状态透明化' },
        { label: '预警时间', value: '提前1h', description: '初步预警能力' },
        { label: '试点周期', value: '3个月', description: '第一阶段验证' },
      ],
      tags: ['汽车零部件', '数据采集', '试点项目'],
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      id: '2',
      company: '某电子元器件生产企业',
      industry: '电子制造',
      location: '华东地区',
      scale: '员工80+ | 3条SMT产线',
      challenge:
        '产品质量追溯困难，不良品原因分析耗时较长。换线调整主要依靠工人经验，时间难以精确控制。生产数据分散在各系统，缺乏统一视图。',
      solution:
        '部署格物孪生引擎，建立产线数字模型；接入现有MES系统数据，构建统一数据平台；开发质量追溯功能，支持快速定位问题环节。',
      highlights: ['产线数字建模', '数据平台整合', '质量追溯功能', '可视化看板'],
      results: [
        { label: '追溯效率', value: '+50%', description: '问题定位加快' },
        { label: '数据整合', value: '统一平台', description: '消除数据孤岛' },
        { label: '可视覆盖', value: '80%', description: '关键环节可视化' },
        { label: '合作阶段', value: '测试中', description: '功能持续优化' },
      ],
      tags: ['电子组装', 'SMT产线', '质量追溯'],
      gradient: 'from-cyan-600 to-blue-600',
    },
    {
      id: '3',
      company: '某机械加工车间',
      industry: '机械加工',
      location: '华中地区',
      scale: '员工60+ | CNC设备30台',
      challenge:
        'CNC设备分散管理，加工进度难以统一监控。工艺参数依赖老师傅经验，新人培养周期长。订单排产主要靠人工协调，效率不高。',
      solution:
        'CNC设备联网接入，实时监控加工状态；建立工艺参数数据库，沉淀经验知识；开发简单的排产辅助工具，优化生产计划。',
      highlights: ['设备联网监控', '工艺知识沉淀', '排产辅助工具', '经验数字化'],
      results: [
        { label: '设备联网', value: '30台', description: '全部CNC设备' },
        { label: '工艺库', value: '建立中', description: '持续积累数据' },
        { label: '监控覆盖', value: '100%', description: '设备状态透明' },
        { label: '项目状态', value: '进行中', description: '二期规划中' },
      ],
      testimonial: {
        quote: '设备联网后，车间管理效率明显提升，我们对后续的智能化改造更有信心了。',
        author: '李师傅',
        position: '车间主任',
      },
      tags: ['机械加工', 'CNC联网', '经验沉淀'],
      gradient: 'from-violet-600 to-purple-600',
    },
    {
      id: '4',
      company: '某小型模具制造厂',
      industry: '模具制造',
      location: '华南地区',
      scale: '员工40+ | 加工设备20台',
      challenge:
        '模具加工精度要求高，质量检测依赖人工。交期紧张时排产困难，容易延期。客户对进度查询需求强烈，缺乏透明化手段。',
      solution:
        '部署天筹决策引擎试点版，辅助排产决策；建立加工进度跟踪系统，支持客户查询；接入测量设备数据，实现质量数据自动记录。',
      highlights: ['排产辅助决策', '进度跟踪系统', '质量数据记录', '客户查询功能'],
      results: [
        { label: '排产效率', value: '+30%', description: '计划制定加快' },
        { label: '进度透明', value: '实时查询', description: '客户满意度提升' },
        { label: '质量记录', value: '数字化', description: '替代纸质记录' },
        { label: '试点状态', value: '已完成', description: '效果良好' },
      ],
      tags: ['模具制造', '排产优化', '进度跟踪'],
      gradient: 'from-emerald-600 to-teal-600',
    },
  ]

  const industries = [
    { id: 'all', name: '全部行业', icon: Globe, count: 4 },
    { id: '汽车制造', name: '汽车制造', icon: Factory, count: 1 },
    { id: '电子制造', name: '电子制造', icon: Cpu, count: 1 },
    { id: '机械加工', name: '机械加工', icon: Zap, count: 1 },
    { id: '模具制造', name: '模具制造', icon: Building2, count: 1 },
  ]

  const stats = [
    { label: '合作企业', value: '3家', subLabel: '试点合作企业' },
    { label: '覆盖行业', value: '4个', subLabel: '离散制造领域' },
    { label: '试点产线', value: '5条', subLabel: '正在进行中' },
    { label: '技术研发', value: '4大引擎', subLabel: '核心能力建设' },
  ]

  const activeCaseData = CASES.find((c) => c.id === activeCase) || CASES[0]

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
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-blue-500/30 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />

      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 lg:px-20 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowRight
                size={20}
                className="rotate-180 group-hover:-translate-x-1 transition-transform"
              />
              <span className="text-sm">返回首页</span>
            </button>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="flex items-center gap-2">
              <TiangongLogo size={28} variant="dark" animate={true} />
              <span className="font-bold text-lg tracking-tight">天工·弈控</span>
              <span className="text-slate-400 text-sm ml-2">| 客户成功案例</span>
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
        {/* 页面标题区 */}
        <div className="px-6 lg:px-20 mb-12">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
              <Users size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-300 tracking-wider uppercase">
                CUSTOMER SUCCESS
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              赋能离散制造业
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                试点合作案例
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl">
              正在与多家制造企业开展试点合作，在汽车零部件、电子制造、机械加工等领域验证产品能力，持续迭代优化。
            </p>
          </div>
        </div>

        {/* 统计数据条 */}
        <div className="px-6 lg:px-20 mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center md:text-left">
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.subLabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 行业筛选 */}
        <div className="px-6 lg:px-20 mb-8">
          <div className="flex flex-wrap gap-3">
            {industries.map((ind) => {
              const Icon = ind.icon
              return (
                <button
                  key={ind.id}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    ind.id === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Icon size={16} />
                  {ind.name}
                  <span className="ml-1 px-2 py-0.5 bg-white/10 rounded-full text-xs">
                    {ind.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 主内容区 - 左右布局 */}
        <div className="px-6 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* 左侧 - 案例列表 */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {CASES.map((caseStudy) => (
                <button
                  key={caseStudy.id}
                  onClick={() => setActiveCase(caseStudy.id)}
                  className={`flex-1 text-left p-5 rounded-xl transition-all duration-300 min-h-[100px] ${
                    activeCase === caseStudy.id
                      ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4 h-full">
                    {/* 图标/图片占位 */}
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${caseStudy.gradient} flex items-center justify-center flex-shrink-0`}
                    >
                      <Factory size={28} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-white truncate">{caseStudy.company}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <MapPin size={12} />
                        <span>{caseStudy.location}</span>
                        <span className="text-slate-600">|</span>
                        <span>{caseStudy.industry}</span>
                      </div>
                      <div className="flex gap-2">
                        {caseStudy.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`flex-shrink-0 transition-transform ${
                        activeCase === caseStudy.id
                          ? 'text-blue-400 translate-x-1'
                          : 'text-slate-600'
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* 右侧 - 案例详情 */}
            <div className="lg:col-span-8 flex">
              <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                {/* 案例头图区域 */}
                <div className={`relative h-64 bg-gradient-to-br ${activeCaseData.gradient} p-8`}>
                  {/* 装饰网格 */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                    }}
                  />
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
                        <Factory size={14} />
                        {activeCaseData.industry}
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2">
                        {activeCaseData.company}
                      </h2>
                      <div className="flex items-center gap-4 text-white/80 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {activeCaseData.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} /> {activeCaseData.scale}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {activeCaseData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white/20 text-white text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 案例内容 */}
                <div className="p-8">
                  {/* 面临挑战 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                      面临挑战
                    </h3>
                    <p className="text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      {activeCaseData.challenge}
                    </p>
                  </div>

                  {/* 解决方案 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                      解决方案
                    </h3>
                    <p className="text-slate-300 leading-relaxed mb-4">{activeCaseData.solution}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {activeCaseData.highlights.map((highlight, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                        >
                          <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 实施效果 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                      实施效果
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      {activeCaseData.results.map((result, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 rounded-xl border border-slate-700/50 text-center"
                        >
                          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-1">
                            {result.value}
                          </div>
                          <div className="text-sm font-semibold text-white mb-1">
                            {result.label}
                          </div>
                          <div className="text-xs text-slate-500">{result.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 客户评价 */}
                  {activeCaseData.testimonial && (
                    <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-xl p-6">
                      <Quote size={32} className="text-blue-400/30 mb-3" />
                      <p className="text-slate-300 italic mb-4 leading-relaxed">
                        "{activeCaseData.testimonial.quote}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {activeCaseData.testimonial.author.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {activeCaseData.testimonial.author}
                          </div>
                          <div className="text-sm text-slate-400">
                            {activeCaseData.testimonial.position}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 CTA */}
        <div className="px-6 lg:px-20 mt-16">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-3xl p-10 text-center">
            <Layers size={48} className="mx-auto mb-4 text-blue-400" />
            <h3 className="text-2xl font-black mb-3">欢迎洽谈合作</h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              我们正在寻找合作伙伴，共同探索工业数字孪生技术的落地应用场景
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/monitoring-demo')}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-base font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
              >
                预约产品演示 <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-base font-semibold transition-all"
              >
                联系我们
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerCases
