import type {
  ModuleId,
  RoadmapDepth,
  RiskLevel,
  SignalDefinition,
  SkillId,
  SourceMode,
  WorkArtifact,
  WorkRole,
  WorkflowId,
} from "../types/workMode";

export const WORKFLOW_IDS = [
  "slide_deck",
  "prd_generation",
  "debugging_bug_fix",
  "backend_software",
  "frontend_web",
  "architecture_review",
  "research_report",
  "analytics_plan",
  "complex_coding",
  "career_path",
  "generic_workflow",
] as const satisfies readonly WorkflowId[];

export const PLANNED_WORKFLOW_IDS = [
  "competitive_analysis",
  "brd_generation",
  "strategy_memo",
  "career_transition_plan",
] as const;

export const SKILL_IDS = [
  "investor_deck_builder",
  "prd_builder",
  "bug_fix_planner",
  "backend_api_builder",
  "frontend_app_builder",
  "architecture_reviewer",
  "research_synthesizer",
  "analytics_planner",
  "complex_code_planner",
  "career_path_coach",
  "general_workflow_planner",
] as const satisfies readonly SkillId[];

export const MODULE_IDS = [
  "assumptions",
  "competitor_analysis",
  "investor_framing",
  "sources_required",
  "root_cause_analysis",
  "test_cases",
  "metrics",
  "user_personas",
  "validation_checklist",
  "risk_analysis",
  "implementation_plan",
  "market_landscape",
  "api_examples",
  "database_schema",
  "tradeoff_analysis",
] as const satisfies readonly ModuleId[];

export const roleRegistry: Array<SignalDefinition<WorkRole>> = [
  {
    value: "Product Manager",
    signals: ["prd", "feature", "roadmap", "mvp", "user story", "user stories", "metrics", "requirement"],
  },
  {
    value: "Researcher",
    signals: ["research", "sources", "citations", "citation", "market", "competitor", "evidence", "benchmark"],
  },
  {
    value: "Developer",
    signals: ["code", "bug", "api", "database", "test", "deploy", "debug", "component", "repo", "fix"],
  },
  {
    value: "Software Architect",
    signals: ["architecture", "system design", "scalability", "microservice", "distributed", "review architecture"],
  },
  {
    value: "Data Analyst",
    signals: ["analytics", "analysis", "dashboard", "sql", "dataset", "cohort", "funnel", "metrics"],
  },
  {
    value: "Founder",
    signals: ["startup", "investor", "pitch", "fundraising", "market", "pricing", "moat", "gtm"],
  },
  {
    value: "Business Analyst",
    signals: ["brd", "stakeholder", "business rules", "process", "workflow", "requirements"],
  },
  {
    value: "Designer",
    signals: ["wireframe", "ux", "ui", "prototype", "figma", "journey", "usability"],
  },
  {
    value: "Marketer",
    signals: ["campaign", "positioning", "copy", "seo", "launch", "channels", "messaging"],
  },
  {
    value: "Executive",
    signals: ["executive", "board", "strategy", "decision", "leadership", "okr"],
  },
  {
    value: "Career Coach",
    signals: ["career", "resume", "cv", "interview", "portfolio", "job search", "learning path", "roadmap to become"],
  },
];

export const artifactRegistry: Array<SignalDefinition<WorkArtifact>> = [
  {
    value: "PPT",
    taskCategory: "presentation",
    intentCategory: "drafting",
    signals: ["ppt", "presentation", "slides", "deck", "pitch deck", "slide deck"],
  },
  {
    value: "PRD",
    taskCategory: "product",
    intentCategory: "planning",
    signals: ["prd", "product requirement", "product requirements", "feature spec", "user stories"],
  },
  {
    value: "BRD",
    taskCategory: "business",
    intentCategory: "planning",
    signals: ["brd", "business requirement", "business requirements", "business rules", "stakeholder"],
  },
  {
    value: "Code",
    taskCategory: "engineering",
    intentCategory: "implementation",
    signals: ["code", "implement", "build", "fix bug", "debug", "repo", "component", "api", "test", "function"],
  },
  {
    value: "Backend API",
    taskCategory: "backend",
    intentCategory: "implementation",
    signals: ["backend", "api", "endpoint", "server", "service", "microservice", "database", "auth", "queue"],
  },
  {
    value: "Frontend App",
    taskCategory: "frontend",
    intentCategory: "implementation",
    signals: ["frontend", "web app", "react", "vue", "ui", "component", "css", "responsive", "browser"],
  },
  {
    value: "Technical Design",
    taskCategory: "technical_design",
    intentCategory: "planning",
    signals: ["architecture", "system design", "database schema", "api design", "technical design"],
  },
  {
    value: "Architecture Review",
    taskCategory: "technical_design",
    intentCategory: "review",
    signals: ["architecture review", "review architecture", "system review", "technical review", "design review", "scalability review"],
  },
  {
    value: "Competitive Analysis",
    taskCategory: "analysis",
    intentCategory: "analysis",
    signals: ["competitor", "competitors", "benchmark", "comparison", "alternatives", "competitive analysis"],
  },
  {
    value: "Research Report",
    taskCategory: "research",
    intentCategory: "research",
    signals: ["research", "report", "sources", "citations", "market research", "evidence"],
  },
  {
    value: "Strategy Memo",
    taskCategory: "analysis",
    intentCategory: "decision_support",
    signals: ["strategy memo", "memo", "strategy", "decision brief", "recommendation"],
  },
  {
    value: "Data Analysis",
    taskCategory: "data",
    intentCategory: "analysis",
    signals: ["data analysis", "dataset", "sql", "dashboard", "analytics", "chart"],
  },
  {
    value: "Implementation Plan",
    taskCategory: "engineering",
    intentCategory: "implementation",
    signals: ["implementation plan", "build plan", "technical roadmap", "coding plan", "step by step implementation"],
  },
  {
    value: "Career Roadmap",
    taskCategory: "career",
    intentCategory: "coaching",
    signals: ["career roadmap", "career path", "learning path", "become", "job search", "interview prep", "resume"],
  },
  {
    value: "General Roadmap",
    taskCategory: "general",
    intentCategory: "planning",
    signals: ["plan", "roadmap", "outline", "structure", "framework", "guide"],
  },
];

export const SOURCE_MODES = ["none", "source_needed_only", "user_uploaded", "web_search"] as const satisfies readonly SourceMode[];
export const RISK_LEVELS = ["low", "medium", "high", "restricted"] as const satisfies readonly RiskLevel[];
export const ROADMAP_DEPTHS = ["L1", "L2", "L3", "L4"] as const satisfies readonly RoadmapDepth[];

export const sourceModeValues: SourceMode[] = [...SOURCE_MODES];
export const riskLevelValues: RiskLevel[] = [...RISK_LEVELS];
export const roadmapDepthValues: RoadmapDepth[] = [...ROADMAP_DEPTHS];

export const roadmapDepthLevels = [
  {
    id: "L1",
    label: "Light Roadmap",
    sectionCount: "3-5",
    useWhen: ["short prompt", "quick draft", "low context"],
  },
  {
    id: "L2",
    label: "Standard Work Plan",
    sectionCount: "6-10",
    useWhen: ["normal PRD", "normal deck", "normal bug fix"],
  },
  {
    id: "L3",
    label: "Deep Work Plan",
    sectionCount: "10-16",
    useWhen: ["competitors", "investors", "technical feasibility", "source-heavy"],
  },
  {
    id: "L4",
    label: "Enterprise Roadmap",
    sectionCount: "16-25",
    useWhen: ["high-stakes", "compliance", "security", "financial", "medical", "legal"],
  },
] as const;

export const WORK_ROLES = [
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
] as const satisfies readonly WorkRole[];

export const WORK_ARTIFACTS = [
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
] as const satisfies readonly WorkArtifact[];

export const workRoles = WORK_ROLES;
export const workArtifacts = WORK_ARTIFACTS;
