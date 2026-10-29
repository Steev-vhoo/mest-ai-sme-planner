import type { Metadata } from "next";
import { Fragment } from "react";
import CertificateClaim from "@/components/CertificateClaim";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Your Certificate · MEST Africa AI for SMEs",
  description: "Download your certificate of completion for the MEST Africa AI for SMEs Workshop.",
};

const HEADLINE = ["on", "completing", "the", "AI", "for", "SMEs", "Workshop!"];

// Deterministic "random" spread so server and client render the same confetti.
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 70) / 10,
  duration: 6 + ((i * 29) % 50) / 10,
  color: ["#1fa9a1", "#ffb26b", "#111111", "#7fd6cf", "#f26b5b"][i % 5],
  size: 6 + (i % 4) * 2,
  round: i % 3 === 0,
}));

export default function CertificatePage() {
  return (
    <div className="cert-page">
      <SiteNav page="certificate" />
      <div className="confetti" aria-hidden>
        {CONFETTI.map((c, i) => (
          <i
            key={i}
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              background: c.color,
              width: c.size,
              height: c.round ? c.size : c.size * 1.6,
              borderRadius: c.round ? "50%" : 2,
            }}
          />
        ))}
      </div>

      <main className="cert-main">
        <div className="cert-badge rise" aria-hidden>🎓</div>
        <h1 className="cert-title">
          <span className="word shimmer" style={{ "--i": 0 } as React.CSSProperties}>Congratulations</span>{" "}
          {HEADLINE.map((w, i) => (
            <Fragment key={i}>
              <span className="word" style={{ "--i": i + 1 } as React.CSSProperties}>{w}</span>{" "}
            </Fragment>
          ))}
        </h1>
        <p className="cert-sub fade-late">
          You&apos;ve taken a big step towards putting AI to work in your business. Enter the email you registered
          with to download your certificate of completion.
        </p>

        <div className="fade-later">
          <CertificateClaim />
        </div>

        <p className="cert-note fade-later">
          Haven&apos;t built your 90-day AI plan yet? <a href="/plan">Create it here →</a>
        </p>
      </main>

      <footer className="site-footer">
        <a href="https://meltwater.org" target="_blank" rel="noreferrer">meltwater.org</a>
        <div>© MEST Africa · Meltwater Entrepreneurial School of Technology</div>
      </footer>
    </div>
  );
}
