import { JWT } from "google-auth-library";

/**
 * Certificates stay in Google Drive. A Google service account (a robot Google
 * account) is given Viewer access to the certificates folder and/or the sheet, and
 * this server fetches the attendee's file on their behalf, so files never need to
 * be shared publicly.
 *
 * Two ways to find an attendee's certificate (use either or both):
 *  1. CERT_SHEET_ID: a Google Sheet with a header row containing an "Email" column
 *     and a column holding the certificate's Drive link or file ID (e.g. the
 *     "Merged Doc URL" column Autocrat writes). An optional "Name" column is used
 *     in the greeting.
 *  2. CERT_FOLDER_ID: a Drive folder where each certificate's file name contains
 *     the attendee's email, e.g. "kwame@example.com.pdf".
 */

export type Certificate = { name: string | null; fileName: string; pdf: Buffer };

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

export function certificatesConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      (process.env.CERT_SHEET_ID || process.env.CERT_FOLDER_ID),
  );
}

let client: JWT | null = null;
function auth() {
  client ??= new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // Vercel stores the key on one line with literal "\n" sequences.
    key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });
  return client;
}

async function google(url: string) {
  const { token } = await auth().getAccessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Google API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

const DRIVE = "https://www.googleapis.com/drive/v3/files";

export function driveFileId(linkOrId: string): string | null {
  const s = linkOrId.trim();
  const m = s.match(/\/d\/([\w-]{20,})/) ?? s.match(/[?&]id=([\w-]{20,})/);
  if (m) return m[1];
  return /^[\w-]{20,}$/.test(s) ? s : null;
}

async function lookupInSheet(email: string): Promise<{ name: string | null; fileId: string } | null> {
  const sheetId = process.env.CERT_SHEET_ID;
  if (!sheetId) return null;
  const range = encodeURIComponent(process.env.CERT_SHEET_RANGE || "A:Z");
  const res = await google(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`);
  const rows: string[][] = (await res.json()).values ?? [];
  const [header = [], ...data] = rows;
  const col = (re: RegExp) => header.findIndex((h) => re.test(h ?? ""));
  const emailCol = col(/e-?mail/i);
  const fileCol = col(/certificate|merged doc url|doc url|link|url|file/i);
  const nameCol = col(/^(full )?name$|participant|attendee/i);
  if (emailCol < 0 || fileCol < 0) {
    throw new Error("Certificate sheet needs an 'Email' column and a 'Certificate' (link) column");
  }
  for (const row of data) {
    if ((row[emailCol] ?? "").trim().toLowerCase() === email) {
      const fileId = driveFileId(row[fileCol] ?? "");
      if (fileId) return { name: nameCol >= 0 ? row[nameCol]?.trim() || null : null, fileId };
    }
  }
  return null;
}

async function lookupInFolder(email: string): Promise<{ name: null; fileId: string } | null> {
  const folderId = process.env.CERT_FOLDER_ID;
  if (!folderId) return null;
  const q = `'${folderId}' in parents and trashed = false and name contains '${email.replace(/['\\]/g, "\\$&")}'`;
  const res = await google(
    `${DRIVE}?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=5&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  );
  const files: { id: string; name: string }[] = (await res.json()).files ?? [];
  // `contains` matches word prefixes, so confirm the full email is in the name.
  const hit = files.find((f) => f.name.toLowerCase().includes(email));
  return hit ? { name: null, fileId: hit.id } : null;
}

async function downloadAsPdf(fileId: string): Promise<{ fileName: string; pdf: Buffer }> {
  const meta = await (await google(`${DRIVE}/${fileId}?fields=name,mimeType&supportsAllDrives=true`)).json();
  // Google Docs/Slides certificates are exported to PDF; uploaded PDFs are downloaded as-is.
  const url = String(meta.mimeType).startsWith("application/vnd.google-apps.")
    ? `${DRIVE}/${fileId}/export?mimeType=application/pdf`
    : `${DRIVE}/${fileId}?alt=media&supportsAllDrives=true`;
  const pdf = Buffer.from(await (await google(url)).arrayBuffer());
  const base = String(meta.name).replace(/\.pdf$/i, "").replace(/[^\w.@ -]+/g, "").trim() || "Certificate";
  return { fileName: `${base}.pdf`, pdf };
}

export async function findCertificate(rawEmail: string): Promise<Certificate | null> {
  const email = rawEmail.trim().toLowerCase();
  const hit = (await lookupInSheet(email)) ?? (await lookupInFolder(email));
  if (!hit) return null;
  return { name: hit.name, ...(await downloadAsPdf(hit.fileId)) };
}
