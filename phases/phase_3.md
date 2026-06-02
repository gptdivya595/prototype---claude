# Phase 3: Frontend Work Mode Entry

## Purpose

Add the first Work Mode-specific interaction: after a user submits a prompt, the interface should analyze it and show what the system thinks the user is trying to do.

## Goal

Users should see:

- Detected role.
- Detected artifact.
- Recommended workflow.
- Confidence.
- Reason for the recommendation.
- Ability to override role/artifact/workflow before proceeding.

## Skills To Use

Primary skills:

- `$frontend-design`: Use to build the detection summary UI, override controls, confidence states, and Work Mode entry flow.
- `$impeccable`: Use to make the detection screen understandable without heavy instructional text.

Supporting skills:

- `$llm-testing`: Use to define ambiguous and adversarial prompts that test whether the detection UI handles low confidence correctly.
- `$debugger`: Use to diagnose state-machine bugs between prompt submission, analyzing state, detection summary, and override handling.

Review skills:

- `$backend-developer`: Use to confirm the mock `PromptAnalysis` shape matches the future backend contract.

## Scope

Build the frontend flow using mock analysis data.

Do not build yet:

- Real backend detection.
- Editable Work Plan.
- Answer generation.

## User Flow

```text
User selects Work Mode
User enters prompt
User clicks submit
UI shows analyzing state
UI shows detection summary
User can accept or override role/artifact/workflow
User continues to suggestions
```

## UI States

```ts
type WorkModeUiState =
  | "idle"
  | "analyzing"
  | "reviewing_detection"
  | "error";
```

By Phase 6 this state machine expands. In this phase, keep only the states needed for detection and handoff.

## Detection Summary Content

Show:

- Original prompt.
- Detected role.
- Detected artifact.
- Recommended workflow.
- Confidence.
- Reason.
- Source mode.
- Questions for user, if any.

Example:

```json
{
  "detectedRole": "Researcher",
  "detectedArtifact": "PPT",
  "recommendedWorkflowId": "slide_deck",
  "confidence": 0.88,
  "reason": "The prompt asks for a presentation about competitors for investors.",
  "sourceMode": "source_needed_only"
}
```

## Override Controls

### Role Dropdown

Options:

- Product Manager
- Researcher
- Developer
- Founder
- Business Analyst
- Designer
- Marketer
- Executive
- Unknown

### Artifact Dropdown

Options:

- Code
- PRD
- BRD
- PPT
- Research Report
- Strategy Memo
- Competitive Analysis
- Technical Design
- Data Analysis
- Unknown

### Workflow Dropdown

For MVP:

- Slide Deck / PPT
- PRD Generation
- Debugging / Bug Fix

Later:

- Technical Architecture
- Competitive Analysis
- Research Report

## Mock Analysis Rules

Until backend exists:

```text
if prompt contains "ppt", "slides", or "deck":
  workflow = slide_deck

else if prompt contains "prd" or "product requirements":
  workflow = prd_generation

else if prompt contains "bug", "error", "fix", or "not working":
  workflow = debugging_bug_fix

else:
  workflow = slide_deck or prd_generation with low confidence
```

## Suggested Components

```text
WorkModePanel.tsx
DetectionSummary.tsx
RoleSelector.tsx
ArtifactSelector.tsx
WorkflowSelector.tsx
ConfidenceBadge.tsx
```

## State Model

```ts
type PromptAnalysis = {
  id: string;
  prompt: string;
  detectedRole: string;
  detectedArtifact: string;
  recommendedWorkflowId: string;
  confidence: number;
  reason: string;
  sourceMode: string;
  selectedModuleIds: string[];
  questionsForUser: string[];
  alternatives?: Array<{
    workflowId: string;
    confidence: number;
    reason: string;
  }>;
};

type WorkModeDraft = {
  prompt: string;
  analysis: PromptAnalysis | null;
  roleOverride?: string;
  artifactOverride?: string;
  workflowOverride?: string;
};
```

## Detailed Tasks

### Task 1: Add Work Mode Submit Handler

Behavior:

- If mode is not Work, normal chat placeholder can run.
- If mode is Work, prevent immediate answer generation.
- Set state to `analyzing`.

### Task 2: Add Mock Analyzer

Create a local helper:

```ts
function mockAnalyzePrompt(prompt: string): PromptAnalysis
```

Return different mock results based on prompt keywords.

### Task 3: Render Detection Summary

UI must show:

- A clear "Detected" area.
- Editable role/artifact/workflow controls.
- Confidence indicator.
- Reason text.

### Task 4: Add Continue Action

Button:

```text
Continue to suggestions
```

This moves the UI to Phase 4's suggestions state later.

### Task 5: Add Low-Confidence Handling

If confidence is below `0.65`:

- Show a low-confidence badge.
- Show the top alternative workflow if available.
- Keep the continue button enabled, but ask the user to confirm role/artifact/workflow.
- Use the user's selected override as the source of truth for the next phase.

## Acceptance Criteria

- Work Mode prompt submission does not generate an answer immediately.
- Analyzing state appears.
- Detection summary appears.
- Role/artifact/workflow can be changed.
- Low-confidence state is visually clear.
- Alternative workflow can be displayed when available.
- User override is carried into the next phase.

## Test Prompts

```text
Make a PPT on competitors of Perplexity for investors.
```

```text
Create a PRD for an AI meeting summarizer.
```

```text
Fix the login bug where session is empty after redirect.
```

## Edge Cases

- Empty prompt: disable submit.
- Very short prompt: show low confidence.
- Prompt matches multiple workflows: show recommended workflow plus alternatives.
- User changes workflow: future suggestions should update.
- User selects an alternative workflow: selected module defaults should recompute.

## Exit Checklist

- [ ] Mock analyzer exists.
- [ ] Detection summary UI exists.
- [ ] Overrides work.
- [ ] Low-confidence state exists.
- [ ] Continue action exists.
- [ ] Alternative workflow state exists.
- [ ] Low-confidence confirmation works.
