# 3.8 OS 内核接入：扫描硬件关联回生产线（实施文档）

## 1. 目标

在现有 `OS 内核接入向导` 中补全“扫描 -> 协议匹配 -> 绑定产线/工位 -> 诊断报告”闭环，使扫描到的设备可以真正关联到生产拓扑，并能输出明确的接入结果与下一步引导。

本次实现遵循“轻量可落地”原则：
- 不新增复杂数据库表；
- 复用后端 `Station.equipment_ids` 存储设备绑定；
- 新增轻量 `kernel` 路由提供扫描进度、拓扑查询、绑定提交、诊断报告。

## 2. 当前问题（代码事实）

- 前端 `KernelConnect` 仅有 3 步 mock 流程，扫描由 `setTimeout` 模拟，未接后端。
- 缺少“绑定到产线/工位”步骤。
- 生产可视化层仍为 mock 数据占位，未形成内核接入反向回显链路。
- 后端已有 `ProductionLine` 与 `Station`，并且 `Station.equipment_ids` 可承载设备与工位关系。

## 3. 本次范围（MVP）

### 3.1 后端

新增 `backend/app/api/routes/kernel.py`：
- `POST /api/v1/kernel/scan-jobs`
  - 创建扫描任务，返回 `scan_job_id`。
- `GET /api/v1/kernel/scan-jobs/{scan_job_id}`
  - 返回扫描进度、已发现设备数、扫描状态（模拟分阶段递进）。
- `GET /api/v1/kernel/topology`
  - 返回产线与工位拓扑（来源：`ProductionLine` + `Station`）。
- `POST /api/v1/kernel/bindings:batch`
  - 提交设备绑定，写入对应 `Station.equipment_ids`。
- `GET /api/v1/kernel/diagnosis-reports/{scan_job_id}`
  - 返回诊断摘要：已发现、已绑定、未绑定、部分失败建议、跳转建议。

并在 `backend/app/api/main.py` 注册 `kernel` 路由。

### 3.2 前端

- 新增 `frontend/src/api/kernelConnectApi.ts`，封装上述接口（axios + Bearer token）。
- 改造 `frontend/pages/KernelConnect.tsx`：
  - 3 步改 4 步：`设备扫描 -> 协议匹配 -> 绑定产线/工位 -> 诊断报告`；
  - 扫描阶段显示进度与已发现数量；
  - 绑定阶段按设备选择产线、工位；
  - 提交绑定后拉取诊断报告；
  - 诊断页展示未发现/部分失败/全部成功及“前往实时监控 / 生产可视化”引导按钮（先跳转现有页面路由）。

## 4. 数据结构（接口响应核心）

- `DiscoveredDevice`
  - `device_id`, `name`, `ip`, `device_type`, `protocol`, `match_status`, `connectivity_status`, `last_communication_at`
- `TopologyLine`
  - `line_id`, `line_name`, `factory_id`, `stations[]`
- `BindingItem`
  - `device_id`, `line_id`, `station_id`
- `DiagnosisReport`
  - `scan_job_id`, `discovered_count`, `bound_count`, `unbound_device_ids[]`, `failed_device_ids[]`, `summary`, `recommendations[]`

## 5. 业务规则（MVP）

- 仅允许绑定到存在且归属正确的工位（`station.line_id == line_id`）。
- 单次扫描内同一设备只能绑定一个工位（后提交覆盖前提交）。
- 绑定成功后，将设备 ID 写入工位 `equipment_ids`（去重）。
- 诊断结论规则：
  - `discovered_count == 0`：未发现设备；
  - `0 < bound_count < discovered_count`：部分设备连接/绑定失败；
  - `bound_count == discovered_count`：接入成功。

## 6. 验收标准

- 能从 `/app/kernel` 发起扫描并看到动态进度；
- 扫描完成后进入协议匹配页，显示设备列表；
- 可完成设备到产线/工位的绑定提交；
- 提交后生成诊断报告，文案与计数准确；
- 后端 `stations.equipment_ids` 可看到绑定写入结果；
- 页面提供“前往实时监控/生产可视化”跳转入口。

## 7. 后续增强（不在本次）

- 建立专用内核设备表与历史绑定表；
- 将接入状态回写到 2D/3D 厂区可视化设备节点；
- 引入真实网络扫描任务与异步队列执行；
- 增加设备解绑、重绑审计日志与权限控制。

