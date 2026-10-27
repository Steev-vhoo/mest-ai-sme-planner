import PlanForm from "@/components/PlanForm";

export default function Home() {
  return (
    <main className="shell">
      <header className="hero">
        <div className="brand">
          <img src="/mest-logo.png" alt="MEST Africa" />
          <span>Meltwater Entrepreneurial School of Technology</span>
        </div>
        <div>
          <div className="title-box">AI for SMEs</div>
          <br />
          <div className="title-box">Your 90-Day Plan</div>
        </div>
        <p className="lead">
          Tell us about your business and what you learned at the workshop. Our AI planning coach will design a
          personalised 90-day AI adoption plan and email it to you as a PDF.
        </p>
        <div className="meta">
          <span>About 8 minutes</span>
          <span>Free &amp; no-code tools first</span>
          <span>Delivered to your inbox</span>
        </div>
      </header>

      <PlanForm />

      <footer>
        <a href="https://meltwater.org" target="_blank" rel="noreferrer">
          meltwater.org
        </a>
      </footer>
    </main>
  );
}
