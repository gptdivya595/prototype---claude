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
} from "../../templates/registries";
import { WorkPlanSchema } from "../../schemas/workModeSchemas";

const TASK_CATEGORIES = [
  "presentation",
  "product",
  "business",
  "engineering",
  "frontend",
  "backend",
  "technical_design",
  "research",
  "analysis",
  "data",
  "career",
  "general",
] as const;

const INTENT_CATEGORIES = [
  "planning",
  "drafting",
  "debugging",
  "review",
  "research",
  "analysis",
  "decision_support",
  "implementation",
  "coaching",
] as const;

function enumSchema(values: readonly string[]) {
  return {
    type: "string",
    enum: [...values],
  };
}

function stringArray(maxItems = 12) {
  return {
    type: "array",
    items: { type: "string" },
    maxItems,
  };
}

function enumArray(values: readonly string[], maxItems = 12) {
  return {
    type: "array",
    items: enumSchema(values),
    maxItems,
  };
}

export const LlmClassificationSchema = z.object({
  detectedRole: z.enum(WORK_ROLES),
  detectedArtifact: z.enum(WORK_ARTIFACTS),
  taskCategory: z.enum(TASK_CATEGORIES),
  intentCategory: z.enum(INTENT_CATEGORIES),
  audience: z.string().nullable(),
  primaryEntity: z.string().nullable(),
  recommendedWorkflowId: z.enum(WORKFLOW_IDS),
  recommendedSkillId: z.enum(SKILL_IDS),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(600),
  selectedModuleIds: z.array(z.enum(MODULE_IDS)).max(12),
  sourceMode: z.enum(SOURCE_MODES),
  roadmapDepth: z.enum(ROADMAP_DEPTHS),
  riskLevel: z.enum(RISK_LEVELS),
  questionsForUser: z.array(z.string().min(1)).max(6),
  matchedSignals: z.array(z.string().min(1)).max(20),
});

export type LlmClassification = z.infer<typeof LlmClassificationSchema>;

const LlmWorkPlanSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  instructions: z.string().min(1),
  required: z.boolean(),
  moduleId: z.enum(MODULE_IDS).nullable(),
  sourceRefs: z.array(z.string()),
});

export const LlmGeneratedWorkPlanSchema = WorkPlanSchema.extend({
  audience: z.string().min(1).nullable().optional(),
  sections: z.array(LlmWorkPlanSectionSchema).min(1),
});

export type LlmGeneratedWorkPlan = z.infer<typeof LlmGeneratedWorkPlanSchema>;

export const llmClassificationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "detectedRole",
    "detectedArtifact",
    "taskCategory",
    "intentCategory",
    "audience",
    "primaryEntity",
    "recommendedWorkflowId",
    "recommendedSkillId",
    "confidence",
    "reason",
    "selectedModuleIds",
    "sourceMode",
    "roadmapDepth",
    "riskLevel",
    "questionsForUser",
    "matchedSignals",
  ],
  properties: {
    detectedRole: enumSchema(WORK_ROLES),
    detectedArtifact: enumSchema(WORK_ARTIFACTS),
    taskCategory: enumSchema(TASK_CATEGORIES),
    intentCategory: enumSchema(INTENT_CATEGORIES),
    audience: { type: ["string", "null"] },
    primaryEntity: { type: ["string", "null"] },
    recommendedWorkflowId: enumSchema(WORKFLOW_IDS),
    recommendedSkillId: enumSchema(SKILL_IDS),
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string", maxLength: 600 },
    selectedModuleIds: enumArray(MODULE_IDS, 12),
    sourceMode: enumSchema(SOURCE_MODES),
    roadmapDepth: enumSchema(ROADMAP_DEPTHS),
    riskLevel: enumSchema(RISK_LEVELS),
    questionsForUser: stringArray(6),
    matchedSignals: stringArray(20),
  },
};

export const llmWorkPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "prompt",
    "role",
    "artifact",
    "workflowId",
    "skillId",
    "objective",
    "audience",
    "sourceMode",
    "roadmapDepth",
    "riskLevel",
    "assumptions",
    "missingContext",
    "sections",
    "suggestions",
    "validationCriteria",
    "selectedModuleIds",
  ],
  properties: {
    prompt: { type: "string" },
    role: enumSchema(WORK_ROLES),
    artifact: enumSchema(WORK_ARTIFACTS),
    workflowId: enumSchema(WORKFLOW_IDS),
    skillId: enumSchema(SKILL_IDS),
    objective: { type: "string" },
    audience: { type: ["string", "null"] },
    sourceMode: enumSchema(SOURCE_MODES),
    roadmapDepth: enumSchema(ROADMAP_DEPTHS),
    riskLevel: enumSchema(RISK_LEVELS),
    assumptions: stringArray(12),
    missingContext: stringArray(12),
    sections: {
      type: "array",
      minItems: 1,
      maxItems: 24,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "instructions", "required", "moduleId", "sourceRefs"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          instructions: { type: "string" },
          required: { type: "boolean" },
          moduleId: { anyOf: [enumSchema(MODULE_IDS), { type: "null" }] },
          sourceRefs: stringArray(12),
        },
      },
    },
    suggestions: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "description", "selected"],
        properties: {
          id: enumSchema(MODULE_IDS),
          label: { type: "string" },
          description: { type: "string" },
          selected: { type: "boolean" },
        },
      },
    },
    validationCriteria: stringArray(12),
    selectedModuleIds: enumArray(MODULE_IDS, 16),
  },
};
