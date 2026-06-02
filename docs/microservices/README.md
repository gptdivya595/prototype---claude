# Work Mode Microservice

## Purpose

This folder defines the backend microservice contract for Work Mode:

- API routes
- Frontend actions
- Backend service actions
- State transitions
- OpenAI API key ownership
- Error handling
- Deployment behavior
- Future transport upgrades

The frontend should treat these files as the implementation contract, with the source of truth in:

```text
backend/routes/workMode.ts
backend/templates/registries.ts
backend/templates/workflows.ts
backend/templates/skillCatalog.ts
frontend/src/App.tsx
```

## Transport Decision

Current implemented transport:

```text
HTTP JSON request/response for every MVP flow.
No SSE endpoint is implemented yet.
No WebSocket endpoint is implemented yet.
```

Cancellation in the current UI uses `AbortController` for the HTTP generation request. The backend checks whether the request was aborted before persisting generated output.

Use WebSockets later only when the product needs bidirectional realtime behavior:

- Multi-user Work Plan editing
- Presence/cursors
- Live collaborative roadmap editing
- Interactive tool cancellation/control beyond normal HTTP abort
- Realtime workspace events

Use SSE later only if one-way answer streaming becomes important. The future endpoint would be additive and should not replace the existing `/generate` endpoint until the UI supports both.

## Backend Owns OpenAI

The browser never calls OpenAI.

```text
Frontend -> Work Mode backend -> OpenAI API
```

Backend environment:

```env
OPENAI_API_KEY=...
DEFAULT_MODEL=gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
OPENAI_CLASSIFIER_MODEL=gpt-4o-mini
OPENAI_WORK_PLAN_MODEL=gpt-4o-mini
OPENAI_ANSWER_MODEL=gpt-4o-mini
OPENAI_VALIDATION_MODEL=gpt-4o-mini
USE_LLM_CLASSIFIER=true
USE_LLM_WORK_PLAN=true
USE_LLM_ANSWER=true
FRONTEND_ORIGIN=https://prototype-claude.vercel.app
FRONTEND_ORIGINS=https://prototype-claude.vercel.app
```

Frontend environment:

```env
VITE_WORK_MODE_API_BASE=https://your-render-service.onrender.com/api/work-mode
```

Never use:

```env
VITE_OPENAI_API_KEY=...
```

## Main Flow

```text
1. GET  /api/work-mode/health
2. GET  /api/work-mode/skills
3. POST /api/work-mode/analyze
4. POST /api/work-mode/work-plans
5. PATCH /api/work-mode/work-plans/:id
6. POST /api/work-mode/work-plans/:id/approve
7. POST /api/work-mode/work-plans/:id/generate
```

Available but not currently called by the React client:

```text
GET /api/work-mode/work-plans/:id
```

Not implemented in the current backend:

```text
POST /api/work-mode/work-plans/:id/generate-stream
WebSocket endpoints
```

## Implemented Roadmaps

The prototype supports eleven implemented workflow/skill pairs:

```text
slide_deck              -> investor_deck_builder
prd_generation          -> prd_builder
debugging_bug_fix       -> bug_fix_planner
backend_software        -> backend_api_builder
frontend_web            -> frontend_app_builder
architecture_review     -> architecture_reviewer
research_report         -> research_synthesizer
analytics_plan          -> analytics_planner
complex_coding          -> complex_code_planner
career_path             -> career_path_coach
generic_workflow        -> general_workflow_planner
```

`generic_workflow` is the fallback when a prompt is ambiguous, cross-functional, or does not clearly match a specialized roadmap.

## Files

```text
docs/microservices/
  README.md
  api_contracts.json
  actions_registry.json
  frontend_integration.json
  streaming_strategy.json
  service_architecture.md
  openapi_outline.json
  roadmap_detection_taxonomy.json
```

## Implementation Order

1. Implement service foundation and health routes.
2. Implement skills catalog route.
3. Implement deterministic analyze route.
4. Add optional LLM classifier with deterministic fallback.
5. Implement Work Plan creation route.
6. Add optional LLM Work Plan generation with template fallback.
7. Implement Work Plan patch/autosave route.
8. Implement approval route.
9. Implement answer generation route with OpenAI/template fallback.
10. Add answer validation.
11. Add deployment env, CORS, and smoke checks.
12. Add optional SSE/WebSocket only after the HTTP prototype is stable.

## Runtime Services

```text
PromptNormalizer
DeterministicDetector
WorkflowPicker
WorkPlanBuilder
WorkPlanCreator
WorkPlanLifecycle
OpenAIClient / ModelRouter
LlmClassifier
LlmWorkPlanGenerator
AnswerGenerator
AnswerValidator
MemoryStore
RateLimitPlaceholder
DemoTokenGuard
```

## MVP Persistence

The current implementation uses memory store only.

Upgrade path:

```text
memoryStore -> JSON Store or SQLite -> PostgreSQL
```

## Security Baseline

- Strict CORS allowlist.
- Request size limit.
- Prompt length limit.
- Optional `X-Demo-Token` for public demos.
- Rate limit placeholder before public deployment.
- OpenAI key backend-only.
- No full prompt logging in production analytics by default.
- `.env` must stay ignored and must never be committed.
