import Link from "next/link";

// `page` hides the link to the page you're already on.
export default function SiteNav({ page }: { page?: "plan" | "certificate" }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" aria-label="MEST Africa – home">
          <img src="/mest-logo.png" alt="MEST Africa" />
        </Link>
        <div className="nav-links">
          {page !== "certificate" && (
            <Link href="/certificate" className="btn btn-ghost btn-small">
              <span aria-hidden>🎓</span> Get certificate
            </Link>
          )}
          {page !== "plan" && (
            <Link href="/plan" className="btn btn-primary btn-small">
              Start my plan <span className="arrow">→</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
