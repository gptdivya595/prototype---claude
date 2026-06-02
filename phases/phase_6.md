# Phase 6: Frontend Approval And Answer UI

## Purpose

Complete the frontend-only Work Mode loop using mock generation. At the end of this phase, the app should demonstrate the entire user experience without a backend.

## Goal

Users should be able to:

1. Submit a prompt.
2. Review detection.
3. Select suggestions.
4. Edit Work Plan.
5. Approve Work Plan.
6. Generate a mock answer.
7. Review validation feedback.

## Skills To Use

Primary skills:

- `$frontend-design`: Use to build approval controls, answer panel, validation panel, loading states, and backend-ready error states.
- `$impeccable`: Use to audit the full frontend-only flow for clarity, state transitions, responsive behavior, and user trust.

Supporting skills:

- `$debugger`: Use to diagnose approval reset bugs, stale answer bugs, and state-machine errors.
- `$llm-testing`: Use to define validation scenarios for source-needed claims, missing required sections, and unsafe generated answers.
- `$backend-developer`: Use to ensure the mock client abstraction can be swapped for HTTP calls without UI rewrites.

Review skills:

- `$design-taste-frontend`: Use for final visual polish before backend integration.

## Scope

Build:

- Approval state.
- Approval snapshot.
- Generate button.
- Mock answer generator.
- Answer panel.
- Validation panel.
- Reset approval after edits.

Do not build yet:

- Real backend calls.
- OpenAI integration.
- Persistence.

## Approval Rules

```text
Only draft Work Plans can be approved.
Only approved Work Plans can generate answers.
Editing an approved Work Plan resets it to draft.
Generated answers must be based on the approved snapshot.
```

## UI States

```ts
type WorkModeUiState =
  | "idle"
  | "analyzing"
  | "reviewing_detection"
  | "choosing_suggestions"
  | "editing_plan"
  | "approved"
  | "generating"
  | "complete"
  | "error";
```

## Components

```text
ApprovalBar
AnswerPanel
ValidationPanel
GenerationControls
```

## Backend Swap Boundary

By the end of this phase, all mock operations should go through a single client abstraction:

```ts
workModeClient.analyzePrompt()
workModeClient.createWorkPlan()
workModeClient.updateWorkPlan()
workModeClient.approveWorkPlan()
workModeClient.generateAnswer()
```

This prevents Phase 11 from requiring a large frontend rewrite.

## Cancel And Retry Behavior

Even with mock generation, include UI states for:

- Cancel generation.
- Retry failed generation.
- Partial answer marked incomplete.

MVP implementation:

```text
Mock cancel can stop the simulated timeout.
Real backend later uses AbortController or SSE disconnect.
```

## Mock Answer Generator

Create:

```ts
function generateMockAnswer(approvedPlan: WorkPlan): string
```

Behavior:

- Use Work Plan section titles as final answer sections.
- Include assumptions.
- Include source-needed notes when `sourceMode` is `source_needed_only`.
- For debugging workflow, format answer as diagnosis/fix/test plan.
- For PRD workflow, format answer as product document.
- For slide deck workflow, format answer as slide-by-slide outline.

## Mock Validator

Create:

```ts
function validateMockAnswer(plan: WorkPlan, answer: string): ValidationResult
```

Validation checks:

- Required section titles appear in answer.
- Source-needed mode produces source-needed notes.
- Answer is not empty.
- Validation criteria are referenced.

## UI Details

### Approval Bar

Show:

- Draft/Approved/Generated status.
- Approve button.
- Generate button.
- Warning if plan changed after approval.

### Answer Panel

Show:

- Final answer.
- Copy button optional.
- Generated from approved roadmap indicator.

### Validation Panel

Show:

- Quality score.
- Missing sections.
- Unsupported/source-needed claims.
- Recommended fixes.

## Detailed Tasks

### Task 1: Add Approval Snapshot

State:

```ts
approvedWorkPlan: WorkPlan | null
```

On approval:

- Deep clone current Work Plan.
- Set status to approved.

### Task 2: Reset Approval On Edit

If plan changes after approval:

- Clear `approvedWorkPlan`.
- Set status to draft.
- Hide generated answer or mark it stale.

### Task 3: Add Mock Generation

On generate:

- Require approved snapshot.
- Set `generating`.
- Simulate loading delay.
- Create answer.
- Run validator.
- Set complete.

### Task 4: Render Validation

Use compact, scannable UI.

### Task 5: Add Backend-Ready Error States

Even with mocks, design errors that match backend failures:

- Invalid prompt.
- Work Plan validation failed.
- Stale Work Plan version.
- Generate attempted before approval.
- Model/API unavailable.

### Task 6: Add Analytics Event Hooks

Add no-op analytics function:

```ts
trackWorkModeEvent(eventName, payload)
```

Use it for:

- Prompt submitted.
- Analysis completed.
- Module toggled.
- Work Plan approved.
- Generation started.
- Generation cancelled.
- Generation completed.
- Generation failed.

## Acceptance Criteria

- Generate button is disabled until approval.
- Editing after approval resets approval.
- Mock answer follows the approved Work Plan.
- Validation panel appears after generation.
- Full Work Mode demo works without backend.
- Mock client can later be replaced by HTTP client without changing UI components.
- Error states exist for backend integration.
- Cancel/retry states exist for generation.
- Analytics hooks exist, even if they only log in development.

## Test Cases

1. Approve a PRD plan and generate answer.
2. Edit after approval and confirm generate is disabled.
3. Approve a deck plan with source mode and confirm source-needed notes appear.
4. Generate debugging plan and confirm tests are included.
5. Simulate stale version error and confirm UI can recover.
6. Cancel mock generation and confirm UI returns to approved state.

## Exit Checklist

- [ ] Approval works.
- [ ] Generate gating works.
- [ ] Mock answer works.
- [ ] Mock validation works.
- [ ] Full frontend-only demo works.
- [ ] Mock client abstraction is used.
- [ ] Backend-like errors render cleanly.
- [ ] Cancel/retry generation states exist.
- [ ] Analytics hooks added.
