# 场景编排轻量联动进展交接（2026-03-05）

## 1. 任务背景

- 目标：采用“轻量前端方案”实现 `ScenarioBuilder` 与产线关联，并联动到仿真/优化页面。
- 范围：前端增量改造，不新增后端接口，不改数据库 schema。

## 2. 已完成内容（代码已落地）

### 2.1 编排页能力增强（`frontend/pages/ScenarioBuilder.tsx`）

- 新增轻量编排数据模型 `ScenarioPlanDraft`。
- 新增本地存储能力：
  - `SCENARIO_PLAN_STORAGE_KEY = scenario_builder_plans_v1`
  - 支持保存/读取最近编排草稿（`localStorage`）。
- 新增“决策输出”组件分组与节点：
  - `决策输出`
  - `方案与预期损失`
- 新增编排元数据配置 UI：
  - 方案名称
  - 适用产线（多选）
  - 绑定设备列表（由执行动作节点自动提取）
  - 本次方案摘要
  - 预期损失
- 新增联动入口：
  - `按编排推演`：跳转 `/app/huntian` 并传 `scenarioPlan`
  - `创建优化任务`：跳转 `/app/tianchou` 并传 `scenarioPlan`

### 2.2 优化页接入编排上下文（`frontend/pages/Tianchou/index.tsx`）

- 新增 `scenario_builder` 模式识别（读取 `location.state.optimizationMode`）。
- 新增 `ScenarioPlanContext` 状态管理。
- 在配置阶段新增“当前编排下的约束与目标”摘要卡片。
- 将编排上下文透传给 `TaskConfigForm`。
- 修复已发现逻辑错误：
  - `expectedLoss` 原错误映射为 `expected_benefit`
  - 已改为 `expected_loss`

### 2.3 优化表单注入约束（`frontend/pages/Tianchou/components/TaskConfigForm.tsx`）

- 新增 `prefillFromScenario` 入参。
- 支持自动填充任务名。
- 提交时自动注入：
  - `constraints.production_lines = prefillFromScenario.productionLines`
- 新增“来自场景编排”信息展示块（摘要、产线、预期损失）。

### 2.4 仿真页展示编排摘要（`frontend/pages/Huntian.tsx`）

- 扩展路由状态，支持接收 `scenarioPlan`。
- 新增 `scenarioPlanContext` 状态。
- 顶部工具栏新增编排摘要标签：
  - 编排名称
  - 产线数量
  - 预期损失

### 2.5 文档已创建

- 方案文档：`docs/plans/2026-03-05-scenario-builder-lightweight-linkage.md`

## 3. 未完成内容（下一步必须做）

### 3.1 清理非目标改动（高优先级）

- 已完成：已回退所有非本次需求文件改动。
- 当前仅保留以下目标文件改动：
  - `frontend/pages/ScenarioBuilder.tsx`
  - `frontend/pages/Tianchou/index.tsx`
  - `frontend/pages/Tianchou/components/TaskConfigForm.tsx`
  - `frontend/pages/Huntian.tsx`
  - `docs/plans/2026-03-05-scenario-builder-lightweight-linkage.md`
  - `docs/plans/2026-03-05-scenario-builder-lightweight-progress-handoff.md`

### 3.2 校验与联调

- 已完成（自动化部分）：
  - `npm run build` 成功（Vite 生产构建通过）。
  - 代码链路核对通过：
    - `ScenarioBuilder -> Tianchou` 路由状态携带 `optimizationMode: "scenario_builder"` 与 `scenarioPlan`。
    - `TaskConfigForm` 提交时注入 `constraints.production_lines`。
    - `Huntian` 已接收并展示 `scenarioPlan` 摘要标签。
    - `Tianchou` 的 `expectedLoss` 映射已确认来自 `solution.expected_loss`。
- 补充修复：
  - 修正 `ScenarioBuilder` 中“绑定设备列表”的提取逻辑，避免把“方案与预期损失”这类非执行节点误识别为设备。
- 待完成（手工联调）：
  - 进入 `/app/builder`：保存编排并刷新，确认恢复。
  - 点击“创建优化任务”：跳转后确认摘要展示，提交流程抓包确认 `constraints.production_lines`。
  - 点击“按编排推演”：跳转后确认编排摘要标签展示。
- lint 说明：
  - 目前 `npm run lint` 仍绑定 `biome check --write`，会触发全量格式化，暂不建议在此分支直接执行。

### 3.3 可选增强（后续迭代）

- 产线来源从 `mockData` 切到 `/api/v1/production/lines`。
- 绑定设备从“节点标签”升级为“真实设备ID”。
- 从 `localStorage` 方案升级到后端持久化实体。

## 4. 当前阻塞与风险

- 已解除阻塞：非目标改动已清理。
- 当前风险：
  - 仍需一次浏览器侧手工联调确认交互链路与请求 payload。
  - 项目 `lint` 命令仍为写模式，误执行有再次引入噪音改动的风险。

## 5. 建议执行顺序

1. 回退非目标文件改动。
2. 仅保留本次需求相关文件。
3. 重新做一次最小功能验证。
4. 再决定是否提交或继续扩展。
