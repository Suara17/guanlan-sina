# knowledge-qa 基于 Chroma 的文档向量检索实施方案

日期：2026-03-23  
分支：`knowledge-qa`  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 1. 背景

当前 `knowledge-qa` 已经具备一条能跑通的问答主链路：

- `GraphRetriever` 负责 Neo4j 图谱检索
- `KeywordRetriever` 负责基于 chunk 的关键词检索
- `VectorRetriever` 负责基于 embedding 的语义检索
- `KnowledgeQAService` 负责路由、并行执行、融合与回答生成
- `LangChainService` 负责在有 LLM 配置时生成 grounded answer

但文档向量检索层现在仍然比较土：

- 离线产物是 `chunks.jsonl + embeddings.jsonl`
- 在线向量检索依赖 [`backend/app/services/retrievers/vector_retriever.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\retrievers\vector_retriever.py)
- 当前实现本质上是“加载全部 embedding 到内存后逐条扫一遍”

这套东西小规模还能凑合，大一点就开始犯毛病：

- 冷启动慢
- 检索全靠 Python 内存遍历
- 增量更新不顺手
- 元数据过滤能力弱
- 跟 LangChain 的标准 retriever / vector store 生态没真正接上

所以本方案目标很明确：把文档向量层切到 `Chroma`，但不推倒现有问答编排层。

## 2. 为什么选 Chroma

这回选 `Chroma`，是因为它适合当前分支的阶段目标，不是因为它名字洋气。

### 2.1 适配当前项目的原因

- 本地开发友好，不需要额外起独立向量数据库服务
- 可以直接持久化到磁盘目录，适合当前 `worktree + 本地调试` 的工作方式
- LangChain 集成成熟，`vector store / retriever` 接线简单
- 支持 metadata 存储，后续能做 `line_type / document_id / section` 过滤
- 能先把“真向量库检索”落地，再考虑以后是否迁到 `pgvector`

### 2.2 为什么不是现在上 pgvector

- 项目里虽然有 PostgreSQL，但目前核心问题不是“数据库不够强”，而是“文档向量层还没跟 LangChain 的标准存储接起来”
- 直接上 `pgvector` 会带来数据库扩展、迁移和部署改造，实施成本更高
- 当前优先目标是把 RAG 检索层做稳，而不是给自己多加一层运维活

### 2.3 为什么不是继续用本地 jsonl

- `jsonl + 全量内存扫描` 只是过渡方案，不是长期方案
- 文档一多，查询延迟和内存占用都会越来越难看
- 这玩意不适合做标准化 metadata filter 和后续迭代

## 3. 目标与非目标

### 3.1 目标

- 用 `Chroma` 持久化文档 chunk 向量
- 复用当前 `DocumentChunker` 和 `EmbeddingService`
- 保持现有 `graph + keyword + vector + fusion + answer` 架构不大拆
- 将 `VectorRetriever` 改为基于 `Chroma` 查询
- 支持离线全量构建和后续增量重建
- 支持在回答中返回真实文档元数据和引用信息

### 3.2 非目标

- 本阶段不重做整套问答 API
- 本阶段不引入复杂的多租户知识库管理
- 本阶段不做 OCR 流水线
- 本阶段不接多轮对话记忆
- 本阶段不搞 fancy 的 agent 工作流，先把检索链路做实

## 4. 总体架构

目标架构如下：

1. 文档离线解析与切块
2. embedding 生成
3. chunk + metadata 写入 `Chroma`
4. 在线 `VectorRetriever` 通过 `Chroma` 检索
5. `KnowledgeQAService` 并行融合 `graph / keyword / vector`
6. `QAAnswerService` / `LangChainService` 用 citation 生成最终回答

### 4.1 保留的部分

以下模块继续保留，不需要推翻：

- [`backend/app/services/document_chunker.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\document_chunker.py)
- [`backend/app/services/knowledge_qa_service.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\knowledge_qa_service.py)
- [`backend/app/services/qa_fusion_service.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\qa_fusion_service.py)
- [`backend/app/services/qa_answer_service.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\qa_answer_service.py)
- [`backend/app/services/langchain_service.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\langchain_service.py)

### 4.2 重点替换的部分

重点替换以下两块：

- 离线索引构建脚本：
  - [`backend/app/scripts/build_knowledge_qa_index.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\scripts\build_knowledge_qa_index.py)
- 在线向量检索器：
  - [`backend/app/services/retrievers/vector_retriever.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\retrievers\vector_retriever.py)

## 5. 数据与目录规划

建议把 Chroma 持久化目录放到：

```text
backend/app/data/knowledge_qa/chroma/
```

保留以下产物：

```text
backend/app/data/knowledge_qa/
├── manifest.json
├── chunks.jsonl
├── chroma/
└── evaluation_report.json
```

说明：

- `chunks.jsonl` 继续保留，作为调试、审计和关键词检索基础数据
- `Chroma` 负责向量和 metadata 持久化
- `embeddings.jsonl` 可以退居二线，默认不再作为在线检索主输入

## 6. 配置设计

建议在 [`backend/app/core/config.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\core\config.py) 中新增以下配置：

```python
VECTOR_STORE_PROVIDER: str = "chroma"
CHROMA_COLLECTION_NAME: str = "knowledge_qa_chunks"
CHROMA_PERSIST_DIR: str = "app/data/knowledge_qa/chroma"
CHROMA_TOP_K: int = 5
```

补充说明：

- `VECTOR_STORE_PROVIDER` 为后续保留扩展口，避免以后再硬改代码
- `CHROMA_COLLECTION_NAME` 用于区分不同知识库集合
- `CHROMA_PERSIST_DIR` 用于本地持久化
- `CHROMA_TOP_K` 可作为默认召回数量

## 7. 新增服务设计

建议新增：

- `backend/app/services/chroma_vector_store_service.py`

职责只做两件事：

1. 提供离线入库能力
2. 提供在线检索能力

### 7.1 对外接口建议

建议暴露这些方法：

- `reset_collection()`
- `upsert_chunks(chunk_records: list[dict[str, Any]])`
- `similarity_search(query_text: str, top_k: int, filters: dict[str, Any] | None = None)`
- `get_retriever(top_k: int, filters: dict[str, Any] | None = None)`

### 7.2 metadata 建议字段

每个 chunk 写入 Chroma 时建议带上：

- `chunk_id`
- `document_id`
- `title`
- `source_file`
- `page`
- `section`
- `file_type`
- `line_types`
- `keywords`

注意：

- `Chroma` 的 metadata 最好用标量和简单列表，别塞一堆乱七八糟的嵌套结构
- 真要复杂结构，提前扁平化，不然后面过滤容易翻车

## 8. 离线构建方案

## 8.1 现状

当前 [`backend/app/scripts/build_knowledge_qa_index.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\scripts\build_knowledge_qa_index.py) 已经能做：

- 扫描文档目录
- 解析 PDF/TXT/MD
- 清洗页面文本
- 切块
- 写 `chunks.jsonl`
- 可选写 `embeddings.jsonl`

### 8.2 目标改造

将其改成三段式产物：

1. 继续生成 `chunks.jsonl`
2. 可选继续生成 `manifest.json`
3. 新增写入 `Chroma`

建议新增参数：

- `--with-chroma`
- `--reset-chroma`
- `--collection-name`
- `--persist-dir`

### 8.3 推荐执行流程

1. 扫描文档
2. 解析文本
3. 切块
4. 写 `chunks.jsonl`
5. 若启用 `--with-chroma`
   - 初始化 `ChromaVectorStoreService`
   - 如指定 `--reset-chroma`，先清空 collection
   - 批量写入 chunk 文本与 metadata
6. 写 `manifest.json`

### 8.4 批量写入策略

建议按批写入，比如每批 `50` 或 `100` 个 chunk：

- 避免一次性塞太多导致内存抖动
- 便于打印进度日志
- 失败时更容易定位哪批数据崩了

## 9. 在线检索改造方案

## 9.1 `VectorRetriever` 改造原则

[`backend/app/services/retrievers/vector_retriever.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\retrievers\vector_retriever.py) 改造后应：

- 不再直接读取 `embeddings.jsonl` 作为主检索源
- 优先通过 `Chroma` 做向量召回
- 保留 query expansion 和业务加权逻辑
- 保留 citation 输出结构，别把上层接口搞炸

### 9.2 推荐实现方式

在线检索分两段：

1. 先通过 `Chroma` 拿到 top-k 文档 chunk
2. 再在本地做二次重排

二次重排建议继续保留当前逻辑中的这些因素：

- query term overlap
- `line_type` 匹配
- `sequence` 匹配
- `positive_terms` 加权
- `negative_terms` 惩罚

原因很简单：

- 单纯靠 embedding 相似度，不一定懂你这些工业场景意图
- 当前项目已经有一些有价值的业务规则，不该一刀砍了

### 9.3 命中结果结构

返回 hit 时继续带上这些字段：

- `document_id`
- `chunk_id`
- `title`
- `page`
- `section`
- `source_file`
- `similarity_score`
- `rank_score`
- `text_preview`

citation metadata 保持兼容：

- `retriever = vector`
- `document_id`
- `chunk_id`
- `source_file`
- `title`
- `page`
- `section`

## 10. LLM 回答串联方案

这块别乱改，现有结构已经够用。

保留现有链路：

1. `KnowledgeQAService.ask()`
2. 并行执行 `graph / keyword / vector`
3. `QAFusionService` 合并 citation
4. `QAAnswerService` 构造回答
5. 若启用 LangChain，则 [`backend/app/services/langchain_service.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\langchain_service.py) 生成 grounded answer

### 10.1 为什么不直接上 `RetrievalQA`

因为你这项目不是纯文档问答，它是混合链路：

- 有图谱检索
- 有关键词检索
- 有向量检索
- 有自己的路由和融合

如果直接拿 LangChain 的一体化 `RetrievalQA` 套进去，反而容易把：

- debug 信息
- citation 分组
- 融合策略
- 图谱上下文

全弄成黑盒。那不是高级，是脑子省掉了。

正确做法是：

- 用 LangChain 管 embedding、vector store、LLM
- 业务编排仍留在项目自己的 service 层

## 11. 依赖与安装

后端建议补这些包：

```text
langchain-chroma
chromadb
```

如果继续使用 OpenAI embedding，还需要：

```text
langchain-openai
```

如果继续使用本地 Hugging Face embedding，则保留：

```text
sentence-transformers
```

建议原则：

- 向量库层用 `Chroma`
- embedding 层继续复用当前 `EmbeddingService`
- 不要在一版实施里同时乱切 embedding provider，不然问题一多你都不知道谁在作妖

## 12. 分阶段实施计划

### Phase 1：底座接入

- 新增 `chroma_vector_store_service.py`
- 增加配置项
- 在本地验证 `Chroma` 持久化目录可生成

验收：

- 能初始化 collection
- 能写入至少一批 chunk
- 重启进程后仍可读到数据

### Phase 2：离线构建接线

- 改造 `build_knowledge_qa_index.py`
- 支持 `--with-chroma`
- 支持 `--reset-chroma`

验收：

- 能从 `docs/知识图谱/downloads` 构建 chunk
- 能写入 `Chroma`
- `manifest.json` 记录 `vector_store_provider = chroma`

### Phase 3：在线检索切换

- 改造 `VectorRetriever`
- 切到 `Chroma` 检索
- 保留二次业务排序

验收：

- `VectorRetriever` 不再依赖 `embeddings.jsonl` 主路径
- 真实查询能返回 citation
- 不出现明显性能回退

### Phase 4：回归评估

- 运行 [`backend/app/scripts/evaluate_knowledge_qa.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\scripts\evaluate_knowledge_qa.py)
- 对比 `SPI设备手册`、`AOI误报`、`placement_offset` 等 case
- 更新进度文档

验收：

- `vector` 至少不弱于当前基线
- `SPI设备手册` 的 Top1 稳定性有所改善
- 图谱问答链路不被误伤

## 13. 风险与对策

### 13.1 风险：embedding 模型与语料语言不匹配

当前文档里英文资料很多，中文问题不少。这个问题之前已经吃过亏。

对策：

- 保留 `QueryExpansion`
- 保留英文扩展词和意图词加权
- 不在切 Chroma 的同时更换 embedding 模型

### 13.2 风险：Chroma 检索结果“语义像，但业务不对”

这是向量库常见毛病，别把它当神仙。

对策：

- 保留 metadata filter
- 保留 query expansion
- 保留二次业务重排

### 13.3 风险：collection 脏数据污染测试结果

如果多次构建不清空 collection，很容易混入旧 chunk。

对策：

- 离线脚本支持 `--reset-chroma`
- `manifest.json` 记录本次构建范围和文档数

### 13.4 风险：把关键词检索和向量检索搅成一锅粥

别犯这个毛病。

对策：

- `KeywordRetriever` 仍以 `chunks.jsonl` 为主
- `VectorRetriever` 主走 `Chroma`
- 两条链各自独立，最后再 fusion

## 14. 测试方案

建议补充测试：

- `backend/tests/services/test_chroma_vector_store_service.py`
- 更新 `backend/tests/services/test_vector_retriever.py`
- 更新 `backend/tests/services/test_knowledge_qa_service.py`

至少覆盖以下场景：

1. chunk 写入和读回正常
2. metadata 正确持久化
3. similarity_search 能返回预期文档
4. `line_type` 过滤有效
5. `VectorRetriever` 结果结构兼容现有响应
6. `KnowledgeQAService` 在 `vector` 模式下能正常返回

## 15. 推荐落地顺序

建议严格按这个顺序来：

1. 新增 `Chroma` 服务层
2. 改离线构建脚本
3. 跑一版小样本索引
4. 改 `VectorRetriever`
5. 跑回归脚本
6. 再决定要不要废弃 `embeddings.jsonl`

别一上来就全改。那种“一口气重构完再测”的玩法，通常最后测出来一地鸡毛。

## 16. 验收标准

满足以下条件，才算这次 `Chroma` 方案落地成功：

- 文档 chunk 能写入 `Chroma` 持久化目录
- 重启服务后仍可检索
- `VectorRetriever` 已切到 `Chroma`
- `KnowledgeQAService` 无需大改即可正常串联
- 回答中仍能输出真实 citation
- `evaluate_knowledge_qa.py` 结果不弱于当前基线

## 17. 下一步建议

如果按当前优先级推进，下一步最合理的是：

1. 新增 `backend/app/services/chroma_vector_store_service.py`
2. 改 `build_knowledge_qa_index.py` 支持写入 `Chroma`
3. 用 `SPI设备手册`、`SMT Troubleshooting Guide` 这几份文档先做小规模验证

先拿小范围样本打穿，再全量重建索引。别上来就把 60 多份文档一锅炖进去，炖糊了你还得自己舔锅。
