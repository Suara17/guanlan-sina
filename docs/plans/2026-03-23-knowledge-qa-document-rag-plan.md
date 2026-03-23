# knowledge-qa 文档接入与 RAG 落地方案

日期：2026-03-23  
分支：`knowledge-qa`  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 1. 背景

当前 `knowledge-qa` 已完成图谱问答主链路，后端具备：

- `GraphRetriever`：基于 Neo4j 结构化事实检索
- `KeywordRetriever`：首版关键词召回
- `VectorRetriever`：首版语义召回
- `KnowledgeQAService`：统一路由、并行执行、融合与回答生成

但目前文档侧检索仍是“占位版”：

- [`backend/app/services/retrievers/keyword_retriever.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\retrievers\keyword_retriever.py)
- [`backend/app/services/retrievers/vector_retriever.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\retrievers\vector_retriever.py)

这两个 retriever 现在实际仍在复用 `neo4j_service.get_all_anomalies()` 的结构化异常文本，并未接入真实非结构化语料。说难听点，这叫“图谱文本二次召回”，还不是完整的文档 RAG。

本方案目标就是把文档侧链路补实：

1. 接入真实 PDF/TXT 语料
2. 建立统一 chunk 数据结构
3. 建立离线关键词索引与向量索引
4. 改造 `KeywordRetriever` / `VectorRetriever`
5. 让问答返回真实文档引用，而不是拿结构化异常文本冒充文档片段

## 2. 目标与非目标

### 2.1 目标

- 支持从 `docs/知识图谱/downloads` 和相关文本资料中抽取非结构化文档内容
- 支持离线切块、元数据标注、embedding 构建
- 支持基于 chunk 的关键词检索与向量检索
- 支持在回答中返回文档名、页码、chunk 标识等引用信息
- 保持现有 `graph + document + fusion + answer` 总体架构不推倒重来

### 2.2 非目标

- 本阶段不引入复杂外部向量数据库服务
- 本阶段不做在线实时增量索引构建
- 本阶段不做多轮对话记忆
- 本阶段不做文档 OCR 增强流水线
- 本阶段不做大而全的知识库平台，先把当前分支的 RAG 路打通

## 3. 语料范围

首批语料建议仅纳入与 SMT / PCB / AOI / SPI / 回流焊 / 点检 / 缺陷分析直接相关的资料，优先从以下目录选择：

- [`docs/知识图谱/downloads`](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\知识图谱\downloads)
- [`docs/知识图谱/PCB_SMT缺陷检测资料汇总.txt`](E:\Guanlan-Sina\.worktrees\knowledge-qa\docs\知识图谱\PCB_SMT缺陷检测资料汇总.txt)

建议首批先控制在 10 到 20 份文档，别上来把下载目录全吞了。文档越杂，切块和召回越容易拉胯。

### 3.1 首批建议纳入

- SMT troubleshooting guide
- SPI inspection guide
- solder defects / voiding / reflow profiling 相关文档
- 设备用户手册中的故障排查、工艺控制、点检章节

### 3.2 首批建议排除

- 纯宣传 brochure
- 与当前业务问答关系很弱的学术论文
- 大量重复版本的同一文档
- 只有图片、几乎无文本层的扫描 PDF

## 4. 总体架构

数据流分四段：

1. 文档离线预处理
2. chunk 与索引产物生成
3. 在线检索
4. 问答融合与回答生成

### 4.1 离线阶段

输入：

- PDF / TXT / Markdown 文档

输出：

- `chunks.jsonl`
- `embeddings.jsonl`
- 可选 `manifest.json`

### 4.2 在线阶段

- `KeywordRetriever` 读取 chunk 文本索引
- `VectorRetriever` 读取 embedding 索引
- `KnowledgeQAService` 继续统一编排
- `QAAnswerService` / `LangChainService` 继续消费 citation，不需要重写主框架

## 5. 数据结构设计

## 5.1 文档元数据 `DocumentRecord`

建议字段：

```json
{
  "document_id": "smt_troubleshooting_guide_alpha",
  "source_file": "docs/知识图谱/downloads/04 [SMT排故] SMT Troubleshooting Guide 2017 (Alpha).pdf",
  "file_type": "pdf",
  "title": "SMT Troubleshooting Guide 2017",
  "domain": "SMT",
  "language": "en",
  "version": null,
  "tags": ["smt", "troubleshooting", "defect"],
  "page_count": 48
}
```

## 5.2 切块记录 `ChunkRecord`

建议字段：

```json
{
  "document_id": "smt_troubleshooting_guide_alpha",
  "chunk_id": "smt_troubleshooting_guide_alpha:p12:c03",
  "source_file": "docs/知识图谱/downloads/04 [SMT排故] SMT Troubleshooting Guide 2017 (Alpha).pdf",
  "title": "SMT Troubleshooting Guide 2017",
  "page": 12,
  "section": "Bridging Defects",
  "chunk_index": 3,
  "text": "Bridging defects are commonly caused by ...",
  "text_preview": "Bridging defects are commonly caused by ...",
  "tokens_estimate": 180,
  "tags": ["smt", "bridging", "defect"],
  "keywords": ["bridging", "solder", "paste", "stencil"],
  "line_types": ["SMT"],
  "embedding_model": null
}
```

## 5.3 向量记录 `EmbeddingRecord`

建议字段：

```json
{
  "chunk_id": "smt_troubleshooting_guide_alpha:p12:c03",
  "document_id": "smt_troubleshooting_guide_alpha",
  "embedding_model": "text-embedding-3-small",
  "vector": [0.0123, -0.0288, 0.1931]
}
```

## 5.4 在线引用 metadata

回答返回的 citation metadata 至少应包含：

- `retriever`
- `document_id`
- `chunk_id`
- `source_file`
- `title`
- `page`
- `section`
- `matched_terms` 或 `similarity_score`

## 6. 索引产物与目录规划

建议新增目录：

```text
backend/app/data/knowledge_qa/
├── manifest.json
├── chunks.jsonl
├── embeddings.jsonl
└── .gitkeep
```

说明：

- `manifest.json`：记录构建时间、文档数、chunk 数、embedding 模型
- `chunks.jsonl`：关键词检索主输入
- `embeddings.jsonl`：向量检索主输入

首版用本地文件索引，不上 FAISS / Chroma / pgvector。不是说那些不能用，而是当前最缺的是把数据链路跑通，不是给自己加运维负担。

## 7. 文档解析方案

## 7.1 支持格式

首版支持：

- `.pdf`
- `.txt`
- `.md`

暂不支持：

- `.docx`
- 扫描图片 OCR PDF
- Excel 作为文档语料

### 7.2 解析策略

- PDF：优先 `pypdf`
- TXT/MD：直接读取
- 清洗步骤：
  - 去掉连续空行
  - 去掉明显页眉页脚噪声
  - 合并断裂行
  - 保留页码边界

### 7.3 页面粒度

PDF 解析后先保留页级文本，再在页内切 chunk。不要一上来把整本书糊成一个字符串，后面引用页码都找不着北。

## 8. 切块策略

## 8.1 原则

- 标题/段落优先
- 超长文本再按字符窗口切分
- 适度 overlap，避免上下文断裂
- chunk 尽量保持语义完整

## 8.2 首版规则

建议参数：

- `target_chars = 700`
- `max_chars = 1000`
- `overlap_chars = 120`

建议流程：

1. 先按标题、空行、列表分段
2. 对长度小于 `target_chars` 的自然段直接保留
3. 对超长段按窗口切分
4. 每个 chunk 保留：
   - 所属页码
   - section 标题
   - chunk 序号

### 8.3 切块质量约束

- 不允许生成大量几十个字的碎块
- 不允许把表格残片切成毫无意义的噪声
- 若页文本极短，可按页合并邻近段落

## 9. embedding 与向量化策略

## 9.1 首版模型

优先复用当前配置：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `EMBEDDING_MODEL`

对应代码位置：

- [`backend/app/core/config.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\core\config.py)

## 9.2 降级策略

- 若未配置 `OPENAI_API_KEY`，允许只构建 `chunks.jsonl`
- 无 embedding 时：
  - `KeywordRetriever` 可正常工作
  - `VectorRetriever` 返回“未启用”或空结果

别犯傻把向量检索硬绑成必需链路，不然本地环境一没 key 整个文档问答就趴窝。

## 9.3 相似度计算

首版直接内存计算 cosine similarity：

- 加载 `embeddings.jsonl`
- 对 query embedding 与 chunk vector 做点积
- 取 top_k

后续若 chunk 规模扩大，再评估：

- FAISS
- Chroma
- pgvector

## 10. 后端改造设计

## 10.1 新增模块建议

建议新增：

- `backend/app/services/document_index_service.py`
- `backend/app/services/document_chunker.py`
- `backend/app/scripts/build_knowledge_qa_index.py`

职责建议：

- `document_chunker.py`
  - 文本清洗
  - 切块
  - chunk 数据构造
- `document_index_service.py`
  - 加载 `chunks.jsonl`
  - 加载 `embeddings.jsonl`
  - 提供关键词检索与向量检索基础方法
- `build_knowledge_qa_index.py`
  - 扫描文档目录
  - 解析文档
  - 生成 chunk
  - 生成 embedding
  - 写入索引文件

## 10.2 `KeywordRetriever` 改造

当前问题：

- 依赖 `neo4j_service.get_all_anomalies()`
- 检索对象不是文档 chunk

改造后：

- 改依赖 `DocumentIndexService`
- 直接对 chunk 文本做关键词匹配
- score 由以下因子组成：
  - query term 命中数
  - 标题命中加权
  - 标签命中加权
  - section 命中加权

返回 hit 示例：

```json
{
  "document_id": "smt_troubleshooting_guide_alpha",
  "chunk_id": "smt_troubleshooting_guide_alpha:p12:c03",
  "title": "SMT Troubleshooting Guide 2017",
  "page": 12,
  "section": "Bridging Defects",
  "matched_terms": ["bridging", "solder"],
  "match_score": 8.5,
  "rank_score": 8.5
}
```

## 10.3 `VectorRetriever` 改造

当前问题：

- 实际语料来自结构化异常文本
- fallback embedding 只是占位逻辑

改造后：

- query 先做 embedding
- 从 `embeddings.jsonl` 计算相似度召回
- 支持按 `line_type` / tags 做轻量过滤
- citation 指向真实文档 chunk

返回 hit 示例：

```json
{
  "document_id": "smt_troubleshooting_guide_alpha",
  "chunk_id": "smt_troubleshooting_guide_alpha:p12:c03",
  "title": "SMT Troubleshooting Guide 2017",
  "page": 12,
  "section": "Bridging Defects",
  "similarity_score": 0.87,
  "rank_score": 0.87
}
```

## 10.4 `KnowledgeQAService` 改造边界

该服务不需要大改，只需要：

- 接收新的 document hits / citations
- 保持现有并行执行逻辑
- 保持现有 timeout / failure isolation
- 保持现有 fusion / answer 流程

换句话说，这层现在结构还行，别手痒又去大拆。问题主要不在 orchestration，在文档底座没接上。

## 10.5 `QAFusionService` 预期影响

基本无需重构，只需确认：

- 文档 citation metadata 新增 `document_id/page/chunk_id`
- 排序权重仍适用于新文档结果
- 去重键从“sequence 优先”扩展为“chunk_id 优先”

## 11. 离线脚本设计

建议新增脚本：

- [`backend/app/scripts/build_knowledge_qa_index.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\scripts\build_knowledge_qa_index.py)

### 11.1 输入参数建议

- `--source-dir`
- `--output-dir`
- `--include-pattern`
- `--limit`
- `--with-embeddings`

### 11.2 执行流程

1. 扫描文档
2. 解析文本
3. 提取 title / tags / page
4. 切块
5. 写入 `chunks.jsonl`
6. 若启用 embedding：
   - 调 embedding 模型
   - 写入 `embeddings.jsonl`
7. 输出 manifest

### 11.3 示例命令

```bash
cd backend
uv run python app/scripts/build_knowledge_qa_index.py \
  --source-dir "../docs/知识图谱/downloads" \
  --output-dir "app/data/knowledge_qa" \
  --limit 12 \
  --with-embeddings
```

Windows 环境可后续补一版适配命令说明。

## 12. 测试设计

## 12.1 单元测试

建议新增：

- `backend/tests/services/test_document_chunker.py`
- `backend/tests/services/test_document_index_service.py`

建议调整：

- `backend/tests/services/test_keyword_retriever.py`
- `backend/tests/services/test_vector_retriever.py`
- `backend/tests/services/test_knowledge_qa_service.py`

## 12.2 测试范围

- 文本清洗是否稳定
- 长文切块是否符合阈值
- chunk 是否保留页码与标题
- 关键词检索是否能命中预期 chunk
- 向量检索是否能命中预期 chunk
- `KnowledgeQAService` 是否能返回真实文档 citation

## 12.3 手工回归

至少覆盖三类问题：

1. 图谱问题
   - 例如：`SMT 异常 3 的原因是什么`
   - 预期：图谱命中为主

2. 文档问题
   - 例如：`虚焊在 SOP 或排故手册里通常怎么处理`
   - 预期：文档 chunk 命中为主

3. 混合问题
   - 例如：`SMT 异常 3 按手册建议应该怎么排查`
   - 预期：图谱与文档同时命中

## 13. 分阶段实施计划

### Phase 1：文档底座

- 明确首批文档清单
- 实现解析与切块
- 产出 `chunks.jsonl`

### Phase 2：向量底座

- 实现 embedding 构建
- 产出 `embeddings.jsonl`
- 支持本地相似度计算

### Phase 3：检索接线

- 改造 `KeywordRetriever`
- 改造 `VectorRetriever`
- 调整 `QAFusionService` 去重键

### Phase 4：回归与文档收口

- 补单测
- 做手工回归
- 更新 progress 文档

## 14. 当前建议的第一步

当前最合理的第一步不是直接改 `KnowledgeQAService`，而是先做下面两件事：

1. 新增 `document_chunker.py`
2. 新增 `build_knowledge_qa_index.py`

原因很简单：

- 没有 chunk 产物，`KeywordRetriever` 无从改起
- 没有 embedding 产物，`VectorRetriever` 只能继续假装自己是文档检索

## 15. 风险与兜底

### 15.1 文本质量风险

- 部分 PDF 可能文本层很差
- 页眉页脚污染可能严重
- 同一文档多版本重复可能影响召回

兜底：

- 首批文档人工挑选
- 对低质量文档先排除

### 15.2 embedding 成本风险

- 文档一多，向量化成本会上去

兜底：

- 首版只处理有限文档
- 支持 `--limit`
- 支持只构建关键词索引

### 15.3 结果排序风险

- 文档 chunk 召回后，排序未必立刻靠谱

兜底：

- 先保留图谱优先
- 文档侧先以“补充依据”角色接入
- 后续再调 `QAFusionService` 权重

## 16. 验收标准

- 可从真实 PDF/TXT 生成 `chunks.jsonl`
- 可选生成 `embeddings.jsonl`
- `KeywordRetriever` 不再依赖 `neo4j_service.get_all_anomalies()`
- `VectorRetriever` 不再依赖结构化异常文本作为伪文档语料
- 问答响应中的文档 citation 含真实文档元数据
- 至少完成一轮图谱问题 / 文档问题 / 混合问题回归

## 17. 下一步实施建议

按下面顺序推进：

1. 实现 `document_chunker.py`
2. 实现 `build_knowledge_qa_index.py`
3. 先改 `KeywordRetriever`
4. 再改 `VectorRetriever`
5. 补测试与 progress 文档

别一上来就想把向量库、重排模型、复杂元数据过滤全干了。那不是一步到位，那叫一步摔死。
