import type { NormalizedPrompt } from "../types/workMode";

const stopEntityWords = new Set([
  "Make",
  "Create",
  "Build",
  "Fix",
  "Debug",
  "Write",
  "Draft",
  "Need",
  "Please",
  "Compare",
  "Analyze",
]);

const artifactHints = [
  "ppt",
  "presentation",
  "slides",
  "deck",
  "pitch deck",
  "prd",
  "brd",
  "code",
  "api",
  "architecture",
  "system design",
  "technical design",
  "research report",
  "competitive analysis",
];

const audienceHints = [
  "investor",
  "investors",
  "executive",
  "executives",
  "board",
  "customer",
  "customers",
  "developer",
  "developers",
  "stakeholder",
  "stakeholders",
  "users",
  "founder",
  "founders",
];

const sourceHints = [
  "latest",
  "recent",
  "source",
  "sources",
  "citation",
  "citations",
  "data",
  "evidence",
  "market",
  "pricing",
  "competitor",
  "competitors",
  "uploaded",
  "attached",
  "file",
  "pdf",
  "doc",
  "web search",
  "browse",
  "internet",
  "look up",
  "current",
];

const riskHints = [
  "system prompt",
  "api key",
  "secret",
  "password",
  "jailbreak",
  "ignore previous",
  "developer message",
  "legal",
  "medical",
  "finance",
  "financial",
  "security",
  "compliance",
  "regulated",
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function includesSignal(lowerText: string, tokens: string[], signal: string) {
  const lowerSignal = signal.toLowerCase();
  return lowerSignal.includes(" ") ? lowerText.includes(lowerSignal) : tokens.includes(lowerSignal) || lowerText.includes(lowerSignal);
}

function collectHints(lowerText: string, tokens: string[], hints: string[]) {
  return hints.filter((hint) => includesSignal(lowerText, tokens, hint));
}

function buildPhrases(tokens: string[]) {
  const phrases: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const two = tokens.slice(index, index + 2);
    const three = tokens.slice(index, index + 3);

    if (two.length === 2) phrases.push(two.join(" "));
    if (three.length === 3) phrases.push(three.join(" "));
  }

  return unique(phrases);
}

function extractEntities(originalText: string) {
  const matches = originalText.match(/\b[A-Z][A-Za-z0-9.-]{2,}\b/g) ?? [];
  return unique(matches.filter((match) => !stopEntityWords.has(match))).slice(0, 8);
}

export function normalizePrompt(prompt: string): NormalizedPrompt {
  const trimmedText = normalizeWhitespace(prompt);
  const lowerText = trimmedText.toLowerCase();
  const tokens = lowerText.match(/[a-z0-9][a-z0-9.-]*/g) ?? [];
  const phrases = buildPhrases(tokens);

  return {
    originalText: prompt,
    trimmedText,
    lowerText,
    tokens,
    phrases,
    explicitArtifactHints: collectHints(lowerText, tokens, artifactHints),
    audienceHints: collectHints(lowerText, tokens, audienceHints),
    entityHints: extractEntities(prompt),
    sourceHints: collectHints(lowerText, tokens, sourceHints),
    riskHints: collectHints(lowerText, tokens, riskHints),
    promptLength: trimmedText.length,
  };
}

export function signalMatches(normalized: NormalizedPrompt, signal: string) {
  const lowerSignal = signal.toLowerCase();
  if (lowerSignal.includes(" ")) {
    return normalized.lowerText.includes(lowerSignal) || normalized.phrases.includes(lowerSignal);
  }

  return normalized.tokens.includes(lowerSignal) || normalized.lowerText.includes(lowerSignal);
}
