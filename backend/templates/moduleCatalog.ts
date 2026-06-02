import type { ModuleDefinition } from "../types/workMode";

export const moduleCatalog: ModuleDefinition[] = [
  {
    id: "assumptions",
    label: "Assumptions",
    description: "State the assumptions the answer will rely on before drafting.",
    signals: ["assumption", "assumptions", "context", "given"],
    defaultForWorkflowIds: ["slide_deck", "prd_generation", "debugging_bug_fix"],
  },
  {
    id: "competitor_analysis",
    label: "Competitor Analysis",
    description: "Compare alternatives, positioning, strengths, gaps, and tradeoffs.",
    signals: ["competitor", "competitors", "compare", "comparison", "alternative", "alternatives", "benchmark"],
  },
  {
    id: "investor_framing",
    label: "Investor Framing",
    description: "Frame the output around market, moat, traction, and fundraising logic.",
    signals: ["investor", "investors", "pitch", "fundraising", "fundraise", "moat", "startup"],
  },
  {
    id: "sources_required",
    label: "Sources Required",
    description: "Flag claims that need citations, data, or user-provided evidence.",
    signals: ["latest", "recent", "source", "sources", "citation", "citations", "data", "evidence", "pricing", "market"],
  },
  {
    id: "root_cause_analysis",
    label: "Root Cause Analysis",
    description: "Identify likely causes, reproduction paths, and failure boundaries.",
    signals: ["bug", "error", "diagnose", "debug", "cause", "root cause", "crash", "failure"],
  },
  {
    id: "test_cases",
    label: "Test Cases",
    description: "Define regression, edge-case, and acceptance tests.",
    signals: ["test", "tests", "regression", "verify", "qa", "coverage", "acceptance"],
  },
  {
    id: "metrics",
    label: "Metrics",
    description: "Define success metrics, KPIs, and measurement plan.",
    signals: ["metric", "metrics", "kpi", "success", "north star", "measure"],
  },
  {
    id: "user_personas",
    label: "User Personas",
    description: "Clarify users, customers, jobs, and pain points.",
    signals: ["user", "users", "customer", "customers", "persona", "personas", "journey"],
  },
  {
    id: "validation_checklist",
    label: "Validation Checklist",
    description: "List checks the final answer must pass before delivery.",
    signals: ["validate", "validation", "checklist", "acceptance", "verify"],
    defaultForWorkflowIds: ["slide_deck", "prd_generation", "debugging_bug_fix"],
  },
  {
    id: "risk_analysis",
    label: "Risk Analysis",
    description: "Call out risks, constraints, unknowns, and mitigations.",
    signals: ["risk", "risks", "constraint", "constraints", "security", "legal", "compliance"],
    defaultForWorkflowIds: ["prd_generation", "debugging_bug_fix"],
  },
  {
    id: "implementation_plan",
    label: "Implementation Plan",
    description: "Break execution into steps, dependencies, and handoffs.",
    signals: ["implementation", "implement", "build", "milestone", "dependency", "timeline"],
  },
  {
    id: "market_landscape",
    label: "Market Landscape",
    description: "Summarize market categories, segments, forces, and trends.",
    signals: ["market", "landscape", "category", "trend", "tam", "sam", "som"],
  },
  {
    id: "api_examples",
    label: "API Examples",
    description: "Include endpoint, payload, and integration examples.",
    signals: ["api", "endpoint", "request", "response", "payload", "integration"],
  },
  {
    id: "database_schema",
    label: "Database Schema",
    description: "Include schema, entities, relationships, and storage constraints.",
    signals: ["database", "schema", "table", "sql", "migration", "model"],
  },
  {
    id: "tradeoff_analysis",
    label: "Tradeoff Analysis",
    description: "Compare options, costs, benefits, and decision criteria.",
    signals: ["tradeoff", "tradeoffs", "alternative", "alternatives", "option", "options", "decision"],
  },
];
