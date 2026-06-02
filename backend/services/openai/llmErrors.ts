export class LlmError extends Error {
  code: string;
  transient: boolean;

  constructor(code: string, message: string, transient = false) {
    super(message);
    this.name = "LlmError";
    this.code = code;
    this.transient = transient;
  }
}

export class LlmUnavailableError extends LlmError {
  constructor(message = "OpenAI client is unavailable.") {
    super("llm_unavailable", message);
    this.name = "LlmUnavailableError";
  }
}

export class LlmTimeoutError extends LlmError {
  constructor(message = "OpenAI request timed out.") {
    super("llm_timeout", message, true);
    this.name = "LlmTimeoutError";
  }
}

export class LlmSchemaValidationError extends LlmError {
  constructor(message = "OpenAI response failed schema validation.") {
    super("llm_schema_validation_error", message);
    this.name = "LlmSchemaValidationError";
  }
}

export class LlmRefusalError extends LlmError {
  constructor(message = "OpenAI response was refused or empty.") {
    super("llm_refusal", message);
    this.name = "LlmRefusalError";
  }
}

export class LlmCircuitOpenError extends LlmError {
  constructor(message = "OpenAI circuit is open.") {
    super("llm_circuit_open", message);
    this.name = "LlmCircuitOpenError";
  }
}

export class LlmTransientError extends LlmError {
  constructor(message = "OpenAI request failed transiently.") {
    super("llm_transient_error", message, true);
    this.name = "LlmTransientError";
  }
}

export function getLlmErrorCode(error: unknown) {
  if (error instanceof LlmError) return error.code;
  if (error instanceof Error) return error.name || "llm_error";
  return "llm_error";
}
