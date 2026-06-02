# Phase 4: Frontend Suggestions UI

## Purpose

Build the suggestion layer that lets users choose which modules the Work Plan should include. This is where the product starts feeling controllable rather than fully automatic.

## Goal

After detection, users should see relevant suggestions such as:

- Competitor analysis.
- Investor framing.
- Sources required.
- Metrics.
- User personas.
- Risk analysis.
- Root cause analysis.
- Test cases.

Users can tick or untick suggestions before creating the Work Plan.

## Skills To Use

Primary skills:

- `$frontend-design`: Use to build the skill selector, suggestion checklist, source mode selector, and workflow explanation UI.
- `$impeccable`: Use to review cognitive load, checkbox clarity, disabled states, and warning states.

Supporting skills:

- `$backend-developer`: Use to align the frontend payload with `analysisId`, `skillOverride`, `selectedModuleIds`, and `sourceMode`.
- `$rag-architect`: Use to decide when `source_needed_only`, `user_uploaded`, or future `web_search` options should appear.
- `$llm-testing`: Use to test prompt cases that might trick the system into suggesting unsafe or irrelevant modules.

Review skills:

- `$design-taste-frontend`: Use for visual refinement of the skill and module selection surface.

## Scope

Build:

- Suggested module checklist.
- Skill selector.
- Source mode selector.
- Recommendation explanation.
- Module descriptions.
- Selected module state.

Do not build yet:

- Work Plan editor.
- Backend module catalog.
- Real persistence.

## User Flow

```text
User reviews detection
System shows suggested modules
User selects/deselects modules
User selects source mode if relevant
User clicks Create Work Plan
```

## UI Components

```text
SkillSelector
SuggestionChecklist
  SuggestionItem
  SourceModeSelector
  WorkflowReasonPanel
  CreateWorkPlanButton
```

## Skill Fetching

In the mock frontend phase, skills can be loaded from local fixtures. Once backend Phase 9 is ready, fetch them from:

```http
GET /api/work-mode/skills
```

Skill response:

```ts
type SkillDefinition = {
  id: string;
  label: string;
  description: string;
  workflowId: WorkflowId;
  supportedRoles: WorkRole[];
  supportedArtifacts: WorkArtifact[];
  defaultModuleIds: ModuleId[];
  optionalModuleIds: ModuleId[];
};
```

MVP skills:

- `investor_deck_builder`
- `prd_builder`
- `bug_fix_planner`

## Module Catalog For MVP

Use these module IDs from the canonical registry in `docs/architecture.md`. Do not create a second independent catalog in the frontend.

```text
assumptions
sources_required
competitor_analysis
market_landscape
validation_checklist
risk_analysis
implementation_plan
metrics
user_personas
investor_framing
root_cause_analysis
test_cases
api_examples
database_schema
tradeoff_analysis
```

## Suggested Modules By Workflow

### `slide_deck`

Default modules:

- assumptions
- validation_checklist

Conditional modules:

- competitor_analysis if prompt mentions competitors.
- investor_framing if prompt mentions investors, fundraising, pitch, moat.
- sources_required if prompt mentions latest, recent, market, competitor, pricing.
- market_landscape if prompt mentions market/category.

### `prd_generation`

Default modules:

- assumptions
- user_personas
- metrics
- risk_analysis
- validation_checklist

Conditional modules:

- competitor_analysis if prompt mentions competitors.
- implementation_plan if prompt asks for technical feasibility.

### `debugging_bug_fix`

Default modules:

- root_cause_analysis
- test_cases
- validation_checklist
- risk_analysis

Conditional modules:

- api_examples if prompt mentions API.
- database_schema if prompt mentions database/session/table/schema.

## Source Mode Selector

Modes:

```text
none
source_needed_only
user_uploaded
web_search
```

MVP behavior:

- `none`: enabled.
- `source_needed_only`: enabled.
- `user_uploaded`: disabled or marked later.
- `web_search`: disabled or marked later unless implemented.

Rules:

- Competitor/research/latest prompts default to `source_needed_only`.
- Debugging and PRD prompts usually default to `none`.

## State Model

```ts
type SuggestionState = {
  selectedSkillId: string;
  selectedModuleIds: string[];
  sourceMode: "none" | "source_needed_only" | "user_uploaded" | "web_search";
  manuallyChangedModuleIds: string[];
};
```

## Frontend/Backend Contract

When the backend exists, the Create Work Plan call should send:

```ts
type CreateWorkPlanInput = {
  analysisId: string;
  roleOverride?: WorkRole | null;
  artifactOverride?: WorkArtifact | null;
  workflowOverride?: WorkflowId | null;
  skillOverride?: string | null;
  selectedModuleIds: ModuleId[];
  sourceMode: SourceMode;
};
```

The frontend should not resend `detectedRole`, `detectedArtifact`, or `recommendedWorkflowId` as authoritative values. Those belong to the saved analysis unless explicitly overridden.

Important distinction:

```text
Analyze response returns recommendedModuleIds.
Create Work Plan sends selectedModuleIds.
```

The user owns the selected modules after the suggestions screen.

## Detailed Tasks

### Task 1: Build Suggestion Data

Create local module metadata:

```ts
type ModuleDefinition = {
  id: string;
  label: string;
  description: string;
};
```

### Task 1A: Build Skill Selector

Show:

- Recommended skill.
- Alternative skills.
- Skill descriptions.
- Matched reason if available.

Changing skill should:

- Update workflow.
- Recompute default modules.
- Preserve manually selected compatible modules.
- Reset future Work Plan approval if already created.

### Task 2: Generate Suggestions From Analysis

Create:

```ts
function getSuggestedModules(analysis: PromptAnalysis): string[]
```

### Task 3: Render Checklist

Each item should show:

- Checkbox.
- Module label.
- Short description.

### Task 4: Add Source Mode Control

Use a segmented control or select.

### Task 5: Add Create Work Plan Button

Button should pass:

- Prompt.
- Analysis.
- Overrides.
- Selected module IDs.
- Source mode.

### Task 6: Preserve Manual Choices

If workflow changes after the user manually changed suggestions:

- Recompute recommended defaults.
- Preserve manually selected modules where still valid.
- Remove modules that are not in the canonical module registry.
- Show a small "suggestions updated" state.

## Acceptance Criteria

- User can select and deselect modules.
- Selected modules persist when moving to Work Plan.
- Source mode can be changed.
- Skill can be changed before Work Plan creation.
- Workflow explanation is visible.
- Create Work Plan action is disabled if no workflow is selected.
- Create Work Plan payload matches the future backend contract.
- Frontend does not duplicate authoritative analysis fields.
- `recommendedModuleIds` and `selectedModuleIds` are treated as different fields.

## Test Cases

### Prompt

```text
Make a PPT on competitors of Perplexity for investors.
```

Expected selected:

- competitor_analysis
- investor_framing
- sources_required
- validation_checklist

### Prompt

```text
Create a PRD for an AI meeting summarizer.
```

Expected selected:

- assumptions
- user_personas
- metrics
- risk_analysis
- validation_checklist

### Prompt

```text
Fix the session bug in login redirect.
```

Expected selected:

- root_cause_analysis
- test_cases
- validation_checklist
- risk_analysis

## Edge Cases

- User unchecks all modules: allow, but keep required validation internally.
- Source-heavy prompt but user selects `none`: show subtle warning.
- User changes workflow: recompute default suggestions but preserve manual choices if possible.
- Backend returns an unknown module later: ignore and log in development.
- Backend returns an unknown skill later: hide it and log in development.
- User switches skill after manual module edits: preserve compatible modules and warn that suggestions changed.

## Exit Checklist

- [ ] Checklist works.
- [ ] Skill selector works.
- [ ] Source mode works.
- [ ] Workflow explanation exists.
- [ ] Create Work Plan action sends selected modules.
- [ ] Create Work Plan payload contract documented in code.
- [ ] Manual suggestion preservation works.
