# Product Context: Work Mode

## Product Name

Working name: **Work Mode**

The app is a Claude-like AI workspace with an additional structured mode for serious work. In Work Mode, the assistant does not immediately produce a final answer. It first creates an editable Work Plan that the user can review, customize, and approve.

## Register

Product UI.

This is not a marketing site. The interface should feel like a focused professional tool: calm, clear, efficient, and trustworthy. Design should serve repeated use, scanning, editing, and decision-making.

## Core Promise

```text
Prompt -> detect work type -> suggest skills/modules -> editable Work Plan -> approval -> final answer -> validation
```

The product gives users control over the answer structure before generation starts.

## Product Positioning

Work Mode is for users who do not want black-box one-shot answers for complex work. It gives them a visible, editable roadmap that guides the final output.

The app should not claim to expose hidden model reasoning or chain-of-thought. The value is an external planning layer:

- Work Plan
- Answer Roadmap
- Blueprint
- Approved structure
- Validation criteria

Avoid language such as:

- Raw thought process
- Model thoughts
- Chain-of-thought
- Hidden reasoning

## Target Users

### Product Manager

Needs:

- PRDs
- Feature specs
- Roadmaps
- User stories
- Requirements
- Metrics
- Risks and open questions

Expects:

- Clear scope
- Assumptions
- Success metrics
- User and business framing

### Researcher

Needs:

- Research reports
- Competitive analysis
- Source-backed claims
- Market landscape
- Synthesis

Expects:

- Evidence needs
- Source mode
- Limitations
- Validation notes

### Developer

Needs:

- Debug plans
- Implementation plans
- Technical architecture
- API and schema outlines
- Test plans

Expects:

- Affected areas
- Edge cases
- Validation steps
- Root cause structure

### Founder / Executive

Needs:

- Investor decks
- Strategy memos
- Market narratives
- Tradeoff analysis

Expects:

- Concise framing
- Strategic recommendations
- Risks
- Decision-ready output

## MVP Workflows

The first prototype should focus on three polished workflows:

1. `slide_deck`
2. `prd_generation`
3. `debugging_bug_fix`

Other workflows can appear as planned capabilities, but the first three should feel complete.

## MVP Skills

Skills are selectable workflow capabilities shown to users.

MVP skills:

- `investor_deck_builder`
- `prd_builder`
- `bug_fix_planner`

Each skill should provide:

- Recommended workflow
- Default modules
- Optional modules
- Roadmap template
- Validation criteria

## Key User Journey

1. User selects Work Mode.
2. User enters a prompt.
3. System detects likely role, artifact, skill, workflow, modules, and source mode.
4. User reviews detection.
5. User changes role/artifact/skill/modules if needed.
6. System creates an editable Work Plan.
7. User edits objective, assumptions, missing context, sections, and validation criteria.
8. User approves the Work Plan.
9. System generates the final answer from the approved snapshot.
10. System validates the answer against the approved Work Plan.

## Product Principles

### 1. Control Before Output

Work Mode should make the user feel in control before generation starts.

### 2. Visible Structure, Not Hidden Reasoning

The roadmap is an external artifact, not the model's private reasoning.

### 3. Explain Just Enough

The UI should show why a workflow or skill was recommended, but avoid long tutorials.

### 4. Safe Defaults

Source-heavy or high-risk prompts should default to visible assumptions, source-needed notes, and validation checks.

### 5. Editable By Default

Every roadmap section should be editable unless it is a protected system field.

### 6. Approval Is A Contract

The final answer should follow the approved Work Plan. Editing after approval resets approval.

## Product Language

Preferred labels:

- Work Mode
- Work Plan
- Answer Roadmap
- Detected role
- Artifact
- Recommended skill
- Suggested modules
- Source mode
- Validation criteria
- Approve Work Plan
- Generate answer
- Validation summary

Avoid labels:

- Raw thought
- CoT
- Chain-of-thought
- Secret reasoning
- Internal reasoning

## Interaction Rules

### Prompt Submission

In Work Mode, prompt submission must not immediately generate the final answer.

### Detection

Detection should show:

- Role
- Artifact
- Skill
- Workflow
- Confidence
- Reason
- Suggested modules
- Source mode

### Skill Selection

Users can change the recommended skill before Work Plan creation.

Changing skill should:

- Recompute modules
- Preserve compatible manual selections
- Update roadmap template
- Reset approval if a plan already exists

### Work Plan Editing

Users can edit:

- Objective
- Assumptions
- Missing context
- Section titles
- Section instructions
- Section order
- Optional sections
- Validation criteria

Users cannot directly edit:

- Analysis ID
- Work Plan ID
- Approved snapshot
- Server version
- Generated output ID

### Approval

Approval freezes a snapshot.

The answer generator must use the approved snapshot, not the mutable draft.

### Validation

Validation should answer:

- Did the answer follow the plan?
- Are required sections missing?
- Are source-needed claims marked?
- Are assumptions visible?
- What should be improved?

## Out Of Scope For MVP

- User authentication
- Billing
- Team workspaces
- Real-time collaboration
- Full RAG
- File upload
- Real PPT export
- Organization-level custom workflow management
- WebSocket collaboration

## Success Metrics

- User can complete Work Mode flow without guidance.
- User edits at least one Work Plan section during test sessions.
- Detection correctly picks one of the three MVP workflows for most fixture prompts.
- Generated answer follows approved Work Plan.
- Validation catches missing sections or source-needed claims.

## Product Risks

- Users may confuse Work Plan with hidden model reasoning.
- Too many workflow options may create decision fatigue.
- The first prototype may overfocus on backend before the editor UX feels good.
- Source-heavy outputs may look authoritative without real sources.

## Design Implication

This is a professional product surface. Prioritize:

- Clarity
- Compact density
- Trust
- Editability
- State visibility
- Calm confidence

Do not design it like a landing page, marketing hero, or decorative AI demo.
