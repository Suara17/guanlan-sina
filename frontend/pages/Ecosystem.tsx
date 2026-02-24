import {
  BookOpen,
  Code2,
  Download,
  ExternalLink,
  FileCode,
  Github,
  Key,
  MessageSquare,
  Play,
  Terminal,
  Zap,
} from 'lucide-react'
import type React from 'react'

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/devices',
    description: '获取设备列表',
    auth: true,
  },
  {
    method: 'POST',
    path: '/api/v1/anomalies/detect',
    description: '异常检测分析',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/v1/knowledge-graph/{id}',
    description: '获取知识图谱节点',
    auth: true,
  },
  {
    method: 'POST',
    path: '/api/v1/optimization/solve',
    description: '优化求解接口',
    auth: true,
  },
]

const SDK_PACKAGES = [
  {
    name: 'Python SDK',
    version: 'v2.1.0',
    description: '适用于 Python 3.8+ 的官方 SDK',
    command: 'pip install tiangong-sdk',
    icon: '🐍',
  },
  {
    name: 'Node.js SDK',
    version: 'v2.0.5',
    description: '适用于 Node.js 16+ 的官方 SDK',
    command: 'npm install @tiangong/sdk',
    icon: '📦',
  },
  {
    name: 'Java SDK',
    version: 'v1.9.2',
    description: '适用于 Java 11+ 的官方 SDK',
    command: 'implementation "com.tiangong:sdk:1.9.2"',
    icon: '☕',
  },
]

const DEVELOPER_TOOLS = [
  {
    title: 'API 在线调试',
    description: '交互式 API 测试工具，快速验证接口调用',
    icon: Play,
    status: 'online',
  },
  {
    title: '代码生成器',
    description: '根据 OpenAPI 规范自动生成客户端代码',
    icon: Code2,
    status: 'online',
  },
  {
    title: '沙箱环境',
    description: '隔离的测试环境，安全验证算法效果',
    icon: Terminal,
    status: 'beta',
  },
  {
    title: 'Webhook 配置',
    description: '配置事件回调，实现实时数据推送',
    icon: Zap,
    status: 'online',
  },
]

const Ecosystem: React.FC = () => {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">开发者生态</h1>
          <p className="text-slate-500 mt-2">
            OpenAPI 接口、SDK 工具包、开发者沙箱，助力快速集成天工·弈控能力
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <BookOpen size={18} />
            API 文档
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Github size={18} />
            GitHub
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'API 接口', value: '42', icon: FileCode },
          { label: 'SDK 下载', value: '12.8K', icon: Download },
          { label: '活跃开发者', value: '1,256', icon: Code2 },
          { label: '社区话题', value: '328', icon: MessageSquare },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <stat.icon size={18} />
              </div>
              <span className="text-sm text-slate-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* API 密钥管理 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key size={20} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">API 密钥管理</h2>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建新密钥
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-mono text-sm text-slate-700">tg_sk_**************************************</p>
              <p className="text-xs text-slate-500 mt-1">创建于 2026-01-15 · 最后使用 2 小时前</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                已启用
              </span>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 常用 API */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">常用 API 接口</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {API_ENDPOINTS.map((api, index) => (
            <div
              key={index}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`px-2 py-1 text-xs font-bold rounded ${
                    api.method === 'GET'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {api.method}
                </span>
                <code className="text-sm font-mono text-slate-700">{api.path}</code>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{api.description}</span>
                {api.auth && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                    需认证
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
          >
            查看完整 API 文档
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* SDK 下载 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">SDK 下载</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {SDK_PACKAGES.map((sdk) => (
            <div key={sdk.name} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{sdk.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-800">{sdk.name}</h3>
                  <span className="text-xs text-slate-500">{sdk.version}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4">{sdk.description}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-slate-900 text-green-400 text-xs rounded-lg font-mono">
                  {sdk.command}
                </code>
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="复制"
                >
                  <Terminal size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 开发者工具 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEVELOPER_TOOLS.map((tool) => (
          <div
            key={tool.title}
            className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <tool.icon size={22} />
              </div>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  tool.status === 'online'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {tool.status === 'online' ? '在线' : 'Beta'}
              </span>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">{tool.title}</h3>
            <p className="text-sm text-slate-500">{tool.description}</p>
          </div>
        ))}
      </div>

      {/* 快速开始 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
        <h2 className="text-lg font-bold mb-4">快速开始</h2>
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <div className="text-slate-500"># 安装 SDK</div>
          <div className="text-green-400">pip install tiangong-sdk</div>
          <div className="mt-3 text-slate-500"># 初始化客户端</div>
          <div>
            <span className="text-blue-400">from</span>
            <span className="text-white"> tiangong </span>
            <span className="text-blue-400">import</span>
            <span className="text-white"> Client</span>
          </div>
          <div>
            <span className="text-white">client = Client(</span>
            <span className="text-amber-400">api_key</span>
            <span className="text-white">=</span>
            <span className="text-green-400">"your_api_key"</span>
            <span className="text-white">)</span>
          </div>
          <div className="mt-3 text-slate-500"># 调用异常检测接口</div>
          <div>
            <span className="text-white">result = client.anomalies.detect(</span>
            <span className="text-amber-400">device_id</span>
            <span className="text-white">=</span>
            <span className="text-green-400">"SMT-001"</span>
            <span className="text-white">)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ecosystem
