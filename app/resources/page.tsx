import type { Metadata } from "next";
import ResourceLibrary from "@/components/ResourceLibrary";
import SiteNav from "@/components/SiteNav";
import { googleConfigured } from "@/lib/google";
import { listResources, resourcesConfigured, type ResourceSection } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Workshop Resources · MEST Africa AI for SMEs",
  description: "Slides, guides and templates from the MEST Africa AI for SMEs Workshop facilitators.",
};

// Always read the Drive folder at request time (results are cached for 5 minutes).
export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  let sections: ResourceSection[] = [];
  let problem: string | null = null;
  if (!resourcesConfigured()) {
    const code = !googleConfigured() ? "GOOGLE_NOT_CONFIGURED" : "RESOURCES_FOLDER_MISSING";
    problem = `Workshop resources will appear here soon. Please check back later. (Code: ${code})`;
  } else {
    try {
      sections = await listResources();
      if (!sections.length) problem = "No resources have been shared yet. Please check back later.";
    } catch (e) {
      console.error("Listing resources failed:", e);
      const code = /Google API 40[34]/.test(String(e)) ? "RESOURCES_NO_ACCESS" : "RESOURCES_ERROR";
      problem = `We couldn't load the resources right now. Please try again shortly. (Code: ${code})`;
    }
  }

  return (
    <div className="form-page">
      <SiteNav page="resources" />
      <main className="wrap res-main">
        <header className="res-hero">
          <p className="eyebrow rise">MEST Africa · AI for SMEs Workshop</p>
          <h1 className="rise" style={{ "--d": "80ms" } as React.CSSProperties}>
            Workshop <span className="res-boxed">resources</span>
          </h1>
          <p className="lead rise" style={{ "--d": "160ms" } as React.CSSProperties}>
            Slides, guides and templates from your facilitators. Open them right here, or download them to keep.
          </p>
        </header>
        <div className="rise" style={{ "--d": "240ms" } as React.CSSProperties}>
          {problem ? <div className="res-empty">{problem}</div> : <ResourceLibrary sections={sections} />}
        </div>
      </main>
      <footer className="site-footer">
        <a href="https://meltwater.org" target="_blank" rel="noreferrer">meltwater.org</a>
        <div>© MEST Africa · Meltwater Entrepreneurial School of Technology</div>
      </footer>
    </div>
  );
}
