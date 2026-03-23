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
- `keyword`：`4 pass / 0 partial / 1 fail`
- `vector`：`3 pass / 0 partial / 2 fail`
- `fusion`：`3 pass / 1 partial / 1 fail`

## 主要观察
- `keyword` 已进入可用状态。
  - `AOI误报` 稳定命中 Siemens false-call reduction 文档。
  - `SPI设置检查` 稳定命中 `SE 300 Solder Paste Inspection User Guide`。
  - `回流焊空洞` 能稳定命中 KIC 回流曲线与空洞控制文档。
- `vector` 已经在跑真实 `embeddings.jsonl`，但效果还没完全收口。
  - `AOI误报`、`SPI设置检查`、`回流焊空洞` 虽然能在 Top3 内看到相关结果，但 Top1 仍会被泛化工艺文档抢位。
  - `虚焊排故` 会飘到 `MDPI PCB defect detection` 这种学术或泛检测资料上。
  - `贴片偏移` 仍然明显失真，当前没有可靠命中。
- `fusion` 目前有被 `vector` 误召回带偏的情况。
  - `虚焊排故` 在 `keyword` 已命中 Alpha 排故指南的情况下，融合后 Top1 仍被错误 `vector` 结果占住。
  - 这说明当前 `keyword/vector` 融合权重和去噪策略还不够硬。

## 典型命中
### AOI误报
- `keyword` Top1：
  - `15 [AOI误报降低] Smarter false call reduction for electronics manufacturing (Siemens)`
- 结论：
  - 关键词链路结果准。
  - 向量链路 Top1 仍偏到 `SPI基础`，说明语义邻近和业务相关性还没完全对齐。

### SPI设备手册
- `keyword` Top1：
  - `18 [SPI设备手册] SE 300 Solder Paste Inspection User Guide`
- `vector` Top1：
  - `16 [SPI基础] Solder Paste Inspection Techniques (Thomasnet)`
- 结论：
  - `keyword` 更像“手册问答”。
  - `vector` 更像“概念相近”，但不够偏向设备手册正文。

### 虚焊排故
- `keyword` Top1：
  - `04 [SMT排故] SMT Troubleshooting Guide 2017 (Alpha)`
- `vector` Top1：
  - `MDPI_PCB_Defect_Detection_Deep_Learning_...`
- 结论：
  - 语料筛选还不够干净，偏学术文档仍混入召回。
  - `fusion` 需要压低弱相关 `vector` 的话语权。

### 回流焊空洞
- `keyword` Top1：
  - `11 [回流曲线] Optimized Reflow Profiling to Minimize Voiding (KIC)`
- 结论：
  - 该类工艺问题的关键词链路已经比较可靠。

### 贴片偏移
- `keyword`：
  - 无命中
- `vector` Top1：
  - `07 [钢网设计] SMT STENCIL DESIGN (SMTnet library)`
- 结论：
  - 当前是最明确短板。
  - 问题不只是排序，语料本身缺少足够直接的 placement/offset/calibration 资料。

## 下一步建议
- 优先继续补 `placement offset / calibration / feeder / nozzle / pick and place` 相关语料。
- 对 `vector` 结果增加负样本压制，重点打掉学术论文和泛检测资料。
- 调整 `fusion` 排序权重，在 `keyword` 明确命中高价值手册/排故指南时，不要轻易被弱相关 `vector` 结果翻盘。
- 补一轮更细粒度问题分类，把“设备手册问答”“排故指南问答”“工艺优化问答”分开评估，别一锅炖。
