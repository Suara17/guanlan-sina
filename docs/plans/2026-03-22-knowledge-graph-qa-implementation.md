# 知识图谱 + LangChain 问答 Implementation Plan

日期：2026-03-22  
分支：`knowledge-qa`  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 目标
- 基于 [2026-03-22-knowledge-graph-qa-design.md](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\plans\2026-03-22-knowledge-graph-qa-design.md) 落地“Neo4j 图查询 + LangChain LLM 生成”的问答能力。
- 在当前没有大规模非结构化文档的前提下，优先上线 graph-only / graph-first。
- 为后续关键词检索、向量检索和完整 RAG 预留扩展位。

## 当前代码调研结论

### 已有能力
- 后端已有 Neo4j 服务封装：
  - `backend/app/services/neo4j_service.py`
  - 已提供 `get_anomaly_analysis`、`find_similar_anomalies`、`recommend_solutions`、`get_all_anomalies` 等固定模板查询。
- 后端已有知识图谱路由：
  - `backend/app/api/routes/knowledge_graph.py`
  - 路由已挂载到 `/api/v1/knowledge-graph/*`，可直接作为结构化问答检索入口。
- 前端已有知识图谱 API 与适配层：
  - `frontend/src/api/knowledgeGraphApi.ts`
  - `frontend/services/neo4jService.ts`
  - `frontend/services/dataAdapter.ts`
  - 已能消费图谱分析、相似异常、方案推荐、全量异常接口。

### 现存缺口
- 没有完整的 LangChain 编排层：
  - 当前只有图谱查询 API 与模板摘要回答，缺少检索器分层、LangChain LLM 封装和后续 RAG 扩展位。
- 没有问答数据契约：
  - 后端缺少 `QARequest`、`QAResponse`、`Citation`、`RetrievalTrace` 等结构。
- 没有可复用的后端 LLM 生成层：
  - 当前虽已补模板摘要回答，但 LangChain + LLM 的主路径还未真正形成稳定能力。
- 没有知识问答前端入口：
  - 初始版本的 `AiAssistant` 只支持“一键诊断产线健康”，不支持用户自由提问，也不消费真实检索结果。
- 没有问答回归测试：
  - 缺少路由决策测试、融合测试、API 测试和失败降级测试。

### 实施约束
- 本阶段不做 LLM 生成 Cypher。
- 结构化查询优先复用现有 `knowledge_graph.py` 和 `neo4j_service.py` 的固定能力。
- 文档与向量检索在语料未准备好前不强制接入。
- 前端问答统一走后端 API。

## 架构落点

### 后端新增模块建议
- `backend/app/api/routes/knowledge_qa.py`
  - 统一问答 API。
- `backend/app/services/knowledge_qa_service.py`
  - 编排路由、图检索、降级与回答生成。
- `backend/app/services/qa_router.py`
  - 规则路由器，判断图谱/文档/混合。
- `backend/app/services/qa_answer_service.py`
  - 负责模板回答与 LangChain 回答生成。
- `backend/app/services/langchain_service.py`
  - 负责 LangChain / LLM 适配。
- `backend/app/schemas/` 当前仓库未单独拆分 schema
  - 可先在 `knowledge_qa.py` 或 `knowledge_qa_service.py` 内定义 SQLModel/Pydantic 请求响应模型，后续再视复杂度抽离。

### 前端改造落点
- `frontend/src/api/knowledgeQaApi.ts`
  - 新增问答接口客户端。
- `frontend/components/AiAssistant.tsx`
  - 从“一键诊断”升级为“可提问的知识问答面板”。
- `frontend/components/SinanAvatar.tsx`
  - 作为全局悬浮问答入口的首选承载组件。
- 可选新增：
  - `frontend/services/knowledgeQaService.ts`
  - 若团队希望复用请求转换、引用格式化、错误提示逻辑，可增加一层服务封装。
 - UI 落地方式以 [2026-03-22-sinan-qa-entry-design.md](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\plans\2026-03-22-sinan-qa-entry-design.md) 为准。

## 分阶段任务

### Task 1：LangChain 配置与回答器
- 状态：进行中
- 现有产出：
  - `backend/app/services/langchain_service.py`
  - `backend/app/core/config.py`
- 后续补充：
  - 增加 embedding / vector store 相关配置
  - 明确默认 LLM 供应商与模型

### Task 2：补齐后端问答依赖注入与数据契约

**Files**
- Modify: `backend/app/api/deps.py`
- Modify: `backend/app/core/config.py`
- Create: `backend/app/api/routes/knowledge_qa.py` 或同文件内数据模型

**目标**
- 定义统一请求/响应模型，避免前后端各自拼字段。

**必须落地的数据结构**
- `QARequest`
  - `question: str`
  - `line_type: str | None = None`
  - `sequence: int | None = None`
  - `top_k: int = 5`
- `QARouteDecision`
  - `mode: 'graph' | 'document' | 'hybrid'`
  - `reasons: list[str]`
- `QACitation`
  - `source_type: 'graph' | 'document'`
  - `title: str`
  - `snippet: str`
  - `score: float | None`
  - `metadata: dict[str, Any]`
- `QAResponse`
  - `answer: str`
  - `route: QARouteDecision`
  - `citations: list[QACitation]`
  - `warnings: list[str]`
  - `graph_hits: list[dict[str, Any]]`
  - `document_hits: list[dict[str, Any]]`

**实施要点**
- `config.py` 增加显式开关：
  - `LANGCHAIN_ENABLED`
  - 可选 `KNOWLEDGE_QA_ENABLED`
- 依赖注入需在配置缺失时返回 503，而不是在业务代码里散落判断。

### Task 3：实现问题路由器

**Files**
- Create: `backend/app/services/qa_router.py`
- Modify: `backend/app/services/knowledge_qa_service.py`

**目标**
- 用规则路由替代模型路由，严格遵循设计文档。

**首版规则**
- 命中以下关键词倾向 `graph`
  - `异常`、`原因`、`根因`、`方案`、`建议`、`处理`、`产线`、`序号`、`编号`、`相似`
- 命中以下关键词倾向 `document`
  - `SOP`、`作业指导书`、`流程`、`规范`、`点检`、`手册`、`工单`
- 同时命中或携带显式结构化参数时返回 `hybrid`
  - `sequence`
  - `line_type`

**实施要点**
- 路由器返回“判定结果 + 命中原因”，用于日志与调试。
- 规则必须集中管理，不要散落在 API 层。
- 允许后续通过配置扩展关键词表。

### Task 4：实现结构化检索聚合层

**Files**
- Create: `backend/app/services/knowledge_qa_service.py`
- Reuse: `backend/app/services/neo4j_service.py`
- Reuse: `backend/app/api/routes/knowledge_graph.py`

**目标**
- 将现有图谱能力包装成适合问答的“事实片段”。

**建议映射**
- `异常/序号/编号`
  - 调 `neo4j_service.get_anomaly_analysis(sequence)`
- `相似/类似`
  - 调 `neo4j_service.find_similar_anomalies(question, limit)`
- `方案/建议/处理`
  - 若有 `line_type` 则调 `neo4j_service.recommend_solutions(line_type, severity=None)`
- `全量/统计`
  - 调 `neo4j_service.get_all_anomalies()` 或统计接口

**实施要点**
- 不直接从 API 路由内部相互调用，应该直接复用 service 方法。
- 图谱结果要转换为标准化片段：
  - `title`
  - `snippet`
  - `score`
  - `metadata`
- `snippet` 以事实陈述为主，不返回过长原始结构。

### Task 5：实现关键词检索与向量检索扩展位

**Files**
- Modify/Create: `backend/app/services/knowledge_qa_service.py`
- Create: `backend/app/services/langchain_service.py`

**目标**
- 在 graph retriever 之外，为后续 RAG 补足扩展位。

**实施要点**
- 当前先实现关键词检索占位或结构化文本弱检索。
- 向量检索仅保留接口和配置，不强行落地。
- 所有文档/向量路径都应允许优雅降级。

### Task 6：实现上下文融合与回答生成

**Files**
- Create: `backend/app/services/qa_answer_service.py`
- Create: `backend/app/services/langchain_service.py`
- Modify: `backend/app/services/knowledge_qa_service.py`

**目标**
- 基于图谱事实与可用检索片段生成回答，并附带引用。

**首版策略**
- 先结构化事实，后文档片段。
- 对图谱片段和文档片段做总量裁剪，限制 prompt 长度。
- 回答必须显式区分：
  - 已确认的图谱事实
  - 来自其他检索源的补充建议
  - 不确定项

**回答约束**
- 不允许脱离检索结果自由编造。
- 当只有单路成功时，回答应说明另一条链路失败或无命中。
- 当双路都无结果时，返回“未检索到信息 + 推荐关键词”。

**模型实现建议**
- 首版通过 LangChain 统一封装 LLM。
- 若未安装依赖或未配置 API Key，则退回“检索摘要回答”。

### Task 7：新增统一问答 API

**Files**
- Create: `backend/app/api/routes/knowledge_qa.py`
- Modify: `backend/app/api/main.py`

**接口建议**
- `POST /api/v1/knowledge-qa/ask`

**请求示例**
```json
{
  "question": "SMT产线异常3的可能原因和处理建议是什么？",
  "line_type": "SMT",
  "sequence": 3,
  "top_k": 5
}
```

**响应要求**
- 返回 `answer`
- 返回 `route`
- 返回 `citations`
- 返回 `warnings`
- 可选返回 `debug`
  - 仅在本地环境下开启，用于查看路由结果和命中摘要

**实施要点**
- 路由层只负责参数校验、依赖注入、异常转译。
- 业务 orchestration 放在 service 层，不把逻辑堆到 route。

### Task 8：前端接入统一知识问答入口

**Files**
- Create: `frontend/src/api/knowledgeQaApi.ts`
- Modify: `frontend/components/AiAssistant.tsx`
- Modify: `frontend/components/SinanAvatar.tsx`
- Modify: `frontend/App.tsx`（如需传递上下文）
- 可选 Modify: `frontend/services/geminiService.ts`

**目标**
- 将现有悬浮助手体系改造为“司南数字人入口 + 问答面板”。

**首版交互要求**
- 支持用户输入自然语言问题。
- 支持展示：
  - 助手回答
  - 引用来源列表
  - 降级/错误提示
- 保留一个快捷问题按钮：
  - 如“分析当前产线健康状况”
  - 但其底层也走统一问答 API

**实施要点**
- 不再由前端直接调用 Gemini 生成知识问答答案。
- 若仍保留 `geminiService.ts`，应限定为其他场景使用，不再承载知识图谱问答主链路。
- 引用区建议区分：
  - `图谱事实`
  - `文档片段`
- 页面放置策略遵循 [2026-03-22-sinan-qa-entry-design.md](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\plans\2026-03-22-sinan-qa-entry-design.md)：
  - 第一阶段悬浮放置：`Dashboard`、`SinanAnalysis`、`KnowledgeGraph`
  - 第二阶段可扩展：`KernelConnect`
  - `Huntian`、`Tianchou`、`Zhixing` 使用轻量按钮入口，不直接放悬浮数字人

### Task 9：日志、超时、降级与安全

**Files**
- Modify: `backend/app/services/knowledge_qa_service.py`
- Modify: `backend/app/api/routes/knowledge_qa.py`

**目标**
- 落地设计文档中的可观测性与兜底策略。

**必须覆盖**
- Neo4j 失败 -> 友好失败
- LangChain 不可用 -> 模板回答
- 双路失败 -> 友好失败响应
- 单路超时不阻断整体响应

**日志要求**
- 记录：
  - 问题摘要
  - 路由决策
  - 命中条数
  - 外部依赖耗时
- 不记录：
  - 整段文档正文
  - 敏感凭证

### Task 10：测试与回归

**Files**
- Create: `backend/tests/services/test_qa_router.py`
- Create: `backend/tests/services/test_knowledge_qa_service.py`
- Create: `backend/tests/services/test_langchain_service.py`
- Create: `backend/tests/api/routes/test_knowledge_qa.py`

**测试范围**
- 路由规则测试
  - 图谱问题
  - 文档问题
  - 混合问题
- 融合测试
  - 图谱优先排序
  - 文档引用保留
- 降级测试
  - Neo4j 异常
  - LangChain 不可用
- API 测试
  - 参数校验
  - 成功响应结构
  - 503 配置缺失场景

**手工回归路径**
1. 图谱问题：输入异常编号类问题，确认命中图谱引用。
2. 文档问题：输入 SOP/规范类问题，确认命中文档引用。
3. 混合问题：输入“某异常如何按 SOP 处理”，确认双路命中。
4. 断路测试：关闭 Neo4j 或移除 LangChain 配置，确认仍能部分回答。

## 推荐实施顺序
1. Task 2：先补依赖注入和数据契约。
2. Task 3-5：完成图谱检索、关键词扩展与问题路由。
3. Task 6-7：接入回答生成与统一 API。
4. Task 8：前端 `AiAssistant` 对接。
5. Task 9-10：补齐日志、降级和测试。

## 验收标准
- 后端存在统一问答接口，且已挂载到 `api_router`。
- 图谱问题可复用现有 Neo4j 查询能力返回可解释答案。
- LLM 启用时可返回 grounded answer；未启用时有稳定模板兜底。
- 后续向量检索接入时无需重写整个问答接口。
- 前端 `AiAssistant` 可直接发起问答，不再绕过后端。
- 至少具备基础单测与一轮手工回归记录。

## 风险与兜底
- 当前缺少非结构化文档：
  - 向量检索收益暂时有限，不应阻塞图谱问答上线。
- `AiAssistant.tsx` 当前交互模型过于简单：
  - 首版问答 UI 应控制范围，先做文本问答与引用，不追加复杂会话管理。
- `backend/app/api/deps.py` 中 `get_neo4j_service()` 每次实例化连接：
  - 若后续性能或资源占用异常，再考虑连接生命周期优化，本次计划先不阻塞落地。
- 当前工作区已有未提交改动：
  - `backend/app/core/config.py`
  - `backend/app/services/langchain_service.py`
  - `docs/plans/2026-03-22-knowledge-graph-qa-design.md`
  - `docs/plans/2026-03-22-knowledge-graph-qa-progress.md`
  - 后续实施需避免覆盖已有变更。

## 备注
- 本文档以“调研现状后补实施计划”为目的，重点是把设计方案映射到当前仓库真实模块。
- 若下一步直接开始开发，建议从 Task 2 开始，因为 Task 1 已完成并已有进度文档记录。
