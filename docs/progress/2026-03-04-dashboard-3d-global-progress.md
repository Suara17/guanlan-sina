# Dashboard 生产可视化 3D 改造进度

## 任务目标
将 Dashboard 中“厂区-生产线模拟动态图”替换为 `frontend/3dpart-main` 的 3D 版本，保留 global 多工厂层级，中文化文案，并新增全屏放大能力。

## 子代理分工
- 子代理A（3D迁移）: 迁移 `FactoryVisualization3D` 组件及依赖
- 子代理B（数据适配）: 适配现有生产数据到 3D global/factory/workshop/line 结构
- 子代理C（交互集成）: Dashboard 固定高度容器 + 全屏放大/退出 + 中文化文案

## 当前状态
- [x] 需求与方案确认
- [x] 识别当前入口与 3D 源代码差异
- [x] 建立子代理分工与进度文档
- [x] 子代理A: 迁移 3D 组件并补齐依赖
- [x] 子代理B: 3D 多工厂数据适配
- [x] 子代理C: 固定高度 + 全屏按钮 + 中文化（主体完成）
- [x] 构建与检查验证

## 影响文件（计划）
- `frontend/package.json`
- `frontend/components/FactoryVisualization/index.tsx`
- `frontend/components/FactoryVisualization3D/*`（新目录，来自 3dpart-main）
- `docs/progress/2026-03-04-dashboard-3d-global-progress.md`

## 进度记录
### 2026-03-04
- 已完成代码现状分析：确认入口在 `frontend/pages/Dashboard.tsx`，当前渲染 `FactoryVisualization`
- 已完成 3D 版本依赖、数据结构、容器高度冲突分析
- 已确认实施策略：保留 global 多工厂、尽量复刻效果、文案中文化、增加全屏按钮
- 已迁移 `frontend/components/FactoryVisualization3D/*` 到主工程
- 已补齐依赖：`@react-three/fiber`、`@react-three/drei`、`three`、`zustand`、`gsap`
- 已将 3D 数据从随机生成改为“北京/天津/杭州”三工厂固定数据，其中天津工厂映射现有 `FACTORY_DATA`
- 已将 Dashboard 中 `FactoryVisualization` 替换为“固定高度容器 + 全屏覆盖层”模式
- 已完成 3D 面包屑、状态图例、悬浮提示中文化
- 已执行定向代码检查（Biome）并通过：
  - `biome check components/FactoryVisualization/index.tsx components/FactoryVisualization3D package.json ../docs/progress/2026-03-04-dashboard-3d-global-progress.md`
- 已执行前端构建并通过：
  - `npm run build`（通过）
- 已完成“步骤1：分包优化”：
  - `FactoryVisualization3D` 改为 `React.lazy` 懒加载
  - `App.tsx` 页面路由改为懒加载，降低主包体积
  - `vite.config.ts` 增加手动分包（`three-core`、`r3-stack`、`gsap-vendor`）并调优告警阈值
- 已完成“步骤2：重置视角”：
  - `store.ts` 新增 `cameraResetToken` + `resetToGlobalView`
  - `FactoryScene.tsx` 相机控制监听 token，支持同层级重复重置
  - 3D 视图右上角新增“重置视角”按钮，支持快速回到 global 视角
- 最新构建产物（关键 chunk）：
  - `Dashboard-*.js` 约 45KB
  - `three-core-*.js` 约 725KB
  - `r3-stack-*.js` 约 562KB
