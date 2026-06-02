import { moduleCatalog } from "../templates/moduleCatalog";
import { artifactRegistry, roleRegistry } from "../templates/registries";
import { workflows } from "../templates/workflows";
import type {
  Candidate,
  ConfidenceBand,
  DetectionResult,
  IntentCategory,
  ModuleId,
  NormalizedPrompt,
  RiskLevel,
  RoadmapDepth,
  SignalDefinition,
  SourceMode,
  TaskCategory,
  WorkArtifact,
  WorkRole,
} from "../types/workMode";
import { normalizePrompt, signalMatches } from "./promptNormalizer";
import { pickWorkflow } from "./workflowPicker";

function sortCandidates<T extends string>(candidates: Array<Candidate<T>>) {
  return [...candidates].sort((left, right) => right.score - left.score || left.value.localeCompare(right.value));
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function scoreSignals<T extends string>(normalized: NormalizedPrompt, definitions: Array<SignalDefinition<T>>) {
  const candidates = definitions.map((definition, index) => {
    const matchedSignals = definition.signals.filter((signal) => signalMatches(normalized, signal));
    const score = matchedSignals.reduce((total, signal) => total + (signal.includes(" ") ? 12 : 8), 0);

    return {
      value: definition.value,
      score,
      matchedSignals,
      index,
    };
  });

  return candidates
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ index: _index, ...candidate }) => candidate satisfies Candidate<T>);
}

function scoreModules(normalized: NormalizedPrompt) {
  const candidates = moduleCatalog.map((module) => {
    const matchedSignals = module.signals.filter((signal) => signalMatches(normalized, signal));
    const score = matchedSignals.reduce((total, signal) => total + (signal.includes(" ") ? 12 : 8), 0);

    return {
      value: module.id,
      score,
      matchedSignals,
    } satisfies Candidate<ModuleId>;
  });

  return sortCandidates(candidates.filter((candidate) => candidate.score > 0));
}

function getTopCandidate<T extends string>(candidates: Array<Candidate<T>>, fallback: T): Candidate<T> {
  return candidates[0] ?? { value: fallback, score: 0, matchedSignals: [] };
}

function boostExplicitArtifactCandidates(
  normalized: NormalizedPrompt,
  candidates: Array<Candidate<WorkArtifact>>,
): Array<Candidate<WorkArtifact>> {
  return sortCandidates(
    candidates.map((candidate) => {
      const hasExplicitHint = candidate.matchedSignals.some((signal) => normalized.explicitArtifactHints.includes(signal));

      if (!hasExplicitHint) return candidate;

      return {
        ...candidate,
        score: candidate.score + 20,
        matchedSignals: unique([...candidate.matchedSignals, "explicit-artifact"]),
      };
    }),
  );
}

function inferTaskAndIntent(
  artifact: WorkArtifact,
  workflowId: string,
  normalized: NormalizedPrompt,
): { taskCategory: TaskCategory; intentCategory: IntentCategory } {
  const artifactDefinition = artifactRegistry.find((definition) => definition.value === artifact);
  const workflow = workflows.find((item) => item.id === workflowId);

  if (["bug", "error", "fix", "debug", "crash"].some((signal) => signalMatches(normalized, signal))) {
    return { taskCategory: "engineering", intentCategory: "debugging" };
  }

  if (artifactDefinition?.taskCategory && artifactDefinition.intentCategory) {
    return {
      taskCategory: artifactDefinition.taskCategory,
      intentCategory: artifactDefinition.intentCategory,
    };
  }

  return {
    taskCategory: workflow?.taskCategory ?? "general",
    intentCategory: workflow?.intentCategory ?? "planning",
  };
}

function inferSourceMode(normalized: NormalizedPrompt): SourceMode {
  if (["uploaded", "attached", "file", "pdf", "doc"].some((signal) => signalMatches(normalized, signal))) {
    return "user_uploaded";
  }

  if (["web search", "browse", "internet", "look up", "current"].some((signal) => signalMatches(normalized, signal))) {
    return "web_search";
  }

  if (
    [
      "latest",
      "recent",
      "source",
      "sources",
      "citation",
      "citations",
      "data",
      "evidence",
      "pricing",
      "market",
      "competitor",
      "competitors",
    ].some((signal) => signalMatches(normalized, signal))
  ) {
    return "source_needed_only";
  }

  return "none";
}

function inferRiskLevel(normalized: NormalizedPrompt): RiskLevel {
  if (
    ["system prompt", "api key", "secret", "password", "jailbreak", "ignore previous", "developer message"].some(
      (signal) => signalMatches(normalized, signal),
    )
  ) {
    return "restricted";
  }

  if (["legal", "medical", "finance", "financial", "security", "compliance", "regulated"].some((signal) => signalMatches(normalized, signal))) {
    return "high";
  }

  if (["investor", "investors", "market", "pricing", "competitor", "competitors", "bug", "error"].some((signal) => signalMatches(normalized, signal))) {
    return "medium";
  }

  return "low";
}

function inferRoadmapDepth(normalized: NormalizedPrompt, riskLevel: RiskLevel, sourceMode: SourceMode, workflowId: string): RoadmapDepth {
  if (riskLevel === "restricted" || riskLevel === "high") return "L4";

  if (["quick", "simple", "short", "brief"].some((signal) => signalMatches(normalized, signal))) {
    return "L1";
  }

  if (
    sourceMode !== "none" ||
    ["competitor", "competitors", "investor", "investors", "multi-stakeholder", "market"].some((signal) => signalMatches(normalized, signal))
  ) {
    return "L3";
  }

  return workflows.find((workflow) => workflow.id === workflowId)?.defaultDepth ?? "L2";
}

function toConfidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.65) return "medium";
  return "low";
}

function calculateConfidence(workflowScore: number, artifactScore: number, roleScore: number, moduleScore: number) {
  if (workflowScore <= 0 && artifactScore <= 0 && roleScore <= 0 && moduleScore <= 0) {
    return 0.32;
  }

  const raw = 0.35 + Math.min(workflowScore, 120) / 170 + Math.min(artifactScore, 32) / 260 + Math.min(roleScore, 32) / 320;
  return Math.round(Math.min(raw, 0.96) * 100) / 100;
}

function buildRecommendedModules(workflowId: string, moduleCandidates: Array<Candidate<ModuleId>>, sourceMode: SourceMode, riskLevel: RiskLevel) {
  const workflow = workflows.find((item) => item.id === workflowId) ?? workflows[1];
  const detectedModules = moduleCandidates.map((candidate) => candidate.value);
  const moduleIds = [...workflow.defaultModuleIds, ...detectedModules];

  if (sourceMode !== "none") moduleIds.push("sources_required");
  if (riskLevel !== "low") moduleIds.push("risk_analysis");

  return unique(moduleIds).filter((moduleId) => moduleCatalog.some((module) => module.id === moduleId));
}

function buildReason(result: {
  role: WorkRole;
  artifact: WorkArtifact;
  workflowId: string;
  moduleIds: ModuleId[];
  sourceMode: SourceMode;
  confidenceBand: ConfidenceBand;
}) {
  const workflow = workflows.find((item) => item.id === result.workflowId);
  const modules = result.moduleIds.slice(0, 3).join(", ");
  const sourceNote = result.sourceMode === "none" ? "No external-source requirement was detected." : `Source mode is ${result.sourceMode}.`;

  if (result.confidenceBand === "low") {
    return "The prompt does not contain enough strong signals, so Work Mode selected a safe default and asks for clarification.";
  }

  return `Detected ${result.artifact} work for a ${result.role}. Recommended ${workflow?.label ?? result.workflowId} with ${modules}. ${sourceNote}`;
}

function buildQuestions(confidenceBand: ConfidenceBand, sourceMode: SourceMode, artifact: WorkArtifact) {
  const questions: string[] = [];

  if (confidenceBand === "low" || artifact === "Unknown") {
    questions.push("What artifact should the answer produce: PRD, PPT, code, research report, or another format?");
    questions.push("Who is the audience for the final answer?");
  }

  if (sourceMode !== "none") {
    questions.push("Should the answer rely only on user-provided sources, or should it mark claims that need external validation?");
  }

  return questions;
}

export function detectWorkModePrompt(prompt: string): DetectionResult & { normalized: NormalizedPrompt } {
  const normalized = normalizePrompt(prompt);
  const roleCandidates = scoreSignals(normalized, roleRegistry);
  const artifactCandidates = boostExplicitArtifactCandidates(normalized, scoreSignals(normalized, artifactRegistry));
  const moduleCandidates = scoreModules(normalized);

  const topRole = getTopCandidate<WorkRole>(roleCandidates, "Unknown");
  const topArtifact = getTopCandidate<WorkArtifact>(artifactCandidates, "Unknown");

  const prePick = inferTaskAndIntent(topArtifact.value, "generic_workflow", normalized);
  const workflowPick = pickWorkflow({
    detectedArtifact: topArtifact.value,
    detectedRole: topRole.value,
    taskCategory: prePick.taskCategory,
    moduleCandidates,
    normalized,
  });
  const finalTask = inferTaskAndIntent(topArtifact.value, workflowPick.selectedWorkflowId, normalized);
  const sourceMode = inferSourceMode(normalized);
  const riskLevel = inferRiskLevel(normalized);
  const roadmapDepth = inferRoadmapDepth(normalized, riskLevel, sourceMode, workflowPick.selectedWorkflowId);
  const selectedWorkflow = workflowPick.workflowCandidates.find((candidate) => candidate.value === workflowPick.selectedWorkflowId);
  const confidence = calculateConfidence(
    selectedWorkflow?.score ?? 0,
    topArtifact.score,
    topRole.score,
    moduleCandidates[0]?.score ?? 0,
  );
  const confidenceBand = toConfidenceBand(confidence);
  const recommendedModuleIds = buildRecommendedModules(workflowPick.selectedWorkflowId, moduleCandidates, sourceMode, riskLevel);
  const matchedSignals = unique([
    ...topRole.matchedSignals,
    ...topArtifact.matchedSignals,
    ...moduleCandidates.flatMap((candidate) => candidate.matchedSignals),
    ...(selectedWorkflow?.matchedSignals ?? []),
    ...normalized.sourceHints,
    ...normalized.riskHints,
  ]).slice(0, 20);

  return {
    normalized,
    detectedRole: topRole.value,
    detectedArtifact: topArtifact.value,
    taskCategory: finalTask.taskCategory,
    intentCategory: finalTask.intentCategory,
    confidence,
    confidenceBand,
    recommendedWorkflowId: workflowPick.selectedWorkflowId,
    recommendedSkillId: workflowPick.selectedSkillId,
    recommendedModuleIds,
    selectedModuleIds: recommendedModuleIds,
    sourceMode,
    roadmapDepth,
    riskLevel,
    reason: buildReason({
      role: topRole.value,
      artifact: topArtifact.value,
      workflowId: workflowPick.selectedWorkflowId,
      moduleIds: recommendedModuleIds,
      sourceMode,
      confidenceBand,
    }),
    matchedSignals,
    alternatives: workflowPick.alternatives,
    questionsForUser: buildQuestions(confidenceBand, sourceMode, topArtifact.value),
    candidates: {
      roles: roleCandidates,
      artifacts: artifactCandidates,
      modules: moduleCandidates,
      workflows: workflowPick.workflowCandidates,
    },
  };
}
