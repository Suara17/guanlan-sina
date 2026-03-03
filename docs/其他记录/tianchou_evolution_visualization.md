# 天筹优化算法过程可视化 - 改动文档

## 功能概述

在"天筹优化决策系统"页面，点击"开始优化"按钮后，新增展示算法进化过程的可视化页面，包含：
- 实时迭代曲线图 (AreaChart)
- 种群状态仪表盘 (多样性 + 变异率)
- 进化日志列表
- 底部进度条

---

## 后端改动

### 1. 算法代码 - `backend/app/algorithms/part1_optimization.py`

**修改内容**：在两个优化器类中添加进化历史数据收集

- **SLP_GA_Optimizer.run_optimization()** (第 686-777 行)
  - 添加 `self.evolution_history = []` 初始化
  - 每代记录: `generation`, `f1`, `f2`, `f3`, `diversity`, `mutpb`, `elapsed_time`
  - 返回值从 2 个改为 3 个: `(pareto_solutions, all_solutions, evolution_history)`

- **HeavyIndustry_AGV_Optimizer.run_optimization()** (第 2956-3072 行)
  - 添加 `self.evolution_history = []` 初始化
  - 每代记录: `generation`, `f1`, `f2`, `f3`, `diversity`, `mutpb`, `best_fitness`, `elapsed_time`
  - 返回值从 2 个改为 3 个

- **DualTrack 类** (第 3599-3653, 3873-3904 行)
  - 修改 `_run_light_industry_optimization()` 和 `_run_heavy_industry_optimization()` 方法
  - 解包 3 个返回值并添加到 `optimization_results` 字典

### 2. 数据库模型 - `backend/app/models.py`

**修改内容**：添加 `evolution_history` 字段存储进化数据

```python
# 第 449 行附近
evolution_history: dict = Field(default={}, sa_column=Column(JSONB))
```

### 3. API 路由 - `backend/app/api/routes/tianchou.py`

**新增内容**：
- 第 240-245 行：保存进化历史到数据库
  ```python
  evolution_history = results.get("evolution_history", [])
  task.evolution_history = {"history": evolution_history}
  db.commit()
  ```

- 第 438-459 行：新增 API 端点
  ```python
  @router.get("/tasks/{task_id}/evolution")
  async def get_evolution_history(task_id: str, session: SessionDep) -> Any:
  ```
  返回格式:
  ```json
  {
    "task_id": "xxx",
    "status": "running",
    "progress": 50,
    "history": [
      {
        "generation": 0,
        "f1": 123.45,
        "f2": 67.89,
        "f3": 0.1234,
        "diversity": 0.4567,
        "mutpb": 0.1,
        "best_fitness": -123.45,
        "elapsed_time": 1.2
      },
      ...
    ]
  }
  ```

### 4. 数据库迁移

**迁移文件**: `backend/app/alembic/versions/7aa942b12897_add_evolution_history_to_optimization_.py`

**执行状态**: ✅ 已执行

---

## 前端改动

### 1. 类型定义 - `frontend/src/pages/Tianchou/types/tianchou.ts`

**新增类型**：
```typescript
export interface EvolutionHistoryItem {
  generation: number
  f1: number
  f2: number
  f3: number
  diversity: number
  mutpb: number
  best_fitness?: number
  elapsed_time: number
}

export interface EvolutionData {
  task_id: string
  status: TaskStatus
  progress: number
  history: EvolutionHistoryItem[]
}
```

### 2. API 服务 - `frontend/src/pages/Tianchou/services/tianchouService.ts`

**新增方法**：
```typescript
async getEvolutionHistory(taskId: string): Promise<EvolutionData> {
  const response = await fetch(`${API_BASE}/tasks/${taskId}/evolution`)
  // ...
}
```

### 3. 组件重写 - `frontend/src/pages/Tianchou/components/TaskProgress.tsx`

**完全重写**，参考 `EvolutionPage.tsx` 的布局：
- 使用 Recharts 的 AreaChart 展示实时迭代曲线
- 右侧包含种群状态仪表盘和变异率显示
- 底部展示最近 10 代的进化日志
- 底部控制栏带进度条

---

## 测试步骤

### 1. 启动后端
```bash
docker compose up -d backend db
```

### 2. 确保数据库迁移已执行
```bash
cd backend
uv run alembic upgrade head
```

### 3. 启动前端
```bash
cd frontend
npm run dev
```

### 4. 测试流程
1. 访问天筹优化页面 (`/tianchou`)
2. 填写优化参数（选择行业类型和参数）
3. 点击"开始优化"按钮
4. 观察页面展示：
   - 顶部：任务名称和状态
   - 左侧：实时迭代曲线图（f1, f2 目标值变化）
   - 右上：种群多样性仪表盘和变异率
   - 右下：进化日志（每代的适应度值）
   - 底部：进度条

### 5. 预期效果
- 优化任务开始后，曲线图会随时间更新
- 多样性仪表盘显示当前种群多样性等级（低/中/高）
- 变异率显示当前使用的变异概率
- 日志列表显示最近 10 代的详细数据
- 优化完成后，进度条变绿，显示"优化完成"

---

## 数据字段说明

| 字段 | 说明 |
|------|------|
| generation | 进化代数 |
| f1 | 第一目标值（轻工业：makespan，重工业：完工时间） |
| f2 | 第二目标值（轻工业：bottleneck，重工业：瓶颈利用率） |
| f3 | 第三目标值（轻工业：imbalance，重工业：负载均衡） |
| diversity | 种群多样性 (0-1) |
| mutpb | 变异率 |
| best_fitness | 最佳适应度（仅重工业） |
| elapsed_time | 进化耗时（秒） |

---

## 注意事项

1. 进化历史数据只有在优化任务**完成后**才会完整保存到数据库
2. 任务进行中，前端通过轮询 `/evolution` API 获取实时数据
3. 如果优化任务很快完成，可能看不到实时的曲线变化
4. 原始 `.env` 文件中 `POSTGRES_SERVER=db`，本地运行 alembic 时需临时改为 `localhost`
