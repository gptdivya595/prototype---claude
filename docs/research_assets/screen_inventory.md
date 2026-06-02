# Screen Inventory

## Purpose

This document maps the Work Mode product screens to their JSON specifications in `docs/screens/`.

## Screens

| Order | Screen ID | File | Purpose | Primary State |
|---|---|---|---|---|
| 1 | `app_shell` | `docs/screens/01_app_shell.json` | Main Claude-like workspace shell, sidebar, header, mode selector, composer. | `idle` |
| 2 | `empty_prompt` | `docs/screens/02_empty_prompt.json` | Initial Work Mode prompt entry. | `idle` |
| 3 | `analyzing_prompt` | `docs/screens/03_analyzing_prompt.json` | Prompt analysis loading and cancellation. | `analyzing` |
| 4 | `detection_summary` | `docs/screens/04_detection_summary.json` | Role, artifact, workflow, skill, confidence, and overrides. | `reviewing_detection` |
| 5 | `skill_and_suggestions` | `docs/screens/05_skill_and_suggestions.json` | Skill selector, module checklist, source mode, create Work Plan. | `choosing_suggestions` |
| 6 | `work_plan_editor` | `docs/screens/06_work_plan_editor.json` | Editable roadmap: objective, assumptions, missing context, sections, validation criteria. | `editing_plan` |
| 7 | `approval_bar` | `docs/screens/07_approval_bar.json` | Approval and generation gating. | `draft` or `approved` |
| 8 | `generation_progress` | `docs/screens/08_generation_progress.json` | Generation progress, cancellation, retry, optional streaming. | `generating` |
| 9 | `answer_and_validation` | `docs/screens/09_answer_and_validation.json` | Final answer and validation results. | `complete` |
| 10 | `errors_and_recovery` | `docs/screens/10_errors_and_recovery.json` | Backend/API/model failure states and recovery actions. | `error` |
| 11 | `settings_and_source_modes` | `docs/screens/11_settings_and_source_modes.json` | Backend status, source mode capabilities, feature flag state. | panel |
| 12 | `mobile_responsive` | `docs/screens/12_mobile_responsive.json` | Mobile adaptations for the same screens. | responsive |

## Happy Path

```text
app_shell
-> empty_prompt
-> analyzing_prompt
-> detection_summary
-> skill_and_suggestions
-> work_plan_editor
-> approval_bar
-> generation_progress
-> answer_and_validation
```

## Recovery Path

```text
any API failure
-> errors_and_recovery
-> retry OR return to last stable screen
```

## Important UX Rules

- Work Mode prompt submission never immediately generates a final answer.
- Detection results can be overridden before creating a Work Plan.
- Suggested modules are defaults. User-selected modules become the source of truth after the suggestions screen.
- Work Plan edits autosave when backend is available.
- Approval freezes a snapshot.
- Editing after approval resets approval.
- Final generation uses the approved snapshot only.
- WebSocket is not part of the MVP. Use HTTP first and optional SSE later.

## Mobile Notes

The mobile screen is not a separate route. It defines behavior for every screen below 640px:

- Single-column layout.
- Collapsed sidebar.
- Sticky approval action.
- Expandable Work Plan sections.
- Full-width module checklist rows.
