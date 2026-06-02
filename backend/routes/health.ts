import { Router } from "express";
import { env, hasOpenAiKey } from "../env";
import { sendSuccess } from "../utils/apiResponse";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  return sendSuccess(res, {
    status: "healthy",
    service: "work-mode-api",
    hasOpenAiKey,
    features: {
      llmClassifier: env.USE_LLM_CLASSIFIER,
      llmWorkPlan: env.USE_LLM_WORK_PLAN,
      llmAnswer: env.USE_LLM_ANSWER,
      sseStreaming: false,
      webSocket: false,
      persistence: "memory",
    },
    llmFlags: {
      classifier: env.USE_LLM_CLASSIFIER,
      workPlan: env.USE_LLM_WORK_PLAN,
      answer: env.USE_LLM_ANSWER,
    },
  });
});
