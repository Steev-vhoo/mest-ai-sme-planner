"use client";

import { useState } from "react";
import {
  AI_FAMILIARITY,
  ATTENDANCE,
  BACK_OFFICE_PAINS,
  BUDGETS,
  CHANNELS,
  CONCERNS,
  CURRENT_TOOLS,
  CUSTOMER_PAINS,
  DEVICES,
  GOALS,
  MARKETING_PAINS,
  MODULES,
  SECTORS,
  TEAM_SIZES,
  WEEKLY_HOURS,
} from "@/lib/schema";

type Form = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  sector: string;
  sectorOther: string;
  location: string;
  teamSize: string;
  businessDescription: string;
  attendance: string;
  aiFamiliarity: string;
  channels: string[];
  currentTools: string[];
  devices: string[];
  budget: string;
  weeklyHours: string;
  adminHoursPerWeek: string;
  backOfficePains: string[];
  marketingPains: string[];
  customerPains: string[];
  usefulModules: string[];
  processesToAutomate: [string, string, string];
  biggestTakeaway: string;
  concerns: string[];
  primaryGoal: string;
  ninetyDayTarget: string;
  anythingElse: string;
  consent: boolean;
  marketingOptIn: boolean;
  website: string;
};

const INITIAL: Form = {
  fullName: "", email: "", phone: "", businessName: "", sector: "", sectorOther: "", location: "",
  teamSize: "", businessDescription: "", attendance: "", aiFamiliarity: "", channels: [], currentTools: [],
  devices: [], budget: "", weeklyHours: "", adminHoursPerWeek: "", backOfficePains: [], marketingPains: [],
  customerPains: [], usefulModules: [], processesToAutomate: ["", "", ""], biggestTakeaway: "", concerns: [],
  primaryGoal: "", ninetyDayTarget: "", anythingElse: "", consent: false, marketingOptIn: false, website: "",
};

const STEPS = [
  { label: "About you", title: "You and your business", hint: "So we can tailor the plan to your sector and size." },
  { label: "Starting point", title: "Where you are today", hint: "Your plan will stay within your budget, time and devices." },
  { label: "Pain points", title: "What slows you down", hint: "Mapped to Modules 2–4 of the workshop. Tick everything that applies." },
  { label: "Takeaways", title: "Your workshop takeaways", hint: "From Module 5: the processes you'd like to automate first." },
  { label: "Goals", title: "Your 90-day goal", hint: "Last step — then we'll build and email your plan." },
];

type Result = { emailed: boolean; emailError?: string; planTitle: string; summary: string; quickWins: string[]; pdfBase64: string };

export default function PlanForm() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(INITIAL);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const toggle = (k: keyof Form, v: string) =>
    setF((prev) => {
      const arr = prev[k] as string[];
      return { ...prev, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  function validate(s: number): string {
    const need = (cond: boolean, msg: string) => (cond ? "" : msg);
    switch (s) {
      case 0:
        return (
          need(!!f.fullName.trim(), "Please enter your name.") ||
          need(/^\S+@\S+\.\S+$/.test(f.email.trim()), "Please enter a valid email — your plan will be sent there.") ||
          need(!!f.businessName.trim(), "Please enter your business name.") ||
          need(!!f.sector, "Please choose your sector.") ||
          need(!!f.location.trim(), "Please enter where your business is located.") ||
          need(!!f.teamSize, "Please choose your team size.") ||
          need(f.businessDescription.trim().length >= 10, "Please describe what your business does.") ||
          need(!!f.attendance, "Please tell us how you joined the workshop.")
        );
      case 1:
        return (
          need(!!f.aiFamiliarity, "Please choose your AI familiarity.") ||
          need(!!f.budget, "Please choose a monthly budget.") ||
          need(!!f.weeklyHours, "Please choose how much time you can give each week.") ||
          need(f.adminHoursPerWeek !== "", "Please estimate your weekly admin hours (0 is fine).")
        );
      case 2:
        return need(
          f.backOfficePains.length + f.marketingPains.length + f.customerPains.length > 0,
          "Tick at least one pain point.",
        );
      case 3:
        return need(f.processesToAutomate.some((p) => p.trim()), "List at least one process you'd like to automate.");
      case 4:
        return (
          need(!!f.primaryGoal, "Please choose your main goal.") ||
          need(!!f.ninetyDayTarget.trim(), "Please describe what success looks like in 90 days.") ||
          need(f.consent, "Please accept the data consent to continue.")
        );
    }
    return "";
  }

  function next() {
    const msg = validate(step);
    setError(msg);
    if (!msg) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();
    const msg = validate(step);
    setError(msg);
    if (msg) return;
    setLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, adminHoursPerWeek: Number(f.adminHoursPerWeek) }),
      });
      const data = await res.json().catch(() => ({ error: "Unexpected server response." }));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!result) return;
    const bytes = Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${f.businessName.replace(/[^a-z0-9]+/gi, "-") || "SME"}-90-Day-AI-Plan.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="card loading" aria-live="polite">
        <div className="spinner" />
        <h2>Building your 90-day plan…</h2>
        <p className="hint">Our AI coach is matching your answers to the workshop modules and checking the plan. This usually takes 1–2 minutes — please keep this page open.</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="card result" aria-live="polite">
        <p className="step-label">Your plan is ready</p>
        <h2>{result.planTitle}</h2>
        {result.emailed ? (
          <div className="notice">We&apos;ve emailed your PDF plan to <strong>{f.email}</strong>. Check your spam folder if it doesn&apos;t arrive in a few minutes.</div>
        ) : (
          <div className="notice">{result.emailError}</div>
        )}
        <p>{result.summary}</p>
        <p><strong>Quick wins for this week:</strong></p>
        <ul>{result.quickWins.map((w, i) => <li key={i}>{w}</li>)}</ul>
        <div className="actions">
          <button type="button" onClick={() => { setResult(null); setF(INITIAL); setStep(0); }}>Start over</button>
          <button type="button" className="primary" onClick={download}>Download PDF</button>
        </div>
      </div>
    );
  }

  const S = STEPS[step];
  return (
    <form className="card" onSubmit={submit} noValidate>
      <div className="steps" aria-hidden>
        {STEPS.map((_, i) => <div key={i} className={i <= step ? "on" : ""} />)}
      </div>
      <p className="step-label">Step {step + 1} of {STEPS.length} · {S.label}</p>
      <h2>{S.title}</h2>
      <p className="hint">{S.hint}</p>

      {/* Honeypot: humans never see or fill this */}
      <div className="hp" aria-hidden>
        <label>Website <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} /></label>
      </div>

      {step === 0 && (
        <div className="grid">
          <TextField label="Full name" value={f.fullName} onChange={(v) => set("fullName", v)} max={80} />
          <TextField label="Email" type="email" value={f.email} onChange={(v) => set("email", v)} max={120} note="Your plan will be sent here" />
          <TextField label="Business name" value={f.businessName} onChange={(v) => set("businessName", v)} max={100} />
          <TextField label="Phone / WhatsApp" type="tel" value={f.phone} onChange={(v) => set("phone", v)} max={30} note="Optional" />
          <Select label="Sector" value={f.sector} onChange={(v) => set("sector", v)} options={SECTORS} />
          {f.sector === "Other" ? (
            <TextField label="Your sector" value={f.sectorOther} onChange={(v) => set("sectorOther", v)} max={80} />
          ) : (
            <Select label="Team size" value={f.teamSize} onChange={(v) => set("teamSize", v)} options={TEAM_SIZES} />
          )}
          {f.sector === "Other" && <Select label="Team size" value={f.teamSize} onChange={(v) => set("teamSize", v)} options={TEAM_SIZES} />}
          <TextField label="Location" value={f.location} onChange={(v) => set("location", v)} max={80} note="e.g. Osu, Accra or Kumasi" />
          <Select label="How did you join the workshop?" value={f.attendance} onChange={(v) => set("attendance", v)} options={ATTENDANCE} />
          <TextArea className="full" label="What does your business do?" note="Products/services, who your customers are" value={f.businessDescription} onChange={(v) => set("businessDescription", v)} max={600} />
        </div>
      )}

      {step === 1 && (
        <div className="grid">
          <Select label="How familiar are you with AI tools?" value={f.aiFamiliarity} onChange={(v) => set("aiFamiliarity", v)} options={AI_FAMILIARITY} />
          <Select label="Monthly budget for AI / software tools" value={f.budget} onChange={(v) => set("budget", v)} options={BUDGETS} />
          <Select label="Time you can give to this each week" value={f.weeklyHours} onChange={(v) => set("weeklyHours", v)} options={WEEKLY_HOURS} />
          <TextField label="Hours per week spent on admin & routine tasks" type="number" value={f.adminHoursPerWeek} onChange={(v) => set("adminHoursPerWeek", v)} note="Your best estimate" />
          <Chips className="full" legend="Where do you sell / talk to customers?" options={CHANNELS} value={f.channels} onToggle={(v) => toggle("channels", v)} />
          <Chips className="full" legend="Tools you already use" options={CURRENT_TOOLS} value={f.currentTools} onToggle={(v) => toggle("currentTools", v)} />
          <Chips className="full" legend="Devices & connectivity" options={DEVICES} value={f.devices} onToggle={(v) => toggle("devices", v)} />
        </div>
      )}

      {step === 2 && (
        <div className="grid">
          <Chips className="full" legend="Back-office" note="Module 2" options={BACK_OFFICE_PAINS} value={f.backOfficePains} onToggle={(v) => toggle("backOfficePains", v)} />
          <Chips className="full" legend="Marketing & content" note="Module 3" options={MARKETING_PAINS} value={f.marketingPains} onToggle={(v) => toggle("marketingPains", v)} />
          <Chips className="full" legend="Customer engagement" note="Module 4" options={CUSTOMER_PAINS} value={f.customerPains} onToggle={(v) => toggle("customerPains", v)} />
        </div>
      )}

      {step === 3 && (
        <div className="grid">
          {[0, 1, 2].map((i) => (
            <TextField
              key={i}
              className="full"
              label={`Process to automate #${i + 1}`}
              note={i === 0 ? "e.g. replying to price enquiries on WhatsApp" : "Optional"}
              value={f.processesToAutomate[i]}
              onChange={(v) => {
                const p = [...f.processesToAutomate] as Form["processesToAutomate"];
                p[i] = v;
                set("processesToAutomate", p);
              }}
              max={200}
            />
          ))}
          <Chips className="full" legend="Which sessions were most useful?" options={MODULES} value={f.usefulModules} onToggle={(v) => toggle("usefulModules", v)} />
          <TextArea className="full" label="Your biggest takeaway" note="Optional" value={f.biggestTakeaway} onChange={(v) => set("biggestTakeaway", v)} max={500} />
          <Chips className="full" legend="Any concerns about using AI?" options={CONCERNS} value={f.concerns} onToggle={(v) => toggle("concerns", v)} />
        </div>
      )}

      {step === 4 && (
        <div className="grid">
          <Select className="full" label="Your main goal for the next 90 days" value={f.primaryGoal} onChange={(v) => set("primaryGoal", v)} options={GOALS} />
          <TextArea className="full" label="What does success look like in 90 days?" note="e.g. reply to every customer within 1 hour, save 5 hours a week on bookkeeping" value={f.ninetyDayTarget} onChange={(v) => set("ninetyDayTarget", v)} max={300} />
          <TextArea className="full" label="Anything else we should know?" note="Optional" value={f.anythingElse} onChange={(v) => set("anythingElse", v)} max={600} />
          <label className="check full">
            <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
            <span>I agree that MEST Africa may process my answers with an AI service to create my plan and store my contact details to follow up on the workshop. Please don&apos;t include passwords or customers&apos; personal data.</span>
          </label>
          <label className="check full">
            <input type="checkbox" checked={f.marketingOptIn} onChange={(e) => set("marketingOptIn", e.target.checked)} />
            <span>Keep me informed about future MEST Africa programmes and events (optional).</span>
          </label>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      <div className="actions">
        <button type="button" onClick={() => { setError(""); setStep((s) => s - 1); }} disabled={step === 0}>Back</button>
        <button type="submit" className="primary">{step === STEPS.length - 1 ? "Create my plan" : "Continue"}</button>
      </div>
    </form>
  );
}

// ---------- small field components ----------

function TextField({ label, note, value, onChange, type = "text", max, className }: {
  label: string; note?: string; value: string; onChange: (v: string) => void; type?: string; max?: number; className?: string;
}) {
  return (
    <label className={`field ${className ?? ""}`}>
      <span>{label} {note && <small>· {note}</small>}</span>
      <input type={type} value={value} maxLength={max} min={type === "number" ? 0 : undefined} max={type === "number" ? 100 : undefined} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextArea({ label, note, value, onChange, max, className }: {
  label: string; note?: string; value: string; onChange: (v: string) => void; max: number; className?: string;
}) {
  return (
    <label className={`field ${className ?? ""}`}>
      <span>{label} {note && <small>· {note}</small>}</span>
      <textarea value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options, className }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; className?: string;
}) {
  return (
    <label className={`field ${className ?? ""}`}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>Choose…</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Chips({ legend, note, options, value, onToggle, className }: {
  legend: string; note?: string; options: readonly string[]; value: string[]; onToggle: (v: string) => void; className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend>{legend} {note && <small>· {note}</small>}</legend>
      <div className="chips">
        {options.map((o) => (
          <label key={o} className="chip">
            <input type="checkbox" checked={value.includes(o)} onChange={() => onToggle(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
