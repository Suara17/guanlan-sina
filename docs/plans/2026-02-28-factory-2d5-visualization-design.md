# 厂区-生产线 2.5D 动态可视化模块 设计文档

**目标：** 在生产可视化首页（`/app/`）新增"厂区动态图"区域，提供厂区→车间→产线三级点击下钻的等轴测 2.5D 动态图。

**架构方案：** 纯 SVG + CSS transform 等轴测投影（Isometric），Framer Motion 驱动动画，无新增重型依赖。

**技术栈：** React 19, TypeScript, Tailwind CSS, Framer Motion, SVG

---

## 1. 层级结构

```
厂区视图（Factory）
  └── 车间 A（SMT 车间）
  |     └── 产线 A01、A02、A03
  └── 车间 B（PCB 车间）
  |     └── 产线 B01、B02、B03
  └── 车间 C（3C 车间）
        └── 产线 C01、C02、C03
```

每一层均以 2.5D 等轴测视角呈现，点击某个元素"下钻"，面包屑导航支持返回上层。

---

## 2. 视图设计

### 2.1 厂区视图（Level 0）
- 3 个车间以等轴测方块排列，标注车间名称和整体状态
- 状态色：全部正常（绿）、有异常（橙/红）
- 顶部显示全厂汇总指标

### 2.2 车间视图（Level 1）
- 展开为该车间内的 3 条产线，等轴测排列
- 每条产线显示：名称、状态（运行/待机/故障）、OEE、当前工单
- 产线间有物料流动动画（粒子沿箭头流动）

### 2.3 产线视图（Level 2）
- 展开为该产线的工序步骤（印刷→SPI→贴片→回流焊→AOI→分板）
- 每个工位以等轴测设备块呈现，配状态色
- 工位间有传送带/物料流动粒子动画
- 底部显示节拍（cycle time）、当前状态
- 右侧显示"接入实时数据后此处显示实际状态"占位提示

---

## 3. 等轴测 SVG 技术方案

等轴测变换公式（标准 Isometric 投影）：

```
screen_x = (col - row) * (tileWidth / 2)
screen_y = (col + row) * (tileHeight / 2)
```

每个"块"（车间/产线/设备）由三个面组成：
- **顶面**（Top）：状态色填充，显示名称/图标
- **左侧面**（Left）：深色，增加立体感
- **右侧面**（Right）：中间色，增加立体感

---

## 4. 动态效果

| 效果 | 实现方式 |
|------|---------|
| 物料流动粒子 | SVG `<circle>` + Framer Motion `animateAlongPath` |
| 设备状态脉冲 | CSS `animate-pulse` + 状态色圆点 |
| 层级切换过渡 | Framer Motion `AnimatePresence` + `scale/opacity` |
| 故障闪烁 | CSS keyframes `@keyframes blink` |
| 下钻缩放 | Framer Motion `layoutId` 共享元素动画 |

---

## 5. 组件结构

```
frontend/components/
├── FactoryVisualization/
│   ├── index.tsx              # 主容器：层级状态管理 + 面包屑
│   ├── FactoryView.tsx        # 厂区全览（Level 0）
│   ├── WorkshopView.tsx       # 车间视图（Level 1）
│   ├── ProductionLineView.tsx # 产线详情（Level 2）
│   ├── IsometricBlock.tsx     # 等轴测方块基础组件
│   ├── MaterialParticle.tsx   # 物料流动粒子
│   └── factoryData.ts         # Mock 数据（厂区/车间/产线/工位）
```

Dashboard.tsx 中新增一个卡片区域，引入 `FactoryVisualization` 组件。

---

## 6. 数据结构

```typescript
// 复用 mockData.ts 中的 PRODUCTION_LINES，扩展以下结构：
interface Workshop {
  id: string
  name: string
  lines: ProductionLine[]
  position: { row: number; col: number }  // 等轴测网格位置
}

interface Station {
  id: string
  name: string
  type: string
  status: 'running' | 'idle' | 'error'
  cycleTime: number
  position: number  // 在产线中的序号
}
```

---

## 7. 实时数据占位

在产线视图（Level 2）右下角放置一个占位 banner：

> ⚡ **数据来源：仿真测试数据**
> 接入实时数据后，此处将显示设备实际运行状态、节拍数据与异常告警。

---

## 8. 与现有代码的集成点

- **复用：** `mockData.ts` 中的 `PRODUCTION_LINES`（9 条产线，已有状态字段）
- **复用：** 现有状态色体系（running=green, idle=amber, error=red）
- **修改：** `Dashboard.tsx` — 在现有布局中新增 `<FactoryVisualization />` 卡片区域
- **不修改：** 现有指标卡片、图表、异常列表等组件

---

*设计版本: 1.0 | 日期: 2026-02-28*
