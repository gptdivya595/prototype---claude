import { env } from "../../env";
import type { ModelPurpose } from "./modelRouter";

type CircuitState = "closed" | "open" | "half_open";

type CircuitBucket = {
  state: CircuitState;
  failureCount: number;
  openedAt?: number;
};

const buckets = new Map<ModelPurpose, CircuitBucket>();

function getBucket(purpose: ModelPurpose) {
  const existing = buckets.get(purpose);
  if (existing) return existing;

  const bucket: CircuitBucket = {
    state: "closed",
    failureCount: 0,
  };
  buckets.set(purpose, bucket);
  return bucket;
}

export function getCircuitState(purpose: ModelPurpose) {
  const bucket = getBucket(purpose);
  const now = Date.now();

  if (bucket.state === "open" && bucket.openedAt && now - bucket.openedAt >= env.OPENAI_CIRCUIT_COOLDOWN_MS) {
    bucket.state = "half_open";
  }

  return {
    state: bucket.state,
    failureCount: bucket.failureCount,
  };
}

export function canAttemptOpenAi(purpose: ModelPurpose) {
  return getCircuitState(purpose).state !== "open";
}

export function recordOpenAiSuccess(purpose: ModelPurpose) {
  const bucket = getBucket(purpose);
  bucket.state = "closed";
  bucket.failureCount = 0;
  bucket.openedAt = undefined;
}

export function recordOpenAiFailure(purpose: ModelPurpose) {
  const bucket = getBucket(purpose);
  bucket.failureCount += 1;

  if (bucket.failureCount >= env.OPENAI_CIRCUIT_FAILURE_THRESHOLD) {
    bucket.state = "open";
    bucket.openedAt = Date.now();
  }
}

export function getAllCircuitStates() {
  return {
    classification: getCircuitState("classification"),
    workPlan: getCircuitState("work_plan"),
    answer: getCircuitState("answer"),
    validation: getCircuitState("validation"),
  };
}

export function resetCircuitBreakers() {
  buckets.clear();
}
