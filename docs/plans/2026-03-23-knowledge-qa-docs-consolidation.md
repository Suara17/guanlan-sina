# knowledge-qa 文档整理与当前口径

日期：2026-03-23  
分支：`knowledge-qa`  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 1. 这份文档是干什么的

这批 `knowledge-qa` 文档现在的问题，不是数量少，而是有点散，还有几份明显停留在“当时准备怎么干”的阶段。  
所以这里直接给一份整理后的总入口，解决三个事：

- 哪些文档是历史方案，主要拿来回溯背景
- 哪些文档还应该继续维护，作为当前真实口径
- 当前代码到底已经做到哪了，别让旧文档继续带偏判断

一句话说透：

- `design / implementation / frontend breakdown` 更多是历史设计稿
- `progress` 才是当前主进度文档
- `regression report` 是评估摘要，但要以 `evaluation_report.json` 为准
- `chroma / full langchain` 两份是后续演进方案，但其中大部分内容已经被代码落地

## 2. 当前建议保留的文档层次

建议把这批文档按下面三层来理解，别再平铺着看，不然谁看都容易犯迷糊。

### A. 总入口与事实口径

这层才是现在最该看的：

- [2026-03-22-knowledge-graph-qa-progress.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-22-knowledge-graph-qa-progress.md)
- [2026-03-23-knowledge-qa-regression-report.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-regression-report.md)
- [evaluation_report.json](/E:/Guanlan-Sina/.worktrees/knowledge-qa/backend/app/data/knowledge_qa/evaluation_report.json)
- 本文档：[2026-03-23-knowledge-qa-docs-consolidation.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-docs-consolidation.md)

用途：

- `progress` 管整体阶段状态
- `regression report` 管回归结论摘要
- `evaluation_report.json` 管真实评估产物
- 本文档负责把散文档归拢和标记状态

### B. 历史设计与实施背景

这层主要是“当时为什么这么设计”，不是当前事实源：

- [2026-03-22-knowledge-graph-qa-design.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-22-knowledge-graph-qa-design.md)

用途：

- 回看设计意图
- 理解最初的后端问答架构边界怎么定下来的
- 给后续继续重构时做背景参考

但注意：

- 这层现在只保留一份设计基线
- 具体前端入口策略和旧实施拆解，已经合并进本文档和 `progress`

### C. 演进方案与专项计划

这层主要记录文档 RAG 演进路线：

- [2026-03-23-knowledge-qa-chroma-implementation-plan.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-chroma-implementation-plan.md)
- [2026-03-23-knowledge-qa-full-langchain-ingestion-rag-plan.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-full-langchain-ingestion-rag-plan.md)

用途：

- 记录从“本地 jsonl 检索”升级到 `Chroma + LangChain RAG` 的演进路径
- 给后续继续做 `retriever`、`ingestion`、`structured output` 提供方向

但也得讲清楚：

- 这两份已经不再是纯计划，里头不少内容已经落地
- 继续维护时，应该保留“未完成项”，把已完成部分压缩进 `progress`

## 3. 本次删除与合并结果

这次不是简单删文件，是把已经完成、重复、或者明显偏离当前实现的文档收进去再删。

### 已删除并合并到其他文档

- `2026-03-22-knowledge-graph-qa-implementation.md`
  - 已完成的大部分任务已并入 [2026-03-22-knowledge-graph-qa-progress.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-22-knowledge-graph-qa-progress.md)
  - 文档角色和取舍结论已并入本文档
- `2026-03-22-sinan-qa-entry-design.md`
  - 核心页面入口策略已并入本文档
  - 已实现状态统一看 `progress`
- `2026-03-22-sinan-qa-frontend-breakdown.md`
  - 组件职责结论已并入本文档
  - 具体实现状态统一看 `progress`
- `2026-03-23-knowledge-qa-document-rag-plan.md`
  - 文档 RAG 起步方案已被 `Chroma` 和全 LangChain 方案覆盖
  - 保留价值低，关键演进路线已并入本文档

### 继续保留的文档

- `2026-03-22-knowledge-graph-qa-progress.md`
- `2026-03-22-knowledge-graph-qa-design.md`
- `2026-03-23-knowledge-qa-regression-report.md`
- `2026-03-23-knowledge-qa-chroma-implementation-plan.md`
- `2026-03-23-knowledge-qa-full-langchain-ingestion-rag-plan.md`
- 本文档 `2026-03-23-knowledge-qa-docs-consolidation.md`

## 4. 逐份文档整理结论

### 3.1 [2026-03-22-knowledge-graph-qa-design.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-22-knowledge-graph-qa-design.md)

状态：`保留，作为历史设计基线`

价值：

- 这份把最初的架构边界说清楚了：`graph -> keyword -> vector -> fusion -> answer`
- 对“不让 LLM 直接写 Cypher”这条红线写得很明确

过时点：

- 文档里写“向量检索当前不启用”，这话现在已经过期了
- 当前实际已经接入文档切块、embedding、`Chroma`、LangChain RAG 和真实 LLM

结论：

- 别删，留着当架构初衷说明
- 但不能再把它当成当前实现说明

### 4.2 `2026-03-22-knowledge-graph-qa-implementation.md`（已删除）

状态：`已删除，内容并入 progress + consolidation`

价值：

- 把最初任务拆得很细，后端和前端落点说得清楚
- 对当时为什么这么切模块有参考意义

过时点：

- 其中大量 `Task` 已经做完了，还按“待实施”口吻写着
- 当前服务层实际比这份计划又往前走了一大截，已经包括：
  - `ChromaVectorStoreService`
  - `LangChainDocumentIngestionService`
  - `LangChainRAGService`
  - 原始 `httpx` 的 OpenAI 兼容 LLM 适配

结论：

- 这份已经没有单独留着的必要
- 继续留着只会制造“任务还没做”的错觉

### 4.3 [2026-03-22-knowledge-graph-qa-progress.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-22-knowledge-graph-qa-progress.md)

状态：`当前主进度文档`

价值：

- 这是目前最接近代码真实状态的一份
- 已经记录了：
  - 统一问答 API
  - retriever 分层
  - 文档切块与 embedding
  - `Chroma` 接入
  - 全 LangChain ingestion / RAG 主干
  - OpenAI 兼容 LLM 的原始 `httpx` 改造

仍需注意：

- 后续所有阶段性结果，都应该优先更新这份
- 不要再把同级别“进度事实”散落到别的计划文档里

结论：

- 继续作为唯一主进度入口

### 4.4 `2026-03-22-sinan-qa-entry-design.md`（已删除）

状态：`已删除，结论并入 consolidation + progress`

价值：

- 页面放置策略和心智入口定义得比较清楚
- 对“司南数字人 + 问答面板”的产品形态有指导意义

当前对应实现：

- 全局问答入口状态管理已经做了
- `AiAssistant` 已接真实 API
- `KnowledgeGraph` 上下文也已经接进去了

结论：

- 页面放置策略已经定型，单独留文档收益不高
- 后续只看 `progress` 里的前端完成情况就够了

### 4.5 `2026-03-22-sinan-qa-frontend-breakdown.md`（已删除）

状态：`已删除，结论并入 consolidation + progress`

价值：

- 对 `App.tsx / SinanAvatar.tsx / AiAssistant.tsx` 的职责拆分说得比较完整

过时点：

- 里面很多“建议新增/建议改造”现在已经实现了

结论：

- 组件职责已经体现在代码和 `progress` 里
- 再留一份“建议怎么拆”的文档，纯属让人看两遍同一件事

### 4.6 [2026-03-23-knowledge-qa-chroma-implementation-plan.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-chroma-implementation-plan.md)

状态：`保留，但视为已部分完成的专项方案`

价值：

- 这份把为什么从 `jsonl` 升到 `Chroma` 讲得明白
- 服务职责、配置项、索引构建和检索切换都写清了

当前对应实现：

- `ChromaVectorStoreService` 已经存在
- `build_knowledge_qa_index.py` 已支持 `--with-chroma / --reset-chroma`
- `VectorRetriever` 已支持 `Chroma` 优先

结论：

- 继续保留，主要当 `Chroma` 子系统设计说明
- 已完成部分不要在这里继续写流水账，写到 `progress`

### 4.7 `2026-03-23-knowledge-qa-document-rag-plan.md`（已删除）

状态：`已删除，已被后续方案覆盖`

价值：

- 记录了文档接入最初的底座设计
- 对 `DocumentChunker / DocumentIndexService / build_knowledge_qa_index.py` 的起步逻辑有历史价值

过时点：

- 里面写“首版不上 Chroma”，现在已经过期
- 很多内容已被后续 `Chroma` 和全 LangChain 方案覆盖

结论：

- 这份是典型“起步阶段方案稿”
- 现在再留着，只会和 `Chroma`、全 LangChain 方案打架

### 4.8 [2026-03-23-knowledge-qa-regression-report.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-regression-report.md)

状态：`保留，并已更新到当前评估口径`

价值：

- 适合作为评估摘要，不用每次都去啃 JSON

本次已修正：

- 已对齐当前 [evaluation_report.json](/E:/Guanlan-Sina/.worktrees/knowledge-qa/backend/app/data/knowledge_qa/evaluation_report.json)
- 当前真实汇总应为：
  - `keyword`: `5 pass / 0 partial / 0 fail`
  - `vector`: `4 pass / 1 partial / 0 fail`
  - `fusion`: `5 pass / 0 partial / 0 fail`

结论：

- 后续继续保留
- 但更新时必须以 `evaluation_report.json` 为准，别自己脑补

### 4.9 [2026-03-23-knowledge-qa-full-langchain-ingestion-rag-plan.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-full-langchain-ingestion-rag-plan.md)

状态：`保留，作为当前演进方向说明`

价值：

- 这份已经很接近当前主线改造方向
- 对 `LangChain ingestion / Chroma / RAG chain / structured output / config split` 的路径写得最完整

当前对应实现：

- `LLM_* / EMBEDDING_*` 配置拆分已完成
- `LangChainDocumentIngestionService` 已完成
- `LangChainRAGService` 已完成
- `LangChainService` 已收敛为 LLM 薄适配层

仍未完全收口的点：

- `hybrid` 图谱误召回过滤还要继续做
- 结构化字段 fallback 还能更稳
- 评估与可观测性还能再补

结论：

- 这份可以继续保留作为“后续演进方向”文档

## 5. 当前代码真实状态

截至现在，代码已经不再是 3 月 22 日那种“图谱优先、文档还没接上”的阶段了。

当前真实状态是：

- 后端统一问答 API 已打通：`graph + keyword + vector + fusion + answer`
- 文档切块、索引和 `Chroma` 向量库已接入
- 全 LangChain ingestion / RAG 主干已接上
- 生成模型已切到 OpenAI 兼容 `base_url + api_key + model`
- 由于供应商和 `openai/langchain_openai` SDK 兼容性不稳，当前实际改成了原始 `httpx` 调 `/v1/chat/completions`
- 前端 `AiAssistant` 已接真实 API，并支持来源和上下文展示

实际存在的主要未收口点：

- `hybrid` 问答仍会混入不相关图谱事实
- `SPI设备手册` 的 `vector` Top1 还不够稳
- 回答结构虽然已经稳定了，但 fallback 还能继续加强

## 6. 建议的后续维护规则

后面别再让这批文档继续野蛮生长了，建议按下面规矩维护：

### 5.1 只保留一个主进度文档

统一使用：

- [2026-03-22-knowledge-graph-qa-progress.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-22-knowledge-graph-qa-progress.md)

规则：

- 所有已完成能力、最新验证结果、当前待办，统一写这里

### 5.2 评估结果只认一个真实源

统一使用：

- [evaluation_report.json](/E:/Guanlan-Sina/.worktrees/knowledge-qa/backend/app/data/knowledge_qa/evaluation_report.json)

规则：

- `regression report` 只是人类可读摘要
- 每次更新摘要前，先对齐 JSON，别文档自己跑偏

### 5.3 设计文档只管“为什么这么设计”

规则：

- `design / implementation / entry design / frontend breakdown` 不再滚动追加进度事实
- 需要写最新实现时，写到 `progress`

### 5.4 专项方案只保留未完成部分

规则：

- `chroma / document rag / full langchain` 这类文档以后只保留未完成事项和设计边界
- 已完成内容不再在里面持续堆积

## 7. 当前推荐阅读顺序

如果后面要继续这个项目，建议按下面顺序看，别上来九份全开，跟超市大促抢鸡蛋似的：

1. [2026-03-23-knowledge-qa-docs-consolidation.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-docs-consolidation.md)
2. [2026-03-22-knowledge-graph-qa-progress.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-22-knowledge-graph-qa-progress.md)
3. [2026-03-23-knowledge-qa-regression-report.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-regression-report.md)
4. [evaluation_report.json](/E:/Guanlan-Sina/.worktrees/knowledge-qa/backend/app/data/knowledge_qa/evaluation_report.json)
5. 需要回看历史设计时，再看：
   - [2026-03-22-knowledge-graph-qa-design.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-22-knowledge-graph-qa-design.md)
6. 继续做 RAG 演进时，再看：
   - [2026-03-23-knowledge-qa-chroma-implementation-plan.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-chroma-implementation-plan.md)
   - [2026-03-23-knowledge-qa-full-langchain-ingestion-rag-plan.md](/E:/Guanlan-Sina/.worktrees/knowledge-qa/docs/plans/2026-03-23-knowledge-qa-full-langchain-ingestion-rag-plan.md)

## 8. 一句话结论

这批文档不用全删，但必须分层看：

- `progress + regression report + evaluation_report.json` 是当前事实层
- `design` 是精简后的历史背景层
- `chroma / full langchain` 是演进方向层

否则你后面再看这堆文档，很容易出现一种经典场面：计划写得像要登月，代码其实已经拐到另一个轨道上了，还在拿旧地图找新路。
