import type { z } from "zod";
import { env } from "../../env";
import { getOpenAiClient } from "../../openaiClient";
import { canAttemptOpenAi, recordOpenAiFailure, recordOpenAiSuccess } from "./circuitBreaker";
import {
  getLlmErrorCode,
  LlmCircuitOpenError,
  LlmRefusalError,
  LlmSchemaValidationError,
  LlmTimeoutError,
  LlmTransientError,
  LlmUnavailableError,
} from "./llmErrors";
import type { ModelPurpose } from "./modelRouter";
import { resolveModelForPurpose } from "./modelRouter";

type StructuredResponseInput<T> = {
  requestId: string;
  purpose: ModelPurpose;
  schemaName: string;
  schema: object;
  zodSchema: z.ZodType<T>;
  systemPrompt: string;
  userPayload: unknown;
  timeoutMs?: number;
  maxRetries?: number;
};

export type StructuredResponseResult<T> = {
  data: T;
  model: string;
  latencyMs: number;
  usage?: unknown;
};

function isTransientStatus(status: unknown) {
  return typeof status === "number" && (status === 408 || status === 409 || status === 429 || status >= 500);
}

function normalizeOpenAiError(error: unknown) {
  if (error instanceof LlmTimeoutError || error instanceof LlmSchemaValidationError || error instanceof LlmRefusalError) {
    return error;
  }

  if (error instanceof Error && (error.name === "AbortError" || error.message.toLowerCase().includes("timeout"))) {
    return new LlmTimeoutError(error.message);
  }

  const status = typeof error === "object" && error !== null && "status" in error ? (error as { status?: unknown }).status : undefined;
  if (isTransientStatus(status)) {
    return new LlmTransientError(error instanceof Error ? error.message : "Transient OpenAI failure.");
  }

  if (error instanceof Error) {
    return new LlmUnavailableError(error.message);
  }

  return new LlmUnavailableError();
}

function parseOutputText(response: unknown) {
  const outputText = typeof response === "object" && response !== null && "output_text" in response
    ? (response as { output_text?: unknown }).output_text
    : undefined;

  if (typeof outputText === "string" && outputText.trim()) {
    return outputText;
  }

  throw new LlmRefusalError("OpenAI response did not include output_text.");
}

export async function createStructuredResponse<T>(
  input: StructuredResponseInput<T>,
): Promise<StructuredResponseResult<T>> {
  if (!canAttemptOpenAi(input.purpose)) {
    throw new LlmCircuitOpenError(`${input.purpose} circuit is open.`);
  }

  const client = getOpenAiClient();
  if (!client) {
    throw new LlmUnavailableError("OpenAI API key is not configured.");
  }

  const model = resolveModelForPurpose(input.purpose);
  const timeoutMs = input.timeoutMs ?? env.OPENAI_TIMEOUT_MS;
  const maxRetries = input.maxRetries ?? env.OPENAI_MAX_RETRIES;
  const startedAt = Date.now();

  try {
    const response = await client.responses.create(
      {
        model,
        input: [
          {
            role: "system",
            content: input.systemPrompt,
          },
          {
            role: "user",
            content: JSON.stringify(input.userPayload),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: input.schemaName,
            schema: input.schema as { [key: string]: unknown },
            strict: true,
          },
        },
      },
      {
        timeout: timeoutMs,
        maxRetries,
      },
    );

    const raw = parseOutputText(response);
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(raw);
    } catch (error) {
      throw new LlmSchemaValidationError(error instanceof Error ? error.message : "Invalid JSON response.");
    }

    const parsed = input.zodSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new LlmSchemaValidationError(parsed.error.message);
    }

    const latencyMs = Date.now() - startedAt;
    recordOpenAiSuccess(input.purpose);
    console.info("[work-mode-api] llm structured response", {
      requestId: input.requestId,
      purpose: input.purpose,
      model,
      latencyMs,
      validationStatus: "valid",
      fallbackUsed: false,
    });

    return {
      data: parsed.data,
      model,
      latencyMs,
      usage: typeof response === "object" && response !== null && "usage" in response ? (response as { usage?: unknown }).usage : undefined,
    };
  } catch (error) {
    const normalized = normalizeOpenAiError(error);
    recordOpenAiFailure(input.purpose);
    console.warn("[work-mode-api] llm structured response failed", {
      requestId: input.requestId,
      purpose: input.purpose,
      model,
      latencyMs: Date.now() - startedAt,
      validationStatus: normalized instanceof LlmSchemaValidationError ? "invalid" : "not_validated",
      fallbackUsed: true,
      fallbackReason: getLlmErrorCode(normalized),
    });
    throw normalized;
  }
}
