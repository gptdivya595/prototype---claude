import { WorkPlanSchema } from "../../schemas/workModeSchemas";
import { moduleCatalog } from "../../templates/moduleCatalog";
import { SOURCE_MODES, RISK_LEVELS } from "../../templates/registries";
import { workflows } from "../../templates/workflows";
import type {
  DetectionResult,
  ModuleId,
  NormalizedPrompt,
  SourceMode,
  RiskLevel,
  WorkPlan,
  WorkflowId,
  SkillId,
} from "../../types/workMode";
import type { LlmClassification, LlmGeneratedWorkPlan } from "./llmSchemas";

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function strictest<T extends string>(ordered: readonly T[], left: T, right: T) {
  return ordered.indexOf(left) >= ordered.indexOf(right) ? left : right;
}

function workflowFor(workflowId: WorkflowId) {
  return workflows.find((workflow) => workflow.id === workflowId);
}

function isWorkflowArtifactCompatible(workflowId: WorkflowId, artifact: DetectionResult["detectedArtifact"]) {
  return workflowFor(workflowId)?.supportedArtifacts.includes(artifact) ?? false;
}

function workflowSkill(workflowId: WorkflowId): SkillId {
  return workflowFor(workflowId)?.skillId ?? "general_workflow_planner";
}

function selectedModulesFor(workflowId: WorkflowId, deterministicModules: ModuleId[], llmModules: ModuleId[]) {
  const workflow = workflowFor(workflowId);
  return unique([...(workflow?.defaultModuleIds ?? []), ...deterministicModules, ...llmModules]).filter((moduleId) =>
    moduleCatalog.some((module) => module.id === moduleId),
  );
}

function combinedConfidence(deterministic: DetectionResult, llm: LlmClassification, workflowId: WorkflowId) {
  if (workflowId === deterministic.recommendedWorkflowId && workflowId === llm.recommendedWorkflowId) {
    return Math.round(Math.max(deterministic.confidence, llm.confidence) * 100) / 100;
  }

  return Math.round(Math.min(deterministic.confidence, llm.confidence, 0.74) * 100) / 100;
}

function confidenceBand(confidence: number) {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.65) return "medium";
  return "low";
}

export function reconcileLlmClassification(input: {
  deterministic: DetectionResult;
  normalized: NormalizedPrompt;
  llm: LlmClassification | null;
  fallbackReason?: string;
}): DetectionResult {
  if (!input.llm) {
    return {
      ...input.deterministic,
      reason: input.fallbackReason
        ? `${input.deterministic.reason} Classifier fallback: ${input.fallbackReason}.`
        : input.deterministic.reason,
    };
  }

  const deterministic = input.deterministic;
  const llm = input.llm;
  const hasExplicitArtifact = input.normalized.explicitArtifactHints.length > 0;
  const detectedArtifact = hasExplicitArtifact ? deterministic.detectedArtifact : llm.detectedArtifact;
  const detectedRole = llm.confidence >= 0.8 ? llm.detectedRole : deterministic.detectedRole;
  let workflowId = deterministic.recommendedWorkflowId;

  if (
    llm.recommendedWorkflowId === deterministic.recommendedWorkflowId ||
    (!hasExplicitArtifact && llm.confidence >= 0.8) ||
    (llm.confidence >= 0.9 && isWorkflowArtifactCompatible(llm.recommendedWorkflowId, detectedArtifact))
  ) {
    workflowId = llm.recommendedWorkflowId;
  }

  if (!isWorkflowArtifactCompatible(workflowId, detectedArtifact)) {
    workflowId = deterministic.recommendedWorkflowId;
  }

  const recommendedSkillId = workflowSkill(workflowId);
  const selectedModuleIds = selectedModulesFor(workflowId, deterministic.selectedModuleIds, llm.selectedModuleIds);
  const sourceMode = strictest(SOURCE_MODES, deterministic.sourceMode, llm.sourceMode);
  const riskLevel = strictest(RISK_LEVELS, deterministic.riskLevel, llm.riskLevel);
  const confidence = combinedConfidence(deterministic, llm, workflowId);

  return {
    ...deterministic,
    detectedRole,
    detectedArtifact,
    taskCategory: llm.taskCategory,
    intentCategory: llm.intentCategory,
    confidence,
    confidenceBand: confidenceBand(confidence),
    recommendedWorkflowId: workflowId,
    recommendedSkillId,
    recommendedModuleIds: selectedModuleIds,
    selectedModuleIds,
    sourceMode,
    roadmapDepth: llm.roadmapDepth,
    riskLevel,
    reason: llm.reason,
    matchedSignals: unique([...deterministic.matchedSignals, ...llm.matchedSignals]).slice(0, 24),
    questionsForUser: unique([...deterministic.questionsForUser, ...llm.questionsForUser]).slice(0, 8),
  };
}

export function sanitizeLlmWorkPlan(input: {
  llmPlan: LlmGeneratedWorkPlan;
  localPlan: WorkPlan;
  selectedModuleIds: ModuleId[];
  sourceMode: SourceMode;
}): WorkPlan {
  const moduleIds = new Set(input.selectedModuleIds);
  const knownModuleIds = new Set(moduleCatalog.map((module) => module.id));
  const sections = input.llmPlan.sections
    .map((section) => ({
      ...section,
      moduleId: section.moduleId && knownModuleIds.has(section.moduleId) ? section.moduleId : undefined,
      sourceRefs: section.sourceRefs ?? [],
    }))
    .filter((section, index, all) => all.findIndex((candidate) => candidate.id === section.id) === index);

  if (sections.length === 0 || input.llmPlan.validationCriteria.length === 0) {
    return input.localPlan;
  }

  const suggestions = moduleCatalog
    .filter((module) => {
      const workflow = workflowFor(input.localPlan.workflowId);
      return (
        input.selectedModuleIds.includes(module.id) ||
        workflow?.defaultModuleIds.includes(module.id) ||
        workflow?.optionalModuleIds.includes(module.id)
      );
    })
    .map((module) => ({
      id: module.id,
      label: module.label,
      description: module.description,
      selected: moduleIds.has(module.id),
    }));

  const candidate: WorkPlan = {
    ...input.llmPlan,
    prompt: input.localPlan.prompt,
    role: input.localPlan.role,
    artifact: input.localPlan.artifact,
    workflowId: input.localPlan.workflowId,
    skillId: input.localPlan.skillId,
    audience: input.llmPlan.audience ?? input.localPlan.audience,
    sourceMode: input.sourceMode,
    roadmapDepth: input.localPlan.roadmapDepth,
    riskLevel: input.localPlan.riskLevel,
    sections,
    suggestions,
    selectedModuleIds: input.selectedModuleIds,
    validationCriteria: input.llmPlan.validationCriteria.length > 0 ? input.llmPlan.validationCriteria : input.localPlan.validationCriteria,
  };

  const parsed = WorkPlanSchema.safeParse(candidate);
  return parsed.success ? parsed.data : input.localPlan;
}
