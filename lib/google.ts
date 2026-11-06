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

// Accepts either the whole service-account JSON file pasted into
// GOOGLE_SERVICE_ACCOUNT_JSON, or its two fields as separate variables.
function credentials(): { email: string; key: string } | null {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (parsed.client_email && parsed.private_key) {
        return { email: parsed.client_email, key: parsed.private_key };
      }
    } catch {
      console.error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
    return null;
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  // Vercel may store the key on one line with literal "\n" sequences, or wrapped in quotes.
  return email && key ? { email, key: key.replace(/^"|"$/g, "").replace(/\\n/g, "\n") } : null;
}

export function googleConfigured() {
  return credentials() !== null;
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
