# Phase 12: Deployment With Vercel And Render

## Purpose

Make the prototype deployable outside local development while keeping the OpenAI key backend-only.

## Goal

Deploy the frontend on Vercel and the Work Mode API on Render so the full lifecycle works:

```text
analyze -> create Work Plan -> edit -> approve -> generate -> validate
```

## Skills To Use

Primary skills:

- `$backend-developer`: Render setup, env vars, server startup, health checks, smoke tests, CORS.
- `$debugger`: Deployment failures, CORS issues, env mismatch, startup crashes, OpenAI quota/timeouts.

Supporting skills:

- `$frontend-design`: Production UI behavior and readable backend error states.
- `$machine-learning-engineer`: OpenAI model flags, latency, fallbacks, timeout/cost settings.
- `$llm-testing`: Prompt smoke tests across backend, frontend, architecture, research, analytics, coding, career, and generic fallback workflows.
- `$impeccable`: Final product polish after deployment validation.

## Deployment Architecture

```text
Browser
  -> Vercel frontend
      -> Render backend API
          -> OpenAI API
```

OpenAI key ownership:

- Vercel: only `VITE_WORK_MODE_API_BASE`.
- Render: `OPENAI_API_KEY`, model names, feature flags, CORS origins.
- Browser: never receives `OPENAI_API_KEY`.

## Implemented Phase 12 Files

- `render.yaml`: Render service blueprint.
- `vercel.json`: Vercel build settings.
- `scripts/smoke-work-mode.mjs`: Full API lifecycle smoke test.
- `.env.example`: Local, Vercel, Render, and smoke-test env names.
- `docs/deployment.md`: Step-by-step deployment guide.
- `package.json`: `start:server`, `typecheck:server`, `smoke:server`, `deploy:check`.
- `backend/env.ts`: `FRONTEND_ORIGINS` comma-list support.
- `backend/index.ts`: deploy-safe CORS errors and graceful shutdown.
- `backend/routes/health.ts`: root health with feature flags.
- `backend/routes/workMode.ts`: Work Mode health with Phase 12 status and deployment features.

## Frontend Deployment

Vercel settings:

```text
Framework: Vite
Root directory: ./
Install command: npm ci
Build command: npm run build
Output directory: dist
```

The Vercel project root remains the repo root. The Vite config points into `frontend/` and emits the built app to root-level `dist/`.

Vercel env:

```env
VITE_WORK_MODE_API_BASE=https://your-render-service.onrender.com/api/work-mode
```

Optional:

```env
VITE_DEMO_API_TOKEN=match-render-demo-token
```

This token is browser-visible. Use it only as lightweight demo gating.

## Backend Deployment

Render settings:

```text
Runtime: Node
Root directory: ./
Build command: npm ci
Start command: npm run start:server
Health check path: /health
```

The Render service root remains the repo root. `npm run start:server` starts `backend/index.ts`.

Render env:

```env
OPENAI_API_KEY=your_backend_only_key
DEFAULT_MODEL=gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
USE_LLM_CLASSIFIER=true
USE_LLM_WORK_PLAN=true
USE_LLM_ANSWER=true
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app,https://your-vercel-preview.vercel.app
OPENAI_TIMEOUT_MS=12000
OPENAI_MAX_RETRIES=1
```

Optional:

```env
DEMO_API_TOKEN=match-vercel-demo-token
```

## Transport Decision

Phase 12 uses HTTP JSON.

No WebSocket is needed because the MVP does not have multiplayer editing, presence, live cursors, or bidirectional tool control.

SSE remains a future upgrade if answer generation feels too slow without token streaming.

## Smoke Test

Local:

```bash
npm run start:server
npm run smoke:server
```

Render:

```bash
WORK_MODE_API_BASE=https://your-render-service.onrender.com/api/work-mode \
WORK_MODE_ROOT_HEALTH=https://your-render-service.onrender.com/health \
npm run smoke:server
```

Windows PowerShell:

```powershell
$env:WORK_MODE_API_BASE="https://your-render-service.onrender.com/api/work-mode"
$env:WORK_MODE_ROOT_HEALTH="https://your-render-service.onrender.com/health"
npm run smoke:server
```

The smoke script verifies:

- `GET /health`
- `GET /api/work-mode/health`
- `GET /api/work-mode/skills`
- `POST /api/work-mode/analyze`
- `POST /api/work-mode/work-plans`
- `PATCH /api/work-mode/work-plans/:id`
- `POST /api/work-mode/work-plans/:id/approve`
- `POST /api/work-mode/work-plans/:id/generate`

## Acceptance Criteria

- Vercel app loads.
- Render health route returns healthy.
- Work Mode health route returns healthy and shows Phase 12 features.
- Frontend can call Render through `VITE_WORK_MODE_API_BASE`.
- CORS allows configured Vercel origins and rejects unknown origins.
- OpenAI key exists only on Render.
- Prompt detection does not default every prompt to PRD.
- Generic fallback workflow is available for vague prompts.
- User can edit a Work Plan before approval.
- Backend refuses generation before approval.
- Approved snapshot is used for final generation.
- Validation appears after generation.
- In-memory persistence limitation is documented.

## Known Prototype Limits

- Render restarts clear in-memory analyses, Work Plans, and generated outputs.
- `start:server` runs TypeScript through `tsx` for prototype speed.
- No WebSocket in Phase 12.
- No SSE streaming in Phase 12.
- Demo token is not real auth if exposed through Vercel.

## Rollback Plan

If OpenAI calls fail:

```env
USE_LLM_CLASSIFIER=false
USE_LLM_WORK_PLAN=false
USE_LLM_ANSWER=false
```

The app will continue with deterministic fallback behavior.

If CORS fails:

- Confirm `VITE_WORK_MODE_API_BASE` includes `/api/work-mode`.
- Confirm `FRONTEND_ORIGIN` is the Vercel origin.
- Add preview URLs to `FRONTEND_ORIGINS`.

If Render restarts disrupt the demo:

- Keep the demo flow in one browser session.
- Avoid refreshing during the demo.
- Move to SQLite/PostgreSQL in the next hardening pass.

## Exit Checklist

- [x] Production-like server start command added.
- [x] Deployment smoke script added.
- [x] Vercel config added.
- [x] Render config added.
- [x] CORS supports multiple frontend origins.
- [x] Health routes expose deployment feature flags.
- [x] `.env.example` updated without secrets.
- [x] OpenAI key remains backend-only.
- [x] HTTP chosen over WebSocket for MVP.
- [x] Persistence limitation documented.
- [ ] Render backend deployed.
- [ ] Vercel frontend deployed.
- [ ] Hosted smoke test passed.
