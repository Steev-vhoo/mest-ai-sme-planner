import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, after } from "next/server";
import { createPlan } from "@/lib/agent";
import { emailConfigured, sendPlanEmail } from "@/lib/email";
import { GuardrailError, rateLimit, sanitize, screenForInjection } from "@/lib/guardrails";
import { renderPlanPdf } from "@/lib/pdf";
import { FormSchema, type FormInput, type Plan } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 300; // plan generation can take a minute or two

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    rateLimit(`ip:${ip}`);

    const parsed = FormSchema.safeParse(sanitize(await req.json().catch(() => null)));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: `Please check "${issue?.path.join(".") || "the form"}": ${issue?.message ?? "invalid input"}` },
        { status: 400 },
      );
    }
    const form = parsed.data;
    rateLimit(`email:${form.email}`, 3);
    screenForInjection(form);

    const plan = await createPlan(form);
    const pdf = await renderPlanPdf(plan, form);

    let emailed = false;
    let emailError: string | undefined;
    if (emailConfigured()) {
      try {
        await sendPlanEmail(form, plan, pdf);
        emailed = true;
      } catch (e) {
        console.error("Email failed:", e);
        emailError = `We couldn't email your plan, but you can download it below. (Code: EMAIL_FAILED – ${emailFailureReason(e)})`;
      }
    } else {
      emailError = "Email delivery isn't configured yet — download your plan below. (Code: EMAIL_NOT_CONFIGURED)";
    }

    after(() => recordLead(form, plan, emailed));

    return NextResponse.json({
      emailed,
      emailError,
      planTitle: plan.planTitle,
      summary: plan.executiveSummary,
      quickWins: plan.quickWinsThisWeek,
      pdfBase64: pdf.toString("base64"),
    });
  } catch (e) {
    if (e instanceof GuardrailError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError) {
      return NextResponse.json({ error: "Our AI planner is busy right now. Please try again in a minute." }, { status: 503 });
    }
    // Setup problems get a specific code so admins can diagnose from the browser.
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      console.error("Anthropic auth error", e.status, e.message);
      return NextResponse.json({ error: "The planner isn't available right now. (Code: AI_KEY_REJECTED)" }, { status: 503 });
    }
    if (e instanceof Anthropic.APIError) {
      console.error("Anthropic API error", e.status, e.message);
      const code = /credit|billing/i.test(e.message) ? "AI_NO_CREDIT" : `AI_${e.status ?? "ERROR"}`;
      return NextResponse.json({ error: `Something went wrong creating your plan. Please try again. (Code: ${code})` }, { status: 502 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set");
      return NextResponse.json({ error: "The planner isn't available right now. (Code: AI_KEY_MISSING)" }, { status: 503 });
    }
    console.error(e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// Short, non-secret reason shown to admins so delivery problems can be fixed from the browser.
function emailFailureReason(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/domain is not verified|verify a domain|testing emails/i.test(msg)) return "sending domain not verified in Resend";
  if (/invalid login|username and password not accepted|535|application-specific password/i.test(msg)) return "SMTP login rejected; use an app password";
  if (/api key is invalid|invalid_api_key/i.test(msg)) return "Resend API key invalid";
  if (/from.*(invalid|format)/i.test(msg)) return "EMAIL_FROM is not a valid sender";
  return msg.replace(/\s+/g, " ").slice(0, 120);
}

// Optional lead capture (concept note objective: build a database of engaged SME leads).
async function recordLead(form: FormInput, plan: Plan, emailed: boolean) {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return;
  const { website: _honeypot, consent: _consent, ...lead } = form;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submittedAt: new Date().toISOString(),
        ...lead,
        processesToAutomate: form.processesToAutomate.filter(Boolean).join(" | "),
        planTitle: plan.planTitle,
        priorityProcesses: plan.priorityProcesses.map((p) => p.process).join(" | "),
        emailed,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.error("Lead webhook failed", e);
  }
}
