# 浑天仿真验证改造进度（续做文档）

更新时间：2026-03-04（晚）  
执行分支：`feature-huntian-simulation-implementation`  
执行 worktree：`E:\Guanlan-Sina\.worktrees\feature-huntian-simulation-implementation`

---

## 1. 当前状态快照

- 当前未产生新 commit（`HEAD` 仍为 `6beb27d`）。
- 主要改动仍集中在 10 个业务文件（前后端链路 + 浑天页面）。
- `frontend/pages/Huntian.tsx` 当前是 **`MM`**（已有暂存内容 + 本轮新增未暂存内容并存）。
- 本进度文档文件当前位于 `docs/plans/`，用于续做接力。

当前 `git status -sb` 关键状态：

1. `M  backend/app/api/routes/production.py`
2. `M  backend/app/api/routes/tianchou.py`
3. `M  frontend/components/ProductChangeAlert.tsx`
4. `M  frontend/components/ProductionPlanCard.tsx`
5. `M  frontend/pages/Dashboard.tsx`
6. `MM frontend/pages/Huntian.tsx`
7. `M  frontend/pages/Tianchou/index.tsx`
8. `M  frontend/pages/Tianchou/services/tianchouService.ts`
9. `M  frontend/pages/Tianchou/types/tianchou.ts`
10. `M  frontend/types.ts`

---

## 2. 本轮新增完成改动（在上轮基础上）

### 2.1 浑天同屏对比主界面已落地（待办1完成）

文件：`frontend/pages/Huntian.tsx`

- 新增 `compareViewMode` 视图模式状态。
- 新增三种模式切换：
  - 单屏（`single_toggle`）
  - 左右分屏（`split_lr`）
  - 上下分屏（`split_tb`）
- `comparison_payload.viewMode` 可回灌初始化视图模式。

### 2.2 A/B 时间轴对比组件已落地（待办2完成）

文件：`frontend/pages/Huntian.tsx`

- 新增 `ABTimelineComparison` 组件（基线 A / 优化 B 双轨条带）。
- 接入：
  - `scheduleComparison.baselineTasks`
  - `scheduleComparison.optimizedTasks`
  - `timelineBindings`
- 点击任务条可定位 `slotId` 并显示联动时段详情（基础联动已完成）。

### 2.3 A/B 时间轴收起交互已改为“复用右下角原按钮”

文件：`frontend/pages/Huntian.tsx`

- 删除了之前临时新增的右下角浮动展开按钮。
- 复用右下角原无效按钮作为“收起/展开 A/B 时间轴”唯一入口。
- 面板内部收起按钮移除，避免双入口冲突。

### 2.4 顶部导航栏压缩改造（图标化 + 悬停提示）

文件：`frontend/pages/Huntian.tsx`

- 删除冗长标题/状态文案（如“浑天·验证仿真中心”等）以释放空间。
- Simulation/Compare/Time 控件改为图标按钮。
- 交互含义改为 hover tooltip 展示。
- 去掉图标区滚动条（移除 `overflow-x-auto` 依赖）。

### 2.5 主视图区高度抬升

文件：`frontend/pages/Huntian.tsx`

- 主容器由大内边距改为紧凑内边距，布局图/路径图可视高度提升。
- 视觉效果：画布更贴近顶部图标栏，减少空白浪费。

---

## 3. 已执行验证（本轮）

### 3.1 单文件格式/静态检查

- 已执行：`npx --yes @biomejs/biome check --write "pages/Huntian.tsx"`
- 结果：通过。

### 3.2 全量 TS 现状确认

- 已执行：`npx --yes tsc --noEmit --pretty false`
- 结果：仓库仍存在大量历史 TS 错误；本轮关注文件 `Huntian.tsx` 未新增报错。

### 3.3 运行访问排查（前端端口）

- 现象：`localhost:3001` 曾命中错误服务（404），非当前 Vite 页面。
- 处理：清理冲突进程后端口恢复。
- 建议：后续固定端口启动并使用 `--strictPort`，避免串端口。

---

## 4. 待完成事项（下一轮）

1. 待办3仍未完成：布局与时序的双向联动（点击时段后高亮设备/产线/AGV 路径）。
2. 后端 `comparison_payload` 仍是基础映射版本，需要按真实业务语义细化字段。
3. 人工回归链路需补：`Dashboard -> Tianchou -> Huntian`（轻资产/重资产各一遍）。
4. 提交前需先整理 `Huntian.tsx` 的 `MM` 状态，确保最终暂存一致后再 commit。

---

## 5. 续做建议命令

查看当前状态：

```bash
git -C E:/Guanlan-Sina/.worktrees/feature-huntian-simulation-implementation status -sb
```

先归拢浑天页和进度文档：

```bash
git -C E:/Guanlan-Sina/.worktrees/feature-huntian-simulation-implementation add frontend/pages/Huntian.tsx docs/plans/2026-03-04-huntian-simulation-compare-progress.md
```

如遇 `index.lock permission denied`，先检查 worktree ACL（历史出现过拒绝写入）：

```bash
icacls E:\Guanlan-Sina\.git\worktrees\feature-huntian-simulation-implementation
```

---

## 6. 风险提醒

1. 当前分支基线 TS 错误较多，继续按“改动文件增量验证”推进，避免全量清错拖慢交付。
2. `comparison_payload` 字段语义与单位尚未业务定稿，后续接算法真实数据时必须统一协议。
3. worktree ACL 曾反复出现 `DENY` 导致 `index.lock` 失败，续做时优先确认该目录可写。


---

## 7. 续做进展（2026-03-05 中午）

### 7.1 双向联动已补齐（待办3完成）

涉及文件：
- `frontend/pages/Huntian.tsx`
- `frontend/components/DeviceLayoutVisualizer.tsx`
- `frontend/components/AGVLayoutVisualizer.tsx`
- `frontend/components/AGVPathVisualizer.tsx`

完成项：

1. 新增“时段 -> 资源”高亮映射：
   - 基于 `selectedTimelineSlotId` 将 `deviceIds / lineIds / agvRouteIds` 归一化后下发到可视化组件。
2. 新增“资源 -> 时段”反查联动：
   - 在布局图点击设备/产线、在 AGV 路径图点击路径后，反查 `timelineBindings` 并自动选中最近时段。
3. 增强 ID 容错：
   - 前端增加 ID 归一化与别名 token（如 `D1/m1/device1`、`R1/AGV-1/route1`）以适配后端字段差异。

### 7.2 后端 comparison payload 语义细化（待办2阶段完成）

涉及文件：
- `backend/app/api/routes/tianchou.py`

完成项：

1. `_build_comparison_payload` 从 `operation_times` 增补：
   - `lineIds`：基于 `task_id` 映射；
   - `agvRouteIds`：基于 `agv` 映射；
2. 时段标签从单纯“工序X”细化为“任务-工序”；
3. `logisticsSummary.textSummary` 增加可联动时段数说明。

说明：

- 当前仍是“可联动语义版”，不是最终业务协议版；后续需和算法/业务统一字段命名与单位定义。

### 7.3 本轮验证结果

1. 前端增量检查：
   - `npx --yes @biomejs/biome check --write "pages/Huntian.tsx" "components/DeviceLayoutVisualizer.tsx" "components/AGVLayoutVisualizer.tsx" "components/AGVPathVisualizer.tsx"`
   - 结果：通过。
2. TypeScript 全量：
   - `npx --yes tsc --noEmit --pretty false`
   - 结果：仍有仓库历史错误；本轮改动文件未新增命中报错（按过滤结果）。
3. 后端语法：
   - `python -m py_compile backend/app/api/routes/tianchou.py`
   - 结果：通过。

### 7.4 仍待完成事项（下一步）

1. 人工回归链路：
   - `Dashboard -> Tianchou -> Huntian`，轻资产/重资产各 1 遍（UI 实机点击验证）。
2. 提交前整理暂存状态：
   - 当前 `Huntian.tsx` 与 `tianchou.py` 处于 `MM`，需统一暂存后再提交。
