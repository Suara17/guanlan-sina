# 天筹页面任务配置扩展计划

## 背景

当前天筹页面的任务配置较为简单，仅支持基础参数（车间尺寸、设备数量、AGV数量等）和商业参数。需要扩展配置维度，增加更多真实业务场景所需的约束条件，并提供行业模板便于演示和使用。

## 目标

1. **扩展任务配置维度**：增加交期、优先级、设备/产线约束、批次、切换时间、依赖关系等
2. **提供任务模板**：针对轻工业和重工业各提供3-4个预设模板，便于演示和真实使用
3. **数据结构扩展**：前后端类型定义同步扩展

---

## 一、现有系统分析

### 1.1 当前配置

| 层级 | 现有内容 |
|------|----------|
| **前端类型** | `OptimizationRequestParams` - 任务名称、行业类型、车间/设备参数、商业参数 |
| **后端API** | `OptimizationRequest` - 同上 |
| **后端算法** | 轻工业：SLP-GA布局优化；重工业：NSGA2多目标优化 |
| **目标函数** | 成本(cost)、工期(time)、收益(benefit) 三目标 |

### 1.2 相关文件

- `frontend/pages/Tianchou/components/TaskConfigForm.tsx` - 任务配置表单
- `frontend/pages/Tianchou/types/tianchou.ts` - 类型定义
- `backend/app/api/routes/tianchou.py` - API路由
- `backend/app/models.py` - 数据模型

---

## 二、扩展维度设计

### 2.1 新增配置维度

| 维度 | 对应目标 | 类型 | 说明 |
|------|----------|------|------|
| **交期(Deadline)** | 时间目标 | date | 订单交付日期、最晚完工时间 |
| **优先级(Priority)** | 品质目标 | enum | low/normal/high/urgent |
| **设备约束** | 成本目标 | string[] | 可用设备列表、禁用设备 |
| **产线约束** | 成本目标 | object | 产线列表、产能上限 |
| **批次(Batch)** | 成本目标 | number | 生产批次数量 |
| **切换时间** | 时间目标 | number | 产品切换时间(分钟) |
| **依赖关系** | 时间目标 | array | 任务依赖关系 |

### 2.2 轻工业模板

| 模板ID | 名称 | 典型场景 | 预设备参数 |
|--------|------|----------|-----------|
| `textile_standard` | 标准纺织车间 | 常规生产 | 25设备、80x60m车间、3条产线 |
| `textile_expansion` | 扩产需求 | 产能扩张 | 40设备、120x80m车间、5条产线 |
| `electronics` | 电子装配 | 多批次生产 | 15设备、50x40m车间、批次约束 |

### 2.3 重工业模板

| 模板ID | 名称 | 典型场景 | 预设备参数 |
|--------|------|----------|-----------|
| `agv_standard` | 标准AGV调度 | 常规搬运 | 8工位、3AGV |
| `agv_heavy_load` | 重载AGV | 大件运输 | 6工位、2AGV、载重约束 |
| `production_line` | 产线协调 | 批次生产 | 10工位、4AGV、批次依赖 |

---

## 三、实施方案

### 3.1 前端实现

#### 3.1.1 类型扩展

**文件**: `frontend/pages/Tianchou/types/tianchou.ts`

```typescript
// 新增约束类型
interface TaskConstraints {
  deadline?: string
  max_cycle_time?: number
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  available_devices?: string[]
  restricted_devices?: string[]
  production_lines?: string[]
  line_capacity?: Record<string, number>
  batch_count?: number
  batch_size?: number
  changeover_time?: number
  dependencies?: TaskDependency[]
}

interface TaskDependency {
  task_id: string
  type: 'finish_to_start' | 'start_to_start'
  lag?: number
}

// 模板定义
interface TaskTemplate {
  id: string
  name: string
  industry_type: IndustryType
  description: string
  icon: string
  params: OptimizationRequestParams
  constraints: TaskConstraints
}

// 扩展请求参数
interface ExtendedOptimizationRequestParams extends OptimizationRequestParams {
  constraints?: TaskConstraints
}
```

#### 3.1.2 模板定义

**文件**: `frontend/pages/Tianchou/data/templates.ts`

- 定义轻工业模板数组
- 定义重工业模板数组
- 导出模板列表和获取模板函数

#### 3.1.3 表单组件重构

**文件**: `frontend/pages/Tianchou/components/TaskConfigForm.tsx`

1. **增加模板选择器**：行业类型下方增加下拉框选择预设模板
2. **约束配置区块**：分为四个折叠面板
   - 基础信息（现有）
   - 时间约束（交期、最大周期时间、切换时间）
   - 资源约束（设备列表、产线、批次）
   - 高级选项（优先级、依赖关系）
3. **模板联动**：选择模板后自动填充对应参数
4. **参数验证**：根据行业类型动态验证必填字段

### 3.2 后端实现

#### 3.2.1 API模型扩展

**文件**: `backend/app/api/routes/tianchou.py`

```python
class TaskConstraints(BaseModel):
    # 时间约束
    deadline: str | None = None
    max_cycle_time: float | None = None
    changeover_time: float | None = None
    
    # 优先级
    priority: str | None = None  # low, normal, high, urgent
    
    # 资源约束
    available_devices: list[str] | None = None
    restricted_devices: list[str] | None = None
    production_lines: list[str] | None = None
    line_capacity: dict[str, float] | None = None
    
    # 批次
    batch_count: int | None = None
    batch_size: float | None = None
    
    # 依赖关系
    dependencies: list[dict] | None = None
```

#### 3.2.2 数据库模型扩展（如需要持久化）

**文件**: `backend/app/models.py`

- 在 `OptimizationTask` 表中添加约束字段

### 3.3 算法适配（预留）

> 初期可以不实现，仅扩展前后端接口

- 轻工业：在 `SLP_GA_Optimizer` 中解析约束参数
- 重工业：在 `TianchouDecisionProblem` 中加入约束惩罚

---

## 四、里程碑

1. **M1**: 扩展前端类型定义，添加约束和模板类型
2. **M2**: 创建模板数据文件，定义6个预设模板
3. **M3**: 重构 `TaskConfigForm`，增加模板选择器和约束配置区块
4. **M4**: 扩展后端 API 模型
5. **M5**: 前后端联调，确保数据正确传递

---

## 五、风险与注意事项

1. **向后兼容**：新增字段使用可选字段，不影响现有功能
2. **模板默认值**：模板参数需与后端默认值匹配
3. **约束验证**：前端需根据行业类型动态验证必填项
4. **算法适配**：初期约束仅作为元数据存储，暂不参与算法计算

---

## 六、验收标准

- [ ] 前端可选择轻工业/重工业的预设模板
- [ ] 选择模板后自动填充对应参数
- [ ] 可手动配置时间约束（交期、周期时间、切换时间）
- [ ] 可手动配置资源约束（设备、产线、批次）
- [ ] 可配置优先级和依赖关系
- [ ] 后端 API 可接收扩展后的请求参数
- [ ] 现有功能不受影响

---

*创建日期: 2026-03-04*
