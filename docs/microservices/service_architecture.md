# Work Mode Service Architecture

## Runtime Shape

For the prototype, use a single Node service.

```text
Vite React frontend
  -> Work Mode API service
      -> local deterministic services
      -> OpenAI API
      -> memory/json/sqlite store
```

Do not split into multiple deployable services yet. Keep the code modular so it can split later.

## Suggested Backend Folder

```text
backend/
  index.ts
  env.ts
  openaiClient.ts
  routes/
    workMode.routes.ts
  middleware/
    requestId.ts
    errorHandler.ts
    demoToken.ts
    rateLimit.ts
  schemas/
    workModeSchemas.ts
  templates/
    registries.ts
    skillCatalog.ts
    moduleCatalog.ts
    workflows.ts
  services/
    promptNormalizer.ts
    deterministicDetector.ts
    llmClassifier.ts
    workflowPicker.ts
    workPlanBuilder.ts
    answerGenerator.ts
    answerValidator.ts
    analyticsLogger.ts
  storage/
    memoryStore.ts
    jsonStore.ts
```

## Service Responsibilities

### PromptNormalizer

Input:

- Raw prompt

Output:

- Lowercase prompt
- Token list
- Explicit artifact hints
- Audience hints
- Entity hints

### DeterministicDetector

Input:

- Normalized prompt

Output:

- Role candidates
- Artifact candidates
- Module candidates
- Source mode
- Risk level

### SkillCatalogService

Input:

- None or optional filters

Output:

- Skills available to frontend
- Skill default modules
- Skill optional modules

### WorkflowPicker

Input:

- Detection candidates
- Skill catalog
- Workflow registry

Output:

- Recommended workflow
- Recommended skill
- Alternatives

### WorkPlanBuilder

Input:

- Saved analysis
- User-selected skill
- Selected module IDs
- Source mode

Output:

- Draft WorkPlanRecord

### OpenAIClient

Input:

- Purpose: classification, work plan, answer, validation
- Prompt payload
- JSON schema when needed

Output:

- Structured output or text

Rules:

- Backend only
- Timeouts
- Retries for transient failures
- Circuit breaker fallback
- No API key logging

### AnswerGenerator

Input:

- Approved Work Plan snapshot

Output:

- Final answer markdown

Rules:

- Do not use mutable draft
- Mark source-needed claims when source mode requires it
- Do not expose hidden chain-of-thought

### AnswerValidator

Input:

- Approved Work Plan
- Generated answer

Output:

- ValidationResult

Checks:

- Required sections present
- Modules addressed
- Assumptions visible
- Source-needed claims marked
- Artifact format followed

## API Lifecycle

```text
analyze:
  normalize -> deterministic detect -> optional LLM classify -> pick workflow/skill -> save analysis

create work plan:
  load analysis -> apply user overrides -> build plan -> save draft

patch work plan:
  load record -> check version -> validate plan -> save draft -> increment version

approve:
  load record -> validate required sections -> copy plan to approvedPlan -> set approved

generate:
  load approvedPlan -> generate answer -> validate -> save output -> return answer + validation
```

## Persistence Stages

### Stage 1: Memory Store

Use for fastest prototype.

Limitation:

- Server restart loses data.

### Stage 2: JSON Store Or SQLite

Use when demos need refresh survival.

### Stage 3: PostgreSQL

Use when users/auth/workspaces exist.

## Security Controls

MVP:

- CORS allowlist
- Request ID
- Demo token
- Rate limit hook
- Prompt size limit
- OpenAI key backend-only

Production later:

- Auth
- Workspace ownership checks
- Per-user quotas
- Audit logs
- Persistent database

## WebSocket Decision

No WebSocket for MVP.

Use WebSocket later only for:

- Collaborative editing
- Presence
- Bidirectional long-running tool control

Use SSE for one-way answer streaming if needed.
