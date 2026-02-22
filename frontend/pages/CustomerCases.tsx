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
      company: '某知名汽车零部件集团',
      industry: '汽车制造',
      location: '华东地区',
      scale: '员工5000+ | 6大生产基地',
      challenge: '多条冲压、焊接产线协同效率低，设备故障平均响应时间超过4小时，生产计划调整周期长达72小时，难以应对汽车主机厂JIT供货要求。设备综合效率（OEE）仅58%，远低于行业平均水平。',
      solution: '部署天工·弈控全套解决方案：洞微引擎实现3000+设备点位实时采集（采集周期100ms）；格物平台构建1:1数字孪生模型，覆盖冲压、焊接、总装6大车间；天筹决策引擎实现AI驱动的动态排产优化；浑天仿真系统预演验证，确保零试错上线。',
      highlights: [
        '实时设备监控与预测性维护',
        '多车间协同排产优化',
        '质量追溯体系数字化',
        '能源管理与降本增效',
      ],
      results: [
        { label: 'OEE提升', value: '76%', description: '从58%提升至76%' },
        { label: '故障响应', value: '30分钟', description: '从4小时缩短至30分钟' },
        { label: '计划调整', value: '4小时', description: '从72小时缩短至4小时' },
        { label: '产能提升', value: '+18.5%', description: '年产能显著增长' },
      ],
      testimonial: {
        quote: '天工·弈控帮助我们从"看不见、管不住"走向"数据驱动、持续优化"，数字化转型成效显著。',
        author: '张总',
        position: '集团生产副总',
      },
      tags: ['汽车零部件', '多车间协同', 'JIT供货'],
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      id: '2',
      company: '某电子科技制造企业',
      industry: '电子制造',
      location: '华南地区',
      scale: '员工3000+ | 12条SMT产线',
      challenge: '产品种类多达1200+种，换线频繁导致产能损失严重，每次换线平均耗时2.5小时。品质追溯困难，不良率波动大（平均3.2%），客户投诉率高。人工质检效率低，漏检率约0.5%。',
      solution: '柔性产线数字孪生建模，支持快速换线仿真验证；AI视觉检测替代人工质检，检测准确率99.7%；全流程质量追溯系统，建立每个产品的完整数据链；预测性维护模型，设备停机减少45%。',
      highlights: [
        'SMT产线智能化改造',
        'AI视觉质检系统',
        '柔性换线仿真优化',
        '全流程质量追溯',
      ],
      results: [
        { label: '换线时间', value: '45分钟', description: '从2.5小时缩短至45分钟' },
        { label: '良品率', value: '99.2%', description: '从96.8%提升至99.2%' },
        { label: '质检效率', value: '+300%', description: 'AI替代人工检测' },
        { label: '客户投诉', value: '-85%', description: '质量显著提升' },
      ],
      tags: ['电子组装', 'SMT产线', 'AI质检'],
      gradient: 'from-cyan-600 to-blue-600',
    },
    {
      id: '3',
      company: '某精密模具制造企业',
      industry: '机械加工',
      location: '长三角地区',
      scale: '员工800+ | 高端CNC设备120台',
      challenge: '模具加工精度要求极高（±0.005mm），传统工艺高度依赖老师傅经验，人才培养周期长达3-5年。核心技术人员流失导致工艺知识断层，产能受限，订单交付周期长。',
      solution: 'CNC设备联网采集，实时监控刀具磨损状态；工艺参数AI优化系统，自动推荐最佳切削参数；虚拟调试系统，新模具试制周期缩短60%；知识图谱沉淀老师傅经验，建立企业工艺知识库。',
      highlights: [
        '高精度加工过程监控',
        '工艺知识数字化传承',
        '虚拟试制仿真验证',
        'AI辅助工艺优化',
      ],
      results: [
        { label: '加工精度', value: '±0.003mm', description: '精度提升40%' },
        { label: '试制周期', value: '-60%', description: '大幅缩短交付周期' },
        { label: '培训周期', value: '6个月', description: '从3-5年缩短至6个月' },
        { label: '产能提升', value: '+35%', description: '突破产能瓶颈' },
      ],
      testimonial: {
        quote: '知识图谱系统让老师傅的宝贵经验得以传承，新人培训周期从几年缩短到几个月。',
        author: '李厂长',
        position: '生产厂长',
      },
      tags: ['精密加工', '知识传承', '虚拟试制'],
      gradient: 'from-violet-600 to-purple-600',
    },
    {
      id: '4',
      company: '某新能源电池科技',
      industry: '新能源',
      location: '中部地区',
      scale: '员工2000+ | 年产能20GWh',
      challenge: '锂电池生产过程复杂，温度、湿度控制要求严格，安全隐患大。能耗成本占生产成本35%，缺乏精细化管理手段。热失控预警能力不足，存在安全风险。',
      solution: '全产线环境监测系统，100ms级数据采集；AI热失控预警模型，提前30分钟精准预警；能耗优化算法，智能调节空调新风系统；MES系统集成，实现全流程数字化管理。',
      highlights: [
        '环境参数实时监控',
        'AI热失控预警系统',
        '能耗智能优化',
        '安全风险管控',
      ],
      results: [
        { label: '能耗降低', value: '-28%', description: '年节约成本超千万' },
        { label: '安全事件', value: '0起', description: '实现零安全事故' },
        { label: '环境合格率', value: '99.9%', description: '恒温恒湿精准控制' },
        { label: '生产成本', value: '-18%', description: '综合成本下降' },
      ],
      tags: ['锂电池制造', '安全预警', '能耗优化'],
      gradient: 'from-emerald-600 to-teal-600',
    },
    {
      id: '5',
      company: '某智能装备制造集团',
      industry: '装备制造',
      location: '华北地区',
      scale: '员工1500+ | 年产值15亿',
      challenge: '非标定制订单占比80%，设计变更频繁导致项目延期。供应链协同困难，供应商交付不及时影响整体进度。交付延期率高达25%，客户满意度下降。',
      solution: '产品模块化设计平台，配置式快速报价系统；供应链数字孪生，实时监控供应商产能与交付状态；项目全生命周期管理系统，自动预警延期风险；远程运维平台，售后服务效率提升200%。',
      highlights: [
        '模块化产品设计平台',
        '供应链协同管理',
        '项目风险预警系统',
        '远程运维服务',
      ],
      results: [
        { label: '报价周期', value: '2小时', description: '从3天缩短至2小时' },
        { label: '延期率', value: '3%', description: '从25%降至3%' },
        { label: '客户满意度', value: '98%', description: '显著提升' },
        { label: '售后效率', value: '+200%', description: '远程诊断快速响应' },
      ],
      tags: ['装备制造', '定制化生产', '供应链协同'],
      gradient: 'from-amber-600 to-orange-600',
    },
    {
      id: '6',
      company: '某航空航天精密器件厂',
      industry: '航空航天',
      location: '西南地区',
      scale: '员工600+ | 特种设备200+台',
      challenge: '产品精度要求极高，质量追溯要求严格符合军标要求。研发试制周期长，成本控制压力大。一次交检合格率仅92%，返工返修成本高。',
      solution: '高精度测量设备集成，实现微米级数据采集；全流程质量追溯系统，满足航天军标要求；虚拟仿真验证平台，减少实物试制次数；并行工程管理系统，研发周期缩短40%。',
      highlights: [
        '高精度检测系统集成',
        '军标质量追溯体系',
        '虚拟仿真验证',
        '并行工程管理',
      ],
      results: [
        { label: '研发周期', value: '-40%', description: '加速新产品研发' },
        { label: '质量追溯', value: '100%', description: '全流程可追溯' },
        { label: '试制成本', value: '-55%', description: '虚拟验证减少试制' },
        { label: '一次合格率', value: '99.8%', description: '从92%大幅提升' },
      ],
      testimonial: {
        quote: '数字化转型让我们在保证航空航天级质量标准的同时，大幅提升了研发效率。',
        author: '王总工',
        position: '技术总监',
      },
      tags: ['航空航天', '高精制造', '军标质量'],
      gradient: 'from-slate-600 to-zinc-600',
    },
  ]

  const industries = [
    { id: 'all', name: '全部行业', icon: Globe, count: 6 },
    { id: '汽车制造', name: '汽车制造', icon: Factory, count: 1 },
    { id: '电子制造', name: '电子制造', icon: Cpu, count: 1 },
    { id: '机械加工', name: '机械加工', icon: Zap, count: 1 },
    { id: '新能源', name: '新能源', icon: Leaf, count: 1 },
    { id: '装备制造', name: '装备制造', icon: Building2, count: 1 },
    { id: '航空航天', name: '航空航天', icon: Award, count: 1 },
  ]

  const stats = [
    { label: '服务企业', value: '500+', subLabel: '覆盖头部制造企业' },
    { label: '覆盖行业', value: '12个', subLabel: '离散制造核心领域' },
    { label: '平均效益提升', value: '32%', subLabel: '综合运营效益' },
    { label: '项目成功率', value: '99.2%', subLabel: '按期交付率' },
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
              <ArrowRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
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
              <span className="text-xs font-bold text-blue-300 tracking-wider uppercase">CUSTOMER SUCCESS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              赋能离散制造业
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                数字化转型成功案例
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl">
              深耕汽车、电子、机械等12个离散制造核心领域，助力企业实现设备效率提升、质量管控优化、运营成本降低。
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
                  <span className="ml-1 px-2 py-0.5 bg-white/10 rounded-full text-xs">{ind.count}</span>
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
                        activeCase === caseStudy.id ? 'text-blue-400 translate-x-1' : 'text-slate-600'
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
                      <h2 className="text-3xl font-black text-white mb-2">{activeCaseData.company}</h2>
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
                          <div className="text-sm font-semibold text-white mb-1">{result.label}</div>
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
                          <div className="font-semibold text-white">{activeCaseData.testimonial.author}</div>
                          <div className="text-sm text-slate-400">{activeCaseData.testimonial.position}</div>
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
            <h3 className="text-2xl font-black mb-3">开启您的数字化转型之旅</h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              与我们的行业专家团队深入交流，获取针对您企业的专属数字化转型解决方案
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
                立即咨询专家
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerCases