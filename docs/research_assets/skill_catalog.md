# Skill Catalog Draft

## Purpose

Skills are user-visible workflow capabilities. They are backed by workflows, modules, and roadmap templates.

## MVP Skills

### `investor_deck_builder`

Label:

```text
Investor Deck Builder
```

Description:

```text
Creates an investor-facing slide deck roadmap.
```

Workflow:

```text
slide_deck
```

Supported roles:

- Founder
- Researcher
- Product Manager
- Executive

Supported artifacts:

- PPT

Default modules:

- assumptions
- validation_checklist

Optional modules:

- competitor_analysis
- market_landscape
- investor_framing
- sources_required
- metrics
- risk_analysis

Default sections:

- Deck goal
- Audience
- Narrative arc
- Slide-by-slide outline
- Key visuals
- Data or source needs
- Final call to action

Validation criteria:

- Final answer is structured as a slide-by-slide deck outline.
- Audience is explicit.
- Source-needed claims are marked.
- Investor framing appears when selected.

### `prd_builder`

Label:

```text
PRD Builder
```

Description:

```text
Creates a structured product requirements roadmap.
```

Workflow:

```text
prd_generation
```

Supported roles:

- Product Manager
- Founder

Supported artifacts:

- PRD

Default modules:

- assumptions
- user_personas
- metrics
- risk_analysis
- validation_checklist

Optional modules:

- competitor_analysis
- implementation_plan
- sources_required

Default sections:

- Problem statement
- Target users
- User personas
- Goals and non-goals
- User stories
- Functional requirements
- Non-functional requirements
- MVP scope
- Success metrics
- Risks
- Open questions

Validation criteria:

- Final answer is structured as a PRD.
- Scope is explicit.
- Success metrics are measurable.
- Risks and open questions are included.

### `bug_fix_planner`

Label:

```text
Bug Fix Planner
```

Description:

```text
Creates a debugging and verification roadmap.
```

Workflow:

```text
debugging_bug_fix
```

Supported roles:

- Developer

Supported artifacts:

- Code

Default modules:

- root_cause_analysis
- test_cases
- validation_checklist
- risk_analysis

Optional modules:

- api_examples
- database_schema
- implementation_plan

Default sections:

- Symptom summary
- Reproduction steps
- Suspected causes
- Files or services to inspect
- Debugging plan
- Fix plan
- Regression tests
- Verification checklist

Validation criteria:

- Final answer separates diagnosis, fix plan, and tests.
- Reproduction assumptions are visible.
- Verification steps are included.
- Regression tests are included.

## Skill Selection Rules

```text
PPT/deck/presentation + investor/fundraising -> investor_deck_builder
PRD/product requirements/feature spec/user stories -> prd_builder
bug/error/fix/failing/stack trace/not working -> bug_fix_planner
```

## Skill Change Rules

When user changes skill:

- Update workflow.
- Recompute default modules.
- Preserve compatible manually selected modules.
- Add missing required sections from new skill.
- Reset approval to draft if a Work Plan already exists.
