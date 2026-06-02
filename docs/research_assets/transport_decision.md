# Transport Decision

## Decision

Use HTTP request/response for the MVP.

Add Server-Sent Events only if final answer generation needs visible streaming.

Do not use WebSocket for the MVP.

## MVP Transport

```text
GET  /api/work-mode/health
GET  /api/work-mode/skills
POST /api/work-mode/analyze
POST /api/work-mode/work-plans
GET  /api/work-mode/work-plans/:id
PATCH /api/work-mode/work-plans/:id
POST /api/work-mode/work-plans/:id/approve
POST /api/work-mode/work-plans/:id/generate
```

## Optional SSE Transport

Use when answer generation feels slow and users need progress.

```text
POST /api/work-mode/work-plans/:id/generate-stream
```

Events:

- `generation.started`
- `generation.delta`
- `generation.completed`
- `generation.validation_started`
- `generation.validation_completed`
- `generation.error`

## WebSocket Decision

WebSocket is deferred.

Use WebSocket only if the product later needs:

- Multi-user Work Plan editing.
- Live cursors or presence.
- Bidirectional tool control.
- Realtime workspace events.
- Interactive cancellation beyond HTTP abort/SSE close.

## Why HTTP First

- Easier to build.
- Easier to debug.
- Easier to deploy on Vercel + Render.
- Enough for analyze, create, edit, approve, and generate.
- Works with normal request cancellation through `AbortController`.

## OpenAI Key Flow

```text
Browser -> Work Mode backend -> OpenAI API
```

The frontend only receives:

```env
VITE_WORK_MODE_API_BASE
```

The backend owns:

```env
OPENAI_API_KEY
OPENAI_MODEL
OPENAI_ANSWER_MODEL
```

Never expose:

```env
VITE_OPENAI_API_KEY
```

## Cancellation

HTTP:

- Use `AbortController`.

SSE:

- Close the stream.

Backend:

- Do not mark Work Plan as generated unless generation completes.
