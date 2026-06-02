import { workflows } from "../templates/workflows";
import type {
  Candidate,
  ModuleId,
  NormalizedPrompt,
  TaskCategory,
  WorkArtifact,
  WorkflowId,
  WorkflowPick,
  WorkRole,
} from "../types/workMode";
import { signalMatches } from "./promptNormalizer";

type PickWorkflowInput = {
  detectedArtifact: WorkArtifact;
  detectedRole: WorkRole;
  taskCategory: TaskCategory;
  moduleCandidates: Array<Candidate<ModuleId>>;
  normalized: NormalizedPrompt;
};

function sortCandidates<T extends string>(candidates: Array<Candidate<T>>) {
  return [...candidates].sort((left, right) => right.score - left.score || left.value.localeCompare(right.value));
}

function cap(value: number, max: number) {
  return Math.min(value, max);
}

export function pickWorkflow(input: PickWorkflowInput): WorkflowPick {
  const moduleIds = input.moduleCandidates.map((candidate) => candidate.value);

  const candidates = workflows.map((workflow) => {
    let score = 0;
    const matchedSignals: string[] = [];

    if (input.detectedArtifact !== "Unknown" && workflow.supportedArtifacts.includes(input.detectedArtifact)) {
      score += 45;
      matchedSignals.push(`artifact:${input.detectedArtifact}`);
    }

    if (input.detectedRole !== "Unknown" && workflow.supportedRoles.includes(input.detectedRole)) {
      score += 15;
      matchedSignals.push(`role:${input.detectedRole}`);
    }

    if (workflow.taskCategory === input.taskCategory) {
      score += 20;
      matchedSignals.push(`task:${input.taskCategory}`);
    }

    const keywordMatches = workflow.keywordSignals.filter((signal) => signalMatches(input.normalized, signal));
    score += cap(keywordMatches.length * 2, 10);
    matchedSignals.push(...keywordMatches);

    const workflowModuleIds = new Set([...workflow.defaultModuleIds, ...workflow.optionalModuleIds]);
    const moduleOverlap = moduleIds.filter((moduleId) => workflowModuleIds.has(moduleId));
    score += cap(moduleOverlap.length * 2, 10);
    matchedSignals.push(...moduleOverlap.map((moduleId) => `module:${moduleId}`));

    const hasBugSignal = ["bug", "error", "fix", "debug", "crash", "regression"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasDeckSignal = ["ppt", "presentation", "slides", "deck", "pitch deck"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasPrdSignal = ["prd", "product requirement", "feature spec", "user stories"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasInvestorCompetitorSignal = ["competitor", "competitors", "investor", "investors", "pitch"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasBackendSignal = ["backend", "api", "endpoint", "server", "microservice", "database", "auth", "queue"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasFrontendSignal = ["frontend", "web app", "react", "ui", "component", "responsive", "browser", "accessibility"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasArchitectureReviewSignal = ["architecture review", "review architecture", "system design", "scalability", "reliability"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasResearchSignal = ["research", "sources", "citations", "report", "evidence", "synthesize"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasAnalyticsSignal = ["analytics", "data analysis", "dataset", "sql", "dashboard", "cohort", "funnel"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasComplexCodingSignal = ["complex coding", "multi-file", "algorithm", "refactor", "integration", "sdk", "library"].some((signal) =>
      signalMatches(input.normalized, signal),
    );
    const hasCareerSignal = ["career", "career path", "learning path", "resume", "cv", "interview", "portfolio", "job search"].some((signal) =>
      signalMatches(input.normalized, signal),
    );

    if (workflow.id === "debugging_bug_fix" && hasBugSignal) {
      score += 25;
      matchedSignals.push("tie-break:bug-fix");
    }

    if (workflow.id === "slide_deck" && hasDeckSignal) {
      score += 15;
      matchedSignals.push("tie-break:explicit-deck");
    }

    if (workflow.id === "slide_deck" && hasDeckSignal && hasInvestorCompetitorSignal) {
      score += 18;
      matchedSignals.push("tie-break:deck-investor-competitor");
    }

    if (workflow.id === "prd_generation" && hasPrdSignal) {
      score += 15;
      matchedSignals.push("tie-break:explicit-prd");
    }

    if (workflow.id === "backend_software" && hasBackendSignal && !hasBugSignal) {
      score += 28;
      matchedSignals.push("tie-break:backend");
    }

    if (workflow.id === "frontend_web" && hasFrontendSignal && !hasBugSignal) {
      score += 28;
      matchedSignals.push("tie-break:frontend");
    }

    if (workflow.id === "architecture_review" && hasArchitectureReviewSignal) {
      score += 32;
      matchedSignals.push("tie-break:architecture-review");
    }

    if (workflow.id === "research_report" && hasResearchSignal && !hasDeckSignal) {
      score += 24;
      matchedSignals.push("tie-break:research");
    }

    if (workflow.id === "analytics_plan" && hasAnalyticsSignal) {
      score += 30;
      matchedSignals.push("tie-break:analytics");
    }

    if (workflow.id === "complex_coding" && hasComplexCodingSignal && !hasBugSignal) {
      score += 26;
      matchedSignals.push("tie-break:complex-coding");
    }

    if (workflow.id === "career_path" && hasCareerSignal) {
      score += 35;
      matchedSignals.push("tie-break:career-path");
    }

    return {
      value: workflow.id,
      score,
      matchedSignals: Array.from(new Set(matchedSignals)),
    } satisfies Candidate<WorkflowId>;
  });

  const sortedCandidates = sortCandidates(candidates);
  const selected = sortedCandidates[0];
  const fallback = selected.score > 0 ? selected : { value: "generic_workflow" as const, score: 0, matchedSignals: [] };
  const selectedWorkflow = workflows.find((workflow) => workflow.id === fallback.value) ?? workflows[1];
  const alternatives = sortedCandidates.filter(
    (candidate) => candidate.value !== fallback.value && candidate.score > 0 && fallback.score - candidate.score <= 12,
  );

  return {
    selectedWorkflowId: fallback.value,
    selectedSkillId: selectedWorkflow.skillId,
    workflowCandidates: sortedCandidates,
    alternatives,
  };
}
