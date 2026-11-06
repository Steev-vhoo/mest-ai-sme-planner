import { JWT } from "google-auth-library";

/**
 * Read-only access to Google Drive and Sheets through a Google service account
 * (a robot Google account). Share a file, folder or sheet with the service
 * account's email as Viewer and the app can read it. Used by certificates and
 * workshop resources.
 */

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

type Creds = { email: string; key: string };
type CredsResult = { creds: Creds } | { problem: string };

const unquote = (v: string) => v.trim().replace(/^(['"`])([\s\S]*)\1$/, "$2").trim();

// The service-account key file, pasted as text. Also accepts it base64-encoded.
function parseKeyFile(raw: string, varName: string): CredsResult {
  let text = unquote(raw);
  if (!text.startsWith("{")) {
    const decoded = Buffer.from(text, "base64").toString("utf8").trim();
    if (decoded.startsWith("{")) text = decoded;
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Pasting sometimes turns the key's "\n" escapes into real line breaks, which
    // breaks the JSON; the two fields we need can still be read directly.
    const email = text.match(/"client_email"\s*:\s*"([^"]+)"/)?.[1];
    const key = text.match(/"private_key"\s*:\s*"(-----BEGIN[\s\S]*?-----END PRIVATE KEY-----[^"]*)"/)?.[1];
    if (email && key) return { creds: { email, key: key.replace(/\\n/g, "\n") } };
    return { problem: `${varName} is not valid JSON: paste the whole key file again, from the first { to the last }` };
  }
  if (parsed.installed || parsed.web) {
    return { problem: `${varName} holds an OAuth client file, not a service account key: create a key under IAM → Service Accounts → Keys` };
  }
  if (typeof parsed.client_email !== "string" || typeof parsed.private_key !== "string") {
    return { problem: `${varName} has no client_email/private_key: use the service account's JSON key file` };
  }
  return { creds: { email: parsed.client_email, key: parsed.private_key.replace(/\\n/g, "\n") } };
}

// Accepts the whole key file in GOOGLE_SERVICE_ACCOUNT_JSON (recommended), or its
// two fields as GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY.
function resolveCredentials(): CredsResult {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json?.trim()) return parseKeyFile(json, "GOOGLE_SERVICE_ACCOUNT_JSON");

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY;
  // The whole key file pasted into GOOGLE_PRIVATE_KEY by mistake.
  if (key && unquote(key).startsWith("{")) return parseKeyFile(key, "GOOGLE_PRIVATE_KEY");
  if (!email && !key) return { problem: "GOOGLE_SERVICE_ACCOUNT_JSON is not set (or not redeployed since it was added)" };
  if (!email) return { problem: "GOOGLE_SERVICE_ACCOUNT_EMAIL is not set" };
  if (!key) return { problem: "GOOGLE_PRIVATE_KEY is not set" };
  // Vercel may store the key on one line with literal "\n" sequences, or wrapped in quotes.
  const pem = unquote(key).replace(/\\n/g, "\n");
  if (!pem.includes("PRIVATE KEY-----")) {
    return { problem: "GOOGLE_PRIVATE_KEY must include the -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY----- lines" };
  }
  return { creds: { email: unquote(email), key: pem } };
}

function credentials(): Creds | null {
  const r = resolveCredentials();
  return "creds" in r ? r.creds : null;
}

export function googleConfigured() {
  return credentials() !== null;
}

// For /api/health: true, or a short description of what's wrong (never the values).
export function googleCredentialsStatus(): true | string {
  const r = resolveCredentials();
  return "creds" in r ? true : r.problem;
}

let client: JWT | null = null;
function auth() {
  client ??= new JWT({ ...credentials()!, scopes: SCOPES });
  return client;
}

export async function google(url: string) {
  const { token } = await auth().getAccessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Google API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

export const DRIVE = "https://www.googleapis.com/drive/v3/files";
