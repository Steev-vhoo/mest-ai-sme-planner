import type { FormInput, Plan } from "./schema";

/**
 * Guardrails around the planning agent, in three layers:
 *  1. Input  – schema validation (schema.ts), sanitising, honeypot, rate limits,
 *              and a heuristic screen for prompt-injection attempts.
 *  2. Prompt – the system prompt restricts scope, tool choices and tone, and the
 *              form data is passed as delimited, untrusted data (agent.ts).
 *  3. Output – structural checks on the generated plan plus a scan for content
 *              the plan must never contain, before any PDF is built or emailed.
 */

export class GuardrailError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

// ---------- Layer 1: input ----------

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

export function sanitize<T>(value: T): T {
  if (typeof value === "string") {
    return value
      .replace(CONTROL_CHARS, "")
      .replace(/<\/?[a-z_][^>]*>/gi, "") // strip tag-like markup so input can't fake our delimiters
      .replace(/\s{3,}/g, "  ")
      .trim() as T;
  }
  if (Array.isArray(value)) return value.map(sanitize) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitize(v)])) as T;
  }
  return value;
}

const INJECTION_PATTERNS = [
  /ignore (all |any |the )?(previous|prior|above|earlier) (instructions|prompts?|rules)/i,
  /disregard (your|the|all) (instructions|rules|guidelines)/i,
  /(reveal|show|print|repeat) (your|the) (system )?(prompt|instructions)/i,
  /you are (now|no longer)\b/i,
  /\b(jailbreak|DAN mode|developer mode)\b/i,
  /act as (an? )?(unrestricted|unfiltered)/i,
];

export function screenForInjection(input: FormInput) {
  const freeText = [
    input.businessName,
    input.businessDescription,
    input.sectorOther,
    input.location,
    ...input.processesToAutomate,
    input.biggestTakeaway,
    input.ninetyDayTarget,
    input.anythingElse,
  ].join("\n");
  if (INJECTION_PATTERNS.some((p) => p.test(freeText))) {
    throw new GuardrailError(
      "Your answers contain instructions aimed at the AI assistant. Please describe your business and goals only.",
    );
  }
}

// Best-effort in-memory limiter. Serverless instances don't share memory, so for
// strict limits across instances swap this for Vercel KV / Upstash Redis.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limitPerHour = Number(process.env.RATE_LIMIT_PER_HOUR ?? 5)) {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (recent.length >= limitPerHour) {
    throw new GuardrailError("Too many plan requests. Please try again in an hour.", 429);
  }
  recent.push(now);
  hits.set(key, recent);
}

// ---------- Layer 3: output ----------

const FORBIDDEN_OUTPUT = [
  { pattern: /\bguarantee[sd]?\b.{0,40}\b(revenue|sales|profit|income|growth|results?)\b/i, why: "guaranteed results" },
  { pattern: /\b(buy|purchase|scrape|harvest)\b.{0,30}\b(contact|phone|email|number)s?\b.{0,20}\b(list|database)s?\b/i, why: "buying/scraping contact data" },
  { pattern: /\b(fake|fabricated?)\b.{0,20}\breviews?\b/i, why: "fake reviews" },
  { pattern: /\b(crack(ed)?|pirated?|nulled)\b.{0,20}\b(software|app|version|licen[cs]e)\b/i, why: "pirated software" },
  { pattern: /\b(evade|avoid paying|hide)\b.{0,20}\b(tax|taxes|GRA)\b/i, why: "tax evasion" },
  { pattern: /\b(password|PIN|MoMo PIN)\b.{0,40}\b(into|to|with)\b.{0,20}\b(chatgpt|ai|chatbot|claude|gemini)\b/i, why: "sharing credentials with AI tools" },
];

export function checkPlan(plan: Plan): string[] {
  const problems: string[] = [];
  if (plan.phases.length !== 3) problems.push(`expected 3 phases, got ${plan.phases.length}`);
  const weeks = plan.phases.flatMap((p) => p.weeks.map((w) => w.week)).sort((a, b) => a - b);
  const missing = Array.from({ length: 13 }, (_, i) => i + 1).filter((w) => !weeks.includes(w));
  if (missing.length) problems.push(`weeks missing from the plan: ${missing.join(", ")}`);
  if (plan.priorityProcesses.length < 3 || plan.priorityProcesses.length > 5)
    problems.push(`expected 3–5 priority processes, got ${plan.priorityProcesses.length}`);
  if (plan.quickWinsThisWeek.length < 3) problems.push("expected 3 quick wins");
  if (plan.kpis.length < 2) problems.push("expected at least 2 KPIs");
  if (plan.responsibleAI.length < 3) problems.push("expected at least 3 responsible-AI safeguards");
  if (plan.phases.some((p) => p.weeks.some((w) => w.actions.length === 0)))
    problems.push("every week needs at least one action");

  for (const s of strings(plan)) {
    for (const { pattern, why } of FORBIDDEN_OUTPUT) {
      const m = pattern.exec(s);
      // Allow warnings like "never post fake reviews" — only flag un-negated mentions.
      if (m && !NEGATION.test(s.slice(Math.max(0, m.index - 50), m.index))) {
        problems.push(`plan must not recommend or promise ${why}`);
      }
    }
  }
  return [...new Set(problems)];
}

const NEGATION = /\b(no|not|never|avoid|don't|do not|cannot|can't|won't|without|instead of|rather than)\b/i;

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}
