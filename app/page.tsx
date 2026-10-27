import Link from "next/link";
import Reveal from "@/components/Reveal";
import SiteNav from "@/components/SiteNav";
import {
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
  FormIcon,
  LedgerIcon,
  MailIcon,
  MegaphoneIcon,
  PinIcon,
  SparkIcon,
} from "@/components/Icons";

const TOOLS = ["WhatsApp Business", "Canva", "Google Sheets", "ChatGPT", "Claude", "Gemini", "Oze", "Kudobuzz", "Intelli", "Meta Business Suite", "Mobile Money"];

const STEPS = [
  { icon: <FormIcon size={28} />, title: "Answer a few questions", text: "Tell us about your business, what slows you down and what you learned at the workshop. About 8 minutes." },
  { icon: <SparkIcon size={28} />, title: "Our AI coach designs your plan", text: "It matches your answers to the workshop modules, and stays within your budget, time and devices." },
  { icon: <MailIcon size={28} />, title: "Get your PDF by email", text: "A week-by-week 90-day plan lands in your inbox, ready to print, share with your team and tick off." },
];

const MODULES = [
  { icon: <LedgerIcon size={28} />, tag: "Module 2", title: "Back-office automation", text: "Spend less time on paperwork.", items: ["Bookkeeping & expenses", "Inventory & stock", "Scheduling & payroll"] },
  { icon: <MegaphoneIcon size={28} />, tag: "Module 3", title: "Marketing & content", text: "Show up online consistently.", items: ["Posts & captions in minutes", "Flyers with design assistants", "Track what's working"] },
  { icon: <ChatIcon size={28} />, tag: "Module 4", title: "Customer engagement", text: "Never miss a customer again.", items: ["WhatsApp auto-replies", "After-hours answers", "Follow-ups & feedback"] },
];

const PLAN_PARTS = [
  ["Quick wins for week one", "Three things you can do in the next 7 days."],
  ["Your top processes to automate", "With the tools to use and what they cost in GHS."],
  ["A week-by-week roadmap", "13 weeks in 3 phases, sized to the hours you have."],
  ["Targets you can measure", "Simple KPIs so you can see the time and money saved."],
  ["Using AI responsibly", "Protecting customer data and keeping a human in the loop."],
];

export default function Home() {
  return (
    <>
      <Reveal />
      <SiteNav />

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="wrap hero-grid">
            <div>
              <p className="eyebrow rise">MEST Africa · AI for SMEs Workshop</p>
              <h1 className="rise" style={{ "--d": "80ms" } as React.CSSProperties}>
                <span className="boxed">AI for SMEs</span>
                <br />
                Your <em>90-day</em> plan
              </h1>
              <p className="lead rise" style={{ "--d": "160ms" } as React.CSSProperties}>
                Learn how to automate routine tasks and save time to focus on growing your business. Answer a few
                questions and our AI coach will design a personalised 90-day AI plan for your business, sent to your
                inbox as a PDF.
              </p>
              <div className="hero-cta rise" style={{ "--d": "240ms" } as React.CSSProperties}>
                <Link href="/plan" className="btn btn-primary">
                  Build my 90-day plan <span className="arrow">→</span>
                </Link>
                <a href="#how" className="btn btn-ghost">How it works</a>
              </div>
              <div className="hero-facts rise" style={{ "--d": "320ms" } as React.CSSProperties}>
                <span><ClockIcon size={16} /> About 8 minutes</span>
                <span><SparkIcon size={16} /> Free &amp; no-code tools first</span>
                <span><MailIcon size={16} /> Delivered to your inbox</span>
              </div>
            </div>

            <div className="hero-visual rise" style={{ "--d": "200ms" } as React.CSSProperties}>
              <div className="photo-ring" />
              <div className="photo-frame">
                <img src="/hero-sme-owner.jpg" alt="A smiling shop owner at the counter of his clothing store" />
              </div>
              <div className="float-card fc-1">
                <span className="ico"><ChatIcon size={20} /></span>
                <span><strong>Auto-replies on</strong><small>WhatsApp Business</small></span>
              </div>
              <div className="float-card fc-2">
                <span className="ico"><ClockIcon size={20} /></span>
                <span><strong>~6 hrs saved</strong><small>every week</small></span>
              </div>
              <div className="float-card fc-3">
                <span className="ico"><CheckIcon size={18} /></span>
                <span><strong>Week 1 done</strong><small>3 quick wins</small></span>
              </div>
            </div>
          </div>
        </section>

        {/* Tools marquee */}
        <div className="marquee" aria-label="Tools covered in the workshop">
          <div className="marquee-track">
            {[...TOOLS, ...TOOLS].map((t, i) => (
              <span key={i} aria-hidden={i >= TOOLS.length}>{t}</span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <section id="how" className="section">
          <div className="wrap">
            <p className="eyebrow reveal">How it works</p>
            <h2 className="reveal">From workshop to action plan in three steps</h2>
            <p className="section-intro reveal">Built on Module 5 of the workshop: turning what you learned into a plan you&apos;ll actually follow.</p>
            <div className="steps-grid">
              {STEPS.map((s, i) => (
                <div key={s.title} className="step-card reveal" style={{ "--d": `${i * 120}ms` } as React.CSSProperties}>
                  <div className="icon-badge">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modules */}
        <section className="section section-soft">
          <div className="wrap">
            <p className="eyebrow reveal">What we&apos;ll automate together</p>
            <h2 className="reveal">Your plan builds on the workshop modules</h2>
            <p className="section-intro reveal">Pick your biggest pain points, and the plan puts the easiest, highest-impact wins first.</p>
            <div className="modules-grid">
              {MODULES.map((m, i) => (
                <div key={m.title} className="module-card reveal" style={{ "--d": `${i * 120}ms` } as React.CSSProperties}>
                  <span className="tag">{m.tag}</span>
                  <div className="icon-badge">{m.icon}</div>
                  <h3>{m.title}</h3>
                  <p>{m.text}</p>
                  <ul>{m.items.map((it) => <li key={it}>{it}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's in the plan */}
        <section className="section">
          <div className="wrap plan-grid">
            <div>
              <p className="eyebrow reveal">Inside your PDF</p>
              <h2 className="reveal">A plan made for your business, not a template</h2>
              <ul className="plan-list">
                {PLAN_PARTS.map(([t, d], i) => (
                  <li key={t} className="reveal" style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                    <span className="tick"><CheckIcon size={15} /></span>
                    <div><strong>{t}</strong><span>{d}</span></div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pdf-mock reveal" aria-hidden>
              <div className="pdf-page pdf-back">
                <div className="bar t" />
                {[1, 2, 3, 4, 5, 6].map((w) => (
                  <div key={w} className="week"><b>Week {w + 4}</b><div className="bar" style={{ width: `${55 + ((w * 13) % 35)}%` }} /></div>
                ))}
              </div>
              <div className="pdf-page pdf-front">
                <div className="head"><small>YOUR 90-DAY PLAN</small>From busy DMs to booming online orders</div>
                <div className="bar t" />
                <div className="bar" style={{ width: "92%" }} />
                <div className="bar" style={{ width: "78%" }} />
                {[1, 2, 3, 4].map((w) => (
                  <div key={w} className="week"><b>Week {w}</b><div className="bar" style={{ width: `${60 + ((w * 17) % 30)}%` }} /></div>
                ))}
              </div>
              <div className="mail-badge"><MailIcon size={18} /> Sent to your inbox</div>
            </div>
          </div>
        </section>

        {/* Event strip */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="event-strip reveal">
              <div>
                <p className="eyebrow">The workshop</p>
                <h2>AI for SMEs Workshop</h2>
                <p>A hands-on day with MEST Africa staff and alumni founders, in person in Accra and livestreamed for businesses beyond the city. Limited seats available.</p>
              </div>
              <div className="event-facts">
                <div><CalendarIcon size={18} /> Friday 6th November, 2026</div>
                <div><ClockIcon size={18} /> 9:00am – 5:00pm GMT</div>
                <div><PinIcon size={18} /> MEST Africa, Accra + livestream</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section section-soft final-cta">
          <div className="wrap">
            <h2 className="reveal">Ready to put AI to work in your business?</h2>
            <p className="section-intro reveal">Answer a few questions and your personalised plan arrives in your inbox in about two minutes.</p>
            <div className="reveal">
              <Link href="/plan" className="btn btn-primary">
                Build my 90-day plan <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a href="https://meltwater.org" target="_blank" rel="noreferrer">meltwater.org</a>
        <div>© MEST Africa · Meltwater Entrepreneurial School of Technology</div>
      </footer>
    </>
  );
}
