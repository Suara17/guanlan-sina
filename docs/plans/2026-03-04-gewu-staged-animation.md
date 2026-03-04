# 格物图谱分步递进动画 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将格物知识图谱从“全量同时闪动”改为“根因 -> 关联 -> 扩散”的分步递进动画，并对动画时长和密度做硬限制，保证清晰可读与性能稳定。

**Architecture:** 采用“D3 负责布局 + 动画编排器负责时序”的双层结构。先将选中节点子图按 BFS 分层，生成可执行的阶段计划，再由统一调度器分批触发节点/边状态变化。渲染层拆为 base/focus/pulse 三层，避免所有元素同频闪动。

**Tech Stack:** React 19, TypeScript 5.8, D3 7, GSAP 3, Framer Motion（页面级补充动画）, Vitest + Testing Library（新增）

---

### Task 1: 建立前端测试基线（为动画编排做 TDD）

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/test/setup.ts`

**Step 1: 添加测试脚本到 package.json**

在 `scripts` 中增加：

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Step 2: 安装测试依赖**

Run: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom`
Expected: 安装成功，无 `npm ERR!`

**Step 3: 新增 vitest 配置**

创建 `frontend/vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
  },
})
```

**Step 4: 新增测试初始化文件**

创建 `frontend/test/setup.ts`：

```ts
import '@testing-library/jest-dom'
```

**Step 5: 验证测试命令可执行**

Run: `npm run test`
Expected: 0 个或若干测试通过（不应报配置错误）

**Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/test/setup.ts
git commit -m "test(frontend): setup vitest baseline for graph animation tdd"
```

---

### Task 2: 实现“分步计划生成器”纯函数（核心节奏算法）

**Files:**
- Create: `frontend/components/knowledge-graph/animation/types.ts`
- Create: `frontend/components/knowledge-graph/animation/stagingPlanner.ts`
- Create: `frontend/components/knowledge-graph/animation/stagingPlanner.test.ts`
- Modify: `frontend/types.ts`

**Step 1: 先写失败测试（分层顺序 + 密度上限）**

在 `stagingPlanner.test.ts` 写两个核心用例：

```ts
import { describe, expect, it } from 'vitest'
import { buildStagedSequence } from './stagingPlanner'

describe('buildStagedSequence', () => {
  it('按根因->一度关联->二度扩散返回阶段', () => {
    const result = buildStagedSequence(mockGraph, 'cause-1', {
      maxNodesPerWave: 4,
      maxEdgesPerWave: 6,
    })
    expect(result.stages.map((s) => s.kind)).toEqual(['root', 'neighbors', 'diffuse'])
  })

  it('超过密度阈值时自动分批', () => {
    const result = buildStagedSequence(bigGraph, 'cause-1', {
      maxNodesPerWave: 3,
      maxEdgesPerWave: 4,
    })
    expect(result.batches.length).toBeGreaterThan(1)
    expect(result.batches.every((b) => b.nodes.length <= 3)).toBe(true)
  })
})
```

**Step 2: 跑测试确认失败**

Run: `npm run test -- frontend/components/knowledge-graph/animation/stagingPlanner.test.ts`
Expected: FAIL（`buildStagedSequence` 未实现）

**Step 3: 新增动画领域类型**

`types.ts` 中定义：

```ts
export type StageKind = 'root' | 'neighbors' | 'diffuse'

export interface StageBatch {
  kind: StageKind
  nodes: string[]
  edges: string[]
  durationMs: number
}

export interface StagingOptions {
  maxNodesPerWave: number
  maxEdgesPerWave: number
  rootDurationMs: number
  neighborsDurationMs: number
  diffuseDurationMs: number
}
```

**Step 4: 实现最小可用 `buildStagedSequence`**

`stagingPlanner.ts` 实现：
- 从选中节点 BFS 取 depth 0/1/2
- 按 `StageKind` 映射阶段
- 使用 `maxNodesPerWave`、`maxEdgesPerWave` 切批
- 产出可直接驱动动画的 `batches`

**Step 5: 在全局类型中补充动画配置接口**

在 `frontend/types.ts` 增加：

```ts
export interface KnowledgeGraphAnimationProfile {
  maxNodesPerWave: number
  maxEdgesPerWave: number
  rootDurationMs: number
  neighborsDurationMs: number
  diffuseDurationMs: number
  staggerMs: number
}
```

**Step 6: 跑测试确认通过**

Run: `npm run test -- frontend/components/knowledge-graph/animation/stagingPlanner.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add frontend/components/knowledge-graph/animation/types.ts frontend/components/knowledge-graph/animation/stagingPlanner.ts frontend/components/knowledge-graph/animation/stagingPlanner.test.ts frontend/types.ts
git commit -m "feat(knowledge-graph): add staged sequence planner with density caps"
```

---

### Task 3: 实现动画调度 Hook（时序执行与取消）

**Files:**
- Create: `frontend/components/knowledge-graph/animation/useStagedAnimation.ts`
- Create: `frontend/components/knowledge-graph/animation/useStagedAnimation.test.tsx`

**Step 1: 先写失败测试（阶段推进与中断）**

测试点：
- 启动后按阶段推进
- 切换选中节点时取消旧序列
- 全局禁用动画时直接进入最终高亮态

```ts
expect(result.current.phase).toBe('root')
vi.advanceTimersByTime(500)
expect(result.current.phase).toBe('neighbors')
```

**Step 2: 跑测试确认失败**

Run: `npm run test -- frontend/components/knowledge-graph/animation/useStagedAnimation.test.tsx`
Expected: FAIL（Hook 未实现）

**Step 3: 实现 Hook**

实现要点：
- 输入：`sequence`, `selectedNodeId`, `enabled`
- 输出：`phase`, `activeNodeIds`, `activeEdgeIds`, `isRunning`
- 使用 `setTimeout` 驱动阶段推进
- 清理函数中取消所有 pending timer

**Step 4: 跑测试确认通过**

Run: `npm run test -- frontend/components/knowledge-graph/animation/useStagedAnimation.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/knowledge-graph/animation/useStagedAnimation.ts frontend/components/knowledge-graph/animation/useStagedAnimation.test.tsx
git commit -m "feat(knowledge-graph): add staged animation scheduler hook"
```

---

### Task 4: 重构图谱画布为三层渲染并接入分步动画

**Files:**
- Modify: `frontend/components/KnowledgeGraphCanvas.tsx`
- Create: `frontend/components/knowledge-graph/animation/defaultProfile.ts`

**Step 1: 抽离默认动画参数**

创建 `defaultProfile.ts`：

```ts
import type { KnowledgeGraphAnimationProfile } from '../../../types'

export const DEFAULT_GRAPH_ANIMATION_PROFILE: KnowledgeGraphAnimationProfile = {
  maxNodesPerWave: 12,
  maxEdgesPerWave: 24,
  rootDurationMs: 500,
  neighborsDurationMs: 700,
  diffuseDurationMs: 900,
  staggerMs: 80,
}
```

**Step 2: 在 Canvas 中引入计划生成器和调度 Hook**

集成 `buildStagedSequence` + `useStagedAnimation`，以 `selectedNodeId` 触发序列重算。

**Step 3: 渲染分层**

将当前单层渲染改为：
- `g.base`: 全图低对比静态
- `g.focus`: 当前阶段高亮节点/边
- `g.pulse`: 扩散波（仅 diffuse 阶段）

**Step 4: 控制“同时闪动数量”**

仅对 `activeNodeIds`/`activeEdgeIds` 应用动画 class 或 GSAP timeline；其余元素保持静态或弱显。

**Step 5: 运行定向测试**

Run: `npm run test -- frontend/components/knowledge-graph/animation/stagingPlanner.test.ts frontend/components/knowledge-graph/animation/useStagedAnimation.test.tsx`
Expected: PASS

**Step 6: 运行构建验证**

Run: `npm run build`
Expected: BUILD SUCCESS，无 TypeScript 报错

**Step 7: Commit**

```bash
git add frontend/components/KnowledgeGraphCanvas.tsx frontend/components/knowledge-graph/animation/defaultProfile.ts
git commit -m "refactor(knowledge-graph): render staged focus layers and progressive highlight"
```

---

### Task 5: 页面级控制与用户体验降噪

**Files:**
- Modify: `frontend/pages/KnowledgeGraph.tsx`
- Modify: `frontend/components/KnowledgeGraphCanvas.tsx`

**Step 1: 页面加入动画开关与模式**

最小字段：
- `animationEnabled`（默认 true）
- `animationDensity`（`normal` / `low`）

**Step 2: 接入 `prefers-reduced-motion`**

若系统开启 reduced motion，则默认 `animationEnabled = false` 或时长降级为 0。

**Step 3: 统一传参与持久化**

将 profile 通过 props 传给 `KnowledgeGraphCanvas`，并将用户选择写入 `localStorage`。

**Step 4: 手工验收**

Run: `npm run dev`
Expected:
- 首次进入图谱无“全屏同时闪动”
- 点击节点后按 root -> neighbors -> diffuse 依次高亮
- 低密度模式下同屏动画明显减少

**Step 5: Commit**

```bash
git add frontend/pages/KnowledgeGraph.tsx frontend/components/KnowledgeGraphCanvas.tsx
git commit -m "feat(knowledge-graph): add animation controls and reduced-motion fallback"
```

---

### Task 6: 回归验证与发布前检查

**Files:**
- Modify: `frontend/README.md`（若有动画配置说明则补充）

**Step 1: 运行完整检查**

Run: `npm run test`
Expected: PASS

**Step 2: 运行静态检查**

Run: `npm run lint`
Expected: PASS（Biome 无阻塞错误）

**Step 3: 运行生产构建**

Run: `npm run build`
Expected: PASS（构建产物生成成功）

**Step 4: 补充文档**

在 README 增加“图谱动画参数说明”：
- 分阶段含义
- 密度阈值建议
- reduced-motion 降级逻辑

**Step 5: Commit**

```bash
git add frontend/README.md
git commit -m "docs(frontend): document staged graph animation profile and accessibility fallback"
```

---

## 验收标准（Done Definition）

- 选中节点后动画必须按 `root -> neighbors -> diffuse` 顺序执行
- 任一时刻动画节点数不超过配置阈值（默认 12）
- 任一时刻动画边数不超过配置阈值（默认 24）
- 系统开启 `prefers-reduced-motion` 时，界面无高频闪动
- `npm run test`、`npm run lint`、`npm run build` 全部通过
