import {
  Bell,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Key,
  Laptop,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
  Volume2,
  Workflow,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

const TABS = [
  { id: 'profile', label: '账户信息', icon: User },
  { id: 'notifications', label: '通知管理', icon: Bell },
  { id: 'appearance', label: '界面外观', icon: Sun },
  { id: 'security', label: '安全设置', icon: Shield },
]

const ProfileSection: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* 基本信息卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">基本信息</h3>
          <p className="text-sm text-slate-500 mt-0.5">更新您的个人资料</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-6 pb-6 border-b border-slate-100">
            {/* 头像 */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20">
                张
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
              >
                更换头像
              </button>
            </div>
            {/* 表单 */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                  用户名
                </label>
                <input
                  id="username"
                  type="text"
                  defaultValue="zhanggong"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  姓名
                </label>
                <input
                  id="name"
                  type="text"
                  defaultValue="张工"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  defaultValue="zhanggong@tiangong.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  手机号
                </label>
                <input
                  id="phone"
                  type="tel"
                  defaultValue="138****8888"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
          {/* 组织信息 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1.5">
                所属部门
              </label>
              <div className="relative">
                <select
                  id="department"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-colors"
                >
                  <option>生产制造部</option>
                  <option>质量管控部</option>
                  <option>设备维护部</option>
                  <option>工艺工程部</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1.5">
                角色
              </label>
              <input
                id="role"
                type="text"
                defaultValue="工艺工程师"
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 工厂权限 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">工厂权限</h3>
          <p className="text-sm text-slate-500 mt-0.5">您可以访问的工厂和产线</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: '苏州一厂', access: '全权访问' },
              { name: '苏州二厂', access: '只读访问' },
              { name: '越南工厂', access: '只读访问' },
            ].map((factory) => (
              <div
                key={factory.name}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Workflow size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{factory.name}</p>
                    <p className="text-xs text-slate-500">{factory.access}</p>
                  </div>
                </div>
                <Check size={16} className="text-green-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const NotificationSection: React.FC = () => {
  const [settings, setSettings] = useState({
    anomalyAlert: true,
    systemUpdate: true,
    weeklyReport: false,
    emailNotification: true,
    smsNotification: false,
    soundEnabled: true,
  })

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const Toggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
        enabled ? 'bg-blue-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )

  return (
    <div className="space-y-6">
      {/* 告警通知 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">告警通知</h3>
          <p className="text-sm text-slate-500 mt-0.5">实时接收生产异常和设备告警</p>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { key: 'anomalyAlert', label: '异常告警', desc: '设备异常、质量问题时即时推送' },
            { key: 'systemUpdate', label: '系统公告', desc: '版本更新、维护公告等消息' },
            { key: 'weeklyReport', label: '周报摘要', desc: '每周一发送产线运行报告' },
          ].map((item) => (
            <div key={item.key} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{item.label}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
              <Toggle
                enabled={settings[item.key as keyof typeof settings]}
                onChange={() => toggle(item.key as keyof typeof settings)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 通知渠道 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">通知渠道</h3>
          <p className="text-sm text-slate-500 mt-0.5">选择接收通知的方式</p>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">邮件通知</p>
                <p className="text-sm text-slate-500">zhanggong@tiangong.com</p>
              </div>
            </div>
            <Toggle enabled={settings.emailNotification} onChange={() => toggle('emailNotification')} />
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <Volume2 size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">短信通知</p>
                <p className="text-sm text-slate-500">138****8888</p>
              </div>
            </div>
            <Toggle enabled={settings.smsNotification} onChange={() => toggle('smsNotification')} />
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <Bell size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">桌面提示音</p>
                <p className="text-sm text-slate-500">收到通知时播放提示音</p>
              </div>
            </div>
            <Toggle enabled={settings.soundEnabled} onChange={() => toggle('soundEnabled')} />
          </div>
        </div>
      </div>
    </div>
  )
}

const AppearanceSection: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [language, setLanguage] = useState('zh-CN')

  const themes = [
    { id: 'light', label: '浅色模式', icon: Sun, desc: '适合日间使用' },
    { id: 'dark', label: '深色模式', icon: Moon, desc: '减少眼睛疲劳' },
    { id: 'system', label: '跟随系统', icon: Laptop, desc: '自动适配系统设置' },
  ]

  return (
    <div className="space-y-6">
      {/* 主题选择 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">主题模式</h3>
          <p className="text-sm text-slate-500 mt-0.5">选择适合您的界面风格</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as typeof theme)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left ${
                  theme === t.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    theme === t.id ? 'bg-blue-100' : 'bg-slate-100'
                  }`}
                >
                  <t.icon size={20} className={theme === t.id ? 'text-blue-600' : 'text-slate-500'} />
                </div>
                <p className={`font-medium ${theme === t.id ? 'text-blue-600' : 'text-slate-800'}`}>
                  {t.label}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{t.desc}</p>
                {theme === t.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 语言设置 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">语言设置</h3>
          <p className="text-sm text-slate-500 mt-0.5">选择界面显示语言</p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <Globe size={16} className="text-slate-600" />
            </div>
            <div className="relative flex-1 max-w-xs">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-colors"
              >
                <option value="zh-CN">简体中文</option>
                <option value="zh-TW">繁體中文</option>
                <option value="en-US">English</option>
                <option value="ja-JP">日本語</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const SecuritySection: React.FC = () => {
  const loginHistory = [
    { time: '今天 09:32', device: 'Chrome · Windows', ip: '192.168.1.105', status: 'success' },
    { time: '昨天 18:45', device: 'Safari · macOS', ip: '192.168.1.102', status: 'success' },
    { time: '昨天 14:12', device: 'Chrome · Windows', ip: '192.168.1.105', status: 'success' },
    { time: '2月22日 08:55', device: '未知设备', ip: '103.45.67.89', status: 'failed' },
  ]

  return (
    <div className="space-y-6">
      {/* 密码设置 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">账户安全</h3>
          <p className="text-sm text-slate-500 mt-0.5">管理您的登录凭据</p>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Key size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">登录密码</p>
                <p className="text-sm text-slate-500">上次修改于 30 天前</p>
              </div>
            </div>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              修改密码
            </button>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">两步验证</p>
                <p className="text-sm text-slate-500">增强账户安全性</p>
              </div>
            </div>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              启用
            </button>
          </div>
        </div>
      </div>

      {/* 登录记录 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">登录记录</h3>
            <p className="text-sm text-slate-500 mt-0.5">最近的账户登录活动</p>
          </div>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            查看全部
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {loginHistory.map((log, index) => (
            <div key={index} className="px-6 py-3 flex items-center gap-4">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{log.device}</p>
                <p className="text-xs text-slate-500">{log.ip}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={12} />
                {log.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 危险操作 */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        <div className="px-6 py-4">
          <h3 className="font-semibold text-red-600">危险区域</h3>
          <p className="text-sm text-slate-500 mt-0.5">以下操作不可撤销，请谨慎操作</p>
        </div>
        <div className="px-6 py-4 bg-red-50/50 border-t border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogOut size={18} className="text-red-500" />
            <span className="text-sm text-slate-700">退出登录</span>
          </div>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
          >
            退出
          </button>
        </div>
      </div>
    </div>
  )
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1500)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />
      case 'notifications':
        return <NotificationSection />
      case 'appearance':
        return <AppearanceSection />
      case 'security':
        return <SecuritySection />
      default:
        return <ProfileSection />
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-full">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">设置</h1>
          <p className="text-sm text-slate-500 mt-1">管理您的账户和系统偏好</p>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-xl border border-slate-200 p-1.5">
          <div className="flex overflow-x-auto gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="pb-20">{renderContent()}</div>

        {/* 底部操作栏 */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-slate-200 p-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <p className="text-sm text-slate-500">上次保存于 5 分钟前</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                重置
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    保存更改
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings