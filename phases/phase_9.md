# Phase 9: Backend Workflow Registry

## Purpose

Create the backend source of truth for every workflow, module, role, artifact, source mode, and schema. This prevents frontend/backend/model drift.

## Goal

The backend should reject unknown IDs and build valid Work Plans from a canonical registry.

## Skills To Use

Primary skills:

- `$backend-developer`: Use to build registries, schemas, skill catalog, workflow templates, memory store, and Work Plan creation route.
- `$rag-architect`: Use to design source modes, source-needed behavior, and future retrieval-compatible template fields.

Supporting skills:

- `$llm-testing`: Use to test schema robustness against unknown workflow IDs, unknown modules, unsafe skill suggestions, and prompt-injection-like roadmap content.
- `$machine-learning-engineer`: Use to review how skills, workflows, and modules will be routed to models later.
- `$debugger`: Use for registry consistency failures and schema validation bugs.

Review skills:

- `$frontend-design`: Use to confirm `/skills` and Work Plan responses contain enough information for frontend selection and editing.

## Scope

Build:

- Hardened registries from Phase 8.
- Skill catalog.
- Module catalog.
- Workflow templates.
- Zod schemas.
- Local Work Plan builder.
- `/api/work-mode/work-plans`.

Do not build yet:

- LLM Work Plan generation.
- Answer generation.

## Files

```text
backend/templates/
  registries.ts
  skillCatalog.ts
  moduleCatalog.ts
  workflows.ts

backend/schemas/
  workModeSchemas.ts

backend/services/
  workPlanBuilder.ts

backend/store/
  memoryStore.ts
```

## Canonical IDs

### MVP Workflow IDs

```text
slide_deck
prd_generation
debugging_bug_fix
```

### Planned Workflow IDs

```text
technical_architecture
competitive_analysis
research_report
brd_generation
strategy_memo
code_implementation
data_analysis_plan
```

## Skill Catalog

MVP skill IDs:

```text
investor_deck_builder
prd_builder
bug_fix_planner
```

Skill shape:

```ts
type SkillDefinition = {
  id: string;
  label: string;
  description: string;
  workflowId: WorkflowId;
  supportedRoles: WorkRole[];
  supportedArtifacts: WorkArtifact[];
  matchedSignals: string[];
  defaultModuleIds: ModuleId[];
  optionalModuleIds: ModuleId[];
};
```

Required endpoint:

```http
GET /api/work-mode/skills
```

This endpoint powers frontend skill selection and suggested options.

## Module Catalog

Each module must have:

```ts
type ModuleDefinition = {
  id: ModuleId;
  label: string;
  description: string;
};
```

## Workflow Template Shape

```ts
type WorkflowTemplate = {
  id: WorkflowId;
  name: string;
  artifacts: WorkArtifact[];
  roles: WorkRole[];
  taskCategories: string[];
  keywordSignals: string[];
  defaultModules: ModuleId[];
  defaultSourceMode: SourceMode;
  sections: Array<{
    id: string;
    title: string;
    instructions: string;
    required: boolean;
  }>;
};
```

## Work Plan Creation Request

```json
{
  "analysisId": "analysis_123",
  "roleOverride": null,
  "artifactOverride": null,
  "workflowOverride": null,
  "selectedModuleIds": ["competitor_analysis", "investor_framing"],
  "sourceMode": "source_needed_only"
}
```

Contract decision:

```text
The API returns WorkPlanRecord.
The editable plan is WorkPlanRecord.plan.
Version lives on WorkPlanRecord, not inside the editable plan.
```

Rules:

- `analysisId` is the source of truth.
- Overrides are explicit.
- Backend resolves final role/artifact/workflow.
- Backend validates selected modules.

## Work Plan Response

```json
{
  "workPlanId": "wp_123",
  "status": "draft",
  "version": 1,
  "plan": {
    "objective": "Create an investor-facing slide deck about Perplexity competitors.",
    "role": "Researcher",
    "artifact": "PPT",
    "workflowId": "slide_deck",
    "sourceMode": "source_needed_only",
    "assumptions": [
      "The user wants a slide-by-slide outline, not a generated .pptx file."
    ],
    "missingContext": [
      "Target slide count",
      "Preferred competitor list"
    ],
    "sections": [
      {
        "id": "deck_goal",
        "title": "Deck Goal",
        "instructions": "Define the investor-facing purpose of the deck.",
        "required": true
      }
    ],
    "suggestions": [
      {
        "id": "competitor_analysis",
        "label": "Competitor analysis",
        "description": "Compare competitors, alternatives, positioning, and tradeoffs.",
        "selected": true
      }
    ],
    "validationCriteria": [
      "Final output must be structured as a slide-by-slide deck outline."
    ]
  }
}
```

## Detailed Tasks

### Task 1: Define Registries

Promote Phase 8 provisional registries into hardened registries:

- `WORK_ROLES`
- `WORK_ARTIFACTS`
- `SOURCE_MODES`
- `WORKFLOW_IDS`
- `MODULE_IDS`

### Task 1A: Define Skill Catalog

Create three MVP skills:

- `investor_deck_builder` -> `slide_deck`
- `prd_builder` -> `prd_generation`
- `bug_fix_planner` -> `debugging_bug_fix`

Each skill should list default and optional modules.

### Task 2: Define Zod Schemas

Schemas:

- `AnalyzeRequestSchema`
- `PromptAnalysisSchema`
- `CreateWorkPlanRequestSchema`
- `WorkPlanSchema`
- `WorkPlanSectionSchema`
- `ValidationResultSchema`

### Task 3: Define Workflow Templates

Create full templates for:

- `slide_deck`
- `prd_generation`
- `debugging_bug_fix`

### Task 4: Build Local Work Plan Builder

Function:

```ts
function buildWorkPlanFromTemplate(input): WorkPlan
```

It should:

- Load template.
- Merge selected modules.
- Add module-specific sections.
- Add assumptions.
- Add missing context.
- Add validation criteria.

### Task 5: Add In-Memory Store

Store:

- Analyses.
- Work Plans.
- Outputs later.

### Task 6: Add Contract Tests

Add lightweight tests or scripts that assert:

- Every workflow default module exists in `MODULE_IDS`.
- Every workflow artifact exists in `WORK_ARTIFACTS`.
- Every workflow role exists in `WORK_ROLES`.
- Every fixture expected workflow exists.
- Every fixture expected module exists.
- Every skill workflow exists.
- Every skill module exists.

### Task 7: Add Persistence Migration Path

Document and optionally scaffold:

```text
memoryStore -> jsonStore or SQLite -> PostgreSQL
```

If SQLite is added:

- Add conversations.
- Add prompt analyses.
- Add work plans.
- Add generated outputs.

## Acceptance Criteria

- Unknown workflow IDs are rejected.
- Unknown module IDs are rejected.
- Work Plan can be created from an analysis.
- Work Plan version starts at 1.
- MVP workflows produce meaningful section lists.
- Registry consistency checks pass.
- Skill catalog endpoint returns valid skills.
- Work Plan response includes non-empty sections and validation criteria.
- Persistence migration path is documented.

## Test Cases

1. Analyze PPT prompt, create Work Plan.
2. Analyze PRD prompt, create Work Plan.
3. Analyze bug prompt, create Work Plan.
4. Try invalid module ID, expect 400.
5. Try missing analysis ID, expect 404.
6. Run registry consistency checks.
7. Fetch `/api/work-mode/skills` and confirm three MVP skills.
8. Confirm response shape is `WorkPlanRecord`.

## Exit Checklist

- [ ] Registries exist.
- [ ] Schemas exist.
- [ ] Three templates exist.
- [ ] Local builder works.
- [ ] Work Plan route works.
- [ ] Registry consistency checks pass.
- [ ] Skill catalog route works.
- [ ] WorkPlanRecord contract verified.
- [ ] Persistence migration path documented.
