# Task Plan: Implement SiNan Case Library

<!--
  WHAT: This is your roadmap for the entire task. Think of it as your "working memory on disk."
  WHY: After 50+ tool calls, your original goals can get forgotten. This file keeps them fresh.
  WHEN: Create this FIRST, before starting any work. Update after each phase completes.
-->

## Goal
<!--
  WHAT: One clear sentence describing what you're trying to achieve.
  WHY: This is your north star. Re-reading this keeps you focused on the end state.
  EXAMPLE: "Create a Python CLI todo app with add, list, and delete functionality."
-->
Implement the Case Library (Knowledge Base) for the SiNan system, enabling users to search, view, and learn from historical production anomalies and solutions.

## Current Phase
<!--
  WHAT: Which phase you're currently working on (e.g., "Phase 1", "Phase 3").
  WHY: Quick reference for where you are in the task. Update this as you progress.
-->
Phase 4 (Complete)

## Phases
<!--
  WHAT: Break your task into 3-7 logical phases. Each phase should be completable.
  WHY: Breaking work into phases prevents rework. Document decisions so you remember why you chose them.
  WHEN: Update status after completing each phase: pending → in_progress → complete
-->

### Phase 1: Requirements & Discovery
<!--
  WHAT: Understand what needs to be done and gather initial information.
  WHY: Starting without understanding leads to wasted effort. This phase prevents that.
-->
- [x] Analyze `CaseLibrary` model in `backend/app/models.py`
- [x] Check for existing API routes in `backend/app/api/`
- [x] Check frontend structure for Knowledge Base
- **Status:** complete

### Phase 2: Backend Implementation
<!--
  WHAT: Actually build/create/write the solution.
  WHY: This is where the work happens. Break into smaller sub-tasks if needed.
-->
- [x] Create `backend/app/api/routes/cases.py` (CRUD + Search)
- [x] Register router in `backend/app/api/main.py`
- [x] Verify mock data generation or seeding for cases (Added `create_sinan_data()` function)
- **Status:** complete

### Phase 3: Frontend Implementation
<!--
  WHAT: Connect the backend to the frontend.
-->
- [x] Create/Update API client (Added CaseLibrary types and CasesService)
- [x] Create `frontend/src/routes/_layout/knowledge.tsx` (List/Search View)
- [x] Add navigation link in sidebar (Knowledge menu item)
- **Status:** complete

### Phase 4: Delivery
<!--
  WHAT: Final review and handoff to user.
  WHY: Ensures nothing is forgotten and deliverables are complete.
-->
- [x] Review code against `CLAUDE.md` guidelines
- [x] Update documentation (progress.md, task_plan.md, findings.md)
- **Status:** complete

## Key Questions
<!--
  WHAT: Important questions you need to answer during the task.
  WHY: These guide your research and decision-making. Answer them as you go.
-->
1. Should Case Library be searchable by keywords? (Yes, simple text search)
2. Is there a link between `WorkOrder` completion and `CaseLibrary` creation? (Ideally yes, auto-archiving)

## Decisions Made
<!--
  WHAT: Technical and design decisions you've made, with the reasoning behind them.
  WHY: You'll forget why you made choices. This table helps you remember and justify decisions.
  WHEN: Update whenever you make a significant choice (technology, approach, structure).
-->
| Decision | Rationale |
|----------|-----------|
| 手动更新前端 API 客户端而非自动生成 | 后端环境限制，无法运行服务器自动生成客户端代码 |
| 在种子数据中创建完整的案例链路 | 确保数据完整性，展示异常→诊断→方案→工单→案例库的完整流程 |
| 使用卡片布局展示案例列表 | 案例信息丰富（诊断结果、效果对比、教训），卡片布局更适合展示结构化数据 |
| 不创建独立的案例详情页面 | 卡片视图已包含所有必要信息，避免过度设计 |

## Errors Encountered
<!--
  WHAT: Every error you encounter, what attempt number it was, and how you resolved it.
  WHY: Logging errors prevents repeating the same mistakes. This is critical for learning.
  WHEN: Add immediately when an error occurs, even if you fix it quickly.
-->
| Error | Attempt | Resolution |
|-------|---------|------------|
| | | |
