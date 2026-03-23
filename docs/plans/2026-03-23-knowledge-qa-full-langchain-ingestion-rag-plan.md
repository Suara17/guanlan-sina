# knowledge-qa 全 LangChain ingestion / RAG 改造清单

日期：2026-03-23  
分支：`knowledge-qa`  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 1. 目标前提

本方案基于以下固定前提，不再来回摇摆：

- 文档向量化模型使用本地 `jinaai/jina-embeddings-v2-small-en`
- 向量库继续使用 `Chroma`
- 生成模型使用 OpenAI 兼容接口
- 生成模型通过自定义 `base_url + api_key + model` 接入
- 继续保留当前 `graph + keyword + vector + fusion + answer` 的主编排，不推倒重写

别把这事说成“把文档存进嵌入模型里”。正确链路是：

1. 文档加载
2. 文档切块
3. embedding 生成
4. 写入 `Chroma`
5. 检索召回
6. RAG chain 组织上下文
7. LLM 结构化输出
8. 业务层组装最终回答

## 2. 当前已具备的基础

当前分支已经具备以下能力：

- `DocumentChunker` 已存在，并且可以优先使用 LangChain splitter  
  见 [`backend/app/services/document_chunker.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\document_chunker.py)
- `build_knowledge_qa_index.py` 已支持离线切块和写入 `Chroma`  
  见 [`backend/app/scripts/build_knowledge_qa_index.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\scripts\build_knowledge_qa_index.py)
- `ChromaVectorStoreService` 已支持 `upsert_chunks / similarity_search / get_retriever`  
  见 [`backend/app/services/chroma_vector_store_service.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\chroma_vector_store_service.py)
- `VectorRetriever` 已能从 `Chroma` 取结果，并导出 LangChain retriever  
  见 [`backend/app/services/retrievers/vector_retriever.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\retrievers\vector_retriever.py)
- `LangChainService` 已能跑一条 document RAG chain，并输出结构化答案  
  见 [`backend/app/services/langchain_service.py`](E:\Guanlan-Sina\.worktrees\knowledge-qa\backend\app\services\langchain_service.py)

换句话说，现在不是“能不能做”，而是“怎么把半套方案收成一套完整工程链路”。

## 3. 还要补齐的改造项

## 3.1 Ingestion 全 LangChain 化

当前切块虽然用了 LangChain splitter，但 ingestion 还没有彻底统一成 LangChain `Document` 流。

需要补：

1. 新增统一的文档加载层
2. 将 PDF / TXT / MD 统一转成 LangChain `Document`
3. 统一 metadata 字段
4. 再交给 `DocumentChunker` 或直接交给标准 splitter

建议新增服务：

- `backend/app/services/langchain_document_ingestion_service.py`

建议职责：

- 根据文件类型选择 loader
- 输出统一的 `Document` 列表
- 归一化 metadata
- 对低质量文本进行基础清洗

建议统一 metadata 字段：

- `document_id`
- `source_file`
- `title`
- `page`
- `section`
- `file_type`
- `line_types`
- `keywords`
- `language`
- `document_hash`
- `ingestion_version`

注意：

- metadata 现在必须收口，别今天叫 `source`，明天叫 `source_file`，后天又冒出个 `path`
- 不统一字段，后面 filter、citation、回归全得一起烂

## 3.2 Loader 体系补齐

建议按格式拆分：

1. PDF
2. TXT
3. Markdown

优先级：

- PDF：最高
- TXT / MD：顺手接上

建议用法：

- PDF：LangChain loader + 项目内页级清洗逻辑
- TXT / MD：简单 loader + metadata 补全

注意：

- 当前工业文档很多是“有文本层但很脏”，不能迷信 loader 一把梭
- 页眉页脚、版权页、目录页噪声，最好加一层项目自己的清洗规则

## 3.3 Chunking 策略工程化

当前 `DocumentChunker` 能用，但还应该补工程配置，而不是靠代码里写死。

建议补配置项：

```python
CHUNK_TARGET_CHARS=700
CHUNK_MAX_CHARS=1000
CHUNK_OVERLAP_CHARS=120
CHUNK_MIN_CHARS=120
CHUNK_STRATEGY="langchain_recursive"
```

建议增强点：

1. 标题优先切块
2. 页面边界保留
3. 表格型文本避免切成碎屑
4. 小 chunk 自动合并
5. 针对英文手册章节名保留 `section hint`

额外建议：

- 后续可补一个 `header-aware chunking`，对 `Setup Check`、`Troubleshooting`、`Corrective Action` 这类章节标题加权

## 3.4 Embedding 配置彻底拆分

这是必须补的，不是建议项。

你现在生成模型要走 OpenAI 兼容 URL/KEY，而 embedding 用本地 Jina。那就别再继续复用一套 OpenAI 配置了，容易把自己绕死。

建议新增配置：

```python
EMBEDDING_PROVIDER="huggingface_local"
EMBEDDING_MODEL="jinaai/jina-embeddings-v2-small-en"
EMBEDDING_DEVICE="cpu"
EMBEDDING_LOCAL_CACHE_DIR=""

LLM_PROVIDER="openai"
LLM_MODEL="gpt-4o-mini"
LLM_API_KEY=""
LLM_BASE_URL=""
```

同时兼容保留旧字段一段时间，但业务代码应逐步切到：

- `LLM_API_KEY`
- `LLM_BASE_URL`

而不是继续硬绑：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`

原因很简单：

- 你的 LLM 和 embedding 已经不是同一路供应方式
- 再绑一起，后面排错会像拆炸弹

## 3.5 Chroma 写入链路进一步标准化

当前 `build_knowledge_qa_index.py` 已能把 chunk 写入 `Chroma`，但还需要补：

1. 文档哈希
2. 增量更新
3. 删除失效文档
4. collection 版本标记
5. manifest 对账信息

建议 `manifest.json` 至少补这些字段：

- `vector_store_provider`
- `collection_name`
- `persist_dir`
- `embedding_provider`
- `embedding_model`
- `llm_provider`
- `ingestion_version`
- `document_count`
- `chunk_count`
- `document_hashes`
- `build_started_at`
- `build_finished_at`

如果不补这些，后面出了“为什么今天检索和昨天不一样”，你连比对依据都没有，纯靠猜。

## 3.6 Retriever 层增强

当前 `similarity_search` 能用，但还不够。

建议增强顺序：

1. 先补 metadata filter
2. 再补 MMR
3. 再补多查询扩展
4. 最后再考虑 reranker

建议支持的 filter：

- `line_type_primary`
- `document_id`
- `file_type`
- `section`
- `language`

建议增强的检索能力：

1. `search_type="similarity"`
2. `search_type="mmr"`
3. `top_k` 与 `fetch_k` 分离
4. 可选多 query expansion

说明：

- 工业手册不是通用百科，很多时候“章节对”比“语义像”更重要
- 单纯 embedding 相似度很容易把你带沟里去

## 3.7 RAG Chain 收口

当前已经有 document RAG chain，但还需要进一步收口成可配置、可复用的独立服务。

建议新增或拆分：

- `backend/app/services/langchain_rag_service.py`

职责建议：

1. 负责 document-only RAG
2. 负责 hybrid context RAG
3. 负责 structured output 解析
4. 负责 prompt 模板选择

建议拆成两条 chain：

1. `document_rag_chain`
2. `hybrid_grounded_chain`

说明：

- `document_rag_chain`：只吃 retriever 返回的文档
- `hybrid_grounded_chain`：吃 graph citations + keyword citations + vector citations

别把所有情况都塞进一个 prompt，最后 prompt 长得像违章建筑，模型也烦，你也烦。

## 3.8 Structured Output 继续加强

当前 `QAStructuredAnswer` 已有：

- `conclusion`
- `evidence`
- `suggestions`
- `risks`

建议下一步扩展为：

```python
class QAStructuredAnswer(BaseModel):
    conclusion: list[str]
    evidence: list[str]
    suggestions: list[str]
    risks: list[str]
    confidence: float | None = None
    missing_information: list[str] = []
    used_sources: list[str] = []
```

原因：

- 你既然想让 LLM 参与“决策输出”，就别只让它吐四段话
- 结构里不带 `confidence / missing_information`，后端无法做风险提示和 UI 展示

## 3.9 QAAnswerService 进一步瘦身

当前 `QAAnswerService` 已经负责把结构化答案转为最终文本，这是对的。

后续建议继续明确边界：

- `LangChainService / LangChainRAGService` 只产出结构化数据
- `QAAnswerService` 只组装人类可读文本
- `KnowledgeQAService` 只做编排

别让一个 service 既管检索、又管 prompt、又管渲染，那不叫灵活，那叫乱套。

## 3.10 评估体系补齐

这是高优先级，不补这个，后面所有“优化”都可能是自我感动。

至少补四类评估：

1. chunk 质量评估
2. retrieval Top-k 评估
3. answer groundedness 评估
4. citation 准确性评估

建议评估维度：

- Top1 / Top3 命中率
- 不同问题类型召回率
- 引用是否来自正确 chunk
- 结构化答案字段完整率
- `risk` 是否正确暴露“未命中 / 信息不足”

## 3.11 可观测性与调试信息

建议补记录：

- chunking 耗时
- embedding 耗时
- Chroma 写入耗时
- query embedding 耗时
- retrieval 耗时
- LLM 耗时
- 选中的 chunk_id 列表
- 使用的 collection / embedding model / llm model

最好最后能在 debug 里看到：

```json
{
  "retriever": "vector",
  "collection_name": "knowledge_qa_chunks",
  "embedding_model": "jinaai/jina-embeddings-v2-small-en",
  "llm_model": "xxx-openai-compatible-model",
  "selected_chunk_ids": ["doc1:p12:c01", "doc1:p12:c02"]
}
```

这玩意看起来啰嗦，但真出问题时比你在日志里骂街有用多了。

## 4. OpenAI 兼容 LLM 接入要求

你的目标是：

- embedding 本地跑
- LLM 走 OpenAI 兼容接口

建议配置收口如下：

```env
LANGCHAIN_ENABLED=true

LLM_PROVIDER=openai
LLM_MODEL=your-chat-model
LLM_API_KEY=your-key
LLM_BASE_URL=https://your-openai-compatible-endpoint/v1

EMBEDDING_PROVIDER=huggingface_local
EMBEDDING_MODEL=jinaai/jina-embeddings-v2-small-en
EMBEDDING_DEVICE=cpu

VECTOR_STORE_PROVIDER=chroma
CHROMA_COLLECTION_NAME=knowledge_qa_chunks
CHROMA_PERSIST_DIR=C:\\Users\\forzr\\.codex\\memories\\knowledge-qa-chroma
CHROMA_TOP_K=5
```

代码改造要求：

1. `LangChainService` 读取 `LLM_API_KEY / LLM_BASE_URL`
2. `ChromaVectorStoreService` 继续读取本地 embedding 配置
3. 不让 embedding 配置和 LLM 配置互相污染

## 5. 分阶段实施清单

## Phase 1：配置与边界收口

1. 拆分 LLM 与 embedding 配置
2. 保持旧配置短期兼容
3. 更新 `config.py`
4. 更新 `.env.example` 或本地说明文档

验收标准：

- OpenAI 兼容 LLM 能独立配置
- 本地 Jina embedding 不受影响

## Phase 2：统一 LangChain ingestion

1. 新增 `langchain_document_ingestion_service.py`
2. 接通 PDF / TXT / MD loader
3. 统一 metadata
4. 接通 `DocumentChunker`

验收标准：

- 任意一份文档都能输出规范化 `Document` 和 chunk
- `source/page/section/document_id` 不丢

## Phase 3：索引构建增强

1. 改造 `build_knowledge_qa_index.py`
2. 增加 document hash
3. manifest 补版本和构建信息
4. 为增量写入留口

验收标准：

- 全量构建可跑
- manifest 信息完整
- 为增量更新预留结构

## Phase 4：检索增强

1. `ChromaVectorStoreService` 支持更丰富 filter
2. `VectorRetriever` 支持 MMR / fetch_k
3. 保留业务二次重排

验收标准：

- `SPI设备手册` 类问题 Top1 稳定
- 结果能按 `line_type` 等维度过滤

## Phase 5：RAG chain 收口

1. 抽出独立 `LangChainRAGService`
2. 分 document 与 hybrid 两条 chain
3. 统一 structured output

验收标准：

- document route 走纯 document chain
- hybrid route 走统一 grounded chain
- 输出结构稳定

## Phase 6：评估与回归

1. 补 retrieval 与 answer 评估
2. 加回归 case
3. 更新进度文档

验收标准：

- 结构化答案质量可量化
- 回归 case 可重复验证

## 6. 建议的实际执行顺序

严格按下面顺序干，别整成撒胡椒面：

1. 拆分 `LLM_*` 与 `EMBEDDING_*` 配置
2. 统一 LangChain ingestion
3. 增强 `build_knowledge_qa_index.py`
4. 增强 `ChromaVectorStoreService`
5. 抽出 `LangChainRAGService`
6. 补评估与调试信息

## 7. 当前最优先的下一步

如果按投入产出比排序，下一步最该先做的是：

1. 拆分 `LLM_BASE_URL / LLM_API_KEY` 配置
2. 新增统一 ingestion 服务，把 loader + metadata + chunking 收口

原因：

- 这是把“能跑”变成“可维护”的分水岭
- 不先做这两步，后面 Chroma、RAG、structured output 继续堆，也还是半截工程

## 8. 验收标准

满足以下条件，才能算“全 LangChain ingestion / RAG”真正落地：

- 文档加载、切块、向量写入都走统一服务链路
- embedding 固定使用本地 `jinaai/jina-embeddings-v2-small-en`
- LLM 能通过 OpenAI 兼容 `base_url + api_key` 独立配置
- `Chroma` 可稳定持久化和检索
- document route 与 hybrid route 都有清晰的 chain 边界
- 输出为稳定结构化结果，而不是自由发挥文本
- 回归测试和评估脚本能反映真实效果

一句话总结：

现在这项目已经不是缺“有没有 LangChain”，而是缺“把 LangChain 真正收成一条工程链”。前者是 demo，后者才是能长期养的系统。
