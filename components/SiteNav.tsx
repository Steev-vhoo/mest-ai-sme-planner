import Link from "next/link";

// `page` hides the link to the page you're already on.
export default function SiteNav({ page }: { page?: "plan" | "certificate" | "resources" }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" aria-label="MEST Africa – home">
          <img src="/mest-logo.png" alt="MEST Africa" />
        </Link>
        <div className="nav-links">
          {page !== "certificate" && (
            <Link href="/certificate" className="btn btn-ghost btn-small">
              <span className="long">Get certificate</span>
              <span className="short">Certificate</span>
            </Link>
          )}
          {page !== "plan" && (
            <Link href="/plan" className="btn btn-primary btn-small">
              <span className="long">Start my plan</span>
              <span className="short">My plan</span> <span className="arrow">→</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
