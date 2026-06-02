import type { WorkModeSkill } from "../types/workMode";
import { workflows } from "./workflows";

const skillCopy: Record<WorkModeSkill["id"], Pick<WorkModeSkill, "label" | "description">> = {
  investor_deck_builder: {
    label: "Investor Deck Builder",
    description: "Creates an investor-facing slide deck roadmap.",
  },
  prd_builder: {
    label: "PRD Builder",
    description: "Creates a structured product requirements roadmap.",
  },
  bug_fix_planner: {
    label: "Bug Fix Planner",
    description: "Creates a debugging and verification roadmap.",
  },
  backend_api_builder: {
    label: "Backend API Builder",
    description: "Plans backend services, APIs, data models, auth, tests, and deployment risks.",
  },
  frontend_app_builder: {
    label: "Frontend App Builder",
    description: "Plans web UI, components, state, accessibility, responsive behavior, and frontend tests.",
  },
  architecture_reviewer: {
    label: "Architecture Reviewer",
    description: "Reviews system design, scalability, reliability, security, and tradeoffs.",
  },
  research_synthesizer: {
    label: "Research Synthesizer",
    description: "Plans source-aware research, synthesis, comparisons, and recommendations.",
  },
  analytics_planner: {
    label: "Analytics Planner",
    description: "Plans datasets, metrics, SQL, dashboards, experiments, and insight validation.",
  },
  complex_code_planner: {
    label: "Complex Code Planner",
    description: "Plans multi-file implementation, algorithms, integrations, tests, and rollout.",
  },
  career_path_coach: {
    label: "Career Path Coach",
    description: "Plans career goals, skill gaps, learning projects, portfolio, and interview prep.",
  },
  general_workflow_planner: {
    label: "General Work Planner",
    description: "Creates a neutral editable roadmap when the prompt is ambiguous or cross-functional.",
  },
};

export const skillCatalog: WorkModeSkill[] = workflows.map((workflow) => ({
  id: workflow.skillId,
  label: skillCopy[workflow.skillId].label,
  description: skillCopy[workflow.skillId].description,
  workflowId: workflow.id,
  supportedRoles: workflow.supportedRoles,
  supportedArtifacts: workflow.supportedArtifacts,
  matchedSignals: workflow.keywordSignals,
  defaultModuleIds: workflow.defaultModuleIds,
  optionalModuleIds: workflow.optionalModuleIds,
}));

export const workModeSkills = skillCatalog;
