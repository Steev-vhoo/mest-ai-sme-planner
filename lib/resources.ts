import { DRIVE, google, googleConfigured } from "./google";

/**
 * Workshop resources live in one Google Drive folder (RESOURCES_FOLDER_ID),
 * shared with the service account as Viewer. Files directly in the folder are
 * listed under "General"; each subfolder becomes its own section (e.g.
 * "Module 2 – Back-office automation"). Start names with "1.", "2." … to
 * control the order; the number is hidden on the site.
 *
 * Participants view files inside the site through Google's embedded viewer, which
 * needs the folder shared as "Anyone with the link – Viewer".
 */

export type ResourceKind = "pdf" | "slides" | "doc" | "sheet" | "video" | "image" | "audio" | "file";

export type Resource = {
  id: string;
  name: string;
  kind: ResourceKind;
  googleType: "document" | "presentation" | "spreadsheet" | null;
  modified: string;
  size: number | null;
};

export type ResourceSection = { name: string; files: Resource[] };

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  shortcutDetails?: { targetId: string; targetMimeType: string };
};

const FOLDER = "application/vnd.google-apps.folder";
const SHORTCUT = "application/vnd.google-apps.shortcut";

export function resourcesConfigured() {
  return Boolean(googleConfigured() && process.env.RESOURCES_FOLDER_ID);
}

async function listFolder(folderId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken = "";
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent("nextPageToken, files(id,name,mimeType,modifiedTime,size,shortcutDetails)");
    const res = await google(
      `${DRIVE}?q=${q}&fields=${fields}&pageSize=200&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ""}`,
    );
    const data = await res.json();
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  // Natural order, so "2. …" comes before "10. …".
  return files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
}

function kindOf(mime: string, name: string): ResourceKind {
  if (mime === "application/vnd.google-apps.presentation" || /presentationml|powerpoint/.test(mime)) return "slides";
  if (mime === "application/vnd.google-apps.document" || /wordprocessingml|msword|text\/plain/.test(mime)) return "doc";
  if (mime === "application/vnd.google-apps.spreadsheet" || /spreadsheetml|ms-excel|text\/csv/.test(mime)) return "sheet";
  if (mime === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

// "2. Module 2 – Marketing.pdf" -> "Module 2 – Marketing"
export function displayName(name: string) {
  return name.replace(/^\s*\d+\s*[.)\-_]\s*/, "").replace(/\.(pdf|pptx?|docx?|xlsx?|csv|mp4|mov|png|jpe?g|txt)$/i, "").trim() || name;
}

function toResource(f: DriveFile): Resource | null {
  // Shortcuts point at a file elsewhere in Drive; show the target.
  const id = f.mimeType === SHORTCUT ? f.shortcutDetails?.targetId : f.id;
  const mime = f.mimeType === SHORTCUT ? f.shortcutDetails?.targetMimeType ?? "" : f.mimeType;
  if (!id || mime === FOLDER || mime === "application/vnd.google-apps.form") return null;
  const googleType = mime.startsWith("application/vnd.google-apps.")
    ? ((mime.split(".").pop() as Resource["googleType"]) ?? null)
    : null;
  return {
    id,
    name: displayName(f.name),
    kind: kindOf(mime, f.name),
    googleType: googleType && ["document", "presentation", "spreadsheet"].includes(googleType) ? googleType : null,
    modified: f.modifiedTime,
    size: f.size ? Number(f.size) : null,
  };
}

let cache: { at: number; sections: ResourceSection[] } | null = null;
const TTL = 5 * 60 * 1000; // new uploads show up within 5 minutes

export async function listResources(): Promise<ResourceSection[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.sections;
  const root = await listFolder(process.env.RESOURCES_FOLDER_ID!);
  const sections: ResourceSection[] = [];

  const general = root.map(toResource).filter((r): r is Resource => r !== null);
  if (general.length) sections.push({ name: "General", files: general });

  const subfolders = root.filter((f) => f.mimeType === FOLDER);
  const contents = await Promise.all(subfolders.map((f) => listFolder(f.id)));
  subfolders.forEach((folder, i) => {
    const files = contents[i].map(toResource).filter((r): r is Resource => r !== null);
    if (files.length) sections.push({ name: displayName(folder.name), files });
  });

  cache = { at: Date.now(), sections };
  return sections;
}
