import { NextResponse } from "next/server";
import { z } from "zod";
import { certificatesConfigured, findCertificate } from "@/lib/certificates";
import { GuardrailError, rateLimit } from "@/lib/guardrails";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ email: z.string().trim().toLowerCase().email().max(120) });

export async function POST(req: Request) {
  try {
    // Limits guessing other people's emails.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    rateLimit(`cert:${ip}`, Number(process.env.CERT_RATE_LIMIT_PER_HOUR ?? 30));

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!certificatesConfigured()) {
      return NextResponse.json(
        { error: "Certificates aren't available yet. Please check back soon. (Code: CERT_NOT_CONFIGURED)" },
        { status: 503 },
      );
    }

    const cert = await findCertificate(parsed.data.email);
    if (!cert) {
      return NextResponse.json(
        {
          error:
            "We couldn't find a certificate for that email. Please use the email you registered with. If your certificate is still missing, contact the MEST Africa team.",
        },
        { status: 404 },
      );
    }

    return new NextResponse(new Uint8Array(cert.pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${cert.fileName.replace(/"/g, "")}"`,
        "x-certificate-name": encodeURIComponent(cert.name ?? ""),
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof GuardrailError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Certificate lookup failed:", e);
    const code = /Google API 40[34]/.test(String(e)) ? "CERT_NO_ACCESS" : "CERT_ERROR";
    return NextResponse.json(
      { error: `Something went wrong fetching your certificate. Please try again. (Code: ${code})` },
      { status: 502 },
    );
  }
}
