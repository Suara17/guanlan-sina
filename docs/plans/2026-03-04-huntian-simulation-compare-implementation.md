# 浑天仿真验证对比增强 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为“浑天仿真验证”实现布局/任务动态双维度对比、产品切换轻重资产分流、成本与方案绑定展示，并完成端到端数据联动。

**Architecture:** 采用“数据契约先行 + 视图层分块改造”的增量方案：先补齐前后端比较数据结构，再在 `Huntian` 页面建立对比工作台（布局对比、时间轴对比、摘要联动），最后将 `Dashboard -> Tianchou -> Huntian` 的产品切换链路接入资产模式。保留现有组件能力，通过新增 props 与中间聚合层减少重写风险。

**Tech Stack:** React 19 + TypeScript 5.8 + Vite 6 + D3/Recharts + FastAPI + SQLModel + Python 3.10

---

### Task 1: 定义统一对比数据契约（前端类型）

**Files:**
- Modify: `frontend/types.ts`
- Modify: `frontend/pages/Tianchou/types/tianchou.ts`

**字段改动（必须落地）:**
- 在 `frontend/types.ts` 新增：
  - `AssetMode = 'light' | 'heavy'`
  - `CompareViewMode = 'single_toggle' | 'split_lr' | 'split_tb'`
  - `LayoutChangeItem`（`deviceId`、`from`、`to`、`distance`、`changeType`）
  - `LineDirectionChangeItem`（`lineId`、`beforePath`、`afterPath`）
  - `ScheduleBar`（`id`、`label`、`start`、`end`、`resourceIds`、`lane`）
  - `TimelineBinding`（`slotId`、`start`、`end`、`deviceIds`、`lineIds`、`agvRouteIds`）
  - `ScenarioCostBinding`（`scenarioId`、`assetMode`、`materialHandlingCost`、`equipmentMoveCost`、`totalCost`）
  - `SimulationComparisonPayload`（`baseline`、`optimized`、`layoutSummary`、`logisticsSummary`、`scheduleComparison`、`timelineBindings`、`costBinding`）
- 在 `frontend/pages/Tianchou/types/tianchou.ts` 扩展：
  - `OptimizationResult` 增加可选 `asset_mode?: AssetMode`
  - `OptimizationResult` 增加可选 `comparison_payload?: SimulationComparisonPayload`

**Step 1: 写类型变更（无行为改动）**
- 只新增类型与接口，不改现有业务逻辑。

**Step 2: 运行前端类型检查与格式检查**
- Run: `cd frontend; npm run lint`
- Expected: 无新增类型错误；Biome 通过。

**Step 3: Commit**
- `git add frontend/types.ts frontend/pages/Tianchou/types/tianchou.ts`
- `git commit -m "feat(types): add simulation comparison and asset mode contracts"`

---

### Task 2: 产品切换入口接入“轻/重资产”选择

**Files:**
- Modify: `frontend/components/ProductChangeAlert.tsx`
- Modify: `frontend/components/ProductionPlanCard.tsx`
- Modify: `frontend/pages/Dashboard.tsx`
- Modify: `frontend/types.ts`（复用 Task 1 新类型）

**字段改动（必须落地）:**
- `ProductChangeAlertProps` 增加：
  - `assetMode: AssetMode`
  - `onAssetModeChange?: (mode: AssetMode) => void`
- `OptimizationParams` 增加：
  - `asset_mode: AssetMode`
  - 可选 `compare_view_mode?: CompareViewMode`
- `Dashboard` 维护 `assetMode` 状态并透传到 `handleOptimize`。

**Step 1: 改 UI 与状态**
- 在产品切换浮层加入“轻资产 / 重资产”单选切换。
- 默认值设为 `light`，并保留用户最后选择。

**Step 2: 改参数透传**
- `ProductionPlanCard` 和 `Dashboard` 的 `handleOptimize` 必须携带 `asset_mode`。

**Step 3: 本地手工验证**
- 进入 Dashboard，触发产品切换预警。
- 切换资产模式后点击“立即优化”，确认路由 state 含 `asset_mode`。

**Step 4: Commit**
- `git add frontend/components/ProductChangeAlert.tsx frontend/components/ProductionPlanCard.tsx frontend/pages/Dashboard.tsx frontend/types.ts`
- `git commit -m "feat(dashboard): support light/heavy asset mode in product switch entry"`

---

### Task 3: 天筹页面消费资产模式并构建仿真跳转载荷

**Files:**
- Modify: `frontend/pages/Tianchou/index.tsx`
- Modify: `frontend/pages/Tianchou/services/tianchouService.ts`
- Modify: `frontend/pages/Tianchou/types/tianchou.ts`

**字段改动（必须落地）:**
- `createTask` 入参映射：
  - `asset_mode=light` => `industry_type='light'`
  - `asset_mode=heavy` => `industry_type='heavy'`
- 新增服务方法：
  - `getSolutionComparison(taskId: string, solutionId: string)`
- 跳转 `Huntian` 时携带：
  - `optimizationResult.asset_mode`
  - `optimizationResult.comparison_payload`

**Step 1: 路由 state 解析改造**
- 在 `optimizationMode === 'product_switch'` 分支读取并使用 `asset_mode`。

**Step 2: 增加方案对比请求**
- 在“查看仿真”前拉取 `getSolutionComparison`，并组装到 `optimizationResult`。

**Step 3: 验证**
- 手工验证轻/重资产两条链路均可进入 Huntian。

**Step 4: Commit**
- `git add frontend/pages/Tianchou/index.tsx frontend/pages/Tianchou/services/tianchouService.ts frontend/pages/Tianchou/types/tianchou.ts`
- `git commit -m "feat(tianchou): map asset mode and pass comparison payload to huntian"`

---

### Task 4: 后端提供方案对比 API 与产品切换资产参数

**Files:**
- Modify: `backend/app/api/routes/tianchou.py`
- Modify: `backend/app/api/routes/production.py`

**API 字段改动（必须落地）:**
- `POST /api/v1/production/product-switch-optimization` 请求新增：
  - `asset_mode: Literal['light', 'heavy']`
- `GET /api/v1/tianchou/tasks/{task_id}/solutions/{solution_id}` 响应补充（或新增专用端点）：
  - `asset_mode`
  - `comparison_payload`
    - `layout_summary`（`moved_devices`、`line_direction_changes`、`layout_change_summary`）
    - `logistics_summary`（优化前后搬运路径/时长/拥堵点）
    - `schedule_comparison`（`baseline_tasks`、`optimized_tasks`、`delta_summary`）
    - `timeline_bindings`（时段到设备/产线/AGV 路径的映射）
    - `cost_binding`（`material_handling_cost`、`equipment_move_cost`、`total_cost`、`scenario_id`）

**Step 1: 实现字段组装函数**
- 从 `solution.solution_data`（含 `individual`、`schedule`）提取并标准化。

**Step 2: 兼容兜底**
- 对无 `schedule` 或无 `individual` 的历史任务返回空结构而非 500。

**Step 3: 后端验证**
- Run: `cd backend; uv run python -m compileall app`
- Expected: 编译通过。

**Step 4: Commit**
- `git add backend/app/api/routes/tianchou.py backend/app/api/routes/production.py`
- `git commit -m "feat(api): expose comparison payload and asset mode for huntian simulation"`

---

### Task 5: 浑天页面增加“对比工作台”主控层

**Files:**
- Modify: `frontend/pages/Huntian.tsx`
- Create: `frontend/pages/Huntian/components/CompareModeToolbar.tsx`
- Create: `frontend/pages/Huntian/components/SimulationSummaryPanel.tsx`

**行为改动（必须落地）:**
- 新增对比模式状态：
  - `compareViewMode: CompareViewMode`
  - `compareTarget: 'A' | 'B' | 'A_vs_B'`
- 新增“摘要面板”：
  - `物流方案摘要`
  - `布局变更摘要`
  - 方案级成本绑定信息
- 保留原“单视图推演”能力，作为回退模式。

**Step 1: 拆分渲染结构**
- 将 `renderCurrentSimulationView` 拆为单视图与对比视图两个分支。

**Step 2: 加入对比控制栏**
- 顶部加入单切换/左右/上下切换按钮。

**Step 3: 验证**
- 三种视图模式切换时不丢失播放状态与已选时段。

**Step 4: Commit**
- `git add frontend/pages/Huntian.tsx frontend/pages/Huntian/components/CompareModeToolbar.tsx frontend/pages/Huntian/components/SimulationSummaryPanel.tsx`
- `git commit -m "feat(huntian): add comparison workspace shell and summary panels"`

---

### Task 6: 布局同屏对比与关键变化高亮

**Files:**
- Modify: `frontend/components/DeviceLayoutVisualizer.tsx`
- Modify: `frontend/components/LayoutVisualizer.tsx`（legacy 兼容）
- Create: `frontend/pages/Huntian/components/LayoutCompareWorkspace.tsx`

**字段/Props 改动（必须落地）:**
- `DeviceLayoutVisualizerProps` 增加：
  - `layoutVariant?: 'baseline' | 'optimized'`
  - `highlightDeviceIds?: string[]`
  - `highlightLineIds?: string[]`
  - `onDeviceSelect?: (deviceId: string) => void`
  - `forceShowMoveHints?: boolean`
- `LayoutCompareWorkspace` 输入：
  - `comparisonPayload`
  - `compareViewMode`
  - `selectedTimelineSlot`

**Step 1: 增加双面板布局容器**
- 支持左右/上下布局，内部分别渲染 baseline 和 optimized。

**Step 2: 高亮规则落地**
- 设备位移、产线走向变化、关键节点变化高亮与标注文案。

**Step 3: 验证**
- 点击时段后关联设备高亮；切换视图高亮不丢失。

**Step 4: Commit**
- `git add frontend/components/DeviceLayoutVisualizer.tsx frontend/components/LayoutVisualizer.tsx frontend/pages/Huntian/components/LayoutCompareWorkspace.tsx`
- `git commit -m "feat(layout): support split comparison and key change highlights"`

---

### Task 7: 任务动态对比（时间轴/甘特）与布局联动

**Files:**
- Modify: `frontend/components/AGVPathVisualizer.tsx`
- Modify: `frontend/components/AGVLayoutVisualizer.tsx`
- Create: `frontend/pages/Huntian/components/TaskTimelineCompare.tsx`
- Modify: `frontend/pages/Huntian.tsx`

**字段/Props 改动（必须落地）:**
- `AGVPathVisualizerProps` 增加：
  - `externalCurrentTime?: number`
  - `onTimelineSlotClick?: (slotId: string) => void`
  - `highlightRouteIds?: string[]`
- `TaskTimelineCompare` 输入：
  - `baselineTasks: ScheduleBar[]`
  - `optimizedTasks: ScheduleBar[]`
  - `bindings: TimelineBinding[]`
  - `onSelectSlot`

**Step 1: 时间轴对比组件**
- 做双泳道（方案 A/B）对比，展示排程差异块。

**Step 2: 双向联动**
- 点击时段 -> 布局高亮设备/产线/路线；
- 点击设备 -> 定位相关时段（至少单向映射）。

**Step 3: 验证**
- 至少覆盖 3 种时段：正常运输、拥堵冲突、完成里程碑。

**Step 4: Commit**
- `git add frontend/components/AGVPathVisualizer.tsx frontend/components/AGVLayoutVisualizer.tsx frontend/pages/Huntian/components/TaskTimelineCompare.tsx frontend/pages/Huntian.tsx`
- `git commit -m "feat(timeline): add A/B schedule compare and layout linkage"`

---

### Task 8: 结果页方案卡绑定成本信息（轻/重资产差异化）

**Files:**
- Modify: `frontend/pages/Huntian.tsx`
- Modify: `frontend/pages/Tianchou/components/SolutionCard.tsx`
- Modify: `frontend/pages/Tianchou/index.tsx`

**字段改动（必须落地）:**
- 方案卡展示：
  - `物料搬运成本`
  - `设备移动成本`
  - `资产模式标签`（轻资产/重资产）
- 轻资产强调物流调整摘要，重资产强调布局优化摘要。

**Step 1: 补足方案数据映射**
- 从 `comparison_payload.cost_binding` 注入卡片展示数据。

**Step 2: UI 条件展示**
- 根据 `asset_mode` 显示不同“首要建议”文案块。

**Step 3: 验证**
- A/B 方案切换后成本字段必须随方案同步变化。

**Step 4: Commit**
- `git add frontend/pages/Huntian.tsx frontend/pages/Tianchou/components/SolutionCard.tsx frontend/pages/Tianchou/index.tsx`
- `git commit -m "feat(decision): bind cost metrics to scenario and asset mode"`

---

### Task 9: 回归验证与发布前检查

**Files:**
- Modify: `docs/plans/2026-03-04-huntian-simulation-compare-implementation.md`（补充实际执行结果）

**Step 1: 前端检查**
- Run: `cd frontend; npm run lint`
- Run: `cd frontend; npm run build`

**Step 2: 后端检查**
- Run: `cd backend; uv run python -m compileall app`

**Step 3: 手工回归路径**
- `Dashboard` 触发产品切换 -> 选择轻/重资产 -> `Tianchou` 创建任务 -> 跳转 `Huntian`；
- 验证布局同屏对比、时间轴联动、摘要文案、成本绑定四项核心能力。

**Step 4: Commit**
- `git add .`
- `git commit -m "chore: verify huntian comparison flow and readiness"`

---

## 并行实施分工（子代理任务切片）

1. 子代理 A（后端契约）：
- Task 4 + 相关回归（API 输出字段完整性）

2. 子代理 B（入口链路）：
- Task 2 + Task 3（产品切换与资产模式透传）

3. 子代理 C（浑天对比主界面）：
- Task 5 + Task 6（布局对比与摘要）

4. 子代理 D（时序联动）：
- Task 7 + Task 8（任务动态比对与成本绑定）

5. 主代理（集成与验收）：
- Task 1（类型统一）+ Task 9（全量验证与收口）

## 风险与兜底

1. 历史任务 `solution_data` 缺失 `schedule`：
- 兜底为空时间轴，不阻塞布局对比渲染。

2. 高维数据量导致 D3 重绘卡顿：
- 优先做“选中时段局部高亮”，避免全量重算。

3. 轻/重资产映射不一致：
- 前端显示层始终以 `asset_mode` 为准，`industry_type` 仅用于算法任务创建。
