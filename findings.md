# Findings & Decisions (Case Library)

## Research Findings
<!--
  WHAT: Key discoveries from web searches, documentation reading, or exploration.
  WHY: Multimodal content (images, browser results) doesn't persist. Write it down immediately.
  WHEN: After EVERY 2 view/browser/search operations, update this section (2-Action Rule).
-->
- **Model:** `CaseLibrary` exists in `backend/app/models.py` (已验证字段)
  - 字段: `anomaly_id`, `problem_description`, `solution_adopted`, `lessons_learned`, `diagnosis_result` (JSONB), `expected_effect` (JSONB), `actual_effect` (JSONB), `tags` (数组)
- **Previous work:** SiNan core logic (Anomaly -> Diagnosis -> Solution) is done. Case Library is the repository of these experiences.
- **后端路由:** `backend/app/api/routes/cases.py` 已创建，包含完整的 CRUD + 搜索功能
- **种子数据:** `backend/app/seed_data.py` 仅包含生产数据，缺少 CaseLibrary 和 SiNan 相关数据（Anomaly, Diagnosis, Solution, WorkOrder）

## Technical Decisions
<!--
  WHAT: Architecture and implementation choices you've made, with reasoning.
  WHY: You'll forget why you chose a technology or approach. This table preserves that knowledge.
  WHEN: Update whenever you make a significant technical choice.
-->
| Decision | Rationale |
|----------|-----------|
| 手动更新前端 API 客户端 | 后端环境限制，无法运行服务器自动生成客户端代码。手动添加 CaseLibrary 类型和 CasesService |
| 种子数据包含完整案例链路 | 创建 Anomaly → Diagnosis → Solution → WorkOrder → CaseLibrary 的完整数据流，展示系统完整功能 |
| 使用卡片布局展示案例 | 案例包含丰富的结构化信息（诊断、效果对比、教训、标签），卡片布局比表格更适合 |
| 搜索功能基于文本匹配 | 使用 SQL ILIKE 进行简单的关键词搜索，满足基本需求，后续可升级为全文搜索 |

## Issues Encountered
<!--
  WHAT: Problems you ran into and how you solved them.
  WHY: Similar to errors in task_plan.md, but focused on broader issues (not just code errors).
  WHEN: Document when you encounter blockers or unexpected challenges.
-->
| Issue | Resolution |
|-------|------------|
| | |
