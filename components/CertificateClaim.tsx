"use client";

import { useEffect, useState } from "react";

type Done = { name: string; url: string; fileName: string };

export default function CertificateClaim() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => () => { if (done) URL.revokeObjectURL(done.url); }, [done]);

  function save(d: Done) {
    const a = document.createElement("a");
    a.href = d.url;
    a.download = d.fileName;
    a.click();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please enter a valid email address.");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Something went wrong. Please try again. (Code: HTTP_${res.status})`);
      }
      const blob = await res.blob();
      const fileName = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "MEST-Certificate.pdf";
      const d = {
        name: decodeURIComponent(res.headers.get("x-certificate-name") ?? ""),
        url: URL.createObjectURL(blob),
        fileName,
      };
      setDone(d);
      save(d);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Connection to the server was lost. Check your internet and try again. (Code: NETWORK)"
          : err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="cert-card cert-success" aria-live="polite">
        <div className="burst" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--a": `${i * (360 / 14)}deg` } as React.CSSProperties} />)}</div>
        <h2>Well done{done.name ? `, ${done.name.split(/\s+/)[0]}` : ""}! 🎉</h2>
        <p>Your certificate is downloading. Share it with pride, and tag <strong>MEST Africa</strong> when you post it!</p>
        <div className="cert-actions">
          <button type="button" className="primary" onClick={() => save(done)}>Download again</button>
          <button type="button" onClick={() => { setDone(null); setEmail(""); }}>Use another email</button>
        </div>
      </div>
    );
  }

  return (
    <form className="cert-card" onSubmit={submit} noValidate>
      <label className="field">
        <span>Email you registered with</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" maxLength={120} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="primary" disabled={loading}>
        {loading ? "Finding your certificate…" : "Get my certificate"}
      </button>
    </form>
  );
}
