# 布局图片生成功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 从后端算法中抽取布局图片生成逻辑，提供 API 供前端浑天仿真页面调用，实现原始布局图和优化后布局图的显示

**Architecture:** 
- 后端新增 `LayoutImageGenerator` 服务类，复用现有 `_draw_layout` 方法生成 base64 图片
- 新增两个 API 端点：`/tasks/{task_id}/original-layout-image` 和 `/tasks/{task_id}/solutions/{solution_id}/layout-image`
- 前端在仿真开始前请求原始布局图，仿真后请求优化布局图

**Tech Stack:** Python (FastAPI, SQLModel, Matplotlib), React, TypeScript

---

## Task 1: 后端 - 创建布局图片生成服务

**Files:**
- Create: `backend/app/services/layout_image_generator.py`

**Step 1: 创建布局图片生成服务**

```python
"""
布局图片生成服务
用于生成车间布局图（原始布局/优化布局）的 base64 编码图片
"""

import base64
from io import BytesIO
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Rectangle

from app.algorithms import part1_optimization


class LayoutImageGenerator:
    """布局图片生成器"""

    def __init__(self, industry_type: str):
        self.industry_type = industry_type

    def generate_layout_image(
        self,
        positions: list[list[float]],
        device_sizes: list[list[float]],
        workshop_dims: dict,
        solution_data: Optional[dict] = None,
        original_positions: Optional[list[list[float]]] = None,
    ) -> str:
        """
        生成布局图片并返回 base64 编码
        
        参数:
            positions: 设备位置坐标 [[x, y], ...]
            device_sizes: 设备尺寸 [[width, height], ...]
            workshop_dims: 车间尺寸 {L: float, W: float}
            solution_data: 优化方案数据（可选，用于显示性能指标）
            original_positions: 原始位置（可选，用于显示设备移动箭头）
            
        返回:
            base64 编码的 PNG 图片字符串
        """
        L = workshop_dims.get("L", 80.0)
        W = workshop_dims.get("W", 60.0)

        fig, ax = plt.subplots(1, 1, figsize=(16, 10))

        self._draw_layout(
            ax,
            positions,
            device_sizes,
            L,
            W,
            solution_data=solution_data,
            original_positions=original_positions,
        )

        fig.suptitle(
            "车间设备布局" + (" - 优化后" if solution_data else " - 原始"),
            fontsize=18,
            fontweight="bold",
            y=0.95,
        )

        plt.tight_layout(pad=3.0)

        buffer = BytesIO()
        fig.savefig(
            buffer,
            format="png",
            dpi=120,
            bbox_inches="tight",
            facecolor="white",
            edgecolor="none",
        )
        buffer.seek(0)

        img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        plt.close(fig)

        return img_base64

    def _draw_layout(
        self,
        ax,
        positions,
        device_sizes,
        L: float,
        W: float,
        solution_data: Optional[dict] = None,
        original_positions: Optional[list[list[float]]] = None,
    ):
        """绘制布局图"""
        ax.clear()
        ax.set_xlim(0, L)
        ax.set_ylim(0, W)
        ax.set_aspect("equal")
        ax.set_title("", fontsize=14, fontweight="bold", pad=10)
        ax.set_xlabel("X (米)", fontsize=11)
        ax.set_ylabel("Y (米)", fontsize=11)
        ax.grid(True, alpha=0.3, linestyle="--", color="#c0c0c0")

        rect = Rectangle(
            (0, 0),
            L,
            W,
            linewidth=2,
            edgecolor="black",
            facecolor="#f8f9fa",
            alpha=0.8,
        )
        ax.add_patch(rect)

        colors = {
            "fixed": "#8b4513",
            "movable": "#4169e1",
            "moved": "#32cd32",
            "storage_area": "#87ceeb",
            "quality_area": "#ffd700",
            "packaging_area": "#90ee90",
            "loading_area": "#ffb6c1",
        }

        for i, (x, y) in enumerate(positions):
            width = device_sizes[i][0] if i < len(device_sizes) else 3.0
            height = device_sizes[i][1] if i < len(device_sizes) else 2.0

            color = colors.get("movable")
            edgecolor = "blue"
            hatch = None

            if original_positions is not None and i < len(original_positions):
                orig_x, orig_y = original_positions[i]
                dist = np.sqrt((x - orig_x) ** 2 + (y - orig_y) ** 2)
                if dist > 0.5:
                    color = colors.get("moved")
                    edgecolor = "green"
                    hatch = "xx"

            rect = Rectangle(
                (x - width / 2, y - height / 2),
                width,
                height,
                facecolor=color,
                edgecolor=edgecolor,
                linewidth=2,
                alpha=0.8,
                hatch=hatch,
            )
            ax.add_patch(rect)

            ax.text(
                x,
                y,
                f"D{i + 1}",
                ha="center",
                va="center",
                fontsize=8,
                fontweight="bold",
                color="white",
            )

        if solution_data:
            f1 = solution_data.get("f1", 0)
            f2 = solution_data.get("f2", 0)
            ax.text(
                L - 10,
                W - 5,
                f"搬运成本: ¥{f1:.2f}\n移动成本: ¥{f2:.2f}",
                ha="right",
                va="top",
                fontsize=10,
                bbox=dict(boxstyle="round", facecolor="wheat", alpha=0.8),
            )
```

**Step 2: 提交**

```bash
git add backend/app/services/layout_image_generator.py
git commit -m "feat: add LayoutImageGenerator service for layout image generation"
```

---

## Task 2: 后端 - 新增 API 端点

**Files:**
- Modify: `backend/app/api/routes/tianchou.py`

**Step 1: 添加新的响应模型**

在 tianchou.py 文件开头的请求/响应模型部分（约 L100 附近），添加：

```python
class LayoutImageResponse(BaseModel):
    """布局图片响应"""
    task_id: str
    image_type: str  # "original" 或 "optimized"
    image_base64: str
```

**Step 2: 添加 API 端点**

在 tianchou.py 文件末尾（约 L845 附近），添加：

```python
@router.get("/tasks/{task_id}/original-layout-image", response_model=LayoutImageResponse)
async def get_original_layout_image(task_id: str, session: SessionDep) -> Any:
    """
    获取原始布局图
    
    - **task_id**: 任务ID
    - 返回 base64 编码的 PNG 图片
    """
    task = session.get(OptimizationTask, uuid.UUID(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="任务未完成，无法生成布局图")

    input_params = task.input_params
    
    original_positions = input_params.get("original_positions", [])
    device_sizes = input_params.get("device_sizes", [[3.0, 2.0]] * len(original_positions))
    workshop_dims = {
        "L": input_params.get("workshop_length", 80.0),
        "W": input_params.get("workshop_width", 60.0),
    }

    generator = LayoutImageGenerator(task.industry_type.value)
    image_base64 = generator.generate_layout_image(
        positions=original_positions,
        device_sizes=device_sizes,
        workshop_dims=workshop_dims,
    )

    return LayoutImageResponse(
        task_id=task_id,
        image_type="original",
        image_base64=image_base64,
    )


@router.get("/tasks/{task_id}/solutions/{solution_id}/layout-image", response_model=LayoutImageResponse)
async def get_optimized_layout_image(task_id: str, solution_id: str, session: SessionDep) -> Any:
    """
    获取优化方案布局图
    
    - **task_id**: 任务ID
    - **solution_id**: 方案ID
    - 返回 base64 编码的 PNG 图片
    """
    task = session.get(OptimizationTask, uuid.UUID(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    solution = session.get(ParetoSolution, uuid.UUID(solution_id))
    if not solution or str(solution.task_id) != task_id:
        raise HTTPException(status_code=404, detail="方案不存在")

    input_params = task.input_params
    
    optimized_positions = solution.solution_data.get("individual", [])
    device_sizes = input_params.get("device_sizes", [[3.0, 2.0]] * len(optimized_positions))
    original_positions = input_params.get("original_positions", [])
    workshop_dims = {
        "L": input_params.get("workshop_length", 80.0),
        "W": input_params.get("workshop_width", 60.0),
    }

    generator = LayoutImageGenerator(task.industry_type.value)
    image_base64 = generator.generate_layout_image(
        positions=optimized_positions,
        device_sizes=device_sizes,
        workshop_dims=workshop_dims,
        solution_data=solution.solution_data,
        original_positions=original_positions if original_positions else None,
    )

    return LayoutImageResponse(
        task_id=task_id,
        image_type="optimized",
        image_base64=image_base64,
    )
```

**Step 3: 添加 import**

在 tianchou.py 文件顶部添加：

```python
from app.services.layout_image_generator import LayoutImageGenerator
```

**Step 4: 提交**

```bash
git add backend/app/api/routes/tianchou.py
git commit -m "feat: add layout image API endpoints for original and optimized layouts"
```

---

## Task 3: 前端 - 新增 API 调用和图片显示

**Files:**
- Modify: `frontend/services/tianchouService.ts`
- Modify: `frontend/components/DeviceLayoutVisualizer.tsx`

**Step 1: 添加 API 方法**

在 `frontend/services/tianchouService.ts` 中添加：

```typescript
export const tianchouService = {
  // ... 现有方法

  async getOriginalLayoutImage(taskId: string): Promise<{
    task_id: string
    image_type: string
    image_base64: string
  }> {
    const response = await fetch(`/api/v1/tianchou/tasks/${taskId}/original-layout-image`)
    if (!response.ok) {
      throw new Error('Failed to fetch original layout image')
    }
    return response.json()
  },

  async getOptimizedLayoutImage(taskId: string, solutionId: string): Promise<{
    task_id: string
    image_type: string
    image_base64: string
  }> {
    const response = await fetch(`/api/v1/tianchou/tasks/${taskId}/solutions/${solutionId}/layout-image`)
    if (!response.ok) {
      throw new Error('Failed to fetch optimized layout image')
    }
    return response.json()
  },
}
```

**Step 2: 修改 DeviceLayoutVisualizer 组件**

在 `DeviceLayoutVisualizer.tsx` 中添加图片模式支持：

```typescript
interface DeviceLayoutVisualizerProps {
  isOptimized: boolean
  onToggle: (val: boolean) => void
  layoutData?: {
    zones?: typeof TEXTILE_ZONES
    machines?: typeof TEXTILE_MACHINES
    productLines?: typeof TEXTILE_PRODUCT_LINES
    metricsOriginal?: typeof TEXTILE_METRICS_ORIGINAL
    metricsOptimized?: typeof TEXTILE_METRICS_OPTIMIZED
  }
  decisionContext?: {
    taskId?: string
    taskName?: string
    solutionId?: string
    solutionRank?: number
    totalCost?: number
    implementationDays?: number
    expectedBenefit?: number
    expectedLoss?: number
    topsisScore?: number
  }
  // 新增：布局图片（base64）
  layoutImage?: string
}
```

在组件中添加图片渲染逻辑：

```typescript
export const DeviceLayoutVisualizer: React.FC<DeviceLayoutVisualizerProps> = ({
  isOptimized,
  onToggle,
  layoutData,
  decisionContext,
  layoutImage, // 新增 prop
}) => {
  // ... 现有代码

  // 如果有 layoutImage，直接显示图片
  if (layoutImage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <img 
          src={`data:image/png;base64,${layoutImage}`} 
          alt={isOptimized ? "优化后布局" : "原始布局"}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    )
  }

  // 原有 D3.js 渲染逻辑
  // ...
}
```

**Step 3: 修改 Huntian.tsx 调用新 API**

在 `Huntian.tsx` 中修改数据获取逻辑：

```typescript
// 在现有 useEffect 中添加
useEffect(() => {
  const state = location.state as HuntianRouteState | null
  
  // ... 现有逻辑 ...

  // 优先级5：获取布局图片
  if (decisionContext?.taskId) {
    // 仿真前获取原始布局图
    if (!isOptimized && !layoutImage) {
      tianchouService.getOriginalLayoutImage(decisionContext.taskId)
        .then(data => setLayoutImage(data.image_base64))
        .catch(console.error)
    }
    // 仿真后获取优化布局图
    else if (isOptimized && decisionContext.solutionId && !layoutImage) {
      tianchouService.getOptimizedLayoutImage(decisionContext.taskId, decisionContext.solutionId)
        .then(data => setLayoutImage(data.image_base64))
        .catch(console.error)
    }
  }
}, [decisionContext?.taskId, decisionContext?.solutionId, isOptimized])

// 添加 state
const [layoutImage, setLayoutImage] = useState<string | null>(null)

// 仿真重置时清除图片
const resetSimulation = () => {
  setLayoutImage(null)
  // ... 其他 reset 逻辑
}
```

然后将 `layoutImage` 传给 `DeviceLayoutVisualizer`：

```typescript
<DeviceLayoutVisualizer
  isOptimized={isOptimized}
  onToggle={setIsOptimized}
  layoutData={layoutData}
  decisionContext={decisionContext ?? undefined}
  layoutImage={layoutImage ?? undefined}
/>
```

**Step 4: 提交**

```bash
git add frontend/services/tianchouService.ts frontend/components/DeviceLayoutVisualizer.tsx frontend/pages/Huntian.tsx
git commit -m "feat: add layout image API integration in Huntian page"
```

---

## Task 4: 验证

**Step 1: 启动后端服务**

```bash
cd backend
docker compose up -d db backend
```

**Step 2: 创建测试优化任务**

使用现有的优化任务 API 创建一个测试任务，确认有数据可以测试。

**Step 3: 测试 API 端点**

```bash
# 测试原始布局图 API
curl http://localhost:8000/api/v1/tianchou/tasks/{task_id}/original-layout-image

# 测试优化布局图 API
curl http://localhost:8000/api/v1/tianchou/tasks/{task_id}/solutions/{solution_id}/layout-image
```

**Step 4: 测试前端**

启动前端并访问浑天页面，验证布局图显示正确。

**Step 5: 提交**

```bash
git commit -m "test: verify layout image generation and display"
```

---

## 实施完成

所有任务完成后，feature 分支即可用于合并。主干上即可使用新增的布局图片功能。
