# 司南数字人问答入口设计

日期：2026-03-22  
分支：`knowledge-qa`  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 文档目的
- 明确“司南数字人扩展为全局知识问答入口”的前端设计。
- 补充 [2026-03-22-knowledge-graph-qa-implementation.md](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\plans\2026-03-22-knowledge-graph-qa-implementation.md) 中前端入口部分的细节。
- 解决三个问题：
  - 哪些页面放置悬浮数字人
  - 入口放在哪里
  - 点击后怎么呈现问答

## 与现有代码的关系

### 当前现状
- [SinanAvatar.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\components\SinanAvatar.tsx)
  - 已经是“悬浮数字人 + 气泡提示 + 点击跳转 `/app/sinan`”的基础形态。
- [AiAssistant.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\components\AiAssistant.tsx)
  - 当前是普通右下角悬浮助手，但交互仍是“一键诊断”。
- [App.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\App.tsx)
  - 当前存在全局挂载 `AiAssistant` 的位置，但 `showGlobalAi = false`，实际未启用。

### 设计结论
- 全局问答入口以“司南数字人”为主，而不是普通聊天按钮。
- `AiAssistant` 不再作为最终产品心智入口。
- 组件实现上可以：
  - 复用 `AiAssistant` 的浮层骨架
  - 复用 `SinanAvatar` 的形象入口
  - 最终组合成“司南数字人 + 问答面板”的统一组件

## 放置策略

### 总原则
- 司南数字人是全局能力入口，但不是所有页面都必须显示。
- 首版优先覆盖“用户最可能提问”的业务页面。
- 避免在强沉浸、强操作、强对比页面里遮挡核心交互。

### 首版建议放置页面

#### 1. `Dashboard`
- 页面：`/app/`
- 建议：放置
- 原因：
  - 用户进入系统后的第一个主界面
  - 适合作为全局问答主入口
  - 可承接“异常原因、SOP、产线状态、排查建议”等通用问题

#### 2. `SinanAnalysis`
- 页面：`/app/sinan`
- 建议：放置
- 原因：
  - 与“司南智能诊断”语义一致
  - 用户在此页面天然有追问需求
  - 适合承接“为什么判断是这个根因”“依据是什么”“下一步怎么处理”

#### 3. `KnowledgeGraph`
- 页面：`/app/gewu`
- 建议：放置
- 原因：
  - 用户已进入异常-原因-方案图谱场景
  - 适合围绕当前异常、节点、因果链做追问
  - 可与当前异常 `sequence/anomalyId` 联动

#### 4. `KernelConnect`
- 页面：`/app/kernel`
- 建议：可放置
- 原因：
  - 这里存在设备接入、协议、连接状态类疑问
  - 适合问操作说明、点检规范、常见故障排查
- 说明：
  - 如果首版范围要收窄，可以放到第二阶段

### 首版不建议放置页面

#### 1. `Huntian`
- 页面：`/app/huntian`
- 建议：首版不放
- 原因：
  - 仿真验证页面可视化密度高
  - 右下角往往要留给播放控制、视图操作或信息浮层
  - 加悬浮数字人容易遮挡关键图表/布局区
- 替代方案：
  - 在页头或侧栏放一个“问司南”文字按钮，打开同一问答面板

#### 2. `Tianchou`
- 页面：`/app/tianchou`
- 建议：首版不放
- 原因：
  - 决策页面本身卡片、表单、图表较多
  - 用户任务目标明确，悬浮角色容易分散注意力
- 替代方案：
  - 在方案卡或顶部工具栏加入“追问司南”入口

#### 3. `Zhixing`
- 页面：`/app/zhixing`
- 建议：首版不放
- 原因：
  - 执行监控页面偏实时态
  - 若加入悬浮数字人，容易与日志、告警、滚动面板抢注意力
- 替代方案：
  - 通过告警卡片上的“交给司南分析”进入问答

#### 4. 登录页、落地页、视频页
- 页面：
  - `/`
  - `/login`
  - `/video`
- 建议：不放
- 原因：
  - 这些页面不是业务操作页
  - 问答能力应在登录后业务场景中出现

## 最终页面策略

### 第一阶段直接放置
- `Dashboard`
- `SinanAnalysis`
- `KnowledgeGraph`

### 第二阶段按需要补充
- `KernelConnect`

### 第一阶段不以悬浮数字人形式放置
- `Huntian`
- `Tianchou`
- `Zhixing`

### 完全不放置
- `LandingPage`
- `LoginPage`
- `VideoPlayer`
- `AboutUs`
- `CustomerCases`
- `Marketplace`
- `Ecosystem`
- `Settings`

## 入口位置与视觉形态

### 收起态
- 位置：右下角固定悬浮
- 形态：司南数字人头像/半身角色
- 附带一条轻提示气泡

### 展开态
- 形态：右侧展开问答面板
- 宽度建议：`360px - 420px`
- 面板结构：
  - 顶部：`司南 · 知识问答`
  - 中部：消息流
  - 底部：输入框 + 发送按钮 + 快捷问题

### 不建议的形态
- 不建议只做一个小聊天气泡框
- 不建议以普通 `MessageSquare` 按钮替代司南形象

## 页面上下文策略

### Dashboard
- 默认上下文：
  - 当前页面
  - 当前产线基础指标
- 快捷问题建议：
  - `当前产线有哪些风险点`
  - `最近异常应该怎么排查`
  - `有没有相关SOP或处理规范`

### SinanAnalysis
- 默认上下文：
  - 当前异常
  - 根因分析结果
  - 推荐方案摘要
- 快捷问题建议：
  - `为什么判断是这个根因`
  - `这个方案依据是什么`
  - `还有没有类似案例`

### KnowledgeGraph
- 默认上下文：
  - 当前异常 `anomalyId/sequence`
  - 当前产线 `lineType`
  - 当前选中节点信息
- 快捷问题建议：
  - `这个异常的主要原因是什么`
  - `处理步骤是什么`
  - `相关SOP依据是什么`

### KernelConnect
- 默认上下文：
  - 设备连接状态
  - 协议或接入信息
- 快捷问题建议：
  - `这个设备连接异常怎么排查`
  - `有对应点检规范吗`

## 与其他页面的协同方式

### Huntian / Tianchou / Zhixing
- 不使用悬浮数字人，但保留问答能力入口
- 建议采用轻入口：
  - 页头按钮：`问司南`
  - 卡片按钮：`追问原因`
  - 结果区链接：`查看依据`
- 点击后打开同一个全局问答面板

## 组件拆分建议

### 方案 A：保留现有文件，内部重构
- [SinanAvatar.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\components\SinanAvatar.tsx)
  - 负责收起态数字人入口
- [AiAssistant.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\components\AiAssistant.tsx)
  - 重构为问答面板
- 在 [App.tsx](E:\Guanlan-Sina\.worktrees\knowledge-qa\frontend\App.tsx) 中统一挂载

### 方案 B：组件重命名，更清晰
- 新建 `SinanQaWidget.tsx`
  - 统一管理收起态和展开态
- `SinanAvatar.tsx`
  - 作为纯视觉子组件
- `AiAssistant.tsx`
  - 逐步废弃或迁移

### 建议
- 首版建议走方案 A
- 原因：
  - 改动小
  - 接入快
  - 风险低

## 与实施计划文档的一致性说明
- 本文档不改变已有实施计划中的后端主线。
- 对 [2026-03-22-knowledge-graph-qa-implementation.md](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\plans\2026-03-22-knowledge-graph-qa-implementation.md) 的补充点只有一条：
  - 前端主入口应以“司南数字人全局悬浮入口”实现，而不是普通 AI 按钮
- 实施计划中的 `Task 8：前端接入统一知识问答入口` 仍然成立，只是其 UI 落地方式以本文档为准。
- 组件级拆解与落地顺序见：
  - [2026-03-22-sinan-qa-frontend-breakdown.md](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\plans\2026-03-22-sinan-qa-frontend-breakdown.md)

## 最终建议
- 第一阶段把悬浮司南数字人放在：
  - `Dashboard`
  - `SinanAnalysis`
  - `KnowledgeGraph`
- 第二阶段视情况扩到：
  - `KernelConnect`
- `Huntian`、`Tianchou`、`Zhixing` 不放悬浮数字人，但保留“问司南”按钮入口

## 一句话结论
- “司南数字人”应作为登录后业务区的全局问答入口，但首版只在 `Dashboard`、`SinanAnalysis`、`KnowledgeGraph` 三个核心页面以悬浮形态出现，其余高密度页面使用轻量按钮打开同一问答面板。
