# Shared Contracts

## Purpose

These contracts align frontend mocks, backend APIs, screen JSON files, and future tests.

## ApiSuccess

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};
```

## ApiError

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

## PromptAnalysis

```ts
type PromptAnalysis = {
  analysisId: string;
  conversationId: string;
  detectedRole: WorkRole;
  detectedArtifact: WorkArtifact;
  taskCategory: string;
  recommendedWorkflowId: WorkflowId;
  recommendedSkillId: SkillId;
  confidence: number;
  reason: string;
  recommendedModuleIds: ModuleId[];
  sourceMode: SourceMode;
  skillCandidates: Array<{
    skillId: SkillId;
    score: number;
    matchedSignals: string[];
  }>;
  questionsForUser: string[];
};
```

Important:

```text
recommendedModuleIds are defaults.
selectedModuleIds are chosen by the user later.
```

## SkillDefinition

```ts
type SkillDefinition = {
  id: SkillId;
  label: string;
  description: string;
  workflowId: WorkflowId;
  supportedRoles: WorkRole[];
  supportedArtifacts: WorkArtifact[];
  defaultModuleIds: ModuleId[];
  optionalModuleIds: ModuleId[];
};
```

## SkillOption

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

## WorkPlan

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
```

## WorkPlanSection

```ts
type WorkPlanSection = {
  id: string;
  title: string;
  instructions: string;
  required: boolean;
  sourceRefs?: string[];
};
```

## WorkPlanRecord

```ts
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

Important:

```text
The editor edits WorkPlanRecord.plan.
The backend owns WorkPlanRecord.version.
Generation uses WorkPlanRecord.approvedPlan.
```

## ValidationResult

```ts
type ValidationResult = {
  matchesApprovedPlan: boolean;
  missingSections: string[];
  unsupportedClaims: string[];
  qualityScore: number;
  recommendedFixes: string[];
};
```

## Canonical MVP IDs

### Workflows

```text
slide_deck
prd_generation
debugging_bug_fix
```

### Skills

```text
investor_deck_builder
prd_builder
bug_fix_planner
```

### Source Modes

```text
none
source_needed_only
user_uploaded
web_search
```

MVP enabled:

```text
none
source_needed_only
```

Disabled for MVP:

```text
user_uploaded
web_search
```
