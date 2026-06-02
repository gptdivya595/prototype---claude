import { z } from "zod";
import {
  MODULE_IDS,
  ROADMAP_DEPTHS,
  RISK_LEVELS,
  SKILL_IDS,
  SOURCE_MODES,
  WORK_ARTIFACTS,
  WORK_ROLES,
  WORKFLOW_IDS,
} from "../templates/registries";

export const WorkRoleSchema = z.enum(WORK_ROLES);
export const WorkArtifactSchema = z.enum(WORK_ARTIFACTS);
export const WorkflowIdSchema = z.enum(WORKFLOW_IDS);
export const SkillIdSchema = z.enum(SKILL_IDS);
export const ModuleIdSchema = z.enum(MODULE_IDS);
export const SourceModeSchema = z.enum(SOURCE_MODES);
export const RiskLevelSchema = z.enum(RISK_LEVELS);
export const RoadmapDepthSchema = z.enum(ROADMAP_DEPTHS);

export const AnalyzeRequestSchema = z.object({
  conversationId: z.string().trim().min(1).max(120).default("local"),
  mode: z.string().trim().default("work"),
  prompt: z.string(),
});

export const CandidateSchema = z.object({
  value: z.string(),
  score: z.number(),
  matchedSignals: z.array(z.string()),
});

export const PromptAnalysisSchema = z.object({
  analysisId: z.string().min(1),
  conversationId: z.string().min(1),
  mode: z.literal("work"),
  prompt: z.string().min(1),
  detectedRole: WorkRoleSchema,
  detectedArtifact: WorkArtifactSchema,
  recommendedWorkflowId: WorkflowIdSchema,
  recommendedSkillId: SkillIdSchema,
  recommendedModuleIds: z.array(ModuleIdSchema),
  selectedModuleIds: z.array(ModuleIdSchema),
  sourceMode: SourceModeSchema,
  roadmapDepth: RoadmapDepthSchema,
  riskLevel: RiskLevelSchema,
  llm: z
    .object({
      classifier: z
        .object({
          attempted: z.boolean(),
          provider: z.enum(["deterministic", "local", "openai", "fallback"]),
          model: z.string().optional(),
          latencyMs: z.number().optional(),
          fallbackUsed: z.boolean(),
          fallbackReason: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
}).passthrough();

export const CreateWorkPlanRequestSchema = z.object({
  analysisId: z.string().trim().min(1),
  roleOverride: z.string().trim().nullable().optional(),
  artifactOverride: z.string().trim().nullable().optional(),
  workflowOverride: z.string().trim().nullable().optional(),
  skillOverride: z.string().trim().nullable().optional(),
  selectedModuleIds: z.array(z.string().trim()).default([]),
  sourceMode: z.string().trim().nullable().optional(),
});

export const WorkPlanSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  instructions: z.string().min(1),
  required: z.boolean(),
  moduleId: ModuleIdSchema.optional(),
  sourceRefs: z.array(z.string()),
});

export const WorkPlanSuggestionSchema = z.object({
  id: ModuleIdSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  selected: z.boolean(),
});

export const WorkPlanSchema = z.object({
  prompt: z.string().min(1),
  role: WorkRoleSchema,
  artifact: WorkArtifactSchema,
  workflowId: WorkflowIdSchema,
  skillId: SkillIdSchema,
  objective: z.string().min(1),
  audience: z.string().min(1).optional(),
  sourceMode: SourceModeSchema,
  roadmapDepth: RoadmapDepthSchema,
  riskLevel: RiskLevelSchema,
  assumptions: z.array(z.string().min(1)),
  missingContext: z.array(z.string().min(1)),
  sections: z.array(WorkPlanSectionSchema).min(1),
  suggestions: z.array(WorkPlanSuggestionSchema),
  validationCriteria: z.array(z.string().min(1)).min(1),
  selectedModuleIds: z.array(ModuleIdSchema),
});

export const UpdateWorkPlanRequestSchema = z.object({
  version: z.number().int().positive(),
  plan: WorkPlanSchema,
});

export const ApproveWorkPlanRequestSchema = z.object({
  version: z.number().int().positive(),
});

export const GenerateAnswerRequestSchema = z.object({
  version: z.number().int().positive().optional(),
});

export const LlmCallMetadataSchema = z.object({
  attempted: z.boolean(),
  provider: z.enum(["deterministic", "local", "openai", "fallback"]),
  model: z.string().optional(),
  latencyMs: z.number().optional(),
  fallbackUsed: z.boolean(),
  fallbackReason: z.string().optional(),
});

export const WorkPlanRecordSchema = z.object({
  workPlanId: z.string().min(1),
  conversationId: z.string().min(1),
  analysisId: z.string().min(1),
  status: z.enum(["draft", "approved", "generated"]),
  version: z.number().int().positive(),
  plan: WorkPlanSchema,
  approvedPlan: WorkPlanSchema.nullable(),
  approvedAt: z.string().datetime().optional(),
  generatedOutputIds: z.array(z.string().min(1)),
  llm: z
    .object({
      workPlan: LlmCallMetadataSchema.optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ValidationResultSchema = z.object({
  matchesApprovedPlan: z.boolean(),
  missingSections: z.array(z.string()),
  unsupportedClaims: z.array(z.string()),
  qualityScore: z.number().min(0).max(100),
  recommendedFixes: z.array(z.string()),
  sourceNeededClaims: z.array(z.string()),
  passedChecks: z.array(z.string()),
});

export const GeneratedOutputSchema = z.object({
  answerId: z.string().min(1),
  workPlanId: z.string().min(1),
  generatedFromVersion: z.number().int().positive(),
  answer: z.string().min(1),
  validation: ValidationResultSchema,
  llm: z
    .object({
      answer: LlmCallMetadataSchema.optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
});
