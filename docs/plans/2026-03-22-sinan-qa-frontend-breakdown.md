# 司南问答前端组件改造拆解

日期：2026-03-22  
分支：`knowledge-qa`  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 文档目的
- 将“司南数字人作为问答入口”的页面策略继续细化到组件层。
- 直接回答前端实现时的三个问题：
  - 哪个组件负责显示
  - 哪个组件负责问答面板
  - 哪些页面如何接入

## 关联文档
- 设计总方案：
  - [2026-03-22-knowledge-graph-qa-design.md](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\plans\2026-03-22-knowledge-graph-qa-design.md)
- 实施计划：
  - [2026-03-22-knowledge-graph-qa-implementation.md](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\plans\2026-03-22-knowledge-graph-qa-implementation.md)
- 入口设计：
  - [2026-03-22-sinan-qa-entry-design.md](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\plans\2026-03-22-sinan-qa-entry-design.md)

## 现有代码现状

### 已有入口组件
- [SinanAvatar.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\components\SinanAvatar.tsx)
  - 已具备悬浮数字人、提示气泡、点击跳转能力。
  - 当前职责偏“导航入口”，不是“问答入口”。

### 已有问答浮层组件
- [AiAssistant.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\components\AiAssistant.tsx)
  - 当前是通用悬浮浮层。
  - 但交互仍然是“一键诊断”，不支持自由提问与来源展示。

### 已有全局挂载位置
- [App.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\App.tsx)
  - 已有全局挂载 `AiAssistant` 的位置。
  - 当前 `showGlobalAi = false`，未启用。

### 页面现状
- [Dashboard.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\pages\Dashboard.tsx)
  - 已在页面底部固定挂了 `SinanAvatar`
- [SinanAnalysis.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\pages\SinanAnalysis.tsx)
  - 当前没有悬浮司南
- [KnowledgeGraph.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\pages\KnowledgeGraph.tsx)
  - 当前没有悬浮司南
- [KernelConnect.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\pages\KernelConnect.tsx)
  - 当前没有悬浮司南
- [Huntian.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\pages\Huntian.tsx)
  - 页面密度高，不适合悬浮数字人
- [Zhixing/index.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\pages\Zhixing\index.tsx)
  - 页面右侧信息密集，不适合悬浮数字人

## 推荐组件职责划分

### 方案结论
- `SinanAvatar.tsx`
  - 只负责“收起态入口”
- `AiAssistant.tsx`
  - 重构为“展开态问答面板”
- `App.tsx`
  - 负责全局挂载、显示开关、上下文分发

这意味着最终不是“页面里各自做一套司南问答”，而是：
- 页面只决定“是否显示入口”和“注入什么上下文”
- 问答面板本身全局唯一

## 推荐新增状态模型

### 在 `App.tsx` 统一维护
- `isSinanQaOpen: boolean`
- `sinanQaSource: 'dashboard' | 'sinan' | 'gewu' | 'kernel' | 'huntian' | 'tianchou' | 'zhixing' | 'global'`
- `sinanQaContext: Record<string, unknown>`
- `sinanQaDraftQuestion?: string`

### 作用
- `isSinanQaOpen`
  - 控制问答面板展开/收起
- `sinanQaSource`
  - 标记从哪个页面或按钮打开
- `sinanQaContext`
  - 向后端问答 API 传递上下文，例如 `line_type`、`sequence`、`anomalyId`
- `sinanQaDraftQuestion`
  - 支持页面按钮一键注入预设问题

## 组件改造建议

### 1. `App.tsx`

**职责**
- 全局挂载司南问答组件
- 通过路由决定哪些页面显示悬浮入口
- 统一管理打开/关闭与上下文

**建议改造**
- 将当前 `showGlobalAi = false` 改成路由判断逻辑
- 抽出：
  - `shouldShowFloatingSinan(location.pathname)`
  - `buildSinanContext(location.pathname, location.state, searchParams)`
- 在 `Layout` 内统一挂载：
  - `SinanAvatar`
  - `AiAssistant`

**不要继续的做法**
- 不要让 `Dashboard.tsx` 自己单独固定挂 `SinanAvatar`
- 不要让每个页面各自复制悬浮定位逻辑

### 2. `SinanAvatar.tsx`

**新职责**
- 作为点击入口
- 负责收起态展示和轻提示气泡
- 不再默认跳转 `/app/sinan`

**建议新增 props**
- `onOpen?: () => void`
- `previewMessage?: string`
- `placement?: 'bottom-right'`
- `showBubble?: boolean`
- `disabled?: boolean`
- `mode: 'idle' | 'alert' | 'qa'`

**建议移除的默认行为**
- 当前 `onClick={() => navigate('/app/sinan')}`
- 应改成优先执行 `onOpen`
- 若无 `onOpen`，再考虑 fallback 导航

**气泡文案建议**
- Dashboard：
  - `问我异常原因或SOP`
- SinanAnalysis：
  - `问我这条诊断依据`
- KnowledgeGraph：
  - `问我当前异常怎么处理`
- KernelConnect：
  - `问我设备接入怎么排查`

### 3. `AiAssistant.tsx`

**新职责**
- 从“一键诊断卡片”改为真正的问答面板
- 显示消息流、输入框、引用来源、错误/降级提示

**建议新增 props**
- `open: boolean`
- `onClose: () => void`
- `contextData: Record<string, unknown>`
- `entrySource?: string`
- `draftQuestion?: string | null`

**内部功能重构**
- 删除当前 `handleAnalyze()` 这种固定问题提交模式
- 改成：
  - 用户输入问题
  - 调统一 `knowledgeQaApi.ask()`
  - 渲染回答和来源

**面板结构**
- Header
  - `司南 · 知识问答`
  - 来源标签：例如 `来自格物图谱`
- Body
  - 用户消息
  - 司南回答
  - `图谱事实`
  - `文档依据`
- Footer
  - 输入框
  - 发送按钮
  - 快捷问题 chips

## 页面接入方式

### 第一阶段悬浮接入页面

#### `Dashboard.tsx`
**接入方式**
- 不再自己固定挂载 `SinanAvatar`
- 改由 `App.tsx` 统一挂载
- 仅向全局层提供上下文

**建议上下文**
- `page: 'dashboard'`
- `lineType`
- `alertMessage`
- 关键指标摘要

**备注**
- 当前 [Dashboard.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\pages\Dashboard.tsx) 底部已有：
  - `fixed bottom-6 right-6`
  - 后续应移除，改为全局挂载

#### `SinanAnalysis.tsx`
**接入方式**
- 页面本身不固定挂组件
- 由 `App.tsx` 判断当前路由为 `/app/sinan` 时显示悬浮司南

**建议上下文**
- `page: 'sinan'`
- `anomalyId`
- `rootCause`
- `selectedSolution`

**快捷问题**
- `为什么判断是这个根因`
- `这个方案依据是什么`
- `有类似案例吗`

#### `KnowledgeGraph.tsx`
**接入方式**
- 由 `App.tsx` 统一挂载
- 页面通过 URL 参数和选中节点向全局层传上下文

**建议上下文**
- `page: 'gewu'`
- `anomalyId`
- `sequence`
- `lineType`
- `selectedNode`

**快捷问题**
- `当前异常的主要原因是什么`
- `处理步骤是什么`
- `有没有相关SOP`

### 第二阶段可扩展页面

#### `KernelConnect.tsx`
**接入方式**
- 由 `App.tsx` 控制是否显示悬浮司南

**建议上下文**
- `page: 'kernel'`
- `deviceCount`
- `bindingCompletion`
- `errorMessage`

### 不放悬浮数字人，但保留按钮入口的页面

#### `Huntian.tsx`
**方式**
- 页头或右上工具栏加入 `问司南`
- 点击后调用全局 `openSinanQa({ source: 'huntian', context, draftQuestion })`

**建议问题**
- `这个仿真结果的依据是什么`
- `为什么优化后更好`

#### `Tianchou.tsx`
**方式**
- 方案卡片或顶部栏增加 `追问司南`

**建议问题**
- `为什么推荐这个方案`
- `这个方案的风险点是什么`

#### `Zhixing/index.tsx`
**方式**
- 执行监控页头增加 `问司南`

**建议问题**
- `当前执行异常怎么处理`
- `这一步失败会影响什么`

## 推荐实现顺序

### Step 1
- 改 `App.tsx`
- 统一全局挂载和状态管理

### Step 2
- 改 `SinanAvatar.tsx`
- 去掉默认跳转，改成触发打开动作

### Step 3
- 改 `AiAssistant.tsx`
- 替换为真正问答面板

### Step 4
- 从 `Dashboard.tsx` 移除局部固定司南挂载

### Step 5
- 给 `SinanAnalysis.tsx`、`KnowledgeGraph.tsx` 补上下文接入

### Step 6
- 给 `Huntian.tsx`、`Tianchou.tsx`、`Zhixing/index.tsx` 加轻量按钮入口

## 首版验收标准
- 司南悬浮入口只在以下页面自动出现：
  - `Dashboard`
  - `SinanAnalysis`
  - `KnowledgeGraph`
- 点击司南不会跳页，而是展开问答面板
- 问答面板支持自由输入
- 问答面板支持显示来源
- `Huntian`、`Tianchou`、`Zhixing` 能通过按钮打开同一面板

## 一句话结论
- 前端最稳的落地方式不是“每页各放一个问答组件”，而是“`App.tsx` 统一挂载一个全局司南问答系统，`SinanAvatar` 负责入口，`AiAssistant` 负责面板，不同页面只负责提供上下文和触发方式”。
