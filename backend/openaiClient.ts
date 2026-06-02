import OpenAI from "openai";
import { env, hasOpenAiKey } from "./env";

let client: OpenAI | null = null;

export function getOpenAiClient() {
  if (!hasOpenAiKey) return null;

  client ??= new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  return client;
}

export const openAiModels = {
  classifier: env.OPENAI_CLASSIFIER_MODEL,
  workPlan: env.OPENAI_WORK_PLAN_MODEL,
  answer: env.OPENAI_ANSWER_MODEL,
  validation: env.OPENAI_VALIDATION_MODEL,
};
