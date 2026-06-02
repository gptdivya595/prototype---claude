# Phase 2: Frontend Shell

## Purpose

Build the base Claude-like application shell that will host normal chat modes and Work Mode. This phase is about structure, layout, and interaction foundation, not AI behavior.

## Goal

Users should be able to open the app, see a polished chat workspace, select a mode, type a prompt, and understand that Work Mode is available.

## Skills To Use

Primary skills:

- `$frontend-design`: Use to build the Claude-like shell, layout, responsive behavior, mode selector, and prompt composer.
- `$impeccable`: Use to shape and audit the product UI for hierarchy, accessibility, responsive behavior, empty states, and polish.

Supporting skills:

- `$design-taste-frontend`: Use for visual taste checks so the app shell does not look generic or templated.
- `$debugger`: Use when layout, state, or responsive behavior breaks during implementation.

Review skills:

- `$backend-developer`: Use only to verify the frontend mock client boundary will later align with backend routes.

## Scope

Build:

- App shell.
- Sidebar.
- Main conversation area.
- Header or top control area.
- Mode selector.
- Prompt composer.
- Responsive behavior.
- Accessibility baseline.
- Visual verification checklist.

Do not build yet:

- Work Plan editor.
- Backend integration.
- OpenAI calls.
- Real conversation persistence.

## UI Regions

### 1. Sidebar

Purpose:

- Provide Claude-like workspace structure.
- Show placeholder conversations or navigation.

Elements:

- App name or compact brand mark.
- New chat button.
- Conversation list placeholder.
- Optional settings/profile area.

States:

- Desktop: visible left column.
- Mobile: collapsible or hidden behind menu button.

### 2. Main Header

Purpose:

- Show current mode.
- Provide mode switching.

Elements:

- Mode selector.
- Optional current conversation title.
- Optional action buttons.

### 3. Conversation Area

Purpose:

- Display empty state and later messages/workflow panels.

Elements:

- Empty state prompt.
- Placeholder message list.
- Work Mode panels in later phases.

### 4. Prompt Composer

Purpose:

- Main input point.

Elements:

- Multiline textarea.
- Submit button.
- Mode indicator.
- Optional small source/context controls later.

## Mode Selector

Modes:

```text
Low
Medium
High
Max
Thinking
Work
```

Behavior:

- Only `Work` changes the flow in the prototype.
- Other modes can remain visual selections.
- The selected mode should persist in local component state.

## Suggested Components

```text
frontend/src/components/
  AppShell.tsx
  Sidebar.tsx
  ModeSelector.tsx
  ConversationArea.tsx
  PromptComposer.tsx
```

If the current app is still in a single `App.tsx`, keep components internal first and split later.

## State Model

Minimum frontend state:

```ts
type Mode = "low" | "medium" | "high" | "max" | "thinking" | "work";

type AppState = {
  mode: Mode;
  prompt: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
  }>;
};
```

## Shared Contract Preparation

Even though this phase is frontend-only, define a placeholder API client boundary now:

```ts
type WorkModeClient = {
  analyzePrompt: (prompt: string) => Promise<PromptAnalysis>;
  createWorkPlan: (input: CreateWorkPlanInput) => Promise<WorkPlan>;
  updateWorkPlan: (id: string, plan: WorkPlan) => Promise<WorkPlan>;
  approveWorkPlan: (id: string) => Promise<WorkPlan>;
  generateAnswer: (id: string) => Promise<GeneratedAnswer>;
};
```

For Phases 2-6, this can point to mock functions. In Phase 11, the same interface should point to the real backend.

## Detailed Tasks

### Task 1: Inspect Existing App

Review:

- `frontend/src/App.tsx`
- `frontend/src/index.css`
- Tailwind config
- Existing styles and components

Goal:

- Avoid fighting the current prototype.
- Keep the shell consistent with existing visual direction.

### Task 2: Build Layout

Create a full-height layout:

```text
App
  Sidebar
  Main
    Header
    ConversationArea
    PromptComposer
```

Requirements:

- Full viewport height.
- Prompt composer anchored near bottom.
- Conversation area scrolls.
- Sidebar does not squeeze main content on small screens.

### Task 3: Build Mode Selector

Requirements:

- All modes visible on desktop.
- Compact wrapping or horizontal scroll on mobile.
- Work Mode should be visually distinct when selected.
- Use button semantics.

### Task 4: Build Prompt Composer

Requirements:

- Multiline input.
- Submit button.
- Enter behavior can be simple for MVP.
- Disabled state when prompt is empty.
- Prompt state is controlled.

### Task 5: Add Responsive Pass

Check:

- 1440px desktop.
- 1024px tablet.
- 390px mobile.

### Task 6: Add Accessibility Baseline

Requirements:

- Buttons have accessible labels.
- Mode selector uses button semantics.
- Textarea has a label or `aria-label`.
- Focus states are visible.
- Keyboard navigation can reach mode selector, textarea, and submit button.

### Task 7: Add Visual QA Checklist

Before closing the phase, check:

- No text overlaps.
- Long prompt text does not break composer layout.
- Sidebar does not cover composer on mobile.
- Mode selector wraps or scrolls cleanly.

## Acceptance Criteria

- App has a polished chat shell.
- User can select Work Mode.
- User can type a prompt.
- Submit button becomes enabled with text.
- Layout works on desktop and mobile.
- No text overlaps.
- No backend is required.
- Keyboard navigation works for core controls.
- A mock API/client boundary exists for later backend swap.

## Test Cases

Manual:

1. Open app.
2. Select each mode.
3. Type a long prompt.
4. Resize to mobile width.
5. Confirm composer remains usable.

## Risks

- Overbuilding the sidebar before core Work Mode exists.
- Making the UI look like a landing page instead of a tool.
- Letting long mode labels overflow on mobile.

## Exit Checklist

- [ ] Sidebar exists.
- [ ] Main chat area exists.
- [ ] Mode selector works.
- [ ] Prompt composer works.
- [ ] Responsive layout checked.
- [ ] Accessibility baseline checked.
- [ ] Mock client boundary created.
