const rawBaseUrl =
  process.env.WORK_MODE_API_BASE ??
  process.env.VITE_WORK_MODE_API_BASE ??
  "http://127.0.0.1:8787/api/work-mode";
const baseUrl = rawBaseUrl.replace(/\/$/, "");
const rootHealthUrl =
  process.env.WORK_MODE_ROOT_HEALTH ??
  (baseUrl.endsWith("/api/work-mode")
    ? `${baseUrl.slice(0, -"/api/work-mode".length)}/health`
    : `${baseUrl}/health`);
const demoToken = process.env.DEMO_API_TOKEN ?? process.env.VITE_DEMO_API_TOKEN;
const smokePrompt =
  process.env.SMOKE_PROMPT ??
  "Design a backend architecture for a usage analytics API with ingestion, dashboards, and failure recovery.";
const skipGenerate = ["1", "true", "yes"].includes((process.env.SMOKE_SKIP_GENERATE ?? "").toLowerCase());
const requestTimeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "20000", 10);

function requestHeaders() {
  const headers = {
    "content-type": "application/json",
  };

  if (demoToken) {
    headers["x-demo-token"] = demoToken;
  }

  return headers;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON from ${response.url}, received: ${text.slice(0, 160)}`);
  }
}

async function request(pathOrUrl, options = {}) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  let response;

  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...requestHeaders(),
        ...(options.headers ?? {}),
      },
      body:
        options.body && typeof options.body !== "string"
          ? JSON.stringify(options.body)
          : options.body,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`${options.method ?? "GET"} ${url} timed out after ${requestTimeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const body = await readJson(response);

  if (!response.ok || body?.ok === false) {
    const code = body?.error?.code ?? "http_error";
    const message = body?.error?.message ?? `Request failed with status ${response.status}.`;
    throw new Error(`${code}: ${message}`);
  }

  return body?.data ?? body;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function step(label, action) {
  console.log(`[smoke] ${label}`);
  const result = await action();
  console.log(`[smoke] ${label} ok`);
  return result;
}

function appendUnique(values, nextValue) {
  return values.includes(nextValue) ? values : [...values, nextValue];
}

async function runSmoke() {
  const rootHealth = await step("root health", () => request(rootHealthUrl, { method: "GET" }));
  assert(rootHealth.status === "healthy", "Root health route did not return healthy.");

  const workModeHealth = await step("work mode health", () => request("/health", { method: "GET" }));
  assert(workModeHealth.status === "healthy", "Work Mode health route did not return healthy.");

  const skillsPayload = await step("skills catalog", () => request("/skills", { method: "GET" }));
  assert(Array.isArray(skillsPayload.skills) && skillsPayload.skills.length > 0, "Skills catalog is empty.");

  const conversationId = `deploy-smoke-${Date.now()}`;
  const analysis = await step("analyze prompt", () => request("/analyze", {
    method: "POST",
    body: {
      conversationId,
      mode: "work",
      prompt: smokePrompt,
    },
  }));
  assert(analysis.analysisId, "Analyze response did not include analysisId.");
  assert(analysis.recommendedWorkflowId, "Analyze response did not include recommendedWorkflowId.");

  const selectedModuleIds = analysis.selectedModuleIds?.length
    ? analysis.selectedModuleIds
    : analysis.recommendedModuleIds ?? [];
  const createdPlan = await step("create work plan", () => request("/work-plans", {
    method: "POST",
    body: {
      analysisId: analysis.analysisId,
      selectedModuleIds,
      sourceMode: analysis.sourceMode,
    },
  }));
  assert(createdPlan.workPlanId, "Create Work Plan response did not include workPlanId.");

  const smokeCriterion = "Deployment smoke test can complete the approved Work Plan lifecycle.";
  const patchedPlan = {
    ...createdPlan.plan,
    validationCriteria: appendUnique(createdPlan.plan.validationCriteria, smokeCriterion),
  };
  const patchedRecord = await step("patch work plan", () => request(`/work-plans/${createdPlan.workPlanId}`, {
    method: "PATCH",
    body: {
      version: createdPlan.version,
      plan: patchedPlan,
    },
  }));
  assert(patchedRecord.version > createdPlan.version, "Patch did not increment Work Plan version.");

  const approvedRecord = await step("approve work plan", () => request(`/work-plans/${createdPlan.workPlanId}/approve`, {
    method: "POST",
    body: {
      version: patchedRecord.version,
    },
  }));
  assert(approvedRecord.status === "approved", "Approval did not move Work Plan to approved status.");

  let generatedOutput = null;
  if (!skipGenerate) {
    generatedOutput = await step("generate answer", () => request(`/work-plans/${createdPlan.workPlanId}/generate`, {
      method: "POST",
      body: {
        version: approvedRecord.version,
      },
    }));
    assert(generatedOutput.answerId, "Generate response did not include answerId.");
    assert(generatedOutput.validation?.qualityScore >= 0, "Generate response did not include validation.");
  }

  const summary = {
    ok: true,
    baseUrl,
    rootHealthUrl,
    prompt: smokePrompt,
    workflow: analysis.recommendedWorkflowId,
    skill: analysis.recommendedSkillId,
    role: analysis.detectedRole,
    artifact: analysis.detectedArtifact,
    workPlanId: createdPlan.workPlanId,
    generated: Boolean(generatedOutput),
    answerId: generatedOutput?.answerId ?? null,
  };

  console.log(JSON.stringify(summary, null, 2));
}

runSmoke().catch((error) => {
  console.error("[work-mode-smoke] failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
