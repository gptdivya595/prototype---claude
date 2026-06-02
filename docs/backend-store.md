# Store Migration Path

Phase 11 still uses an in-memory store so the prototype can move quickly and stay deterministic.

Current records:

- Prompt analyses
- Draft / approved / generated Work Plans
- Generated outputs with answer text, validation result, model metadata, and creation time

Lifecycle rule:

```text
No approved Work Plan snapshot -> no generated answer.
```

Editing an approved or generated Work Plan resets `approvedPlan` and `approvedAt`, returns the record to `draft`, and requires approval again. Previous generated outputs remain stored for history, but the frontend marks them stale after edits.

Migration path:

1. `memoryStore`: current development store for prompt analyses, Work Plans, and generated outputs.
2. `jsonStore` or SQLite: local persistence for demos, refresh recovery, and lightweight QA.
3. PostgreSQL: production store for Render deployment with durable records and queryable analytics.

Future tables:

- `conversations`
- `prompt_analyses`
- `work_plans`
- `generated_outputs`

Keep the API contract stable while replacing the storage implementation behind `backend/store/memoryStore.ts`.
