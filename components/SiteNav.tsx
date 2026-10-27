import Link from "next/link";

export default function SiteNav({ cta = true }: { cta?: boolean }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" aria-label="MEST Africa – home">
          <img src="/mest-logo.png" alt="MEST Africa" />
        </Link>
        {cta ? (
          <Link href="/plan" className="btn btn-primary btn-small">
            Start my plan <span className="arrow">→</span>
          </Link>
        ) : (
          <Link href="/" className="btn btn-ghost btn-small">← Back</Link>
        )}
      </div>
    </nav>
  );
}
