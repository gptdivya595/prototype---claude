import { CreateWorkPlanRequestSchema, WorkPlanRecordSchema } from "../schemas/workModeSchemas";
import { env } from "../env";
import { getLlmErrorCode } from "./openai/llmErrors";
import { generateWorkPlanWithLlm, getRequiredWorkflowTemplate } from "./openai/llmWorkPlanGenerator";
import { getAnalysis, saveWorkPlan } from "../store/memoryStore";
import {
  MODULE_IDS,
  SKILL_IDS,
  SOURCE_MODES,
  WORK_ARTIFACTS,
  WORK_ROLES,
  WORKFLOW_IDS,
} from "../templates/registries";
import { workflows } from "../templates/workflows";
import type { LlmCallMetadata, ModuleId, SkillId, SourceMode, WorkArtifact, WorkflowId, WorkPlanRecord, WorkRole } from "../types/workMode";
import { AppError } from "../utils/errors";
import { buildWorkPlanFromTemplate } from "./workPlanBuilder";

function createWorkPlanId() {
  return `wp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return values.includes(value as T);
}

function resolveRole(value: string | null | undefined): WorkRole | null {
  if (value == null || value === "") return null;
  if (!isOneOf(WORK_ROLES, value)) {
    throw new AppError(400, "validation_error", `Unknown role: ${value}`, { allowedValues: WORK_ROLES });
  }
  return value;
}

function resolveArtifact(value: string | null | undefined): WorkArtifact | null {
  if (value == null || value === "") return null;
  if (!isOneOf(WORK_ARTIFACTS, value)) {
    throw new AppError(400, "validation_error", `Unknown artifact: ${value}`, { allowedValues: WORK_ARTIFACTS });
  }
  return value;
}

function resolveWorkflow(value: string | null | undefined): WorkflowId | null {
  if (value == null || value === "") return null;
  if (!isOneOf(WORKFLOW_IDS, value)) {
    throw new AppError(400, "unknown_workflow_id", `Unknown workflow id: ${value}`, { allowedValues: WORKFLOW_IDS });
  }
  return value;
}

function resolveSkill(value: string | null | undefined): SkillId | null {
  if (value == null || value === "") return null;
  if (!isOneOf(SKILL_IDS, value)) {
    throw new AppError(400, "validation_error", `Unknown skill id: ${value}`, { allowedValues: SKILL_IDS });
  }
  return value;
}

function resolveSourceMode(value: string | null | undefined): SourceMode | null {
  if (value == null || value === "") return null;
  if (!isOneOf(SOURCE_MODES, value)) {
    throw new AppError(400, "validation_error", `Unknown source mode: ${value}`, { allowedValues: SOURCE_MODES });
  }
  return value;
}

function resolveModuleIds(values: string[]): ModuleId[] {
  return values.map((value) => {
    if (!isOneOf(MODULE_IDS, value)) {
      throw new AppError(400, "unknown_module_id", `Unknown module id: ${value}`, { allowedValues: MODULE_IDS });
    }

    return value;
  });
}

function hasSelectedModuleIds(rawBody: unknown) {
  return typeof rawBody === "object" && rawBody !== null && Object.prototype.hasOwnProperty.call(rawBody, "selectedModuleIds");
}

export async function createWorkPlanRecordFromRequest(
  rawBody: unknown,
  options: { requestId?: string } = {},
): Promise<WorkPlanRecord> {
  const body = CreateWorkPlanRequestSchema.parse(rawBody);
  const analysis = getAnalysis(body.analysisId);

  if (!analysis) {
    throw new AppError(404, "analysis_not_found", `Analysis not found: ${body.analysisId}`);
  }

  const role = resolveRole(body.roleOverride) ?? analysis.detectedRole;
  const artifact = resolveArtifact(body.artifactOverride) ?? analysis.detectedArtifact;
  const workflowId = resolveWorkflow(body.workflowOverride) ?? analysis.recommendedWorkflowId;
  const workflow = workflows.find((item) => item.id === workflowId);

  if (!workflow) {
    throw new AppError(400, "unknown_workflow_id", `Unknown workflow id: ${workflowId}`, { allowedValues: WORKFLOW_IDS });
  }

  const skillOverride = resolveSkill(body.skillOverride);
  const skillId = skillOverride ?? workflow.skillId;

  if (skillId !== workflow.skillId) {
    throw new AppError(400, "skill_workflow_mismatch", "Skill override does not match the selected workflow.", {
      workflowId,
      expectedSkillId: workflow.skillId,
      receivedSkillId: skillId,
    });
  }

  const sourceMode = resolveSourceMode(body.sourceMode) ?? analysis.sourceMode;
  const requestSelectedModules = hasSelectedModuleIds(rawBody) ? body.selectedModuleIds : analysis.selectedModuleIds;
  const selectedModuleIds = resolveModuleIds(requestSelectedModules);
  const localPlan = buildWorkPlanFromTemplate({
    analysis,
    role,
    artifact,
    workflowId,
    skillId,
    selectedModuleIds,
    sourceMode,
  });
  let plan = localPlan;
  let workPlanMeta: LlmCallMetadata = {
    attempted: false,
    provider: "local",
    fallbackUsed: false,
  };

  if (env.USE_LLM_WORK_PLAN) {
    workPlanMeta = {
      attempted: true,
      provider: "fallback",
      fallbackUsed: true,
      fallbackReason: "not_attempted",
    };

    try {
      const llmPlan = await generateWorkPlanWithLlm({
        requestId: options.requestId ?? "req_local",
        analysis,
        localPlan,
        workflowTemplate: getRequiredWorkflowTemplate(workflowId),
        selectedModuleIds: localPlan.selectedModuleIds,
        sourceMode,
      });
      plan = llmPlan.plan;
      workPlanMeta = {
        attempted: true,
        provider: "openai",
        model: llmPlan.model,
        latencyMs: llmPlan.latencyMs,
        fallbackUsed: false,
      };
    } catch (error) {
      workPlanMeta = {
        attempted: true,
        provider: "fallback",
        fallbackUsed: true,
        fallbackReason: getLlmErrorCode(error),
      };
      plan = localPlan;
    }
  }

  const now = new Date().toISOString();
  const record: WorkPlanRecord = {
    workPlanId: createWorkPlanId(),
    conversationId: analysis.conversationId,
    analysisId: analysis.analysisId,
    status: "draft",
    version: 1,
    plan,
    approvedPlan: null,
    generatedOutputIds: [],
    llm: {
      workPlan: workPlanMeta,
    },
    createdAt: now,
    updatedAt: now,
  };

  WorkPlanRecordSchema.parse(record);
  saveWorkPlan(record);

  return record;
}
