import assert from "node:assert/strict";
import { env } from "../env";
import { detectWorkModePrompt } from "../services/deterministicDetector";
import { createWorkPlanRecordFromRequest } from "../services/workPlanCreator";
import {
  approveWorkPlanRecord,
  generateApprovedWorkPlanAnswer,
  patchWorkPlanRecord,
} from "../services/workPlanLifecycle";
import { saveAnalysis } from "../store/memoryStore";
import type { AnalysisRecord } from "../types/workMode";
import { AppError } from "../utils/errors";

function saveAnalysisFromPrompt(prompt: string, conversationId = "phase-11-fixture") {
  const detection = detectWorkModePrompt(prompt);
  const { normalized, ...analysis } = detection;
  const record: AnalysisRecord = {
    ...analysis,
    analysisId: `analysis_lifecycle_${Math.random().toString(36).slice(2, 10)}`,
    conversationId,
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
    createdAt: new Date().toISOString(),
  };

  saveAnalysis(record);
  return record;
}

async function expectAppError(fn: () => Promise<unknown> | unknown, code: string, statusCode: number) {
  await assert.rejects(
    async () => fn(),
    (error) => error instanceof AppError && error.code === code && error.statusCode === statusCode,
    `Expected ${code}`,
  );
}

const originalFlags = {
  classifier: env.USE_LLM_CLASSIFIER,
  workPlan: env.USE_LLM_WORK_PLAN,
  answer: env.USE_LLM_ANSWER,
};

env.USE_LLM_CLASSIFIER = false;
env.USE_LLM_WORK_PLAN = false;
env.USE_LLM_ANSWER = false;

try {
  const analysis = saveAnalysisFromPrompt(
    "Make a PPT on competitors of Perplexity for investors with source-needed market claims.",
  );
  const draft = await createWorkPlanRecordFromRequest({
    analysisId: analysis.analysisId,
    selectedModuleIds: ["competitor_analysis", "investor_framing", "sources_required"],
    sourceMode: "source_needed_only",
  });

  assert.equal(draft.status, "draft");
  assert.equal(draft.version, 1);
  assert.deepEqual(draft.generatedOutputIds, []);

  await expectAppError(
    () =>
      generateApprovedWorkPlanAnswer({
        workPlanId: draft.workPlanId,
        version: draft.version,
        requestId: "req_lifecycle_generate_draft",
      }),
    "generate_before_approval",
    409,
  );

  await expectAppError(
    () =>
      patchWorkPlanRecord({
        workPlanId: draft.workPlanId,
        rawBody: {
          version: draft.version + 10,
          plan: draft.plan,
        },
      }),
    "stale_work_plan_version",
    409,
  );

  await expectAppError(
    () =>
      patchWorkPlanRecord({
        workPlanId: draft.workPlanId,
        rawBody: {
          version: draft.version,
          plan: {
            ...draft.plan,
            objective: "",
          },
        },
      }),
    "invalid_work_plan",
    422,
  );

  const patched = patchWorkPlanRecord({
    workPlanId: draft.workPlanId,
    rawBody: {
      version: draft.version,
      plan: {
        ...draft.plan,
        objective: `${draft.plan.objective} Include a crisp recommendation slide.`,
      },
    },
  });
  assert.equal(patched.status, "draft");
  assert.equal(patched.version, draft.version + 1);

  const approved = approveWorkPlanRecord({
    workPlanId: patched.workPlanId,
    version: patched.version,
  });
  assert.equal(approved.status, "approved");
  assert.ok(approved.approvedPlan);
  assert.equal(approved.version, patched.version + 1);

  const editedAfterApproval = patchWorkPlanRecord({
    workPlanId: approved.workPlanId,
    rawBody: {
      version: approved.version,
      plan: {
        ...approved.plan,
        objective: `${approved.plan.objective} Add appendix notes.`,
      },
    },
  });
  assert.equal(editedAfterApproval.status, "draft");
  assert.equal(editedAfterApproval.approvedPlan, null);
  assert.equal(editedAfterApproval.approvedAt, undefined);

  const reapproved = approveWorkPlanRecord({
    workPlanId: editedAfterApproval.workPlanId,
    version: editedAfterApproval.version,
  });

  const generated = await generateApprovedWorkPlanAnswer({
    workPlanId: reapproved.workPlanId,
    version: reapproved.version,
    requestId: "req_lifecycle_generate",
  });

  assert.ok(generated);
  assert.equal(generated.workPlanId, reapproved.workPlanId);
  assert.equal(generated.generatedFromVersion, reapproved.version);
  assert.ok(generated.answer.includes("[source-needed]"));
  assert.ok(generated.validation.matchesApprovedPlan);
  assert.ok(generated.validation.qualityScore >= 70);
  assert.ok(generated.validation.sourceNeededClaims.length > 0);
} finally {
  env.USE_LLM_CLASSIFIER = originalFlags.classifier;
  env.USE_LLM_WORK_PLAN = originalFlags.workPlan;
  env.USE_LLM_ANSWER = originalFlags.answer;
}

console.log("Phase 11 lifecycle fixtures passed.");
