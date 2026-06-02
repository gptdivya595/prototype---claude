import { moduleCatalog } from "../templates/moduleCatalog";
import { getWorkflowTemplate } from "../templates/workflows";
import type {
  AnalysisRecord,
  ModuleId,
  RiskLevel,
  RoadmapDepth,
  SkillId,
  SourceMode,
  WorkArtifact,
  WorkflowId,
  WorkPlan,
  WorkPlanSection,
  WorkRole,
} from "../types/workMode";
import { AppError } from "../utils/errors";

type BuildWorkPlanInput = {
  analysis: AnalysisRecord;
  role: WorkRole;
  artifact: WorkArtifact;
  workflowId: WorkflowId;
  skillId: SkillId;
  selectedModuleIds: ModuleId[];
  sourceMode: SourceMode;
};

const moduleSections: Partial<Record<ModuleId, WorkPlanSection[]>> = {
  competitor_analysis: [
    {
      id: "module_competitor_benchmark",
      title: "Competitor Benchmark",
      instructions: "Define comparison dimensions and compare relevant competitors or alternatives.",
      required: true,
      moduleId: "competitor_analysis",
      sourceRefs: [],
    },
  ],
  investor_framing: [
    {
      id: "module_investor_framing",
      title: "Investor Framing",
      instructions: "Translate the work into investor-relevant narrative, market timing, moat, and proof points.",
      required: false,
      moduleId: "investor_framing",
      sourceRefs: [],
    },
  ],
  sources_required: [
    {
      id: "module_source_requirements",
      title: "Source Requirements",
      instructions: "List claims, data points, and comparisons that need source validation.",
      required: true,
      moduleId: "sources_required",
      sourceRefs: [],
    },
  ],
  root_cause_analysis: [
    {
      id: "module_root_cause",
      title: "Root Cause Analysis",
      instructions: "Capture hypotheses, evidence needed, and confirmation steps before proposing a final fix.",
      required: true,
      moduleId: "root_cause_analysis",
      sourceRefs: [],
    },
  ],
  test_cases: [
    {
      id: "module_test_cases",
      title: "Test Cases",
      instructions: "Define regression, edge-case, and acceptance tests for the final answer.",
      required: true,
      moduleId: "test_cases",
      sourceRefs: [],
    },
  ],
  metrics: [
    {
      id: "module_metrics",
      title: "Success Metrics",
      instructions: "Define measurable success criteria and how each metric should be evaluated.",
      required: true,
      moduleId: "metrics",
      sourceRefs: [],
    },
  ],
  user_personas: [
    {
      id: "module_user_personas",
      title: "Users And Personas",
      instructions: "Clarify target users, personas, jobs, and pain points.",
      required: true,
      moduleId: "user_personas",
      sourceRefs: [],
    },
  ],
  risk_analysis: [
    {
      id: "module_risks_and_mitigations",
      title: "Risks And Mitigations",
      instructions: "List execution, quality, safety, and credibility risks with mitigations.",
      required: true,
      moduleId: "risk_analysis",
      sourceRefs: [],
    },
  ],
  implementation_plan: [
    {
      id: "module_implementation_steps",
      title: "Implementation Steps",
      instructions: "Break execution into ordered steps, dependencies, owners, and handoffs.",
      required: false,
      moduleId: "implementation_plan",
      sourceRefs: [],
    },
  ],
  api_examples: [
    {
      id: "module_api_contracts",
      title: "API Contracts And Examples",
      instructions: "Include endpoints, request and response examples, and integration notes.",
      required: false,
      moduleId: "api_examples",
      sourceRefs: [],
    },
  ],
  database_schema: [
    {
      id: "module_database_schema",
      title: "Schema And Data Model",
      instructions: "Define entities, fields, relationships, migrations, and data constraints.",
      required: false,
      moduleId: "database_schema",
      sourceRefs: [],
    },
  ],
  tradeoff_analysis: [
    {
      id: "module_tradeoffs",
      title: "Tradeoffs And Decision Criteria",
      instructions: "Compare options, costs, benefits, risks, and decision criteria before finalizing the answer.",
      required: false,
      moduleId: "tradeoff_analysis",
      sourceRefs: [],
    },
  ],
};

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function uniqueSections(sections: WorkPlanSection[]) {
  const byId = new Map<string, WorkPlanSection>();

  for (const section of sections) {
    if (!byId.has(section.id)) {
      byId.set(section.id, section);
    }
  }

  return Array.from(byId.values());
}

function buildObjective(analysis: AnalysisRecord, artifact: WorkArtifact, workflowId: WorkflowId) {
  if (workflowId === "slide_deck") {
    return `Create an investor-facing ${artifact} roadmap for: ${analysis.prompt}`;
  }

  if (workflowId === "debugging_bug_fix") {
    return `Create a debugging and verification roadmap for: ${analysis.prompt}`;
  }

  if (workflowId === "backend_software") {
    return `Create a backend implementation roadmap for: ${analysis.prompt}`;
  }

  if (workflowId === "frontend_web") {
    return `Create a frontend web implementation roadmap for: ${analysis.prompt}`;
  }

  if (workflowId === "architecture_review") {
    return `Create an architecture review roadmap for: ${analysis.prompt}`;
  }

  if (workflowId === "research_report") {
    return `Create a source-aware research roadmap for: ${analysis.prompt}`;
  }

  if (workflowId === "analytics_plan") {
    return `Create an analytics and insight roadmap for: ${analysis.prompt}`;
  }

  if (workflowId === "complex_coding") {
    return `Create a complex coding implementation roadmap for: ${analysis.prompt}`;
  }

  if (workflowId === "career_path") {
    return `Create a career path roadmap for: ${analysis.prompt}`;
  }

  if (workflowId === "generic_workflow") {
    return `Create a general editable roadmap for: ${analysis.prompt}`;
  }

  return `Create an editable ${artifact} roadmap for: ${analysis.prompt}`;
}

function inferAudience(analysis: AnalysisRecord, role: WorkRole, artifact: WorkArtifact) {
  const audienceHints = analysis.normalized.audienceHints;
  if (audienceHints.includes("investors") || audienceHints.includes("investor")) return "investors";
  if (audienceHints.length > 0) return unique(audienceHints).join(", ");
  if (artifact === "PPT") return "decision makers";
  if (artifact === "Career Roadmap") return "the person planning the career transition";
  if (role === "Software Architect") return "engineering leadership and senior engineers";
  if (role === "Data Analyst") return "data and business stakeholders";
  if (role === "Developer") return "engineering team";
  if (role === "Product Manager") return "product and engineering stakeholders";
  return undefined;
}

function workflowAssumptions(workflowId: WorkflowId, sourceMode: SourceMode) {
  const assumptions: string[] = [];

  if (workflowId === "slide_deck") {
    assumptions.push("The user wants a slide-by-slide outline, not a generated .pptx file.");
    assumptions.push("Competitor claims should be validated before final use.");
  }

  if (workflowId === "prd_generation") {
    assumptions.push("The user wants a draft PRD that can be edited before answer generation.");
  }

  if (workflowId === "debugging_bug_fix") {
    assumptions.push("The final answer should avoid assuming root cause until evidence is provided.");
  }

  if (workflowId === "backend_software") {
    assumptions.push("The user wants backend design and implementation sequencing, not only product requirements.");
    assumptions.push("API contracts, data model, and tests should be explicit before final generation.");
  }

  if (workflowId === "frontend_web") {
    assumptions.push("The user wants a usable frontend implementation plan with UI states and responsive behavior.");
    assumptions.push("Accessibility, loading states, errors, and tests should be considered before final generation.");
  }

  if (workflowId === "architecture_review") {
    assumptions.push("The user wants an architecture review with tradeoffs, risks, and prioritized recommendations.");
  }

  if (workflowId === "research_report") {
    assumptions.push("The user wants source-aware synthesis and clear separation between evidence and assumptions.");
  }

  if (workflowId === "analytics_plan") {
    assumptions.push("The user wants metrics, data requirements, analysis method, and validation limitations.");
  }

  if (workflowId === "complex_coding") {
    assumptions.push("The user wants implementation sequencing, edge cases, and tests for a non-trivial coding task.");
  }

  if (workflowId === "career_path") {
    assumptions.push("The user wants a practical career roadmap with skill gaps, portfolio work, and progress metrics.");
  }

  if (workflowId === "generic_workflow") {
    assumptions.push("The prompt is ambiguous or cross-functional, so the roadmap should keep intent, assumptions, and quality checks explicit.");
  }

  if (sourceMode !== "none") {
    assumptions.push("Source-backed claims should be marked for validation before final answer generation.");
  }

  return assumptions;
}

function workflowMissingContext(workflowId: WorkflowId, sourceMode: SourceMode, riskLevel: RiskLevel) {
  const missingContext =
    workflowId === "slide_deck"
      ? ["Target slide count", "Target audience", "Preferred competitor list", "Geographic or market scope"]
      : workflowId === "prd_generation"
        ? ["Target users", "Business goal", "Constraints", "Launch timeline"]
        : workflowId === "debugging_bug_fix"
          ? ["Error logs", "Reproduction steps", "Affected environment", "Expected behavior"]
          : workflowId === "backend_software"
            ? ["Runtime or framework", "Existing API contracts", "Database constraints", "Auth and deployment environment"]
            : workflowId === "frontend_web"
              ? ["Design references", "Target devices", "API availability", "Accessibility requirements"]
              : workflowId === "architecture_review"
                ? ["Current architecture diagram", "Traffic and scale assumptions", "Operational constraints", "Known incidents or pain points"]
                : workflowId === "research_report"
                  ? ["Research scope", "Approved source types", "Target geography or segment", "Decision the research should support"]
                  : workflowId === "analytics_plan"
                    ? ["Available datasets", "Metric definitions", "Date range", "Required segments or filters"]
                    : workflowId === "complex_coding"
                      ? ["Repo structure", "Framework/library versions", "Constraints", "Acceptance tests"]
                      : workflowId === "career_path"
                        ? ["Current role or level", "Target role", "Timeline", "Weekly time budget"]
                        : ["Final artifact type", "Target audience", "Success criteria", "Relevant constraints"];

  if (sourceMode !== "none") {
    missingContext.push("Approved source list or source policy");
  }

  if (riskLevel === "high" || riskLevel === "restricted") {
    missingContext.push("Safety, legal, or compliance constraints");
  }

  return missingContext;
}

function buildSuggestions(templateModuleIds: ModuleId[], selectedModuleIds: ModuleId[]) {
  const suggestionIds = unique(templateModuleIds);

  return suggestionIds
    .map((moduleId) => moduleCatalog.find((module) => module.id === moduleId))
    .filter((module): module is NonNullable<typeof module> => Boolean(module))
    .map((module) => ({
      id: module.id,
      label: module.label,
      description: module.description,
      selected: selectedModuleIds.includes(module.id),
    }));
}

function depthFromAnalysis(analysis: AnalysisRecord, workflowDefault: RoadmapDepth) {
  return analysis.roadmapDepth ?? workflowDefault;
}

export function buildWorkPlanFromTemplate(input: BuildWorkPlanInput): WorkPlan {
  const template = getWorkflowTemplate(input.workflowId);

  if (!template) {
    throw new AppError(400, "unknown_workflow_id", `Unknown workflow id: ${input.workflowId}`);
  }

  const selectedModuleIds = unique([...template.defaultModules, ...input.selectedModuleIds]);
  const moduleSpecificSections = selectedModuleIds.flatMap((moduleId) => moduleSections[moduleId] ?? []);
  const sections = uniqueSections([...template.sections, ...moduleSpecificSections]);
  const suggestionModuleIds = [...template.defaultModules, ...template.optionalModules, ...input.selectedModuleIds];

  return {
    prompt: input.analysis.prompt,
    role: input.role,
    artifact: input.artifact,
    workflowId: input.workflowId,
    skillId: input.skillId,
    objective: buildObjective(input.analysis, input.artifact, input.workflowId),
    audience: inferAudience(input.analysis, input.role, input.artifact),
    sourceMode: input.sourceMode,
    roadmapDepth: depthFromAnalysis(input.analysis, template.defaultDepth),
    riskLevel: input.analysis.riskLevel,
    assumptions: workflowAssumptions(input.workflowId, input.sourceMode),
    missingContext: workflowMissingContext(input.workflowId, input.sourceMode, input.analysis.riskLevel),
    sections,
    suggestions: buildSuggestions(suggestionModuleIds, selectedModuleIds),
    validationCriteria: template.validationCriteria,
    selectedModuleIds,
  };
}
