import fs from "node:fs";
import path from "node:path";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/stylesheet";
import type { FormInput, Plan } from "./schema";

const TEAL = "#1FA9A1";
const TEAL_LIGHT = "#E6F6F5";
const INK = "#111111";
const MUTED = "#5B6470";
const LINE = "#D9E2E1";

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 10, color: INK, lineHeight: 1.45 },
  footer: { position: "absolute", bottom: 24, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: MUTED },
  cover: { backgroundColor: INK, color: "#FFFFFF", padding: 28, borderRadius: 6, marginBottom: 18 },
  coverKicker: { fontSize: 9, color: TEAL, letterSpacing: 1.5, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  coverTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 6, lineHeight: 1.2 },
  coverMeta: { fontSize: 10, color: "#C9D1D1" },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", color: TEAL, marginTop: 14, marginBottom: 8 },
  h3: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  p: { marginBottom: 6 },
  muted: { color: MUTED },
  card: { borderWidth: 1, borderColor: LINE, borderRadius: 4, padding: 10, marginBottom: 8 },
  tealCard: { backgroundColor: TEAL_LIGHT, borderRadius: 4, padding: 10, marginBottom: 8 },
  row: { flexDirection: "row" },
  bullet: { flexDirection: "row", marginBottom: 3 },
  dot: { width: 10, color: TEAL, fontFamily: "Helvetica-Bold" },
  pill: { fontSize: 8, color: TEAL, borderWidth: 1, borderColor: TEAL, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, marginRight: 4 },
  th: { fontFamily: "Helvetica-Bold", fontSize: 9, backgroundColor: INK, color: "#FFFFFF", padding: 5 },
  td: { fontSize: 9, padding: 5, borderBottomWidth: 1, borderColor: LINE },
  phaseHeader: { backgroundColor: TEAL, color: "#FFFFFF", padding: 10, borderRadius: 4, marginBottom: 8 },
  week: { flexDirection: "row", borderBottomWidth: 1, borderColor: LINE, paddingVertical: 6 },
  weekNum: { width: 54, fontFamily: "Helvetica-Bold", color: TEAL },
});

// The built-in PDF fonts only cover WinAnsi; replace common characters outside it
// so model output never renders as blank boxes.
function clean(t: string): string {
  return t
    .replace(/[→⇒➔]/g, "->")
    .replace(/[←]/g, "<-")
    .replace(/[✓✔☑]/g, "+")
    .replace(/[₵]/g, "GHS ")
    .replace(/[≈]/g, "~")
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[‐‑‒]/g, "-")
    .replace(/[^\u0009\u000A -~ -ÿ–—‘’“”•…€]/g, "");
}

type TextStyle = Style | Style[];
const T = ({ children, style }: { children: string; style?: TextStyle }) => <Text style={style}>{clean(children)}</Text>;

const Bullets = ({ items }: { items: string[] }) => (
  <View>
    {items.map((it, i) => (
      <View key={i} style={s.bullet} wrap={false}>
        <Text style={s.dot}>•</Text>
        <T style={{ flex: 1 }}>{it}</T>
      </View>
    ))}
  </View>
);

const Table = ({ headers, rows, widths }: { headers: string[]; rows: string[][]; widths: number[] }) => (
  <View style={{ marginBottom: 8 }}>
    <View style={s.row} fixed>
      {headers.map((h, i) => (
        <Text key={i} style={[s.th, { width: `${widths[i]}%` }]}>{h}</Text>
      ))}
    </View>
    {rows.map((r, ri) => (
      <View key={ri} style={s.row} wrap={false}>
        {r.map((c, ci) => (
          <T key={ci} style={{ ...s.td, width: `${widths[ci]}%` }}>{c}</T>
        ))}
      </View>
    ))}
  </View>
);

function PlanDocument({ plan, form, logo }: { plan: Plan; form: FormInput; logo: Buffer | null }) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <Document title={`${form.businessName} – 90-Day AI Adoption Plan`} author="MEST Africa" subject="AI for SMEs Workshop">
      <Page size="A4" style={s.page}>
        <View style={s.footer} fixed>
          <Text>MEST Africa · AI for SMEs · meltwater.org</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

        <View style={[s.row, { justifyContent: "space-between", alignItems: "center", marginBottom: 14 }]}>
          {logo ? <Image src={logo} style={{ width: 70 }} /> : <Text style={s.h2}>MEST Africa</Text>}
          <Text style={[s.muted, { fontSize: 9 }]}>Prepared {date}</Text>
        </View>

        <View style={s.cover}>
          <Text style={s.coverKicker}>AI FOR SMEs WORKSHOP · YOUR 90-DAY PLAN</Text>
          <T style={s.coverTitle}>{plan.planTitle}</T>
          <T style={s.coverMeta}>{`${form.businessName} · ${form.location} · Prepared for ${form.fullName}`}</T>
        </View>

        <Text style={s.h2}>Summary</Text>
        <T style={s.p}>{plan.executiveSummary}</T>

        <View style={[s.row, { gap: 8 }]}>
          <View style={[s.tealCard, { flex: 1 }]}>
            <Text style={s.h3}>Strengths to build on</Text>
            <Bullets items={plan.businessSnapshot.strengths} />
          </View>
          <View style={[s.tealCard, { flex: 1 }]}>
            <Text style={s.h3}>Opportunities for AI</Text>
            <Bullets items={plan.businessSnapshot.opportunities} />
          </View>
        </View>

        <Text style={s.h2}>Quick wins for this week</Text>
        <View style={s.card}>
          <Bullets items={plan.quickWinsThisWeek} />
        </View>

        <Text style={s.h2} break>Your priority processes to automate</Text>
        {plan.priorityProcesses.map((p, i) => (
          <View key={i} style={s.card} wrap={false}>
            <View style={[s.row, { justifyContent: "space-between", marginBottom: 4 }]}>
              <T style={[s.h3, { flex: 1 }]}>{`${i + 1}. ${p.process}`}</T>
              <View style={s.row}>
                <Text style={s.pill}>{p.difficulty}</Text>
                <T style={s.pill}>{`Saves ${p.estimatedTimeSavedPerWeek}`}</T>
              </View>
            </View>
            <T style={[s.muted, { fontSize: 8.5, marginBottom: 4 }]}>{p.workshopModule}</T>
            <T style={s.p}>{`Today: ${p.currentPain}`}</T>
            <T style={s.p}>{`With AI: ${p.aiSolution}`}</T>
            <T style={{ fontSize: 9 }}>{`Tools: ${p.tools.map((t) => `${t.name} (${t.costNote})`).join(", ")}`}</T>
          </View>
        ))}

        {plan.phases.map((ph, i) => (
          <View key={i} break={i === 0}>
            {i === 0 && <Text style={s.h2}>Your week-by-week roadmap</Text>}
            <View style={s.phaseHeader} wrap={false}>
              <T style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>{`${ph.days} · ${ph.name}`}</T>
              <T style={{ fontSize: 9.5 }}>{ph.objective}</T>
            </View>
            {ph.weeks.map((w) => (
              <View key={w.week} style={s.week} wrap={false}>
                <Text style={s.weekNum}>{`Week ${w.week}`}</Text>
                <View style={{ flex: 1 }}>
                  <T style={s.h3}>{`${w.focus}  ·  ~${w.hours} hrs`}</T>
                  <Bullets items={w.actions} />
                </View>
              </View>
            ))}
            <View style={[s.tealCard, { marginTop: 6, marginBottom: 14 }]} wrap={false}>
              <T>{`Milestone: ${ph.milestone}`}</T>
            </View>
          </View>
        ))}

        <Text style={s.h2} break>How you'll measure success</Text>
        <Table
          headers={["Metric", "Baseline", "90-day target", "How to measure"]}
          widths={[26, 20, 22, 32]}
          rows={plan.kpis.map((k) => [k.metric, k.baseline, k.target90Days, k.howToMeasure])}
        />

        <Text style={s.h2}>Budget</Text>
        <T style={[s.h3, { marginBottom: 6 }]}>{`Estimated monthly cost: ${plan.budget.estimatedMonthlyCostGHS}`}</T>
        <Table headers={["Item", "Cost"]} widths={[65, 35]} rows={plan.budget.breakdown.map((b) => [b.item, b.cost])} />
        <T style={[s.p, s.muted]}>{plan.budget.note}</T>

        <Text style={s.h2}>Using AI responsibly</Text>
        <Table headers={["Risk", "Safeguard"]} widths={[35, 65]} rows={plan.responsibleAI.map((r) => [r.risk, r.safeguard])} />

        <View style={[s.row, { gap: 8 }]} wrap={false}>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.h3}>Skills to build</Text>
            <Bullets items={plan.skillsToLearn} />
          </View>
          <View style={[s.tealCard, { flex: 1 }]}>
            <Text style={s.h3}>Keep going with MEST Africa</Text>
            <Bullets items={plan.mestNextSteps} />
          </View>
        </View>

        <Text style={[s.muted, { fontSize: 8, marginTop: 14 }]}>
          This plan was generated by an AI assistant from your workshop answers and reviewed by automated quality checks.
          Tool prices and features change; confirm before you subscribe. Targets are goals, not guarantees. It is not
          legal, tax or financial advice.
        </Text>
      </Page>
    </Document>
  );
}

let logoCache: Buffer | null | undefined;
function loadLogo(): Buffer | null {
  if (logoCache === undefined) {
    try {
      logoCache = fs.readFileSync(path.join(process.cwd(), "public", "mest-logo.png"));
    } catch {
      logoCache = null;
    }
  }
  return logoCache;
}

export function renderPlanPdf(plan: Plan, form: FormInput): Promise<Buffer> {
  return renderToBuffer(<PlanDocument plan={plan} form={form} logo={loadLogo()} />);
}
