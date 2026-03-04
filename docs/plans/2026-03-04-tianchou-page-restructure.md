# 天筹页面重构 - 左右布局实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将天筹优化页面重构为左右布局：左侧展示历史已完成任务及方案，右侧配置新任务。

**Architecture:** 
- 后端：新增历史任务列表API，支持分页和时间筛选；新增推荐原因字段；确保 expected_loss 字段返回
- 前端：重构页面为左右分栏布局，历史任务列表支持时间筛选，新建任务表单保持不变

**Tech Stack:** FastAPI (后端), React + TypeScript (前端)

---

## Task 1: 新增后端历史任务列表API

**Files:**
- Modify: `backend/app/api/routes/tianchou.py`
- Test: 使用 curl 测试 API

**Step 1: 在 tianchou.py 中添加新的响应模型和API**

在文件约 100 行附近添加新的请求/响应模型：

```python
class TaskListQueryParams(BaseModel):
    """历史任务列表查询参数"""
    status: TaskStatus = Field(default=TaskStatus.COMPLETED, description="任务状态")
    limit: int = Field(default=20, ge=1, le=100, description="返回数量")
    offset: int = Field(default=0, ge=0, description="偏移量")
    start_date: datetime | None = Field(None, description="开始时间")
    end_date: datetime | None = Field(None, description="结束时间")


class TaskListItem(BaseModel):
    """历史任务列表项"""
    task_id: str
    name: str
    industry_type: IndustryType
    status: TaskStatus
    created_at: datetime
    completed_at: datetime | None
    solution_count: int
    recommended_solution_id: str | None
    recommended_reason: str | None  # 新增：推荐原因


class TaskListResponse(BaseModel):
    """历史任务列表响应"""
    tasks: list[TaskListItem]
    total: int
    limit: int
    offset: int
```

**Step 2: 在约 484 行附近添加获取最近已完成任务的代码模式，添加新的API端点**

在 `/tasks/latest/completed` 之后添加：

```python
@router.get("/tasks", response_model=TaskListResponse)
async def get_task_list(
    status: TaskStatus = TaskStatus.COMPLETED,
    limit: int = 20,
    offset: int = 0,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    session: SessionDep,
) -> Any:
    """
    获取历史任务列表
    
    - **status**: 任务状态 (默认 completed)
    - **limit**: 返回数量 (1-100)
    - **offset**: 偏移量
    - **start_date**: 开始时间筛选
    - **end_date**: 结束时间筛选
    """
    # 构建查询
    statement = select(OptimizationTask).where(
        OptimizationTask.status == status
    )
    
    # 时间筛选
    if start_date:
        statement = statement.where(OptimizationTask.created_at >= start_date)
    if end_date:
        statement = statement.where(OptimizationTask.created_at <= end_date)
    
    # 获取总数
    total = len(session.exec(statement).all())
    
    # 分页和排序
    statement = statement.order_by(OptimizationTask.created_at.desc())
    statement = statement.offset(offset).limit(limit)
    
    tasks = session.exec(statement).all()
    
    # 获取每个任务的推荐方案和推荐原因
    result_tasks = []
    for task in tasks:
        # 获取方案数量
        sol_statement = select(ParetoSolution).where(
            ParetoSolution.task_id == task.id
        )
        solutions = session.exec(sol_statement).all()
        solution_count = len(solutions)
        
        # 查找最新决策记录
        decision_statement = select(DecisionRecord).where(
            DecisionRecord.task_id == task.id
        ).order_by(DecisionRecord.created_at.desc()).limit(1)
        decision = session.exec(decision_statement).first()
        
        # 生成推荐原因
        recommended_solution_id = None
        recommended_reason = None
        
        if decision and decision.best_solution_id:
            recommended_solution_id = str(decision.best_solution_id)
            
            # 生成推荐原因
            weights = decision.weights or {}
            cost_w = weights.get("cost", 0)
            time_w = weights.get("time", 0)
            benefit_w = weights.get("benefit", 0)
            
            reason_parts = []
            if cost_w > 0.4:
                reason_parts.append("成本权重较高")
            if time_w > 0.4:
                reason_parts.append("工期权重较高")
            if benefit_w > 0.4:
                reason_parts.append("收益权重较高")
            
            if reason_parts:
                recommended_reason = f"基于AHP-TOPSIS决策，{'，'.join(reason_parts)}，推荐此方案"
            else:
                recommended_reason = "基于AHP-TOPSIS综合评分推荐"
        elif solutions:
            # 没有决策记录时，取TOPSIS评分最高的方案
            scored_solutions = [s for s in solutions if s.topsis_score is not None]
            if scored_solutions:
                best = max(scored_solutions, key=lambda s: s.topsis_score or 0)
                recommended_solution_id = str(best.id)
                recommended_reason = "基于TOPSIS综合评分推荐"
            else:
                # 取第一个方案
                recommended_solution_id = str(solutions[0].id)
                recommended_reason = "基于帕累托最优解推荐"
        
        result_tasks.append(TaskListItem(
            task_id=str(task.id),
            name=task.name,
            industry_type=task.industry_type,
            status=task.status,
            created_at=task.created_at,
            completed_at=task.completed_at,
            solution_count=solution_count,
            recommended_solution_id=recommended_solution_id,
            recommended_reason=recommended_reason,
        ))
    
    return TaskListResponse(
        tasks=result_tasks,
        total=total,
        limit=limit,
        offset=offset,
    )
```

**Step 3: 测试API**

```bash
# 测试获取已完成任务列表
curl "http://localhost:8000/api/v1/tianchou/tasks?status=completed&limit=10"

# 测试带时间筛选
curl "http://localhost:8000/api/v1/tianchou/tasks?status=completed&start_date=2026-01-01T00:00:00"
```

**Step 4: Commit**

```bash
git add backend/app/api/routes/tianchou.py
git commit -m "feat(tianchou): add historical task list API with pagination and date filter"
```

---

## Task 2: 确保 expected_loss 字段在方案详情中返回

**Files:**
- Modify: `backend/app/api/routes/tianchou.py:540-560`

**Step 1: 检查现有代码确保 expected_loss 返回**

在约 540-560 行 `SolutionResponse` 模型和约 655 行返回代码处，确认 `expected_loss` 字段已包含在响应中。

查看代码发现：
- Line 84: `expected_loss: float | None` 在 SolutionResponse 中已定义
- Line 545 和 655: 返回时已包含 `expected_loss=solution.expected_loss`

如果字段为 None，需要在生成方案时计算 expected_loss。

**Step 2: 如需计算，在方案生成逻辑中添加**

在 `backend/app/algorithms/part1_optimization.py` 或相关位置，确保生成方案时计算 expected_loss：

```python
# 在方案生成逻辑中添加
solution.expected_loss = solution.total_cost - solution.expected_benefit
```

**Step 3: Commit**

```bash
git add backend/app/api/routes/tianchou.py
git commit -m "fix(tianchou): ensure expected_loss field is returned in solution details"
```

---

## Task 3: 新增前端API调用方法

**Files:**
- Modify: `frontend/pages/Tianchou/services/tianchouService.ts`

**Step 1: 添加获取历史任务列表的方法**

在 `tianchouService.ts` 中添加：

```typescript
export interface TaskListQueryParams {
  status?: 'pending' | 'running' | 'completed' | 'failed'
  limit?: number
  offset?: number
  start_date?: string
  end_date?: string
}

export interface TaskListItem {
  task_id: string
  name: string
  industry_type: 'light' | 'heavy'
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  solution_count: number
  recommended_solution_id: string | null
  recommended_reason: string | null
}

export interface TaskListResponse {
  tasks: TaskListItem[]
  total: number
  limit: number
  offset: number
}

export const tianchouService = {
  // ... 现有方法

  /**
   * 获取历史任务列表
   */
  async getTaskList(params: TaskListQueryParams = {}): Promise<TaskListResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.status) queryParams.append('status', params.status)
    if (params.limit) queryParams.append('limit', String(params.limit))
    if (params.offset) queryParams.append('offset', String(params.offset))
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    
    const response = await fetch(`${API_BASE}/tasks?${queryParams}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get task list: ${response.statusText}`)
    }
    
    return response.json()
  },
}
```

**Step 2: Commit**

```bash
git add frontend/pages/Tianchou/services/tianchouService.ts
git commit -m "feat(tianchou): add getTaskList API method to frontend service"
```

---

## Task 4: 创建前端历史任务列表组件

**Files:**
- Create: `frontend/pages/Tianchou/components/TaskHistoryList.tsx`

**Step 1: 创建组件**

```typescript
import type React from 'react'
import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Clock, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { tianchouService, type TaskListItem } from '../services/tianchouService'

interface Props {
  onSelectTask: (task: TaskListItem) => void
  selectedTaskId?: string
}

type DateFilter = '7days' | '30days' | '90days' | 'all'

export function TaskHistoryList({ onSelectTask, selectedTaskId }: Props) {
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  useEffect(() => {
    loadTasks()
  }, [dateFilter])

  const getDateRange = () => {
    const now = new Date()
    const startDate = new Date()
    
    switch (dateFilter) {
      case '7days':
        startDate.setDate(now.getDate() - 7)
        break
      case '30days':
        startDate.setDate(now.getDate() - 30)
        break
      case '90days':
        startDate.setDate(now.getDate() - 90)
        break
      case 'all':
        return { start_date: undefined, end_date: undefined }
    }
    
    return {
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const { start_date, end_date } = getDateRange()
      const response = await tianchouService.getTaskList({
        status: 'completed',
        limit: 50,
        start_date,
        end_date,
      })
      setTasks(response.tasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* 筛选器 */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={16} className="text-slate-400" />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7days">最近7天</option>
          <option value="30days">最近30天</option>
          <option value="90days">最近90天</option>
          <option value="all">全部</option>
        </select>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="text-center py-8 text-slate-400">加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">暂无已完成的任务</div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.task_id}
              className={`bg-white rounded-lg border transition-all cursor-pointer ${
                selectedTaskId === task.task_id
                  ? 'border-blue-500 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onSelectTask(task)}
            >
              {/* 任务头部 */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{task.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(task.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={12} className="text-green-500" />
                        已完成
                      </span>
                      <span>{task.solution_count} 个方案</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedTaskId(
                        expandedTaskId === task.task_id ? null : task.task_id
                      )
                    }}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    {expandedTaskId === task.task_id ? (
                      <ChevronDown size={16} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                  </button>
                </div>
                
                {/* 推荐方案信息 */}
                {task.recommended_solution_id && (
                  <div className="mt-3 px-3 py-2 bg-blue-50 rounded text-sm">
                    <div className="text-blue-600 font-medium">推荐方案</div>
                    <div className="text-slate-600 text-xs mt-1">
                      {task.recommended_reason}
                    </div>
                  </div>
                )}
              </div>

              {/* 展开的方案列表 (预留) */}
              {expandedTaskId === task.task_id && (
                <div className="border-t border-slate-100 p-4 bg-slate-50">
                  <div className="text-sm text-slate-600">
                    点击查看详情和方案对比
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/pages/Tianchou/components/TaskHistoryList.tsx
git commit -m "feat(tianchou): add TaskHistoryList component"
```

---

## Task 5: 重构主页面为左右布局

**Files:**
- Modify: `frontend/pages/Tianchou/index.tsx`

**Step 1: 导入新组件并重构布局**

修改 `index.tsx`:

1. 导入 `TaskHistoryList` 组件
2. 添加历史任务状态管理
3. 将页面重构为左右布局

```typescript
import { TaskHistoryList } from './components/TaskHistoryList'
import type { TaskListItem } from './services/tianchouService'

// 在组件中添加状态
const [selectedHistoryTask, setSelectedHistoryTask] = useState<TaskListItem | null>(null)

// 修改 return 中的布局
return (
  <div className="min-h-screen bg-slate-50 p-6">
    <header className="mb-6">
      <h1 className="text-3xl font-bold text-slate-900">天筹优化决策系统</h1>
      <p className="text-slate-600 mt-2">基于多目标遗传算法的智能制造优化方案</p>
    </header>

    <main className="max-w-7xl mx-auto">
      {/* 左右布局 */}
      <div className="grid grid-cols-5 gap-6">
        {/* 左侧：历史任务列表 (65% = col-span-3) */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              历史优化任务
            </h2>
            <TaskHistoryList
              selectedTaskId={selectedHistoryTask?.task_id}
              onSelectTask={(task) => {
                setSelectedHistoryTask(task)
                // 加载任务详情和方案
                loadTaskDetails(task.task_id)
              }}
            />
          </div>
        </div>

        {/* 右侧：新建任务 (35% = col-span-2) */}
        <div className="col-span-2">
          <TaskConfigForm onSubmit={handleCreateTask} />
        </div>
      </div>
    </main>
  </div>
)
```

**Step 2: Commit**

```bash
git add frontend/pages/Tianchou/index.tsx
git commit -m "refactor(tianchou): split page into left history list and right task config"
```

---

## Task 6: 在左侧添加方案详情展示（可选增强）

**Files:**
- Modify: `frontend/pages/Tianchou/components/TaskHistoryList.tsx`
- Modify: `frontend/pages/Tianchou/index.tsx`

如果需要在左侧展开查看方案详情，可以在 TaskHistoryList 中加载方案列表并展示：

**Step 1: 扩展 TaskHistoryList 添加方案详情**

```typescript
// 在 TaskHistoryList 中添加
interface TaskWithSolutions extends TaskListItem {
  solutions?: ParetoSolution[]
}

const loadTaskSolutions = async (taskId: string) => {
  const solutions = await tianchouService.getSolutions(taskId)
  return solutions
}
```

**Step 2: 在展开区域展示方案表格**

展示格式：
- 表格列：方案序号、总成本、实施工期、预期收益、预期损失、TOPSIS评分
- 卡片形式：推荐方案突出显示

**Step 3: Commit**

```bash
git add frontend/pages/Tianchou/
git commit -f "feat(tianchou): add solution details display in history list"
```

---

## 执行选项

**Plan complete and saved to `docs/plans/2026-03-04-tianchou-page-restructure.md`. Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
