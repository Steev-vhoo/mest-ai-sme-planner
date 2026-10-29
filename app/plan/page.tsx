import type { Metadata } from "next";
import PlanForm from "@/components/PlanForm";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Build your 90-Day AI Plan · MEST Africa AI for SMEs",
};

export default function PlanPage() {
  return (
    <div className="form-page">
      <SiteNav page="plan" />
      <main className="shell">
        <header className="hero">
          <p className="eyebrow rise">MEST Africa · AI for SMEs Workshop</p>
          <div className="rise" style={{ "--d": "80ms" } as React.CSSProperties}>
            <div className="title-box">AI for SMEs</div>
            <br />
            <div className="title-box">Your 90-Day Plan</div>
          </div>
          <p className="lead rise" style={{ "--d": "160ms", marginTop: 18 } as React.CSSProperties}>
            Tell us about your business and what you learned at the workshop. Our AI planning coach will design a
            personalised 90-day AI adoption plan and email it to you as a PDF.
          </p>
        </header>

        <div className="rise" style={{ "--d": "240ms" } as React.CSSProperties}>
          <PlanForm />
        </div>
      </main>
      <footer className="site-footer">
        <a href="https://meltwater.org" target="_blank" rel="noreferrer">meltwater.org</a>
        <div>© MEST Africa · Meltwater Entrepreneurial School of Technology</div>
      </footer>
    </div>
  );
}
