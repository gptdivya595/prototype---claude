import {
  GeneratedOutputSchema,
  UpdateWorkPlanRequestSchema,
  WorkPlanRecordSchema,
} from "../schemas/workModeSchemas";
import {
  getWorkPlan,
  saveGeneratedOutput,
  updateWorkPlan,
} from "../store/memoryStore";
import type { GeneratedOutput, WorkPlan, WorkPlanRecord } from "../types/workMode";
import { AppError } from "../utils/errors";
import { generateAnswerFromApprovedPlan } from "./answerGenerator";
import { validateAnswerAgainstApprovedPlan } from "./answerValidator";

function createAnswerId() {
  return `ans_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function cloneWorkPlan(plan: WorkPlan) {
  return JSON.parse(JSON.stringify(plan)) as WorkPlan;
}

export function requireWorkPlan(workPlanId: string) {
  const record = getWorkPlan(workPlanId);

  if (!record) {
    throw new AppError(404, "work_plan_not_found", `Work Plan not found: ${workPlanId}`);
  }

  return record;
}

export function assertCurrentVersion(record: WorkPlanRecord, version: number) {
  if (record.version !== version) {
    throw new AppError(409, "stale_work_plan_version", "Work Plan version is stale. Refresh before saving.", {
      expectedVersion: record.version,
      receivedVersion: version,
    });
  }
}

export function validatePlanForApproval(plan: WorkPlan) {
  const errors: string[] = [];

  if (!plan.objective.trim()) errors.push("Objective is required.");
  if (plan.sections.length === 0) errors.push("At least one section is required.");

  for (const section of plan.sections) {
    if (section.required && !section.title.trim()) {
      errors.push(`Required section is missing a title: ${section.id}`);
    }
    if (section.required && !section.instructions.trim()) {
      errors.push(`Required section is missing instructions: ${section.title || section.id}`);
    }
  }

  if (plan.validationCriteria.length === 0) {
    errors.push("At least one validation criterion is required.");
  }

  if (errors.length > 0) {
    throw new AppError(422, "invalid_work_plan", "Work Plan is not ready for approval.", { errors });
  }
}

export function patchWorkPlanRecord(input: {
  workPlanId: string;
  rawBody: unknown;
}) {
  const record = requireWorkPlan(input.workPlanId);
  const parsed = UpdateWorkPlanRequestSchema.safeParse(input.rawBody);

  if (!parsed.success) {
    throw new AppError(422, "invalid_work_plan", "Work Plan update payload is invalid.", parsed.error.flatten());
  }

  assertCurrentVersion(record, parsed.data.version);
  validatePlanForApproval(parsed.data.plan);

  const now = new Date().toISOString();
  const nextRecord: WorkPlanRecord = {
    ...record,
    status: "draft",
    version: record.version + 1,
    plan: parsed.data.plan,
    approvedPlan: null,
    approvedAt: undefined,
    updatedAt: now,
  };

  WorkPlanRecordSchema.parse(nextRecord);
  return updateWorkPlan(nextRecord);
}

export function approveWorkPlanRecord(input: {
  workPlanId: string;
  version: number;
}) {
  const record = requireWorkPlan(input.workPlanId);

  assertCurrentVersion(record, input.version);

  if (record.status !== "draft") {
    throw new AppError(409, "work_plan_not_draft", "Only draft Work Plans can be approved.", {
      status: record.status,
    });
  }

  validatePlanForApproval(record.plan);

  const now = new Date().toISOString();
  const approvedPlan = cloneWorkPlan(record.plan);
  const nextRecord: WorkPlanRecord = {
    ...record,
    status: "approved",
    version: record.version + 1,
    plan: approvedPlan,
    approvedPlan,
    approvedAt: now,
    updatedAt: now,
  };

  WorkPlanRecordSchema.parse(nextRecord);
  return updateWorkPlan(nextRecord);
}

export async function generateApprovedWorkPlanAnswer(input: {
  workPlanId: string;
  version?: number;
  requestId: string;
  shouldCancelBeforePersist?: () => boolean;
}): Promise<GeneratedOutput | null> {
  const record = requireWorkPlan(input.workPlanId);

  if (input.version !== undefined) {
    assertCurrentVersion(record, input.version);
  }

  if ((record.status !== "approved" && record.status !== "generated") || !record.approvedPlan) {
    throw new AppError(409, "generate_before_approval", "Approve the Work Plan before generating an answer.", {
      status: record.status,
    });
  }

  const { answer, llm } = await generateAnswerFromApprovedPlan({
    requestId: input.requestId,
    approvedPlan: record.approvedPlan,
  });

  if (input.shouldCancelBeforePersist?.()) {
    return null;
  }

  const validation = validateAnswerAgainstApprovedPlan({
    approvedPlan: record.approvedPlan,
    answer,
  });
  const generatedOutput: GeneratedOutput = {
    answerId: createAnswerId(),
    workPlanId: record.workPlanId,
    generatedFromVersion: record.version,
    answer,
    validation,
    llm: {
      answer: llm,
    },
    createdAt: new Date().toISOString(),
  };

  GeneratedOutputSchema.parse(generatedOutput);
  saveGeneratedOutput(generatedOutput);

  const now = new Date().toISOString();
  const nextRecord: WorkPlanRecord = {
    ...record,
    status: "generated",
    generatedOutputIds: [...record.generatedOutputIds, generatedOutput.answerId],
    updatedAt: now,
  };

  WorkPlanRecordSchema.parse(nextRecord);
  updateWorkPlan(nextRecord);

  return generatedOutput;
}
