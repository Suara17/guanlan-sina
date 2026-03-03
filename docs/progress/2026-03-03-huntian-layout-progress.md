# 浑天页面设备重排布局图优化进度

## 任务目标
将原始布局图和优化后布局图从后端传入前端，点击按钮后再传入优化后布局图进行切换显示。

## 当前状态
- [x] 分析现有代码结构
- [ ] 确认后端API返回的布局数据结构
- [ ] 修改前端接收原始布局数据
- [ ] 修改前端组件支持后端数据
- [ ] 实现点击按钮切换布局图
- [ ] 测试验证

## 详细分析

### 现有数据流
1. `Huntian.tsx` 从路由接收 `optimizationResult.layoutData`
2. `DeviceLayoutVisualizer` 组件使用 `isOptimized` 状态切换原始/优化布局
3. 当前使用前端常量 `TEXTILE_MACHINES` 作为兜底数据

### 后端数据结构 (solution_data)
轻工业 (part1_optimization.py):
- `individual`: 设备位置数组 `[(x1,y1), (x2,y2), ...]`
- `f1`: 物料搬运成本
- `f2`: 设备移动成本
- `f3`: 空间利用率

### 需要修改的文件
1. `backend/app/api/routes/tianchou.py` - 返回原始布局位置
2. `frontend/pages/Huntian.tsx` - 接收并传递原始布局数据
3. `frontend/components/DeviceLayoutVisualizer.tsx` - 支持后端数据格式

## 进度记录

### 2026-03-03
- [x] 分析现有代码结构
- [x] 确认后端API返回的布局数据结构
- [x] 确认后端没有布局图片生成服务（需要新建）
- [x] Task 1: 后端 - 创建布局图片生成服务 (layout_image_generator.py) ✅
- [x] Task 2: 后端 - 新增API端点返回原始/优化布局图片 ✅
- [x] Task 3: 前端 - 新增API调用和图片显示 ✅
- [x] 测试验证 (代码检查通过)
- [x] 修复: 添加根据行业类型自动设置仿真模式
- [ ] 验证: 从侧边栏直接进入浑天页面是否能正确显示图片

### 技术分析

#### 后端数据结构
轻工业优化 (part1_optimization.py):
- `solution_data.individual`: 优化后的设备位置数组 `[(x1,y1), (x2,y2), ...]`
- `optimizer.original_positions`: 原始设备位置（需要额外返回）

#### 前端需要的数据格式 (LightIndustryLayoutData)
```typescript
{
  workshopDimensions: { length: number; width: number }
  devices: Array<{
    id: number
    name: string
    originalPosition: number[]
    newPosition: number[]
    size: { width: number; height: number }
  }>
  movedDevices: Array<{ deviceId: number; distance: number; cost: number }>
}
```

#### 需要修改的文件
1. `backend/app/api/routes/tianchou.py` - 返回原始布局位置
2. `frontend/pages/Tianchou/services/tianchouService.ts` - 数据转换
3. `frontend/components/DeviceLayoutVisualizer.tsx` - 支持后端数据格式
