import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Setup check for admins: reports which settings are present, never their values.
export function GET() {
  return NextResponse.json({
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    leadsWebhook: Boolean(process.env.LEADS_WEBHOOK_URL),
    rateLimitPerHour: Number(process.env.RATE_LIMIT_PER_HOUR ?? 5),
  });
}
