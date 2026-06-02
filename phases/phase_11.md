# Phase 11: Backend Approval, Answer, And Validation

## Purpose

Complete the backend Work Mode lifecycle from draft Work Plan to approved snapshot, final answer, and validation result.

## Goal

The backend should enforce the core product contract:

```text
No approved Work Plan -> no final answer
```

## Skills To Use

Primary skills:

- `$backend-developer`: Use to implement update, approve, generate, validation, storage, versioning, and lifecycle routes.
- `$machine-learning-engineer`: Use to review answer generation latency, timeout handling, fallback generation, and production-serving constraints.

Supporting skills:

- `$llm-testing`: Use to test answer generation safety, unsupported claims, source-needed behavior, prompt injection inside edited roadmaps, and validation reliability.
- `$debugger`: Use to diagnose stale-version conflicts, approval reset bugs, generation failures, and frontend/backend lifecycle mismatches.
- `$rag-architect`: Use if source-backed validation or retrieval-aware generation is added.

Review skills:

- `$frontend-design`: Use to verify backend errors map cleanly to frontend error states.
- `$impeccable`: Use to review final answer and validation presentation if UI adjustments are needed.

## Scope

Build:

- Work Plan update route.
- Approval route.
- Immutable approved snapshot.
- Answer generator.
- Validator.
- Output storage.
- Version/stale-write protection.
- Real frontend HTTP client replacement.
- Optional SSE streaming plan for answer generation.
- Cancel/abort generation behavior.

## Routes

### `PATCH /api/work-mode/work-plans/:id`

Purpose:

- Save user edits.

Rules:

- Requires client version.
- Reject stale version.
- Validate full Work Plan.
- If plan was approved, reset to draft.
- Increment version.

### `POST /api/work-mode/work-plans/:id/approve`

Purpose:

- Freeze Work Plan for generation.

Rules:

- Draft only.
- Required sections cannot be empty.
- Copies `plan_json` to `approved_plan_json`.
- Sets status to `approved`.

### `POST /api/work-mode/work-plans/:id/generate`

Purpose:

- Generate final answer.

Rules:

- Approved only.
- Must use `approved_plan_json`.
- Should not use mutable draft plan.
- Runs validator after generation.
- Stores output.

Response shape:

```json
{
  "answerId": "ans_123",
  "workPlanId": "wp_123",
  "answer": "Final generated answer...",
  "validation": {
    "matchesApprovedPlan": true,
    "missingSections": [],
    "unsupportedClaims": [],
    "qualityScore": 8.5,
    "recommendedFixes": []
  }
}
```

### Optional: `POST /api/work-mode/work-plans/:id/generate-stream`

Use only if streaming is needed for UX.

Transport:

```text
SSE for one-way answer streaming.
WebSocket is not required for MVP.
```

SSE events:

```text
generation.started
generation.delta
generation.completed
generation.validation_started
generation.validation_completed
generation.error
```

### Cancel Generation

For non-streaming HTTP:

- Frontend uses `AbortController`.
- Backend should detect disconnect where possible.
- If cancelled, do not mark Work Plan as generated.

For SSE:

- Closing the stream cancels client consumption.
- Backend should stop work when possible.

## Answer Generation Prompt Rules

System rules:

```text
Generate the final answer using the approved external Work Plan.
Do not reveal hidden chain-of-thought.
Follow the approved sections and validation criteria.
If sourceMode is source_needed_only, mark unverifiable factual claims as source-needed.
```

Input:

- Original prompt.
- Approved Work Plan.
- Selected module IDs.
- Source mode.
- Output preferences.

## Validator Rules

Validator checks:

- Required sections included.
- Artifact format followed.
- Selected modules addressed.
- Assumptions included.
- Missing context handled.
- Source-needed claims marked.
- Answer is useful for detected role.

Validation output:

```json
{
  "matchesApprovedPlan": true,
  "missingSections": [],
  "unsupportedClaims": [],
  "qualityScore": 8.5,
  "recommendedFixes": []
}
```

## Storage Model

```ts
type WorkPlanRecord = {
  id: string;
  status: "draft" | "approved" | "generated";
  version: number;
  planJson: WorkPlan;
  approvedPlanJson?: WorkPlan;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
};

type GeneratedOutput = {
  id: string;
  workPlanId: string;
  answer: string;
  validation: ValidationResult;
  createdAt: string;
};
```

## Detailed Tasks

### Task 1: Implement Update Route

Validate:

- Work Plan exists.
- Version is current.
- Body matches schema.

### Task 2: Implement Approval Route

Validate:

- Plan exists.
- Plan is draft.
- Objective is not empty.
- At least one section exists.
- Required sections have title and instructions.

### Task 3: Implement Answer Generator

Feature flag:

```env
USE_LLM_ANSWER=true
```

Fallback:

- Template-based answer generation if disabled.

### Task 4: Implement Validator

Can be:

- Deterministic for MVP.
- LLM-assisted later.

Validator must be deterministic at minimum. If LLM validation is added, it should also use structured output and fall back to deterministic validation.

### Task 5: Connect Frontend To Real Backend

Replace mock:

- Analyze.
- Create Work Plan.
- Patch edits.
- Approve.
- Generate.

### Task 6: Add Request Lifecycle Tests

Add a script or manual test checklist:

```text
analyze -> create work plan -> patch -> approve -> generate
```

Confirm every step uses the standard API envelope.

### Task 7: Decide Streaming Implementation

For MVP:

- Keep normal JSON generation unless answer latency feels bad.
- If streaming is added, use SSE.
- Do not add WebSocket unless realtime collaboration exists.

### Task 8: Add Full Integration Tests

Automate or script:

- Analyze.
- Create Work Plan.
- Patch.
- Approve.
- Generate.
- Validate.
- Cancel or simulate cancellation.

## Acceptance Criteria

- Draft plans cannot generate answers.
- Approved snapshot is immutable.
- Stale edits are rejected.
- Editing approved plan resets approval.
- Answer follows approved plan.
- Validation is returned with answer.
- Frontend full flow works against backend.
- Full lifecycle test passes using one smoke-test prompt.
- LLM answer failure falls back to template answer or returns readable error.
- Streaming decision is documented in code or README.
- Cancel generation behavior is implemented or explicitly deferred.
- Full lifecycle integration test exists.

## Error Cases

- Unknown Work Plan -> 404.
- Generate draft plan -> 409.
- Stale edit -> 409.
- Invalid Work Plan -> 422.
- OpenAI failure -> fallback or 500 with readable error.
- Validator failure -> return answer with validation error note, not blank screen.
- OpenAI fails mid-generation -> keep partial answer if available and mark incomplete.

## Test Cases

1. Create Work Plan, approve, generate.
2. Try generate before approval, expect 409.
3. Approve, edit, confirm approval resets.
4. Send stale version update, expect 409.
5. Generate with `source_needed_only`, confirm source-needed notes.

## Exit Checklist

- [x] Update route works.
- [x] Approval route works.
- [x] Generate route works.
- [x] Validator works.
- [x] Frontend uses real backend.
- [x] Full lifecycle test passes.
- [x] Validator fallback works.
- [x] Streaming decision implemented or explicitly deferred.
- [x] Cancel generation behavior implemented or deferred.
- [x] Integration test script exists.

## Implementation Notes

- Backend lifecycle service: `backend/services/workPlanLifecycle.ts`.
- Deterministic answer fallback: `backend/services/answerGenerator.ts`.
- Deterministic validation: `backend/services/answerValidator.ts`.
- Frontend API client: `frontend/src/App.tsx` using `VITE_WORK_MODE_API_BASE` or `http://127.0.0.1:8787/api/work-mode`.
- Transport: HTTP JSON for MVP. SSE remains a future upgrade and WebSocket is not used.
- OpenAI key use: backend only through `.env`; frontend never reads `OPENAI_API_KEY`.
- Optional answer LLM flag: `USE_LLM_ANSWER=true`; failures fall back to deterministic generation.
- Lifecycle test: `npm run test:lifecycle`.
