# Work Mode Microservice

## Purpose

This folder defines the backend microservice contract for Work Mode:

- API routes
- Frontend actions
- Backend service actions
- State transitions
- Streaming strategy
- OpenAI API key ownership
- Error handling
- Deployment behavior

The frontend should treat these files as the implementation contract.

## Transport Decision

MVP transport:

```text
HTTP request/response for all core flows.
Optional SSE for answer streaming later.
No WebSocket for MVP.
```

Use WebSockets only when the product needs bidirectional realtime behavior:

- Multi-user Work Plan editing
- Presence/cursors
- Live collaborative roadmap editing
- Interactive tool cancellation/control beyond normal HTTP abort
- Realtime workspace events

For the current prototype, HTTP plus optional SSE is enough.

## Backend Owns OpenAI

The browser never calls OpenAI.

```text
Frontend -> Work Mode backend -> OpenAI API
```

Environment:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_ANSWER_MODEL=gpt-4.1
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
8. Optional POST /api/work-mode/work-plans/:id/generate-stream
```

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
```

## Implementation Order

1. Implement service foundation and health routes.
2. Implement skills catalog route.
3. Implement deterministic analyze route.
4. Implement Work Plan creation route.
5. Implement Work Plan patch/autosave route.
6. Implement approval route.
7. Implement answer generation route.
8. Add validation.
9. Add optional SSE streaming.

## Runtime Services

```text
PromptNormalizer
DeterministicDetector
SkillCatalogService
WorkflowPicker
WorkPlanBuilder
WorkPlanStore
OpenAIClient
AnswerGenerator
AnswerValidator
AnalyticsLogger
RateLimiter
```

## MVP Persistence

Start with memory store.

Upgrade path:

```text
memoryStore -> jsonStore or SQLite -> PostgreSQL
```

## Security Baseline

- Strict CORS allowlist.
- Request size limit.
- Prompt length limit.
- Optional `X-Demo-Token` for public demos.
- Per-IP rate limit before public deployment.
- OpenAI key backend-only.
- No full prompt logging in production analytics by default.
