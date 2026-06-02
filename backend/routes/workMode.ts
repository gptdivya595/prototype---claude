import { Router } from "express";
import { env, hasOpenAiKey } from "../env";
import { demoTokenGuard } from "../middleware/demoToken";
import {
  AnalyzeRequestSchema,
  ApproveWorkPlanRequestSchema,
  GenerateAnswerRequestSchema,
} from "../schemas/workModeSchemas";
import { detectWorkModePrompt } from "../services/deterministicDetector";
import { getAllCircuitStates } from "../services/openai/circuitBreaker";
import { getLlmErrorCode } from "../services/openai/llmErrors";
import { classifyPromptWithLlm } from "../services/openai/llmClassifier";
import { reconcileLlmClassification } from "../services/openai/llmReconciler";
import { getSafeModelConfig } from "../services/openai/modelRouter";
import { createWorkPlanRecordFromRequest } from "../services/workPlanCreator";
import {
  approveWorkPlanRecord,
  generateApprovedWorkPlanAnswer,
  patchWorkPlanRecord,
  requireWorkPlan,
} from "../services/workPlanLifecycle";
import {
  getAnalysisCount,
  getGeneratedOutputCount,
  getWorkPlanCount,
  saveAnalysis,
} from "../store/memoryStore";
import { moduleCatalog } from "../templates/moduleCatalog";
import {
  PLANNED_WORKFLOW_IDS,
  roadmapDepthLevels,
  riskLevelValues,
  sourceModeValues,
  workArtifacts,
  workRoles,
} from "../templates/registries";
import { skillCatalog } from "../templates/skillCatalog";
import { workflows } from "../templates/workflows";
import type { AnalysisRecord, LlmCallMetadata } from "../types/workMode";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

export const workModeRouter = Router();

const MAX_PROMPT_LENGTH = 8000;

function createAnalysisId() {
  return `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

workModeRouter.use(demoTokenGuard);

workModeRouter.get("/health", (_req, res) => {
  return sendSuccess(res, {
    status: "healthy",
    namespace: "work-mode",
    implementedPhase: 12,
    availableRoutes: [
      "/api/work-mode/health",
      "/api/work-mode/skills",
      "/api/work-mode/analyze",
      "/api/work-mode/work-plans",
      "/api/work-mode/work-plans/:id",
      "PATCH /api/work-mode/work-plans/:id",
      "POST /api/work-mode/work-plans/:id/approve",
      "POST /api/work-mode/work-plans/:id/generate",
    ],
    analysisCount: getAnalysisCount(),
    workPlanCount: getWorkPlanCount(),
    generatedOutputCount: getGeneratedOutputCount(),
    openAiConfigured: hasOpenAiKey,
    models: getSafeModelConfig(),
    circuits: getAllCircuitStates(),
    features: {
      llmClassifier: env.USE_LLM_CLASSIFIER,
      llmWorkPlan: env.USE_LLM_WORK_PLAN,
      llmAnswer: env.USE_LLM_ANSWER,
      sseStreaming: false,
      webSocket: false,
      persistence: "memory",
      durablePersistence: false,
    },
    llmFlags: {
      classifier: env.USE_LLM_CLASSIFIER,
      workPlan: env.USE_LLM_WORK_PLAN,
      answer: env.USE_LLM_ANSWER,
    },
  });
});

workModeRouter.get("/skills", (_req, res) => {
  return sendSuccess(res, {
    skills: skillCatalog,
    workflows,
    modules: moduleCatalog,
    roles: workRoles,
    artifacts: workArtifacts,
    sourceModes: sourceModeValues,
    riskLevels: riskLevelValues,
    roadmapDepthLevels,
    plannedWorkflowIds: PLANNED_WORKFLOW_IDS,
    transport: {
      mode: "http",
      webSocket: false,
      sseStreaming: false,
    },
  });
});

workModeRouter.post("/analyze", async (req, res, next) => {
  try {
    const body = AnalyzeRequestSchema.parse(req.body);
    const prompt = body.prompt.trim();

    if (!prompt) {
      throw new AppError(400, "validation_error", "Prompt is required.");
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new AppError(400, "prompt_too_long", `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`, {
        maxLength: MAX_PROMPT_LENGTH,
        actualLength: prompt.length,
      });
    }

    if (body.mode !== "work") {
      throw new AppError(400, "unsupported_mode", "Only work mode is supported by the Phase 10 analyzer.", {
        supportedModes: ["work"],
      });
    }

    const detection = detectWorkModePrompt(prompt);
    const { normalized, ...deterministicAnalysis } = detection;
    let analysis = deterministicAnalysis;
    let classifierMeta: LlmCallMetadata = {
      attempted: false,
      provider: "deterministic",
      fallbackUsed: false,
    };

    if (env.USE_LLM_CLASSIFIER) {
      classifierMeta = {
        attempted: true,
        provider: "fallback",
        fallbackUsed: true,
        fallbackReason: "not_attempted",
      };

      try {
        const llmResult = await classifyPromptWithLlm({
          requestId: res.locals.requestId,
          prompt,
          deterministic: deterministicAnalysis,
        });
        analysis = reconcileLlmClassification({
          deterministic: deterministicAnalysis,
          normalized,
          llm: llmResult.classification,
        });
        classifierMeta = {
          attempted: true,
          provider: "openai",
          model: llmResult.model,
          latencyMs: llmResult.latencyMs,
          fallbackUsed: false,
        };
      } catch (error) {
        const fallbackReason = getLlmErrorCode(error);
        analysis = reconcileLlmClassification({
          deterministic: deterministicAnalysis,
          normalized,
          llm: null,
          fallbackReason,
        });
        classifierMeta = {
          attempted: true,
          provider: "fallback",
          fallbackUsed: true,
          fallbackReason,
        };
      }
    }

    const record: AnalysisRecord = {
      ...analysis,
      analysisId: createAnalysisId(),
      conversationId: body.conversationId,
      mode: "work",
      prompt,
      normalized: {
        trimmedText: normalized.trimmedText,
        lowerText: normalized.lowerText,
        tokens: normalized.tokens,
        phrases: normalized.phrases,
        explicitArtifactHints: normalized.explicitArtifactHints,
        audienceHints: normalized.audienceHints,
        entityHints: normalized.entityHints,
        sourceHints: normalized.sourceHints,
        riskHints: normalized.riskHints,
        promptLength: normalized.promptLength,
      },
      llm: {
        classifier: classifierMeta,
      },
      createdAt: new Date().toISOString(),
    };

    saveAnalysis(record);

    return sendSuccess(res, {
      analysisId: record.analysisId,
      conversationId: record.conversationId,
      mode: record.mode,
      detectedRole: record.detectedRole,
      detectedArtifact: record.detectedArtifact,
      taskCategory: record.taskCategory,
      intentCategory: record.intentCategory,
      confidence: record.confidence,
      confidenceBand: record.confidenceBand,
      recommendedWorkflowId: record.recommendedWorkflowId,
      recommendedSkillId: record.recommendedSkillId,
      recommendedModuleIds: record.recommendedModuleIds,
      selectedModuleIds: record.selectedModuleIds,
      sourceMode: record.sourceMode,
      roadmapDepth: record.roadmapDepth,
      riskLevel: record.riskLevel,
      reason: record.reason,
      matchedSignals: record.matchedSignals,
      alternatives: record.alternatives,
      questionsForUser: record.questionsForUser,
      candidates: record.candidates,
      llm: record.llm,
      createdAt: record.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

workModeRouter.post("/work-plans", async (req, res, next) => {
  try {
    const record = await createWorkPlanRecordFromRequest(req.body, {
      requestId: res.locals.requestId,
    });
    return sendSuccess(res, record);
  } catch (error) {
    next(error);
  }
});

workModeRouter.get("/work-plans/:id", (req, res, next) => {
  try {
    const record = requireWorkPlan(req.params.id);

    return sendSuccess(res, record);
  } catch (error) {
    next(error);
  }
});

workModeRouter.patch("/work-plans/:id", (req, res, next) => {
  try {
    const record = patchWorkPlanRecord({
      workPlanId: req.params.id,
      rawBody: req.body,
    });
    return sendSuccess(res, record);
  } catch (error) {
    next(error);
  }
});

workModeRouter.post("/work-plans/:id/approve", (req, res, next) => {
  try {
    const body = ApproveWorkPlanRequestSchema.parse(req.body);
    const record = approveWorkPlanRecord({
      workPlanId: req.params.id,
      version: body.version,
    });
    return sendSuccess(res, record);
  } catch (error) {
    next(error);
  }
});

workModeRouter.post("/work-plans/:id/generate", async (req, res, next) => {
  try {
    const body = GenerateAnswerRequestSchema.parse(req.body ?? {});
    const generatedOutput = await generateApprovedWorkPlanAnswer({
      workPlanId: req.params.id,
      version: body.version,
      requestId: res.locals.requestId,
      shouldCancelBeforePersist: () => req.aborted || res.destroyed,
    });

    if (!generatedOutput) {
      return;
    }

    return sendSuccess(res, generatedOutput);
  } catch (error) {
    next(error);
  }
});
