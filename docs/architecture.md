# Work Mode Architecture

## 1. Vision

Work Mode is a Claude-like chat experience for high-value tasks where the user wants control over how the answer is produced before the final answer is written.

The product should not try to expose the model's private chain-of-thought. Instead, it creates a visible, editable reasoning roadmap called a Work Plan. The Work Plan describes the structure the assistant will follow: role, artifact type, assumptions, source needs, validation steps, competitor or alternatives analysis, risks, and final output sections.

The core promise:

```text
Prompt -> classify work -> create editable Work Plan -> user approves -> generate final answer
```

## 2. Product Principles

- Work Mode controls the process before generation, not just the model's reasoning effort.
- The user can edit the Work Plan before the answer is generated.
- The system should infer the user's likely role and work artifact from the prompt.
- The system should suggest useful workflow modules that the user can include or remove.
- The final answer must be generated from the approved Work Plan.
- The product should use terms like "Work Plan", "Reasoning Roadmap", or "Answer Blueprint", not "raw thought process".

## 3. Core User Flow

```text
User opens Claude-like chat UI
  -> User selects Work Mode
  -> User enters a prompt
  -> Prompt Classifier detects role, artifact, task category, and confidence
  -> Workflow Planner creates an editable Work Plan
  -> Suggestion Engine shows optional modules as checkboxes
  -> User edits sections, assumptions, validations, and selected modules
  -> User approves the Work Plan
  -> Answer Generator produces the final response from the approved plan
  -> Validator checks the answer against the approved plan
  -> Final answer, validation notes, and next actions are shown
```

## 4. Modes

The interface can expose familiar modes:

- Low
- Medium
- High
- Max
- Thinking
- Work

Low, Medium, High, and Max can map to model effort, depth, or cost. Thinking mode can focus on deeper analysis. Work Mode is different because it adds a mandatory planning and approval step before final answer generation.

## 5. Main Concepts

### Role

The role answers: who is likely framing this prompt?

Examples:

- Product Manager
- Researcher
- Developer
- Founder
- Business Analyst
- Designer
- Marketer
- Student
- Executive

The detected role changes what the Work Plan prioritizes. A developer workflow should emphasize affected files, implementation steps, edge cases, and tests. A product manager workflow should emphasize users, problem framing, scope, requirements, metrics, and risks.

### Artifact

The artifact answers: what is the user trying to produce?

Examples:

- Code
- PRD
- BRD
- PPT
- Research Report
- Strategy Memo
- Competitive Analysis
- Email
- Roadmap
- Technical Design
- Bug Fix
- Test Plan

The artifact determines the final output structure.

### Workflow Template

A workflow template is a reusable structure for a type of task. It contains default sections, optional modules, validation rules, and output expectations.

Example template names:

- `prd_generation`
- `code_implementation`
- `research_report`
- `competitive_analysis`
- `brd_generation`
- `slide_deck`
- `technical_design`

### Work Plan

The Work Plan is the editable bridge between prompt and answer.

Recommended Work Plan blocks:

- Objective
- Detected role
- Detected artifact
- Assumptions
- Missing context
- Source or evidence needs
- Competitor, benchmark, or alternatives analysis
- Proposed final answer structure
- Validation checklist
- Drafting rules
- User-selected suggestions

## 6. Frontend Architecture

The current prototype can be built as a Vite + React app.

```text
React App
  App Shell
    Sidebar
    Conversation Area
    Mode Selector
    Prompt Composer

  Work Mode Flow
    Prompt Input
    Detection Summary
    Suggestion Checklist
    Editable Work Plan
    Approval Actions
    Final Answer Panel
    Validation Panel

  State Layer
    currentMode
    currentPrompt
    detectedRole
    detectedArtifact
    selectedWorkflow
    suggestions
    workPlan
    approvalStatus
    generatedAnswer
    validationResult
```

Recommended component split:

```text
frontend/src/
  App.tsx
  components/
    ModeSelector.tsx
    PromptComposer.tsx
    DetectionSummary.tsx
    SuggestionChecklist.tsx
    WorkPlanEditor.tsx
    ApprovalBar.tsx
    AnswerPanel.tsx
    ValidationPanel.tsx
  lib/
    workModeClassifier.ts
    workflowTemplates.ts
    workPlanBuilder.ts
    mockAnswerGenerator.ts
    validation.ts
  types/
    workMode.ts
```

For the MVP, the classifier and planner can be deterministic local functions. This keeps the interface testable before connecting real model APIs.

## 7. Backend Architecture

Production should move classification, planning, persistence, generation, and validation into backend services.

```text
Client
  -> API Gateway / Backend
      -> Prompt Classification Service
      -> Workflow Template Service
      -> Work Plan Service
      -> Answer Generation Service
      -> Validation Service
      -> Source / Retrieval Service
      -> Persistence Layer
```

Suggested stack:

- Frontend: React, Vite or Next.js, Tailwind CSS
- Backend: Node.js with Fastify, Express, or Next.js API routes
- Database: PostgreSQL
- ORM: Prisma
- Cache / jobs: Redis
- AI orchestration: provider abstraction around Claude, OpenAI, or another model
- Optional workflow engine: LangGraph or a lightweight custom orchestrator
- Optional retrieval: pgvector, Pinecone, Weaviate, or another vector store

For the prototype, use a single backend service first. Split into separate services only after the Work Mode loop is proven.

## 8. AI Orchestration

Work Mode should use staged model calls instead of one large prompt.

```text
Stage 1: Prompt Classifier
  Input: user prompt
  Output: role, artifact, task category, confidence, suggested workflow

Stage 2: Suggestion Engine
  Input: classifier output + prompt
  Output: optional modules user can tick

Stage 3: Workflow Planner
  Input: prompt + role + artifact + selected template
  Output: editable Work Plan JSON

Stage 4: User Approval
  Input: user-edited Work Plan
  Output: approved Work Plan

Stage 5: Answer Generator
  Input: original prompt + approved Work Plan + selected suggestions
  Output: final answer

Stage 6: Validator
  Input: approved Work Plan + final answer
  Output: missing sections, unsupported claims, quality notes
```

This architecture gives users control without pretending to control the model's hidden reasoning.

## 9. Workflow Templates

The workflow catalog must be canonical. All classifiers, UI dropdowns, prompts, schemas, and validators should import from this catalog rather than duplicating string literals.

Canonical workflow IDs for the prototype:

```ts
export const WORKFLOW_IDS = [
  "prd_generation",
  "brd_generation",
  "code_implementation",
  "debugging_bug_fix",
  "research_report",
  "competitive_analysis",
  "slide_deck",
  "technical_architecture",
  "strategy_memo",
  "data_analysis_plan"
] as const;
```

### PRD Workflow

```json
{
  "id": "prd_generation",
  "name": "PRD Generation",
  "defaultSections": [
    "Objective",
    "Problem Statement",
    "Target Users",
    "User Personas",
    "Use Cases",
    "Functional Requirements",
    "Non-functional Requirements",
    "MVP Scope",
    "Success Metrics",
    "Risks",
    "Open Questions"
  ],
  "optionalModules": [
    "Competitor Analysis",
    "Technical Architecture",
    "Go-to-market Notes",
    "Pricing Considerations",
    "Launch Plan"
  ]
}
```

### Code Workflow

```json
{
  "id": "code_implementation",
  "name": "Code Implementation",
  "defaultSections": [
    "Understand Requirement",
    "Inspect Existing Code",
    "Identify Affected Files",
    "Implementation Plan",
    "Edge Cases",
    "Testing Plan",
    "Final Change Summary"
  ],
  "optionalModules": [
    "Security Review",
    "Performance Review",
    "Migration Plan",
    "Rollback Plan"
  ]
}
```

### Research Workflow

```json
{
  "id": "research_report",
  "name": "Research Report",
  "defaultSections": [
    "Research Objective",
    "Scope",
    "Key Questions",
    "Sources Needed",
    "Evidence Collection",
    "Analysis Framework",
    "Findings",
    "Limitations",
    "Recommendations"
  ],
  "optionalModules": [
    "Competitor Analysis",
    "Market Sizing",
    "User Interviews",
    "Citation Requirements",
    "Data Validation"
  ]
}
```

## 10. API Design

### Analyze Prompt

```http
POST /api/work-mode/analyze
```

Request:

```json
{
  "conversationId": "conv_123",
  "mode": "work",
  "prompt": "Create a PRD for an AI meeting summarizer for remote teams."
}
```

Response:

```json
{
  "analysisId": "analysis_123",
  "detectedRole": "Product Manager",
  "detectedArtifact": "PRD",
  "taskCategory": "product_planning",
  "confidence": 0.91,
  "recommendedWorkflowId": "prd_generation",
  "suggestions": [
    {
      "id": "competitor_analysis",
      "label": "Include competitor analysis",
      "selected": true
    },
    {
      "id": "success_metrics",
      "label": "Add success metrics",
      "selected": true
    }
  ]
}
```

### Create Work Plan

```http
POST /api/work-mode/work-plans
```

Request:

```json
{
  "analysisId": "analysis_123",
  "prompt": "Create a PRD for an AI meeting summarizer for remote teams.",
  "roleOverride": null,
  "artifactOverride": null,
  "workflowOverride": null,
  "selectedModuleIds": ["competitor_analysis", "metrics"],
  "sourceMode": "source_needed_only"
}
```

`analysisId` is the source of truth. The backend should load the saved analysis and then apply explicit user overrides. The frontend should not resend authoritative classification fields such as `detectedRole` or `recommendedWorkflowId` unless they are clearly marked as overrides.

Response:

```json
{
  "workPlanId": "wp_123",
  "status": "draft",
  "plan": {
    "objective": "Create a complete PRD for an AI meeting summarizer.",
    "assumptions": [
      "The target users are remote-first teams.",
      "The first product version is web-based."
    ],
    "sections": [
      {
        "id": "problem",
        "title": "Problem Statement",
        "instructions": "Describe the core user pain and business opportunity.",
        "required": true
      },
      {
        "id": "metrics",
        "title": "Success Metrics",
        "instructions": "Define measurable product and business outcomes.",
        "required": true
      }
    ],
    "validationCriteria": [
      "The final answer must be structured as a PRD.",
      "The final answer must include risks and open questions."
    ]
  }
}
```

### Update Work Plan

```http
PATCH /api/work-mode/work-plans/:workPlanId
```

The user can edit any draft plan. Editing an approved plan should reset it to draft.

### Approve Work Plan

```http
POST /api/work-mode/work-plans/:workPlanId/approve
```

### Generate Answer

```http
POST /api/work-mode/work-plans/:workPlanId/generate
```

Response:

```json
{
  "answerId": "ans_123",
  "workPlanId": "wp_123",
  "answer": "Final generated answer...",
  "validation": {
    "matchesApprovedPlan": true,
    "missingSections": [],
    "qualityScore": 8.7,
    "notes": [
      "Consider adding more specific adoption metrics."
    ]
  }
}
```

## 11. Data Model

```text
users
  id
  email
  name
  created_at

conversations
  id
  user_id
  title
  current_mode
  created_at
  updated_at

messages
  id
  conversation_id
  role
  content
  created_at

workflow_templates
  id
  name
  artifact_type
  role_hint
  template_json
  created_at
  updated_at

prompt_analyses
  id
  conversation_id
  prompt_message_id
  detected_role
  detected_artifact
  task_category
  confidence
  recommended_workflow_id
  suggestions_json
  created_at

work_plans
  id
  conversation_id
  prompt_analysis_id
  workflow_template_id
  status
  source_mode
  plan_json
  approved_plan_json
  version
  created_at
  updated_at
  approved_at

generated_outputs
  id
  work_plan_id
  answer
  validation_json
  created_at

sources
  id
  conversation_id
  type
  title
  url
  content_hash
  metadata_json
  created_at

source_refs
  id
  source_id
  work_plan_id
  generated_output_id
  claim_text
  metadata_json
```

## 12. TypeScript Contracts

```ts
export type WorkMode = "low" | "medium" | "high" | "max" | "thinking" | "work";

export type WorkRole =
  | "Product Manager"
  | "Researcher"
  | "Developer"
  | "Founder"
  | "Business Analyst"
  | "Designer"
  | "Marketer"
  | "Executive"
  | "Unknown";

export type WorkArtifact =
  | "Code"
  | "PRD"
  | "BRD"
  | "PPT"
  | "Research Report"
  | "Strategy Memo"
  | "Competitive Analysis"
  | "Technical Design"
  | "Unknown";

export type SourceMode =
  | "none"
  | "source_needed_only"
  | "user_uploaded"
  | "web_search";

export type WorkSuggestion = {
  id: string;
  label: string;
  description: string;
  selected: boolean;
};

export type PromptAnalysis = {
  id: string;
  detectedRole: WorkRole;
  detectedArtifact: WorkArtifact;
  taskCategory: string;
  audience?: string;
  primaryEntity?: string;
  confidence: number;
  recommendedWorkflowId: string;
  selectedModuleIds: string[];
  sourceMode: SourceMode;
  suggestions: WorkSuggestion[];
};

export type WorkPlanSection = {
  id: string;
  title: string;
  instructions: string;
  required: boolean;
  sourceRefs?: string[];
};

export type WorkPlan = {
  id: string;
  status: "draft" | "approved" | "generated";
  prompt: string;
  role: WorkRole;
  artifact: WorkArtifact;
  workflowId: string;
  objective: string;
  assumptions: string[];
  missingContext: string[];
  sections: WorkPlanSection[];
  validationCriteria: string[];
  selectedModuleIds: string[];
  sourceMode: SourceMode;
  version: number;
};

export type ValidationResult = {
  matchesApprovedPlan: boolean;
  missingSections: string[];
  unsupportedClaims: string[];
  qualityScore: number;
  notes: string[];
};
```

## 13. Prompting Strategy

### Classifier Prompt

The classifier should return strict JSON.

Expected output:

```json
{
  "detectedRole": "Product Manager",
  "detectedArtifact": "PRD",
  "taskCategory": "product_planning",
  "confidence": 0.91,
  "recommendedWorkflowId": "prd_generation",
  "reason": "The prompt asks for a product requirements document."
}
```

### Planner Prompt

The planner should create an external Work Plan, not private reasoning.

Rules:

- Do not generate the final answer.
- Generate editable sections.
- Include assumptions and missing context.
- Include validation criteria.
- Include selected optional modules.
- Keep the plan clear enough for a human to edit.

### Generator Prompt

The generator should receive:

- Original prompt
- Approved Work Plan
- Selected suggestions
- Output format requirements
- Any retrieved source snippets

Rules:

- Follow the approved Work Plan.
- Do not add major sections that conflict with the approved plan.
- Mark uncertainty clearly.
- Include citations when sources are available.

### Validator Prompt

The validator should check:

- Did the answer follow the approved Work Plan?
- Are required sections missing?
- Are there unsupported factual claims?
- Is the answer appropriate for the detected role and artifact?
- What should be improved?

## 14. Guardrails

- Never claim to expose the model's hidden chain-of-thought.
- Do not generate the final answer before approval in Work Mode.
- Editing a Work Plan after approval resets approval.
- High-impact areas such as legal, medical, financial, hiring, or security should trigger stricter validation.
- Separate user-provided facts from model-inferred claims.
- Mark missing context clearly.
- For research tasks, prefer source-backed answers.
- Store approved plans for auditability.
- Treat `analysisId`, `workPlanId`, and approved plan snapshots as immutable audit boundaries.
- Do not allow arbitrary model-generated workflow IDs, role names, artifact names, or module IDs.

## 15. MVP Scope

### Build First

- Claude-like chat shell
- Mode selector with Work Mode
- Prompt input
- Local prompt classifier
- Role and artifact detection
- Suggestion checklist
- Editable Work Plan
- Approve button
- Approval-gated answer generation
- Basic validation summary

For the first working prototype, implement only three polished workflows:

- `prd_generation`
- `slide_deck`
- `debugging_bug_fix`

Keep the remaining workflows in the catalog as planned extensions, not first-sprint commitments.

### Defer

- Multi-user collaboration
- Custom organization workflows
- Full retrieval system
- Web search citations
- Team admin controls
- Fine-grained audit exports
- Complex multi-agent orchestration

## 16. Implementation Milestones

### Milestone 1: Local React Prototype

- Keep all state in the frontend.
- Use deterministic local classification rules.
- Generate Work Plans from local JSON templates.
- Generate mock or model-backed answers.
- Prove the UX loop.

### Milestone 2: API Prototype

- Add backend endpoints for analysis, Work Plan creation, approval, generation, and validation.
- Persist conversations, analyses, Work Plans, and generated outputs.
- Add server-side model calls.

### Milestone 3: Evidence-Aware Work Mode

- Add document upload or URL input.
- Add source extraction and retrieval.
- Attach sources to Work Plan sections.
- Add citation-aware answer generation.
- Add claim-level validation.

### Milestone 4: Team/Enterprise Version

- Add organization workflow templates.
- Add admin-defined guardrails.
- Add approval history.
- Add review queues.
- Add exportable Work Plan and answer packets.

## 17. Recommended MVP File Structure

```text
frontend/src/
  App.tsx
  index.css
  main.tsx
  components/
    ModeSelector.tsx
    PromptComposer.tsx
    WorkModePanel.tsx
    DetectionSummary.tsx
    SuggestionChecklist.tsx
    WorkPlanEditor.tsx
    AnswerPanel.tsx
    ValidationPanel.tsx
  lib/
    classifyPrompt.ts
    buildWorkPlan.ts
    workflowTemplates.ts
    generateAnswer.ts
    validateAnswer.ts
  types/
    workMode.ts
```

The current prototype can keep everything inside `App.tsx` while the UX is still changing. Once the flow stabilizes, split into the structure above.

## 18. Success Metrics

- Percentage of Work Mode prompts where users approve the first generated plan.
- Percentage of Work Plans edited before approval.
- Time from prompt to approved plan.
- User rating of final answer quality.
- Reduction in regeneration attempts.
- Number of validation issues caught before final answer is accepted.
- Retention of users who use Work Mode for complex tasks.

## 19. Key Risk

The biggest risk is positioning. Users may interpret "thought process" as full access to the model's hidden reasoning. The product should be explicit: Work Mode provides an editable answer blueprint that guides generation. That is controllable, auditable, and useful without relying on hidden model internals.

## 20. Prototype Backend Goal

The prototype backend has one job: turn a raw user prompt into an approved, editable Work Plan and then generate an answer from that approved plan.

It should not be a complex multi-agent system in v1. It should be a thin orchestration API around these steps:

```text
1. Receive prompt
2. Detect role, artifact, task type, risk, and relevant workflow modules
3. Pick the best workflow template
4. Generate editable Work Plan JSON
5. Store Work Plan as draft
6. Accept user edits
7. Approve Work Plan
8. Generate answer using approved Work Plan only
9. Validate generated answer against approved Work Plan
```

For this repo, the fastest prototype path is:

```text
Current Vite React app
  -> Add small Node/Express backend
  -> Store data in local JSON or SQLite first
  -> Call OpenAI from backend only
  -> Keep OPENAI_API_KEY in backend .env
```

Never call OpenAI directly from the browser. The API key must stay server-side.

## 21. Prototype Backend File Structure

Recommended minimal backend structure:

```text
backend/
  index.ts
  env.ts
  openaiClient.ts
  routes/
    workMode.routes.ts
  services/
    promptNormalizer.ts
    deterministicDetector.ts
    llmClassifier.ts
    workflowPicker.ts
    workPlanGenerator.ts
    answerGenerator.ts
    answerValidator.ts
  templates/
    registries.ts
    workflows.ts
    moduleCatalog.ts
  storage/
    memoryStore.ts
    jsonStore.ts
  schemas/
    workModeSchemas.ts
```

Prototype scripts:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "dev:server": "tsx backend/index.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\""
  }
}
```

Suggested dependencies:

```text
openai
express
cors
dotenv
zod
concurrently
```

`tsx` is a runtime dependency in this prototype because Render starts the TypeScript backend with `npm run start:server`.

Use SQLite or local JSON only when you need persistence across refreshes. In-memory storage is enough for the first clickable prototype.

## 22. Backend Request Lifecycle

### Step 1: Normalize Prompt

Input:

```text
"make a ppt on competitors of perplexity for investors"
```

Normalize into:

```json
{
  "rawPrompt": "make a ppt on competitors of perplexity for investors",
  "normalizedPrompt": "Make a presentation about Perplexity competitors for investors.",
  "language": "en",
  "tokensApprox": 9,
  "explicitRoleHints": [],
  "explicitArtifactHints": ["ppt"],
  "explicitAudienceHints": ["investors"],
  "explicitEntityHints": ["perplexity"]
}
```

This can be deterministic code. Do not spend an LLM call here.

### Step 2: Deterministic Detection

Run fast keyword and pattern detection before calling the model.

The deterministic detector should return:

```json
{
  "roleCandidates": [
    { "role": "Researcher", "score": 0.55, "matchedSignals": ["competitors"] },
    { "role": "Founder", "score": 0.35, "matchedSignals": ["investors"] }
  ],
  "artifactCandidates": [
    { "artifact": "PPT", "score": 0.95, "matchedSignals": ["ppt"] },
    { "artifact": "Competitive Analysis", "score": 0.75, "matchedSignals": ["competitors"] }
  ],
  "moduleCandidates": [
    { "moduleId": "competitor_analysis", "score": 0.95 },
    { "moduleId": "investor_framing", "score": 0.85 },
    { "moduleId": "sources_required", "score": 0.65 }
  ],
  "riskLevel": "medium"
}
```

This makes the system feel fast and consistent. The LLM then resolves ambiguity instead of doing everything from scratch.

### Step 3: LLM Classification

Call the model with strict JSON output. The model receives:

- Raw prompt
- Normalized prompt
- Deterministic candidates
- Allowed role list
- Allowed artifact list
- Allowed workflow template IDs
- Allowed module IDs
- Allowed source modes

The model returns:

```json
{
  "detectedRole": "Researcher",
  "detectedArtifact": "PPT",
  "taskCategory": "competitive_research",
  "audience": "Investors",
  "primaryEntity": "Perplexity",
  "recommendedWorkflowId": "slide_deck",
  "confidence": 0.88,
  "reason": "The prompt asks for a presentation on competitors for an investor audience.",
  "selectedModuleIds": [
    "competitor_analysis",
    "market_landscape",
    "investor_framing",
    "sources_required",
    "validation_checklist"
  ],
  "sourceMode": "source_needed_only",
  "questionsForUser": [
    "Should the deck focus on business strategy, product comparison, or investment thesis?"
  ]
}
```

### Step 4: Reconcile Deterministic and LLM Results

Do not blindly trust the LLM classifier. Reconcile both systems.

Recommended rule:

```text
if deterministic artifact score >= 0.9:
  keep deterministic artifact
else:
  use LLM artifact

if LLM confidence >= 0.75:
  use LLM role
else:
  show top 2 role candidates and let user adjust

workflow = highest scoring workflow from workflowPicker()
modules = union(high deterministic modules, LLM selected modules)
sourceMode = maxStrictness(deterministic source need, LLM sourceMode, user preference)
```

This creates predictable behavior when the user writes clear keywords like "PRD", "PPT", "code", "debug", or "BRD".

Tie-break rules:

```text
if workflow scores differ by less than 8 points:
  show top 2 workflows in the UI

if artifact is explicit, such as "PPT" or "PRD":
  artifact wins over inferred artifact

if prompt has "fix", "bug", "error", or stack trace:
  prefer debugging_bug_fix over generic code_implementation

if prompt asks for "competitors" and "ppt/slides/deck":
  prefer slide_deck with competitor_analysis module over competitive_analysis as the primary workflow

if prompt asks for "latest", "recent", "sources", "market size", "pricing", or "competitors":
  set sourceMode to source_needed_only unless web search or user-uploaded sources are enabled
```

### Step 5: Pick Workflow Template

The workflow picker scores every template.

Suggested scoring:

```text
artifact match:       45 points
role match:           15 points
task category match:  20 points
keyword match:        10 points
module overlap:       10 points
```

Example:

```ts
function scoreWorkflow(input: WorkflowPickerInput, template: WorkflowTemplate) {
  let score = 0;

  if (template.artifacts.includes(input.detectedArtifact)) score += 45;
  if (template.roles.includes(input.detectedRole)) score += 15;
  if (template.taskCategories.includes(input.taskCategory)) score += 20;

  score += countMatches(input.signals, template.keywordSignals) * 2;
  score += countMatches(input.selectedModuleIds, template.defaultModules) * 2;

  return Math.min(score, 100);
}
```

If the top two workflows are close, show the recommended one plus a dropdown:

```text
Recommended: Competitive Analysis Deck
Other possible workflow: Investor Research Brief
```

### Step 6: Generate Editable Work Plan

The Work Plan generator combines:

- Original prompt
- Detection result
- Picked workflow template
- Selected modules
- User role
- Artifact
- Any clarifying user choices

Output must be structured JSON:

```json
{
  "objective": "Create an investor-facing competitive analysis deck about Perplexity.",
  "role": "Researcher",
  "artifact": "PPT",
  "audience": "Investors",
  "assumptions": [
    "The user wants a strategic overview rather than a fully designed slide file.",
    "Competitors include AI search, answer engines, and adjacent research tools."
  ],
  "missingContext": [
    "Target slide count",
    "Preferred competitor list",
    "Region or market focus"
  ],
  "sections": [
    {
      "id": "deck_goal",
      "title": "Deck Goal",
      "instructions": "State the investor-facing purpose of the deck.",
      "required": true
    },
    {
      "id": "market_landscape",
      "title": "Market Landscape",
      "instructions": "Frame the AI search and answer engine market.",
      "required": true
    },
    {
      "id": "competitor_matrix",
      "title": "Competitor Matrix",
      "instructions": "Compare Perplexity with direct and adjacent competitors.",
      "required": true
    }
  ],
  "suggestions": [
    {
      "id": "sources_required",
      "label": "Use recent sources",
      "description": "Mark claims that need current evidence or attach sources when available.",
      "selected": true
    }
  ],
  "validationCriteria": [
    "The final output must be structured as a slide-by-slide deck outline.",
    "The answer must separate facts from assumptions.",
    "Competitor claims must be marked as source-needed if live sources are unavailable."
  ]
}
```

### Step 7: User Edits and Approval

The frontend edits the Work Plan JSON through a friendly UI.

Backend rules:

```text
Draft Work Plan can be edited.
Approved Work Plan cannot be generated from if changed.
Any edit after approval resets status to draft.
Only approved Work Plans can generate final answers.
Generated answers should store the exact approved_plan_json snapshot.
```

### Step 8: Generate Final Answer

The answer generator prompt should include:

```text
System:
You are an assistant generating an answer from an approved external Work Plan.
Do not reveal private chain-of-thought.
Follow the Work Plan exactly.
If facts require sources and no sources are provided, mark them as source-needed.

User:
Original prompt:
...

Approved Work Plan:
...

Selected modules:
...

Output rules:
...
```

### Step 9: Validate Final Answer

Validation checks:

```text
Did the answer follow the approved artifact type?
Did it include every required Work Plan section?
Did it address selected modules?
Did it clearly mark assumptions?
Did it invent facts that needed sources?
Did it include actionable next steps?
```

Validation output:

```json
{
  "matchesApprovedPlan": true,
  "missingSections": [],
  "unsupportedClaims": [
    "Perplexity has X market share"
  ],
  "qualityScore": 8.4,
  "recommendedFixes": [
    "Add source-backed market share data before using this in an investor deck."
  ]
}
```

## 23. Detection Signal System

The system should use both explicit signals and inferred signals.

All signal outputs must resolve into canonical IDs from the registries in section 35. If a detector or model proposes an unknown ID, drop it and log it as `rejected_model_value`.

### Artifact Signals

```ts
const artifactSignals = {
  PRD: ["prd", "product requirement", "product requirements", "feature spec", "user stories"],
  BRD: ["brd", "business requirement", "business requirements", "business case"],
  PPT: ["ppt", "presentation", "slides", "deck", "pitch deck"],
  Code: ["code", "implement", "build", "fix bug", "debug", "repo", "component", "api"],
  "Research Report": ["research", "report", "study", "analysis", "sources", "citations"],
  "Competitive Analysis": ["competitor", "competitors", "benchmark", "alternatives", "comparison"],
  "Technical Design": ["architecture", "system design", "database schema", "api design", "technical design"],
  "Strategy Memo": ["strategy", "memo", "recommendation", "decision", "plan"]
};
```

### Role Signals

```ts
const roleSignals = {
  "Product Manager": ["prd", "feature", "roadmap", "mvp", "user story", "metrics", "requirements"],
  Researcher: ["research", "sources", "citations", "market", "competitor", "evidence"],
  Developer: ["code", "bug", "api", "database", "component", "test", "deploy"],
  Founder: ["startup", "investor", "pitch", "gtm", "market", "pricing", "moat"],
  "Business Analyst": ["brd", "process", "stakeholder", "business rules", "requirements"],
  Designer: ["ui", "ux", "wireframe", "prototype", "design system", "user flow"],
  Marketer: ["campaign", "seo", "ads", "copy", "positioning", "content"],
  Executive: ["strategy", "decision", "summary", "board", "risk", "recommendation"]
};
```

### Module Signals

```ts
const moduleSignals = {
  assumptions: ["assumption", "assume", "unknown", "context"],
  sources_required: ["source", "citation", "latest", "recent", "data", "evidence"],
  competitor_analysis: ["competitor", "benchmark", "alternative", "compare"],
  market_landscape: ["market", "landscape", "category", "ecosystem"],
  validation_checklist: ["validate", "verify", "test", "confidence", "check"],
  risk_analysis: ["risk", "blocker", "failure", "mitigation"],
  implementation_plan: ["build", "implement", "architecture", "technical"],
  metrics: ["metric", "kpi", "success", "measure"],
  user_personas: ["persona", "user", "customer", "segment"],
  investor_framing: ["investor", "pitch", "fundraising", "market size", "moat"],
  root_cause_analysis: ["root cause", "why", "diagnose", "debug"],
  test_cases: ["test", "tests", "qa", "regression"],
  api_examples: ["api", "endpoint", "contract", "request", "response"],
  database_schema: ["database", "schema", "table", "sql", "prisma"],
  tradeoff_analysis: ["tradeoff", "options", "pros", "cons", "decision"]
};
```

### Risk Signals

```ts
const riskSignals = {
  high: ["medical", "legal", "financial advice", "security vulnerability", "hiring decision"],
  medium: ["investor", "market size", "competitor", "pricing", "compliance"],
  low: ["brainstorm", "outline", "rewrite", "summary", "creative"]
};
```

Risk level changes validation strictness.

## 24. Workflow Template Catalog

The prototype should start with these templates.

### 1. PRD Generation

Picked when:

```text
Artifact: PRD
Role: Product Manager
Signals: feature, product requirements, user stories, MVP, metrics
```

Roadmap blocks:

- Objective
- Problem statement
- Target users
- Assumptions
- User stories
- Functional requirements
- Non-functional requirements
- MVP scope
- Success metrics
- Risks
- Open questions

Suggested modules:

- User personas
- Competitor analysis
- Technical architecture
- Launch plan
- Analytics plan

### 2. BRD Generation

Picked when:

```text
Artifact: BRD
Role: Business Analyst
Signals: business requirements, stakeholders, process, rules, scope
```

Roadmap blocks:

- Business objective
- Stakeholders
- Current process
- Proposed process
- Business requirements
- Functional requirements
- Constraints
- Dependencies
- Acceptance criteria
- Risks

Suggested modules:

- Process map
- RACI
- Compliance considerations
- Cost-benefit analysis

### 3. Code Implementation

Picked when:

```text
Artifact: Code
Role: Developer
Signals: implement, build, component, API, database, repo
```

Roadmap blocks:

- Requirement interpretation
- Existing code inspection
- Affected files
- Implementation steps
- Data model changes
- API changes
- Edge cases
- Tests
- Rollback notes

Suggested modules:

- Security review
- Performance review
- Migration plan
- Test cases

### 4. Debugging / Bug Fix

Picked when:

```text
Artifact: Code
Role: Developer
Signals: bug, error, failing, stack trace, not working, fix
```

Roadmap blocks:

- Symptom summary
- Reproduction steps
- Suspected causes
- Files or services to inspect
- Debugging steps
- Fix plan
- Regression tests
- Verification

Suggested modules:

- Logs analysis
- Root cause analysis
- Rollback risk

### 5. Research Report

Picked when:

```text
Artifact: Research Report
Role: Researcher
Signals: research, sources, cite, study, recent, evidence
```

Roadmap blocks:

- Research objective
- Scope
- Key questions
- Source strategy
- Evidence collection
- Analysis framework
- Findings
- Limitations
- Recommendations

Suggested modules:

- Citations
- Market sizing
- Expert quotes
- Data validation

### 6. Competitive Analysis

Picked when:

```text
Artifact: Competitive Analysis
Role: Researcher, Product Manager, Founder
Signals: competitor, comparison, benchmark, alternatives, market landscape
```

Roadmap blocks:

- Comparison objective
- Competitor set
- Evaluation criteria
- Product comparison
- Pricing comparison
- Positioning comparison
- Strengths and weaknesses
- Strategic implications
- Recommendations

Suggested modules:

- Feature matrix
- Pricing matrix
- SWOT
- Market map
- Source-backed claims

### 7. Slide Deck / PPT

Picked when:

```text
Artifact: PPT
Signals: ppt, slides, deck, presentation, pitch
```

Roadmap blocks:

- Deck goal
- Audience
- Narrative arc
- Slide-by-slide outline
- Key visuals
- Speaker notes
- Data or source needs
- Final CTA

Suggested modules:

- Investor framing
- Executive summary
- Competitor landscape
- Visual chart suggestions
- Appendix

### 8. Technical Architecture

Picked when:

```text
Artifact: Technical Design
Role: Developer
Signals: architecture, system design, backend, database, API, scalability
```

Roadmap blocks:

- System goal
- Functional requirements
- Non-functional requirements
- High-level architecture
- Services
- Data model
- API contracts
- Security
- Scalability
- Observability
- Deployment
- Risks

Suggested modules:

- Sequence diagrams
- Database schema
- API examples
- Tradeoff analysis

### 9. Strategy Memo

Picked when:

```text
Artifact: Strategy Memo
Role: Founder, Executive, Product Manager
Signals: strategy, recommendation, decision, plan, market, positioning
```

Roadmap blocks:

- Decision context
- Objective
- Options considered
- Evaluation criteria
- Recommendation
- Tradeoffs
- Risks
- Execution plan
- Metrics

Suggested modules:

- Competitor analysis
- Financial model assumptions
- GTM plan
- Risk register

### 10. Data Analysis Plan

Picked when:

```text
Artifact: Analysis
Role: Analyst, Researcher
Signals: dataset, data, analyze, dashboard, metric, trend
```

Roadmap blocks:

- Analysis objective
- Dataset requirements
- Metrics
- Segmentation
- Cleaning assumptions
- Analysis methods
- Charts
- Findings format
- Validation checks

Suggested modules:

- SQL plan
- Dashboard outline
- Statistical caveats
- Data quality checks

## 25. Workflow Picking Examples

### Example A

Prompt:

```text
Create a PRD for an AI meeting summarizer.
```

Detection:

```json
{
  "role": "Product Manager",
  "artifact": "PRD",
  "workflow": "prd_generation",
  "modules": ["user_personas", "metrics", "risk_analysis"]
}
```

Why:

```text
"PRD" is a direct artifact signal.
"meeting summarizer" is a product feature signal.
Product Manager is the highest role match.
```

### Example B

Prompt:

```text
Fix the login bug where users get redirected to dashboard but session is empty.
```

Detection:

```json
{
  "role": "Developer",
  "artifact": "Code",
  "workflow": "debugging_bug_fix",
  "modules": ["root_cause_analysis", "test_cases", "validation_checklist"]
}
```

Why:

```text
"Fix", "bug", "session", and "redirected" strongly indicate debugging.
```

### Example C

Prompt:

```text
Make a ppt on competitors of Perplexity for investors.
```

Detection:

```json
{
  "role": "Researcher",
  "artifact": "PPT",
  "workflow": "slide_deck",
  "audience": "Investors",
  "modules": ["competitor_analysis", "investor_framing", "sources_required"]
}
```

Why:

```text
"ppt" is a direct artifact signal.
"competitors" selects competitive analysis.
"investors" adds investor framing.
```

### Example D

Prompt:

```text
Design backend architecture for a Claude-like work mode app.
```

Detection:

```json
{
  "role": "Developer",
  "artifact": "Technical Design",
  "workflow": "technical_architecture",
  "modules": ["api_examples", "database_schema", "tradeoff_analysis"]
}
```

Why:

```text
"backend architecture" is a direct technical design signal.
```

## 26. OpenAI Integration for Prototype

Use the OpenAI API only in the backend.

Environment:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
OPENAI_ANSWER_MODEL=gpt-4.1
```

For a prototype, use a smaller model for classification and planning, and optionally a stronger model for final answer generation.

Recommended split:

```text
Classification: fast/cheap model
Work Plan generation: fast/cheap or mid model
Final answer generation: stronger model when quality matters
Validation: fast/cheap model
```

Example backend client:

```ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

### Classification Call Shape

```ts
const response = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  text: {
    format: {
      type: "json_schema",
      name: "prompt_analysis",
      strict: true,
      schema: PromptAnalysisJsonSchema
    }
  },
  input: [
    {
      role: "system",
      content: [
        "Classify the user's work request.",
        "Use only allowed enum values from the supplied registries.",
        "Do not invent roles, artifacts, workflows, modules, or source modes."
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({
        prompt,
        deterministicCandidates,
        allowedRoles,
        allowedArtifacts,
        allowedWorkflowIds,
        allowedModuleIds,
        allowedSourceModes
      })
    }
  ]
});
```

Parse the structured output and validate with Zod. If validation fails, do not repair by free-form prompting first; drop unknown enum values, log the rejected values, and fall back to deterministic detection when required fields are missing.

### Work Plan Generation Call Shape

```ts
const response = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  text: {
    format: {
      type: "json_schema",
      name: "work_plan",
      strict: true,
      schema: WorkPlanJsonSchema
    }
  },
  input: [
    {
      role: "system",
      content: [
        "Create an external editable Work Plan.",
        "Do not write the final answer.",
        "Do not reveal private chain-of-thought.",
        "Return only JSON matching the requested schema."
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({
        originalPrompt,
        classification,
        workflowTemplate,
        selectedModuleIds
      })
    }
  ]
});
```

### Final Generation Call Shape

```ts
const response = await openai.responses.create({
  model: process.env.OPENAI_ANSWER_MODEL ?? "gpt-4.1",
  input: [
    {
      role: "system",
      content: [
        "Generate the final answer using the approved Work Plan.",
        "Do not expose hidden chain-of-thought.",
        "Follow the approved sections and validation criteria.",
        "When facts need current sources and none are provided, mark them as source-needed."
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({
        originalPrompt,
        approvedWorkPlan,
        outputPreferences
      })
    }
  ]
});
```

Use structured outputs for classifier, Work Plan generation, and validator responses. Final answer generation can return normal text plus a structured validation pass afterward.

## 27. Backend Route Details

All backend routes should return a consistent envelope:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

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

Recommended status codes:

```text
200 OK: successful read/update/generate
201 Created: analysis or Work Plan created
400 Bad Request: invalid input
401 Unauthorized: missing auth, when auth exists
404 Not Found: unknown analysis/workPlan/output ID
409 Conflict: generating from unapproved or stale Work Plan
422 Unprocessable Entity: model output failed schema validation
429 Too Many Requests: rate limit or cost limit
500 Internal Server Error: unexpected backend failure
```

### POST `/api/work-mode/analyze`

Purpose:

```text
Detect role, artifact, workflow, and suggestions.
```

Server steps:

```text
1. Validate request body.
2. Normalize prompt.
3. Run deterministicDetector().
4. Run llmClassifier().
5. Reconcile both results.
6. Pick workflow.
7. Save analysis result.
8. Return analysis result.
```

### POST `/api/work-mode/work-plans`

Purpose:

```text
Create editable Work Plan draft.
```

Server steps:

```text
1. Validate analysisId or inline analysis payload.
2. Load saved analysis.
3. Apply role/artifact/workflow overrides if present.
4. Load workflow template.
5. Generate Work Plan JSON using model or local builder.
6. Validate Work Plan JSON with Zod.
7. Save draft with version 1.
8. Return draft plan.
```

### PATCH `/api/work-mode/work-plans/:id`

Purpose:

```text
Save user edits.
```

Server steps:

```text
1. Load Work Plan.
2. Reject stale writes if client version is older than server version.
3. Apply edit.
4. Validate full Work Plan.
5. If status was approved, reset to draft.
6. Increment version.
7. Save version.
8. Return updated plan.
```

### POST `/api/work-mode/work-plans/:id/approve`

Purpose:

```text
Freeze the Work Plan for generation.
```

Server steps:

```text
1. Load draft Work Plan.
2. Reject if required sections are empty.
3. Validate selected modules and sourceMode.
4. Copy plan_json into approved_plan_json.
5. Set status to approved.
6. Return approved state.
```

### POST `/api/work-mode/work-plans/:id/generate`

Purpose:

```text
Generate the final answer.
```

Server steps:

```text
1. Load Work Plan.
2. Reject if status is not approved.
3. Reject if approved_plan_json is missing.
4. Generate answer from approved_plan_json.
5. Validate answer.
6. Store generated output and validation result.
7. Set Work Plan status to generated.
8. Return answer and validation.
```

## 28. Zod Schemas

Use schemas to keep model output reliable.

```ts
import { z } from "zod";

export const WorkRoleSchema = z.enum([
  "Product Manager",
  "Researcher",
  "Developer",
  "Founder",
  "Business Analyst",
  "Designer",
  "Marketer",
  "Executive",
  "Unknown"
]);

export const WorkArtifactSchema = z.enum([
  "Code",
  "PRD",
  "BRD",
  "PPT",
  "Research Report",
  "Strategy Memo",
  "Competitive Analysis",
  "Technical Design",
  "Data Analysis",
  "Unknown"
]);

export const SourceModeSchema = z.enum([
  "none",
  "source_needed_only",
  "user_uploaded",
  "web_search"
]);

export const WorkflowIdSchema = z.enum([
  "prd_generation",
  "brd_generation",
  "code_implementation",
  "debugging_bug_fix",
  "research_report",
  "competitive_analysis",
  "slide_deck",
  "technical_architecture",
  "strategy_memo",
  "data_analysis_plan"
]);

export const ModuleIdSchema = z.enum([
  "assumptions",
  "sources_required",
  "competitor_analysis",
  "market_landscape",
  "validation_checklist",
  "risk_analysis",
  "implementation_plan",
  "metrics",
  "user_personas",
  "investor_framing",
  "root_cause_analysis",
  "test_cases",
  "api_examples",
  "database_schema",
  "tradeoff_analysis"
]);

export const WorkSuggestionSchema = z.object({
  id: ModuleIdSchema,
  label: z.string(),
  description: z.string(),
  selected: z.boolean()
});

export const PromptAnalysisSchema = z.object({
  detectedRole: WorkRoleSchema,
  detectedArtifact: WorkArtifactSchema,
  taskCategory: z.string(),
  audience: z.string().optional(),
  primaryEntity: z.string().optional(),
  recommendedWorkflowId: WorkflowIdSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  selectedModuleIds: z.array(ModuleIdSchema),
  sourceMode: SourceModeSchema,
  questionsForUser: z.array(z.string()).default([])
});

export const WorkPlanSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  instructions: z.string(),
  required: z.boolean()
});

export const WorkPlanSchema = z.object({
  objective: z.string(),
  role: WorkRoleSchema,
  artifact: WorkArtifactSchema,
  audience: z.string().optional(),
  sourceMode: SourceModeSchema,
  assumptions: z.array(z.string()),
  missingContext: z.array(z.string()),
  sections: z.array(WorkPlanSectionSchema),
  suggestions: z.array(WorkSuggestionSchema),
  validationCriteria: z.array(z.string()),
  version: z.number().int().min(1)
});

export const ValidationResultSchema = z.object({
  matchesApprovedPlan: z.boolean(),
  missingSections: z.array(z.string()),
  unsupportedClaims: z.array(z.string()),
  qualityScore: z.number().min(0).max(10),
  recommendedFixes: z.array(z.string())
});
```

## 29. Minimal In-Memory Store

For a prototype:

```ts
type Store = {
  analyses: Map<string, PromptAnalysis>;
  workPlans: Map<string, WorkPlanRecord>;
  outputs: Map<string, GeneratedOutput>;
};

export const store: Store = {
  analyses: new Map(),
  workPlans: new Map(),
  outputs: new Map()
};
```

Move to SQLite/PostgreSQL only after the flow works.

## 30. Frontend Integration Contract

The frontend should call:

```text
User submits prompt
  -> POST /api/work-mode/analyze
  -> POST /api/work-mode/work-plans
  -> Render editable plan
  -> PATCH /api/work-mode/work-plans/:id whenever user edits
  -> POST /api/work-mode/work-plans/:id/approve
  -> POST /api/work-mode/work-plans/:id/generate
```

Frontend states:

```ts
type WorkModeUiState =
  | "idle"
  | "analyzing"
  | "editing_plan"
  | "approving"
  | "approved"
  | "generating"
  | "complete"
  | "error";
```

UI behavior:

```text
Show detection summary after analyze.
Show role/artifact dropdowns so the user can override detection.
Show suggestions as checkboxes.
Show Work Plan as editable sections.
Disable Generate until approved.
If user edits after approval, hide old generated answer and require approval again.
```

## 31. What "Roadmap" Means in the Product

Use "roadmap" as the user-visible planning artifact. Internally call it `WorkPlan`.

Roadmap levels:

```text
Level 1: Task summary
Level 2: Role and artifact interpretation
Level 3: Assumptions and missing context
Level 4: Work modules selected
Level 5: Step-by-step answer structure
Level 6: Validation criteria
Level 7: Output format rules
```

Different tasks get different roadmap shapes:

```text
PRD roadmap -> users, requirements, metrics, risks
Code roadmap -> files, implementation steps, tests, edge cases
Research roadmap -> questions, sources, evidence, limitations
PPT roadmap -> narrative arc, slide outline, visuals, speaker notes
Strategy roadmap -> decision context, options, tradeoffs, recommendation
Architecture roadmap -> services, data model, APIs, deployment, risks
```

This gives the user real control without exposing hidden model reasoning.

## 32. Prototype Build Order

Build in this order:

```text
1. Add backend server and health route.
2. Add /api/work-mode/analyze with deterministic detection only.
3. Add workflow template catalog.
4. Add workflow picker.
5. Add /api/work-mode/work-plans with local Work Plan builder.
6. Connect frontend to analyze + draft Work Plan.
7. Add edit and approval state.
8. Add OpenAI classification behind a feature flag.
9. Add OpenAI Work Plan generation.
10. Add OpenAI answer generation.
11. Add validator.
12. Add persistence if needed.
```

Feature flags:

```env
USE_LLM_CLASSIFIER=true
USE_LLM_WORK_PLAN=true
USE_LLM_ANSWER=true
```

This lets the prototype work even if the API key is missing or rate-limited.

## 33. Failure Handling

### Missing API Key

```text
Use deterministic detection.
Use local template-based Work Plan.
Show mock answer generation or ask user to configure key.
```

### LLM JSON Parse Failure

```text
Retry once with JSON repair prompt.
If still failing, use deterministic fallback.
Log the failed raw response for debugging.
```

### Low Classification Confidence

```text
Show role/artifact choices to user.
Preselect best guess.
Require confirmation before Work Plan creation.
```

### Required Context Missing

```text
Do not block the flow.
Add missing context into the Work Plan.
Let the user edit or approve assumptions.
```

### Source-Heavy Request Without Search

```text
Mark source-dependent sections as "source-needed".
Avoid pretending facts are verified.
```

## 34. Local Development Setup

Create `.env`:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_ANSWER_MODEL=gpt-4.1
PORT=8787
```

Run frontend:

```bash
npm run dev
```

Run backend:

```bash
npm run dev:server
```

Frontend should call:

```text
http://127.0.0.1:8787/api/work-mode/*
```

For production, deploy frontend and backend together or use a single Next.js app with API routes.

## 35. Canonical Prototype Registries

This section is the implementation source of truth. The frontend, backend, detector, workflow picker, prompts, Zod schemas, and tests should use these IDs.

### Roles

```ts
export const WORK_ROLES = [
  "Product Manager",
  "Researcher",
  "Developer",
  "Founder",
  "Business Analyst",
  "Designer",
  "Marketer",
  "Executive",
  "Unknown"
] as const;
```

### Artifacts

```ts
export const WORK_ARTIFACTS = [
  "Code",
  "PRD",
  "BRD",
  "PPT",
  "Research Report",
  "Strategy Memo",
  "Competitive Analysis",
  "Technical Design",
  "Data Analysis",
  "Unknown"
] as const;
```

### Source Modes

```ts
export const SOURCE_MODES = [
  "none",
  "source_needed_only",
  "user_uploaded",
  "web_search"
] as const;
```

Source mode behavior:

```text
none:
  Use when the task is creative, structural, or based only on user-provided context.

source_needed_only:
  Use when claims need evidence but the prototype has no retrieval/search enabled.
  The answer must mark unverifiable claims as source-needed.

user_uploaded:
  Use when the user provides files or pasted source material.
  The answer should cite or reference those sources.

web_search:
  Use when live web retrieval is enabled.
  The answer should attach citations and freshness notes.
```

### Modules

```ts
export const MODULE_CATALOG = {
  assumptions: {
    label: "Assumptions",
    description: "List the assumptions the assistant will rely on."
  },
  sources_required: {
    label: "Sources required",
    description: "Identify claims that need current or external evidence."
  },
  competitor_analysis: {
    label: "Competitor analysis",
    description: "Compare competitors, alternatives, positioning, and tradeoffs."
  },
  market_landscape: {
    label: "Market landscape",
    description: "Frame the category, segments, trends, and ecosystem."
  },
  validation_checklist: {
    label: "Validation checklist",
    description: "Define checks the final answer must pass."
  },
  risk_analysis: {
    label: "Risk analysis",
    description: "Identify risks, blockers, mitigations, and open questions."
  },
  implementation_plan: {
    label: "Implementation plan",
    description: "Break the work into buildable technical or execution steps."
  },
  metrics: {
    label: "Metrics",
    description: "Define success metrics, KPIs, or measurement criteria."
  },
  user_personas: {
    label: "User personas",
    description: "Describe target users, needs, and contexts."
  },
  investor_framing: {
    label: "Investor framing",
    description: "Adapt the output for investor priorities, market narrative, and moat."
  },
  root_cause_analysis: {
    label: "Root cause analysis",
    description: "Structure debugging around symptoms, causes, and verification."
  },
  test_cases: {
    label: "Test cases",
    description: "Add tests, acceptance checks, and regression coverage."
  },
  api_examples: {
    label: "API examples",
    description: "Include endpoint, request, and response examples."
  },
  database_schema: {
    label: "Database schema",
    description: "Include tables, entities, relationships, and migrations."
  },
  tradeoff_analysis: {
    label: "Tradeoff analysis",
    description: "Compare options and explain why one approach is preferred."
  }
} as const;
```

### Workflow Registry

```ts
export const WORKFLOW_REGISTRY = {
  prd_generation: {
    name: "PRD Generation",
    artifacts: ["PRD"],
    roles: ["Product Manager", "Founder"],
    taskCategories: ["product_planning"],
    keywordSignals: ["prd", "product requirements", "feature", "mvp", "user story"],
    defaultModules: ["assumptions", "user_personas", "metrics", "risk_analysis", "validation_checklist"],
    defaultSourceMode: "none"
  },
  brd_generation: {
    name: "BRD Generation",
    artifacts: ["BRD"],
    roles: ["Business Analyst", "Executive"],
    taskCategories: ["business_requirements"],
    keywordSignals: ["brd", "business requirements", "stakeholders", "business rules"],
    defaultModules: ["assumptions", "metrics", "risk_analysis", "validation_checklist"],
    defaultSourceMode: "none"
  },
  code_implementation: {
    name: "Code Implementation",
    artifacts: ["Code"],
    roles: ["Developer"],
    taskCategories: ["software_build"],
    keywordSignals: ["code", "implement", "build", "component", "api", "database"],
    defaultModules: ["implementation_plan", "test_cases", "validation_checklist"],
    defaultSourceMode: "none"
  },
  debugging_bug_fix: {
    name: "Debugging / Bug Fix",
    artifacts: ["Code"],
    roles: ["Developer"],
    taskCategories: ["software_debugging"],
    keywordSignals: ["bug", "error", "failing", "stack trace", "not working", "fix"],
    defaultModules: ["root_cause_analysis", "test_cases", "validation_checklist", "risk_analysis"],
    defaultSourceMode: "none"
  },
  research_report: {
    name: "Research Report",
    artifacts: ["Research Report"],
    roles: ["Researcher"],
    taskCategories: ["research"],
    keywordSignals: ["research", "sources", "citations", "study", "evidence"],
    defaultModules: ["sources_required", "market_landscape", "validation_checklist"],
    defaultSourceMode: "source_needed_only"
  },
  competitive_analysis: {
    name: "Competitive Analysis",
    artifacts: ["Competitive Analysis"],
    roles: ["Researcher", "Product Manager", "Founder"],
    taskCategories: ["competitive_research"],
    keywordSignals: ["competitor", "comparison", "benchmark", "alternatives"],
    defaultModules: ["competitor_analysis", "market_landscape", "sources_required", "validation_checklist"],
    defaultSourceMode: "source_needed_only"
  },
  slide_deck: {
    name: "Slide Deck / PPT",
    artifacts: ["PPT"],
    roles: ["Founder", "Researcher", "Product Manager", "Executive"],
    taskCategories: ["presentation"],
    keywordSignals: ["ppt", "slides", "deck", "presentation", "pitch"],
    defaultModules: ["assumptions", "validation_checklist"],
    defaultSourceMode: "none"
  },
  technical_architecture: {
    name: "Technical Architecture",
    artifacts: ["Technical Design"],
    roles: ["Developer"],
    taskCategories: ["technical_design"],
    keywordSignals: ["architecture", "system design", "backend", "database", "api"],
    defaultModules: ["api_examples", "database_schema", "tradeoff_analysis", "risk_analysis"],
    defaultSourceMode: "none"
  },
  strategy_memo: {
    name: "Strategy Memo",
    artifacts: ["Strategy Memo"],
    roles: ["Founder", "Executive", "Product Manager"],
    taskCategories: ["strategy"],
    keywordSignals: ["strategy", "recommendation", "decision", "positioning"],
    defaultModules: ["tradeoff_analysis", "risk_analysis", "metrics", "validation_checklist"],
    defaultSourceMode: "none"
  },
  data_analysis_plan: {
    name: "Data Analysis Plan",
    artifacts: ["Data Analysis"],
    roles: ["Researcher", "Business Analyst"],
    taskCategories: ["data_analysis"],
    keywordSignals: ["dataset", "data", "analyze", "dashboard", "metric", "trend"],
    defaultModules: ["metrics", "validation_checklist", "sources_required"],
    defaultSourceMode: "source_needed_only"
  }
} as const;
```

### MVP Workflow Priority

For the prototype, build in this priority:

```text
1. slide_deck
2. prd_generation
3. debugging_bug_fix
4. technical_architecture
5. competitive_analysis
```

The first three should feel polished before expanding the catalog.

## 36. Architecture Gaps Fixed

The architecture now resolves these previous gaps:

- Canonical workflow IDs replaced inconsistent names like `slide_deck_competitive_analysis`.
- Modules now use one catalog instead of ad hoc labels.
- Runtime schemas use enums instead of loose strings.
- `analysisId` is the backend source of truth for Work Plan creation.
- User changes are represented as overrides, not duplicate classification state.
- `sourceMode` makes source-heavy work explicit.
- Approval and generation use immutable plan snapshots.
- Work Plan edits use versioning to prevent stale writes.
- The first prototype scope is narrowed to three workflows.
- Backend routes have consistent status codes and error envelopes.

## 37. WebSocket, SSE, And Streaming Strategy

The prototype does not need WebSockets for the main Work Mode flow.

Use this transport strategy:

```text
Planning steps:
  HTTP request/response

Work Plan editing:
  HTTP PATCH

Approval:
  HTTP POST

Final answer generation:
  Start with HTTP request/response
  Add Server-Sent Events (SSE) if token streaming is needed

Realtime collaboration:
  WebSocket later, not MVP
```

### Why Not WebSocket For MVP

WebSockets are useful when the product needs bidirectional realtime state:

- Multi-user collaborative roadmap editing.
- Live cursor presence.
- Long-running job progress with client actions during generation.
- Tool execution events that need interactive cancellation.

The MVP does not need those yet. HTTP is simpler, easier to deploy on Vercel + Render, and easier to debug.

### Recommended MVP Streaming

If the final answer feels slow, add SSE:

```http
POST /api/work-mode/work-plans/:id/generate
```

Returns normal JSON in the first version.

Later add:

```http
GET /api/work-mode/outputs/:answerId/stream
```

or:

```http
POST /api/work-mode/work-plans/:id/generate-stream
```

SSE event types:

```text
generation.started
generation.delta
generation.completed
generation.validation_started
generation.validation_completed
generation.error
```

SSE payload example:

```json
{
  "event": "generation.delta",
  "answerId": "ans_123",
  "delta": "## Slide 1: Market context"
}
```

### WebSocket Future Upgrade

Add WebSockets only when at least one of these is true:

- Multiple users edit the same Work Plan.
- The frontend needs live job cancellation or tool-control messages.
- The app shows live model/tool traces.
- The product has workspace/team presence.

If WebSockets are added later, use them for state events, not for exposing hidden model reasoning.

## 38. OpenAI API Key Ownership

The OpenAI API key must only live on the backend.

```text
Browser:
  no OPENAI_API_KEY

Vercel frontend:
  only VITE_WORK_MODE_API_BASE

Render backend:
  OPENAI_API_KEY
  OPENAI_MODEL
  OPENAI_ANSWER_MODEL
```

Frontend calls your backend:

```text
Browser -> Render backend -> OpenAI API
```

Never:

```text
Browser -> OpenAI API
```

### Backend OpenAI Flow

```text
/api/work-mode/analyze
  -> deterministic detector
  -> optional OpenAI classifier
  -> save analysis

/api/work-mode/work-plans
  -> load saved analysis
  -> optional OpenAI Work Plan generator
  -> validate with schema
  -> save draft

/api/work-mode/work-plans/:id/generate
  -> load approved plan snapshot
  -> call OpenAI answer model
  -> validate answer
  -> save output
```

### Key Security Rules

- Store key in `.env` locally and Render environment variables in deployment.
- Do not prefix it with `VITE_`.
- Do not log it.
- Do not return it in health routes.
- Do not put it in frontend bundle.
- Add request-size and prompt-length limits before model calls.
- Add rate limiting before public demos.

## 39. Skills, Roadmap Templates, And Suggested Options

In this product, "skills" should be implemented as backend-owned workflow capabilities, not as hidden model abilities.

A skill is a selectable capability made from:

- Skill ID.
- Display label.
- Description.
- Matched signals.
- Supported roles.
- Supported artifacts.
- Default roadmap sections.
- Optional modules.
- Validation rules.

### Skill Catalog

Use a backend skill catalog derived from the workflow registry and module catalog.

```ts
type SkillDefinition = {
  id: string;
  label: string;
  description: string;
  workflowId: WorkflowId;
  supportedRoles: WorkRole[];
  supportedArtifacts: WorkArtifact[];
  matchedSignals: string[];
  defaultModuleIds: ModuleId[];
  optionalModuleIds: ModuleId[];
  roadmapTemplate: {
    sections: WorkPlanSection[];
    validationCriteria: string[];
  };
};
```

MVP skills:

```text
investor_deck_builder
prd_builder
bug_fix_planner
```

Planned skills:

```text
technical_architecture_planner
competitive_research_planner
research_report_planner
strategy_memo_planner
```

### How Skills Are Fetched

Frontend fetches available skills from backend:

```http
GET /api/work-mode/skills
```

Response:

```json
{
  "skills": [
    {
      "id": "investor_deck_builder",
      "label": "Investor Deck Builder",
      "description": "Creates a slide-by-slide investor-facing deck roadmap.",
      "workflowId": "slide_deck",
      "supportedArtifacts": ["PPT"],
      "defaultModuleIds": ["assumptions", "validation_checklist"],
      "optionalModuleIds": ["competitor_analysis", "investor_framing", "sources_required"]
    }
  ]
}
```

Then prompt analysis returns ranked skills:

```json
{
  "recommendedSkillId": "investor_deck_builder",
  "skillCandidates": [
    {
      "skillId": "investor_deck_builder",
      "score": 0.91,
      "matchedSignals": ["ppt", "competitors", "investors"]
    }
  ]
}
```

Frontend shows:

- Recommended skill.
- Alternative skills.
- Skill-specific optional modules as checkboxes.
- Source mode.
- Roadmap template preview.

### How Options Are Shown

Suggested options should come from three sources:

```text
1. Default modules from selected skill.
2. Conditional modules from prompt signals.
3. User-selected modules from previous edit state.
```

Option state:

```ts
type SkillOption = {
  moduleId: ModuleId;
  label: string;
  description: string;
  selected: boolean;
  required: boolean;
  reason: string;
};
```

Example:

```json
{
  "moduleId": "competitor_analysis",
  "label": "Competitor analysis",
  "selected": true,
  "required": false,
  "reason": "The prompt mentions competitors."
}
```

## 40. Customizable Roadmaps And Edge Cases

Roadmaps must be editable, but not unbounded chaos. The system should allow customization while preserving a valid plan.

### User Can Edit

- Objective.
- Assumptions.
- Missing context.
- Section titles.
- Section instructions.
- Section order.
- Optional sections.
- Validation criteria.
- Selected modules.
- Source mode.
- Skill/workflow selection before approval.

### User Cannot Edit Directly

- Work Plan ID.
- Analysis ID.
- Approved plan snapshot.
- Generated output ID.
- Server version.
- Canonical skill/module/workflow IDs except through explicit selection controls.

### Required Section Rules

Required sections:

- Can be edited.
- Can be reordered.
- Cannot be deleted unless the user converts them to optional and confirms.
- Cannot have empty title or instructions at approval time.

Optional sections:

- Can be added.
- Can be removed.
- Can be reordered.

### Roadmap Versioning

Every saved Work Plan has a version.

```text
Create Work Plan -> version 1
Edit Work Plan -> version + 1
Approve Work Plan -> freeze current version
Edit after approval -> status returns to draft, version + 1
Generate answer -> uses approved snapshot only
```

### Custom Roadmap Templates

For later versions, users can save a roadmap as a custom template:

```http
POST /api/work-mode/roadmap-templates
```

Template fields:

```ts
type RoadmapTemplate = {
  id: string;
  name: string;
  baseWorkflowId: WorkflowId;
  role: WorkRole;
  artifact: WorkArtifact;
  moduleIds: ModuleId[];
  sections: WorkPlanSection[];
  validationCriteria: string[];
  visibility: "private" | "workspace";
};
```

Not MVP unless needed for demo.

### Important Edge Cases

#### User switches skill after editing roadmap

Behavior:

```text
Show confirmation.
Keep custom sections where possible.
Add missing required sections from new skill.
Mark removed incompatible sections as archived, not deleted immediately.
Reset approval to draft.
```

#### User removes all sections

Behavior:

```text
Allow editing temporarily.
Block approval.
Show "At least one section is required."
```

#### User removes source-needed module from research task

Behavior:

```text
Allow it.
Warn that factual claims may be marked as unverified.
Keep sourceMode visible.
```

#### User selects web_search but backend has no web search

Behavior:

```text
Disable web_search in UI, or convert to source_needed_only.
Never pretend live sources were checked.
```

#### LLM returns unknown skill/module/workflow

Behavior:

```text
Drop unknown ID.
Log rejected_model_value.
Use deterministic fallback if required fields are invalid.
```

#### User edits after answer generation

Behavior:

```text
Keep old answer as stale or hide it.
Reset plan status to draft.
Require approval and regeneration.
```

#### Concurrent edits or stale version

Behavior:

```text
Backend rejects stale version with 409.
Frontend reloads latest Work Plan and asks user to reapply edits.
```

#### Very large roadmap

Behavior:

```text
Warn when section count or instruction length is too high.
Compress plan before sending to answer model.
Require user confirmation if generation may be expensive.
```

## 41. Skills By Phase

Use these development skills for each phase.

| Phase | Primary Skills | Supporting Skills | Why |
|---|---|---|---|
| 1. Research and assets | `$llm-wiki`, `$llm-testing`, `$rag-architect` | `$frontend-design`, `$backend-developer`, `$machine-learning-engineer`, `$impeccable` | Build durable research assets, prompt fixtures, safety tests, source-mode thinking, and shared contracts. |
| 2. Frontend shell | `$frontend-design`, `$impeccable` | `$design-taste-frontend`, `$debugger`, `$backend-developer` | Build and polish the Claude-like app shell while keeping a future backend client boundary. |
| 3. Work Mode entry | `$frontend-design`, `$impeccable` | `$llm-testing`, `$debugger`, `$backend-developer` | Build detection summary, confidence states, overrides, and low-confidence handling. |
| 4. Suggestions UI | `$frontend-design`, `$impeccable` | `$backend-developer`, `$rag-architect`, `$llm-testing`, `$design-taste-frontend` | Build skill selector, module checklist, source mode controls, and payload contract. |
| 5. Editable Work Plan | `$frontend-design`, `$impeccable` | `$backend-developer`, `$debugger`, `$llm-testing`, `$design-taste-frontend` | Build roadmap editor, customization rules, validation states, and backend-compatible update shape. |
| 6. Approval and answer UI | `$frontend-design`, `$impeccable` | `$debugger`, `$llm-testing`, `$backend-developer`, `$design-taste-frontend` | Complete frontend-only flow, approval gating, mock answer, validation, and backend-ready errors. |
| 7. Backend foundation | `$backend-developer` | `$debugger`, `$machine-learning-engineer`, `$llm-testing`, `$frontend-design` | Implement server foundation, key isolation, CORS, request IDs, errors, and safety limits. |
| 8. Detection system | `$backend-developer`, `$llm-testing` | `$machine-learning-engineer`, `$debugger`, `$rag-architect`, `$frontend-design` | Build deterministic classifier, scoring, source-mode detection, fixtures, and analysis persistence. |
| 9. Workflow registry | `$backend-developer`, `$rag-architect` | `$llm-testing`, `$machine-learning-engineer`, `$debugger`, `$frontend-design` | Build canonical registries, skill catalog, templates, schemas, and Work Plan creation. |
| 10. OpenAI planning | `$machine-learning-engineer`, `$llm-testing` | `$backend-developer`, `$debugger`, `$rag-architect`, `$llm-wiki` | Add structured outputs, model routing, fallback, evaluation, and prompt/version notes. |
| 11. Approval, answer, validation backend | `$backend-developer`, `$machine-learning-engineer` | `$llm-testing`, `$debugger`, `$rag-architect`, `$frontend-design`, `$impeccable` | Implement lifecycle routes, immutable snapshots, generation, validation, and frontend integration. |
| 12. Vercel + Render deployment | `$backend-developer`, `$debugger` | `$frontend-design`, `$machine-learning-engineer`, `$llm-testing`, `$rag-architect`, `$impeccable` | Deploy, configure env/CORS, smoke test, diagnose production issues, and polish final UI. |

Skill usage rules:

- Use `$frontend-design` for actual React UI construction.
- Use `$design-taste-frontend` as a taste and anti-generic visual review layer, not as the main product UI implementation skill.
- Use `$impeccable` for product UI critique, hardening, accessibility, edge states, and final polish.
- Use `$backend-developer` for all server routes, API contracts, env handling, CORS, storage, and deployment backend work.
- Use `$debugger` whenever behavior diverges from expected state, routes fail, schemas fail, or deployment breaks.
- Use `$llm-testing` for classifier, planner, answer generator, privacy, safety, prompt-injection, and robustness tests.
- Use `$machine-learning-engineer` for model routing, latency, timeouts, fallback, serving, and cost behavior.
- Use `$rag-architect` for source modes, retrieval-ready fields, source-backed validation, and future RAG/web-search design.
- Use `$llm-wiki` for durable research notes, prompt/version logs, evaluation findings, and evolving product knowledge.

## 42. Contract Alignment Decisions

The frontend and backend must use one canonical Work Mode contract.

### Work Plan Record Versus Work Plan

Use two distinct concepts:

```ts
type WorkPlan = {
  prompt: string;
  role: WorkRole;
  artifact: WorkArtifact;
  workflowId: WorkflowId;
  skillId: SkillId;
  objective: string;
  audience?: string;
  sourceMode: SourceMode;
  assumptions: string[];
  missingContext: string[];
  sections: WorkPlanSection[];
  validationCriteria: string[];
  selectedModuleIds: ModuleId[];
};

type WorkPlanRecord = {
  workPlanId: string;
  conversationId: string;
  analysisId: string;
  status: "draft" | "approved" | "generated";
  version: number;
  plan: WorkPlan;
  approvedPlan?: WorkPlan;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
};
```

API responses should return the record wrapper. UI editors should edit only `record.plan`.

### Module Ownership

`/analyze` returns recommended modules:

```ts
recommendedModuleIds: ModuleId[];
```

`/work-plans` receives selected modules:

```ts
selectedModuleIds: ModuleId[];
```

Reason:

- Analysis recommends.
- User selects.
- Work Plan creation uses the user-selected modules.

Do not treat analyzer-selected modules as final unless the user accepts them unchanged.

### Source Mode Defaults

Defaults:

```text
slide_deck:
  none by default
  source_needed_only when prompt mentions competitors, latest, market size, pricing, data, evidence, or sources

prd_generation:
  none by default
  source_needed_only only when user asks for market, competitor, or current-source claims

debugging_bug_fix:
  none by default
```

### Conversation ID

For prototype:

```text
conversationId = local session conversation ID
```

Before auth exists, it is not a security boundary. It is only a grouping key.

For production:

```text
conversationId must belong to authenticated user or workspace
```

## 43. Persistence Strategy

Use staged persistence.

### Stage 1: Frontend Mock

Store in React state only.

Risk:

- Browser refresh loses progress.

### Stage 2: Backend Memory Store

Store in backend memory.

Risk:

- Server restart loses progress.

Use only for local demos.

### Stage 3: JSON Store Or SQLite

Use for prototype demos where refresh survival matters.

Recommended:

```text
SQLite for local/prototype persistence
```

Tables:

```text
conversations
prompt_analyses
work_plans
generated_outputs
```

### Stage 4: PostgreSQL

Use for real deployment with users.

Required:

- Authenticated user ID.
- Conversation ownership checks.
- Indexes on `user_id`, `conversation_id`, `work_plan_id`.
- Migration scripts.

## 44. Security And Cost Controls

MVP backend should include basic protection before any public demo.

### Required For Public Demo

- Strict CORS allowlist.
- Request body size limit.
- Prompt length limit.
- Per-IP rate limit.
- OpenAI timeout.
- Feature flags for LLM calls.
- No OpenAI key in frontend.

### Recommended Demo Auth

Before real auth exists, add optional demo protection:

```env
DEMO_API_TOKEN=shared_demo_secret
```

Frontend sends:

```http
X-Demo-Token: shared_demo_secret
```

This is not production auth, but it reduces public endpoint abuse during demos.

### Production Auth Later

Add:

- User authentication.
- Workspace membership.
- Conversation ownership checks.
- Per-user rate limits.
- Per-user cost budgets.

## 45. Testing Strategy

Testing must cover four layers.

### Unit Tests

- Prompt normalizer.
- Deterministic detector.
- Workflow picker.
- Registry consistency.
- Zod schemas.
- Work Plan builder.

### Integration Tests

Full lifecycle:

```text
analyze -> create work plan -> patch -> approve -> generate -> validate
```

Expected status checks:

- Generate before approval returns 409.
- Stale edit returns 409.
- Invalid module returns 400 or 422.
- Missing analysis returns 404.

### LLM Tests

Use fixtures for:

- Schema adherence.
- Low-confidence prompts.
- Prompt injection attempts.
- Source-heavy prompts.
- Unsafe or privacy-sensitive requests.
- Fallback when OpenAI fails.

### UI Tests

Manual or Playwright:

- Work Mode full flow.
- Mobile Work Plan editor.
- Edit after approval resets status.
- Required-section errors.
- Backend unavailable state.

## 46. Error Recovery And Autosave

### Autosave

Frontend should autosave Work Plan drafts after edits.

MVP:

```text
Debounce PATCH by 800-1200ms
Show "Saving", "Saved", and "Save failed"
```

If backend is unavailable:

```text
Keep local draft
Show recoverable warning
Retry when user clicks save or backend returns
```

### Cancel Generation

Generation should support cancellation.

MVP:

- Use `AbortController` for HTTP generation requests.
- If SSE is added, close the SSE connection.
- Backend should stop streaming when client disconnects where possible.

### Partial Answer

If generation fails after partial output:

- Mark answer as incomplete.
- Keep partial text if useful.
- Show retry action.
- Do not mark Work Plan as generated unless generation completes.

## 47. Analytics And Observability

Track product events without storing sensitive prompt text by default.

Events:

```text
workmode_prompt_submitted
analysis_completed
skill_changed
module_toggled
workplan_created
workplan_section_edited
workplan_approved
generation_started
generation_cancelled
generation_completed
generation_failed
validation_completed
```

Metrics:

- Detection confidence.
- Workflow selected.
- Skill selected.
- Number of Work Plan edits.
- Time to approval.
- Generation latency.
- Validation quality score.
- Failure count.
- Estimated model cost.

Privacy rule:

- Do not log full prompts or generated answers in production analytics unless explicitly enabled and disclosed.

## 48. Workflow-Specific Details

### Slide Deck

Fields:

- Slide count target.
- Aspect ratio: `16:9` default.
- Audience.
- Narrative style.
- Appendix needed.

Limits:

- Default 8-12 slides.
- Warn above 20 slides.

### PRD

Optional frameworks:

- MoSCoW prioritization.
- RICE scoring.
- Jobs-to-be-done.
- User stories.

Default:

- Use simple must-have / should-have / later unless user selects a framework.

### Debugging

Fields:

- Severity.
- Environment.
- Reproduction status.
- Affected area.
- Logs available.

Severity:

```text
P0: outage or data loss
P1: major user-facing break
P2: important but workaround exists
P3: minor issue
```

## 49. Accessibility Requirements

Target:

```text
WCAG 2.2 AA for core flows
```

Requirements:

- Visible keyboard focus.
- Screen-reader labels for mode selector, skill selector, module checklist, and editor controls.
- Focus management when panels appear.
- Announce save status and generation status.
- Color contrast AA for badges and buttons.
- Error messages linked to fields.
- Reduced-motion support.

## 50. Roadmap Depth And System Identification Coverage

Work Mode needs a clear boundary for what the system can identify and how detailed the editable Work Plan should become.

The canonical taxonomy lives in:

```text
docs/research_assets/roadmap_detection_taxonomy.md
docs/microservices/roadmap_detection_taxonomy.json
```

### Identification Coverage

MVP detection should identify seven fields:

```text
detectedRole
detectedArtifact
intentCategory
recommendedWorkflowId
recommendedSkillId
confidence
sourceMode
```

Planned detection adds five more fields:

```text
roadmapDepth
riskLevel
domain
audience
entities
```

This means:

```text
MVP identification fields: 7
Planned identification fields: 12
```

### Roadmap Detail Levels

The product supports four roadmap depth levels:

```text
L1: Light Roadmap, 3-5 sections
L2: Standard Work Plan, 6-10 sections
L3: Deep Work Plan, 10-16 sections
L4: Enterprise Roadmap, 16-25 sections
```

MVP should polish L2 and L3. L1 and L4 should exist in the contract for future routing and validation.

### Roadmap Type Coverage

The current prototype should polish three roadmap types end to end:

```text
prd_generation
slide_deck
debugging_bug_fix
```

Near-term registry expansion should cover nine more:

```text
technical_architecture
competitive_analysis
research_report
strategy_memo
data_analysis_plan
gtm_plan
ux_research_plan
test_plan
api_design
```

Later high-stakes or specialized workflows add six more:

```text
policy_review
financial_analysis
clinical_summary
interview_kit
board_deck
incident_postmortem
```

Product count:

```text
Implemented polished roadmap types: 3
Near-term roadmap types: 9
Later roadmap types: 6
Total planned roadmap types: 18
```

### Routing Principle

The detector should not force a single answer when the prompt is ambiguous. It should return ranked candidates:

```ts
type WorkflowCandidate = {
  workflowId: WorkflowId;
  skillId: SkillId;
  confidence: number;
  matchedSignals: string[];
  recommendedModuleIds: ModuleId[];
};
```

High confidence can auto-select a workflow. Medium confidence should show alternatives. Low confidence should ask the user to confirm or override role, artifact, workflow, and source mode before building the Work Plan.
