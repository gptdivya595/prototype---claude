import type { ValidationResult, WorkPlan } from "../types/workMode";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim())));
}

function selectedModuleCovered(answerText: string, moduleId: string) {
  const keywordsByModule: Record<string, string[]> = {
    assumptions: ["assumption", "assumptions"],
    competitor_analysis: ["competitor", "comparison", "benchmark"],
    investor_framing: ["investor", "moat", "market timing", "traction"],
    sources_required: ["source-needed", "source requirements", "sources"],
    root_cause_analysis: ["root cause", "hypothesis", "hypotheses"],
    test_cases: ["test", "regression", "verification"],
    metrics: ["metric", "success metric", "guardrail"],
    user_personas: ["persona", "user", "users"],
    validation_checklist: ["validation", "checklist"],
    risk_analysis: ["risk", "mitigation"],
    implementation_plan: ["implementation", "release", "step"],
    market_landscape: ["market", "landscape", "category"],
    api_examples: ["api", "request", "response"],
    database_schema: ["database", "schema", "table"],
  };

  return (keywordsByModule[moduleId] ?? [moduleId.replace(/_/g, " ")]).some((keyword) => answerText.includes(keyword));
}

function sourceNeededLines(answer: string) {
  return answer
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().includes("source-needed"));
}

export function validateAnswerAgainstApprovedPlan(input: {
  approvedPlan: WorkPlan;
  answer: string;
}): ValidationResult {
  const answer = input.answer.trim();
  const normalizedAnswer = normalize(answer);
  const missingSections = input.approvedPlan.sections
    .filter((section) => section.required && !normalizedAnswer.includes(normalize(section.title)))
    .map((section) => section.title);
  const missingModules = input.approvedPlan.selectedModuleIds.filter(
    (moduleId) => !selectedModuleCovered(normalizedAnswer, moduleId),
  );
  const sourceNeededClaims = input.approvedPlan.sourceMode === "source_needed_only" ? sourceNeededLines(answer) : [];
  const unsupportedClaims: string[] = [];
  const recommendedFixes: string[] = [];
  const passedChecks: string[] = [];

  if (answer.length > 0) {
    passedChecks.push("Answer is not empty.");
  } else {
    recommendedFixes.push("Regenerate because the answer is empty.");
  }

  if (missingSections.length === 0) {
    passedChecks.push("All required Work Plan section titles appear in the answer.");
  } else {
    recommendedFixes.push("Add the missing required Work Plan sections.");
  }

  if (missingModules.length === 0) {
    passedChecks.push("Selected roadmap modules are addressed.");
  } else {
    recommendedFixes.push(`Address selected modules: ${missingModules.join(", ")}.`);
  }

  if (normalizedAnswer.includes("assumption")) {
    passedChecks.push("Assumptions are visible.");
  } else if (input.approvedPlan.assumptions.length > 0) {
    recommendedFixes.push("Include approved assumptions before final use.");
  }

  if (
    input.approvedPlan.missingContext.length === 0 ||
    normalizedAnswer.includes("missing context") ||
    normalizedAnswer.includes("open question")
  ) {
    passedChecks.push("Missing context is acknowledged or not required.");
  } else {
    recommendedFixes.push("Acknowledge missing context or open questions.");
  }

  if (input.approvedPlan.sourceMode === "source_needed_only") {
    if (sourceNeededClaims.length > 0) {
      passedChecks.push("Source-needed claims are explicitly marked.");
    } else {
      unsupportedClaims.push("Source-needed mode is enabled, but no unverified claims were marked.");
      recommendedFixes.push("Mark unverifiable factual claims with [source-needed].");
    }
  }

  if (input.approvedPlan.validationCriteria.some((criterion) => normalizedAnswer.includes(normalize(criterion).slice(0, 28)))) {
    passedChecks.push("Validation criteria are referenced.");
  } else {
    recommendedFixes.push("Reference the approved validation criteria more explicitly.");
  }

  const deductions =
    missingSections.length * 12 +
    missingModules.length * 5 +
    unsupportedClaims.length * 10 +
    recommendedFixes.length * 3;
  const qualityScore = Math.max(0, Math.min(100, Math.round(96 - deductions)));

  return {
    matchesApprovedPlan: missingSections.length === 0,
    missingSections,
    unsupportedClaims: unique(unsupportedClaims),
    qualityScore,
    recommendedFixes: unique(recommendedFixes),
    sourceNeededClaims: unique(sourceNeededClaims),
    passedChecks: unique(passedChecks),
  };
}
