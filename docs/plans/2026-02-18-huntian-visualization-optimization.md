# 浑天仿真页面可视化优化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化浑天仿真页面的可视化组件，完整实现轻工业（设备布局）和重工业（AGV路径）两种场景的所有可视化需求。

**Architecture:** 基于 React + Framer Motion + SVG 的可视化架构，增强现有 LayoutVisualizer 和 AGVPathVisualizer 组件，添加新功能模块。采用组件化设计，每个可视化元素独立封装。

**Tech Stack:** React 19, TypeScript 5.8, Framer Motion, SVG, Tailwind CSS, Recharts, Lucide Icons

---

## Part A: 轻工业场景优化 (LayoutVisualizer)

### Task A.1: 增强物料流路径展示

**Files:**
- Modify: `frontend/components/LayoutVisualizer.tsx`

**Step 1: 扩展数据类型定义**

在接口定义区域添加：

```typescript
interface MaterialFlow {
  fromDeviceId: number
  toDeviceId: number
  frequency: 'high' | 'medium' | 'low'
  dailyVolume: number
}
```

扩展 `LayoutData` 接口，添加 `materialFlows?: MaterialFlow[]`

**Step 2: 添加物料流路径渲染函数**

```typescript
const getFlowStyle = (frequency: 'high' | 'medium' | 'low') => {
  switch (frequency) {
    case 'high': return { color: '#ef4444', width: 4, opacity: 0.8 }
    case 'medium': return { color: '#f59e0b', width: 3, opacity: 0.6 }
    case 'low': return { color: '#22c55e', width: 2, opacity: 0.4 }
  }
}
```

**Step 3: 在 JSX 中添加物料流路径渲染（SVG 层）**

使用贝塞尔曲线绘制物料流路径，根据频率显示不同颜色（红/橙/绿），添加流动动画。

**Step 4: 更新图例，添加物料流图例**

**Step 5: 测试验证**

```bash
cd frontend && npm run dev
```

**Step 6: Commit**

```bash
git commit -m "feat(huntian): 添加物料流路径展示，支持高频/中频/低频区分"
```

---

### Task A.2: 搬运距离对比面板

**Files:**
- Modify: `frontend/components/LayoutVisualizer.tsx`

**Step 1: 添加对比数据计算函数**

计算原始布局总搬运距离 vs 优化后总搬运距离

**Step 2: 创建对比面板组件（左侧顶部）**

包含：
- 原始/优化后距离柱状对比图
- 减少量和优化百分比显示
- Framer Motion 动画效果

**Step 3: 测试验证**

**Step 4: Commit**

```bash
git commit -m "feat(huntian): 添加搬运距离对比面板"
```

---

### Task A.3: 热力图功能

**Files:**
- Modify: `frontend/components/LayoutVisualizer.tsx`

**Step 1: 添加热力图数据类型**

```typescript
interface HeatmapZone {
  x: number; y: number; width: number; height: number
  intensity: number // 0-1
  label?: string
}
```

**Step 2: 添加热力图渲染层**

使用 HSL 颜色映射（黄→红），根据强度显示不同透明度和发光效果

**Step 3: 添加热力图图例**

**Step 4: 测试验证**

**Step 5: Commit**

```bash
git commit -m "feat(huntian): 添加热力图功能，展示高频作业区域"
```

---

### Task A.4: 增强车间边界展示

**Files:**
- Modify: `frontend/components/LayoutVisualizer.tsx`

**Step 1: 增强边界样式**

- 添加渐变背景
- 添加阴影和边框效果
- 添加车间尺寸标注
- 添加四角标记

**Step 2: 测试验证**

**Step 3: Commit**

```bash
git commit -m "feat(huntian): 增强车间边界展示"
```

---

## Part B: 重工业场景优化 (AGVPathVisualizer)

### Task B.1: 时间轴控制组件

**Files:**
- Modify: `frontend/components/AGVPathVisualizer.tsx`

**Step 1: 添加时间轴状态和类型**

```typescript
interface TimelineProps {
  duration: number
  currentTime: number
  markers: Array<{ time: number; label: string; type: 'task' | 'conflict' | 'milestone' }>
  onSeek: (time: number) => void
  onPlayPause: () => void
  isPlaying: boolean
  speed: number
}
```

**Step 2: 创建 TimelineControl 组件**

包含：
- 可拖拽进度条
- 时间标记点（任务/冲突/里程碑）
- 播放/暂停按钮
- 当前时间显示

**Step 3: 集成到主组件**

**Step 4: 测试验证**

**Step 5: Commit**

```bash
git commit -m "feat(huntian): 添加时间轴控制组件，支持可拖拽回放"
```

---

### Task B.2: 任务状态显示

**Files:**
- Modify: `frontend/components/AGVPathVisualizer.tsx`

**Step 1: 扩展 AGVTask 接口**

添加 `type: 'pickup' | 'transport' | 'unload' | 'idle'` 和 `status` 字段

**Step 2: 创建 TaskStatusIndicator 组件**

显示当前任务的取料/运输/卸料状态，使用图标和颜色区分

**Step 3: 在 SVG 中渲染任务状态**

**Step 4: 测试验证**

**Step 5: Commit**

```bash
git commit -m "feat(huntian): 添加AGV任务状态显示"
```

---

### Task B.3: 冲突检测点高亮

**Files:**
- Modify: `frontend/components/AGVPathVisualizer.tsx`

**Step 1: 定义冲突数据类型**

```typescript
interface ConflictPoint {
  id: string
  position: [number, number]
  time: number
  severity: 'warning' | 'critical'
  involvedAGVs: number[]
  resolution?: string
}
```

**Step 2: 创建 ConflictHighlight 组件**

包含：
- 预警圈动画
- 中心标记
- 冲突信息标签

**Step 3: 在 SVG 中渲染冲突点**

**Step 4: 测试验证**

**Step 5: Commit**

```bash
git commit -m "feat(huntian): 添加冲突检测点高亮"
```

---

### Task B.4: 性能指标面板

**Files:**
- Create: `frontend/components/AGVPerformancePanel.tsx`
- Modify: `frontend/components/AGVPathVisualizer.tsx`

**Step 1: 创建 AGVPerformancePanel 组件**

指标包含：
- 总完工时间 + 进度条
- 瓶颈利用率
- 吞吐量（件/小时）
- AGV 平均利用率
- 冲突次数
- 整体效率

**Step 2: 在主组件中计算指标并集成**

**Step 3: 测试验证**

**Step 4: Commit**

```bash
git commit -m "feat(huntian): 添加AGV性能指标面板"
```

---

### Task B.5: 工位利用率显示

**Files:**
- Modify: `frontend/components/AGVPathVisualizer.tsx`

**Step 1: 扩展 Station 接口**

添加 `utilization`, `status`, `type` 字段

**Step 2: 增强工位节点渲染**

包含：
- 利用率环（SVG circle strokeDasharray）
- 状态颜色（busy红/idle蓝/blocked橙）
- 工位类型图标
- 利用率百分比标签

**Step 3: 测试验证**

**Step 4: Commit**

```bash
git commit -m "feat(huntian): 添加工位利用率显示"
```

---

## Part C: 集成与测试

### Task C.1: 更新 Huntian 页面集成

**Files:**
- Modify: `frontend/pages/Huntian.tsx`

**Step 1: 添加模拟数据**

创建 `mockLayoutData` 和 `mockAGVData`

**Step 2: 修改数据初始化逻辑**

无路由数据时使用模拟数据

**Step 3: 更新组件调用**

传递新属性（conflictPoints 等）

**Step 4: 测试验证**

**Step 5: Commit**

```bash
git commit -m "feat(huntian): 集成所有可视化优化功能"
```

---

### Task C.2: 最终测试与代码质量检查

**Step 1: Lint 检查**

```bash
cd frontend && npm run lint
```

**Step 2: 功能完整性测试**

- [ ] 轻工业：物料流路径（红/橙/绿）
- [ ] 轻工业：搬运距离对比面板
- [ ] 轻工业：热力图
- [ ] 轻工业：车间边界标注
- [ ] 重工业：时间轴控制
- [ ] 重工业：任务状态显示
- [ ] 重工业：冲突检测点高亮
- [ ] 重工业：性能指标面板
- [ ] 重工业：工位利用率

**Step 3: 最终 Commit**

---

## 任务清单总览

| 任务 | 类型 | 文件 |
|-----|------|------|
| A.1 物料流路径 | 轻工业 | LayoutVisualizer.tsx |
| A.2 搬运距离对比 | 轻工业 | LayoutVisualizer.tsx |
| A.3 热力图 | 轻工业 | LayoutVisualizer.tsx |
| A.4 车间边界 | 轻工业 | LayoutVisualizer.tsx |
| B.1 时间轴控制 | 重工业 | AGVPathVisualizer.tsx |
| B.2 任务状态 | 重工业 | AGVPathVisualizer.tsx |
| B.3 冲突检测 | 重工业 | AGVPathVisualizer.tsx |
| B.4 性能面板 | 重工业 | AGVPerformancePanel.tsx (新建) |
| B.5 工位利用率 | 重工业 | AGVPathVisualizer.tsx |
| C.1 页面集成 | 集成 | Huntian.tsx |
| C.2 最终测试 | 集成 | - |
