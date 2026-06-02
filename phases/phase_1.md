# Phase 1: Research And Assets

## Purpose

Create the product and design foundation for the Work Mode prototype before implementation begins. This phase should remove ambiguity around what the product is, what it is not, which workflows are supported first, and what assets/examples are needed to build and test the experience.

## Product Goal

Work Mode gives users an editable roadmap before the model generates the final answer. It should feel like a Claude-like chat interface with an additional structured planning layer.

The product must not claim to expose the model's hidden reasoning. It should describe the intermediate artifact as:

- Work Plan
- Answer Roadmap
- Blueprint
- Plan before answer

Avoid:

- Raw thought process
- Chain of thought
- Model reasoning internals

## Skills To Use

Primary skills:

- `$llm-wiki`: Use to structure research assets, prompt fixtures, product notes, and reusable knowledge so discoveries compound instead of being rediscovered later.
- `$llm-testing`: Use to define adversarial, privacy, safety, and robustness test prompts for the Work Mode classifier and answer generator.
- `$rag-architect`: Use to decide how source-heavy tasks should be represented, even if full RAG is deferred.

Supporting skills:

- `$frontend-design`: Use to define initial screen inventory and interaction patterns for the Claude-like interface.
- `$backend-developer`: Use to define early API contracts and backend-owned data boundaries.
- `$machine-learning-engineer`: Use to define model usage constraints, latency expectations, fallback behavior, and cost-aware model routing.

Review skills:

- `$impeccable`: Use to review UX copy, edge states, and whether the research translates into a clear product flow.
- `$design-taste-frontend`: Use lightly for visual direction, but only for product taste and anti-generic UI references, not dense app implementation.

## Research Tracks

### 1. Claude-Like UX Reference

Study and document:

- Chat layout structure.
- Sidebar behavior.
- Prompt composer placement.
- Mode selector placement.
- Message spacing.
- Empty state behavior.
- How artifacts or side panels are presented.
- How loading states feel.
- How long-form answers are displayed.

Output:

- Notes on layout conventions.
- Screens worth copying conceptually.
- UX patterns to avoid.

### 2. Work Mode Product Research

Define the key differentiator:

```text
Normal chat:
Prompt -> Answer

Work Mode:
Prompt -> Detection -> Editable Work Plan -> Approval -> Answer -> Validation
```

Clarify why this matters:

- Users get control before output generation.
- The model follows an approved structure.
- Complex deliverables become less random.
- The system can detect role, artifact, and workflow.
- Users can add/remove relevant modules before generation.

### 3. Workflow Taxonomy Research

Use the canonical architecture from `docs/architecture.md` and freeze the MVP workflows.

MVP workflows:

```text
1. slide_deck
2. prd_generation
3. debugging_bug_fix
```

Planned later workflows:

```text
4. technical_architecture
5. competitive_analysis
6. research_report
7. brd_generation
8. strategy_memo
9. code_implementation
10. data_analysis_plan
```

## Required Assets

### Prompt Test Set

Create at least 15 test prompts.

Minimum coverage:

- 5 slide deck prompts.
- 5 PRD prompts.
- 5 debugging prompts.

Example prompts:

```text
Make a PPT on competitors of Perplexity for investors.
```

Expected:

```json
{
  "role": "Researcher",
  "artifact": "PPT",
  "workflow": "slide_deck",
  "modules": ["competitor_analysis", "investor_framing", "sources_required"],
  "sourceMode": "source_needed_only"
}
```

```text
Create a PRD for an AI meeting summarizer for remote teams.
```

Expected:

```json
{
  "role": "Product Manager",
  "artifact": "PRD",
  "workflow": "prd_generation",
  "modules": ["assumptions", "user_personas", "metrics", "risk_analysis", "validation_checklist"],
  "sourceMode": "none"
}
```

```text
Fix the login bug where users are redirected to dashboard but session is empty.
```

Expected:

```json
{
  "role": "Developer",
  "artifact": "Code",
  "workflow": "debugging_bug_fix",
  "modules": ["root_cause_analysis", "test_cases", "validation_checklist", "risk_analysis"],
  "sourceMode": "none"
}
```

### Screen Inventory

Define the screens/states that frontend phases must build:

1. Empty chat state.
2. Normal prompt composer state.
3. Work Mode prompt input state.
4. Analyzing prompt state.
5. Detection summary state.
6. Suggestions checklist state.
7. Editable Work Plan state.
8. Approved Work Plan state.
9. Generating answer state.
10. Final answer with validation state.
11. Error state.
12. Low-confidence detection state.

### API Contract Inventory

Create a small contract inventory before implementation starts. This prevents frontend mock data from drifting away from backend responses.

Required contracts:

- `PromptAnalysis`
- `WorkSuggestion`
- `WorkPlan`
- `WorkPlanRecord`
- `WorkPlanSection`
- `ValidationResult`
- `ApiSuccess<T>`
- `ApiError`
- `SkillDefinition`
- `SkillOption`

Each contract should define:

- Field name.
- Type.
- Whether it is required.
- Which phase first uses it.
- Whether it is frontend-only, backend-only, or shared.

### Shared Fixture Assets

Create fixtures that can be reused by frontend mocks and backend tests:

```text
fixtures/
  prompts.json
  skills.json
  analyses.json
  workPlans.json
  validationResults.json
```

If a fixtures folder is too much for the first pass, keep the same content in a single `research_assets.md` file and migrate later.

### Copy Guidelines

Use these labels:

- "Work Mode"
- "Detected role"
- "Artifact"
- "Recommended workflow"
- "Suggested modules"
- "Work Plan"
- "Approve Work Plan"
- "Generate answer"
- "Validation summary"
- "Source needed"

Avoid over-explaining in the UI. The product should be discoverable through controls and labels, not tutorial text.

## Detailed Tasks

### Task 1: Extract Canonical IDs

From `docs/architecture.md`, extract:

- `WORK_ROLES`
- `WORK_ARTIFACTS`
- `SOURCE_MODES`
- `MODULE_CATALOG`
- `WORKFLOW_REGISTRY`

Decision:

- These IDs must be used by frontend, backend, prompts, and tests.

### Task 2: Build Prompt Fixture Table

Create a table with:

- Prompt.
- Expected role.
- Expected artifact.
- Expected workflow.
- Expected modules.
- Expected source mode.
- Confidence expectation.
- Notes.

### Task 3: Define UX Flow

Document the exact user journey:

```text
User selects Work Mode
User enters prompt
System analyzes prompt
System shows role/artifact/workflow/modules
User edits role/artifact/modules if needed
System creates Work Plan
User edits Work Plan
User approves Work Plan
System generates answer
System validates answer
User sees answer and validation
```

### Task 4: Define MVP Boundaries

Explicitly mark out of scope for prototype:

- Login/auth.
- Billing.
- Team workspaces.
- Full retrieval system.
- Web search citations.
- File upload.
- Real PPT export.
- Multi-user collaboration.

### Task 5: Define Phase Gate Metrics

Define what "done" means numerically:

- Detection fixture accuracy target: at least 80% on the initial prompt set.
- Work Plan approval UX target: user can complete flow in under 90 seconds in a manual test.
- Backend happy-path target: analyze -> create -> approve -> generate completes without manual server restart.
- Deployment target: smoke test passes on Vercel + Render.

### Task 6: Define Skill Catalog

Document the MVP skills that will be shown as selectable options:

```text
investor_deck_builder
prd_builder
bug_fix_planner
```

For each skill, define:

- Label.
- Description.
- Workflow ID.
- Supported roles.
- Supported artifacts.
- Default modules.
- Optional modules.
- Default roadmap sections.
- Validation criteria.

### Task 7: Define Streaming Decision

Document transport choice:

```text
HTTP for analyze/create/edit/approve.
HTTP response for generation in first prototype.
SSE optional for answer streaming.
WebSocket deferred until realtime collaboration or live multi-user roadmap editing exists.
```

### Task 8: Define Testing And Analytics Fixtures

Create initial lists for:

- Detector unit fixtures.
- LLM safety fixtures.
- Full lifecycle integration fixtures.
- Product analytics events.
- Accessibility checks.

## Acceptance Criteria

- MVP workflow list is frozen.
- At least 15 prompt fixtures exist.
- Screen inventory is complete.
- Product language is safe and consistent.
- Frontend and backend phases can use this research without guessing product intent.
- Shared contracts are documented before frontend mocks become too detailed.
- Fixture prompts cover happy paths and ambiguous prompts.
- MVP skill catalog is documented.
- WebSocket/SSE decision is documented.
- Testing fixture categories are documented.
- Analytics event names are drafted.

## Risks

- Trying to support too many workflow types too early.
- Overusing explanatory UI text.
- Calling the roadmap a thought process.
- Building backend complexity before the UX loop is proven.

## Exit Checklist

- [ ] Prompt fixtures documented.
- [ ] Screen inventory documented.
- [ ] MVP workflows confirmed.
- [ ] Copy terms confirmed.
- [ ] Out-of-scope list confirmed.
- [ ] Shared API contracts documented.
- [ ] Fixtures or fixture plan created.
- [ ] Phase gate metrics confirmed.
- [ ] MVP skill catalog defined.
- [ ] Transport decision documented.
- [ ] Testing fixture categories documented.
- [ ] Analytics events drafted.
