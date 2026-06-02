import { env } from "../../env";

export type ModelPurpose = "classification" | "work_plan" | "answer" | "validation";

export function resolveModelForPurpose(purpose: ModelPurpose) {
  if (purpose === "classification") return env.OPENAI_CLASSIFIER_MODEL;
  if (purpose === "work_plan") return env.OPENAI_WORK_PLAN_MODEL;
  if (purpose === "validation") return env.OPENAI_VALIDATION_MODEL;
  return env.OPENAI_ANSWER_MODEL;
}

export function getSafeModelConfig() {
  return {
    classification: resolveModelForPurpose("classification"),
    workPlan: resolveModelForPurpose("work_plan"),
    answer: resolveModelForPurpose("answer"),
    validation: resolveModelForPurpose("validation"),
  };
}
