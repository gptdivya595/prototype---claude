# Phase 8: Backend Detection System

## Purpose

Implement deterministic detection before relying on OpenAI. This makes the prototype fast, cheap, debuggable, and resilient when the API key is missing.

## Goal

The backend should classify a prompt into:

- Role candidates.
- Artifact candidates.
- Module candidates.
- Risk level.
- Source mode.
- Recommended workflow.
- Confidence.

## Skills To Use

Primary skills:

- `$backend-developer`: Use to implement prompt normalization, deterministic detection, workflow scoring, API validation, and analysis storage.
- `$llm-testing`: Use to create classifier test prompts for ambiguity, prompt injection, unsafe requests, role confusion, and source-heavy tasks.

Supporting skills:

- `$machine-learning-engineer`: Use to define confidence thresholds, fallback behavior, and measurable detection quality.
- `$debugger`: Use to diagnose misclassification, scoring bugs, and fixture failures.
- `$rag-architect`: Use to tune source-mode detection for research, competitor, pricing, latest, and evidence-heavy prompts.

Review skills:

- `$frontend-design`: Use only to ensure returned analysis fields support the detection summary UI.

## Scope

Build:

- Provisional canonical registries needed by detection.
- Prompt normalizer.
- Deterministic detector.
- Workflow picker.
- `/api/work-mode/analyze`.

Do not build yet:

- LLM classifier.
- Work Plan generation.

## Files

```text
backend/templates/
  registries.ts
  moduleCatalog.ts
  workflows.ts

backend/services/
  promptNormalizer.ts
  deterministicDetector.ts
  workflowPicker.ts

backend/routes/
  workMode.routes.ts
```

## Analyze Request

```json
{
  "conversationId": "local",
  "mode": "work",
  "prompt": "Make a PPT on competitors of Perplexity for investors."
}
```

## Analyze Response

```json
{
  "analysisId": "analysis_123",
  "detectedRole": "Researcher",
  "detectedArtifact": "PPT",
  "taskCategory": "presentation",
  "confidence": 0.88,
  "recommendedWorkflowId": "slide_deck",
  "selectedModuleIds": [
    "competitor_analysis",
    "investor_framing",
    "sources_required",
    "validation_checklist"
  ],
  "sourceMode": "source_needed_only",
  "reason": "The prompt asks for a presentation about competitors for investors.",
  "questionsForUser": []
}
```

## Detection Signals

### Artifact

```text
PPT: ppt, presentation, slides, deck, pitch deck
PRD: prd, product requirement, feature spec, user stories
Code: code, implement, build, fix bug, debug, repo, component, api
Technical Design: architecture, system design, database schema, api design
Competitive Analysis: competitor, benchmark, comparison, alternatives
```

### Role

```text
Product Manager: prd, feature, roadmap, mvp, user story, metrics
Researcher: research, sources, citations, market, competitor, evidence
Developer: code, bug, api, database, test, deploy
Founder: startup, investor, pitch, market, pricing, moat
Business Analyst: brd, stakeholder, business rules, process
```

### Modules

```text
competitor_analysis: competitor, compare, alternative, benchmark
investor_framing: investor, pitch, fundraising, moat
sources_required: latest, recent, source, citation, data, evidence
root_cause_analysis: bug, error, diagnose, debug, cause
test_cases: test, regression, verify
metrics: metric, kpi, success
user_personas: user, customer, persona
```

## Workflow Picker Scoring

```text
artifact match: 45
role match: 15
task category match: 20
keyword match: up to 10
module overlap: up to 10
```

Tie-break rules:

```text
Explicit artifact beats inferred artifact.
Bug/error/fix beats generic code implementation.
PPT + competitor picks slide_deck with competitor_analysis module.
Source-heavy terms set sourceMode to source_needed_only.
If top workflows are close, return alternatives.
```

## Detailed Tasks

### Task 1: Create Provisional Registries

Because detection needs workflow and module IDs, create the initial registry files here with the three MVP workflows. Phase 9 expands and hardens them with full schemas and Work Plan templates.

Minimum required IDs:

- `slide_deck`
- `prd_generation`
- `debugging_bug_fix`

### Task 2: Normalize Prompt

Return:

- Lowercase text.
- Token list.
- Explicit artifact hints.
- Audience hints.
- Entity hints.

### Task 3: Score Candidates

Return arrays:

```ts
type Candidate<T> = {
  value: T;
  score: number;
  matchedSignals: string[];
};
```

### Task 4: Pick Workflow

Use the provisional registry from this phase. Phase 9 should not introduce new IDs that break Phase 8 fixtures.

### Task 5: Build Analyze Endpoint

Validate request body with Zod.

Also save the analysis in `memoryStore` so Phase 9 can create a Work Plan using `analysisId`.

### Task 6: Add Fixture Checks

Create simple manual tests using sample prompts.

### Task 7: Add Unit Tests

Required unit tests:

- Prompt normalization.
- Artifact detection.
- Role detection.
- Module detection.
- Source mode detection.
- Workflow tie-breaks.
- Unknown prompt fallback.

## Acceptance Criteria

- PPT prompt selects `slide_deck`.
- PRD prompt selects `prd_generation`.
- Bug prompt selects `debugging_bug_fix`.
- Competitor + investor prompt selects relevant modules.
- Source-heavy prompt sets `sourceMode`.
- Unknown prompt returns safe default and low confidence.
- Analyze route saves analysis by `analysisId`.
- Detector unit tests pass.

## Error Cases

- Empty prompt -> 400.
- Prompt too long -> 400 or truncate with warning.
- Unsupported mode -> 400.
- Analysis cannot be saved -> 500 with standard envelope.

## Exit Checklist

- [ ] Normalizer works.
- [ ] Detector works.
- [ ] Workflow picker works.
- [ ] Analyze route works.
- [ ] Fixture prompts pass.
- [ ] Analysis is stored for Phase 9.
- [ ] Detector unit tests pass.
