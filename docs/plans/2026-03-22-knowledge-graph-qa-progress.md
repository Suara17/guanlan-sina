# 知识图谱 + 文档问答 任务进度

日期：2026-03-22  
分支：`knowledge-qa`  
工作区：`E:\Guanlan-Sina\.worktrees\knowledge-qa`

## 总览
- 目标：实现方案 B（Neo4j 图谱问答 + LangChain LLM + 后续 RAG 扩展）
- 状态：后端已切换到 LangChain 路线，统一问答 API 已打通 `graph + keyword + vector + fusion + grouped prompt` 主链路；前端已接入真实 API

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

## 未完成
### 后端待完善
- ⏳ 还未做更细粒度异常分类与结果质量评估
- ⏳ 文档更新说明（Task 4）尚未补写
- ⏳ 尚未形成非结构化文档接入规范、切片规范与向量化流程
- ⏳ 向量检索当前仍基于结构化异常文本，尚未接入真实非结构化文档语料

### 前端：待完成项
- ⏳ 引用来源当前已支持分组与展开，跳转能力已暂时移除，后续若重做需要避免触发格物页重载或重排
- ⏳ 引用来源的更细粒度排序策略尚未补齐
- ⏳ 图谱页虽然已收敛一轮画布重渲染，但仍需继续观察问答面板交互下的布局稳定性

## 测试状态
- `uv run pytest backend/tests/services/test_qa_router.py backend/tests/services/test_knowledge_qa_service.py backend/tests/services/test_langchain_service.py backend/tests/services/test_graph_retriever.py backend/tests/services/test_keyword_retriever.py backend/tests/services/test_vector_retriever.py backend/tests/services/test_qa_fusion_service.py backend/tests/api/routes/test_knowledge_qa.py` 未通过（权限问题，已停止）
  - 错误：`error: failed to open file C:\Users\forzr\AppData\Local\uv\cache\sdists-v9\.git: 拒绝访问。 (os error 5)`
- `npm run lint` 未通过（前端依赖未安装，已停止）
  - 错误：`'biome' is not recognized as an internal or external command`
  - 原因：`frontend/node_modules` 不存在，当前环境未安装前端依赖
- `npx biome check frontend/components/AiAssistant.tsx` 已通过
- `npx biome check frontend/App.tsx frontend/components/AiAssistant.tsx frontend/contexts/SinanQaContext.tsx` 已通过
- `npx biome check frontend/components/KnowledgeGraphCanvas.tsx frontend/pages/KnowledgeGraph.tsx` 未通过
  - 原因：这两个文件存在项目内既有 Biome 问题（如 `noExplicitAny`、`noNonNullAssertion`、`useButtonType` 等），不属于本轮新增逻辑直接引入的问题
- `python -m compileall ...` 未通过（工作区 `__pycache__` 写入权限问题，已停止）
  - 错误：`PermissionError: [WinError 5] 拒绝访问`

## 备注
- 已清理工具产物目录（`.codex`）与误加入的计划文件，避免污染变更集。
- 当前路线已明确切换为 LangChain。
- 后续优先建议：
  1. 做结果质量评估与更细粒度异常分类
  2. 完成非结构化文档接入规范后再把向量召回切到真实文档语料
  3. 补 Task 4 的文档更新说明
