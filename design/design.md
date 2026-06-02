# Design System: Work Mode

## Design Read

Reading this as a professional AI workbench for product managers, researchers, developers, and founders, with a calm product-tool language, leaning toward a refined, high-trust workspace with dense but readable controls.

## Design Register

Product UI.

Design serves the task. The app should feel polished and distinctive, but not theatrical. Users are here to think, edit, approve, and produce complex work.

## Design Goals

- Make Work Mode feel controlled and trustworthy.
- Make the roadmap editing experience obvious and efficient.
- Make detection and suggestions scannable.
- Make approval state impossible to miss.
- Keep the interface calm enough for long work sessions.
- Avoid generic AI-purple chatbot aesthetics.

## Visual Direction

### Tone

Quiet, precise, editorially structured, and work-focused.

The UI should feel closer to a well-designed professional writing and planning tool than a flashy chatbot.

### Scene

A user is working on a laptop during a focused planning session. They need to inspect structure, make decisions, and trust that the assistant will follow the approved plan.

This favors:

- Light theme by default
- Soft tinted neutral background
- Strong readable text
- Crisp borders
- Minimal glow
- Clear state chips
- Restrained motion

## Theme Strategy

Use a restrained light theme for MVP.

Dark mode can come later, but should not be the first design target.

## Color System

Use tinted neutrals with one strategic accent.

### Tokens

```css
:root {
  --wm-bg: #f6f5f1;
  --wm-surface: #fbfaf7;
  --wm-surface-strong: #ffffff;
  --wm-surface-muted: #efeee9;
  --wm-border: #dad7ce;
  --wm-border-strong: #b8b3a7;

  --wm-text: #24231f;
  --wm-text-muted: #69665d;
  --wm-text-soft: #8a8579;

  --wm-accent: #315f54;
  --wm-accent-strong: #21483f;
  --wm-accent-soft: #dce9e3;

  --wm-warning: #9a5a16;
  --wm-warning-soft: #f5e5ca;
  --wm-danger: #9f3131;
  --wm-danger-soft: #f1d6d6;
  --wm-success: #31694d;
  --wm-success-soft: #dcece2;

  --wm-focus: #315f54;
}
```

### Usage

- Background: `--wm-bg`
- Main panels: `--wm-surface`
- Editable fields: `--wm-surface-strong`
- Primary actions: `--wm-accent`
- Status chips: soft semantic colors
- Borders: subtle but visible

### Avoid

- Purple-blue gradients
- Neon glows
- Heavy glassmorphism
- Monochrome gray-only interface
- Too many accent colors

## Typography

Use a clean sans-serif system with strong hierarchy. The app should not feel like a generic default, but it also should not sacrifice readability.

Preferred stack:

```css
font-family:
  "Satoshi",
  "Aptos",
  "Segoe UI",
  system-ui,
  sans-serif;
```

Fallback is acceptable if custom fonts are not installed.

### Type Scale

```css
--wm-text-xs: 12px;
--wm-text-sm: 13px;
--wm-text-base: 15px;
--wm-text-md: 16px;
--wm-text-lg: 18px;
--wm-text-xl: 22px;
--wm-text-2xl: 28px;
```

### Rules

- Body text: 15px or 16px.
- Panel labels: 12px or 13px.
- Section titles: 16px to 18px.
- Avoid huge hero-like type inside app surfaces.
- No negative letter spacing.
- Keep line length readable.

## Spacing

Use an 8px rhythm.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 40px;
```

## Radius

Use restrained radius.

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
```

Rules:

- Buttons: 6px.
- Inputs: 6px.
- Cards/panels: 8px max.
- Avoid pill-shaped controls except compact status chips.

## Layout

### App Shell

```text
Sidebar | Main Work Area

Main Work Area:
  Header / Mode controls
  Conversation or Work Mode panels
  Prompt composer
```

### Work Mode Layout

Recommended desktop layout:

```text
Top: prompt and detection summary
Middle: skill/modules and Work Plan editor
Right or lower panel: validation/answer
Bottom: composer or action bar
```

For MVP, a single-column stacked flow is acceptable:

```text
Prompt
Detection
Suggestions
Work Plan
Approval
Answer
Validation
```

### Mobile

Use a single-column flow.

Requirements:

- Composer remains reachable.
- Section editor controls do not overflow.
- Long labels wrap gracefully.
- Sidebar collapses.

## Components

### Mode Selector

Use compact segmented buttons.

States:

- Default
- Hover
- Selected
- Disabled

Work Mode selected state should be clear but not loud.

### Prompt Composer

Should feel like a serious input tool.

Requirements:

- Multiline.
- Clear submit action.
- Disabled state for empty prompt.
- Loading state while analyzing.
- No decorative placeholder poetry.

### Detection Summary

Show:

- Detected role
- Artifact
- Skill
- Workflow
- Confidence
- Reason

Use compact rows or chips.

Confidence states:

- High: calm success chip
- Medium: neutral chip
- Low: warning chip with confirmation prompt

### Skill Selector

Skill selector should show:

- Recommended skill
- Alternative skills
- Short descriptions
- Matched reason

Avoid overwhelming users with too many options.

### Suggestion Checklist

Use checkboxes for modules.

Each item:

- Label
- Short description
- Selected state
- Optional reason

Required modules should be visually marked.

### Work Plan Editor

This is the most important surface.

Each section should have:

- Title input
- Instructions textarea
- Required/optional marker
- Move controls
- Remove control for optional sections

Editor states:

- Draft
- Approved
- Edited after approval
- Generated

### Approval Bar

The approval bar should be sticky or visually persistent near the Work Plan.

Show:

- Current status
- Approve Work Plan
- Generate answer
- Warning when edits reset approval

### Answer Panel

Answer should be readable and structured.

Show:

- Generated from approved Work Plan
- Final answer
- Optional copy action

### Validation Panel

Use concise status rows.

Show:

- Plan match
- Missing sections
- Unsupported/source-needed claims
- Quality score
- Recommended fixes

## Motion

Use restrained motion.

Allowed:

- Small fade/slide for panel transitions.
- Loading shimmer or spinner.
- Subtle checkbox transitions.
- Smooth expand/collapse for sections.

Avoid:

- Bouncy motion.
- Constant animated backgrounds.
- Decorative particles.
- Slow cinematic transitions.

Respect reduced motion.

## Accessibility

Requirements:

- Target WCAG 2.2 AA for core flows.
- All buttons have accessible labels.
- Inputs have labels or `aria-label`.
- Keyboard can reach all major controls.
- Focus states are visible.
- Color is not the only signal for status.
- Error messages are close to the relevant control.
- Validation warnings are readable by screen readers.
- Dynamic save and generation states are announced with accessible live regions.
- Focus moves intentionally when detection, Work Plan, or validation panels appear.

## Empty States

Empty states should be direct and useful.

Examples:

```text
Start with a prompt. Work Mode will create an editable plan before generating.
```

```text
No Work Plan yet.
```

Avoid cute or overly clever empty-state copy.

## Error States

Error messages should be specific and recoverable.

Examples:

```text
The Work Plan changed after approval. Approve it again before generating.
```

```text
This prompt needs sources, but live source retrieval is not enabled. Claims will be marked source-needed.
```

```text
The backend is unavailable. You can keep editing the draft locally.
```

## Edge Case UI Rules

### Low Confidence Detection

Show alternatives and ask user to confirm.

### Unknown Skill Or Module

Hide unknown values and log in development.

### Required Section Empty

Block approval and show inline warning.

### Edit After Approval

Reset status to draft and mark old answer as stale.

### Web Search Disabled

Disable `web_search` source mode or convert it to `source_needed_only`.

### Very Large Roadmap

Show cost/length warning before generation.

## Do Not Use

- Nested cards
- Decorative gradient orbs
- Purple AI glow
- Landing-page hero composition
- Overly rounded controls
- Huge typography in editor panels
- Vague labels like "enhance" or "deep mode"
- In-app tutorial paragraphs

## Design QA Checklist

- [ ] App feels like a work tool, not a marketing page.
- [ ] Work Mode flow is understandable without a tutorial.
- [ ] Prompt, detection, suggestions, roadmap, approval, answer, and validation are visually distinct.
- [ ] Approval state is impossible to miss.
- [ ] Required section errors are visible.
- [ ] Source-needed warnings are clear.
- [ ] Mobile layout is usable.
- [ ] No text overlaps.
- [ ] Keyboard navigation works.
- [ ] OpenAI key or backend internals are never shown in UI.
