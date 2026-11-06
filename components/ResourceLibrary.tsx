"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Resource, ResourceKind, ResourceSection } from "@/lib/resources";

const KIND: Record<ResourceKind, { label: string; color: string; icon: React.ReactNode }> = {
  slides: { label: "Slides", color: "#f29b38", icon: <path d="M4 5h16v11H4zM12 16v4M8 20h8" /> },
  pdf: { label: "PDF", color: "#e5534b", icon: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></> },
  doc: { label: "Document", color: "#3b82f6", icon: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h7M9 8h3" /></> },
  sheet: { label: "Spreadsheet", color: "#16a34a", icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M4 15h16M10 4v16" /></> },
  video: { label: "Video", color: "#8b5cf6", icon: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></> },
  image: { label: "Image", color: "#0ea5e9", icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></> },
  audio: { label: "Audio", color: "#db2777", icon: <><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></> },
  file: { label: "File", color: "#5b6470", icon: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></> },
};

function embedUrl(r: Resource) {
  switch (r.googleType) {
    case "document": return `https://docs.google.com/document/d/${r.id}/preview`;
    case "presentation": return `https://docs.google.com/presentation/d/${r.id}/embed?start=false&loop=false`;
    case "spreadsheet": return `https://docs.google.com/spreadsheets/d/${r.id}/preview`;
    default: return `https://drive.google.com/file/d/${r.id}/preview`;
  }
}

function downloadUrl(r: Resource) {
  switch (r.googleType) {
    case "document": return `https://docs.google.com/document/d/${r.id}/export?format=pdf`;
    case "presentation": return `https://docs.google.com/presentation/d/${r.id}/export/pdf`;
    case "spreadsheet": return `https://docs.google.com/spreadsheets/d/${r.id}/export?format=xlsx`;
    default: return `https://drive.google.com/uc?export=download&id=${r.id}`;
  }
}

function Icon({ kind, size = 22 }: { kind: ResourceKind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {KIND[kind].icon}
    </svg>
  );
}

const fmtSize = (b: number | null) => (b == null ? "" : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function ResourceLibrary({ sections }: { sections: ResourceSection[] }) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string>("All");
  const [open, setOpen] = useState<Resource | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections
      .filter((s) => section === "All" || s.name === section)
      .map((s) => ({ ...s, files: s.files.filter((f) => !q || f.name.toLowerCase().includes(q) || KIND[f.kind].label.toLowerCase().includes(q)) }))
      .filter((s) => s.files.length);
  }, [sections, section, query]);

  return (
    <>
      <div className="res-toolbar">
        <input type="search" placeholder="Search resources…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search resources" />
        {sections.length > 1 && (
          <div className="chips" role="tablist" aria-label="Sections">
            {["All", ...sections.map((s) => s.name)].map((name) => (
              <label key={name} className="chip">
                <input type="radio" name="section" checked={section === name} onChange={() => setSection(name)} />
                <span>{name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 && <div className="res-empty">No resources match “{query}”.</div>}

      {visible.map((s) => (
        <section key={s.name} className="res-section">
          {sections.length > 1 && <h2>{s.name}</h2>}
          <div className="res-grid">
            {s.files.map((f, i) => (
              <button key={f.id} type="button" className="res-card" style={{ "--c": KIND[f.kind].color, "--i": i } as React.CSSProperties} onClick={() => setOpen(f)}>
                <span className="res-icon"><Icon kind={f.kind} /></span>
                <span className="res-name">{f.name}</span>
                <span className="res-meta">
                  {KIND[f.kind].label}
                  {f.size ? ` · ${fmtSize(f.size)}` : ""} · {fmtDate(f.modified)}
                </span>
                <span className="res-open">Open →</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {open && <Viewer resource={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Viewer({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="viewer-backdrop" onClick={onClose}>
      <div className="viewer" role="dialog" aria-modal="true" aria-label={resource.name} onClick={(e) => e.stopPropagation()}>
        <div className="viewer-bar">
          <span className="res-icon small" style={{ "--c": KIND[resource.kind].color } as React.CSSProperties}><Icon kind={resource.kind} size={18} /></span>
          <strong>{resource.name}</strong>
          <a className="btn btn-ghost btn-small" href={downloadUrl(resource)} target="_blank" rel="noreferrer">Download</a>
          <button ref={closeRef} type="button" className="viewer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="viewer-body">
          {!loaded && <div className="spinner viewer-spinner" />}
          <iframe src={embedUrl(resource)} title={resource.name} allow="autoplay; fullscreen" allowFullScreen onLoad={() => setLoaded(true)} />
        </div>
      </div>
    </div>
  );
}
