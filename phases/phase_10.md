# Phase 10: Backend OpenAI Work Plan Generation

## Purpose

Add OpenAI-powered classification and Work Plan generation while preserving deterministic fallback. The model should improve quality, not become the only path.

## Goal

When feature flags are enabled, backend uses OpenAI structured outputs to classify prompts and generate Work Plans. When OpenAI fails or is disabled, local deterministic logic still works.

## Skills To Use

Primary skills:

- `$machine-learning-engineer`: Use to design model routing, latency/cost controls, timeouts, retries, fallback behavior, and model configuration.
- `$llm-testing`: Use to test LLM classifier and Work Plan generator robustness, prompt-injection resistance, schema adherence, privacy boundaries, and failure behavior.

Supporting skills:

- `$backend-developer`: Use to implement OpenAI client wrappers, structured output calls, feature flags, logging, and Zod validation.
- `$debugger`: Use to diagnose malformed model outputs, timeout behavior, schema failures, and fallback bugs.
- `$rag-architect`: Use to review source-heavy Work Plan generation and future retrieval hooks.

Review skills:

- `$llm-wiki`: Use if model behavior notes, prompt versions, and evaluation findings should be maintained as a durable knowledge base.

## Scope

Build:

- LLM classifier.
- LLM Work Plan generator.
- Structured output schemas.
- Zod validation.
- Fallback handling.
- Logging for rejected model values.

Do not build yet:

- Final answer generation.
- Validator.
- Web search.

## Feature Flags

```env
USE_LLM_CLASSIFIER=true
USE_LLM_WORK_PLAN=true
USE_LLM_ANSWER=false
```

## OpenAI Safety Rules

- Backend only.
- Never expose API key.
- Use structured outputs with JSON Schema, not plain "return JSON" prompting.
- Send allowed enum values to the model.
- Validate model output with Zod.
- Drop unknown values.
- Fall back to deterministic logic when required fields fail.
- Set request timeouts.
- Log model name, request ID, phase, and fallback reason, but do not log API keys.
- OpenAI calls must happen only after backend validates the incoming request.
- Estimate token/cost before expensive calls when possible.
- Add circuit-breaker behavior after repeated model failures.

## LLM Classifier Input

```json
{
  "prompt": "Make a PPT on competitors of Perplexity for investors.",
  "deterministicCandidates": {},
  "allowedRoles": [],
  "allowedArtifacts": [],
  "allowedWorkflowIds": [],
  "allowedSkillIds": [],
  "allowedModuleIds": [],
  "allowedSourceModes": []
}
```

## LLM Classifier Output

```json
{
  "detectedRole": "Researcher",
  "detectedArtifact": "PPT",
  "taskCategory": "presentation",
  "audience": "Investors",
  "primaryEntity": "Perplexity",
  "recommendedWorkflowId": "slide_deck",
  "recommendedSkillId": "investor_deck_builder",
  "confidence": 0.88,
  "reason": "The prompt requests a presentation about competitors for investors.",
  "selectedModuleIds": ["competitor_analysis", "investor_framing", "sources_required"],
  "sourceMode": "source_needed_only",
  "questionsForUser": []
}
```

## Work Plan Generator Input

```json
{
  "originalPrompt": "...",
  "classification": {},
  "workflowTemplate": {},
  "selectedModuleIds": [],
  "sourceMode": "source_needed_only"
}
```

## Work Plan Generator Output

Must match `WorkPlanSchema`.

## Detailed Tasks

### Task 1: Add OpenAI Client Wrapper

Create helper:

```ts
async function createStructuredResponse<T>(input): Promise<T>
```

It should:

- Call OpenAI Responses API.
- Use JSON schema structured output.
- Return parsed object.
- Throw typed errors on validation failure.
- Support timeout and retry once for transient network/API failures.
- Attach `requestId` to logs.

### Task 2: Implement LLM Classifier

Function:

```ts
async function classifyPromptWithLlm(input): Promise<PromptAnalysis>
```

Rules:

- Use deterministic candidates as hints.
- Use allowed enum values only.
- No invented IDs.
- Return ranked skill candidates when useful.

### Task 3: Reconcile LLM And Deterministic Output

Rules:

```text
Explicit artifact from deterministic detector wins.
High-confidence LLM role can override deterministic role.
Workflow picker makes final workflow decision.
Modules are unioned and validated.
Source mode uses strictest relevant value.
Skill recommendation must map to the final workflow.
```

### Task 4: Implement LLM Work Plan Generator

Function:

```ts
async function generateWorkPlanWithLlm(input): Promise<WorkPlan>
```

Rules:

- Do not generate final answer.
- Do not expose hidden reasoning.
- Return editable external Work Plan only.
- Include sections, assumptions, missing context, validation criteria.

### Task 5: Add Fallback Paths

Fallback when:

- API key missing.
- API call fails.
- JSON schema validation fails.
- Model returns low confidence.

Fallback to:

- Deterministic detection.
- Local Work Plan builder.

### Task 6: Add Cost And Latency Logging

Record per call:

- Stage: classifier or work plan.
- Model.
- Latency.
- Whether fallback was used.
- Validation status.

Do not block the prototype on a metrics database; console logging with request IDs is enough for MVP.

### Task 7: Add Model Abstraction

Avoid hardcoding one model throughout the code.

Create:

```ts
type ModelPurpose = "classification" | "work_plan" | "answer" | "validation";
```

Resolve model from env/config by purpose.

### Task 8: Add Circuit Breaker

If OpenAI fails repeatedly:

- Temporarily disable LLM path for the process.
- Use deterministic/local fallback.
- Log fallback reason.

## Acceptance Criteria

- LLM classifier works with structured schema.
- LLM Work Plan generator works with structured schema.
- Invalid model output does not break app.
- Feature flags can turn LLM stages on/off.
- Skill recommendations are validated against the skill catalog.
- Local fallback still works.
- Timeouts and fallback behavior are tested.
- Latency/fallback logs are visible in backend logs.
- Model names are resolved by purpose.
- Repeated model failures trigger fallback behavior.

## Test Cases

1. Run with all LLM flags off.
2. Run with classifier on and Work Plan off.
3. Run with classifier and Work Plan on.
4. Remove API key and confirm fallback.
5. Send ambiguous prompt and confirm low-confidence handling.
6. Simulate timeout and confirm deterministic fallback.
7. Simulate repeated model failures and confirm circuit breaker fallback.

## Exit Checklist

- [ ] LLM classifier implemented.
- [ ] LLM Work Plan generator implemented.
- [ ] Structured outputs used.
- [ ] Zod validation used.
- [ ] Fallbacks work.
- [ ] Timeout behavior works.
- [ ] Cost/latency logging exists.
- [ ] Skill IDs validated.
- [ ] Model abstraction exists.
- [ ] Circuit breaker behavior exists or is explicitly deferred.
