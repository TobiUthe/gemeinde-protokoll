import { useState } from "react";

const REPO_STRUCTURE = {
  name: "protokolbase",
  type: "root",
  children: [
    {
      name: "apps/",
      type: "dir",
      desc: "Deployable applications",
      children: [
        { name: "web/", type: "app", tech: "Next.js", deploy: "Vercel", desc: "Public site + user dashboard + admin panel", port: "3000", ci: "vercel-deploy.yml" },
      ],
    },
    {
      name: "services/",
      type: "dir",
      desc: "Python backend services (each deploys independently to Modal)",
      children: [
        { name: "scraper/", type: "service", tech: "Python", deploy: "Modal", desc: "Municipality scrapers + scheduler + health monitor", ci: "deploy-scraper.yml" },
        { name: "ocr/", type: "service", tech: "Python", deploy: "Modal", desc: "PDF processing pipeline: PyMuPDF → Mistral → Azure fallback", ci: "deploy-ocr.yml" },
        { name: "ai-parser/", type: "service", tech: "Python", deploy: "Modal", desc: "LLM structured extraction, NER, topic classification", ci: "deploy-ai-parser.yml" },
        { name: "notifications/", type: "service", tech: "Python", deploy: "Modal", desc: "Alert rule engine, email via Resend, webhooks", ci: "deploy-notifications.yml" },
        { name: "api/", type: "service", tech: "Python/FastAPI", deploy: "Modal", desc: "Public REST API + internal API for frontend", ci: "deploy-api.yml" },
      ],
    },
    {
      name: "packages/",
      type: "dir",
      desc: "Shared code — the glue between modules",
      children: [
        { name: "shared-types/", type: "package", tech: "TypeScript + Python (Pydantic)", desc: "Contract types shared across all modules. Source of truth for API schemas, DB types, enums", ci: null },
        { name: "db/", type: "package", tech: "Drizzle ORM", desc: "Database schema, migrations, seed data, query helpers", ci: "migrate.yml" },
        { name: "config/", type: "package", tech: "Config", desc: "Shared ESLint, Prettier, TSConfig, pytest config", ci: null },
      ],
    },
    {
      name: "docs/",
      type: "dir",
      desc: "Central documentation hub",
      children: [
        { name: "architecture/", type: "docs", desc: "System architecture, ADRs (Architecture Decision Records), data flow diagrams" },
        { name: "api-spec/", type: "docs", desc: "OpenAPI specs, API versioning policy, webhook schemas" },
        { name: "runbooks/", type: "docs", desc: "Operational runbooks: scraper failures, OCR errors, deployment, scaling" },
        { name: "onboarding/", type: "docs", desc: "New contributor setup guide, dev environment, coding standards" },
        { name: "CONVENTIONS.md", type: "file", desc: "AI coding conventions — read this first" },
      ],
    },
    {
      name: "tools/",
      type: "dir",
      desc: "Developer tooling and scripts",
      children: [
        { name: "scripts/", type: "tools", desc: "One-off scripts: seed DB, backfill OCR, export data, test scrapers" },
        { name: "municipality-configs/", type: "tools", desc: "Per-municipality scraper configs (YAML/JSON) — the 'data' of the scraper" },
      ],
    },
    {
      name: ".github/",
      type: "dir",
      desc: "CI/CD workflows with path filters",
      children: [
        { name: "workflows/", type: "ci", desc: "One workflow per service, triggered only when relevant paths change" },
        { name: "CODEOWNERS", type: "file", desc: "Code ownership rules per directory" },
      ],
    },
    { name: "turbo.json", type: "file", desc: "Turborepo config — orchestrates builds, tests, deploys across packages" },
    { name: "CLAUDE.md", type: "file", desc: "Root-level Claude Code instructions — project context, architecture overview, conventions" },
    { name: "pnpm-workspace.yaml", type: "file", desc: "Defines TypeScript workspace packages" },
    { name: "pyproject.toml", type: "file", desc: "Python workspace root — shared deps, linting config" },
  ],
};

const WHY_MONOREPO = [
  { q: "But I want separate repos per module?", a: "You get the same logical separation via directories + path-filtered CI. Each services/ dir IS effectively its own repo — separate Dockerfile, separate deploy, separate tests. But AI can see everything at once, and shared types stay in sync automatically." },
  { q: "What if I hire someone for just the scraper?", a: "Use GitHub CODEOWNERS to assign ownership per directory. They only need write access to services/scraper/ — PRs touching other dirs require your approval. They see the full context but can only change their area." },
  { q: "Won't the repo get huge?", a: "Not for years. ProtokolBase is ~10-15 services max. Google, Meta, and Stripe run monorepos with 10,000+ engineers. At your scale (1-5 people), a monorepo is strictly superior." },
  { q: "Can I extract to separate repos later?", a: "Yes — trivially. Each directory is self-contained with its own package.json or pyproject.toml. When a service needs its own repo (e.g., open-sourcing scraper configs), just git filter-branch it out." },
  { q: "Does Claude Code work well with monorepos?", a: "It's the ideal setup. Claude Code reads CLAUDE.md at the root for project context, sees all shared types, understands cross-service contracts, and can make coordinated changes across the frontend and 3 backend services in a single session." },
];

const CICD_WORKFLOWS = [
  {
    name: "deploy-scraper.yml", paths: ["services/scraper/**", "packages/shared-types/**"],
    steps: ["Checkout", "Setup Python", "Install deps (uv)", "Run pytest", "modal deploy --env prod"],
    trigger: "push to main + path match",
  },
  {
    name: "deploy-ocr.yml", paths: ["services/ocr/**", "packages/shared-types/**"],
    steps: ["Checkout", "Setup Python", "Install deps", "Run pytest", "modal deploy --env prod"],
    trigger: "push to main + path match",
  },
  {
    name: "deploy-ai-parser.yml", paths: ["services/ai-parser/**", "packages/shared-types/**"],
    steps: ["Checkout", "Setup Python", "Install deps", "Run pytest", "modal deploy --env prod"],
    trigger: "push to main + path match",
  },
  {
    name: "deploy-api.yml", paths: ["services/api/**", "packages/shared-types/**", "packages/db/**"],
    steps: ["Checkout", "Setup Python", "Install deps", "Run pytest", "modal deploy --env prod"],
    trigger: "push to main + path match",
  },
  {
    name: "deploy-web.yml", paths: ["apps/web/**", "packages/**"],
    steps: ["Checkout", "Setup Node 20", "pnpm install", "Type check", "vitest", "Vercel deploys via Git"],
    trigger: "push to main (Vercel auto-deploy)",
  },
  {
    name: "migrate-db.yml", paths: ["packages/db/**"],
    steps: ["Checkout", "Setup Node", "pnpm install", "drizzle-kit push (staging)", "smoke test", "drizzle-kit push (prod)"],
    trigger: "push to main + path match",
  },
  {
    name: "pr-check.yml", paths: ["**"],
    steps: ["Checkout", "turbo run lint typecheck test --filter=...affected"],
    trigger: "all pull requests",
  },
];

const MODULE_CONTRACTS = [
  { from: "Scraper", to: "OCR", contract: "NewDocumentEvent", desc: "Scraper finds new PDF → publishes event with pdf_path, municipality_id, source_url", format: "Pydantic model in shared-types" },
  { from: "OCR", to: "AI Parser", contract: "ExtractedTextEvent", desc: "OCR completes → publishes event with document_id, text_content, ocr_method, confidence", format: "Pydantic model in shared-types" },
  { from: "AI Parser", to: "Database", contract: "StructuredDocument", desc: "AI extraction done → writes structured agenda items, entities, financials to DB", format: "Drizzle schema in packages/db" },
  { from: "AI Parser", to: "Notifications", contract: "ContentChangeEvent", desc: "New content triggers → notification engine checks user alert rules for matches", format: "Pydantic model in shared-types" },
  { from: "API", to: "Frontend", contract: "REST API / OpenAPI", desc: "Typed API endpoints — Zod on frontend, Pydantic on backend, generated from shared spec", format: "OpenAPI spec in docs/api-spec" },
  { from: "Frontend", to: "Database", contract: "Drizzle Queries", desc: "Server Components query DB directly via Drizzle (read-only for public pages)", format: "Query helpers in packages/db" },
];

const CLAUDE_MD_CONTENT = `# ProtokolBase

## What is this?
Swiss municipal protocol aggregation platform. Scrapes 2,100+
municipality websites, processes PDFs (OCR + AI), extracts
structured data (decisions, entities, financials), serves via
searchable web interface with notifications.

## Architecture
- apps/web: Next.js 15, App Router, Tailwind, Vercel
- services/: Python services on Modal (serverless)
- packages/db: Drizzle ORM, Neon Postgres
- packages/shared-types: Pydantic + TypeScript types

## Key conventions
- All inter-service contracts in packages/shared-types
- Python: Pydantic v2, async, uv for deps
- TypeScript: strict mode, Zod for runtime validation
- Every service has its own pyproject.toml + tests/
- DB migrations via Drizzle Kit only
- Municipality scraper configs: YAML in tools/

## Data flow
Scraper → OCR Pipeline → AI Parser → Database → API → Frontend

## When editing a service
1. Check packages/shared-types for its contract
2. Run tests: cd services/<name> && pytest
3. Check docs/architecture/ for the relevant ADR
4. If changing a contract, update ALL consumers

## Don't
- Add deps to root — add to the specific package/service
- Hardcode municipality URLs — use tools/municipality-configs
- Bypass OCR tier logic — always route through pipeline
- Store secrets in code — use Modal Secrets / Vercel env vars`;

const LEVELS_TOOLING = [
  {
    level: "Level 0 — Foundation", when: "Week 1-2", color: "#94A3B8",
    items: [
      { name: "Monorepo setup", desc: "Turborepo + pnpm workspace + Python workspace, CLAUDE.md, CI skeleton", effort: "1 day", critical: true },
      { name: "Database schema v1", desc: "packages/db: municipalities, documents, scrape_runs tables via Drizzle", effort: "1 day", critical: true },
      { name: "Neon project + branches", desc: "Production branch, dev branch, connection strings in secrets", effort: "2 hours", critical: true },
      { name: "CI/CD skeleton", desc: "GitHub Actions with path filters for each service + PR checks", effort: "half day", critical: true },
      { name: "Shared types v1", desc: "Pydantic models: NewDocumentEvent, ExtractedTextEvent", effort: "half day", critical: true },
    ],
  },
  {
    level: "Level 1 — Document Archive", when: "Week 3-10", color: "#3B82F6",
    items: [
      { name: "Scraper service", desc: "services/scraper: framework + 10 adapters, scheduler, health endpoint", effort: "3 weeks", critical: true },
      { name: "Municipality configs", desc: "tools/municipality-configs: YAML per municipality (URL, selectors, schedule)", effort: "ongoing", critical: true },
      { name: "OCR pipeline", desc: "services/ocr: PyMuPDF → Mistral → Azure fallback routing", effort: "2 weeks", critical: true },
      { name: "Storage setup", desc: "Cloudflare R2 bucket, PDF upload/download helpers", effort: "1 day", critical: true },
      { name: "Web app v1", desc: "apps/web: public browse, municipality pages, PDF viewer, basic search", effort: "2 weeks", critical: true },
      { name: "Admin panel v1", desc: "apps/web/(admin): municipality manager, PDF upload, pipeline monitor", effort: "1 week", critical: true },
    ],
  },
  {
    level: "Level 2 — Structured Intelligence", when: "Week 11-18", color: "#8B5CF6",
    items: [
      { name: "AI parser service", desc: "services/ai-parser: LLM extraction, NER, topic classification, confidence", effort: "4 weeks", critical: true },
      { name: "Review tool", desc: "apps/web/(admin): split-view PDF + structured data, inline editing", effort: "2 weeks", critical: true },
      { name: "DB schema v2", desc: "packages/db: agenda_items, entities, financials + search indexes", effort: "1 week", critical: true },
      { name: "Search upgrade", desc: "Full-text + faceted filtering by topic, entity, canton, date", effort: "1 week", critical: false },
    ],
  },
  {
    level: "Level 3 — Monetisation", when: "Week 19-26", color: "#EC4899",
    items: [
      { name: "Auth + billing", desc: "Clerk + Stripe in apps/web. Free/Pro/Business tiers", effort: "1 week", critical: true },
      { name: "Notification service", desc: "services/notifications: rule engine, email digest, Resend", effort: "2 weeks", critical: true },
      { name: "User dashboard", desc: "apps/web/(dashboard): saved searches, watchlists, settings", effort: "2 weeks", critical: true },
      { name: "API service v1", desc: "services/api: internal endpoints + auth middleware", effort: "1 week", critical: true },
    ],
  },
];

const sty = {
  card: { background: "#111827", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden" },
  headerCell: { textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#64748B", borderBottom: "1px solid #1E293B", letterSpacing: 0.5, textTransform: "uppercase" },
  cell: { padding: "10px 14px", fontSize: 12, color: "#CBD5E1", borderBottom: "1px solid #0A0F1C" },
  mono: { fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace" },
};

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const typeColors = { root: "#F59E0B", dir: "#64748B", app: "#22C55E", service: "#3B82F6", package: "#A78BFA", docs: "#F472B6", tools: "#F59E0B", ci: "#94A3B8", file: "#475569" };
  const techBadge = node.tech ? <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: "#1E293B", color: "#94A3B8", marginLeft: 6 }}>{node.tech}</span> : null;
  const deployBadge = node.deploy ? <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: node.deploy === "Vercel" ? "#00000033" : "#6366F122", color: node.deploy === "Vercel" ? "#F8FAFC" : "#818CF8", marginLeft: 4 }}>→ {node.deploy}</span> : null;

  return (
    <div>
      <div onClick={() => hasChildren && setOpen(!open)} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "4px 0", paddingLeft: depth * 20, cursor: hasChildren ? "pointer" : "default" }}>
        <span style={{ color: "#475569", fontSize: 12, width: 14, textAlign: "center", flexShrink: 0 }}>{hasChildren ? (open ? "▾" : "▸") : " "}</span>
        <span style={{ fontSize: 12, fontWeight: node.type === "dir" || node.type === "root" ? 700 : 500, color: typeColors[node.type] || "#CBD5E1", ...sty.mono }}>{node.name}</span>
        {techBadge}{deployBadge}
        {node.desc && <span style={{ fontSize: 10, color: "#64748B", marginLeft: 8, fontStyle: "italic" }}>{node.desc}</span>}
      </div>
      {open && hasChildren && node.children.map((child, i) => <TreeNode key={i} node={child} depth={depth + 1} />)}
    </div>
  );
}

export default function WorkspaceArchitecture() {
  const [view, setView] = useState("structure");

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", background: "#0A0F1C", color: "#E2E8F0", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderBottom: "1px solid #1E3A5F", padding: "28px 32px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#8B5CF6", fontWeight: 700 }}>PROTOKOLBASE</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 8px", color: "#F8FAFC" }}>Workspace & Repository Architecture</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>Monorepo with independent deployments, AI-native workflow, shared contracts</p>
        </div>
      </div>

      <div style={{ background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 0 }}>
          {[
            { id: "structure", label: "Repo Structure" },
            { id: "why", label: "Why Monorepo" },
            { id: "contracts", label: "Module Contracts" },
            { id: "cicd", label: "CI/CD Pipelines" },
            { id: "ai", label: "AI Workflow" },
            { id: "roadmap", label: "Build Roadmap" },
          ].map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              background: "none", border: "none", padding: "12px 16px", cursor: "pointer",
              fontSize: 12, fontWeight: 600, color: view === t.id ? "#8B5CF6" : "#64748B",
              borderBottom: view === t.id ? "2px solid #8B5CF6" : "2px solid transparent",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px 60px" }}>

        {view === "structure" && (
          <div>
            <div style={{ ...sty.card, padding: "20px 24px", marginBottom: 24, borderColor: "#8B5CF644" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>💡</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#A78BFA", margin: 0 }}>One monorepo, not separate repos</h3>
              </div>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>
                You want logical separation with operational unity. A <strong style={{ color: "#F8FAFC" }}>monorepo with path-filtered CI</strong> gives you both: each service deploys independently (triggered only when its code changes), but Claude Code sees the full system, shared types stay in sync, and you avoid the #1 polyrepo killer — contracts drifting out of sync across repos.
              </p>
            </div>

            <div style={{ ...sty.card, padding: "16px 20px", marginBottom: 24 }}>
              <div style={{ borderBottom: "1px solid #1E293B", paddingBottom: 10, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC" }}>📁 Repository Structure</span>
                <div style={{ display: "flex", gap: 10, fontSize: 10 }}>
                  <span style={{ color: "#22C55E" }}>● App</span>
                  <span style={{ color: "#3B82F6" }}>● Service</span>
                  <span style={{ color: "#A78BFA" }}>● Package</span>
                  <span style={{ color: "#F472B6" }}>● Docs</span>
                  <span style={{ color: "#F59E0B" }}>● Tools</span>
                </div>
              </div>
              <TreeNode node={REPO_STRUCTURE} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {[
                { dir: "apps/web/", color: "#22C55E", title: "The frontend monolith", desc: "One Next.js app with route groups: (public) for browse/search, (dashboard) for logged-in users, (admin) for internal tooling. All share the same deployment but are logically separate. Admin routes protected by role middleware." },
                { dir: "services/", color: "#3B82F6", title: "Independent Python services", desc: "Each service is a Modal app with its own pyproject.toml, tests/, and deploy workflow. They communicate via DB writes/reads or direct Modal function calls — never HTTP between services. Each deploys independently." },
                { dir: "packages/shared-types/", color: "#A78BFA", title: "The contract layer (critical)", desc: "Pydantic models (Python) and Zod schemas (TypeScript) from the same source. When scraper emits NewDocumentEvent, OCR knows exactly what to expect. This is the most important directory in the repo." },
                { dir: "packages/db/", color: "#A78BFA", title: "Single source of truth for data", desc: "Drizzle ORM schema defining all tables. Frontend (Server Components) and services (direct Postgres) both use these types. Migrations run via dedicated CI workflow triggered only when this dir changes." },
                { dir: "docs/", color: "#F472B6", title: "Living documentation", desc: "ADRs for every major decision. API specs. Runbooks for ops. CLAUDE.md at the root gives AI the project context it needs. This is your institutional memory." },
                { dir: "tools/municipality-configs/", color: "#F59E0B", title: "Data as code", desc: "YAML per municipality: URL, CSS selectors, schedule, CMS type. Adding a new municipality = adding a YAML file and pushing to Git. Scraper reads these configs at runtime." },
              ].map((item, i) => (
                <div key={i} style={sty.card}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E293B" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.color, ...sty.mono }}>{item.dir}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#F8FAFC", marginLeft: 8 }}>{item.title}</span>
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "why" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: "0 0 20px" }}>Why monorepo beats separate repos for your situation</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              <div style={{ ...sty.card, borderColor: "#22C55E44" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E293B", background: "#22C55E08" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#22C55E" }}>✅ Monorepo (recommended)</div>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  {[
                    "AI sees the full codebase — cross-module changes in one session",
                    "Shared types always in sync — change a Pydantic model, all consumers update",
                    "Atomic PRs — 'add zoning topic to parser + frontend' = 1 PR",
                    "Single CLAUDE.md gives AI complete project context",
                    "Path-filtered CI still deploys each service independently",
                    "One git log tells the full story of what changed and why",
                    "Refactoring across module boundaries is trivial",
                    "No version matrix hell between 7 repos",
                  ].map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#CBD5E1", padding: "4px 0", display: "flex", gap: 8, lineHeight: 1.5 }}>
                      <span style={{ color: "#22C55E", flexShrink: 0 }}>+</span> {p}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ ...sty.card, borderColor: "#EF444444" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E293B", background: "#EF444408" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>❌ Separate repos (avoid for now)</div>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  {[
                    "AI can only see one repo at a time — can't make coordinated changes",
                    "Shared types drift — scraper publishes v2, parser still expects v1",
                    "Cross-module features need PRs to 3-4 repos in the right order",
                    "No single CLAUDE.md — AI lacks system context in each repo",
                    "Need private package registry (npm/PyPI) for shared types",
                    "Debugging requires correlating logs across repo boundaries",
                    "Contract changes require release cycles and semver coordination",
                    "7 repos × 3 environments = 21 things to manage",
                  ].map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#CBD5E1", padding: "4px 0", display: "flex", gap: 8, lineHeight: 1.5 }}>
                      <span style={{ color: "#EF4444", flexShrink: 0 }}>−</span> {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={sty.card}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E293B" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>Common concerns</span>
              </div>
              {WHY_MONOREPO.map((item, i) => (
                <div key={i} style={{ padding: "14px 18px", borderBottom: i < WHY_MONOREPO.length - 1 ? "1px solid #0F172A" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", marginBottom: 6 }}>{item.q}</div>
                  <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "contracts" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: "0 0 8px" }}>Module Contracts — How services interlock</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 20px" }}>All defined in <span style={{ ...sty.mono, color: "#A78BFA" }}>packages/shared-types/</span> — the single source of truth</p>

            <div style={{ ...sty.card, padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
                {[
                  { label: "Scraper", icon: "🕷️", color: "#EF4444" },
                  { label: "→ NewDocEvent", arrow: true },
                  { label: "OCR", icon: "📄", color: "#F59E0B" },
                  { label: "→ ExtractedText", arrow: true },
                  { label: "AI Parser", icon: "🧠", color: "#8B5CF6" },
                  { label: "→ StructuredDoc", arrow: true },
                  { label: "Database", icon: "🗃️", color: "#3B82F6" },
                  { label: "→ API/Queries", arrow: true },
                  { label: "Frontend", icon: "🖥️", color: "#22C55E" },
                ].map((step, i) =>
                  step.arrow ? (
                    <div key={i} style={{ padding: "0 6px", textAlign: "center" }}>
                      <div style={{ color: "#334155", fontSize: 14 }}>→</div>
                      <div style={{ fontSize: 8, color: "#475569", ...sty.mono }}>{step.label.replace("→ ", "")}</div>
                    </div>
                  ) : (
                    <div key={i} style={{ background: `${step.color}18`, border: `1px solid ${step.color}44`, borderRadius: 8, padding: "10px 16px", textAlign: "center", minWidth: 80 }}>
                      <div style={{ fontSize: 18, marginBottom: 2 }}>{step.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: step.color }}>{step.label}</div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div style={sty.card}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["From", "To", "Contract", "Description", "Defined In"].map((h) => <th key={h} style={sty.headerCell}>{h}</th>)}</tr></thead>
                <tbody>
                  {MODULE_CONTRACTS.map((c, i) => (
                    <tr key={i}>
                      <td style={{ ...sty.cell, fontWeight: 600, color: "#F8FAFC" }}>{c.from}</td>
                      <td style={{ ...sty.cell, fontWeight: 600, color: "#F8FAFC" }}>{c.to}</td>
                      <td style={sty.cell}><span style={{ ...sty.mono, fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>{c.contract}</span></td>
                      <td style={{ ...sty.cell, fontSize: 11, maxWidth: 300 }}>{c.desc}</td>
                      <td style={sty.cell}><span style={{ fontSize: 10, color: "#64748B", ...sty.mono }}>{c.format}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ ...sty.card, marginTop: 20 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E293B" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>Example: packages/shared-types/events.py</span>
              </div>
              <pre style={{ padding: "16px 20px", fontSize: 11, color: "#94A3B8", lineHeight: 1.6, margin: 0, overflow: "auto", ...sty.mono }}>{`from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class OcrMethod(str, Enum):
    PYMUPDF = "pymupdf"
    MISTRAL = "mistral"
    AZURE = "azure"

class NewDocumentEvent(BaseModel):
    """Scraper → OCR Pipeline"""
    municipality_id: int
    pdf_storage_path: str     # R2 key
    source_url: str | None
    detected_date: datetime | None
    page_count: int
    scrape_run_id: int

class ExtractedTextEvent(BaseModel):
    """OCR → AI Parser"""
    document_id: int
    text_content: str
    ocr_method: OcrMethod
    confidence: float         # 0-100
    page_texts: list[str]
    tables_html: list[str]
    language: str             # de/fr/it

class StructuredAgendaItem(BaseModel):
    """AI Parser output"""
    item_number: str
    title: str
    topic: str
    decision: str | None
    votes: str | None
    entities: list[str]
    financials: str | None
    confidence: float
    source_page: int
    raw_text: str`}</pre>
            </div>
          </div>
        )}

        {view === "cicd" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: "0 0 8px" }}>CI/CD — Path-filtered independent deployments</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 20px" }}>Each service deploys only when its code changes. Changes to <span style={{ ...sty.mono, color: "#A78BFA" }}>shared-types</span> trigger all downstream services.</p>

            {CICD_WORKFLOWS.map((wf, i) => (
              <div key={i} style={{ ...sty.card, marginBottom: 12 }}>
                <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ ...sty.mono, fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>{wf.name}</span>
                    <span style={{ fontSize: 10, color: "#64748B" }}>{wf.trigger}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {wf.paths.map((p, j) => (
                      <span key={j} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: p.includes("shared") || p.includes("packages") ? "#A78BFA22" : "#1E293B", color: p.includes("shared") || p.includes("packages") ? "#A78BFA" : "#94A3B8", ...sty.mono, border: "1px solid #33415544" }}>{p}</span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "8px 16px 12px", display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                  {wf.steps.map((step, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#0F172A", color: "#CBD5E1", border: "1px solid #1E293B" }}>{step}</span>
                      {j < wf.steps.length - 1 && <span style={{ color: "#334155", fontSize: 10 }}>→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ ...sty.card, marginTop: 20 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E293B" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>Example: .github/workflows/deploy-scraper.yml</span>
              </div>
              <pre style={{ padding: "16px 20px", fontSize: 11, color: "#94A3B8", lineHeight: 1.5, margin: 0, overflow: "auto", ...sty.mono }}>{`name: Deploy Scraper
on:
  push:
    branches: [main]
    paths:
      - 'services/scraper/**'
      - 'packages/shared-types/**'
      - 'tools/municipality-configs/**'

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      
      - name: Install & test
        working-directory: services/scraper
        run: |
          uv sync
          uv run pytest tests/ -v
      
      - name: Deploy to Modal
        run: |
          pip install modal
          modal deploy services/scraper/app.py \\
            --env production
        env:
          MODAL_TOKEN_ID: \${{ secrets.MODAL_TOKEN_ID }}
          MODAL_TOKEN_SECRET: \${{ secrets.MODAL_TOKEN_SECRET }}`}</pre>
            </div>
          </div>
        )}

        {view === "ai" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: "0 0 20px" }}>AI-Assisted Development Workflow</h2>

            <div style={{ ...sty.card, marginBottom: 24, borderColor: "#F59E0B44" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E293B", background: "#F59E0B08" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>CLAUDE.md — The most important file in your repo</span>
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Claude Code reads this automatically when entering the project. It gives AI the full context to make good decisions across modules.</div>
              </div>
              <pre style={{ padding: "16px 20px", fontSize: 11, color: "#94A3B8", lineHeight: 1.5, margin: 0, overflow: "auto", ...sty.mono, maxHeight: 280 }}>{CLAUDE_MD_CONTENT}</pre>
            </div>

            <div style={{ ...sty.card, marginBottom: 24 }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E293B" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>Typical AI development session</span>
              </div>
              {[
                { step: 1, title: "Open Claude Code in repo root", desc: "AI reads CLAUDE.md, understands the full architecture, all module contracts, and conventions.", icon: "🚀", color: "#F59E0B" },
                { step: 2, title: "Describe the feature across modules", desc: "e.g. 'Add mobility topic. Update AI parser taxonomy, frontend filter dropdown, and notification templates.' Claude Code sees all three modules.", icon: "💬", color: "#3B82F6" },
                { step: 3, title: "AI edits shared-types first", desc: "Updates the Pydantic TopicEnum in packages/shared-types — this is the contract. All services now know about the new topic.", icon: "📐", color: "#A78BFA" },
                { step: 4, title: "AI updates each consumer", desc: "Updates ai-parser prompts, frontend filter component, and notification templates in one session. Everything stays in sync.", icon: "🔧", color: "#22C55E" },
                { step: 5, title: "AI runs tests across modules", desc: "Runs pytest in services/ai-parser, vitest in apps/web — catches contract mismatches before you push.", icon: "✅", color: "#22C55E" },
                { step: 6, title: "Single PR, single review", desc: "One atomic PR across 4 directories. Path-filtered CI runs only affected pipelines. Merge once, all services deploy.", icon: "🚢", color: "#EC4899" },
              ].map((s) => (
                <div key={s.step} style={{ display: "flex", gap: 14, padding: "14px 18px", borderBottom: "1px solid #0F172A" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${s.color}22`, border: `1px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", marginBottom: 2 }}>Step {s.step}: {s.title}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={sty.card}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E293B" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>Tips for AI-native development</span>
              </div>
              <div style={{ padding: "14px 18px" }}>
                {[
                  { tip: "Keep CLAUDE.md updated", detail: "Every ADR, new service, convention change — update CLAUDE.md. This is your AI's onboarding doc." },
                  { tip: "docs/CONVENTIONS.md for code style", detail: "Naming patterns, error handling, logging format. AI follows these consistently across all modules." },
                  { tip: "Write ADRs for major decisions", detail: "When you decide Mistral over Azure for OCR, save reasoning in docs/architecture/adr-003-ocr.md. Future AI sessions reference it." },
                  { tip: "Structured commit messages", detail: "Convention: 'feat(scraper): add Thun adapter' — makes git log AI-parseable for context." },
                  { tip: "Seed data in the repo", detail: "packages/db/seed/ with realistic test protocols. AI can test its changes against real-looking data." },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: i < 4 ? "1px solid #0F172A" : "none" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 2 }}>{item.tip}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "roadmap" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: "0 0 20px" }}>Build Roadmap — What to set up when</h2>
            {LEVELS_TOOLING.map((level, li) => (
              <div key={li} style={{ ...sty.card, marginBottom: 20, borderColor: `${level.color}44` }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center", background: `${level.color}08` }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: level.color }}>{level.level}</span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{level.when}</span>
                </div>
                <div style={{ padding: "8px 12px" }}>
                  {level.items.map((item, ii) => (
                    <div key={ii} style={{ display: "flex", gap: 12, padding: "10px 8px", borderBottom: ii < level.items.length - 1 ? "1px solid #0F172A" : "none", alignItems: "flex-start" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.critical ? "#22C55E" : "#334155", marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC" }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600, flexShrink: 0, ...sty.mono }}>{item.effort}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
