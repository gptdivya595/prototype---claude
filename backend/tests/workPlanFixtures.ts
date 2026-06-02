import assert from "node:assert/strict";
import { detectWorkModePrompt } from "../services/deterministicDetector";
import { createWorkPlanRecordFromRequest } from "../services/workPlanCreator";
import { saveAnalysis } from "../store/memoryStore";
import type { AnalysisRecord } from "../types/workMode";
import { AppError } from "../utils/errors";

function saveAnalysisFromPrompt(prompt: string, conversationId = "fixture") {
  const detection = detectWorkModePrompt(prompt);
  const { normalized, ...analysis } = detection;
  const record: AnalysisRecord = {
    ...analysis,
    analysisId: `analysis_fixture_${Math.random().toString(36).slice(2, 10)}`,
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

async function expectAppError(fn: () => Promise<unknown>, code: string, statusCode: number) {
  await assert.rejects(
    fn,
    (error) => error instanceof AppError && error.code === code && error.statusCode === statusCode,
    `Expected ${code}`,
  );
}

const deckAnalysis = saveAnalysisFromPrompt("Make a PPT on competitors of Perplexity for investors.");
const deckPlan = await createWorkPlanRecordFromRequest({
  analysisId: deckAnalysis.analysisId,
  selectedModuleIds: ["competitor_analysis", "investor_framing", "sources_required"],
  sourceMode: "source_needed_only",
});
assert.equal(deckPlan.status, "draft");
assert.equal(deckPlan.version, 1);
assert.equal(deckPlan.approvedPlan, null);
assert.equal(deckPlan.plan.workflowId, "slide_deck");
assert.equal(deckPlan.plan.skillId, "investor_deck_builder");
assert.ok(deckPlan.plan.sections.length > 0);
assert.ok(deckPlan.plan.validationCriteria.length > 0);
assert.ok(deckPlan.plan.selectedModuleIds.includes("assumptions"));
assert.ok(deckPlan.plan.selectedModuleIds.includes("competitor_analysis"));

const prdAnalysis = saveAnalysisFromPrompt("Create a PRD for onboarding with user stories, personas, metrics, and launch criteria.");
const prdPlan = await createWorkPlanRecordFromRequest({
  analysisId: prdAnalysis.analysisId,
  selectedModuleIds: ["user_personas", "metrics", "implementation_plan"],
});
assert.equal(prdPlan.plan.workflowId, "prd_generation");
assert.equal(prdPlan.plan.skillId, "prd_builder");
assert.ok(prdPlan.plan.sections.some((section) => section.id === "requirements"));

const bugAnalysis = saveAnalysisFromPrompt("Fix the API bug causing 500 errors and add regression tests.");
const bugPlan = await createWorkPlanRecordFromRequest({
  analysisId: bugAnalysis.analysisId,
  selectedModuleIds: ["root_cause_analysis", "test_cases", "api_examples"],
});
assert.equal(bugPlan.plan.workflowId, "debugging_bug_fix");
assert.equal(bugPlan.plan.skillId, "bug_fix_planner");
assert.ok(bugPlan.plan.sections.some((section) => section.id === "test_plan"));

await expectAppError(
  () =>
    createWorkPlanRecordFromRequest({
      analysisId: deckAnalysis.analysisId,
      selectedModuleIds: ["fake_module"],
    }),
  "unknown_module_id",
  400,
);

await expectAppError(
  () =>
    createWorkPlanRecordFromRequest({
      analysisId: "analysis_missing",
      selectedModuleIds: [],
    }),
  "analysis_not_found",
  404,
);

await expectAppError(
  () =>
    createWorkPlanRecordFromRequest({
      analysisId: deckAnalysis.analysisId,
      workflowOverride: "slide_deck",
      skillOverride: "prd_builder",
      selectedModuleIds: [],
    }),
  "skill_workflow_mismatch",
  400,
);

console.log("Phase 9 Work Plan fixtures passed.");
