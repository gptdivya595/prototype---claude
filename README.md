# Claude Work Mode Prototype

Claude Work Mode is a Claude-like chat prototype with a structured planning layer:

```text
prompt -> detection -> editable Work Plan -> approval -> answer -> validation
```

The app does not expose hidden model reasoning or chain-of-thought. It creates an external, editable Work Plan that users can review before answer generation.

## Directory Structure

```text
backend/                 Express Work Mode API, OpenAI wrappers, tests, memory store
frontend/                Vite React app and UI styles
docs/                    Architecture, deployment, microservice contracts, screens, research assets
design/                  Product/design direction
phases/                  Phase-by-phase implementation plans
scripts/                 Local smoke/deployment utility scripts
dist/                    Generated frontend production build
```

Important docs:

- `docs/architecture.md`
- `docs/deployment.md`
- `docs/microservices/README.md`
- `docs/screens/index.json`
- `docs/research_assets/prompt_fixtures.json`
- `design/design.md`
- `design/prototype.md`

## Local Development

Install dependencies:

```bash
npm install
```

Run frontend and backend together:

```bash
npm run dev:all
```

Run only the frontend:

```bash
npm run dev
```

Run only the backend:

```bash
npm run dev:server
```

Default local URLs:

```text
Frontend: http://127.0.0.1:5173/
Backend:  http://127.0.0.1:8787
API:      http://127.0.0.1:8787/api/work-mode
```

If port `5173` is busy, Vite will choose the next available port. Add that origin to `FRONTEND_ORIGINS` if you need browser-to-backend calls from that temporary port.

## Environment

Use `.env.example` as the template.

Backend-only:

```env
OPENAI_API_KEY=
DEFAULT_MODEL=gpt-4o-mini
USE_LLM_CLASSIFIER=false
USE_LLM_WORK_PLAN=false
USE_LLM_ANSWER=false
FRONTEND_ORIGIN=http://127.0.0.1:5173
FRONTEND_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

Frontend-only:

```env
VITE_WORK_MODE_API_BASE=http://127.0.0.1:8787/api/work-mode
```

Never put `OPENAI_API_KEY` or any real provider key in a `VITE_*` variable.

## Validation

Run the full local deployment gate:

```bash
npm run deploy:check
```

Run the backend lifecycle smoke test:

```bash
npm run start:server
npm run smoke:server
```

The smoke test verifies:

```text
health -> skills -> analyze -> create Work Plan -> patch -> approve -> generate
```

## Deployment

Frontend deploys to Vercel. Backend deploys to Render.

Read:

```text
docs/deployment.md
```

Deployment roots:

```text
Vercel Root Directory: ./
Render Root Directory: ./
Frontend source: frontend/
Backend source: backend/
Frontend build output: dist/
```

Deployment ownership:

```text
Vercel frontend -> VITE_WORK_MODE_API_BASE only
Render backend   -> OPENAI_API_KEY and model flags
```

## Current Limits

- Persistence is in-memory, so backend restarts clear analyses, Work Plans, and generated outputs.
- Transport is HTTP JSON. SSE is deferred. WebSocket is not needed for the MVP.
- Demo token support is lightweight preview gating, not production authentication.
