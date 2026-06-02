import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}, z.boolean());

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  OPENAI_API_KEY: z.string().optional(),
  DEFAULT_MODEL: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  OPENAI_CLASSIFIER_MODEL: z.string().optional(),
  OPENAI_WORK_PLAN_MODEL: z.string().optional(),
  OPENAI_ANSWER_MODEL: z.string().optional(),
  OPENAI_VALIDATION_MODEL: z.string().optional(),
  USE_LLM_CLASSIFIER: booleanFromEnv.default(false),
  USE_LLM_WORK_PLAN: booleanFromEnv.default(false),
  USE_LLM_ANSWER: booleanFromEnv.default(false),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(12_000),
  OPENAI_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
  OPENAI_CIRCUIT_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(3),
  OPENAI_CIRCUIT_COOLDOWN_MS: z.coerce.number().int().positive().default(60_000),
  FRONTEND_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
  DEMO_API_TOKEN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  FRONTEND_ORIGINS: z.string().optional(),
});

const parsedEnv = EnvSchema.parse(process.env);

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find(Boolean);
}

function normalizeOrigin(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).origin;
  } catch {
    throw new Error(`Invalid frontend origin: ${value}`);
  }
}

function parseOriginList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));
}

export const hasOpenAiKey = Boolean(parsedEnv.OPENAI_API_KEY?.trim());

export const env = {
  ...parsedEnv,
  OPENAI_MODEL: firstNonEmpty(parsedEnv.OPENAI_MODEL, parsedEnv.DEFAULT_MODEL) ?? "gpt-4.1-mini",
  OPENAI_CLASSIFIER_MODEL:
    firstNonEmpty(parsedEnv.OPENAI_CLASSIFIER_MODEL, parsedEnv.OPENAI_MODEL, parsedEnv.DEFAULT_MODEL) ??
    "gpt-4o-mini",
  OPENAI_WORK_PLAN_MODEL:
    firstNonEmpty(parsedEnv.OPENAI_WORK_PLAN_MODEL, parsedEnv.OPENAI_MODEL, parsedEnv.DEFAULT_MODEL) ??
    "gpt-4o-mini",
  OPENAI_ANSWER_MODEL:
    firstNonEmpty(parsedEnv.OPENAI_ANSWER_MODEL, parsedEnv.DEFAULT_MODEL) ?? "gpt-4o-mini",
  OPENAI_VALIDATION_MODEL: firstNonEmpty(parsedEnv.OPENAI_VALIDATION_MODEL, parsedEnv.DEFAULT_MODEL) ?? "gpt-4o-mini",
  USE_LLM_CLASSIFIER: hasOpenAiKey && parsedEnv.USE_LLM_CLASSIFIER,
  USE_LLM_WORK_PLAN: hasOpenAiKey && parsedEnv.USE_LLM_WORK_PLAN,
  USE_LLM_ANSWER: hasOpenAiKey && parsedEnv.USE_LLM_ANSWER,
};

export const allowedOrigins = Array.from(
  new Set([
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    normalizeOrigin(env.FRONTEND_ORIGIN),
    ...parseOriginList(env.FRONTEND_ORIGINS),
  ].filter((origin): origin is string => Boolean(origin))),
);
