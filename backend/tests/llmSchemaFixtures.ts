import assert from "node:assert/strict";
import {
  LlmClassificationSchema,
  LlmGeneratedWorkPlanSchema,
} from "../services/openai/llmSchemas";

const validClassification = {
  detectedRole: "Researcher",
  detectedArtifact: "PPT",
  taskCategory: "presentation",
  intentCategory: "drafting",
  audience: "Investors",
  primaryEntity: "Perplexity",
  recommendedWorkflowId: "slide_deck",
  recommendedSkillId: "investor_deck_builder",
  confidence: 0.88,
  reason: "The prompt asks for an investor-facing competitor presentation.",
  selectedModuleIds: ["competitor_analysis", "investor_framing", "sources_required"],
  sourceMode: "source_needed_only",
  roadmapDepth: "L3",
  riskLevel: "medium",
  questionsForUser: [],
  matchedSignals: ["ppt", "competitors", "investors"],
};

assert.equal(LlmClassificationSchema.safeParse(validClassification).success, true);
assert.equal(LlmClassificationSchema.safeParse({ ...validClassification, recommendedWorkflowId: "fake_workflow" }).success, false);
assert.equal(
  LlmClassificationSchema.safeParse({ ...validClassification, selectedModuleIds: ["fake_module"] }).success,
  false,
);

const validWorkPlan = {
  prompt: "Make a PPT on competitors of Perplexity for investors.",
  role: "Researcher",
  artifact: "PPT",
  workflowId: "slide_deck",
  skillId: "investor_deck_builder",
  objective: "Create an investor-facing slide deck roadmap.",
  audience: "Investors",
  sourceMode: "source_needed_only",
  roadmapDepth: "L3",
  riskLevel: "medium",
  assumptions: ["The user wants an editable roadmap."],
  missingContext: ["Target slide count"],
  sections: [
    {
      id: "deck_goal",
      title: "Deck Goal",
      instructions: "Define the deck purpose.",
      required: true,
      moduleId: null,
      sourceRefs: [],
    },
  ],
  suggestions: [
    {
      id: "competitor_analysis",
      label: "Competitor Analysis",
      description: "Compare competitors and alternatives.",
      selected: true,
    },
  ],
  validationCriteria: ["Final output must be a slide-by-slide outline."],
  selectedModuleIds: ["assumptions", "validation_checklist", "competitor_analysis"],
};

assert.equal(LlmGeneratedWorkPlanSchema.safeParse(validWorkPlan).success, true);
assert.equal(LlmGeneratedWorkPlanSchema.safeParse({ ...validWorkPlan, sections: [] }).success, false);
assert.equal(
  LlmGeneratedWorkPlanSchema.safeParse({
    ...validWorkPlan,
    sections: [{ ...validWorkPlan.sections[0], moduleId: "fake_module" }],
  }).success,
  false,
);

console.log("Phase 10 LLM schema fixtures passed.");
