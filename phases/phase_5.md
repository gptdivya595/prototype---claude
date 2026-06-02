# Phase 5: Frontend Editable Work Plan

## Purpose

Build the core differentiator of the product: an editable Work Plan that appears before answer generation.

## Goal

Users should be able to review and edit the roadmap the assistant will follow before approving it.

## Skills To Use

Primary skills:

- `$frontend-design`: Use to build the editable Work Plan editor, section controls, validation messaging, and roadmap customization UI.
- `$impeccable`: Use to harden the editor for empty states, accessibility, edge cases, long content, and approval-blocking errors.

Supporting skills:

- `$backend-developer`: Use to keep the frontend update payload compatible with backend versioning and validation.
- `$debugger`: Use for editor state bugs, section reorder bugs, duplicate IDs, and approval reset issues.
- `$llm-testing`: Use to create edge-case roadmaps that test empty sections, conflicting instructions, prompt injection text, and oversized plans.

Review skills:

- `$design-taste-frontend`: Use lightly for polish of editor density, hierarchy, and interaction rhythm.

## Scope

Build:

- Work Plan editor.
- Editable objective.
- Editable assumptions.
- Editable missing context.
- Editable sections.
- Editable validation criteria.
- Add/remove/reorder section controls.
- Draft/dirty state.

Do not build yet:

- Final answer generation.
- Backend saving.
- Real validation.

## Work Plan Data Shape

```ts
type WorkPlan = {
  id: string;
  status: "draft" | "approved" | "generated";
  prompt: string;
  role: string;
  artifact: string;
  workflowId: string;
  objective: string;
  audience?: string;
  sourceMode: string;
  assumptions: string[];
  missingContext: string[];
  sections: WorkPlanSection[];
  validationCriteria: string[];
  selectedModuleIds: string[];
  version: number;
};

type WorkPlanSection = {
  id: string;
  title: string;
  instructions: string;
  required: boolean;
  sourceRefs?: string[];
};
```

Backend responses should wrap this in `WorkPlanRecord`:

```ts
type WorkPlanRecord = {
  workPlanId: string;
  conversationId: string;
  analysisId: string;
  status: "draft" | "approved" | "generated";
  version: number;
  plan: WorkPlan;
  approvedPlan?: WorkPlan;
};
```

The editor edits `record.plan`, not the record wrapper.

## Validation Rules Before Approval

Frontend should block approval when:

- Objective is empty.
- No roadmap sections exist.
- A required section has an empty title.
- A required section has empty instructions.
- `sourceMode` is `web_search` or `user_uploaded` but the feature is disabled.
- A selected skill requires a section that is missing.

Frontend should warn, not block, when:

- Missing context is still unresolved.
- `sourceMode` is `source_needed_only`.
- User removed all optional modules.
- User switches skill after editing roadmap.

## UI Layout

Recommended layout:

```text
Work Plan Header
  Role / Artifact / Workflow chips
  Status chip

Objective
  Editable textarea

Assumptions
  Editable list

Missing Context
  Editable list

Roadmap Sections
  Section cards or rows
  Title input
  Instructions textarea
  Required indicator
  Move up/down
  Remove

Validation Criteria
  Editable checklist/list
```

## Work Plan Templates

### `slide_deck`

Sections:

- Deck goal.
- Audience.
- Narrative arc.
- Slide-by-slide outline.
- Key visuals.
- Data or source needs.
- Final call to action.

If `competitor_analysis` selected, add:

- Competitor set.
- Comparison criteria.
- Competitive landscape slide.

If `investor_framing` selected, add:

- Investor narrative.
- Market opportunity.
- Moat or differentiation.

### `prd_generation`

Sections:

- Problem statement.
- Target users.
- User personas.
- Goals and non-goals.
- User stories.
- Functional requirements.
- Non-functional requirements.
- MVP scope.
- Success metrics.
- Risks.
- Open questions.

### `debugging_bug_fix`

Sections:

- Symptom summary.
- Reproduction steps.
- Suspected causes.
- Files or services to inspect.
- Debugging plan.
- Fix plan.
- Regression tests.
- Verification checklist.

## Roadmap Customization Rules

Users can edit:

- Objective.
- Assumptions.
- Missing context.
- Section titles.
- Section instructions.
- Section order.
- Optional sections.
- Validation criteria.
- Selected modules before approval.

Users cannot directly edit:

- Work Plan ID.
- Analysis ID.
- Approved snapshot.
- Generated output ID.
- Server version.
- Canonical workflow/module/skill IDs except through selection controls.

If the user switches skill after editing:

```text
Show confirmation.
Keep compatible custom sections.
Add missing required sections from the new skill.
Archive incompatible sections in UI or ask user to remove them.
Reset approval to draft.
```

## Autosave Rules

MVP editor should prepare for autosave:

```text
Debounce draft saves by 800-1200ms.
Show Saving, Saved, and Save failed states.
Use WorkPlanRecord.version for stale-write protection.
Keep local unsaved edits if backend save fails.
```

If backend is not integrated yet, simulate these states in the mock client.

## Detailed Tasks

### Task 1: Create Mock Work Plan Builder

Create:

```ts
function buildMockWorkPlan(input: {
  prompt: string;
  analysis: PromptAnalysis;
  selectedModuleIds: string[];
  sourceMode: string;
}): WorkPlan
```

### Task 2: Render Work Plan Header

Show:

- Workflow name.
- Role.
- Artifact.
- Source mode.
- Status.

### Task 3: Build Editable Lists

For assumptions, missing context, and validation criteria:

- Add item.
- Edit item.
- Remove item.

### Task 4: Build Section Editor

Each section:

- Title input.
- Instructions textarea.
- Required toggle or required badge.
- Move up/down.
- Remove button.

Required section rule:

- Required sections can be edited but not removed in MVP, or removal should show a warning.

### Task 5: Track Dirty State

Any edit should mark:

```ts
isDirty = true
approvalStatus = "draft"
```

### Task 6: Prepare Backend Patch Shape

Even before backend integration, edits should be compatible with:

```ts
type UpdateWorkPlanRequest = {
  version: number;
  plan: WorkPlan;
};
```

The frontend must keep the latest server version once backend integration begins.

## Acceptance Criteria

- User can edit objective.
- User can edit assumptions.
- User can edit missing context.
- User can edit roadmap sections.
- User can add/remove/reorder sections.
- User can edit validation criteria.
- Work Plan state stays in memory.
- The UI clearly shows draft status.
- Approval-blocking validation errors are visible.
- Work Plan shape is compatible with backend PATCH route.
- Editor is ready for autosave and stale-version handling.

## Edge Cases

- Empty objective: show validation warning.
- No sections: prevent approval later.
- Very long section instructions: textarea expands or scrolls cleanly.
- Removing required section: prevent or warn.
- Reordering sections should not change section IDs.
- Duplicate section IDs should never be created.
- Switching skill after edits should require confirmation.
- Very large roadmap should show a warning before generation.
- Browser refresh may lose data until backend persistence is enabled; show this as known MVP limitation if needed.

## Test Cases

1. Create `slide_deck` Work Plan and add a new "Appendix" section.
2. Create `prd_generation` Work Plan and edit success metrics.
3. Create `debugging_bug_fix` Work Plan and add a "Logs to inspect" section.

## Exit Checklist

- [ ] Work Plan builder exists.
- [ ] Editor renders all fields.
- [ ] Lists are editable.
- [ ] Sections are editable.
- [ ] Dirty state works.
- [ ] Approval validation rules exist.
- [ ] Update payload shape is compatible with backend.
- [ ] Skill-switch confirmation exists.
- [ ] Roadmap customization rules are enforced.
- [ ] Autosave state model exists.
