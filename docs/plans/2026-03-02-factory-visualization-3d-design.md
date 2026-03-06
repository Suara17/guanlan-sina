# FactoryVisualization 3D 升级设计文档

## 1. 现有 2D 组件设计说明

### 1.1 组件概述

`FactoryVisualization` 是首页 Dashboard 的厂区动态图组件，采用 SVG 等轴测（Isometric）技术实现工厂的可视化展示。组件支持三级下钻导航：厂区 → 车间 → 产线。

### 1.2 现有架构

```
FactoryVisualization/
├── index.tsx          # 主容器，管理三级状态和面包屑导航
├── FactoryView.tsx   # Level 0：厂区视图，3个车间等轴测全览
├── WorkshopView.tsx  # Level 1：车间视图，3条产线等轴测排列
├── ProductionLineView.tsx  # Level 2：产线视图，工位等轴测展示
├── IsometricBlock.tsx     # 等轴测方块核心组件（三面体渲染）
├── MaterialParticle.tsx   # 物料流动画粒子
└── factoryData.ts         # 层级数据模型定义
```

### 1.3 核心特性

| 特性 | 说明 |
|------|------|
| **渲染技术** | SVG 等轴测投影（2:1 菱形比例） |
| **层级结构** | 厂区 → 车间 → 产线 → 工位 |
| **状态显示** | running/idle/error 三种状态，颜色区分 |
| **动画效果** | 物料粒子沿路径流动（SVG animateMotion） |
| **交互方式** | 点击下钻，面包屑返回 |
| **响应式** | viewBox 自适应，max-height 限制 |

### 1.4 数据模型

```typescript
// 状态类型
type StatusType = 'running' | 'idle' | 'error'

// 工位
interface Station {
  id: string
  name: string
  type: string
  status: StatusType
  cycleTime: number  // 节拍（秒）
  position: number   // 在产线中的顺序
}

// 产线
interface WorkshopLine {
  id: string
  name: string
  type: string
  status: StatusType
  oee: number
  currentOrder: string
  stations: Station[]
}

// 车间
interface Workshop {
  id: string
  name: string
  status: StatusType
  lines: WorkshopLine[]
  gridPos: GridPosition
}

// 厂区
type FACTORY_DATA = Workshop[]
```

### 1.5 现有组件详细说明

#### IsometricBlock（三维等轴测方块）

- **渲染方式**：SVG 三个多边形拼接（顶面菱形 + 左/右侧面平行四边形）
- **状态颜色**：根据 status 动态映射 top/left/right 面的填充色
- **脉冲动画**：右上角圆形呼吸效果，指示设备状态
- **交互**：支持 onClick 回调，hover 时 1.05 缩放

#### MaterialParticle（物料粒子）

- **实现方式**：SVG `animateMotion` 沿 path 运动
- **生命周期**：opacity 从 0→0.85→0 渐变
- **可配置**：路径、颜色、时长、延迟

#### 视图层级逻辑

| 层级 | 组件 | 显示内容 | 交互 |
|------|------|----------|------|
| 0 | FactoryView | 3个车间全览 | 点击进入车间 |
| 1 | WorkshopView | 车间内产线 + 物料流 | 点击进入产线 |
| 2 | ProductionLineView | 工位序列 + 传送带 | 仅展示 |

---

## 2. 3D 升级设计方案

### 2.1 技术选型

| 技术 | 选择 | 理由 |
|------|------|------|
| **渲染引擎** | Three.js + React Three Fiber | React 生态成熟，与现有项目兼容 |
| **光照** | PBR + 环境贴图 | 实现写实金属质感 |
| **交互** | @react-three/drei | OrbitControls, Html 悬停提示 |
| **状态管理** | Zustand | 轻量级，与 R3F 配合良好 |
| **动画** | @react-three/fiber 自带 + framer-motion-3d | 流畅过渡动画 |

### 2.2 视觉风格定义

| 元素 | 风格 |
|------|------|
| **设备材质** | 金属 PBR（roughness: 0.3, metalness: 0.8） |
| **地面** | 工业地坪漆（浅灰色，轻微反射） |
| **颜色方案** | 保留现有状态色：绿 running / 黄 idle / 红 error |
| **光照** | 1 个主方向光 + 1 个环境光 + 地面反射 |
| **阴影** | 软阴影（PCFSoftShadowMap） |

### 2.3 组件架构

```
FactoryVisualization3D/
├── index.tsx                    # 主容器（复用现有 index.tsx 逻辑）
├── FactoryScene.tsx            # Three.js Canvas 主场景
├── FactoryView3D.tsx           # Level 0：3D 厂区场景
├── WorkshopView3D.tsx          # Level 1：3D 车间场景
├── ProductionLineView3D.tsx    # Level 2：3D 产线场景
├── components/
│   ├── Workshop3D.tsx          # 3D 车间模型（程序化生成）
│   ├── ProductionLine3D.tsx    # 3D 产线模型
│   ├── Station3D.tsx           # 3D 工位设备模型
│   ├── Conveyor3D.tsx           # 3D 传送带
│   ├── Floor3D.tsx              # 3D 地面
│   ├── MaterialFlow3D.tsx      # 3D 物料流动画
│   └── StatusIndicator3D.tsx    # 3D 状态指示器
├── hooks/
│   └── useFactoryAnimation.ts   # 动画状态管理
└── utils/
    ├── geometry.ts              # 程序化几何体生成
    └── materials.ts            # PBR 材质预设
```

### 2.4 设备模型程序化生成方案

基于现有工位类型，程序化生成 3D 模型：

| 工位类型 | 几何体组合 | 尺寸 (WxHxD m) |
|----------|------------|----------------|
| 上料机 | 底座 + 料仓 + 传送辊 | 1.5×1.2×0.8 |
| 印刷机 | 底座 + 刮刀头 + 框架 | 1.2×1.5×1.0 |
| 检测机 | 底座 + 摄像头臂 + 支架 | 1.0×1.3×0.8 |
| 贴片机 | 底座 + 贴装头 + 供料器 | 2.0×1.8×1.2 |
| 回流焊炉 | 炉体 + 传送带 + 温控模块 | 3.0×1.2×1.0 |
| AOI | 底座 + 相机 + 光源环 | 1.0×1.4×0.8 |
| 分板机 | 底座 + 切割刀 + 收料盒 | 1.5×1.0×0.8 |
| 下料机 | 底座 + 收料架 + 输送辊 | 1.2×0.8×0.8 |

### 2.5 交互功能设计

| 交互 | 实现 | 说明 |
|------|------|------|
| **视角控制** | OrbitControls | 旋转、缩放、平移，限制极角防止穿地 |
| **悬停提示** | Html + Raycaster | 鼠标悬停显示设备名称、状态、节拍 |
| **点击下钻** | onClick 事件 | 点击车间/产线进入下一级 |
| **面包屑** | 复用现有 UI | 点击返回上级视图 |
| **视角过渡** | Camera + gsap | 切换视图时平滑移动摄像机 |

### 2.6 动画效果

| 动画 | 实现方式 |
|------|----------|
| **物料流动** | 沿路径移动的小方块/圆柱体 |
| **设备运行** | 传送带纹理滚动，关键部件微动 |
| **状态脉冲** | 指示灯闪烁（emissive 材质动画） |
| **视角切换** | gsap camera.position 缓动 |

### 2.7 性能优化策略

- **LOD (Level of Detail)**：远处使用低面数模型
- **InstancedMesh**：大量相同设备使用实例化渲染
- **按需渲染**：非活动视图暂停渲染
- **纹理压缩**：使用Basis纹理
- **预加载**：初始加载显示进度条

### 2.8 渐进升级方案

```
Phase 1: 基础 3D 渲染
├── 安装 Three.js + R3F 依赖
├── 创建 FactoryScene 基础框架
└── 实现静态 3D 车间/产线展示

Phase 2: 交互功能
├── 添加 OrbitControls
├── 实现悬停提示 Html
├── 集成点击下钻逻辑
└── 视角平滑过渡

Phase 3: 动画与特效
├── 物料流动动画
├── 设备运行动画
├── 状态指示动画
└── 阴影与光照优化

Phase 4: 性能优化
├── LOD 实现
├── InstancedMesh 优化
├── 按需渲染
└── 加载进度条
```

---

## 3. 数据接口兼容

复用现有 `factoryData.ts` 数据结构，无需修改后端 API。3D 组件接收相同 props：

```typescript
interface FactoryVisualization3DProps {
  // 从现有 index.tsx 传入相同数据
  initialLevel?: 'factory' | 'workshop' | 'line'
  onDrillToWorkshop?: (workshop: Workshop) => void
  onDrillToLine?: (line: WorkshopLine) => void
}
```

---

## 4. 依赖安装

```bash
cd frontend
npm install three @react-three/fiber @react-three/drei zustand
npm install -D @types/three
```

---

## 5. 后续工作

1. **设计验证**：确认视觉风格、设备模型是否符合预期
2. **实现计划**：拆分为 Phase 1-4 具体任务
3. **测试策略**：各层级交互测试、性能基准测试
4. **文档维护**：更新组件 README

---

*文档版本: 1.0 | 创建日期: 2026-03-02 | 项目: 弈控经纬*
