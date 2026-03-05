# Scenario Builder Lightweight Linkage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 以最小前端改造实现“场景编排与产线绑定，并能联动跳转仿真/优化”，且不改后端接口。

**Architecture:** 在 `ScenarioBuilder` 内新增轻量编排元数据（适用产线、节点类型摘要、预计损失），保存到 `localStorage`。部署时通过路由 `state` 把编排上下文传递给 `Tianchou/Huntian`，并在 `Tianchou` 创建任务时自动注入 `constraints.production_lines`。维持现有 API 与页面结构，仅做前端增量扩展。

**Tech Stack:** React 19, TypeScript, React Router, @xyflow/react, localStorage

---

### Task 1: 编排数据模型与计划持久化

**Files:**
- Modify: `frontend/pages/ScenarioBuilder.tsx`

**Step 1: Write the failing test**

当前仓库未配置 `ScenarioBuilder` 单测。先定义手动验证用例：点击“保存”后刷新页面仍可恢复最新编排计划。

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: 当前代码无“保存/恢复计划”逻辑，功能层面为 FAIL（仅样式和语法可能 PASS）。

**Step 3: Write minimal implementation**

在 `ScenarioBuilder` 增加：
- `ScenarioPlanDraft` 类型（id/name/lineIds/nodes/edges/summary）
- `savePlanToLocalStorage` 与 `loadLatestPlanFromLocalStorage`
- `保存`按钮行为与提示

**Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: PASS；手工验证“保存后刷新可恢复”通过。

**Step 5: Commit**

```bash
git add frontend/pages/ScenarioBuilder.tsx
git commit -m "feat(builder): persist lightweight scenario draft to local storage"
```

### Task 2: 场景编排绑定产线与节点扩展

**Files:**
- Modify: `frontend/pages/ScenarioBuilder.tsx`

**Step 1: Write the failing test**

手动验证用例：
- 页面可选择“适用产线”；
- 新增“决策输出/方案与预期损失”节点可拖入画布。

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: 现状无上述 UI 能力，功能 FAIL。

**Step 3: Write minimal implementation**

在画布工具栏/侧栏增加：
- 产线多选绑定（先基于 `PRODUCTION_LINES`）
- 组件库新增“决策输出”“方案与预期损失”节点
- 轻量摘要字段（本次方案、预期损失估算）

**Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: PASS；手动验证节点可拖拽、产线可绑定。

**Step 5: Commit**

```bash
git add frontend/pages/ScenarioBuilder.tsx
git commit -m "feat(builder): add production-line binding and decision output nodes"
```

### Task 3: 编排跳转联动到 Tianchou（优化）

**Files:**
- Modify: `frontend/pages/ScenarioBuilder.tsx`
- Modify: `frontend/pages/Tianchou/index.tsx`
- Modify: `frontend/pages/Tianchou/components/TaskConfigForm.tsx`

**Step 1: Write the failing test**

手动验证用例：
- 从编排页“部署到优化”跳转后，任务配置页可见“来自编排方案”上下文；
- 提交任务时 `constraints.production_lines` 被带上。

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: 现状不识别 `optimizationMode === "scenario_builder"`，功能 FAIL。

**Step 3: Write minimal implementation**

实现：
- 路由 state 传递 `scenarioPlan`
- `Tianchou` 读取并展示编排上下文
- `TaskConfigForm` 支持注入外部 `production_lines`

**Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: PASS；手动验证请求 payload 带 `constraints.production_lines`。

**Step 5: Commit**

```bash
git add frontend/pages/ScenarioBuilder.tsx frontend/pages/Tianchou/index.tsx frontend/pages/Tianchou/components/TaskConfigForm.tsx
git commit -m "feat(tianchou): accept builder context and apply production line constraints"
```

### Task 4: 编排跳转联动到 Huntian（仿真）

**Files:**
- Modify: `frontend/pages/ScenarioBuilder.tsx`
- Modify: `frontend/pages/Huntian.tsx`

**Step 1: Write the failing test**

手动验证用例：
- 从编排页“按编排推演”跳转后，仿真页可见编排摘要（方案名、产线数、预期损失）。

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: 现状无编排摘要展示，功能 FAIL。

**Step 3: Write minimal implementation**

实现：
- `HuntianRouteState` 增加 `scenarioPlan` 类型
- 顶部或侧栏显示编排摘要信息

**Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: PASS；手动验证摘要显示正确。

**Step 5: Commit**

```bash
git add frontend/pages/ScenarioBuilder.tsx frontend/pages/Huntian.tsx
git commit -m "feat(huntian): show scenario builder context summary"
```

### Task 5: 修复已知字段映射错误并回归

**Files:**
- Modify: `frontend/pages/Tianchou/index.tsx`

**Step 1: Write the failing test**

手动验证用例：传入 `solution.expected_loss` 时，`decisionContext.expectedLoss` 与其一致，不再错误引用 `expected_benefit`。

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: 现状逻辑错误，功能 FAIL。

**Step 3: Write minimal implementation**

将 `expectedLoss: solution.expected_benefit` 更正为 `expectedLoss: solution.expected_loss`。

**Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: PASS；手动验证值来源正确。

**Step 5: Commit**

```bash
git add frontend/pages/Tianchou/index.tsx
git commit -m "fix(tianchou): map expectedLoss from expected_loss"
```

### 全量验证

1. `npm run lint`  
2. 手动验证路径：
- `/app/builder` 保存编排、绑定产线、部署到优化/仿真
- `/app/tianchou` 接收并显示编排上下文，提交任务携带产线约束
- `/app/huntian` 显示编排摘要

### 风险与边界

1. 轻量方案依赖 `localStorage + route state`，不具备后端可追溯性。  
2. 产线绑定先使用前端已有 `PRODUCTION_LINES`，后续可替换为 `/api/v1/production/lines`。  
3. 不改后端 schema 与 API，确保改动可快速上线与回滚。
