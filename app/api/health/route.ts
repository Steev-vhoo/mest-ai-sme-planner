import { NextResponse } from "next/server";
import { certificatesConfigured } from "@/lib/certificates";
import { emailProvider } from "@/lib/email";

export const dynamic = "force-dynamic";

// Setup check for admins: reports which settings are present, never their values.
export function GET() {
  return NextResponse.json({
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    email: emailProvider() ?? false,
    certificates: certificatesConfigured(),
    leadsWebhook: Boolean(process.env.LEADS_WEBHOOK_URL),
    rateLimitPerHour: Number(process.env.RATE_LIMIT_PER_HOUR ?? 5),
  });
}
