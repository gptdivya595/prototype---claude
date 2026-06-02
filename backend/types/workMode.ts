export type WorkRole =
  | "Product Manager"
  | "Researcher"
  | "Developer"
  | "Software Architect"
  | "Data Analyst"
  | "Founder"
  | "Business Analyst"
  | "Designer"
  | "Marketer"
  | "Executive"
  | "Career Coach"
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
  | "Architecture Review"
  | "Backend API"
  | "Frontend App"
  | "Data Analysis"
  | "Career Roadmap"
  | "Implementation Plan"
  | "General Roadmap"
  | "Unknown";

export type TaskCategory =
  | "presentation"
  | "product"
  | "business"
  | "engineering"
  | "frontend"
  | "backend"
  | "technical_design"
  | "research"
  | "analysis"
  | "data"
  | "career"
  | "general";

export type IntentCategory =
  | "planning"
  | "drafting"
  | "debugging"
  | "review"
  | "research"
  | "analysis"
  | "decision_support"
  | "implementation"
  | "coaching";

export type SourceMode = "none" | "source_needed_only" | "user_uploaded" | "web_search";
export type RiskLevel = "low" | "medium" | "high" | "restricted";
export type RoadmapDepth = "L1" | "L2" | "L3" | "L4";
export type ConfidenceBand = "low" | "medium" | "high";

export type WorkflowId =
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
export type SkillId =
  | "investor_deck_builder"
  | "prd_builder"
  | "bug_fix_planner"
  | "backend_api_builder"
  | "frontend_app_builder"
  | "architecture_reviewer"
  | "research_synthesizer"
  | "analytics_planner"
  | "complex_code_planner"
  | "career_path_coach"
  | "general_workflow_planner";

export type ModuleId =
  | "assumptions"
  | "competitor_analysis"
  | "investor_framing"
  | "sources_required"
  | "root_cause_analysis"
  | "test_cases"
  | "metrics"
  | "user_personas"
  | "validation_checklist"
  | "risk_analysis"
  | "implementation_plan"
  | "market_landscape"
  | "api_examples"
  | "database_schema"
  | "tradeoff_analysis";

export type Candidate<T extends string> = {
  value: T;
  score: number;
  matchedSignals: string[];
};

export type SignalDefinition<T extends string> = {
  value: T;
  label?: string;
  signals: string[];
  taskCategory?: TaskCategory;
  intentCategory?: IntentCategory;
};

export type ModuleDefinition = {
  id: ModuleId;
  label: string;
  description: string;
  signals: string[];
  defaultForWorkflowIds?: WorkflowId[];
};

export type WorkPlanSection = {
  id: string;
  title: string;
  instructions: string;
  required: boolean;
  moduleId?: ModuleId;
  sourceRefs: string[];
};

export type WorkPlanSuggestion = {
  id: ModuleId;
  label: string;
  description: string;
  selected: boolean;
};

export type WorkflowDefinition = {
  id: WorkflowId;
  label: string;
  description: string;
  skillId: SkillId;
  taskCategory: TaskCategory;
  intentCategory: IntentCategory;
  supportedRoles: WorkRole[];
  supportedArtifacts: WorkArtifact[];
  keywordSignals: string[];
  defaultModuleIds: ModuleId[];
  optionalModuleIds: ModuleId[];
  defaultDepth: RoadmapDepth;
};

export type WorkModeSkill = {
  id: SkillId;
  label: string;
  description: string;
  workflowId: WorkflowId;
  supportedRoles: WorkRole[];
  supportedArtifacts: WorkArtifact[];
  matchedSignals: string[];
  defaultModuleIds: ModuleId[];
  optionalModuleIds: ModuleId[];
};

export type WorkflowTemplate = {
  id: WorkflowId;
  name: string;
  artifacts: WorkArtifact[];
  roles: WorkRole[];
  taskCategories: TaskCategory[];
  keywordSignals: string[];
  defaultModules: ModuleId[];
  optionalModules: ModuleId[];
  defaultSourceMode: SourceMode;
  defaultDepth: RoadmapDepth;
  sections: WorkPlanSection[];
  validationCriteria: string[];
};

export type NormalizedPrompt = {
  originalText: string;
  trimmedText: string;
  lowerText: string;
  tokens: string[];
  phrases: string[];
  explicitArtifactHints: string[];
  audienceHints: string[];
  entityHints: string[];
  sourceHints: string[];
  riskHints: string[];
  promptLength: number;
};

export type WorkflowPick = {
  selectedWorkflowId: WorkflowId;
  selectedSkillId: SkillId;
  workflowCandidates: Array<Candidate<WorkflowId>>;
  alternatives: Array<Candidate<WorkflowId>>;
};

export type DetectionResult = {
  detectedRole: WorkRole;
  detectedArtifact: WorkArtifact;
  taskCategory: TaskCategory;
  intentCategory: IntentCategory;
  confidence: number;
  confidenceBand: ConfidenceBand;
  recommendedWorkflowId: WorkflowId;
  recommendedSkillId: SkillId;
  recommendedModuleIds: ModuleId[];
  selectedModuleIds: ModuleId[];
  sourceMode: SourceMode;
  roadmapDepth: RoadmapDepth;
  riskLevel: RiskLevel;
  reason: string;
  matchedSignals: string[];
  alternatives: Array<Candidate<WorkflowId>>;
  questionsForUser: string[];
  candidates: {
    roles: Array<Candidate<WorkRole>>;
    artifacts: Array<Candidate<WorkArtifact>>;
    modules: Array<Candidate<ModuleId>>;
    workflows: Array<Candidate<WorkflowId>>;
  };
};

export type AnalysisRecord = DetectionResult & {
  analysisId: string;
  conversationId: string;
  mode: "work";
  prompt: string;
  normalized: Omit<NormalizedPrompt, "originalText">;
  llm?: {
    classifier?: LlmCallMetadata;
  };
  createdAt: string;
};

export type WorkPlanStatus = "draft" | "approved" | "generated";

export type WorkPlan = {
  prompt: string;
  role: WorkRole;
  artifact: WorkArtifact;
  workflowId: WorkflowId;
  skillId: SkillId;
  objective: string;
  audience?: string;
  sourceMode: SourceMode;
  roadmapDepth: RoadmapDepth;
  riskLevel: RiskLevel;
  assumptions: string[];
  missingContext: string[];
  sections: WorkPlanSection[];
  suggestions: WorkPlanSuggestion[];
  validationCriteria: string[];
  selectedModuleIds: ModuleId[];
};

export type WorkPlanRecord = {
  workPlanId: string;
  conversationId: string;
  analysisId: string;
  status: WorkPlanStatus;
  version: number;
  plan: WorkPlan;
  approvedPlan: WorkPlan | null;
  approvedAt?: string;
  generatedOutputIds: string[];
  llm?: {
    workPlan?: LlmCallMetadata;
  };
  createdAt: string;
  updatedAt: string;
};

export type ValidationResult = {
  matchesApprovedPlan: boolean;
  missingSections: string[];
  unsupportedClaims: string[];
  qualityScore: number;
  recommendedFixes: string[];
  sourceNeededClaims: string[];
  passedChecks: string[];
};

export type GeneratedOutput = {
  answerId: string;
  workPlanId: string;
  generatedFromVersion: number;
  answer: string;
  validation: ValidationResult;
  llm?: {
    answer?: LlmCallMetadata;
  };
  createdAt: string;
};

export type LlmProvider = "deterministic" | "local" | "openai" | "fallback";

export type LlmCallMetadata = {
  attempted: boolean;
  provider: LlmProvider;
  model?: string;
  latencyMs?: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
};
