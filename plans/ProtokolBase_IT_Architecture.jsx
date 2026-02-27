import { useState } from "react";

const LEVELS = [
  {
    id: 1,
    label: "Level 1",
    title: "Document Archive",
    subtitle: "T1 & T2 municipalities accessible on web",
    color: "#3B82F6",
    description: "Core document ingestion and browsing. Scrapers collect PDFs from ~200 municipalities. Basic OCR makes scanned docs searchable. Simple web frontend lets users browse and read protocols. No AI, no accounts.",
    quarter: "Q2–Q3 2026",
    effort: "10–14 weeks",
    municipalities: "200+",
  },
  {
    id: 2,
    label: "Level 2",
    title: "Structured Intelligence",
    subtitle: "AI-parsed structured data from protocols",
    color: "#8B5CF6",
    description: "AI parsing layer extracts agenda items, decisions, entities, and financial figures from protocols. Structured data stored alongside raw PDFs. Users can search by decision type, entity, or topic — not just full-text.",
    quarter: "Q4 2026",
    effort: "8–10 weeks",
    municipalities: "300+",
  },
  {
    id: 3,
    label: "Level 3",
    title: "Notification Engine",
    subtitle: "Alerts, watchlists & user accounts",
    color: "#EC4899",
    description: "User accounts with saved searches and municipality watchlists. Keyword and topic-based email notifications when new relevant content appears. Freemium gate: free users get browse access, paid users get alerts.",
    quarter: "Q1 2027",
    effort: "6–8 weeks",
    municipalities: "500+",
  },
  {
    id: 4,
    label: "Level 4",
    title: "Analytics Platform",
    subtitle: "Dashboards, trends, entity tracking",
    color: "#F59E0B",
    description: "Visual dashboards showing cross-municipal trends. Entity intelligence: track when companies/projects are mentioned. Comparative analytics between municipalities. Slack/Teams integrations.",
    quarter: "Q2–Q3 2027",
    effort: "10–12 weeks",
    municipalities: "800+",
  },
  {
    id: 5,
    label: "Level 5",
    title: "Enterprise & API",
    subtitle: "REST API, custom reports, SSO, white-label",
    color: "#10B981",
    description: "Full REST API for enterprise integrations. Custom AI report generation. SSO/SAML for enterprise auth. Webhook delivery. Mobile app. Multi-language expansion (FR/IT). White-label potential for associations.",
    quarter: "Q4 2027+",
    effort: "12–16 weeks",
    municipalities: "1,500+",
  },
];

const DOMAINS = [
  {
    id: "scraping",
    name: "Data Ingestion & Scraping",
    icon: "🕷️",
    color: "#EF4444",
    components: [
      { name: "Municipality Registry", desc: "Master list of all 2,100+ municipalities with metadata, URLs, CMS type, update frequency", build: "build", level: 1, effort: "M" },
      { name: "Scraper Framework", desc: "Modular scraping engine with per-municipality adapters. Supports Playwright for JS-rendered sites + BeautifulSoup for static", build: "build", level: 1, effort: "L" },
      { name: "CMS Template Scrapers", desc: "Reusable scrapers for common Swiss municipal CMS vendors (CMI, Abacus, Nest, Dialog)", build: "build", level: 1, effort: "L" },
      { name: "Scheduler & Orchestrator", desc: "Cron-based scheduling (daily/weekly per municipality) with retry logic and failure alerts", build: "reuse", level: 1, effort: "S", reuseTech: "Modal Cron / Celery" },
      { name: "Deduplication Engine", desc: "Hash-based dedup to avoid re-processing unchanged documents", build: "build", level: 1, effort: "S" },
      { name: "Scraper Health Monitor", desc: "Dashboard tracking scraper success rates, detecting broken scrapers when sites change", build: "build", level: 2, effort: "M" },
      { name: "Community Scraper Configs", desc: "Open-source scraper configuration format allowing community contributions", build: "build", level: 4, effort: "M" },
    ],
  },
  {
    id: "pdf",
    name: "PDF Processing & OCR",
    icon: "📄",
    color: "#F59E0B",
    components: [
      { name: "PDF Storage Service", desc: "Object storage (R2/S3) with CDN delivery. Stores originals and processed versions", build: "reuse", level: 1, effort: "S", reuseTech: "Cloudflare R2 / AWS S3" },
      { name: "OCR Pipeline", desc: "Multi-engine OCR for scanned PDFs. Confidence scoring per page. Language detection (DE/FR/IT)", build: "hybrid", level: 1, effort: "L", reuseTech: "Tesseract + custom post-processing" },
      { name: "Text Extraction", desc: "Native text extraction for digital PDFs (non-scanned). Preserves structure, tables, headers", build: "reuse", level: 1, effort: "S", reuseTech: "PyMuPDF / pdfplumber" },
      { name: "Document Classifier", desc: "ML classifier to identify document type: protocol, attachment, agenda, minutes, Reglement", build: "build", level: 2, effort: "M" },
      { name: "Quality Scorer", desc: "Automated assessment of OCR quality. Flags low-confidence docs for manual review", build: "build", level: 2, effort: "S" },
    ],
  },
  {
    id: "ai",
    name: "AI Parsing & Structuring",
    icon: "🧠",
    color: "#8B5CF6",
    components: [
      { name: "Structured Extractor", desc: "LLM-based extraction of agenda items, decisions, vote results, deadlines from protocol text", build: "build", level: 2, effort: "XL" },
      { name: "Entity Recognition (NER)", desc: "Extract and link mentions of companies, people, projects, locations, laws/regulations", build: "hybrid", level: 2, effort: "L", reuseTech: "spaCy + Claude API" },
      { name: "Financial Figure Extractor", desc: "Identify and parse monetary amounts, budgets, tax rates, investment figures with context", build: "build", level: 2, effort: "M" },
      { name: "Topic Classifier", desc: "Classify protocol items into standardised topic taxonomy (zoning, infrastructure, education, etc.)", build: "build", level: 2, effort: "M" },
      { name: "Multilingual Pipeline", desc: "Processing pipeline adapted for DE, FR, IT with language-specific prompts and models", build: "build", level: 4, effort: "L" },
      { name: "Summary Generator", desc: "AI-generated plain-language summaries of each protocol and individual agenda items", build: "build", level: 3, effort: "M" },
      { name: "Custom Report Engine", desc: "On-demand AI report generation: 'Summarise all zoning activity in Canton ZH Q1 2027'", build: "build", level: 5, effort: "XL" },
      { name: "Confidence & Source Linker", desc: "Every AI extraction includes confidence score and link back to source passage in PDF", build: "build", level: 2, effort: "M" },
    ],
  },
  {
    id: "search",
    name: "Search & Discovery",
    icon: "🔍",
    color: "#3B82F6",
    components: [
      { name: "Full-Text Search", desc: "PostgreSQL full-text search across all indexed protocol content. Multi-language support", build: "reuse", level: 1, effort: "M", reuseTech: "PostgreSQL FTS / pg_trgm" },
      { name: "Autocomplete", desc: "Fast type-ahead suggestions for municipalities, topics, entities", build: "reuse", level: 1, effort: "S", reuseTech: "Meilisearch" },
      { name: "Semantic Search", desc: "Vector similarity search: find protocols about similar topics even without exact keyword match", build: "hybrid", level: 3, effort: "M", reuseTech: "pgvector + embeddings API" },
      { name: "Faceted Filtering", desc: "Filter by canton, municipality, date, language, topic, decision type, mentioned entities", build: "build", level: 2, effort: "M" },
      { name: "Saved Searches", desc: "Users save search queries for quick re-access. Foundation for notification triggers", build: "build", level: 3, effort: "S" },
    ],
  },
  {
    id: "notifications",
    name: "Notification & Alert Engine",
    icon: "🔔",
    color: "#EC4899",
    components: [
      { name: "Alert Rule Engine", desc: "Users define triggers: keywords, topics, municipalities, entities. Rules matched against new content", build: "build", level: 3, effort: "L" },
      { name: "Email Notifications", desc: "Digest and real-time email alerts with structured summaries and direct links", build: "hybrid", level: 3, effort: "M", reuseTech: "Resend / Postmark" },
      { name: "Slack Integration", desc: "Deliver alerts to Slack channels via incoming webhooks or Slack app", build: "build", level: 4, effort: "M" },
      { name: "Teams Integration", desc: "Microsoft Teams notification delivery for enterprise customers", build: "build", level: 4, effort: "M" },
      { name: "Webhook Delivery", desc: "Generic webhook endpoint for custom integrations. Retry logic, delivery logs", build: "build", level: 5, effort: "M" },
      { name: "Push Notifications", desc: "Mobile push via PWA or native app for on-the-go alerts", build: "build", level: 5, effort: "L" },
    ],
  },
  {
    id: "frontend",
    name: "Frontend & User Experience",
    icon: "🖥️",
    color: "#10B981",
    components: [
      { name: "Public Browse Interface", desc: "SSR landing pages per municipality. Protocol list, PDF viewer, basic search. SEO-optimised", build: "build", level: 1, effort: "L" },
      { name: "PDF Viewer", desc: "In-browser PDF rendering with text highlighting, zoom, download", build: "reuse", level: 1, effort: "S", reuseTech: "PDF.js / react-pdf" },
      { name: "Search UI", desc: "Search results page with filters, snippets, highlighting. Fast and responsive", build: "build", level: 1, effort: "M" },
      { name: "User Dashboard", desc: "Authenticated user home: watchlists, saved searches, notification settings, recent activity", build: "build", level: 3, effort: "L" },
      { name: "Analytics Dashboards", desc: "Interactive charts: topic trends, municipality comparisons, entity timelines", build: "hybrid", level: 4, effort: "XL", reuseTech: "Recharts / D3" },
      { name: "Admin Panel", desc: "Internal: scraper status, document queue, AI quality metrics, user management", build: "build", level: 2, effort: "M" },
      { name: "Mobile App / PWA", desc: "Progressive web app or native mobile for on-the-go access and push notifications", build: "build", level: 5, effort: "XL" },
    ],
  },
  {
    id: "crm",
    name: "CRM, Auth & Billing",
    icon: "💰",
    color: "#6366F1",
    components: [
      { name: "Authentication", desc: "Email/password + OAuth (Google, Microsoft). Magic link login for frictionless onboarding", build: "reuse", level: 3, effort: "S", reuseTech: "NextAuth.js / Clerk" },
      { name: "Subscription & Billing", desc: "Stripe integration: free/Pro/Business/Enterprise tiers, usage metering, invoicing", build: "reuse", level: 3, effort: "M", reuseTech: "Stripe Billing" },
      { name: "Usage Tracking", desc: "Track document views, API calls, notification count per user for metering and limits", build: "build", level: 3, effort: "M" },
      { name: "Customer Portal", desc: "Self-serve billing management: upgrade, downgrade, payment methods, invoice history", build: "reuse", level: 3, effort: "S", reuseTech: "Stripe Customer Portal" },
      { name: "SSO / SAML", desc: "Enterprise single sign-on for large organisations", build: "reuse", level: 5, effort: "M", reuseTech: "WorkOS / Auth0" },
      { name: "Team Management", desc: "Multi-seat accounts: invite members, role-based permissions, shared watchlists", build: "build", level: 4, effort: "M" },
      { name: "Onboarding Flow", desc: "Guided setup: select cantons of interest, pick topics, create first watchlist", build: "build", level: 3, effort: "M" },
    ],
  },
  {
    id: "api",
    name: "API & Integrations",
    icon: "🔗",
    color: "#14B8A6",
    components: [
      { name: "Internal API", desc: "Backend API serving the frontend. REST endpoints for all data access", build: "build", level: 1, effort: "L" },
      { name: "Public REST API", desc: "Documented, versioned API for enterprise customers. Rate-limited, key-authenticated", build: "build", level: 5, effort: "XL" },
      { name: "API Documentation", desc: "Interactive API docs (OpenAPI/Swagger) with examples and SDKs", build: "hybrid", level: 5, effort: "M", reuseTech: "FastAPI auto-docs" },
      { name: "Data Export", desc: "CSV/JSON export of search results, structured data, and analytics", build: "build", level: 3, effort: "S" },
    ],
  },
  {
    id: "infra",
    name: "Infrastructure & DevOps",
    icon: "⚙️",
    color: "#78716C",
    components: [
      { name: "Database", desc: "PostgreSQL for structured data, user data, search indexes. Branching for dev/staging", build: "reuse", level: 1, effort: "M", reuseTech: "Neon Serverless Postgres" },
      { name: "Frontend Hosting", desc: "Next.js on Vercel with edge functions, preview deployments, analytics", build: "reuse", level: 1, effort: "S", reuseTech: "Vercel" },
      { name: "Backend Compute", desc: "Serverless Python functions for API, scraping, AI processing. Scales to zero", build: "reuse", level: 1, effort: "S", reuseTech: "Modal" },
      { name: "CI/CD Pipeline", desc: "Automated testing, linting, deployment on push. Preview environments for PRs", build: "reuse", level: 1, effort: "S", reuseTech: "GitHub Actions + Vercel" },
      { name: "Monitoring & Alerting", desc: "Application monitoring, error tracking, uptime checks, scraper health", build: "reuse", level: 2, effort: "S", reuseTech: "Sentry + Better Uptime" },
      { name: "Log Aggregation", desc: "Centralised logging for debugging scraper issues, API errors, AI pipeline failures", build: "reuse", level: 2, effort: "S", reuseTech: "Axiom / Logtail" },
    ],
  },
];

const EFFORT_MAP = { S: 1, M: 2, L: 3, XL: 5 };
const EFFORT_LABELS = { S: "Small (1–3 days)", M: "Medium (1–2 weeks)", L: "Large (3–5 weeks)", XL: "Extra Large (6+ weeks)" };

export default function ProtokolBaseArchitecture() {
  const [activeLevel, setActiveLevel] = useState(null);
  const [activeDomain, setActiveDomain] = useState(null);
  const [view, setView] = useState("architecture");

  const filteredDomains = DOMAINS.map((d) => ({
    ...d,
    components: d.components.filter((c) => {
      if (activeLevel && c.level > activeLevel) return false;
      return true;
    }),
  })).filter((d) => {
    if (activeDomain && d.id !== activeDomain) return false;
    return d.components.length > 0;
  });

  const stats = {
    total: DOMAINS.reduce((a, d) => a + d.components.length, 0),
    build: DOMAINS.reduce((a, d) => a + d.components.filter((c) => c.build === "build").length, 0),
    reuse: DOMAINS.reduce((a, d) => a + d.components.filter((c) => c.build === "reuse").length, 0),
    hybrid: DOMAINS.reduce((a, d) => a + d.components.filter((c) => c.build === "hybrid").length, 0),
  };

  const levelStats = (lvl) => {
    const comps = DOMAINS.flatMap((d) => d.components).filter((c) => c.level === lvl);
    const effort = comps.reduce((a, c) => a + (EFFORT_MAP[c.effort] || 0), 0);
    return { count: comps.length, effort, build: comps.filter((c) => c.build === "build").length, reuse: comps.filter((c) => c.build !== "build").length };
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", background: "#0A0F1C", color: "#E2E8F0", minHeight: "100vh", padding: "0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderBottom: "1px solid #1E3A5F", padding: "28px 32px 20px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: 3, color: "#3B82F6", fontWeight: 700, textTransform: "uppercase" }}>ProtokolBase</span>
            <span style={{ width: 40, height: 1, background: "#3B82F6", display: "inline-block" }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 6px", color: "#F8FAFC", letterSpacing: -0.5 }}>IT Architecture & Build Plan</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
            {stats.total} components across {DOMAINS.length} domains · {stats.build} custom build · {stats.reuse} reuse existing · {stats.hybrid} hybrid
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", gap: 0 }}>
          {[
            { id: "architecture", label: "Architecture Map" },
            { id: "levels", label: "Evolution Levels" },
            { id: "buildplan", label: "Build vs Buy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                background: "none", border: "none", padding: "12px 20px", cursor: "pointer",
                fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
                color: view === tab.id ? "#3B82F6" : "#64748B",
                borderBottom: view === tab.id ? "2px solid #3B82F6" : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px 60px" }}>

        {/* ══════════════════════════════════════════════════════ */}
        {/* LEVEL FILTER BAR */}
        {/* ══════════════════════════════════════════════════════ */}
        {view === "architecture" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginRight: 4 }}>Show up to:</span>
              <button
                onClick={() => setActiveLevel(null)}
                style={{
                  padding: "6px 14px", borderRadius: 6, border: "1px solid", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: !activeLevel ? "#1E3A5F" : "transparent",
                  borderColor: !activeLevel ? "#3B82F6" : "#334155",
                  color: !activeLevel ? "#93C5FD" : "#64748B",
                }}
              >
                All Levels
              </button>
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setActiveLevel(l.id)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, border: "1px solid", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    background: activeLevel === l.id ? `${l.color}22` : "transparent",
                    borderColor: activeLevel === l.id ? l.color : "#334155",
                    color: activeLevel === l.id ? l.color : "#64748B",
                  }}
                >
                  L{l.id}: {l.title}
                </button>
              ))}
            </div>

            {/* Domain filter */}
            <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginRight: 4 }}>Domain:</span>
              <button
                onClick={() => setActiveDomain(null)}
                style={{
                  padding: "5px 12px", borderRadius: 5, border: "1px solid", cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: !activeDomain ? "#1E293B" : "transparent",
                  borderColor: !activeDomain ? "#475569" : "#1E293B",
                  color: !activeDomain ? "#CBD5E1" : "#475569",
                }}
              >
                All
              </button>
              {DOMAINS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDomain(activeDomain === d.id ? null : d.id)}
                  style={{
                    padding: "5px 12px", borderRadius: 5, border: "1px solid", cursor: "pointer", fontSize: 11, fontWeight: 600,
                    background: activeDomain === d.id ? `${d.color}22` : "transparent",
                    borderColor: activeDomain === d.id ? d.color : "#1E293B",
                    color: activeDomain === d.id ? d.color : "#475569",
                  }}
                >
                  {d.icon} {d.name}
                </button>
              ))}
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* ARCHITECTURE GRID */}
            {/* ══════════════════════════════════════════════════════ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 20 }}>
              {filteredDomains.map((domain) => (
                <div
                  key={domain.id}
                  style={{
                    background: "#111827", borderRadius: 12, border: "1px solid #1E293B",
                    overflow: "hidden",
                  }}
                >
                  {/* Domain header */}
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", gap: 10, background: `${domain.color}08` }}>
                    <span style={{ fontSize: 20 }}>{domain.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: domain.color }}>{domain.name}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{domain.components.length} components</div>
                    </div>
                  </div>

                  {/* Components */}
                  <div style={{ padding: "8px 12px 12px" }}>
                    {domain.components.map((comp, i) => {
                      const lv = LEVELS.find((l) => l.id === comp.level);
                      return (
                        <div
                          key={i}
                          style={{
                            padding: "10px 12px", borderRadius: 8, marginBottom: 6,
                            background: "#0F172A", border: "1px solid #1E293B",
                            transition: "all 0.15s",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", flex: 1 }}>{comp.name}</span>
                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                                letterSpacing: 0.5, textTransform: "uppercase",
                                background: lv ? `${lv.color}22` : "#1E293B",
                                color: lv ? lv.color : "#64748B",
                                border: `1px solid ${lv ? lv.color : "#334155"}44`,
                              }}>
                                L{comp.level}
                              </span>
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                                letterSpacing: 0.5, textTransform: "uppercase",
                                background: comp.build === "build" ? "#7C3AED22" : comp.build === "reuse" ? "#10B98122" : "#F59E0B22",
                                color: comp.build === "build" ? "#A78BFA" : comp.build === "reuse" ? "#34D399" : "#FBBF24",
                                border: `1px solid ${comp.build === "build" ? "#7C3AED" : comp.build === "reuse" ? "#10B981" : "#F59E0B"}44`,
                              }}>
                                {comp.build === "build" ? "Build" : comp.build === "reuse" ? "Reuse" : "Hybrid"}
                              </span>
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                                background: "#1E293B", color: "#94A3B8",
                                border: "1px solid #33415544",
                              }}>
                                {comp.effort}
                              </span>
                            </div>
                          </div>
                          <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, lineHeight: 1.5 }}>{comp.desc}</p>
                          {comp.reuseTech && (
                            <div style={{ marginTop: 5, fontSize: 10, color: "#34D399", fontWeight: 600 }}>
                              ↳ {comp.reuseTech}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* EVOLUTION LEVELS VIEW */}
        {/* ══════════════════════════════════════════════════════ */}
        {view === "levels" && (
          <div>
            {/* Data flow overview */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1E293B", padding: "20px 24px", marginBottom: 28 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 16px" }}>System Data Flow</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", justifyContent: "center" }}>
                {[
                  { label: "Municipality\nWebsites", icon: "🌐", bg: "#1E293B" },
                  { label: "→", icon: "", bg: "transparent" },
                  { label: "Scrapers", icon: "🕷️", bg: "#EF444422" },
                  { label: "→", icon: "", bg: "transparent" },
                  { label: "PDF Storage\n& OCR", icon: "📄", bg: "#F59E0B22" },
                  { label: "→", icon: "", bg: "transparent" },
                  { label: "AI Parsing\nEngine", icon: "🧠", bg: "#8B5CF622" },
                  { label: "→", icon: "", bg: "transparent" },
                  { label: "Structured\nDatabase", icon: "🗃️", bg: "#3B82F622" },
                  { label: "→", icon: "", bg: "transparent" },
                  { label: "Search &\nNotifications", icon: "🔔", bg: "#EC489922" },
                  { label: "→", icon: "", bg: "transparent" },
                  { label: "Web App\n& API", icon: "🖥️", bg: "#10B98122" },
                ].map((step, i) =>
                  step.icon === "" ? (
                    <span key={i} style={{ color: "#334155", fontSize: 18, padding: "0 4px" }}>→</span>
                  ) : (
                    <div key={i} style={{ background: step.bg, border: "1px solid #1E293B", borderRadius: 10, padding: "12px 14px", textAlign: "center", minWidth: 90 }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{step.icon}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#CBD5E1", whiteSpace: "pre-line", lineHeight: 1.4 }}>{step.label}</div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Level cards */}
            {LEVELS.map((level) => {
              const ls = levelStats(level.id);
              const components = DOMAINS.flatMap((d) =>
                d.components.filter((c) => c.level === level.id).map((c) => ({ ...c, domain: d.name, domainIcon: d.icon, domainColor: d.color }))
              );
              return (
                <div key={level.id} style={{ marginBottom: 24, background: "#111827", borderRadius: 12, border: "1px solid #1E293B", overflow: "hidden" }}>
                  {/* Level header */}
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #1E293B", background: `${level.color}08` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 5,
                            background: `${level.color}22`, color: level.color, border: `1px solid ${level.color}44`,
                            letterSpacing: 0.5,
                          }}>
                            {level.label}
                          </span>
                          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>{level.title}</h2>
                        </div>
                        <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>{level.subtitle}</p>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontWeight: 800, color: level.color, fontSize: 18 }}>{ls.count}</div>
                          <div style={{ color: "#64748B", fontSize: 10 }}>Components</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontWeight: 800, color: "#A78BFA", fontSize: 18 }}>{ls.build}</div>
                          <div style={{ color: "#64748B", fontSize: 10 }}>Custom Build</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontWeight: 800, color: "#34D399", fontSize: 18 }}>{ls.reuse}</div>
                          <div style={{ color: "#64748B", fontSize: 10 }}>Reuse/Hybrid</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontWeight: 800, color: "#F8FAFC", fontSize: 14, padding: "2px 0" }}>{level.quarter}</div>
                          <div style={{ color: "#64748B", fontSize: 10 }}>Timeline</div>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: "#CBD5E1", margin: "12px 0 0", lineHeight: 1.6 }}>{level.description}</p>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#64748B" }}>
                      <strong style={{ color: "#94A3B8" }}>Target coverage:</strong> {level.municipalities} municipalities · <strong style={{ color: "#94A3B8" }}>Dev effort:</strong> {level.effort}
                    </div>
                  </div>

                  {/* Components in this level */}
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 8 }}>
                      {components.map((comp, i) => (
                        <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: "#0F172A", border: "1px solid #1E293B", display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{comp.domainIcon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0" }}>{comp.name}</span>
                              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                                <span style={{
                                  fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3,
                                  background: comp.build === "build" ? "#7C3AED22" : comp.build === "reuse" ? "#10B98122" : "#F59E0B22",
                                  color: comp.build === "build" ? "#A78BFA" : comp.build === "reuse" ? "#34D399" : "#FBBF24",
                                  textTransform: "uppercase", letterSpacing: 0.5,
                                }}>
                                  {comp.build}
                                </span>
                                <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3, background: "#1E293B", color: "#94A3B8" }}>
                                  {comp.effort}
                                </span>
                              </div>
                            </div>
                            <p style={{ fontSize: 10, color: "#94A3B8", margin: "3px 0 0", lineHeight: 1.4 }}>{comp.desc}</p>
                            {comp.reuseTech && (
                              <div style={{ marginTop: 3, fontSize: 9, color: "#34D399", fontWeight: 600 }}>↳ {comp.reuseTech}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* BUILD VS BUY VIEW */}
        {/* ══════════════════════════════════════════════════════ */}
        {view === "buildplan" && (
          <div>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              {[
                {
                  label: "Custom Build", count: stats.build, pct: Math.round((stats.build / stats.total) * 100),
                  color: "#A78BFA", bg: "#7C3AED", desc: "Core IP. Unique functionality that creates the competitive moat. Must be built in-house.",
                },
                {
                  label: "Reuse Existing", count: stats.reuse, pct: Math.round((stats.reuse / stats.total) * 100),
                  color: "#34D399", bg: "#10B981", desc: "Off-the-shelf tools or managed services. Saves weeks of dev time. Focus spend here.",
                },
                {
                  label: "Hybrid", count: stats.hybrid, pct: Math.round((stats.hybrid / stats.total) * 100),
                  color: "#FBBF24", bg: "#F59E0B", desc: "Uses existing libraries/APIs but requires significant custom integration or logic on top.",
                },
              ].map((cat, i) => (
                <div key={i} style={{ background: "#111827", borderRadius: 12, border: "1px solid #1E293B", padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, letterSpacing: 1, textTransform: "uppercase" }}>{cat.label}</div>
                      <div style={{ fontSize: 36, fontWeight: 800, color: "#F8FAFC", margin: "4px 0" }}>{cat.count}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>{cat.pct}% of total components</div>
                    </div>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${cat.bg}22`, border: `2px solid ${cat.bg}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: cat.color }}>
                      {cat.pct}%
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#94A3B8", margin: "12px 0 0", lineHeight: 1.5 }}>{cat.desc}</p>
                </div>
              ))}
            </div>

            {/* Grouped lists */}
            {["build", "reuse", "hybrid"].map((buildType) => {
              const cfg = {
                build: { label: "🔨 Custom Build — Your Core IP", color: "#A78BFA", borderColor: "#7C3AED" },
                reuse: { label: "♻️ Reuse Existing Software", color: "#34D399", borderColor: "#10B981" },
                hybrid: { label: "🔀 Hybrid — Existing + Custom Logic", color: "#FBBF24", borderColor: "#F59E0B" },
              }[buildType];

              const items = DOMAINS.flatMap((d) =>
                d.components.filter((c) => c.build === buildType).map((c) => ({
                  ...c, domain: d.name, domainIcon: d.icon, domainColor: d.color,
                }))
              ).sort((a, b) => a.level - b.level);

              return (
                <div key={buildType} style={{ marginBottom: 24, background: "#111827", borderRadius: 12, border: "1px solid #1E293B", overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #1E293B", borderLeft: `3px solid ${cfg.borderColor}` }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: cfg.color, margin: 0 }}>{cfg.label}</h3>
                    <span style={{ fontSize: 11, color: "#64748B" }}>{items.length} components</span>
                  </div>
                  <div style={{ padding: "8px 12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Component", "Domain", "Level", "Effort", buildType !== "build" ? "Technology" : ""].filter(Boolean).map((h, i) => (
                            <th key={i} style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "#64748B", borderBottom: "1px solid #1E293B", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => {
                          const lv = LEVELS.find((l) => l.id === item.level);
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid #0F172A" }}>
                              <td style={{ padding: "8px 10px" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0" }}>{item.name}</div>
                                <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{item.desc.substring(0, 80)}…</div>
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <span style={{ fontSize: 11, color: item.domainColor, fontWeight: 600 }}>{item.domainIcon} {item.domain.split(" ")[0]}</span>
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                                  background: lv ? `${lv.color}22` : "#1E293B",
                                  color: lv ? lv.color : "#64748B",
                                }}>L{item.level}</span>
                              </td>
                              <td style={{ padding: "8px 10px" }}>
                                <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>{item.effort}</span>
                              </td>
                              {buildType !== "build" && (
                                <td style={{ padding: "8px 10px" }}>
                                  <span style={{ fontSize: 10, color: "#34D399", fontWeight: 600 }}>{item.reuseTech || "—"}</span>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Recommended tech stack */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1E293B", padding: "20px 24px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 16px" }}>Recommended Existing Software Stack</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {[
                  { cat: "Frontend", items: ["Next.js (App Router)", "Vercel", "Tailwind CSS", "Recharts / D3"] },
                  { cat: "Backend", items: ["Python (FastAPI)", "Modal (serverless)", "Celery (queues)"] },
                  { cat: "Database", items: ["Neon (Postgres)", "pgvector", "Meilisearch"] },
                  { cat: "AI / ML", items: ["Claude API (Sonnet)", "spaCy (NER)", "Tesseract (OCR)"] },
                  { cat: "Auth & Billing", items: ["Clerk / NextAuth", "Stripe Billing", "WorkOS (SSO)"] },
                  { cat: "DevOps", items: ["GitHub Actions", "Sentry", "Axiom (logs)"] },
                  { cat: "Storage", items: ["Cloudflare R2", "Resend (email)", "PDF.js (viewer)"] },
                  { cat: "Scraping", items: ["Playwright", "BeautifulSoup", "PyMuPDF / pdfplumber"] },
                ].map((group, i) => (
                  <div key={i} style={{ background: "#0F172A", borderRadius: 8, padding: "12px 14px", border: "1px solid #1E293B" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>{group.cat}</div>
                    {group.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 11, color: "#CBD5E1", padding: "3px 0", borderBottom: j < group.items.length - 1 ? "1px solid #1E293B" : "none" }}>
                        {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
