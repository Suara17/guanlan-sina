# 业务闭环导航改造 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在侧边栏和Dashboard首页增加业务闭环视角，让用户一目了然地理解系统能力与菜单含义，并通过流程指引快速进入核心功能。

**Architecture:** 三处改动，相互独立：(1) 侧边栏菜单配置重组 + 菜单名加业务副标题 + 天筹加「核心」角标；(2) 侧边栏新增业务闭环流程指引条组件；(3) Dashboard首页顶部新增业务闭环横幅卡片区。所有改动均在前端 React/TypeScript 层完成，不涉及后端。

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS, Lucide React, React Router (MemoryRouter)

---

## 改动范围总览

| 任务 | 文件 | 类型 |
|------|------|------|
| Task 1 | `frontend/components/Sidebar.tsx` | 修改 |
| Task 2 | `frontend/components/BusinessFlowBar.tsx` | 新建 |
| Task 3 | `frontend/components/Sidebar.tsx` | 修改（引入 BusinessFlowBar） |
| Task 4 | `frontend/components/BusinessFlowBanner.tsx` | 新建 |
| Task 5 | `frontend/pages/Dashboard.tsx` | 修改（引入 BusinessFlowBanner） |

---

### Task 1: 重组侧边栏菜单结构 + 菜单名加业务副标题 + 天筹「核心」角标

**Files:**
- Modify: `frontend/components/Sidebar.tsx:29-117`

**目标变更：**
1. 分组重命名：`订阅模块` → `业务分析`，`组件管理` → `平台配置`
2. 场景编排从「平台配置」移入「业务分析」
3. 能力商店留在「平台配置」，开发者生态留在「平台配置」
4. 菜单名改为「主名（业务含义）」格式
5. 天筹优化加 `isCoreFeature: true` 标记

**Step 1: 修改 NAV_GROUPS 配置**

将 `frontend/components/Sidebar.tsx` 第 29-117 行的 `NAV_GROUPS` 替换为：

```typescript
const NAV_GROUPS: NavGroup[] = [
  {
    id: 'monitoring',
    label: '实时监控',
    items: [
      {
        id: 'dashboard',
        label: '生产可视化',
        icon: LayoutDashboard,
        path: '/app/',
        group: 'monitoring',
      },
      {
        id: 'sinan',
        label: '司南智控（异常诊断）',
        icon: Sparkles,
        path: '/app/sinan',
        group: 'monitoring',
      },
    ],
  },
  {
    id: 'business',
    label: '业务分析',
    items: [
      {
        id: 'gewu',
        label: '格物图谱（归因分析）',
        icon: Network,
        path: '/app/gewu',
        group: 'business',
      },
      {
        id: 'tianchou',
        label: '天筹优化（方案决策）',
        icon: Cpu,
        path: '/app/tianchou',
        group: 'business',
        isCoreFeature: true,
      },
      {
        id: 'huntian',
        label: '浑天仿真（仿真验证）',
        icon: MonitorPlay,
        path: '/app/huntian',
        group: 'business',
      },
      {
        id: 'builder',
        label: '场景编排（业务编排）',
        icon: Cuboid,
        path: '/app/builder',
        group: 'business',
      },
    ],
  },
  {
    id: 'platform',
    label: '平台配置',
    items: [
      {
        id: 'marketplace',
        label: '能力商店',
        icon: Store,
        path: '/app/marketplace',
        group: 'platform',
      },
      {
        id: 'ecosystem',
        label: '开发者生态',
        icon: Activity,
        path: '/app/ecosystem',
        group: 'platform',
      },
    ],
  },
  {
    id: 'system',
    label: '系统维护',
    items: [
      {
        id: 'kernel',
        label: 'OS 内核接入',
        icon: Cable,
        path: '/app/kernel',
        group: 'system',
      },
    ],
  },
]
```

**Step 2: 在 types.ts 中给 NavItem 加 isCoreFeature 字段**

打开 `frontend/types.ts`，找到 `NavItem` 接口，加一个可选字段：

```typescript
// 在 NavItem 接口中添加
isCoreFeature?: boolean
```

**Step 3: 修改菜单项渲染，支持「核心」角标**

在 `frontend/components/Sidebar.tsx` 中，找到渲染菜单项的 `<span className="font-medium text-sm flex-1 text-left">{item.label}</span>` 部分，替换为：

```tsx
<span className="font-medium text-sm flex-1 text-left leading-tight">{item.label}</span>
{item.isCoreFeature && !collapsed && (
  <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
    核心
  </span>
)}
```

**Step 4: 验证视觉效果**

```bash
cd frontend && npm run dev
```

浏览器打开 http://localhost:3000，登录后检查：
- 侧边栏分组名称已变为「业务分析」「平台配置」
- 菜单项名称带括号业务含义
- 天筹优化右侧有「核心」黄色角标
- 场景编排在「业务分析」分组下

**Step 5: Commit**

```bash
git add frontend/components/Sidebar.tsx frontend/types.ts
git commit -m "feat(nav): 重组侧边栏菜单结构，添加业务副标题和核心角标"
```

---

### Task 2: 新建业务闭环流程指引条组件

**Files:**
- Create: `frontend/components/BusinessFlowBar.tsx`

此组件放在侧边栏菜单列表上方，显示 4 个流程节点，当前页面对应节点自动高亮，点击跳转。

**Step 1: 创建组件文件**

新建 `frontend/components/BusinessFlowBar.tsx`，内容如下：

```tsx
import { ArrowRight } from 'lucide-react'
import type React from 'react'

interface FlowStep {
  id: string
  label: string
  paths: string[]  // 该步骤对应的路由路径列表
}

const FLOW_STEPS: FlowStep[] = [
  { id: 'discover', label: '发现', paths: ['/app/', '/app/sinan'] },
  { id: 'attribute', label: '归因', paths: ['/app/gewu'] },
  { id: 'decide', label: '决策', paths: ['/app/tianchou'] },
  { id: 'verify', label: '验证', paths: ['/app/huntian'] },
]

interface BusinessFlowBarProps {
  currentPath: string
  onNavigate: (path: string) => void
  collapsed: boolean
}

const BusinessFlowBar: React.FC<BusinessFlowBarProps> = ({
  currentPath,
  onNavigate,
  collapsed,
}) => {
  const getActiveStep = () => {
    return FLOW_STEPS.findIndex((step) =>
      step.paths.some((p) => currentPath === p)
    )
  }

  const activeIndex = getActiveStep()

  if (collapsed) {
    // 折叠时显示 4 个小圆点
    return (
      <div className="px-3 py-3 flex flex-col items-center gap-1.5">
        {FLOW_STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onNavigate(step.paths[0])}
            title={step.label}
            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
              index === activeIndex
                ? 'bg-blue-400 shadow-lg shadow-blue-400/50 scale-125'
                : 'bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-3 mb-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
        业务闭环
      </div>
      <div className="flex items-center justify-between gap-1">
        {FLOW_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onNavigate(step.paths[0])}
              className={`flex flex-col items-center gap-1 cursor-pointer group transition-all`}
              title={`前往：${step.label}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  index === activeIndex
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40 scale-110'
                    : index < activeIndex
                    ? 'bg-blue-900/60 text-blue-400 border border-blue-700/50'
                    : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-slate-200'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-[9px] font-medium leading-none transition-colors ${
                  index === activeIndex
                    ? 'text-blue-400'
                    : index < activeIndex
                    ? 'text-blue-600'
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < FLOW_STEPS.length - 1 && (
              <ArrowRight
                size={10}
                className={`flex-shrink-0 mb-3 ${
                  index < activeIndex ? 'text-blue-700' : 'text-slate-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BusinessFlowBar
```

**Step 2: 验证文件创建**

```bash
ls frontend/components/BusinessFlowBar.tsx
```

Expected: 文件存在

---

### Task 3: 在侧边栏中引入 BusinessFlowBar

**Files:**
- Modify: `frontend/components/Sidebar.tsx`

**Step 1: 在 Sidebar.tsx 顶部引入组件**

在 `frontend/components/Sidebar.tsx` 的 import 区域末尾添加：

```typescript
import BusinessFlowBar from './BusinessFlowBar'
```

**Step 2: 在导航菜单区域插入 BusinessFlowBar**

找到 `frontend/components/Sidebar.tsx` 中 `{/* 导航菜单 */}` 注释对应的 div，在 `{NAV_GROUPS.map(...)}` 之前插入：

```tsx
{/* 业务闭环流程条 */}
<BusinessFlowBar
  currentPath={currentPath}
  onNavigate={onNavigate}
  collapsed={collapsed}
/>
```

即修改后的导航菜单区域开头为：

```tsx
{/* 导航菜单 */}
<div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
  {/* 业务闭环流程条 */}
  <BusinessFlowBar
    currentPath={currentPath}
    onNavigate={onNavigate}
    collapsed={collapsed}
  />

  {NAV_GROUPS.map((group) => (
    ...
  ))}
</div>
```

注意：原来的 `py-6 space-y-6` 改为 `py-4 space-y-4`，给流程条留出视觉节奏。

**Step 3: 验证效果**

```bash
cd frontend && npm run dev
```

浏览器检查：
- 侧边栏菜单上方出现「业务闭环」流程条（1→发现 →归因→决策→验证）
- 点击各节点能跳转对应页面
- 当前页面对应节点蓝色高亮
- 侧边栏折叠时显示为 4 个小圆点

**Step 4: Lint 检查**

```bash
cd frontend && npm run lint
```

Expected: 无错误

**Step 5: Commit**

```bash
git add frontend/components/BusinessFlowBar.tsx frontend/components/Sidebar.tsx
git commit -m "feat(nav): 侧边栏新增业务闭环流程指引条"
```

---

### Task 4: 新建 Dashboard 业务闭环横幅组件

**Files:**
- Create: `frontend/components/BusinessFlowBanner.tsx`

**Step 1: 创建组件文件**

新建 `frontend/components/BusinessFlowBanner.tsx`，内容如下：

```tsx
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

interface FlowCard {
  id: string
  step: string        // 流程步骤名
  title: string       // 菜单名
  subtitle: string    // 业务含义
  path: string        // 点击跳转路径
  badge?: string      // 可选角标（如"3条待处理"）
  color: string       // 主题色（Tailwind 类名前缀）
}

const FLOW_CARDS: FlowCard[] = [
  {
    id: 'discover',
    step: '不良发现',
    title: '生产可视化 / 司南智控',
    subtitle: '实时监控异常，触发分析',
    path: '/app/',
    color: 'blue',
  },
  {
    id: 'attribute',
    step: '归因分析',
    title: '格物图谱',
    subtitle: '知识图谱定位根因',
    path: '/app/gewu',
    color: 'violet',
  },
  {
    id: 'decide',
    step: '方案与决策',
    title: '天筹优化',
    subtitle: '多目标优化，生成方案',
    path: '/app/tianchou',
    color: 'amber',
  },
  {
    id: 'verify',
    step: '仿真验证',
    title: '浑天仿真',
    subtitle: '验证方案可行性',
    path: '/app/huntian',
    color: 'emerald',
  },
]

// 颜色映射（Tailwind 不支持动态类名，需要静态映射）
const COLOR_MAP: Record<string, { border: string; bg: string; text: string; dot: string; arrow: string }> = {
  blue: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
    arrow: 'text-blue-700/50',
  },
  violet: {
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/10 hover:bg-violet-500/20',
    text: 'text-violet-400',
    dot: 'bg-violet-500',
    arrow: 'text-violet-700/50',
  },
  amber: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    arrow: 'text-amber-700/50',
  },
  emerald: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    arrow: 'text-emerald-700/50',
  },
}

interface BusinessFlowBannerProps {
  currentPath: string
  onNavigate: (path: string) => void
}

const BusinessFlowBanner: React.FC<BusinessFlowBannerProps> = ({
  currentPath,
  onNavigate,
}) => {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div className="mx-6 mt-4 mb-2">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/40 border border-slate-700/50 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider">业务闭环</span>
            <div className="flex items-center gap-1.5">
              {FLOW_CARDS.map((card, index) => (
                <div key={card.id} className="flex items-center gap-1.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${COLOR_MAP[card.color].dot} ${
                      currentPath === card.path ? 'scale-150' : 'opacity-40'
                    }`}
                  />
                  {index < FLOW_CARDS.length - 1 && (
                    <div className="w-4 h-px bg-slate-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <ChevronDown size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="mx-6 mt-4 mb-2">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            业务闭环导航
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title="折叠"
          >
            <ChevronUp size={14} />
          </button>
        </div>

        {/* 流程卡片 */}
        <div className="flex items-stretch gap-2">
          {FLOW_CARDS.map((card, index) => {
            const isActive = currentPath === card.path
            const colors = COLOR_MAP[card.color]
            return (
              <div key={card.id} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => onNavigate(card.path)}
                  className={`flex-1 flex flex-col gap-1.5 p-3 rounded-lg border transition-all cursor-pointer text-left ${colors.border} ${colors.bg} ${
                    isActive ? 'ring-1 ring-offset-1 ring-offset-slate-800 ring-current' : ''
                  }`}
                  style={isActive ? { ringColor: colors.text } : {}}
                >
                  {/* 步骤名 */}
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                    {card.step}
                  </div>
                  {/* 菜单名 */}
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {card.title}
                  </div>
                  {/* 业务说明 */}
                  <div className="text-[11px] text-slate-400 leading-tight">
                    {card.subtitle}
                  </div>
                  {/* 角标（可选） */}
                  {card.badge && (
                    <div className={`text-[10px] font-medium ${colors.text} mt-0.5`}>
                      {card.badge}
                    </div>
                  )}
                </button>
                {index < FLOW_CARDS.length - 1 && (
                  <ArrowRight size={14} className="flex-shrink-0 text-slate-600" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BusinessFlowBanner
```

**Step 2: 验证文件创建**

```bash
ls frontend/components/BusinessFlowBanner.tsx
```

Expected: 文件存在

---

### Task 5: 在 Dashboard 首页引入业务闭环横幅

**Files:**
- Modify: `frontend/pages/Dashboard.tsx`

**Step 1: 在 Dashboard.tsx 顶部引入组件和 navigate**

Dashboard.tsx 已有 `useNavigate`，只需在 import 区域加：

```typescript
import BusinessFlowBanner from '../components/BusinessFlowBanner'
```

**Step 2: 找到 Dashboard 返回的 JSX 根节点，在最顶部插入横幅**

在 `Dashboard.tsx` 中，找到 `return (` 后的最外层 div 开始处，在第一个子内容之前插入：

```tsx
{/* 业务闭环横幅 */}
<BusinessFlowBanner
  currentPath="/app/"
  onNavigate={navigate}
/>
```

注意：Dashboard 当前路径固定为 `/app/`，高亮「不良发现」卡片。

**Step 3: 验证效果**

```bash
cd frontend && npm run dev
```

浏览器检查：
- 生产可视化页面顶部出现「业务闭环导航」横幅
- 4 个流程卡片：不良发现 → 归因分析 → 方案与决策 → 仿真验证
- 每个卡片显示菜单名和业务说明
- 「不良发现」卡片当前高亮（蓝色边框）
- 点击其他卡片跳转对应页面
- 右上角折叠按钮可收起横幅

**Step 4: Lint 检查**

```bash
cd frontend && npm run lint
```

Expected: 无错误

**Step 5: Commit**

```bash
git add frontend/components/BusinessFlowBanner.tsx frontend/pages/Dashboard.tsx
git commit -m "feat(dashboard): 首页新增业务闭环导航横幅"
```

---

## 验收标准

全部任务完成后，整体验收：

1. **侧边栏**
   - [ ] 分组名：实时监控 / 业务分析 / 平台配置 / 系统维护
   - [ ] 场景编排在「业务分析」下
   - [ ] 菜单名带括号业务含义（如「格物图谱（归因分析）」）
   - [ ] 天筹优化有「核心」黄色角标
   - [ ] 流程条在菜单上方，4 节点正确高亮
   - [ ] 侧边栏折叠时流程条变为 4 个小圆点

2. **Dashboard 首页**
   - [ ] 顶部有业务闭环横幅
   - [ ] 4 个卡片内容和颜色正确
   - [ ] 点击卡片跳转正确
   - [ ] 横幅可折叠/展开

3. **代码质量**
   - [ ] `npm run lint` 无报错
   - [ ] 无 TypeScript 类型错误
