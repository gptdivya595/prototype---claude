# Testing And Analytics Plan

## Purpose

Define how Phase 1 assets will support later frontend, backend, and LLM testing.

## Detector Fixture Tests

Use `prompt_fixtures.json`.

Required checks:

- `expectedWorkflowId` matches detected workflow.
- `expectedSkillId` matches detected skill.
- `expectedSourceMode` matches detected source mode.
- Expected modules are included in recommended modules.
- Confidence band is reasonable.

Initial target:

```text
At least 80% fixture accuracy across the first 15 prompts.
```

## LLM Safety Tests

Categories:

- Prompt injection in user prompt.
- Request to reveal hidden reasoning.
- Source-heavy prompt without sources.
- Privacy-sensitive prompt.
- Ambiguous role/artifact prompt.
- Unknown workflow prompt.

Expected behavior:

- Do not expose hidden chain-of-thought.
- Return schema-valid output.
- Use only canonical IDs.
- Mark source-needed claims when sources are unavailable.
- Fall back to deterministic behavior when LLM output is invalid.

## Integration Flow Tests

Happy path:

```text
analyze -> create work plan -> patch -> approve -> generate -> validate
```

Required cases:

- Generate before approval returns 409.
- Stale PATCH returns 409.
- Invalid module ID returns 400 or 422.
- Missing analysis ID returns 404.
- OpenAI unavailable uses fallback or returns readable error.

## Frontend Interaction Tests

Manual or Playwright:

- Submit prompt.
- Review detection.
- Change skill.
- Toggle modules.
- Create Work Plan.
- Edit section.
- Autosave.
- Approve.
- Generate.
- Cancel generation.
- View validation.
- Edit after generation and confirm answer becomes stale.

## Accessibility Checks

Target:

```text
WCAG 2.2 AA for core flow.
```

Checks:

- Keyboard can reach all controls.
- Mode selector has accessible labels.
- Skill selector has accessible labels.
- Module checklist is screen-reader friendly.
- Work Plan section controls expose labels.
- Focus moves intentionally between major panels.
- Save/generation status uses live regions.
- Color contrast passes for status badges.

## Analytics Events

Do not log full prompts or generated answers by default.

Events:

- `workmode_prompt_submitted`
- `analysis_started`
- `analysis_completed`
- `role_override_changed`
- `artifact_override_changed`
- `skill_changed`
- `module_toggled`
- `source_mode_changed`
- `workplan_created`
- `workplan_section_added`
- `workplan_section_removed`
- `workplan_section_reordered`
- `workplan_section_edited`
- `workplan_autosave_started`
- `workplan_autosave_completed`
- `workplan_autosave_failed`
- `workplan_approved`
- `generation_started`
- `generation_cancelled`
- `generation_completed`
- `generation_failed`
- `validation_completed`

Metrics:

- Detection confidence.
- Workflow selected.
- Skill selected.
- Number of selected modules.
- Number of Work Plan edits.
- Time from prompt to approval.
- Generation latency.
- Validation quality score.
- Failure count.
- Estimated model cost.

## Debug Logging

Backend logs should include:

- requestId
- endpoint
- status code
- model purpose
- model name
- latency
- fallback reason

Do not log:

- OpenAI API key
- Full prompt in production
- Full generated answer in production
