# 知识图谱 + 文档问答 任务进度

日期：2026-03-22  
分支：`knowledge-qa`  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 总览
- 目标：实现方案 B（Neo4j 图谱问答 + LangChain LLM + 后续 RAG 扩展）
- 状态：后端已切换到 LangChain 路线，统一问答 API 已打通 `graph + keyword + vector + fusion + grouped prompt` 主链路；文档 RAG 已接入真实 PDF 语料，已完成本地 embedding 索引与首轮回归，并开始切换到轻量多语言 embedding 模型；前端已接入真实 API

## 已完成
### Task 1：LangChain 配置与回答器
- ✅ 新增 LangChain 服务：
  - `backend/app/services/langchain_service.py`
- ✅ 新增 LangChain / LLM 配置字段：
  - `backend/app/core/config.py`
- ✅ 已将 `QAAnswerService` 改为：
  - 优先调用 LangChain 生成 grounded answer
  - 未配置或未安装依赖时退回模板回答

### 后端：统一知识问答主链路（首版）
- ✅ 新增问答数据契约：
  - `backend/app/services/knowledge_qa_models.py`
- ✅ 新增规则路由器：
  - `backend/app/services/qa_router.py`
- ✅ 新增回答摘要服务：
  - `backend/app/services/qa_answer_service.py`
- ✅ 新增问答编排服务：
  - `backend/app/services/knowledge_qa_service.py`
- ✅ 新增统一问答 API：
  - `backend/app/api/routes/knowledge_qa.py`
  - 已挂载到 `POST /api/v1/knowledge-qa/ask`
- ✅ 已补齐依赖注入与配置开关：
  - `backend/app/api/deps.py`
  - `backend/app/core/config.py`
  - `backend/app/api/main.py`
- ✅ 已补齐首轮后端测试文件：
  - `backend/tests/services/test_qa_router.py`
  - `backend/tests/services/test_knowledge_qa_service.py`
  - `backend/tests/services/test_langchain_service.py`
  - `backend/tests/api/routes/test_knowledge_qa.py`
- ✅ 已补强 graph-only 可上线模式：
  - 文档路由在非结构化检索未接入时自动退回图谱检索
  - 本地环境返回 `debug` 字段（requested route / executed modes / hit counts / timing）
  - 回答模板显式区分“当前仅基于图谱事实”与“暂无 SOP/手册引用”
- ✅ 已移除旧的外部知识库主链路依赖：
  - `backend/app/api/deps.py`
  - `backend/app/services/knowledge_qa_service.py`
  - 设计与计划文档已切换为 LangChain 路线
- ✅ 已完成 retriever 分层骨架重构：
  - 新增 `backend/app/services/retrievers/`
  - 已拆出 `GraphRetriever`
  - 已完成 `KeywordRetriever` 首版实现
  - 已完成 `VectorRetriever` 首版实现
  - `KnowledgeQAService` 已收敛为路由 + 执行计划 + 响应装配
- ✅ 已补充 retriever 分层测试：
  - `backend/tests/services/test_graph_retriever.py`
  - `backend/tests/services/test_keyword_retriever.py`
- ✅ 已补统一融合层：
  - 新增 `backend/app/services/qa_fusion_service.py`
  - 已支持图谱 / 关键词 / 向量结果去重、归一化排序和上下文裁剪
  - `KnowledgeQAService` 进一步收敛为执行编排器
- ✅ 已完成 `VectorRetriever` 首版：
  - 新增 `backend/tests/services/test_vector_retriever.py`
  - 已支持基于现有异常文本的轻量语义召回
  - 有 embedding 配置时可切到真实向量嵌入，未配置时自动退回本地近似向量
- ✅ 已将 fusion 结构化结果接入回答层：
  - `QAFusionService` 已输出 `graph / keyword / vector / document` 分组
  - `QAAnswerService` 模板回答已按分组展示文本补充
  - `LangChainService` 已接收分组上下文并写入 prompt
- ✅ 已补并行超时控制与失败隔离：
  - `KnowledgeQAService` 已支持三路检索并行执行
  - 已新增 per-retriever timeout / max workers 配置
  - 超时与异常会单独降级，不阻塞主链路返回
- ✅ 已补更严格的回答引用约束：
  - `LangChainService` 已要求固定输出结构：`结论 / 依据 / 建议 / 风险/备注`
  - `依据` 段需显式使用来源标签，如 `[G1]`、`[K1]`、`[V1]`
  - `QAAnswerService` 模板回答也已对齐来源标签输出
- ✅ 已完成文档 RAG 底座接入：
  - 新增 `backend/app/services/document_chunker.py`
  - 新增 `backend/app/services/document_index_service.py`
  - 新增 `backend/app/scripts/build_knowledge_qa_index.py`
  - 新增 `backend/app/services/embedding_service.py`
  - 已支持从 `docs/知识图谱/downloads` 扫描 PDF/TXT/MD 文档并生成 `chunks.jsonl / manifest.json / embeddings.jsonl`
- ✅ 已完成文档语料首轮清洗与筛选：
  - 已排除明显无关或高噪声文档名关键字，如 `arxiv / academic / taxonomy / datasheet / quick_reference / product_comparison`
  - 已增加 PDF 正文页过滤，跳过 `copyright / references / disclaimer / contents / about ...`
  - 当前索引产物为 `61` 份文档、`3007` 个 chunks
- ✅ 已将 `KeywordRetriever` 真正切到文档 chunk 语料：
  - 已改为依赖 `DocumentIndexService`
  - 已收紧弱相关命中，避免仅靠 `line_type` 蹭进结果
  - 已补充对应单测与服务层回归
- ✅ 已将 `VectorRetriever` 真正切到文档 chunk + embedding 语料：
  - 已支持读取 `embeddings.jsonl`
  - 已通过 `EmbeddingService` 统一接 OpenAI / Voyage / 本地 Hugging Face provider
  - 当前默认 provider 已切为本地 `huggingface_local`
  - 当前默认模型已切为 `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`（轻量多语言）
- ✅ 已完成 embedding 模型切换准备：
  - 已将默认本地 embedding 模型从中文专用 `BAAI/bge-small-zh-v1.5` 切到轻量多语言 `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
  - `build_knowledge_qa_index.py` 生成的 `manifest.json` 已补充 `embedding_provider / embedding_model`
  - 当前适配目标是“英文 PDF 语料 + 中文问题”的跨语言检索场景
- ✅ 已完成本地 BAAI embedding 索引构建：
  - 已解决 Hugging Face 缓存离线加载问题，绕开工作区内错误代理配置
  - 已成功生成 `backend/app/data/knowledge_qa/embeddings.jsonl`
  - 当前 `manifest.json` 状态为 `embeddings_enabled=true`
- ✅ 已补 document/vector 典型问题手工回归：
  - 新增 `backend/app/scripts/evaluate_knowledge_qa.py`
  - 已生成 `backend/app/data/knowledge_qa/evaluation_report.json`
  - 已补结果记录：`docs/plans/2026-03-23-knowledge-qa-regression-report.md`
  - 当前回归结论：
    - `keyword`：`4 pass / 0 partial / 1 fail`
    - `vector`：`3 pass / 0 partial / 2 fail`
    - `fusion`：`3 pass / 1 partial / 1 fail`
  - 当前明确短板：
    - `虚焊排故` 会被弱相关 `vector` 结果带偏
    - `贴片偏移/placement offset` 仍未形成稳定命中

### 前端：司南问答入口骨架（第一阶段）
- ✅ 已新增前端设计与拆解文档：
  - `docs/plans/2026-03-22-knowledge-graph-qa-implementation.md`
  - `docs/plans/2026-03-22-sinan-qa-entry-design.md`
  - `docs/plans/2026-03-22-sinan-qa-frontend-breakdown.md`
- ✅ 已完成全局问答入口状态管理：
  - `frontend/App.tsx`
  - 新增统一状态：`open/source/context/draftQuestion`
- ✅ 已完成悬浮司南首阶段页面策略接入：
  - 首阶段显示：`/app/`、`/app/sinan`、`/app/gewu`
  - 暂不显示悬浮入口：`/app/kernel`、`/app/huntian`、`/app/tianchou`、`/app/zhixing`
- ✅ 已完成轻量“问司南”按钮入口：
  - 页面：`/app/huntian`、`/app/tianchou`、`/app/zhixing`
  - 入口承载：`frontend/App.tsx`
  - 支持预置问题草稿并打开统一问答面板
- ✅ 已完成司南入口组件改造：
  - `frontend/components/SinanAvatar.tsx`
  - 支持 `onOpen`、`previewMessage`、`showBubble`、`disabled`
  - `mode` 扩展为 `idle | alert | qa`
- ✅ 已完成问答面板骨架重构：
  - `frontend/components/AiAssistant.tsx`
  - 已具备：
    - 面板开合
    - 输入框
    - 快捷问题
    - 上下文标签
    - 图谱/文档引用占位区
- ✅ 已接入真实知识问答 API：
  - `frontend/src/api/knowledgeQaApi.ts`
  - `frontend/components/AiAssistant.tsx`
  - 已支持：
    - 调用 `POST /api/v1/knowledge-qa/ask`
    - 展示回答内容
    - 展示图谱/文档引用
    - 展示 warnings / 降级提示
    - 根据页面上下文透传 `line_type` / `sequence`
- ✅ 已移除 Dashboard 页面内旧的局部悬浮司南入口，避免与全局入口重复：
  - `frontend/pages/Dashboard.tsx`
- ✅ 已完成引用来源分组与展开渲染：
  - `frontend/components/AiAssistant.tsx`
  - 已按 `graph / keyword / vector / document` 分组展示引用
  - 已支持分组展开/收起与基础元数据标签展示
- ✅ 已完成 `KernelConnect` 第二阶段轻量问答入口接入：
  - `frontend/App.tsx`
  - `KernelConnect` 页面已显示统一“问司南”入口
- ✅ 已补多页面上下文注入增强：
  - `frontend/App.tsx`
  - 已为 `SinanAnalysis` / `KnowledgeGraph` / `KernelConnect` 补充异常摘要、推荐方案、接入状态等上下文字段
- ✅ 已补 `KnowledgeGraph` 页面内选中节点的问答上下文注入：
  - `frontend/contexts/SinanQaContext.tsx`
  - `frontend/App.tsx`
  - `frontend/pages/KnowledgeGraph.tsx`
  - 当前在格物页面切换选中节点后，司南问答可直接拿到 `selectedNodeId / selectedNodeLabel / selectedNodeType / selectedNodeDescription`
- ✅ 已补知识图谱画布重渲染收敛：
  - `frontend/components/KnowledgeGraphCanvas.tsx`
  - `frontend/pages/KnowledgeGraph.tsx`
  - 已将 `KnowledgeGraphCanvas` 做 `memo` 包装，并将节点点击回调改为稳定引用，减少问答上下文变化时的图谱重复重排
- ✅ 已取消引用“跳转定位”交互，回退为只读引用展示：
  - `frontend/components/AiAssistant.tsx`
  - 原因：当前跳转路径会干扰格物页图谱体验，先保留引用分组、摘要与匹配度展示，不再提供跳转入口
- ✅ 已将格物主页面切换为 3D 知识图谱正式版：
  - `frontend/App.tsx`
  - `frontend/pages/KnowledgeGraph3DDemo.tsx`
  - 当前 `/app/gewu` 已直接使用 3D 图谱视图
  - 已支持：
    - 全量知识节点三维展示
    - 节点悬停弱提示与选中高亮
    - 选中节点后的相机平滑聚焦
    - 360 度自由旋转、缩放与平移
  - 已移除演示性质按钮与说明文案，收敛为正式格物页面体验

## 未完成
### 后端待完善
- ⏳ 还未做更细粒度异常分类与结果质量评估
- ⏳ 文档更新说明（Task 4）尚未补写
- ⏳ 仍需继续优化文档筛选、chunk 清洗和召回排序权重
- ⏳ 真实向量已接通，但对“贴片偏移/placement offset”这类问题仍会命中泛化工艺文档，尚未完成效果收口
- ⏳ 仍需继续压制学术/泛检测类弱相关 `vector` 误召回，并优化 `fusion` 权重，避免高价值 `keyword` 结果被反超
- ⏳ 轻量多语言模型正在下载，尚未完成基于 `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` 的 `embeddings.jsonl` 重建与回归验证

### 前端：待完成项
- ⏳ 引用来源当前已支持分组与展开，跳转能力已暂时移除，后续若重做需要避免触发格物页重载或重排
- ⏳ 引用来源的更细粒度排序策略尚未补齐
- ⏳ 3D 格物页当前主要基于合并后的演示/聚合数据展示，后续仍需评估与真实异常上下文、筛选条件和问答联动的进一步整合方式

## 测试状态
- `.\.venv\Scripts\python.exe -m pytest tests/services/test_build_knowledge_qa_index.py tests/services/test_vector_retriever.py tests/services/test_keyword_retriever.py tests/services/test_knowledge_qa_service.py` 已通过
  - 结果：`12 passed`
- `.\.venv\Scripts\python.exe -m pytest tests/services/test_build_knowledge_qa_index.py tests/services/test_vector_retriever.py` 已通过
  - 结果：`6 passed`
- `.\.venv\Scripts\python.exe -c "from sentence_transformers import SentenceTransformer; ..."` 已通过
  - 结果：本地 `BAAI/bge-small-zh-v1.5` 可正常加载并返回 `512` 维向量
- `.\.venv\Scripts\python.exe -c "from sentence_transformers import SentenceTransformer; model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'); ..."` 进行中
  - 状态：模型下载中，尚未完成
- `.\.venv\Scripts\python.exe app/scripts/build_knowledge_qa_index.py --with-embeddings` 已通过
  - 结果：成功生成 `61` 份文档、`3007` 个 chunks、`3007` 条 embeddings
- `.\.venv\Scripts\python.exe app/scripts/evaluate_knowledge_qa.py --top-k 3` 已通过
  - 结果：成功生成 `backend/app/data/knowledge_qa/evaluation_report.json`
- `.\.venv\Scripts\python.exe -m pytest tests/services/test_evaluate_knowledge_qa.py` 已通过
  - 结果：`1 passed`
- `npm run lint` 未通过（前端依赖未安装，已停止）
  - 错误：`'biome' is not recognized as an internal or external command`
  - 原因：`frontend/node_modules` 不存在，当前环境未安装前端依赖
- `npx biome check frontend/components/AiAssistant.tsx` 已通过
- `npx biome check frontend/App.tsx frontend/components/AiAssistant.tsx frontend/contexts/SinanQaContext.tsx` 已通过
- `npx biome check frontend/App.tsx frontend/pages/KnowledgeGraph3DDemo.tsx` 已通过
- `npx biome check frontend/pages/KnowledgeGraph3DDemo.tsx` 已通过
- `npx biome check frontend/components/KnowledgeGraphCanvas.tsx frontend/pages/KnowledgeGraph.tsx` 未通过
  - 原因：这两个文件存在项目内既有 Biome 问题（如 `noExplicitAny`、`noNonNullAssertion`、`useButtonType` 等），不属于本轮新增逻辑直接引入的问题
- `python -m compileall ...` 未通过（工作区 `__pycache__` 写入权限问题，已停止）
  - 错误：`PermissionError: [WinError 5] 拒绝访问`

## 备注
- 已清理工具产物目录（`.codex`）与误加入的计划文件，避免污染变更集。
- 当前路线已明确切换为 LangChain。
- 当前本地环境存在错误代理配置：
  - `HTTP_PROXY / HTTPS_PROXY / ALL_PROXY = http://127.0.0.1:9`
  - 已在 embedding 加载层通过本地缓存路径 + `local_files_only=True` 绕开该问题
- 曾尝试接入 `Voyage` 作为免费 embedding provider，但未绑支付方式账号会被限制到 `3 RPM / 10K TPM`，不适合当前全量索引构建；当前已回退为本地 BAAI 方案
- 当前已确认英文 PDF + 中文问题场景不适合继续依赖中文专用 embedding 模型，已切换到轻量多语言模型配置；待模型下载完成后需重建 embeddings 并复测
- 后续优先建议：
  1. 做 document/vector 结果质量评估与更细粒度问题分类
  2. 针对“贴片偏移/placement offset”类问题继续补语料和调排序
  3. 完成轻量多语言 embeddings 重建与回归验证
  4. 补 Task 4 的文档更新说明
