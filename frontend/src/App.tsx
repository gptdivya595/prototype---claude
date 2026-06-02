import {
  AlertTriangle,
  Archive,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Code2,
  GraduationCap,
  Inbox,
  LoaderCircle,
  MessageCircle,
  Mic,
  PanelLeft,
  Paperclip,
  PenLine,
  Plus,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

type Mode = "low" | "medium" | "high" | "max" | "thinking" | "work";
type WorkModeUiState =
  | "idle"
  | "submitted"
  | "analyzing"
  | "reviewing_detection"
  | "choosing_suggestions"
  | "editing_work_plan"
  | "approved"
  | "generating"
  | "complete"
  | "error";
type SourceMode = SourceModeSelection | "user_provided_only" | "no_sources";
type WorkflowId =
  | "slide_deck"
  | "prd_generation"
  | "debugging_bug_fix"
  | "backend_software"
  | "frontend_web"
  | "architecture_review"
  | "research_report"
  | "analytics_plan"
  | "complex_coding"
  | "career_path"
  | "generic_workflow";
type RoadmapDepth = "L1" | "L2" | "L3" | "L4";
type RiskLevel = "low" | "medium" | "high" | "restricted";
type ModuleId =
  | "assumptions"
  | "sources_required"
  | "competitor_analysis"
  | "market_landscape"
  | "validation_checklist"
  | "risk_analysis"
  | "implementation_plan"
  | "metrics"
  | "user_personas"
  | "investor_framing"
  | "root_cause_analysis"
  | "test_cases"
  | "api_examples"
  | "database_schema"
  | "tradeoff_analysis";
type SourceModeSelection = "none" | "source_needed_only" | "user_uploaded" | "web_search";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type PromptAnalysis = {
  id: string;
  prompt: string;
  detectedRole: string;
  detectedArtifact: string;
  recommendedWorkflowId: WorkflowId;
  confidence: number;
  reason: string;
  sourceMode: SourceMode;
  selectedModuleIds: ModuleId[];
  questionsForUser: string[];
  alternatives?: Array<{
    workflowId: WorkflowId;
    confidence: number;
    reason: string;
  }>;
};

type WorkModeDraft = {
  prompt: string;
  analysis: PromptAnalysis | null;
  roleOverride?: string;
  artifactOverride?: string;
  workflowOverride?: WorkflowId;
};

type ModuleDefinition = {
  id: ModuleId;
  label: string;
  description: string;
};

type SkillDefinition = {
  id: string;
  label: string;
  description: string;
  workflowId: WorkflowId;
  supportedRoles: string[];
  supportedArtifacts: string[];
  defaultModuleIds: ModuleId[];
  optionalModuleIds: ModuleId[];
  matchedReason: string;
};

type SuggestionState = {
  selectedSkillId: string;
  selectedModuleIds: ModuleId[];
  sourceMode: SourceModeSelection;
  manuallyChangedModuleIds: ModuleId[];
  lastUpdatedReason?: string;
};

type CreateWorkPlanInput = {
  analysisId: string;
  roleOverride?: string | null;
  artifactOverride?: string | null;
  workflowOverride?: WorkflowId | null;
  skillOverride?: string | null;
  selectedModuleIds: ModuleId[];
  sourceMode: SourceModeSelection;
};

type WorkPlanStatus = "draft" | "approved" | "generated";
type AutosaveStatus = "idle" | "saving" | "saved" | "failed";

type WorkPlanSection = {
  id: string;
  title: string;
  instructions: string;
  required: boolean;
  moduleId?: ModuleId;
  sourceRefs?: string[];
};

type WorkPlan = {
  id: string;
  status: WorkPlanStatus;
  prompt: string;
  role: string;
  artifact: string;
  workflowId: WorkflowId;
  skillId: string;
  objective: string;
  audience?: string;
  sourceMode: SourceModeSelection;
  roadmapDepth: RoadmapDepth;
  riskLevel: RiskLevel;
  assumptions: string[];
  missingContext: string[];
  sections: WorkPlanSection[];
  validationCriteria: string[];
  selectedModuleIds: ModuleId[];
  version: number;
};

type WorkPlanRecord = {
  workPlanId: string;
  conversationId: string;
  analysisId: string;
  status: WorkPlanStatus;
  version: number;
  plan: WorkPlan;
  approvedPlan?: WorkPlan | null;
  approvedAt?: string;
  generatedOutputIds?: string[];
};

type UpdateWorkPlanRequest = {
  version: number;
  plan: WorkPlan;
};

type WorkPlanEditorState = {
  record: WorkPlanRecord | null;
  isDirty: boolean;
  autosaveStatus: AutosaveStatus;
  validationErrors: string[];
  validationWarnings: string[];
};

type GenerationStatus = "idle" | "generating" | "cancelled" | "complete" | "failed";

type ValidationResult = {
  matchesApprovedPlan: boolean;
  qualityScore: number;
  missingSections: string[];
  unsupportedClaims: string[];
  sourceNeededClaims: string[];
  recommendedFixes: string[];
  passedChecks: string[];
};

type GeneratedAnswer = {
  id: string;
  workPlanId: string;
  generatedFromVersion: number;
  content: string;
  createdAt: string;
  isStale: boolean;
};

type GenerationState = {
  status: GenerationStatus;
  approvedWorkPlan: WorkPlan | null;
  answer: GeneratedAnswer | null;
  validation: ValidationResult | null;
  errorMessage?: string;
};

type WorkModeErrorCode =
  | "invalid_prompt"
  | "api_error"
  | "invalid_work_plan"
  | "work_plan_validation_failed"
  | "work_plan_not_draft"
  | "stale_work_plan_version"
  | "generate_before_approval"
  | "model_unavailable"
  | "generation_cancelled";

type WorkModeError = {
  code: WorkModeErrorCode;
  message: string;
  recoverable: boolean;
};

type WorkModeClient = {
  analyzePrompt: (prompt: string) => Promise<PromptAnalysis>;
  createWorkPlan: (input: {
    prompt: string;
    analysis: PromptAnalysis;
    createInput: CreateWorkPlanInput;
    draft: WorkModeDraft;
    skill: SkillDefinition;
  }) => Promise<WorkPlanRecord>;
  updateWorkPlan: (request: UpdateWorkPlanRequest) => Promise<WorkPlanRecord>;
  approveWorkPlan: (record: WorkPlanRecord) => Promise<WorkPlanRecord>;
  generateAnswer: (approvedPlan: WorkPlan, signal?: AbortSignal) => Promise<{
    answer: GeneratedAnswer;
    validation: ValidationResult;
  }>;
};

const modes: Array<{ id: Mode; label: string; helper: string }> = [
  { id: "low", label: "Low", helper: "Default" },
  { id: "medium", label: "Medium", helper: "More thorough" },
  { id: "high", label: "High", helper: "Deeper analysis" },
  { id: "max", label: "Max", helper: "Most effort" },
  { id: "thinking", label: "Thinking", helper: "Complex tasks" },
  { id: "work", label: "Work", helper: "Plan first" },
];

const roleOptions = [
  "Product Manager",
  "Researcher",
  "Developer",
  "Software Architect",
  "Data Analyst",
  "Founder",
  "Business Analyst",
  "Designer",
  "Marketer",
  "Executive",
  "Career Coach",
  "Unknown",
];

const artifactOptions = [
  "Code",
  "PRD",
  "BRD",
  "PPT",
  "Research Report",
  "Strategy Memo",
  "Competitive Analysis",
  "Technical Design",
  "Architecture Review",
  "Backend API",
  "Frontend App",
  "Data Analysis",
  "Career Roadmap",
  "Implementation Plan",
  "General Roadmap",
  "Unknown",
];

const workflowOptions: Array<{ id: WorkflowId; label: string; description: string }> = [
  {
    id: "slide_deck",
    label: "Slide Deck / PPT",
    description: "Structure slides, storyline, evidence, and speaker-ready framing.",
  },
  {
    id: "prd_generation",
    label: "PRD Generation",
    description: "Frame goals, users, requirements, acceptance criteria, and rollout risks.",
  },
  {
    id: "debugging_bug_fix",
    label: "Debugging / Bug Fix",
    description: "Plan reproduction, root-cause checks, implementation, and tests.",
  },
  {
    id: "backend_software",
    label: "Backend Software",
    description: "Plan APIs, services, data models, auth, queues, tests, and deployment risks.",
  },
  {
    id: "frontend_web",
    label: "Frontend Web",
    description: "Plan UI, components, state, accessibility, responsive behavior, and tests.",
  },
  {
    id: "architecture_review",
    label: "Architecture Review",
    description: "Review system design, scalability, reliability, security, and tradeoffs.",
  },
  {
    id: "research_report",
    label: "Research Report",
    description: "Plan source-aware research, synthesis, comparisons, and recommendations.",
  },
  {
    id: "analytics_plan",
    label: "Analytics Plan",
    description: "Plan datasets, metrics, SQL, dashboards, experiments, and validation.",
  },
  {
    id: "complex_coding",
    label: "Complex Coding",
    description: "Plan multi-file implementation, algorithms, integrations, tests, and rollout.",
  },
  {
    id: "career_path",
    label: "Career Path",
    description: "Plan skill gaps, learning projects, portfolio, resume, and interview prep.",
  },
  {
    id: "generic_workflow",
    label: "Generic Work",
    description: "Use a neutral roadmap when the prompt is ambiguous or cross-functional.",
  },
];

const sourceModeLabels: Record<SourceMode, string> = {
  none: "None",
  source_needed_only: "Source-needed only",
  user_uploaded: "User uploaded",
  web_search: "Web search",
  user_provided_only: "User-provided only",
  no_sources: "No sources",
};

const sourceModeSelectionLabels: Record<SourceModeSelection, string> = {
  none: "None",
  source_needed_only: "Source-needed only",
  user_uploaded: "User uploaded",
  web_search: "Web search",
};

const moduleCatalog: Record<ModuleId, ModuleDefinition> = {
  assumptions: {
    id: "assumptions",
    label: "Assumptions",
    description: "State what the answer will assume before drafting.",
  },
  sources_required: {
    id: "sources_required",
    label: "Sources required",
    description: "Mark claims that need external support or verification.",
  },
  competitor_analysis: {
    id: "competitor_analysis",
    label: "Competitor analysis",
    description: "Compare relevant competitors, positioning, strengths, and gaps.",
  },
  market_landscape: {
    id: "market_landscape",
    label: "Market landscape",
    description: "Summarize category context, trends, and market structure.",
  },
  validation_checklist: {
    id: "validation_checklist",
    label: "Validation checklist",
    description: "Add checks the final answer must satisfy.",
  },
  risk_analysis: {
    id: "risk_analysis",
    label: "Risk analysis",
    description: "Identify risks, unknowns, mitigations, and review needs.",
  },
  implementation_plan: {
    id: "implementation_plan",
    label: "Implementation plan",
    description: "Break execution into practical build or rollout steps.",
  },
  metrics: {
    id: "metrics",
    label: "Metrics",
    description: "Define success measures, guardrails, and tracking signals.",
  },
  user_personas: {
    id: "user_personas",
    label: "User personas",
    description: "Clarify users, needs, pain points, and priority segments.",
  },
  investor_framing: {
    id: "investor_framing",
    label: "Investor framing",
    description: "Shape the output around opportunity, traction, moat, and narrative.",
  },
  root_cause_analysis: {
    id: "root_cause_analysis",
    label: "Root cause analysis",
    description: "Find likely causes and isolate what should be tested first.",
  },
  test_cases: {
    id: "test_cases",
    label: "Test cases",
    description: "Define cases needed to verify the fix or output.",
  },
  api_examples: {
    id: "api_examples",
    label: "API examples",
    description: "Include request/response examples where useful.",
  },
  database_schema: {
    id: "database_schema",
    label: "Database schema",
    description: "Capture relevant tables, fields, constraints, and migrations.",
  },
  tradeoff_analysis: {
    id: "tradeoff_analysis",
    label: "Tradeoff analysis",
    description: "Compare options, costs, benefits, and decision criteria.",
  },
};

const skillDefinitions: SkillDefinition[] = [
  {
    id: "investor_deck_builder",
    label: "Investor Deck Builder",
    description: "Builds slide narratives, competitor positioning, and investor-ready framing.",
    workflowId: "slide_deck",
    supportedRoles: ["Founder", "Researcher", "Executive"],
    supportedArtifacts: ["PPT", "Competitive Analysis", "Strategy Memo"],
    defaultModuleIds: ["assumptions", "validation_checklist"],
    optionalModuleIds: [
      "competitor_analysis",
      "market_landscape",
      "investor_framing",
      "sources_required",
      "metrics",
      "risk_analysis",
    ],
    matchedReason: "Best for slide narratives, competitor positioning, and investor-ready framing.",
  },
  {
    id: "prd_builder",
    label: "PRD Builder",
    description: "Frames product requirements, scope, user needs, success metrics, and rollout risks.",
    workflowId: "prd_generation",
    supportedRoles: ["Product Manager", "Founder", "Business Analyst"],
    supportedArtifacts: ["PRD", "BRD", "Technical Design"],
    defaultModuleIds: ["assumptions", "user_personas", "metrics", "risk_analysis", "validation_checklist"],
    optionalModuleIds: ["competitor_analysis", "implementation_plan", "tradeoff_analysis", "sources_required"],
    matchedReason: "Best for product requirements, scope, user needs, success metrics, and rollout risks.",
  },
  {
    id: "bug_fix_planner",
    label: "Bug Fix Planner",
    description: "Plans reproduction, root-cause isolation, implementation, and behavior validation.",
    workflowId: "debugging_bug_fix",
    supportedRoles: ["Developer"],
    supportedArtifacts: ["Code", "Technical Design"],
    defaultModuleIds: ["root_cause_analysis", "test_cases", "validation_checklist", "risk_analysis"],
    optionalModuleIds: ["api_examples", "database_schema", "implementation_plan", "tradeoff_analysis"],
    matchedReason: "Best for reproducing issues, isolating causes, implementing fixes, and validating behavior.",
  },
  {
    id: "backend_api_builder",
    label: "Backend API Builder",
    description: "Plans APIs, services, data models, auth, tests, and deployment risks.",
    workflowId: "backend_software",
    supportedRoles: ["Developer", "Software Architect"],
    supportedArtifacts: ["Backend API", "Code", "Technical Design", "Implementation Plan"],
    defaultModuleIds: ["assumptions", "implementation_plan", "api_examples", "database_schema", "test_cases", "validation_checklist"],
    optionalModuleIds: ["risk_analysis", "metrics", "tradeoff_analysis", "sources_required"],
    matchedReason: "Best for backend APIs, services, persistence, auth, queues, and integration tests.",
  },
  {
    id: "frontend_app_builder",
    label: "Frontend App Builder",
    description: "Plans web UI, components, state, accessibility, responsive behavior, and tests.",
    workflowId: "frontend_web",
    supportedRoles: ["Developer", "Designer", "Product Manager"],
    supportedArtifacts: ["Frontend App", "Code", "Technical Design", "Implementation Plan"],
    defaultModuleIds: ["assumptions", "implementation_plan", "validation_checklist", "test_cases", "risk_analysis"],
    optionalModuleIds: ["user_personas", "metrics", "api_examples", "tradeoff_analysis", "sources_required"],
    matchedReason: "Best for frontend build plans, UI states, API data flow, accessibility, and responsive QA.",
  },
  {
    id: "architecture_reviewer",
    label: "Architecture Reviewer",
    description: "Reviews system design, scalability, reliability, security, and tradeoffs.",
    workflowId: "architecture_review",
    supportedRoles: ["Software Architect", "Developer", "Executive"],
    supportedArtifacts: ["Architecture Review", "Technical Design", "Strategy Memo"],
    defaultModuleIds: ["assumptions", "risk_analysis", "validation_checklist", "implementation_plan"],
    optionalModuleIds: ["api_examples", "database_schema", "metrics", "tradeoff_analysis", "sources_required"],
    matchedReason: "Best for assessing architecture quality, risks, alternatives, and recommendations.",
  },
  {
    id: "research_synthesizer",
    label: "Research Synthesizer",
    description: "Plans source-aware research, synthesis, comparisons, and recommendations.",
    workflowId: "research_report",
    supportedRoles: ["Researcher", "Founder", "Executive", "Business Analyst"],
    supportedArtifacts: ["Research Report", "Competitive Analysis", "Strategy Memo"],
    defaultModuleIds: ["assumptions", "sources_required", "validation_checklist"],
    optionalModuleIds: ["competitor_analysis", "market_landscape", "risk_analysis", "metrics"],
    matchedReason: "Best for source-aware research, evidence mapping, synthesis, and confidence calibration.",
  },
  {
    id: "analytics_planner",
    label: "Analytics Planner",
    description: "Plans datasets, metrics, SQL, dashboards, experiments, and validation.",
    workflowId: "analytics_plan",
    supportedRoles: ["Data Analyst", "Business Analyst", "Product Manager", "Executive"],
    supportedArtifacts: ["Data Analysis", "Strategy Memo", "Research Report"],
    defaultModuleIds: ["assumptions", "metrics", "validation_checklist", "sources_required"],
    optionalModuleIds: ["risk_analysis", "implementation_plan", "market_landscape", "tradeoff_analysis"],
    matchedReason: "Best for analytics questions, metric definitions, data requirements, and insight validation.",
  },
  {
    id: "complex_code_planner",
    label: "Complex Code Planner",
    description: "Plans multi-file implementation, algorithms, integrations, tests, and rollout.",
    workflowId: "complex_coding",
    supportedRoles: ["Developer", "Software Architect"],
    supportedArtifacts: ["Code", "Implementation Plan", "Technical Design"],
    defaultModuleIds: ["assumptions", "implementation_plan", "test_cases", "validation_checklist", "risk_analysis"],
    optionalModuleIds: ["api_examples", "database_schema", "metrics", "tradeoff_analysis", "sources_required"],
    matchedReason: "Best for non-trivial coding tasks where sequencing, edge cases, and tests matter.",
  },
  {
    id: "career_path_coach",
    label: "Career Path Coach",
    description: "Plans career goals, skill gaps, learning projects, portfolio, and interview prep.",
    workflowId: "career_path",
    supportedRoles: ["Career Coach", "Developer", "Designer", "Data Analyst", "Product Manager"],
    supportedArtifacts: ["Career Roadmap", "Strategy Memo"],
    defaultModuleIds: ["assumptions", "implementation_plan", "metrics", "validation_checklist"],
    optionalModuleIds: ["risk_analysis", "sources_required"],
    matchedReason: "Best for career roadmaps, learning paths, portfolio strategy, and interview prep.",
  },
  {
    id: "general_workflow_planner",
    label: "General Work Planner",
    description: "Creates a neutral editable roadmap for ambiguous or cross-functional prompts.",
    workflowId: "generic_workflow",
    supportedRoles: roleOptions,
    supportedArtifacts: ["General Roadmap", "Strategy Memo", "Research Report", "Technical Design", "Implementation Plan", "Unknown"],
    defaultModuleIds: ["assumptions", "validation_checklist", "implementation_plan"],
    optionalModuleIds: ["risk_analysis", "sources_required", "metrics", "tradeoff_analysis"],
    matchedReason: "Best when the prompt is unclear or spans multiple work types.",
  },
];

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function trackWorkModeEvent(eventName: string, payload: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && window.location.hostname === "127.0.0.1") {
    console.info("[work-mode]", eventName, payload);
  }
}

function cloneWorkPlan(plan: WorkPlan): WorkPlan {
  return JSON.parse(JSON.stringify(plan)) as WorkPlan;
}

function workflowLabel(workflowId: WorkflowId) {
  return workflowOptions.find((workflow) => workflow.id === workflowId)?.label ?? workflowId;
}

function includesAny(prompt: string, terms: string[]) {
  return terms.some((term) => prompt.includes(term));
}

function uniqueModules(moduleIds: ModuleId[]) {
  return Array.from(new Set(moduleIds)).filter((moduleId) => moduleCatalog[moduleId]);
}

function moduleDefaultsFor(workflowId: WorkflowId): ModuleId[] {
  if (workflowId === "slide_deck") return ["assumptions", "validation_checklist"];
  if (workflowId === "debugging_bug_fix") return ["root_cause_analysis", "test_cases", "validation_checklist", "risk_analysis"];
  if (workflowId === "backend_software") {
    return ["assumptions", "implementation_plan", "api_examples", "database_schema", "test_cases", "validation_checklist"];
  }
  if (workflowId === "frontend_web") return ["assumptions", "implementation_plan", "validation_checklist", "test_cases", "risk_analysis"];
  if (workflowId === "architecture_review") return ["assumptions", "risk_analysis", "validation_checklist", "implementation_plan"];
  if (workflowId === "research_report") return ["assumptions", "sources_required", "validation_checklist"];
  if (workflowId === "analytics_plan") return ["assumptions", "metrics", "validation_checklist", "sources_required"];
  if (workflowId === "complex_coding") return ["assumptions", "implementation_plan", "test_cases", "validation_checklist", "risk_analysis"];
  if (workflowId === "career_path") return ["assumptions", "implementation_plan", "metrics", "validation_checklist"];
  if (workflowId === "generic_workflow") return ["assumptions", "validation_checklist", "implementation_plan"];
  return ["assumptions", "user_personas", "metrics", "risk_analysis", "validation_checklist"];
}

function getSelectedWorkflow(draft: WorkModeDraft): WorkflowId | null {
  return draft.workflowOverride ?? draft.analysis?.recommendedWorkflowId ?? null;
}

function getRecommendedSkill(draft: WorkModeDraft): SkillDefinition {
  const selectedWorkflow = getSelectedWorkflow(draft);
  const selectedRole = draft.roleOverride ?? draft.analysis?.detectedRole;
  const selectedArtifact = draft.artifactOverride ?? draft.analysis?.detectedArtifact;

  return (
    skillDefinitions.find(
      (skill) =>
        skill.workflowId === selectedWorkflow &&
        (!selectedRole || skill.supportedRoles.includes(selectedRole) || selectedRole === "Unknown") &&
        (!selectedArtifact || skill.supportedArtifacts.includes(selectedArtifact) || selectedArtifact === "Unknown"),
    ) ??
    skillDefinitions.find((skill) => skill.workflowId === selectedWorkflow) ??
    skillDefinitions[1]
  );
}

function getSkillById(skillId: string) {
  return skillDefinitions.find((skill) => skill.id === skillId) ?? skillDefinitions[1];
}

function isSourceHeavyPrompt(prompt: string) {
  const normalized = prompt.toLowerCase();
  return includesAny(normalized, [
    "latest",
    "recent",
    "market",
    "competitor",
    "competitors",
    "pricing",
    "investor",
    "investors",
    "fundraising",
    "pitch",
    "moat",
  ]);
}

function getSuggestedModules(analysis: PromptAnalysis, workflowId: WorkflowId): ModuleId[] {
  const normalized = analysis.prompt.toLowerCase();
  const suggested = [...moduleDefaultsFor(workflowId)];

  if (workflowId === "slide_deck") {
    if (includesAny(normalized, ["competitor", "competitors", "alternative", "versus"])) {
      suggested.push("competitor_analysis");
    }
    if (includesAny(normalized, ["investor", "investors", "fundraising", "pitch", "moat"])) {
      suggested.push("investor_framing");
    }
    if (includesAny(normalized, ["latest", "recent", "market", "competitor", "pricing"])) {
      suggested.push("sources_required");
    }
    if (includesAny(normalized, ["market", "category", "landscape"])) {
      suggested.push("market_landscape");
    }
  }

  if (workflowId === "prd_generation") {
    if (includesAny(normalized, ["competitor", "competitors"])) {
      suggested.push("competitor_analysis");
    }
    if (includesAny(normalized, ["technical", "architecture", "feasibility", "build"])) {
      suggested.push("implementation_plan");
    }
    if (isSourceHeavyPrompt(analysis.prompt)) {
      suggested.push("sources_required");
    }
  }

  if (workflowId === "debugging_bug_fix") {
    if (includesAny(normalized, ["api", "endpoint", "request", "response"])) {
      suggested.push("api_examples");
    }
    if (includesAny(normalized, ["database", "db", "session", "table", "schema"])) {
      suggested.push("database_schema");
    }
  }

  if (workflowId === "backend_software") {
    if (includesAny(normalized, ["api", "endpoint", "request", "response", "integration"])) suggested.push("api_examples");
    if (includesAny(normalized, ["database", "db", "sql", "schema", "migration"])) suggested.push("database_schema");
    if (includesAny(normalized, ["security", "auth", "scale", "deploy", "production"])) suggested.push("risk_analysis");
    if (includesAny(normalized, ["tradeoff", "alternative", "option"])) suggested.push("tradeoff_analysis");
  }

  if (workflowId === "frontend_web") {
    if (includesAny(normalized, ["user", "persona", "journey", "customer"])) suggested.push("user_personas");
    if (includesAny(normalized, ["api", "backend", "endpoint"])) suggested.push("api_examples");
    if (includesAny(normalized, ["metric", "analytics", "conversion"])) suggested.push("metrics");
  }

  if (workflowId === "architecture_review") {
    if (includesAny(normalized, ["api", "endpoint", "integration"])) suggested.push("api_examples");
    if (includesAny(normalized, ["database", "schema", "storage"])) suggested.push("database_schema");
    if (includesAny(normalized, ["metric", "sla", "latency", "uptime"])) suggested.push("metrics");
    suggested.push("tradeoff_analysis");
  }

  if (workflowId === "research_report") {
    if (includesAny(normalized, ["competitor", "comparison", "alternative"])) suggested.push("competitor_analysis");
    if (includesAny(normalized, ["market", "landscape", "trend"])) suggested.push("market_landscape");
    if (includesAny(normalized, ["risk", "bias", "limitation"])) suggested.push("risk_analysis");
  }

  if (workflowId === "analytics_plan") {
    if (includesAny(normalized, ["risk", "bias", "causal", "limitation"])) suggested.push("risk_analysis");
    if (includesAny(normalized, ["dashboard", "sql", "build", "pipeline"])) suggested.push("implementation_plan");
  }

  if (workflowId === "complex_coding") {
    if (includesAny(normalized, ["api", "endpoint", "sdk", "integration"])) suggested.push("api_examples");
    if (includesAny(normalized, ["database", "schema", "migration"])) suggested.push("database_schema");
    if (includesAny(normalized, ["tradeoff", "alternative", "option"])) suggested.push("tradeoff_analysis");
  }

  if (workflowId === "career_path") {
    if (includesAny(normalized, ["risk", "constraint", "time", "confidence"])) suggested.push("risk_analysis");
    if (includesAny(normalized, ["latest", "market", "salary", "job"])) suggested.push("sources_required");
  }

  if (workflowId === "generic_workflow" && isSourceHeavyPrompt(analysis.prompt)) {
    suggested.push("sources_required");
  }

  return uniqueModules(suggested);
}

function getDefaultSourceMode(analysis: PromptAnalysis, workflowId: WorkflowId): SourceModeSelection {
  if (
    workflowId === "debugging_bug_fix" ||
    workflowId === "backend_software" ||
    workflowId === "frontend_web" ||
    workflowId === "complex_coding" ||
    workflowId === "career_path"
  ) {
    return "none";
  }
  if (workflowId === "research_report" || workflowId === "analytics_plan") return "source_needed_only";
  if (workflowId === "slide_deck" && isSourceHeavyPrompt(analysis.prompt)) return "source_needed_only";
  if (workflowId === "prd_generation" && isSourceHeavyPrompt(analysis.prompt)) return "source_needed_only";
  if (workflowId === "generic_workflow" && isSourceHeavyPrompt(analysis.prompt)) return "source_needed_only";
  return "none";
}

function buildSuggestionState(draft: WorkModeDraft): SuggestionState | null {
  if (!draft.analysis) return null;
  const workflowId = getSelectedWorkflow(draft);
  if (!workflowId) return null;
  const skill = getRecommendedSkill(draft);

  return {
    selectedSkillId: skill.id,
    selectedModuleIds: getSuggestedModules(draft.analysis, workflowId),
    sourceMode: getDefaultSourceMode(draft.analysis, workflowId),
    manuallyChangedModuleIds: [],
  };
}

function createWorkPlanPayload(draft: WorkModeDraft, suggestions: SuggestionState): CreateWorkPlanInput | null {
  if (!draft.analysis) return null;

  return {
    analysisId: draft.analysis.id,
    roleOverride: draft.roleOverride && draft.roleOverride !== draft.analysis.detectedRole ? draft.roleOverride : null,
    artifactOverride:
      draft.artifactOverride && draft.artifactOverride !== draft.analysis.detectedArtifact ? draft.artifactOverride : null,
    workflowOverride:
      draft.workflowOverride && draft.workflowOverride !== draft.analysis.recommendedWorkflowId ? draft.workflowOverride : null,
    skillOverride: suggestions.selectedSkillId,
    selectedModuleIds: suggestions.selectedModuleIds,
    sourceMode: suggestions.sourceMode,
  };
}

function createSection(title: string, instructions: string, required = true): WorkPlanSection {
  return {
    id: `section-${generateId()}`,
    title,
    instructions,
    required,
  };
}

function buildSectionsForPlan(workflowId: WorkflowId, selectedModuleIds: ModuleId[]): WorkPlanSection[] {
  if (workflowId === "slide_deck") {
    const sections = [
      createSection("Deck goal", "Define the purpose of the deck and the decision it should support."),
      createSection("Audience", "Clarify who will read the deck and what they need to believe or decide."),
      createSection("Narrative arc", "Outline the story from context to insight, recommendation, and next action."),
      createSection("Slide-by-slide outline", "List the slides in order with the point each slide must make."),
      createSection("Key visuals", "Identify charts, tables, diagrams, or visuals needed for the deck."),
      createSection("Data or source needs", "Mark facts, claims, and market points that need source support."),
      createSection("Final call to action", "Define the closing recommendation or ask."),
    ];

    if (selectedModuleIds.includes("competitor_analysis")) {
      sections.push(
        createSection("Competitor set", "Define which competitors or alternatives should be compared."),
        createSection("Comparison criteria", "Choose criteria such as positioning, pricing, features, traction, or differentiation."),
        createSection("Competitive landscape slide", "Plan the slide that summarizes market position and key gaps."),
      );
    }

    if (selectedModuleIds.includes("investor_framing")) {
      sections.push(
        createSection("Investor narrative", "Frame the opportunity, urgency, traction, and why-now story."),
        createSection("Market opportunity", "Describe market size, category momentum, and expansion path."),
        createSection("Moat or differentiation", "Explain what makes the product defensible or meaningfully different."),
      );
    }

    return sections;
  }

  if (workflowId === "debugging_bug_fix") {
    const sections = [
      createSection("Symptom summary", "Describe the broken behavior, expected behavior, and user impact."),
      createSection("Reproduction steps", "List the exact steps and data needed to reproduce the issue."),
      createSection("Suspected causes", "List likely causes and why each is plausible."),
      createSection("Files or services to inspect", "Identify the code paths, services, logs, or integrations to inspect."),
      createSection("Debugging plan", "Define the sequence of checks that will isolate the cause."),
      createSection("Fix plan", "Describe the implementation approach and expected code changes."),
      createSection("Regression tests", "Define tests that prove the issue is fixed and does not return."),
      createSection("Verification checklist", "List manual and automated checks before considering the fix complete."),
    ];

    if (selectedModuleIds.includes("api_examples")) {
      sections.push(createSection("API examples to verify", "Capture request and response examples needed to validate API behavior."));
    }

    if (selectedModuleIds.includes("database_schema")) {
      sections.push(createSection("Data/session state to inspect", "Inspect session, persistence, table, or schema state that may affect the bug."));
    }

    return sections;
  }

  if (workflowId === "backend_software") {
    return [
      createSection("Backend objective", "Define the backend capability, users, constraints, and expected behavior."),
      createSection("API contracts", "Plan endpoints, request/response payloads, auth, errors, and integration examples."),
      createSection("Data model", "Capture entities, storage, migrations, constraints, and retention rules."),
      createSection("Service flow", "Map request flow, dependencies, jobs, queues, caching, and failure paths."),
      createSection("Tests", "Define unit, integration, contract, security, and regression tests."),
    ];
  }

  if (workflowId === "frontend_web") {
    return [
      createSection("Frontend goal", "Define the user-facing workflow and primary UI outcome."),
      createSection("UI states", "Plan components, loading states, empty states, errors, and responsive behavior."),
      createSection("State and data flow", "Define API calls, client state, mutations, and caching."),
      createSection("Accessibility", "Plan keyboard behavior, focus states, labels, and contrast checks."),
      createSection("Frontend tests", "Define component, interaction, responsive, and end-to-end tests."),
    ];
  }

  if (workflowId === "architecture_review") {
    return [
      createSection("Review scope", "Define system boundaries, components, scale assumptions, and decisions under review."),
      createSection("Current architecture", "Summarize components, data flows, storage, dependencies, and integration points."),
      createSection("Quality attributes", "Evaluate scalability, reliability, security, maintainability, observability, and cost."),
      createSection("Tradeoffs", "Compare options, alternatives, risks, and decision criteria."),
      createSection("Recommendations", "Prioritize recommendations by impact, effort, risk, and sequencing."),
    ];
  }

  if (workflowId === "research_report") {
    return [
      createSection("Research question", "Define the research question, scope, audience, and decision context."),
      createSection("Source strategy", "Plan source types, credibility rules, citation expectations, and evidence gaps."),
      createSection("Findings structure", "Plan themes, comparisons, evidence buckets, and synthesis logic."),
      createSection("Recommendations", "Define how findings should translate into conclusions or next actions."),
      createSection("Validation checklist", "Check source quality, coverage, bias, and unsupported claims."),
    ];
  }

  if (workflowId === "analytics_plan") {
    return [
      createSection("Analytics question", "Define the decision, metric question, audience, and analysis scope."),
      createSection("Data requirements", "List datasets, fields, joins, filters, date ranges, and data quality assumptions."),
      createSection("Metric definitions", "Define formulas, denominators, guardrails, and segments."),
      createSection("Analysis method", "Plan SQL, cohorts, funnels, experiments, charts, or statistical checks."),
      createSection("Insight validation", "Check bias, missing data, causality limits, and confidence."),
    ];
  }

  if (workflowId === "complex_coding") {
    return [
      createSection("Coding goal", "Define expected behavior, constraints, inputs, outputs, and affected surfaces."),
      createSection("Technical approach", "Break implementation into components, files, functions, and dependencies."),
      createSection("Edge cases", "List failure modes, concurrency concerns, compatibility risks, and limits."),
      createSection("Testing strategy", "Define unit, integration, regression, and manual verification."),
      createSection("Delivery sequence", "Sequence implementation, validation, rollout, and cleanup."),
    ];
  }

  if (workflowId === "career_path") {
    return [
      createSection("Career goal", "Define target role, timeline, current level, constraints, and motivation."),
      createSection("Skill gap", "Identify required skills, current gaps, proof points, and priority order."),
      createSection("Learning plan", "Plan projects, practice loops, portfolio work, and interview preparation."),
      createSection("Progress metrics", "Define indicators for learning, applications, interviews, and portfolio quality."),
      createSection("Risks and constraints", "Capture time, confidence, market, financial, and consistency risks."),
    ];
  }

  if (workflowId === "generic_workflow") {
    return [
      createSection("Intent and output", "Clarify what the user is trying to accomplish and what artifact should be produced."),
      createSection("Assumptions and context", "List assumptions, known context, missing context, and boundaries."),
      createSection("Work steps", "Break the work into ordered steps, decisions, dependencies, and handoffs."),
      createSection("Quality bar", "Define what would make the answer correct, complete, useful, and trustworthy."),
      createSection("Risks and unknowns", "Call out uncertainty and where human judgment is needed.", false),
    ];
  }

  return [
    createSection("Problem statement", "Define the problem, who has it, and why it matters now."),
    createSection("Target users", "Identify primary and secondary users for the product or feature."),
    createSection("User personas", "Describe user segments, needs, pain points, and context."),
    createSection("Goals and non-goals", "Clarify what the PRD will and will not cover."),
    createSection("User stories", "Write user stories or jobs-to-be-done that drive requirements."),
    createSection("Functional requirements", "List required product behavior and acceptance criteria."),
    createSection("Non-functional requirements", "Capture performance, privacy, reliability, accessibility, or security needs."),
    createSection("MVP scope", "Define the smallest useful launch scope and what is deferred."),
    createSection("Success metrics", "Define product, adoption, quality, and guardrail metrics."),
    createSection("Risks", "List risks, dependencies, open tradeoffs, and mitigations."),
    createSection("Open questions", "Capture unresolved decisions and what information is needed."),
  ];
}

function buildMockWorkPlan(input: {
  prompt: string;
  analysis: PromptAnalysis;
  createInput: CreateWorkPlanInput;
  draft: WorkModeDraft;
  skill: SkillDefinition;
}): WorkPlan {
  const workflowId = input.createInput.workflowOverride ?? input.analysis.recommendedWorkflowId;
  const role = input.createInput.roleOverride ?? input.draft.roleOverride ?? input.analysis.detectedRole;
  const artifact = input.createInput.artifactOverride ?? input.draft.artifactOverride ?? input.analysis.detectedArtifact;
  const selectedModuleIds = input.createInput.selectedModuleIds;

  const assumptions = [
    `The output should be framed for a ${role}.`,
    `The final artifact should be a ${artifact}.`,
    "The assistant should follow the approved Work Plan before drafting.",
  ];

  if (selectedModuleIds.includes("sources_required")) {
    assumptions.push("Claims that need evidence should be marked source-needed until verified.");
  }

  const missingContext =
    workflowId === "debugging_bug_fix"
      ? ["Current logs or error traces.", "Relevant files or services involved.", "Expected behavior after the fix."]
      : workflowId === "slide_deck"
        ? ["Exact audience and meeting context.", "Source links or trusted research material.", "Preferred deck length or format."]
        : ["Target user segment priority.", "Existing product constraints.", "Acceptance criteria or launch timeline."];

  const validationCriteria = [
    "Final output follows the approved Work Plan sections.",
    "Assumptions and unresolved context are explicit.",
    "Risks and validation checks are visible.",
  ];

  if (selectedModuleIds.includes("sources_required")) {
    validationCriteria.push("Source-needed claims are marked clearly.");
  }
  if (workflowId === "debugging_bug_fix") {
    validationCriteria.push("Debugging plan includes reproduction and regression tests.");
  }
  if (workflowId === "prd_generation") {
    validationCriteria.push("PRD includes goals, non-goals, metrics, and open questions.");
  }

  return {
    id: `work-plan-${generateId()}`,
    status: "draft",
    prompt: input.prompt,
    role,
    artifact,
    workflowId,
    skillId: input.skill.id,
    objective: `Create a ${artifact} using the ${input.skill.label} workflow for: ${input.prompt}`,
    sourceMode: input.createInput.sourceMode,
    roadmapDepth: workflowId === "slide_deck" ? "L3" : "L2",
    riskLevel: "medium",
    assumptions,
    missingContext,
    sections: buildSectionsForPlan(workflowId, selectedModuleIds),
    validationCriteria,
    selectedModuleIds,
    version: 1,
  };
}

function buildWorkPlanRecord(input: {
  analysis: PromptAnalysis;
  plan: WorkPlan;
}): WorkPlanRecord {
  return {
    workPlanId: input.plan.id,
    conversationId: `conversation-${generateId()}`,
    analysisId: input.analysis.id,
    status: input.plan.status,
    version: input.plan.version,
    plan: input.plan,
  };
}

function validateWorkPlan(plan: WorkPlan): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!plan.objective.trim()) errors.push("Objective is required.");
  if (plan.sections.length === 0) errors.push("At least one roadmap section is required.");

  plan.sections.forEach((section) => {
    if (section.required && !section.title.trim()) errors.push("Required sections must have titles.");
    if (section.required && !section.instructions.trim()) errors.push("Required sections must have instructions.");
  });

  if (plan.sourceMode === "web_search" || plan.sourceMode === "user_uploaded") {
    errors.push("Selected source mode is not enabled in the MVP.");
  }

  const sectionText = plan.sections.map((section) => `${section.title} ${section.instructions}`.toLowerCase()).join(" ");
  if (plan.workflowId === "prd_generation" && (!sectionText.includes("problem") || !sectionText.includes("success metrics"))) {
    errors.push("PRD Builder requires Problem and Success metrics sections.");
  }
  if (plan.workflowId === "debugging_bug_fix" && (!sectionText.includes("reproduction") || !sectionText.includes("regression tests"))) {
    errors.push("Bug Fix Planner requires Reproduction and Regression tests sections.");
  }
  if (plan.workflowId === "slide_deck" && (!sectionText.includes("narrative") || !sectionText.includes("final call"))) {
    errors.push("Investor Deck Builder requires Narrative and Final call sections.");
  }

  if (plan.missingContext.some((item) => item.trim())) warnings.push("Missing context still has unresolved items.");
  if (plan.sourceMode === "source_needed_only") warnings.push("Source-needed claims will need verification later.");
  if (plan.sections.filter((section) => !section.required).length === 0) warnings.push("No optional custom sections are included.");
  if (plan.sections.length > 14) warnings.push("Large roadmap: review length before generation.");

  return {
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
  };
}

function createUpdateWorkPlanRequest(record: WorkPlanRecord): UpdateWorkPlanRequest {
  return {
    version: record.version,
    plan: record.plan,
  };
}

function generateMockAnswer(approvedPlan: WorkPlan): string {
  const sectionLines = approvedPlan.sections
    .map((section, index) => {
      const prefix =
        approvedPlan.workflowId === "slide_deck"
          ? `Slide ${index + 1}`
          : approvedPlan.workflowId === "debugging_bug_fix"
            ? `Step ${index + 1}`
            : `${index + 1}.`;
      return `## ${prefix}: ${section.title}\n${section.instructions}\n\nOutput draft: ${section.instructions}`;
    })
    .join("\n\n");

  const assumptions = approvedPlan.assumptions.map((assumption) => `- ${assumption}`).join("\n");
  const validation = approvedPlan.validationCriteria.map((criterion) => `- ${criterion}`).join("\n");
  const sourceNotes =
    approvedPlan.sourceMode === "source_needed_only"
      ? "\n\n## Source-needed notes\n- Source-needed: verify market, competitor, pricing, and factual claims before final use.\n- Source-needed: replace unsupported claims with user-provided evidence or citations."
      : "";

  const workflowIntro =
    approvedPlan.workflowId === "debugging_bug_fix"
      ? "This answer is formatted as a diagnosis, fix, and test plan."
      : approvedPlan.workflowId === "prd_generation"
        ? "This answer is formatted as a product document."
        : "This answer is formatted as a slide-by-slide outline.";

  return `# ${approvedPlan.artifact} Draft\n\n## Objective\n${approvedPlan.objective}\n\n${workflowIntro}\n\n## Assumptions\n${assumptions}\n\n${sectionLines}\n\n## Validation\n${validation}${sourceNotes}`;
}

function validateMockAnswer(plan: WorkPlan, answer: string): ValidationResult {
  const normalizedAnswer = answer.toLowerCase();
  const missingSections = plan.sections
    .filter((section) => section.required && !normalizedAnswer.includes(section.title.toLowerCase()))
    .map((section) => section.title);
  const sourceNeededClaims =
    plan.sourceMode === "source_needed_only" && normalizedAnswer.includes("source-needed")
      ? ["Source-needed claims are marked for later evidence."]
      : [];
  const passedChecks: string[] = [];
  const recommendedFixes: string[] = [];

  if (answer.trim()) {
    passedChecks.push("Answer is not empty.");
  } else {
    recommendedFixes.push("Regenerate because the answer is empty.");
  }

  if (missingSections.length === 0) {
    passedChecks.push("Required section titles appear in the answer.");
  } else {
    recommendedFixes.push("Add missing required sections before final use.");
  }

  if (plan.validationCriteria.some((criterion) => normalizedAnswer.includes(criterion.toLowerCase().slice(0, 24)))) {
    passedChecks.push("Validation criteria are referenced.");
  } else {
    recommendedFixes.push("Reference validation criteria more explicitly.");
  }

  if (plan.sourceMode === "source_needed_only") {
    if (sourceNeededClaims.length > 0) {
      passedChecks.push("Source-needed notes are present.");
    } else {
      recommendedFixes.push("Add source-needed notes for unverified claims.");
    }
  }

  const deductions = missingSections.length * 12 + recommendedFixes.length * 6;

  return {
    matchesApprovedPlan: missingSections.length === 0,
    qualityScore: Math.max(0, Math.min(100, 96 - deductions)),
    missingSections,
    unsupportedClaims: [],
    sourceNeededClaims,
    recommendedFixes,
    passedChecks,
  };
}

function mockAnalyzePrompt(prompt: string): PromptAnalysis {
  const normalized = prompt.toLowerCase();
  const cleanPrompt = prompt.trim();
  const matches: Array<{
    workflowId: WorkflowId;
    confidence: number;
    role: string;
    artifact: string;
    reason: string;
  }> = [];

  if (includesAny(normalized, ["ppt", "slides", "deck", "presentation"])) {
    matches.push({
      workflowId: "slide_deck",
      confidence: 0.88,
      role: includesAny(normalized, ["investor", "fundraise", "pitch"]) ? "Founder" : "Researcher",
      artifact: "PPT",
      reason: "The prompt asks for presentation-style output, so a slide-deck workflow should frame storyline, sections, and evidence.",
    });
  }

  if (includesAny(normalized, ["prd", "product requirements", "feature spec", "requirements doc"])) {
    matches.push({
      workflowId: "prd_generation",
      confidence: 0.84,
      role: "Product Manager",
      artifact: "PRD",
      reason: "The prompt asks for product requirements, so the workflow should capture users, scope, acceptance criteria, and success metrics.",
    });
  }

  if (includesAny(normalized, ["bug", "error", "fix", "not working", "crash", "debug", "redirect"])) {
    matches.push({
      workflowId: "debugging_bug_fix",
      confidence: 0.82,
      role: "Developer",
      artifact: "Code",
      reason: "The prompt describes a broken behavior, so the workflow should start with reproduction and root-cause validation before proposing a fix.",
    });
  }

  if (cleanPrompt.length < 12 || matches.length === 0) {
    return {
      id: generateId(),
      prompt: cleanPrompt,
      detectedRole: "Unknown",
      detectedArtifact: "Unknown",
      recommendedWorkflowId: "prd_generation",
      confidence: cleanPrompt.length < 12 ? 0.42 : 0.58,
      reason: "The prompt does not include enough explicit signals to confidently identify the intended role, artifact, or workflow.",
      sourceMode: "source_needed_only",
      selectedModuleIds: moduleDefaultsFor("prd_generation"),
      questionsForUser: [
        "Who is the intended audience for the output?",
        "Should this become a PRD, slide deck, or debugging plan?",
      ],
      alternatives: [
        {
          workflowId: "slide_deck",
          confidence: 0.39,
          reason: "Use this if the final output should be a presentation structure.",
        },
        {
          workflowId: "debugging_bug_fix",
          confidence: 0.34,
          reason: "Use this if the prompt is about diagnosing or fixing a technical issue.",
        },
      ],
    };
  }

  const recommended = [...matches].sort((a, b) => b.confidence - a.confidence)[0];
  const alternatives = matches
    .filter((match) => match.workflowId !== recommended.workflowId)
    .map((match) => ({
      workflowId: match.workflowId,
      confidence: Math.max(0.62, match.confidence - 0.08),
      reason: match.reason,
    }));

  return {
    id: generateId(),
    prompt: cleanPrompt,
    detectedRole: recommended.role,
    detectedArtifact: recommended.artifact,
    recommendedWorkflowId: recommended.workflowId,
    confidence: matches.length > 1 ? Math.max(0.68, recommended.confidence - 0.1) : recommended.confidence,
    reason:
      matches.length > 1
        ? `${recommended.reason} The prompt also contains signals for another workflow, so review the alternatives before continuing.`
        : recommended.reason,
    sourceMode: recommended.workflowId === "debugging_bug_fix" ? "user_provided_only" : "source_needed_only",
    selectedModuleIds: moduleDefaultsFor(recommended.workflowId),
    questionsForUser:
      matches.length > 1 ? ["The prompt matches multiple workflows. Confirm the output type before continuing."] : [],
    alternatives,
  };
}

type ApiEnvelope<T> =
  | {
      ok: true;
      data: T;
      requestId: string;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
      requestId: string;
    };

type BackendCandidate = {
  value: string;
  score: number;
  matchedSignals: string[];
};

type BackendPromptAnalysis = {
  analysisId: string;
  prompt?: string;
  detectedRole: string;
  detectedArtifact: string;
  recommendedWorkflowId: WorkflowId;
  confidence: number;
  reason: string;
  sourceMode: SourceModeSelection;
  selectedModuleIds: ModuleId[];
  questionsForUser: string[];
  alternatives?: BackendCandidate[];
};

type BackendWorkPlanSection = {
  id: string;
  title: string;
  instructions: string;
  required: boolean;
  moduleId?: ModuleId;
  sourceRefs: string[];
};

type BackendWorkPlan = {
  prompt: string;
  role: string;
  artifact: string;
  workflowId: WorkflowId;
  skillId: string;
  objective: string;
  audience?: string;
  sourceMode: SourceModeSelection;
  roadmapDepth: RoadmapDepth;
  riskLevel: RiskLevel;
  assumptions: string[];
  missingContext: string[];
  sections: BackendWorkPlanSection[];
  validationCriteria: string[];
  selectedModuleIds: ModuleId[];
};

type BackendWorkPlanRecord = {
  workPlanId: string;
  conversationId: string;
  analysisId: string;
  status: WorkPlanStatus;
  version: number;
  plan: BackendWorkPlan;
  approvedPlan: BackendWorkPlan | null;
  approvedAt?: string;
  generatedOutputIds: string[];
};

type BackendValidationResult = {
  matchesApprovedPlan: boolean;
  missingSections: string[];
  unsupportedClaims: string[];
  qualityScore: number;
  recommendedFixes: string[];
  sourceNeededClaims: string[];
  passedChecks: string[];
};

type BackendGeneratedOutput = {
  answerId: string;
  workPlanId: string;
  generatedFromVersion: number;
  answer: string;
  validation: BackendValidationResult;
  createdAt: string;
};

type ImportMetaWithOptionalEnv = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const WORK_MODE_API_BASE = (
  (import.meta as ImportMetaWithOptionalEnv).env?.VITE_WORK_MODE_API_BASE ?? "http://127.0.0.1:8787/api/work-mode"
).replace(/\/$/, "");
const DEMO_API_TOKEN = (import.meta as ImportMetaWithOptionalEnv).env?.VITE_DEMO_API_TOKEN?.trim();

class WorkModeApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "WorkModeApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (DEMO_API_TOKEN) {
    headers.set("x-demo-token", DEMO_API_TOKEN);
  }
  const response = await fetch(`${WORK_MODE_API_BASE}${path}`, {
    ...init,
    headers,
  });
  const body = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !body.ok) {
    const error = body.ok
      ? { code: "api_error", message: `Request failed with status ${response.status}.` }
      : body.error;
    throw new WorkModeApiError(response.status, error.code, error.message);
  }

  return body.data;
}

function isWorkflowId(value: string): value is WorkflowId {
  return workflowOptions.some((workflow) => workflow.id === value);
}

function mapPromptAnalysis(analysis: BackendPromptAnalysis, submittedPrompt: string): PromptAnalysis {
  return {
    id: analysis.analysisId,
    prompt: analysis.prompt?.trim() || submittedPrompt,
    detectedRole: analysis.detectedRole,
    detectedArtifact: analysis.detectedArtifact,
    recommendedWorkflowId: analysis.recommendedWorkflowId,
    confidence: analysis.confidence,
    reason: analysis.reason,
    sourceMode: analysis.sourceMode,
    selectedModuleIds: analysis.selectedModuleIds,
    questionsForUser: analysis.questionsForUser,
    alternatives: analysis.alternatives
      ?.filter((candidate) => isWorkflowId(candidate.value))
      .map((candidate) => ({
        workflowId: candidate.value as WorkflowId,
        confidence: candidate.score,
        reason: candidate.matchedSignals.length > 0 ? `Matched: ${candidate.matchedSignals.join(", ")}` : "Alternative workflow.",
      })),
  };
}

function mapBackendWorkPlan(plan: BackendWorkPlan, record: BackendWorkPlanRecord, status = record.status): WorkPlan {
  return {
    id: record.workPlanId,
    status,
    prompt: plan.prompt,
    role: plan.role,
    artifact: plan.artifact,
    workflowId: plan.workflowId,
    skillId: plan.skillId,
    objective: plan.objective,
    audience: plan.audience,
    sourceMode: plan.sourceMode,
    roadmapDepth: plan.roadmapDepth,
    riskLevel: plan.riskLevel,
    assumptions: plan.assumptions,
    missingContext: plan.missingContext,
    sections: plan.sections.map((section) => ({
      id: section.id,
      title: section.title,
      instructions: section.instructions,
      required: section.required,
      moduleId: section.moduleId,
      sourceRefs: section.sourceRefs,
    })),
    validationCriteria: plan.validationCriteria,
    selectedModuleIds: plan.selectedModuleIds,
    version: record.version,
  };
}

function mapBackendRecord(record: BackendWorkPlanRecord): WorkPlanRecord {
  return {
    workPlanId: record.workPlanId,
    conversationId: record.conversationId,
    analysisId: record.analysisId,
    status: record.status,
    version: record.version,
    plan: mapBackendWorkPlan(record.plan, record),
    approvedPlan: record.approvedPlan ? mapBackendWorkPlan(record.approvedPlan, record, "approved") : null,
    approvedAt: record.approvedAt,
    generatedOutputIds: record.generatedOutputIds,
  };
}

function stripWorkPlanForApi(plan: WorkPlan): BackendWorkPlan {
  return {
    prompt: plan.prompt,
    role: plan.role,
    artifact: plan.artifact,
    workflowId: plan.workflowId,
    skillId: plan.skillId,
    objective: plan.objective,
    audience: plan.audience,
    sourceMode: plan.sourceMode,
    roadmapDepth: plan.roadmapDepth,
    riskLevel: plan.riskLevel,
    assumptions: plan.assumptions.filter((item) => item.trim()),
    missingContext: plan.missingContext.filter((item) => item.trim()),
    sections: plan.sections.map((section) => ({
      id: section.id,
      title: section.title,
      instructions: section.instructions,
      required: section.required,
      moduleId: section.moduleId,
      sourceRefs: section.sourceRefs ?? [],
    })),
    validationCriteria: plan.validationCriteria.filter((item) => item.trim()),
    selectedModuleIds: plan.selectedModuleIds,
  };
}

function mapValidation(validation: BackendValidationResult): ValidationResult {
  return {
    matchesApprovedPlan: validation.matchesApprovedPlan,
    missingSections: validation.missingSections,
    unsupportedClaims: validation.unsupportedClaims,
    qualityScore: validation.qualityScore,
    recommendedFixes: validation.recommendedFixes,
    sourceNeededClaims: validation.sourceNeededClaims,
    passedChecks: validation.passedChecks,
  };
}

function mapGeneratedOutput(output: BackendGeneratedOutput) {
  return {
    answer: {
      id: output.answerId,
      workPlanId: output.workPlanId,
      generatedFromVersion: output.generatedFromVersion,
      content: output.answer,
      createdAt: output.createdAt,
      isStale: false,
    },
    validation: mapValidation(output.validation),
  };
}

function errorToWorkModeError(error: unknown, fallbackMessage: string): WorkModeError {
  if (error instanceof WorkModeApiError) {
    const knownCodes: WorkModeErrorCode[] = [
      "invalid_prompt",
      "api_error",
      "invalid_work_plan",
      "work_plan_validation_failed",
      "work_plan_not_draft",
      "stale_work_plan_version",
      "generate_before_approval",
      "model_unavailable",
      "generation_cancelled",
    ];
    return {
      code: knownCodes.includes(error.code as WorkModeErrorCode) ? (error.code as WorkModeErrorCode) : "api_error",
      message: error.message,
      recoverable: error.status !== 404,
    };
  }

  return {
    code: "api_error",
    message: fallbackMessage,
    recoverable: true,
  };
}

const workModeClient: WorkModeClient = {
  async analyzePrompt(prompt) {
    const analysis = await apiRequest<BackendPromptAnalysis>("/analyze", {
      method: "POST",
      body: JSON.stringify({
        conversationId: "local-ui",
        mode: "work",
        prompt,
      }),
    });
    return mapPromptAnalysis(analysis, prompt);
  },
  async createWorkPlan(input) {
    void input.prompt;
    void input.analysis;
    void input.draft;
    void input.skill;
    const record = await apiRequest<BackendWorkPlanRecord>("/work-plans", {
      method: "POST",
      body: JSON.stringify(input.createInput),
    });
    return mapBackendRecord(record);
  },
  async updateWorkPlan(request) {
    const record = await apiRequest<BackendWorkPlanRecord>(`/work-plans/${request.plan.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        version: request.version,
        plan: stripWorkPlanForApi(request.plan),
      }),
    });
    return mapBackendRecord(record);
  },
  async approveWorkPlan(record) {
    const approvedRecord = await apiRequest<BackendWorkPlanRecord>(`/work-plans/${record.workPlanId}/approve`, {
      method: "POST",
      body: JSON.stringify({ version: record.version }),
    });
    return mapBackendRecord(approvedRecord);
  },
  async generateAnswer(approvedPlan, signal) {
    const output = await apiRequest<BackendGeneratedOutput>(`/work-plans/${approvedPlan.id}/generate`, {
      method: "POST",
      signal,
      body: JSON.stringify({ version: approvedPlan.version }),
    });
    return mapGeneratedOutput(output);
  },
};

function App() {
  const [mode, setMode] = useState<Mode>("work");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [workModeUiState, setWorkModeUiState] = useState<WorkModeUiState>("idle");
  const [workModeDraft, setWorkModeDraft] = useState<WorkModeDraft>({
    prompt: "",
    analysis: null,
  });
  const [suggestionState, setSuggestionState] = useState<SuggestionState | null>(null);
  const [workPlanEditorState, setWorkPlanEditorState] = useState<WorkPlanEditorState>({
    record: null,
    isDirty: false,
    autosaveStatus: "idle",
    validationErrors: [],
    validationWarnings: [],
  });
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
    approvedWorkPlan: null,
    answer: null,
    validation: null,
  });
  const [workModeError, setWorkModeError] = useState<WorkModeError | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);

  const selectedMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);
  const isHome = messages.length === 0 && workModeUiState === "idle";

  useEffect(() => {
    return () => {
      generationAbortRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    trackWorkModeEvent("prompt_submitted", { mode, promptLength: cleanPrompt.length });

    setMessages((current) => [
      ...current,
      {
        id: generateId(),
        role: "user",
        content: cleanPrompt,
      },
    ]);
    setPrompt("");

    if (mode === "work") {
      setWorkModeDraft({ prompt: cleanPrompt, analysis: null });
      setSuggestionState(null);
      setWorkPlanEditorState({
        record: null,
        isDirty: false,
        autosaveStatus: "idle",
        validationErrors: [],
        validationWarnings: [],
      });
      setGenerationState({
        status: "idle",
        approvedWorkPlan: null,
        answer: null,
        validation: null,
      });
      setWorkModeError(null);
      setWorkModeUiState("analyzing");

      try {
        const analysis = await workModeClient.analyzePrompt(cleanPrompt);
        trackWorkModeEvent("analysis_completed", {
          analysisId: analysis.id,
          workflowId: analysis.recommendedWorkflowId,
          confidence: analysis.confidence,
        });
        setWorkModeDraft({
          prompt: cleanPrompt,
          analysis,
          roleOverride: analysis.detectedRole,
          artifactOverride: analysis.detectedArtifact,
          workflowOverride: analysis.recommendedWorkflowId,
        });
        setWorkModeUiState("reviewing_detection");
      } catch (error) {
        setWorkModeError(errorToWorkModeError(error, "Analysis failed. Try submitting the prompt again."));
        setWorkModeUiState("error");
      }
      return;
    }

    setWorkModeUiState("submitted");
  };

  const resetApprovalAfterEdit = () => {
    setGenerationState((current) => ({
      ...current,
      status: current.answer ? "complete" : "idle",
      approvedWorkPlan: null,
      answer: current.answer ? { ...current.answer, isStale: true } : null,
    }));
    setWorkModeError(null);
    setWorkModeUiState("editing_work_plan");
  };

  const handleDraftChange = (updates: Partial<WorkModeDraft>) => {
    setWorkModeDraft((current) => ({ ...current, ...updates }));
  };

  const handleContinueToSuggestions = () => {
    const nextSuggestionState = buildSuggestionState(workModeDraft);
    if (!nextSuggestionState) return;
    setSuggestionState(nextSuggestionState);
    setWorkModeUiState("choosing_suggestions");
  };

  const handleCreateWorkPlan = async () => {
    if (!suggestionState || !workModeDraft.analysis) return;
    const payload = createWorkPlanPayload(workModeDraft, suggestionState);
    if (!payload) return;
    const skill = getSkillById(payload.skillOverride ?? suggestionState.selectedSkillId);

    try {
      const record = await workModeClient.createWorkPlan({
        prompt: workModeDraft.prompt,
        analysis: workModeDraft.analysis,
        createInput: payload,
        draft: workModeDraft,
        skill,
      });
      const validation = validateWorkPlan(record.plan);

      setWorkPlanEditorState({
        record,
        isDirty: false,
        autosaveStatus: "saved",
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
      });
      setWorkModeError(null);
      setWorkModeUiState("editing_work_plan");
    } catch (error) {
      setWorkModeError(errorToWorkModeError(error, "Could not create the Work Plan."));
      setWorkModeUiState("error");
    }
  };

  const handleWorkPlanEditorStateChange = (editorState: WorkPlanEditorState) => {
    setWorkPlanEditorState(editorState);
  };

  const handleSaveWorkPlan = async (request: UpdateWorkPlanRequest) => {
    try {
      const record = await workModeClient.updateWorkPlan(request);
      setWorkModeError(null);
      return record;
    } catch (error) {
      setWorkModeError(errorToWorkModeError(error, "Could not save the Work Plan."));
      throw error;
    }
  };

  const handleApproveWorkPlan = async () => {
    const record = workPlanEditorState.record;
    if (!record) return;
    const validation = validateWorkPlan(record.plan);

    if (validation.errors.length > 0 || workPlanEditorState.autosaveStatus === "saving") {
      setWorkPlanEditorState((current) => ({
        ...current,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
      }));
      setWorkModeError({
        code: "work_plan_validation_failed",
        message: "Fix approval-blocking Work Plan issues before approving.",
        recoverable: true,
      });
      return;
    }

    try {
      const approvedRecord = await workModeClient.approveWorkPlan(record);
      const approvedWorkPlan = cloneWorkPlan(approvedRecord.approvedPlan ?? approvedRecord.plan);
      setWorkPlanEditorState({
        record: approvedRecord,
        isDirty: false,
        autosaveStatus: "saved",
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
      });
      setGenerationState((current) => ({
        ...current,
        status: "idle",
        approvedWorkPlan,
        errorMessage: undefined,
      }));
      setWorkModeError(null);
      setWorkModeUiState("approved");
      trackWorkModeEvent("work_plan_approved", {
        workPlanId: approvedWorkPlan.id,
        version: approvedWorkPlan.version,
      });
    } catch (error) {
      setWorkModeError(errorToWorkModeError(error, "Could not approve the Work Plan."));
      setWorkModeUiState("error");
    }
  };

  const handleGenerateAnswer = async () => {
    const approvedWorkPlan = generationState.approvedWorkPlan;
    if (!approvedWorkPlan) {
      setWorkModeError({
        code: "generate_before_approval",
        message: "Approve the Work Plan before generating an answer.",
        recoverable: true,
      });
      return;
    }

    setWorkModeError(null);
    setGenerationState((current) => ({
      ...current,
      status: "generating",
      errorMessage: undefined,
    }));
    setWorkModeUiState("generating");
    trackWorkModeEvent("generation_started", {
      workPlanId: approvedWorkPlan.id,
      version: approvedWorkPlan.version,
    });

    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;

    try {
      const { answer, validation } = await workModeClient.generateAnswer(approvedWorkPlan, controller.signal);
      setGenerationState({
        status: "complete",
        approvedWorkPlan,
        answer,
        validation,
      });
      setWorkPlanEditorState((current) => {
        if (!current.record || current.record.workPlanId !== answer.workPlanId) return current;
        return {
          ...current,
          record: {
            ...current.record,
            status: "generated",
            plan: {
              ...current.record.plan,
              status: "generated",
            },
            generatedOutputIds: [...(current.record.generatedOutputIds ?? []), answer.id],
          },
        };
      });
      setWorkModeUiState("complete");
      trackWorkModeEvent("generation_completed", {
        answerId: answer.id,
        qualityScore: validation.qualityScore,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setGenerationState((current) => ({
          ...current,
          status: "cancelled",
          errorMessage: "Generation cancelled.",
        }));
        setWorkModeError({
          code: "generation_cancelled",
          message: "Generation was cancelled. You can retry from the approved Work Plan.",
          recoverable: true,
        });
        setWorkModeUiState("approved");
      } else {
        setGenerationState((current) => ({
          ...current,
          status: "failed",
          errorMessage: "The model is unavailable. Try again.",
        }));
        setWorkModeError(errorToWorkModeError(error, "The model is unavailable. Try again."));
        setWorkModeUiState("error");
        trackWorkModeEvent("generation_failed");
      }
    } finally {
      if (generationAbortRef.current === controller) {
        generationAbortRef.current = null;
      }
    }
  };

  const handleCancelGeneration = () => {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setGenerationState((current) => ({
      ...current,
      status: "cancelled",
      errorMessage: "Generation cancelled.",
    }));
    setWorkModeError({
      code: "generation_cancelled",
      message: "Generation was cancelled. You can retry from the approved Work Plan.",
      recoverable: true,
    });
    setWorkModeUiState("approved");
    trackWorkModeEvent("generation_cancelled");
  };

  const handleRetryGeneration = () => {
    handleGenerateAnswer();
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#1f1f1d]">
      <IconRail />

      <main className="min-h-screen pl-11">
        <TopChrome />

        <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-8 pt-24 sm:px-6">
          {isHome ? (
            <HomeSurface
              mode={mode}
              onModeChange={setMode}
              onPromptChange={setPrompt}
              onSubmit={handleSubmit}
              prompt={prompt}
              selectedModeLabel={selectedMode.label}
            />
          ) : (
            <WorkSurface
              draft={workModeDraft}
              messages={messages}
              mode={mode}
              onContinue={handleContinueToSuggestions}
              onCreateWorkPlan={handleCreateWorkPlan}
              onApproveWorkPlan={handleApproveWorkPlan}
              onCancelGeneration={handleCancelGeneration}
              onDraftChange={handleDraftChange}
              onGenerateAnswer={handleGenerateAnswer}
              onModeChange={setMode}
              onPromptChange={setPrompt}
              onRetryGeneration={handleRetryGeneration}
              onSaveWorkPlan={handleSaveWorkPlan}
              onSubmit={handleSubmit}
              onSuggestionChange={setSuggestionState}
              prompt={prompt}
              generationState={generationState}
              resetApprovalAfterEdit={resetApprovalAfterEdit}
              selectedModeLabel={selectedMode.label}
              suggestionState={suggestionState}
              workPlanEditorState={workPlanEditorState}
              workModeError={workModeError}
              onWorkPlanEditorStateChange={handleWorkPlanEditorStateChange}
              workModeUiState={workModeUiState}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function IconRail() {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex w-11 flex-col items-center border-r border-[#dedbd2] bg-[#faf9f5]"
      aria-label="Primary navigation"
    >
      <button type="button" className="mt-2 grid h-8 w-8 place-items-center rounded-md text-[#3d3d39] hover:bg-[#efeee9]" aria-label="Toggle sidebar">
        <PanelLeft size={17} aria-hidden="true" />
      </button>

      <nav className="mt-11 flex flex-1 flex-col items-center gap-4" aria-label="Claude-style shortcuts">
        <RailButton icon={<Plus size={18} />} label="New chat" active />
        <RailButton icon={<MessageCircle size={18} />} label="Chats" />
        <RailButton icon={<Archive size={18} />} label="Archive" />
        <RailButton icon={<Boxes size={18} />} label="Projects" />
        <RailButton icon={<Code2 size={18} />} label="Code" muted />
        <RailButton icon={<BriefcaseBusiness size={18} />} label="Work mode" />
      </nav>

      <div className="mb-3 flex flex-col items-center gap-4">
        <button type="button" className="relative grid h-8 w-8 place-items-center rounded-md text-[#1f1f1d] hover:bg-[#efeee9]" aria-label="Inbox">
          <Inbox size={18} aria-hidden="true" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#1b8bdc]" />
        </button>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-[#333331] text-sm font-semibold text-white" aria-label="Divya profile">
          D
        </button>
      </div>
    </aside>
  );
}

function RailButton({
  active,
  icon,
  label,
  muted,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        "grid h-8 w-8 place-items-center rounded-md hover:bg-[#efeee9]",
        active ? "bg-[#e9e8e2] text-[#1f1f1d]" : muted ? "text-[#b7b3aa]" : "text-[#2f2f2b]",
      ].join(" ")}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

function TopChrome() {
  return (
    <header className="pointer-events-none fixed left-11 right-0 top-0 z-20 flex h-12 items-center justify-center bg-[#faf9f5]/90 backdrop-blur">
      <div className="pointer-events-auto rounded-lg bg-[#f1f0eb] px-3 py-2 text-sm text-[#756f66]">
        Free plan <span className="mx-1 text-[#aaa59b]">·</span>
        <button type="button" className="inline-flex min-h-8 items-center underline underline-offset-2 hover:text-[#2f2f2b]">
          Upgrade
        </button>
      </div>
      <button
        type="button"
        className="pointer-events-auto absolute right-4 grid h-8 w-8 place-items-center rounded-md text-[#2f2f2b] hover:bg-[#efeee9]"
        aria-label="Assistant menu"
      >
        <CircleUserRound size={18} aria-hidden="true" />
      </button>
    </header>
  );
}

function HomeSurface({
  mode,
  onModeChange,
  onPromptChange,
  onSubmit,
  prompt,
  selectedModeLabel,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onPromptChange: (prompt: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  prompt: string;
  selectedModeLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-20">
      <div className="mb-10 flex items-center gap-4">
        <ClaudeMark />
        <h1 className="font-serif text-4xl font-normal tracking-normal text-[#282521] sm:text-5xl">
          Good afternoon, Divya
        </h1>
      </div>

      <div className="w-full max-w-[736px]">
        <PromptComposer
          mode={mode}
          modeLabel={selectedModeLabel}
          onModeChange={onModeChange}
          onPromptChange={onPromptChange}
          onSubmit={onSubmit}
          prompt={prompt}
        />
        <QuickActions onPromptChange={onPromptChange} />
      </div>
    </div>
  );
}

function WorkSurface({
  draft,
  generationState,
  messages,
  mode,
  onApproveWorkPlan,
  onCancelGeneration,
  onContinue,
  onCreateWorkPlan,
  onDraftChange,
  onGenerateAnswer,
  onModeChange,
  onPromptChange,
  onRetryGeneration,
  onSaveWorkPlan,
  onSubmit,
  onSuggestionChange,
  onWorkPlanEditorStateChange,
  prompt,
  resetApprovalAfterEdit,
  selectedModeLabel,
  suggestionState,
  workPlanEditorState,
  workModeError,
  workModeUiState,
}: {
  draft: WorkModeDraft;
  generationState: GenerationState;
  messages: Message[];
  mode: Mode;
  onApproveWorkPlan: () => void;
  onCancelGeneration: () => void;
  onContinue: () => void;
  onCreateWorkPlan: () => void;
  onDraftChange: (updates: Partial<WorkModeDraft>) => void;
  onGenerateAnswer: () => void;
  onModeChange: (mode: Mode) => void;
  onPromptChange: (prompt: string) => void;
  onRetryGeneration: () => void;
  onSaveWorkPlan: (request: UpdateWorkPlanRequest) => Promise<WorkPlanRecord>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSuggestionChange: (suggestionState: SuggestionState | null) => void;
  onWorkPlanEditorStateChange: (editorState: WorkPlanEditorState) => void;
  prompt: string;
  resetApprovalAfterEdit: () => void;
  selectedModeLabel: string;
  suggestionState: SuggestionState | null;
  workPlanEditorState: WorkPlanEditorState;
  workModeError: WorkModeError | null;
  workModeUiState: WorkModeUiState;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <WorkModePanel
          draft={draft}
          generationState={generationState}
          mode={mode}
          onApproveWorkPlan={onApproveWorkPlan}
          onCancelGeneration={onCancelGeneration}
          onContinue={onContinue}
          onCreateWorkPlan={onCreateWorkPlan}
          onDraftChange={onDraftChange}
          onGenerateAnswer={onGenerateAnswer}
          onRetryGeneration={onRetryGeneration}
          onSaveWorkPlan={onSaveWorkPlan}
          onSuggestionChange={onSuggestionChange}
          suggestionState={suggestionState}
          workPlanEditorState={workPlanEditorState}
          onWorkPlanEditorStateChange={onWorkPlanEditorStateChange}
          resetApprovalAfterEdit={resetApprovalAfterEdit}
          state={workModeUiState}
          workModeError={workModeError}
        />
      </div>

      <div className="mt-auto pt-4">
        <PromptComposer
          compact
          mode={mode}
          modeLabel={selectedModeLabel}
          onModeChange={onModeChange}
          onPromptChange={onPromptChange}
          onSubmit={onSubmit}
          prompt={prompt}
        />
      </div>
    </div>
  );
}

function ClaudeMark() {
  const rays = Array.from({ length: 12 }, (_, index) => index * 30);

  return (
    <span className="relative h-9 w-9 shrink-0" aria-hidden="true">
      {rays.map((rotation) => (
        <span
          key={rotation}
          className="absolute left-1/2 top-1/2 h-1 w-8 origin-center -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e45d3d]"
          style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg) scaleX(.74)` }}
        />
      ))}
    </span>
  );
}

function PromptComposer({
  compact,
  mode,
  modeLabel,
  onModeChange,
  onPromptChange,
  onSubmit,
  prompt,
}: {
  compact?: boolean;
  mode: Mode;
  modeLabel: string;
  onModeChange: (mode: Mode) => void;
  onPromptChange: (prompt: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  prompt: string;
}) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const canSubmit = prompt.trim().length > 0;

  return (
    <form className="relative" onSubmit={onSubmit}>
      <label htmlFor={compact ? "prompt-compact" : "prompt"} className="sr-only">
        Message prompt
      </label>
      <div className="rounded-[22px] border border-[#ddd9d0] bg-white shadow-[0_12px_34px_rgba(44,39,32,0.08)]">
        <textarea
          id={compact ? "prompt-compact" : "prompt"}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && canSubmit) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={compact ? 2 : 3}
          className={[
            "w-full resize-none rounded-t-[22px] bg-transparent px-6 text-[16px] leading-7 text-[#272521] placeholder:text-[#6d6a63] focus:outline-none",
            compact ? "min-h-20 pt-4" : "min-h-24 pt-5",
          ].join(" ")}
          placeholder="How can I help you today?"
        />

        <div className="flex flex-col gap-3 px-5 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4">
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#0f172a] hover:bg-[#f3f2ed] sm:h-8 sm:w-8"
              aria-label="Attach context"
            >
              <Plus size={20} aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2 text-xs text-[#6d6a63]">
              <span>
                Session: <span className="font-semibold text-[#0b73d9]">0%</span>
              </span>
              <span className="h-1.5 w-32 rounded-full bg-[#eeeae2]">
                <span className="block h-full w-[2%] rounded-full bg-[#e45d3d]" />
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-4 sm:w-auto sm:items-end">
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-4">
              <div className="relative max-w-full">
                <button
                  type="button"
                  className="inline-flex max-w-full items-center rounded-lg bg-[#f5f3ee] px-3 py-2 text-sm font-medium text-[#2c2924] hover:bg-[#eeece5]"
                  aria-expanded={modelMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setModelMenuOpen((current) => !current)}
                >
                  Sonnet 4.6 <span className="text-[#777168]">{modeLabel}</span>
                  <ChevronDown className="ml-1 inline" size={14} aria-hidden="true" />
                </button>
                {modelMenuOpen ? (
                  <ModelMenu mode={mode} onModeChange={onModeChange} onClose={() => setModelMenuOpen(false)} />
                ) : null}
              </div>
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#1f1f1d] hover:bg-[#f3f2ed] sm:h-8 sm:w-8"
                aria-label="Voice input"
              >
                <Mic size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#1f1f1d] hover:bg-[#f3f2ed] sm:h-8 sm:w-8"
                aria-label="Audio controls"
              >
                <Volume2 size={18} aria-hidden="true" />
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#2f2f2b] text-white hover:bg-[#1f1f1d] disabled:cursor-not-allowed disabled:bg-transparent disabled:text-transparent sm:h-8 sm:w-8"
                aria-label="Send prompt"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-wrap justify-start gap-x-4 gap-y-1 text-xs text-[#6d6a63] sm:justify-end">
              <span>Reset in: Not set</span>
              <span>Messages left: N/A</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function ModelMenu({
  mode,
  onClose,
  onModeChange,
}: {
  mode: Mode;
  onClose: () => void;
  onModeChange: (mode: Mode) => void;
}) {
  const selectMode = (nextMode: Mode) => {
    onModeChange(nextMode);
    onClose();
  };

  return (
    <div
      className="fixed bottom-24 left-14 right-4 z-50 max-h-[min(560px,calc(100vh-8rem))] overflow-y-auto rounded-xl border border-[#d9d5ca] bg-white p-2 text-sm shadow-[0_18px_52px_rgba(36,31,24,0.18)] sm:absolute sm:bottom-11 sm:left-auto sm:right-0 sm:max-h-none sm:w-[350px] sm:max-w-[calc(100vw-72px)] sm:overflow-visible"
      role="menu"
      aria-label="Model and effort menu"
    >
      <div className="space-y-1 border-b border-[#e8e5dc] pb-2">
        <MenuRow title="Opus 4.8" subtitle="Most capable for ambitious work" action="Upgrade" />
        <MenuRow title="Sonnet 4.6" subtitle="Most efficient for everyday tasks" selected />
        <MenuRow title="Haiku 4.5" subtitle="Fastest for quick answers" />
      </div>

      <div className="py-2">
        <div className="rounded-lg bg-[#f2f1ed] px-3 py-2">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium">Effort</span>
            <span className="text-[#817b72]">{mode === "work" ? "Work" : modeLabel(mode)}</span>
          </div>
          <div className="space-y-1">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-white"
                role="menuitemradio"
                aria-checked={mode === item.id}
                onClick={() => selectMode(item.id)}
              >
                <span>
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-2 text-xs text-[#817b72]">{item.helper}</span>
                </span>
                {mode === item.id ? <CheckCircle2 size={16} className="text-[#0b73d9]" aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-[#f2f1ed]"
        role="menuitem"
      >
        More models
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function modeLabel(mode: Mode) {
  return modes.find((item) => item.id === mode)?.label ?? mode;
}

function MenuRow({
  action,
  selected,
  subtitle,
  title,
}: {
  action?: string;
  selected?: boolean;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2">
      <div className="min-w-0">
        <p className="font-medium text-[#2c2924]">{title}</p>
        <p className="truncate text-[#817b72]">{subtitle}</p>
      </div>
      {action ? (
        <button type="button" className="inline-flex min-h-8 items-center rounded-full border border-[#d7d3c8] px-2 py-1 text-xs text-[#0b65b9]">
          {action}
        </button>
      ) : null}
      {selected ? <CheckCircle2 size={16} className="text-[#0b73d9]" aria-hidden="true" /> : null}
    </div>
  );
}

function QuickActions({ onPromptChange }: { onPromptChange: (prompt: string) => void }) {
  const actions = [
    { label: "Write", icon: <PenLine size={17} />, prompt: "Write a structured brief for " },
    { label: "Learn", icon: <GraduationCap size={17} />, prompt: "Teach me the essentials of " },
    { label: "Code", icon: <Code2 size={17} />, prompt: "Help me debug this code: " },
    { label: "From Calendar", icon: <span className="text-xs">📅</span>, prompt: "Turn my meeting notes into a plan: " },
    { label: "From Gmail", icon: <span className="text-xs">M</span>, prompt: "Draft a reply to this email: " },
  ];

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-[#ddd9d0] bg-white px-3 py-2 text-sm font-medium shadow-[0_2px_8px_rgba(44,39,32,0.05)] hover:bg-[#f7f5f0]"
          onClick={() => onPromptChange(action.prompt)}
        >
          <span className="text-[#817b72]" aria-hidden="true">
            {action.icon}
          </span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

function WorkModePanel({
  draft,
  generationState,
  mode,
  onApproveWorkPlan,
  onCancelGeneration,
  onContinue,
  onCreateWorkPlan,
  onDraftChange,
  onGenerateAnswer,
  onRetryGeneration,
  onSaveWorkPlan,
  onSuggestionChange,
  onWorkPlanEditorStateChange,
  resetApprovalAfterEdit,
  suggestionState,
  workPlanEditorState,
  state,
  workModeError,
}: {
  draft: WorkModeDraft;
  generationState: GenerationState;
  mode: Mode;
  onApproveWorkPlan: () => void;
  onCancelGeneration: () => void;
  onContinue: () => void;
  onCreateWorkPlan: () => void;
  onDraftChange: (updates: Partial<WorkModeDraft>) => void;
  onGenerateAnswer: () => void;
  onRetryGeneration: () => void;
  onSaveWorkPlan: (request: UpdateWorkPlanRequest) => Promise<WorkPlanRecord>;
  onSuggestionChange: (suggestionState: SuggestionState | null) => void;
  onWorkPlanEditorStateChange: (editorState: WorkPlanEditorState) => void;
  resetApprovalAfterEdit: () => void;
  suggestionState: SuggestionState | null;
  workPlanEditorState: WorkPlanEditorState;
  state: WorkModeUiState;
  workModeError: WorkModeError | null;
}) {
  if (mode !== "work" && state === "submitted") {
    return (
      <Panel>
        <p className="text-sm font-semibold">Mode selected</p>
        <p className="mt-1 text-sm text-[#6d6a63]">Standard answer generation is mocked until backend integration.</p>
      </Panel>
    );
  }

  if (state === "analyzing") return <AnalyzingPanel prompt={draft.prompt} />;
  if (state === "reviewing_detection" && draft.analysis) {
    return <DetectionSummary draft={draft} onContinue={onContinue} onDraftChange={onDraftChange} />;
  }
  if (state === "choosing_suggestions" && draft.analysis && suggestionState) {
    return (
      <SuggestionsPanel
        draft={draft}
        onCreateWorkPlan={onCreateWorkPlan}
        onDraftChange={onDraftChange}
        onSuggestionChange={onSuggestionChange}
        suggestionState={suggestionState}
      />
    );
  }
  if (
    (state === "editing_work_plan" || state === "approved" || state === "generating" || state === "complete" || state === "error") &&
    workPlanEditorState.record
  ) {
    return (
      <div className="space-y-4">
        {workModeError ? <WorkModeErrorPanel error={workModeError} onRetry={onRetryGeneration} /> : null}
        <WorkPlanEditor
          editorState={workPlanEditorState}
          generationState={generationState}
          onApproveWorkPlan={onApproveWorkPlan}
          onCancelGeneration={onCancelGeneration}
          onEditorStateChange={onWorkPlanEditorStateChange}
          onGenerateAnswer={onGenerateAnswer}
          onRetryGeneration={onRetryGeneration}
          onSaveWorkPlan={onSaveWorkPlan}
          resetApprovalAfterEdit={resetApprovalAfterEdit}
        />
        {generationState.answer ? <AnswerPanel answer={generationState.answer} /> : null}
        {generationState.validation ? <ValidationPanel validation={generationState.validation} /> : null}
      </div>
    );
  }
  if (state === "error") return <Panel tone="danger">Analysis failed. Try submitting the prompt again.</Panel>;
  return null;
}

function Panel({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "danger" }) {
  return (
    <section
      className={[
        "rounded-xl border bg-white p-4 shadow-[0_8px_26px_rgba(44,39,32,0.06)]",
        tone === "danger" ? "border-[var(--wm-danger)] bg-[var(--wm-danger-soft)]" : "border-[#ddd9d0]",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

function AnalyzingPanel({ prompt }: { prompt: string }) {
  return (
    <Panel>
      <div className="flex items-start gap-3" aria-live="polite" aria-label="Analyzing prompt">
        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-[#f2eee6] text-[#e45d3d]">
          <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Analyzing prompt</h2>
          <p className="mt-1 text-sm text-[#6d6a63]">Detecting role, artifact, workflow, confidence, and source mode.</p>
          <p className="mt-3 line-clamp-3 rounded-lg border border-[#e5e1d8] bg-[#faf9f5] px-3 py-2 text-sm text-[#6d6a63]">
            {prompt}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function DetectionSummary({
  draft,
  onContinue,
  onDraftChange,
}: {
  draft: WorkModeDraft;
  onContinue: () => void;
  onDraftChange: (updates: Partial<WorkModeDraft>) => void;
}) {
  const analysis = draft.analysis;
  if (!analysis) return null;

  const selectedRole = draft.roleOverride ?? analysis.detectedRole;
  const selectedArtifact = draft.artifactOverride ?? analysis.detectedArtifact;
  const selectedWorkflow = draft.workflowOverride ?? analysis.recommendedWorkflowId;
  const lowConfidence = analysis.confidence < 0.65;

  return (
    <Panel>
      <div className="flex flex-col gap-3 border-b border-[#e8e5dc] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-[#817b72]">Detected</p>
          <h2 className="mt-1 text-lg font-semibold">Review Work Mode routing</h2>
          <p className="mt-1 text-sm text-[#6d6a63]">Confirm the role, artifact, and workflow before suggestions.</p>
        </div>
        <ConfidenceBadge confidence={analysis.confidence} />
      </div>

      <div className="mt-4 rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-3">
        <p className="text-xs font-medium uppercase text-[#817b72]">Original prompt</p>
        <p className="mt-2 text-sm leading-6">{analysis.prompt}</p>
      </div>

      {lowConfidence ? (
        <div className="mt-4 flex gap-3 rounded-lg border border-[var(--wm-warning)] bg-[var(--wm-warning-soft)] p-3 text-sm">
          <AlertTriangle className="mt-0.5 shrink-0 text-[var(--wm-warning)]" size={18} aria-hidden="true" />
          <div>
            <p className="font-semibold">Confidence is low.</p>
            <p className="mt-1 text-[#6d6a63]">Confirm or adjust the detection before continuing.</p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <FieldSelect
          id="roleOverride"
          label="Role"
          value={selectedRole}
          options={roleOptions.map((option) => ({ value: option, label: option }))}
          onChange={(value) => onDraftChange({ roleOverride: value })}
        />
        <FieldSelect
          id="artifactOverride"
          label="Artifact"
          value={selectedArtifact}
          options={artifactOptions.map((option) => ({ value: option, label: option }))}
          onChange={(value) => onDraftChange({ artifactOverride: value })}
        />
        <FieldSelect
          id="workflowOverride"
          label="Workflow"
          value={selectedWorkflow}
          options={workflowOptions.map((option) => ({ value: option.id, label: option.label }))}
          onChange={(value) => onDraftChange({ workflowOverride: value as WorkflowId })}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <InfoPanel title="Reason">{analysis.reason}</InfoPanel>
        <InfoPanel title="Source mode">
          <span className="font-semibold text-[#2c2924]">{sourceModeLabels[analysis.sourceMode]}</span>
          <span className="mt-1 block text-xs">Backend retrieval is not connected in this phase.</span>
        </InfoPanel>
      </div>

      {analysis.questionsForUser.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-3">
          <p className="text-xs font-medium uppercase text-[#817b72]">Questions</p>
          <ul className="mt-2 space-y-2 text-sm text-[#6d6a63]">
            {analysis.questionsForUser.map((question) => (
              <li key={question} className="flex gap-2">
                <span aria-hidden="true">-</span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.alternatives && analysis.alternatives.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase text-[#817b72]">Alternative workflows</p>
          <div className="mt-2 grid gap-2">
            {analysis.alternatives.map((alternative) => (
              <button
                key={alternative.workflowId}
                type="button"
                className={[
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  selectedWorkflow === alternative.workflowId
                    ? "border-[#e45d3d] bg-[#fff4ed]"
                    : "border-[#e5e1d8] bg-[#faf9f5] hover:bg-[#f2f0ea]",
                ].join(" ")}
                onClick={() => onDraftChange({ workflowOverride: alternative.workflowId })}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{workflowLabel(alternative.workflowId)}</span>
                  <span className="text-xs text-[#817b72]">{Math.round(alternative.confidence * 100)}%</span>
                </span>
                <span className="mt-1 block text-[#6d6a63]">{alternative.reason}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-[#e8e5dc] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6d6a63]">
          Selected: <span className="font-semibold text-[#2c2924]">{selectedRole}</span>,{" "}
          <span className="font-semibold text-[#2c2924]">{selectedArtifact}</span>,{" "}
          <span className="font-semibold text-[#2c2924]">{workflowLabel(selectedWorkflow)}</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f2f2b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f1f1d]"
          onClick={onContinue}
        >
          Continue to suggestions
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </Panel>
  );
}

function InfoPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-3 text-sm leading-6 text-[#6d6a63]">
      <p className="mb-2 text-xs font-medium uppercase text-[#817b72]">{title}</p>
      {children}
    </div>
  );
}

function SuggestionsPanel({
  draft,
  onCreateWorkPlan,
  onDraftChange,
  onSuggestionChange,
  suggestionState,
}: {
  draft: WorkModeDraft;
  onCreateWorkPlan: () => void;
  onDraftChange: (updates: Partial<WorkModeDraft>) => void;
  onSuggestionChange: (suggestionState: SuggestionState | null) => void;
  suggestionState: SuggestionState;
}) {
  const analysis = draft.analysis;
  if (!analysis) return null;

  const selectedSkill = getSkillById(suggestionState.selectedSkillId);
  const selectedWorkflow = getSelectedWorkflow(draft) ?? selectedSkill.workflowId;
  const availableModuleIds = uniqueModules([...selectedSkill.defaultModuleIds, ...selectedSkill.optionalModuleIds]);
  const sourceWarning = isSourceHeavyPrompt(analysis.prompt) && suggestionState.sourceMode === "none";
  const noModulesSelected = suggestionState.selectedModuleIds.length === 0;

  const updateSuggestionState = (updates: Partial<SuggestionState>) => {
    onSuggestionChange({ ...suggestionState, ...updates });
  };

  const handleSkillChange = (skill: SkillDefinition) => {
    const suggestedForSkill = getSuggestedModules(analysis, skill.workflowId);
    const compatibleModules = new Set([...skill.defaultModuleIds, ...skill.optionalModuleIds]);
    const preservedManualSelections = suggestionState.selectedModuleIds.filter(
      (moduleId) => suggestionState.manuallyChangedModuleIds.includes(moduleId) && compatibleModules.has(moduleId),
    );

    onDraftChange({ workflowOverride: skill.workflowId });
    onSuggestionChange({
      selectedSkillId: skill.id,
      selectedModuleIds: uniqueModules([...suggestedForSkill, ...preservedManualSelections]),
      sourceMode: getDefaultSourceMode(analysis, skill.workflowId),
      manuallyChangedModuleIds: suggestionState.manuallyChangedModuleIds.filter((moduleId) => compatibleModules.has(moduleId)),
      lastUpdatedReason: "Suggestions updated for selected skill.",
    });
  };

  const handleModuleToggle = (moduleId: ModuleId) => {
    const selectedModuleIds = suggestionState.selectedModuleIds.includes(moduleId)
      ? suggestionState.selectedModuleIds.filter((selectedModuleId) => selectedModuleId !== moduleId)
      : [...suggestionState.selectedModuleIds, moduleId];
    trackWorkModeEvent("module_toggled", {
      moduleId,
      selected: !suggestionState.selectedModuleIds.includes(moduleId),
    });

    updateSuggestionState({
      selectedModuleIds: uniqueModules(selectedModuleIds),
      manuallyChangedModuleIds: uniqueModules([...suggestionState.manuallyChangedModuleIds, moduleId]),
      lastUpdatedReason: undefined,
    });
  };

  return (
    <Panel>
      <div className="flex flex-col gap-3 border-b border-[#e8e5dc] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-[#817b72]">Suggestions</p>
          <h2 className="mt-1 text-lg font-semibold">Choose Work Plan modules</h2>
          <p className="mt-1 text-sm text-[#6d6a63]">Select what the editable Work Plan should include.</p>
        </div>
        <StatusChip label={workflowLabel(selectedWorkflow)} tone="accent" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <InfoPanel title="Workflow reason">
          <span className="block font-semibold text-[#2c2924]">{selectedSkill.label}</span>
          <span className="mt-1 block">{selectedSkill.matchedReason}</span>
        </InfoPanel>
        <InfoPanel title="Source mode">
          <span className="font-semibold text-[#2c2924]">{sourceModeSelectionLabels[suggestionState.sourceMode]}</span>
          <span className="mt-1 block text-xs">Source and retrieval behavior for Phase 5 planning.</span>
        </InfoPanel>
      </div>

      <SkillSelector selectedSkillId={suggestionState.selectedSkillId} onSkillChange={handleSkillChange} />

      {suggestionState.lastUpdatedReason ? (
        <div className="mt-4 rounded-lg border border-[#d9d5ca] bg-[#faf9f5] px-3 py-2 text-sm text-[#6d6a63]">
          {suggestionState.lastUpdatedReason}
        </div>
      ) : null}

      <SourceModeSelector
        sourceMode={suggestionState.sourceMode}
        onSourceModeChange={(sourceMode) => updateSuggestionState({ sourceMode })}
      />

      {sourceWarning ? (
        <div className="mt-3 flex gap-2 rounded-lg border border-[var(--wm-warning)] bg-[var(--wm-warning-soft)] px-3 py-2 text-sm text-[#6d6a63]">
          <AlertTriangle className="mt-0.5 shrink-0 text-[var(--wm-warning)]" size={16} aria-hidden="true" />
          <span>This prompt likely needs sources. Claims can still be marked source-needed later.</span>
        </div>
      ) : null}

      <SuggestionChecklist
        availableModuleIds={availableModuleIds}
        selectedModuleIds={suggestionState.selectedModuleIds}
        suggestedModuleIds={getSuggestedModules(analysis, selectedWorkflow)}
        onModuleToggle={handleModuleToggle}
      />

      <div className="mt-5 flex flex-col gap-3 border-t border-[#e8e5dc] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6d6a63]">
          <span className="font-semibold text-[#2c2924]">{suggestionState.selectedModuleIds.length}</span> modules selected
          {noModulesSelected ? (
            <span className="mt-1 block text-xs">No modules selected. Phase 5 will still include required validation internally.</span>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f2f2b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f1f1d]"
          disabled={!draft.analysis || !selectedWorkflow}
          onClick={onCreateWorkPlan}
        >
          Create Work Plan
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </Panel>
  );
}

function SkillSelector({
  onSkillChange,
  selectedSkillId,
}: {
  onSkillChange: (skill: SkillDefinition) => void;
  selectedSkillId: string;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase text-[#817b72]">Skill</p>
      <div className="mt-2 grid gap-2">
        {skillDefinitions.map((skill) => {
          const selected = skill.id === selectedSkillId;
          return (
            <button
              key={skill.id}
              type="button"
              className={[
                "rounded-lg border px-3 py-3 text-left transition-colors",
                selected ? "border-[#e45d3d] bg-[#fff4ed]" : "border-[#e5e1d8] bg-[#faf9f5] hover:bg-[#f2f0ea]",
              ].join(" ")}
              aria-pressed={selected}
              onClick={() => onSkillChange(skill)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-[#2c2924]">{skill.label}</span>
                <span className="text-xs text-[#817b72]">{workflowLabel(skill.workflowId)}</span>
              </span>
              <span className="mt-1 block text-sm text-[#6d6a63]">{skill.description}</span>
              <span className="mt-1 block text-xs text-[#817b72]">{skill.matchedReason}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SourceModeSelector({
  onSourceModeChange,
  sourceMode,
}: {
  onSourceModeChange: (sourceMode: SourceModeSelection) => void;
  sourceMode: SourceModeSelection;
}) {
  const options: Array<{ id: SourceModeSelection; label: string; disabled?: boolean; helper: string }> = [
    { id: "none", label: "None", helper: "Use prompt context only." },
    { id: "source_needed_only", label: "Source-needed", helper: "Mark claims needing evidence." },
    { id: "user_uploaded", label: "User uploaded", helper: "Later", disabled: true },
    { id: "web_search", label: "Web search", helper: "Later", disabled: true },
  ];

  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase text-[#817b72]">Source mode</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.id === sourceMode;
          return (
            <button
              key={option.id}
              type="button"
              className={[
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                selected ? "border-[#e45d3d] bg-[#fff4ed]" : "border-[#e5e1d8] bg-[#faf9f5]",
                option.disabled ? "cursor-not-allowed opacity-55" : "hover:bg-[#f2f0ea]",
              ].join(" ")}
              disabled={option.disabled}
              aria-pressed={selected}
              onClick={() => onSourceModeChange(option.id)}
            >
              <span className="font-semibold text-[#2c2924]">{option.label}</span>
              <span className="mt-1 block text-xs text-[#817b72]">{option.helper}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SuggestionChecklist({
  availableModuleIds,
  onModuleToggle,
  selectedModuleIds,
  suggestedModuleIds,
}: {
  availableModuleIds: ModuleId[];
  onModuleToggle: (moduleId: ModuleId) => void;
  selectedModuleIds: ModuleId[];
  suggestedModuleIds: ModuleId[];
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase text-[#817b72]">Modules</p>
      <div className="mt-2 grid gap-2">
        {availableModuleIds.map((moduleId) => {
          const moduleDefinition = moduleCatalog[moduleId];
          const selected = selectedModuleIds.includes(moduleId);
          const recommended = suggestedModuleIds.includes(moduleId);

          return (
            <label
              key={moduleId}
              className={[
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                selected ? "border-[#e45d3d] bg-[#fff4ed]" : "border-[#e5e1d8] bg-[#faf9f5] hover:bg-[#f2f0ea]",
              ].join(" ")}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[#2f2f2b]"
                checked={selected}
                onChange={() => onModuleToggle(moduleId)}
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#2c2924]">{moduleDefinition.label}</span>
                  {recommended ? <StatusChip label="Recommended" tone="neutral" /> : null}
                </span>
                <span className="mt-1 block text-sm text-[#6d6a63]">{moduleDefinition.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function WorkPlanEditor({
  editorState,
  generationState,
  onApproveWorkPlan,
  onCancelGeneration,
  onEditorStateChange,
  onGenerateAnswer,
  onRetryGeneration,
  onSaveWorkPlan,
  resetApprovalAfterEdit,
}: {
  editorState: WorkPlanEditorState;
  generationState: GenerationState;
  onApproveWorkPlan: () => void;
  onCancelGeneration: () => void;
  onEditorStateChange: (editorState: WorkPlanEditorState) => void;
  onGenerateAnswer: () => void;
  onRetryGeneration: () => void;
  onSaveWorkPlan: (request: UpdateWorkPlanRequest) => Promise<WorkPlanRecord>;
  resetApprovalAfterEdit: () => void;
}) {
  const autosaveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const record = editorState.record;
  if (!record) return null;

  const plan = record.plan;
  const updatePlan = (nextPlan: WorkPlan) => {
    if (generationState.approvedWorkPlan) {
      resetApprovalAfterEdit();
    }
    const validation = validateWorkPlan(nextPlan);
    const nextRecord: WorkPlanRecord = {
      ...record,
      status: "draft",
      plan: {
        ...nextPlan,
        status: "draft",
      },
    };

    onEditorStateChange({
      record: nextRecord,
      isDirty: true,
      autosaveStatus: "saving",
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
    });

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        const savedRecord = await onSaveWorkPlan({
          version: record.version,
          plan: nextRecord.plan,
        });
        const savedValidation = validateWorkPlan(savedRecord.plan);
        onEditorStateChange({
          record: savedRecord,
          isDirty: false,
          autosaveStatus: "saved",
          validationErrors: savedValidation.errors,
          validationWarnings: savedValidation.warnings,
        });
      } catch {
        onEditorStateChange({
          record: nextRecord,
          isDirty: true,
          autosaveStatus: "failed",
          validationErrors: validation.errors,
          validationWarnings: validation.warnings,
        });
      } finally {
        autosaveTimerRef.current = null;
      }
    }, 550);
  };

  const updateList = (key: "assumptions" | "missingContext" | "validationCriteria", items: string[]) => {
    updatePlan({ ...plan, [key]: items });
  };

  return (
    <Panel>
      <WorkPlanHeader editorState={editorState} plan={plan} />

      {generationState.answer?.isStale ? (
        <div className="mt-4 rounded-lg border border-[var(--wm-warning)] bg-[var(--wm-warning-soft)] p-3 text-sm text-[#6d6a63]">
          Plan changed after approval. Approve again before generating.
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-3">
        <label htmlFor="work-plan-objective" className="mb-2 block text-xs font-medium uppercase text-[#817b72]">
          Objective
        </label>
        <textarea
          id="work-plan-objective"
          value={plan.objective}
          onChange={(event) => updatePlan({ ...plan, objective: event.target.value })}
          className="min-h-24 w-full resize-y rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-sm leading-6 text-[#2c2924]"
        />
      </div>

      <EditableTextList
        addLabel="Add assumption"
        items={plan.assumptions}
        title="Assumptions"
        onChange={(items) => updateList("assumptions", items)}
      />

      <EditableTextList
        addLabel="Add missing context"
        items={plan.missingContext}
        title="Missing context"
        onChange={(items) => updateList("missingContext", items)}
      />

      <WorkPlanSectionsEditor sections={plan.sections} onChange={(sections) => updatePlan({ ...plan, sections })} />

      <EditableTextList
        addLabel="Add criterion"
        items={plan.validationCriteria}
        title="Validation criteria"
        onChange={(items) => updateList("validationCriteria", items)}
      />

      <WorkPlanValidationPanel errors={editorState.validationErrors} warnings={editorState.validationWarnings} />

      <ApprovalBar
        editorState={editorState}
        generationState={generationState}
        onApproveWorkPlan={onApproveWorkPlan}
        onCancelGeneration={onCancelGeneration}
        onGenerateAnswer={onGenerateAnswer}
        onRetryGeneration={onRetryGeneration}
        record={record}
      />

      <WorkPlanUpdatePayloadPreview record={record} />
    </Panel>
  );
}

function WorkPlanHeader({ editorState, plan }: { editorState: WorkPlanEditorState; plan: WorkPlan }) {
  const autosaveLabel: Record<AutosaveStatus, string> = {
    idle: "Autosave idle",
    saving: "Saving",
    saved: "Saved",
    failed: "Save failed",
  };

  return (
    <div className="border-b border-[#e8e5dc] pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-[#817b72]">Work Plan</p>
          <h2 className="mt-1 text-lg font-semibold">Editable Work Plan</h2>
          <p className="mt-1 text-sm text-[#6d6a63]">Review and edit the roadmap before answer generation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={plan.status} tone={plan.status === "draft" ? "accent" : "neutral"} />
          <StatusChip label={autosaveLabel[editorState.autosaveStatus]} tone="neutral" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <StatusChip label={plan.role} tone="neutral" />
        <StatusChip label={plan.artifact} tone="neutral" />
        <StatusChip label={workflowLabel(plan.workflowId)} tone="accent" />
        <StatusChip label={sourceModeSelectionLabels[plan.sourceMode]} tone="neutral" />
      </div>
    </div>
  );
}

function ApprovalBar({
  editorState,
  generationState,
  onApproveWorkPlan,
  onCancelGeneration,
  onGenerateAnswer,
  onRetryGeneration,
  record,
}: {
  editorState: WorkPlanEditorState;
  generationState: GenerationState;
  onApproveWorkPlan: () => void;
  onCancelGeneration: () => void;
  onGenerateAnswer: () => void;
  onRetryGeneration: () => void;
  record: WorkPlanRecord;
}) {
  const approveDisabled = editorState.validationErrors.length > 0 || editorState.autosaveStatus === "saving";
  const generateDisabled = !generationState.approvedWorkPlan || generationState.status === "generating";

  return (
    <div className="mt-5 rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6d6a63]">
          <span className="font-semibold text-[#2c2924]">{record.status}</span> ·{" "}
          {editorState.isDirty ? "Unsaved edits" : "Saved"} · version {record.version}
          {!generationState.approvedWorkPlan && record.status !== "draft" ? (
            <span className="mt-1 block text-[var(--wm-warning)]">Plan changed after approval. Approve again before generating.</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {generationState.status === "generating" ? (
            <button
              type="button"
              className="rounded-lg border border-[#d9d5ca] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f2f0ea]"
              onClick={onCancelGeneration}
            >
              Cancel
            </button>
          ) : null}
          {generationState.status === "cancelled" || generationState.status === "failed" ? (
            <button
              type="button"
              className="rounded-lg border border-[#d9d5ca] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f2f0ea]"
              onClick={onRetryGeneration}
            >
              Retry
            </button>
          ) : null}
          <button
            type="button"
            disabled={approveDisabled}
            className="rounded-lg border border-[#d9d5ca] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f2f0ea] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onApproveWorkPlan}
          >
            Approve Work Plan
          </button>
          <button
            type="button"
            disabled={generateDisabled}
            className="rounded-lg bg-[#2f2f2b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f1f1d] disabled:cursor-not-allowed disabled:bg-[#d8d4ca] disabled:text-[#6d6a63]"
            onClick={onGenerateAnswer}
          >
            {generationState.status === "generating" ? "Generating..." : "Generate Answer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkModeErrorPanel({ error, onRetry }: { error: WorkModeError; onRetry: () => void }) {
  return (
    <Panel tone={error.recoverable ? "neutral" : "danger"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2c2924]">{error.message}</p>
          <p className="mt-1 text-xs text-[#817b72]">Error code: {error.code}</p>
        </div>
        {error.recoverable ? (
          <button
            type="button"
            className="rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-sm font-semibold hover:bg-[#f2f0ea]"
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
      </div>
    </Panel>
  );
}

function AnswerPanel({ answer }: { answer: GeneratedAnswer }) {
  return (
    <Panel>
      <div className="flex flex-col gap-2 border-b border-[#e8e5dc] pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-[#817b72]">Answer</p>
          <h2 className="mt-1 text-lg font-semibold">Generated from approved Work Plan</h2>
          <p className="mt-1 text-sm text-[#6d6a63]">Version {answer.generatedFromVersion} · {new Date(answer.createdAt).toLocaleString()}</p>
        </div>
        {answer.isStale ? <StatusChip label="Stale" tone="accent" /> : <StatusChip label="Current" tone="neutral" />}
      </div>
      {answer.isStale ? (
        <div className="mt-4 rounded-lg border border-[var(--wm-warning)] bg-[var(--wm-warning-soft)] p-3 text-sm text-[#6d6a63]">
          This answer was generated from a previous approved Work Plan.
        </div>
      ) : null}
      <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-4 text-sm leading-6 text-[#2c2924]">
        {answer.content}
      </pre>
    </Panel>
  );
}

function ValidationPanel({ validation }: { validation: ValidationResult }) {
  return (
    <Panel>
      <div className="flex flex-col gap-2 border-b border-[#e8e5dc] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-[#817b72]">Validation</p>
          <h2 className="mt-1 text-lg font-semibold">Answer quality check</h2>
        </div>
        <StatusChip label={`${validation.qualityScore}/100`} tone={validation.qualityScore >= 80 ? "neutral" : "accent"} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ValidationList title="Passed checks" items={validation.passedChecks} empty="No checks passed yet." />
        <ValidationList title="Missing sections" items={validation.missingSections} empty="No missing required sections." />
        <ValidationList title="Source-needed claims" items={validation.sourceNeededClaims} empty="No source-needed claims." />
        <ValidationList title="Recommended fixes" items={validation.recommendedFixes} empty="No recommended fixes." />
      </div>
    </Panel>
  );
}

function ValidationList({ empty, items, title }: { empty: string; items: string[]; title: string }) {
  return (
    <div className="rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-3">
      <p className="text-sm font-semibold text-[#2c2924]">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-[#6d6a63]">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#6d6a63]">{empty}</p>
      )}
    </div>
  );
}

function EditableTextList({
  addLabel,
  items,
  onChange,
  title,
}: {
  addLabel: string;
  items: string[];
  onChange: (items: string[]) => void;
  title: string;
}) {
  const updateItem = (index: number, value: string) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="mt-4 rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase text-[#817b72]">{title}</p>
        <button
          type="button"
          className="min-h-9 rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f2f0ea]"
          onClick={() => onChange([...items, ""])}
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex gap-2">
            <input
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-sm"
              aria-label={`${title} item ${index + 1}`}
            />
            <button
              type="button"
              className="min-h-10 rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-sm hover:bg-[#f2f0ea]"
              onClick={() => removeItem(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkPlanSectionsEditor({
  onChange,
  sections,
}: {
  onChange: (sections: WorkPlanSection[]) => void;
  sections: WorkPlanSection[];
}) {
  const updateSection = (sectionId: string, updates: Partial<WorkPlanSection>) => {
    onChange(sections.map((section) => (section.id === sectionId ? { ...section, ...updates } : section)));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    const nextSections = [...sections];
    const [section] = nextSections.splice(index, 1);
    nextSections.splice(nextIndex, 0, section);
    onChange(nextSections);
  };

  const removeSection = (sectionId: string) => {
    onChange(sections.filter((section) => section.id !== sectionId || section.required));
  };

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase text-[#817b72]">Roadmap sections</p>
        <button
          type="button"
          className="min-h-9 rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#f2f0ea]"
          onClick={() => onChange([...sections, createSection("New section", "Describe what this section should cover.", false)])}
        >
          Add section
        </button>
      </div>
      <div className="space-y-3">
        {sections.map((section, index) => (
          <WorkPlanSectionCard
            key={section.id}
            index={index}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
            section={section}
            onMove={moveSection}
            onRemove={removeSection}
            onUpdate={updateSection}
          />
        ))}
      </div>
    </div>
  );
}

function WorkPlanSectionCard({
  index,
  isFirst,
  isLast,
  onMove,
  onRemove,
  onUpdate,
  section,
}: {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (sectionId: string) => void;
  onUpdate: (sectionId: string, updates: Partial<WorkPlanSection>) => void;
  section: WorkPlanSection;
}) {
  return (
    <div className="rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#817b72]">Section {index + 1}</span>
          {section.required ? <StatusChip label="Required" tone="neutral" /> : <StatusChip label="Optional" tone="accent" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isFirst}
            className="min-h-9 rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => onMove(index, -1)}
          >
            Move up
          </button>
          <button
            type="button"
            disabled={isLast}
            className="min-h-9 rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => onMove(index, 1)}
          >
            Move down
          </button>
          <button
            type="button"
            disabled={section.required}
            className="min-h-9 rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45"
            title={section.required ? "Required sections cannot be removed in the MVP." : "Remove section"}
            onClick={() => onRemove(section.id)}
          >
            Remove
          </button>
        </div>
      </div>
      <label className="mb-1 block text-xs font-medium uppercase text-[#817b72]" htmlFor={`${section.id}-title`}>
        Title
      </label>
      <input
        id={`${section.id}-title`}
        value={section.title}
        onChange={(event) => onUpdate(section.id, { title: event.target.value })}
        className="mb-3 w-full rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-sm"
      />
      <label className="mb-1 block text-xs font-medium uppercase text-[#817b72]" htmlFor={`${section.id}-instructions`}>
        Instructions
      </label>
      <textarea
        id={`${section.id}-instructions`}
        value={section.instructions}
        onChange={(event) => onUpdate(section.id, { instructions: event.target.value })}
        className="min-h-28 w-full resize-y rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-sm leading-6"
      />
    </div>
  );
}

function WorkPlanValidationPanel({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-[var(--wm-success)] bg-[var(--wm-success-soft)] p-3 text-sm text-[var(--wm-success)]">
        No approval-blocking issues found.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-[var(--wm-danger)] bg-[var(--wm-danger-soft)] p-3">
        <p className="text-sm font-semibold text-[var(--wm-danger)]">Blocking errors</p>
        {errors.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-[#6d6a63]">
            {errors.map((error) => (
              <li key={error}>- {error}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#6d6a63]">None.</p>
        )}
      </div>
      <div className="rounded-lg border border-[var(--wm-warning)] bg-[var(--wm-warning-soft)] p-3">
        <p className="text-sm font-semibold text-[var(--wm-warning)]">Warnings</p>
        {warnings.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-[#6d6a63]">
            {warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#6d6a63]">None.</p>
        )}
      </div>
    </div>
  );
}

function WorkPlanUpdatePayloadPreview({ record }: { record: WorkPlanRecord }) {
  return (
    <details className="mt-4 rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-[#2c2924]">Update payload</summary>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-[#3d3a34]">
        {JSON.stringify(createUpdateWorkPlanRequest(record), null, 2)}
      </pre>
    </details>
  );
}

function FieldSelect({
  id,
  label,
  onChange,
  options,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium uppercase text-[#817b72]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[#d9d5ca] bg-white px-3 text-sm text-[#2c2924]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const label = confidence >= 0.8 ? "High confidence" : confidence >= 0.65 ? "Medium confidence" : "Low confidence";
  const tone = confidence >= 0.8 ? "success" : confidence >= 0.65 ? "neutral" : "warning";

  return (
    <div
      className={[
        "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold",
        tone === "success"
          ? "border-[var(--wm-success)] bg-[var(--wm-success-soft)] text-[var(--wm-success)]"
          : tone === "warning"
            ? "border-[var(--wm-warning)] bg-[var(--wm-warning-soft)] text-[var(--wm-warning)]"
            : "border-[#d9d5ca] bg-white text-[#6d6a63]",
      ].join(" ")}
    >
      {tone === "warning" ? <AlertTriangle size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
      {label}
      <span className="font-normal">{Math.round(confidence * 100)}%</span>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <article className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[min(720px,100%)] rounded-2xl border px-4 py-3 text-sm leading-6 shadow-[0_5px_18px_rgba(44,39,32,0.04)]",
          isUser ? "border-[#e4ded2] bg-white text-[#2c2924]" : "border-[#ddd9d0] bg-[#faf9f5] text-[#2c2924]",
        ].join(" ")}
      >
        {message.content}
      </div>
    </article>
  );
}

function StatusChip({ label, tone }: { label: string; tone: "neutral" | "accent" }) {
  return (
    <span
      className={[
        "rounded-lg border px-2 py-1 text-xs font-medium",
        tone === "accent" ? "border-[#e45d3d] bg-[#fff4ed] text-[#9a3d25]" : "border-[#d9d5ca] bg-white text-[#6d6a63]",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export default App;
