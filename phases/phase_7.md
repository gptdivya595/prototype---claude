# Phase 7: Backend Foundation

## Purpose

Create a safe backend foundation that owns secrets, API calls, validation, logging, and later Work Mode state. The frontend must never call OpenAI directly.

## Goal

Run a local backend service that the Vite frontend can call.

## Skills To Use

Primary skills:

- `$backend-developer`: Use to implement the Express backend, environment loading, CORS, API envelope, error handling, request IDs, and OpenAI key isolation.

Supporting skills:

- `$debugger`: Use to diagnose server startup, CORS, environment, and route errors.
- `$machine-learning-engineer`: Use to define model-serving concerns such as timeout defaults, fallback behavior, cost logging, and feature flags.
- `$llm-testing`: Use to define backend security checks around prompt length, unsafe input, and API-key exposure.

Review skills:

- `$frontend-design`: Use only to verify the backend health/error responses support frontend states cleanly.

## Scope

Build:

- Express backend.
- Environment validation.
- OpenAI client setup.
- CORS.
- Health route.
- Request IDs.
- API response envelope.
- Error middleware.
- API route namespace.
- Basic rate-limit/cost-safety placeholder.
- OpenAI API key isolation.
- Demo API token support for public demos.

Do not build yet:

- Detection.
- Work Plan generation.
- Answer generation.

## Dependencies

Install:

```bash
npm install express cors dotenv zod openai tsx
npm install -D concurrently @types/express @types/cors
```

## Backend File Structure

```text
backend/
  index.ts
  env.ts
  openaiClient.ts
  middleware/
    requestId.ts
    errorHandler.ts
  utils/
    apiResponse.ts
    errors.ts
```

## Environment Variables

```env
PORT=8787
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_ANSWER_MODEL=gpt-4.1
USE_LLM_CLASSIFIER=false
USE_LLM_WORK_PLAN=false
USE_LLM_ANSWER=false
FRONTEND_ORIGIN=http://127.0.0.1:5173
DEMO_API_TOKEN=
```

## OpenAI API Key Handling

Rules:

- `OPENAI_API_KEY` exists only in backend `.env` or Render environment variables.
- Never use `VITE_OPENAI_API_KEY`.
- Never return the key from health endpoints.
- Never log the key.
- Frontend calls backend only.
- Backend calls OpenAI.

Flow:

```text
Browser -> /api/work-mode/* -> backend -> OpenAI API
```

## API Envelope

Success:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};
```

Error:

```ts
type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};
```

## Required Routes

### `GET /health`

Response:

```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "service": "work-mode-api"
  },
  "requestId": "req_..."
}
```

### `GET /api/work-mode/health`

Purpose:

- Verify the API namespace is mounted.
- Let frontend check backend availability separately from app health.

## Detailed Tasks

### Task 1: Add Scripts

Add:

```json
{
  "dev:server": "tsx backend/index.ts",
  "dev:all": "concurrently \"npm run dev\" \"npm run dev:backend\""
}
```

### Task 2: Implement Environment Loader

Use Zod:

```ts
const EnvSchema = z.object({
  PORT: z.coerce.number().default(8787),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_ANSWER_MODEL: z.string().default("gpt-4.1"),
  USE_LLM_CLASSIFIER: z.coerce.boolean().default(false),
  USE_LLM_WORK_PLAN: z.coerce.boolean().default(false),
  USE_LLM_ANSWER: z.coerce.boolean().default(false)
});
```

### Task 3: Add CORS

Allow:

- `http://127.0.0.1:5173`
- `http://localhost:5173`

In production, read the allowed Vercel URL from `FRONTEND_ORIGIN`.

### Task 4: Add Request ID Middleware

Every response should include request ID.

### Task 5: Add Error Handler

Handle:

- Validation errors.
- Unknown route.
- Unexpected errors.

### Task 6: Add Route Namespace

Mount:

```text
/api/work-mode
```

Phase 8 and later routes should live under this namespace.

### Task 7: Add Safety Placeholder

Add a simple middleware placeholder for:

- Request size limit.
- Per-IP rate limit later.
- Max prompt length.

For prototype, max prompt length can be enforced in the analyze route.

### Task 8: Add OpenAI Key Guard

Implement:

- `hasOpenAiKey` boolean in backend health diagnostics.
- Do not expose the actual key.
- If key is missing, LLM feature flags should effectively behave as false.

### Task 9: Add Demo Token Guard

For public demos before real auth:

- If `DEMO_API_TOKEN` is set, require `X-Demo-Token`.
- If it is not set, allow local development.
- Never treat this as production authentication.

### Task 10: Add Basic Rate Limit Placeholder

For MVP:

- Add a simple in-memory per-IP counter, or document where rate limiting will be inserted.
- Protect model endpoints before public demos.

## Acceptance Criteria

- `npm run dev:server` starts backend.
- `/health` works.
- Frontend can call `/health`.
- Missing OpenAI key does not crash server.
- API responses use standard envelope.
- `/api/work-mode/health` works.
- Request body size is limited.
- OpenAI key never appears in frontend or responses.
- Backend can run without OpenAI key using deterministic fallback later.
- Demo token can protect public preview endpoints.
- Rate-limit hook exists before model routes are public.

## Test Commands

```bash
curl http://127.0.0.1:8787/health
```

## Risks

- Exposing OpenAI API key in frontend.
- Forgetting CORS for deployed frontend.
- Crashing server when `.env` is missing.
- Using a dev command as a production command.
- Letting very large prompts hit model endpoints.
- Public Render API abuse without token or rate limits.

## Exit Checklist

- [ ] Backend starts.
- [ ] Health route works.
- [ ] Env loader works.
- [ ] API envelope works.
- [ ] CORS works locally.
- [ ] API namespace exists.
- [ ] Request size limit exists.
- [ ] OpenAI key guard exists.
- [ ] Demo token guard exists or explicitly deferred.
- [ ] Rate-limit hook exists.
