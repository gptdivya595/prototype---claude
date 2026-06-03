# Claude Professional Mode MVP

A Claude-style Work Mode prototype for serious tasks that should be planned before they are answered.

Work Mode turns a prompt into a visible, editable Work Plan. The user reviews routing, selects modules, edits the plan, approves it, and only then generates the final answer.

```text
Prompt -> detection -> suggestions -> editable Work Plan -> approval -> answer -> validation
```

## What This Prototype Includes

- React + Vite frontend styled as a Claude-like workspace.
- Express backend for Work Mode analysis, Work Plan lifecycle, answer generation, and validation.
- Deterministic fallbacks so the app can run without an OpenAI key.
- Optional OpenAI-powered classifier, Work Plan generator, answer generator, and validator.
- In-memory backend store for prototype speed.
- Wireframe and PPT-ready slide assets in `design/`.

## Repository Structure

```text
frontend/                 React/Vite app
backend/                  Express Work Mode API
backend/routes/           API routes
backend/services/         Detection, planning, generation, validation, OpenAI services
backend/templates/        Workflow, skill, module, and registry templates
backend/tests/            Fixture-based backend checks
docs/                     Architecture, deployment, screen specs, research assets
design/                   Design docs, wireframe HTML, and PPT image exports
scripts/                  Smoke-test scripts
```

## Requirements

- Node.js `>=20`
- npm
- Optional: `OPENAI_API_KEY` for live LLM behavior

Install dependencies:

```bash
npm ci
```

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Local defaults:

```env
PORT=8787
FRONTEND_ORIGIN=http://127.0.0.1:5173
FRONTEND_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
VITE_WORK_MODE_API_BASE=http://127.0.0.1:8787/api/work-mode
```

To use live model calls, set:

```env
OPENAI_API_KEY=your_backend_only_key
USE_LLM_CLASSIFIER=true
USE_LLM_WORK_PLAN=true
USE_LLM_ANSWER=true
```

Leave the LLM flags as `false` for deterministic local fallback behavior.

## Run Locally

Start frontend and backend together:

```bash
npm run dev:all
```

Or run them separately:

```bash
npm run dev
npm run dev:server
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://127.0.0.1:8787/health`
- Work Mode health: `http://127.0.0.1:8787/api/work-mode/health`

## Main Scripts

```bash
npm run dev              # Start Vite frontend
npm run dev:server       # Start Express backend
npm run dev:all          # Start frontend and backend together
npm run build            # Typecheck frontend and build production assets
npm run typecheck:server # Typecheck backend
npm run test:server      # Run backend fixture tests
npm run smoke:server     # Exercise the local Work Mode API flow
npm run deploy:check     # Tests + backend typecheck + production build
```

## Work Mode Flow

1. Select Work mode from the model/effort menu.
2. Enter a work prompt.
3. Review detected role, artifact, workflow, confidence, and source mode.
4. Choose a skill and planning modules.
5. Create an editable Work Plan.
6. Edit objective, assumptions, missing context, roadmap sections, and validation criteria.
7. Approve the Work Plan.
8. Generate the final answer.
9. Review validation output.

## API Overview

The backend is mounted at `/api/work-mode`.

Key endpoints:

```text
GET  /health
GET  /api/work-mode/health
GET  /api/work-mode/skills
POST /api/work-mode/analyze
POST /api/work-mode/work-plans
GET  /api/work-mode/work-plans/:id
PATCH /api/work-mode/work-plans/:id
POST /api/work-mode/work-plans/:id/approve
POST /api/work-mode/work-plans/:id/generate
```

The prototype uses an in-memory store. Restarting the backend clears analyses, Work Plans, and generated outputs.

## Testing And Verification

Run the main server fixtures:

```bash
npm run test:server
```

Run the full deployment check:

```bash
npm run deploy:check
```

Run a local smoke test after starting the backend:

```bash
npm run dev:server
npm run smoke:server
```

Set `SMOKE_SKIP_GENERATE=true` if you want to skip answer generation during smoke checks.

## Design And Wireframes

Design source files:

```text
design/design.md
design/prototype.md
design/work-mode-wireframe.html
design/slide.html
```

Generated visual assets:

```text
design/work-mode-wireframe-preview.png
design/work-mode-wireframe-slide.png
design/wireframe-step-01.png
design/wireframe-step-02.png
design/wireframe-step-03.png
design/wireframe-step-04.png
design/wireframe-step-05.png
design/wireframe-step-06.png
design/wireframe-step-07.png
```

`design/slide.html` is a 16:9 PPT-oriented slide. The exported PNG is:

```text
design/work-mode-wireframe-slide.png
```

To regenerate the slide image:

```bash
node - <<'NODE'
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve('design/slide.html'), { waitUntil: 'load' });
  await page.screenshot({ path: 'design/work-mode-wireframe-slide.png', fullPage: false });
  await browser.close();
})();
NODE
```

## Deployment

This project is designed for a split deployment:

```text
Vercel frontend -> Render backend -> OpenAI API
```

Frontend:

- Vercel root directory: `./`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Backend:

- Render root directory: `./`
- Build command: `npm ci`
- Start command: `npm run start:server`
- Health check path: `/health`

See [docs/deployment.md](docs/deployment.md) for full Vercel and Render setup.

## Important Notes

- Do not expose `OPENAI_API_KEY` in Vercel or browser-side variables.
- `VITE_DEMO_API_TOKEN` is visible in the browser and should only be used as lightweight demo friction.
- The backend CORS allowlist is controlled by `FRONTEND_ORIGIN` and `FRONTEND_ORIGINS`.
- WebSocket and SSE are intentionally deferred; this prototype uses HTTP JSON.
- Persistence is in-memory only.

## Useful Docs

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Backend store](docs/backend-store.md)
- [Microservices outline](docs/microservices/README.md)
- [Screen specs](docs/screens/index.json)
- [Design system](design/design.md)
- [Product context](design/prototype.md)
