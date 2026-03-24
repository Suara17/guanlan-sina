# 知识问答 document/vector 回归记录

日期：2026-03-23  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 回归范围
- 数据集：`backend/app/data/knowledge_qa/chunks.jsonl`
- 向量索引：`backend/app/data/knowledge_qa/embeddings.jsonl`
- 文档规模：`61` 份文档，`3007` 个 chunks，`3007` 条 embeddings
- 脚本入口：`backend/app/scripts/evaluate_knowledge_qa.py`
- 报告产物：`backend/app/data/knowledge_qa/evaluation_report.json`

## 典型问题集
- `AOI误报降低有哪些思路？`
- `SPI设备手册里焊膏检测通常怎么设置和检查？`
- `虚焊按照排故手册通常怎么处理？`
- `回流焊空洞怎么优化温度曲线？`
- `SMT贴片偏移怎么排查和校准？`

## 汇总结果
- `keyword`：`5 pass / 0 partial / 0 fail`
- `vector`：`4 pass / 1 partial / 0 fail`
- `fusion`：`5 pass / 0 partial / 0 fail`

## 主要观察
- `keyword` 当前已经稳定。
  - `AOI误报` 稳定命中 Siemens false-call reduction 文档。
  - `SPI设置检查` 稳定命中 `SE 300 Solder Paste Inspection User Guide`。
  - `虚焊排故`、`回流焊空洞`、`贴片偏移` 也都能给出可接受的 Top 命中。
- `vector` 已明显改善，但还没彻底收口。
  - 当前 `AOI误报`、`虚焊排故`、`回流焊空洞`、`贴片偏移` 已达到 `pass`。
  - 唯一还挂着的是 `SPI设备手册`，当前状态为 `partial`。
  - `SPI设备手册` 的问题不再是“完全找不着”，而是 Top1 仍可能被泛化工艺文档或弱相关手册内容抢位。
- `fusion` 当前已经收口到 `5 pass / 0 partial / 0 fail`。
  - 说明现有 `keyword + vector + fusion` 组合已经能把大部分弱相关向量结果压住。
  - 剩余问题更偏向 `vector` 单链路质量，而不是融合整体崩盘。

## 典型命中
### AOI误报
- `keyword` Top1：
  - `15 [AOI误报降低] Smarter false call reduction for electronics manufacturing (Siemens)`
- 结论：
  - 关键词链路结果准。
  - 向量链路当前已经能稳定命中 Siemens AOI false-call 相关文档，不再是早期那种乱飘状态。

### SPI设备手册
- `keyword` Top1：
  - `18 [SPI设备手册] SE 300 Solder Paste Inspection User Guide`
- `vector` Top1：
  - `Kester_Defect_Minimization_NoClean_SMT_Process...`
- 结论：
  - `keyword` 更像“手册问答”。
  - `vector` 已能把 `SE 300 Solder Paste Inspection User Guide` 拉进 Top3，但 Top1 还不够稳定。
  - 这块仍然是当前 document/vector 侧最值得继续收的点。

### 虚焊排故
- `keyword` Top1：
  - `04 [SMT排故] SMT Troubleshooting Guide 2017 (Alpha)`
- `vector` Top1：
  - `07_SMT_Trouble_Shooting_Guide_AIM_Solder`
- 结论：
  - 早期那种学术文档抢位的问题已经明显缓解。
  - 当前向量结果虽然不总是最佳手册，但至少已经回到排故资料这条正路上。

### 回流焊空洞
- `keyword` Top1：
  - `11 [回流曲线] Optimized Reflow Profiling to Minimize Voiding (KIC)`
- 结论：
  - 该类工艺问题的关键词和向量链路都已经比较可靠。

### 贴片偏移
- `vector` Top1：
  - `04 [SMT排故] SMT Troubleshooting Guide 2017 (Alpha)`
- 结论：
  - 该问题已不再是明确短板，当前 `keyword/vector/fusion` 都已达到 `pass`。
  - 后续仍可继续补充 `placement offset / calibration / feeder / nozzle` 相关语料，但优先级已经低于 `SPI设备手册`。

## 下一步建议
- 优先继续收 `SPI设备手册` 的 `vector` Top1 稳定性，重点提升手册型问答对 `manual / user guide / setup / check` 章节的偏置。
- 继续压制泛化工艺文档和弱相关 `vector` 结果，避免在手册型问题上抢位。
- 补一轮更细粒度问题分类，把“设备手册问答”“排故指南问答”“工艺优化问答”分开评估，别再一锅炖。
- 将本报告与 `evaluation_report.json` 绑定为同一口径，后续更新时以评估产物为准，别让文档继续跑偏。
