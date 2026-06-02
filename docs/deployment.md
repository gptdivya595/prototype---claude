# Deployment Guide: Vercel Frontend And Render Backend

This project is a Vite React frontend plus an Express Work Mode API. Phase 12 prepares the prototype for a split deployment:

```text
Browser -> Vercel frontend -> Render backend -> OpenAI API
```

The OpenAI API key must only live in Render. Never add `OPENAI_API_KEY` or `VITE_OPENAI_API_KEY` to Vercel.

## Local Deployment Check

Run this before connecting hosted services:

```bash
npm install
npm run deploy:check
```

`deploy:check` runs backend fixtures, backend typecheck, and frontend production build.

## CLI Readiness

Run these from the repository root after installing and logging in to the CLIs:

```powershell
vercel.cmd --version
vercel.cmd whoami
render --version
```

On Windows PowerShell, prefer `vercel.cmd` because `vercel.ps1` can be blocked by the default execution policy. If `render --version` is not found, fix the Render CLI PATH/install before using CLI deploy commands, or deploy from the Render dashboard using the root-level `render.yaml` blueprint.

Keep both CLI projects pointed at the repository root:

```text
Vercel project root: ./
Render service root: ./
```

Do not point either service directly at `frontend/` or `backend/`; the root config files already route builds into the correct folders.

## Local Full-Flow Smoke Test

Terminal 1:

```bash
npm run start:server
```

Terminal 2:

```bash
npm run smoke:server
```

The smoke script uses:

```env
WORK_MODE_API_BASE=http://127.0.0.1:8787/api/work-mode
WORK_MODE_ROOT_HEALTH=http://127.0.0.1:8787/health
SMOKE_SKIP_GENERATE=false
```

Set `SMOKE_SKIP_GENERATE=true` if you only want to verify health, skills, analysis, plan creation, patch, and approval.

## Vercel Frontend

Use these settings:

```text
Framework Preset: Vite
Root Directory: ./
Install Command: npm ci
Build Command: npm run build
Output Directory: dist
```

Keep Vercel's root directory as the repository root. The frontend source lives in `frontend/`, but `vite.config.ts` sets `root: "frontend"` and writes the production build to root-level `dist/`, which matches `vercel.json`.

CLI deploy:

```powershell
vercel.cmd pull
vercel.cmd deploy --prod
```

Add this Vercel environment variable:

```env
VITE_WORK_MODE_API_BASE=https://your-render-service.onrender.com/api/work-mode
```

Optional demo gate:

```env
VITE_DEMO_API_TOKEN=match-render-demo-token
```

`VITE_DEMO_API_TOKEN` is visible in the browser, so treat it as lightweight demo friction, not real authentication.

## Render Backend

Use these settings:

```text
Runtime: Node
Root Directory: ./
Build Command: npm ci
Start Command: npm run start:server
Health Check Path: /health
```

Keep Render's root directory as the repository root. The backend source lives in `backend/`, and `package.json` points `start:server` to `tsx backend/index.ts`.

The root-level `render.yaml` is the source of truth for the service blueprint. If using the Render dashboard, create or sync a Blueprint from this repo. If using the Render CLI, run it from the repository root after `render --version` works locally.

Add these Render environment variables:

```env
OPENAI_API_KEY=your_backend_only_key
DEFAULT_MODEL=gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
OPENAI_CLASSIFIER_MODEL=gpt-4o-mini
OPENAI_WORK_PLAN_MODEL=gpt-4o-mini
OPENAI_ANSWER_MODEL=gpt-4o-mini
OPENAI_VALIDATION_MODEL=gpt-4o-mini
USE_LLM_CLASSIFIER=true
USE_LLM_WORK_PLAN=true
USE_LLM_ANSWER=true
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app,https://your-vercel-preview.vercel.app
OPENAI_TIMEOUT_MS=12000
OPENAI_MAX_RETRIES=1
```

Optional demo gate:

```env
DEMO_API_TOKEN=match-vercel-demo-token
```

Leave `DEMO_API_TOKEN` empty unless the Vercel frontend is also configured to send `VITE_DEMO_API_TOKEN`.

## CORS

The backend allows:

- `http://127.0.0.1:5173`
- `http://localhost:5173`
- `FRONTEND_ORIGIN`
- Every comma-separated origin in `FRONTEND_ORIGINS`

Use exact origins, not full route URLs. Example:

```env
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
```

Do not use:

```env
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app/some/path
```

## Render Smoke Test

After Render is live:

```bash
$env:WORK_MODE_API_BASE="https://your-render-service.onrender.com/api/work-mode"
$env:WORK_MODE_ROOT_HEALTH="https://your-render-service.onrender.com/health"
npm run smoke:server
```

If running in bash:

```bash
WORK_MODE_API_BASE=https://your-render-service.onrender.com/api/work-mode \
WORK_MODE_ROOT_HEALTH=https://your-render-service.onrender.com/health \
npm run smoke:server
```

Expected result:

```json
{
  "ok": true,
  "workflow": "backend_software",
  "generated": true
}
```

The exact workflow can differ if you change `SMOKE_PROMPT`.

## Production Notes For This Prototype

- Transport is HTTP JSON for Phase 12.
- WebSocket is intentionally not used.
- SSE is still deferred.
- The backend uses an in-memory store, so Render restarts clear analyses, Work Plans, and generated outputs.
- `start:server` uses `tsx` for prototype speed, so `tsx` is a runtime dependency. A later production hardening pass can compile the backend into a Node-ready server bundle.
- Render cold starts can make the first request slow on free instances.

## Manual Demo Checklist

After both services are deployed:

- Open the Vercel URL.
- Submit a prompt with Enter or the send button.
- Confirm the detection is not always PRD and can route to backend, frontend, architecture, research, analytics, coding, career, or generic fallback.
- Create a Work Plan.
- Edit at least one roadmap section.
- Approve the Work Plan.
- Generate the answer.
- Confirm the validation panel appears.
- Refresh the page and note that in-memory records are not durable.

## Rollback

If OpenAI calls fail during the demo, set these Render flags to false:

```env
USE_LLM_CLASSIFIER=false
USE_LLM_WORK_PLAN=false
USE_LLM_ANSWER=false
```

The deterministic fallback still supports prompt detection, Work Plan generation, and answer generation for prototype demos.
