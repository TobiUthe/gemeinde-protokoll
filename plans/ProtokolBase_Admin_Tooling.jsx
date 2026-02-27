import { useState, useEffect } from "react";

// ─── Mock Data ───
const MUNICIPALITIES = [
  { id: 1, name: "Uster", canton: "ZH", language: "de", url: "https://www.uster.ch/protokolle", cms: "CMI", status: "active", lastScrape: "2026-02-27 08:14", docs: 47, frequency: "weekly", tier: "T1" },
  { id: 2, name: "Wädenswil", canton: "ZH", language: "de", url: "https://www.waedenswil.ch/gemeinderat/protokolle", cms: "Dialog", status: "active", lastScrape: "2026-02-26 22:30", docs: 32, frequency: "biweekly", tier: "T1" },
  { id: 3, name: "Thun", canton: "BE", language: "de", url: "https://www.thun.ch/politik/stadtrat/protokolle", cms: "Nest", status: "error", lastScrape: "2026-02-25 04:10", docs: 28, frequency: "weekly", tier: "T1" },
  { id: 4, name: "Morges", canton: "VD", language: "fr", url: "https://www.morges.ch/pv-conseil", cms: "Unknown", status: "pending", lastScrape: null, docs: 0, frequency: "monthly", tier: "T2" },
  { id: 5, name: "Bellinzona", canton: "TI", language: "it", url: "", cms: "Unknown", status: "draft", lastScrape: null, docs: 0, frequency: "monthly", tier: "T2" },
  { id: 6, name: "Adliswil", canton: "ZH", language: "de", url: "https://www.adliswil.ch/gemeinderatsprotokolle", cms: "CMI", status: "active", lastScrape: "2026-02-27 06:45", docs: 51, frequency: "weekly", tier: "T1" },
  { id: 7, name: "Frauenfeld", canton: "TG", language: "de", url: "https://www.frauenfeld.ch/protokolle", cms: "Dialog", status: "active", lastScrape: "2026-02-26 18:00", docs: 39, frequency: "biweekly", tier: "T1" },
];

const DOCUMENTS = [
  { id: 101, municipality: "Uster", date: "2026-02-20", title: "Gemeinderatssitzung #4/2026", pages: 14, pdfType: "digital", ocrMethod: "pymupdf", aiStatus: "parsed", reviewStatus: "approved", confidence: 94, items: 8 },
  { id: 102, municipality: "Uster", date: "2026-02-06", title: "Gemeinderatssitzung #3/2026", pages: 22, pdfType: "digital", ocrMethod: "pymupdf", aiStatus: "parsed", reviewStatus: "approved", confidence: 91, items: 12 },
  { id: 103, municipality: "Thun", date: "2026-02-13", title: "Stadtratssitzung 13.02.2026", pages: 18, pdfType: "scanned", ocrMethod: "mistral", aiStatus: "parsed", reviewStatus: "pending", confidence: 78, items: 9 },
  { id: 104, municipality: "Wädenswil", date: "2026-02-24", title: "Protokoll GR Sitzung Feb 2026", pages: 11, pdfType: "digital", ocrMethod: "pymupdf", aiStatus: "parsed", reviewStatus: "pending", confidence: 88, items: 6 },
  { id: 105, municipality: "Adliswil", date: "2026-02-20", title: "Gemeinderatssitzung 20.02.2026", pages: 16, pdfType: "scanned", ocrMethod: "mistral", aiStatus: "error", reviewStatus: "needs_review", confidence: 42, items: 0 },
  { id: 106, municipality: "Frauenfeld", date: "2026-02-18", title: "Gemeinderat Protokoll", pages: 9, pdfType: "digital", ocrMethod: "pymupdf", aiStatus: "queued", reviewStatus: "pending", confidence: null, items: null },
];

const AGENDA_ITEMS = [
  { id: 1, docId: 103, number: "1", title: "Genehmigung des Protokolls vom 30.01.2026", type: "procedural", decision: "Genehmigt", votes: "Einstimmig", confidence: 92, entities: [], financials: null },
  { id: 2, docId: 103, number: "2", title: "Quartierplan Allmendstrasse: Änderung Zonenplan", type: "zoning", decision: "Angenommen mit Auflagen", votes: "5:2", confidence: 85, entities: ["Implenia AG", "Quartierverein Allmend"], financials: "CHF 2.4 Mio" },
  { id: 3, docId: 103, number: "3", title: "Kredit für Sanierung Schulhaus Dürrenast", type: "infrastructure", decision: "Bewilligt", votes: "6:1", confidence: 71, entities: ["Schulhaus Dürrenast", "Bildungsdirektion"], financials: "CHF 8.7 Mio" },
  { id: 4, docId: 103, number: "4", title: "Interpellation betreffend Velowegnetz Innenstadt", type: "mobility", decision: "Beantwortung zur Kenntnis genommen", votes: "Kenntnisnahme", confidence: 88, entities: ["Pro Velo Thun"], financials: null },
  { id: 5, docId: 103, number: "5", title: "Bericht Energiestadt-Audit 2025", type: "environment", decision: "Zur Kenntnis genommen", votes: "Einstimmig", confidence: 64, entities: ["Energiestadt", "EnergieSchweiz"], financials: "CHF 150'000" },
];

const DB_TABLES = [
  { name: "municipalities", rows: 207, cols: ["id", "name", "canton", "language", "url", "cms_type", "scrape_frequency", "status", "tier", "created_at", "updated_at"] },
  { name: "documents", rows: 1843, cols: ["id", "municipality_id", "title", "date", "pdf_path", "pdf_type", "ocr_method", "page_count", "ai_status", "review_status", "confidence", "created_at"] },
  { name: "agenda_items", rows: 12405, cols: ["id", "document_id", "item_number", "title", "type", "decision", "votes", "confidence", "raw_text", "entities_json", "financials"] },
  { name: "entities", rows: 3891, cols: ["id", "name", "type", "first_seen", "mention_count", "municipality_ids"] },
  { name: "scrape_runs", rows: 8420, cols: ["id", "municipality_id", "started_at", "finished_at", "status", "docs_found", "docs_new", "error_message"] },
  { name: "users", rows: 12, cols: ["id", "email", "role", "plan", "created_at", "last_login"] },
  { name: "notifications", rows: 340, cols: ["id", "user_id", "rule_json", "last_triggered", "match_count", "active"] },
];

const PIPELINE_STATS = {
  scraperQueue: 14, ocrQueue: 6, aiQueue: 3, reviewQueue: 18,
  scrapersHealthy: 189, scrapersError: 11, scrapersPending: 7,
  todayDocs: 23, todayPages: 412, todayOcrCost: 0.08,
};

// ─── Helpers ───
const statusBadge = (status) => {
  const map = {
    active: { bg: "#22C55E22", color: "#22C55E", border: "#22C55E44" },
    error: { bg: "#EF444422", color: "#EF4444", border: "#EF444444" },
    pending: { bg: "#F59E0B22", color: "#F59E0B", border: "#F59E0B44" },
    draft: { bg: "#64748B22", color: "#94A3B8", border: "#64748B44" },
    approved: { bg: "#22C55E22", color: "#22C55E", border: "#22C55E44" },
    needs_review: { bg: "#EF444422", color: "#EF4444", border: "#EF444444" },
    parsed: { bg: "#3B82F622", color: "#60A5FA", border: "#3B82F644" },
    queued: { bg: "#8B5CF622", color: "#A78BFA", border: "#8B5CF644" },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {status.replace("_", " ")}
    </span>
  );
};

const confidenceBadge = (c) => {
  if (c === null) return <span style={{ color: "#475569", fontSize: 11 }}>—</span>;
  const color = c >= 85 ? "#22C55E" : c >= 70 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48, height: 5, borderRadius: 3, background: "#1E293B", overflow: "hidden" }}>
        <div style={{ width: `${c}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28 }}>{c}%</span>
    </div>
  );
};

// ─── Shared styles ───
const cardStyle = { background: "#111827", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden" };
const headerCellStyle = { textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#64748B", borderBottom: "1px solid #1E293B", letterSpacing: 0.5, textTransform: "uppercase" };
const cellStyle = { padding: "10px 14px", fontSize: 12, color: "#CBD5E1", borderBottom: "1px solid #0F172A" };
const inputStyle = { background: "#0A0F1C", border: "1px solid #334155", borderRadius: 6, padding: "8px 12px", color: "#E2E8F0", fontSize: 12, fontFamily: "inherit", width: "100%", outline: "none" };
const btnPrimary = { background: "#3B82F6", color: "#FFF", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const btnGhost = { background: "transparent", color: "#94A3B8", border: "1px solid #334155", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" };

export default function AdminTooling() {
  const [nav, setNav] = useState("pipeline");
  const [editingMuni, setEditingMuni] = useState(null);
  const [reviewDoc, setReviewDoc] = useState(103);
  const [editingItem, setEditingItem] = useState(null);
  const [dbTable, setDbTable] = useState("municipalities");
  const [dbEdit, setDbEdit] = useState(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [addMuniMode, setAddMuniMode] = useState(false);

  const NAV_ITEMS = [
    { id: "pipeline", label: "Pipeline Monitor", icon: "⚡" },
    { id: "municipalities", label: "Municipalities", icon: "🏛️" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "review", label: "AI Review", icon: "🔍" },
    { id: "database", label: "Database", icon: "🗃️" },
  ];

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace", background: "#060A14", color: "#E2E8F0", minHeight: "100vh", display: "flex" }}>
      {/* ── Sidebar ── */}
      <div style={{ width: 220, background: "#0A0F1C", borderRight: "1px solid #1E293B", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#475569", fontWeight: 700 }}>PROTOKOLBASE</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#F59E0B", marginTop: 2 }}>Admin Console</div>
        </div>
        <div style={{ flex: 1, padding: "4px 8px" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setNav(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
              background: nav === item.id ? "#1E293B" : "transparent",
              border: nav === item.id ? "1px solid #334155" : "1px solid transparent",
              borderRadius: 6, cursor: "pointer", marginBottom: 2,
              color: nav === item.id ? "#F8FAFC" : "#64748B", fontSize: 12, fontWeight: 600,
              textAlign: "left", fontFamily: "inherit",
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        {/* Quick stats in sidebar */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #1E293B" }}>
          <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginBottom: 8 }}>TODAY</div>
          {[
            { label: "Docs processed", value: PIPELINE_STATS.todayDocs, color: "#22C55E" },
            { label: "Pages OCR'd", value: PIPELINE_STATS.todayPages, color: "#60A5FA" },
            { label: "OCR cost", value: `$${PIPELINE_STATS.todayOcrCost}`, color: "#F59E0B" },
            { label: "Review queue", value: PIPELINE_STATS.reviewQueue, color: "#EF4444" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10 }}>
              <span style={{ color: "#64748B" }}>{s.label}</span>
              <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 28px" }}>

        {/* ═══════ PIPELINE MONITOR ═══════ */}
        {nav === "pipeline" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: "0 0 20px" }}>⚡ Pipeline Monitor</h2>

            {/* Queue cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Scraper Queue", value: PIPELINE_STATS.scraperQueue, icon: "🕷️", color: "#EF4444", sub: `${PIPELINE_STATS.scrapersHealthy} healthy / ${PIPELINE_STATS.scrapersError} errors` },
                { label: "OCR Queue", value: PIPELINE_STATS.ocrQueue, icon: "📄", color: "#F59E0B", sub: "Mistral Batch API" },
                { label: "AI Parse Queue", value: PIPELINE_STATS.aiQueue, icon: "🧠", color: "#8B5CF6", sub: "Structured extraction" },
                { label: "Human Review", value: PIPELINE_STATS.reviewQueue, icon: "👁️", color: "#EC4899", sub: "Low confidence items" },
              ].map((q, i) => (
                <div key={i} style={{ ...cardStyle, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>{q.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: q.value > 10 ? q.color : "#F8FAFC" }}>{q.value}</div>
                    </div>
                    <span style={{ fontSize: 22 }}>{q.icon}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 6 }}>{q.sub}</div>
                </div>
              ))}
            </div>

            {/* Scraper health grid */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC" }}>Scraper Health by Municipality</span>
                <div style={{ display: "flex", gap: 12, fontSize: 10 }}>
                  <span style={{ color: "#22C55E" }}>● {PIPELINE_STATS.scrapersHealthy} active</span>
                  <span style={{ color: "#EF4444" }}>● {PIPELINE_STATS.scrapersError} errors</span>
                  <span style={{ color: "#64748B" }}>● {PIPELINE_STATS.scrapersPending} pending</span>
                </div>
              </div>
              <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 3 }}>
                {MUNICIPALITIES.map((m) => (
                  <div key={m.id} title={`${m.name} (${m.canton}) — ${m.status}`} style={{
                    width: 10, height: 10, borderRadius: 2, cursor: "pointer",
                    background: m.status === "active" ? "#22C55E" : m.status === "error" ? "#EF4444" : m.status === "pending" ? "#F59E0B" : "#334155",
                  }} />
                ))}
                {/* Fill with mock squares */}
                {Array.from({ length: 200 }, (_, i) => (
                  <div key={`f${i}`} style={{ width: 10, height: 10, borderRadius: 2, background: i < 180 ? "#22C55E" : i < 191 ? "#EF4444" : "#F59E0B" }} />
                ))}
              </div>
            </div>

            {/* Recent activity log */}
            <div style={cardStyle}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E293B" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC" }}>Recent Activity</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {[
                  { time: "08:14", event: "Scrape complete: Uster (3 new docs)", type: "success" },
                  { time: "08:12", event: "OCR batch submitted: 6 documents → Mistral", type: "info" },
                  { time: "08:10", event: "AI parse complete: Wädenswil Feb 2026 (6 items, 88% avg conf)", type: "success" },
                  { time: "08:05", event: "SCRAPER ERROR: Thun — 403 Forbidden (website restructured?)", type: "error" },
                  { time: "07:58", event: "Low confidence alert: Adliswil doc #105 (42%) → review queue", type: "warning" },
                  { time: "07:45", event: "Manual upload: Morges PV Feb 2026 (by admin@protokolbase.ch)", type: "info" },
                  { time: "06:45", event: "Scrape complete: Adliswil (1 new doc)", type: "success" },
                ].map((entry, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "8px 16px", borderBottom: "1px solid #0A0F1C" }}>
                    <span style={{ fontSize: 10, color: "#475569", fontWeight: 600, width: 40, flexShrink: 0 }}>{entry.time}</span>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                      background: entry.type === "success" ? "#22C55E" : entry.type === "error" ? "#EF4444" : entry.type === "warning" ? "#F59E0B" : "#60A5FA",
                    }} />
                    <span style={{ fontSize: 11, color: entry.type === "error" ? "#EF4444" : entry.type === "warning" ? "#F59E0B" : "#CBD5E1" }}>{entry.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ MUNICIPALITIES ═══════ */}
        {nav === "municipalities" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>🏛️ Municipality Manager</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setAddMuniMode(!addMuniMode)} style={btnPrimary}>+ Add Municipality</button>
                <button style={btnGhost}>Import CSV</button>
              </div>
            </div>

            {/* Add municipality form */}
            {addMuniMode && (
              <div style={{ ...cardStyle, padding: "20px", marginBottom: 20, borderColor: "#3B82F644" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", marginBottom: 14 }}>Add New Municipality Source</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  {[
                    { label: "Name", placeholder: "e.g. Rapperswil-Jona" },
                    { label: "Canton", placeholder: "e.g. SG" },
                    { label: "Protocol URL", placeholder: "https://..." },
                    { label: "CMS Type", placeholder: "CMI / Dialog / Nest / Unknown" },
                  ].map((f, i) => (
                    <div key={i}>
                      <label style={{ fontSize: 10, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 4, letterSpacing: 0.5 }}>{f.label}</label>
                      <input style={inputStyle} placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                  {[
                    { label: "Language", placeholder: "de / fr / it" },
                    { label: "Tier", placeholder: "T1 / T2" },
                    { label: "Scrape Frequency", placeholder: "daily / weekly / biweekly / monthly" },
                    { label: "Notes", placeholder: "Optional notes..." },
                  ].map((f, i) => (
                    <div key={i}>
                      <label style={{ fontSize: 10, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 4, letterSpacing: 0.5 }}>{f.label}</label>
                      <input style={inputStyle} placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btnPrimary}>Save Municipality</button>
                  <button style={btnGhost}>Test Scrape URL</button>
                  <button onClick={() => setAddMuniMode(false)} style={{ ...btnGhost, color: "#EF4444", borderColor: "#EF444444" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Municipality", "Canton", "Lang", "Tier", "CMS", "Status", "Last Scrape", "Docs", "Actions"].map((h, i) => (
                      <th key={i} style={{ ...headerCellStyle, textAlign: i >= 7 ? "center" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MUNICIPALITIES.map((m) => (
                    <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => setEditingMuni(editingMuni === m.id ? null : m.id)}>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600, color: "#F8FAFC" }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 2, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.url || "No URL configured"}</div>
                      </td>
                      <td style={cellStyle}>{m.canton}</td>
                      <td style={cellStyle}>{m.language}</td>
                      <td style={cellStyle}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: m.tier === "T1" ? "#3B82F622" : "#8B5CF622", color: m.tier === "T1" ? "#60A5FA" : "#A78BFA" }}>{m.tier}</span></td>
                      <td style={cellStyle}><span style={{ fontSize: 11, color: "#94A3B8" }}>{m.cms}</span></td>
                      <td style={cellStyle}>{statusBadge(m.status)}</td>
                      <td style={cellStyle}><span style={{ fontSize: 11, color: "#94A3B8" }}>{m.lastScrape || "—"}</span></td>
                      <td style={{ ...cellStyle, textAlign: "center" }}><span style={{ fontWeight: 700, color: "#F8FAFC" }}>{m.docs}</span></td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button style={{ ...btnGhost, padding: "4px 8px", fontSize: 10 }} onClick={(e) => { e.stopPropagation(); }}>Edit</button>
                          <button style={{ ...btnGhost, padding: "4px 8px", fontSize: 10, color: "#22C55E", borderColor: "#22C55E44" }}>Scrape</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════ DOCUMENTS ═══════ */}
        {nav === "documents" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>📄 Document Manager</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setUploadMode(!uploadMode)} style={btnPrimary}>📁 Upload PDF</button>
                <button style={btnGhost}>🔗 Add URL</button>
                <button style={btnGhost}>Reprocess Failed</button>
              </div>
            </div>

            {/* Upload form */}
            {uploadMode && (
              <div style={{ ...cardStyle, padding: "20px", marginBottom: 20, borderColor: "#F59E0B44" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 14 }}>Manual PDF Upload</div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 4 }}>PDF FILE</label>
                    <div style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "center", height: 60, border: "2px dashed #334155", cursor: "pointer" }}>
                      <span style={{ color: "#64748B" }}>Drop PDF here or click to browse</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 4 }}>MUNICIPALITY</label>
                    <select style={{ ...inputStyle, cursor: "pointer" }}>
                      <option>Select municipality...</option>
                      {MUNICIPALITIES.map((m) => <option key={m.id}>{m.name} ({m.canton})</option>)}
                    </select>
                    <label style={{ fontSize: 10, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 4, marginTop: 10 }}>SESSION DATE</label>
                    <input style={inputStyle} type="date" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 4 }}>TITLE</label>
                    <input style={inputStyle} placeholder="e.g. Gemeinderatssitzung Feb 2026" />
                    <label style={{ fontSize: 10, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 4, marginTop: 10 }}>SOURCE URL (optional)</label>
                    <input style={inputStyle} placeholder="https://..." />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btnPrimary}>Upload & Process</button>
                  <button onClick={() => setUploadMode(false)} style={{ ...btnGhost, color: "#EF4444" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Document table */}
            <div style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["ID", "Municipality", "Date", "Title", "Pages", "PDF Type", "OCR", "AI Status", "Review", "Confidence", "Items"].map((h) => (
                      <th key={h} style={headerCellStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DOCUMENTS.map((d) => (
                    <tr key={d.id} style={{ cursor: "pointer" }} onClick={() => { setReviewDoc(d.id); setNav("review"); }}>
                      <td style={{ ...cellStyle, color: "#475569", fontSize: 10 }}>#{d.id}</td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: "#F8FAFC" }}>{d.municipality}</td>
                      <td style={cellStyle}>{d.date}</td>
                      <td style={{ ...cellStyle, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>{d.pages}</td>
                      <td style={cellStyle}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: d.pdfType === "digital" ? "#22C55E18" : "#F59E0B18", color: d.pdfType === "digital" ? "#22C55E" : "#F59E0B" }}>
                          {d.pdfType}
                        </span>
                      </td>
                      <td style={cellStyle}><span style={{ fontSize: 10, color: "#94A3B8" }}>{d.ocrMethod}</span></td>
                      <td style={cellStyle}>{statusBadge(d.aiStatus)}</td>
                      <td style={cellStyle}>{statusBadge(d.reviewStatus)}</td>
                      <td style={cellStyle}>{confidenceBadge(d.confidence)}</td>
                      <td style={{ ...cellStyle, textAlign: "center", fontWeight: 700 }}>{d.items ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════ AI REVIEW ═══════ */}
        {nav === "review" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>🔍 AI Review — Document #{reviewDoc}</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...btnPrimary, background: "#22C55E" }}>✓ Approve All</button>
                <button style={btnGhost}>← Prev</button>
                <button style={btnGhost}>Next →</button>
              </div>
            </div>

            {/* Split view: PDF page + structured data */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Left: PDF page image */}
              <div style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>📄 Original PDF — Page 3 of 18</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={{ ...btnGhost, padding: "3px 8px", fontSize: 10 }}>‹</button>
                    <button style={{ ...btnGhost, padding: "3px 8px", fontSize: 10 }}>›</button>
                    <button style={{ ...btnGhost, padding: "3px 8px", fontSize: 10 }}>🔗 Open PDF</button>
                  </div>
                </div>
                <div style={{ flex: 1, background: "#F8F9FA", padding: 20, display: "flex", alignItems: "flex-start", justifyContent: "center", minHeight: 500 }}>
                  {/* Simulated PDF page */}
                  <div style={{ background: "#FFF", width: "100%", maxWidth: 420, padding: "40px 48px", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", fontFamily: "serif", color: "#1a1a1a", fontSize: 11, lineHeight: 1.7 }}>
                    <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>STADTRAT THUN</div>
                    <div style={{ textAlign: "center", fontSize: 11, marginBottom: 20 }}>Protokoll der Sitzung vom 13. Februar 2026</div>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 11 }}>Traktandum 3</div>
                    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12 }}>Kredit für Sanierung Schulhaus Dürrenast</div>
                    <div style={{ marginBottom: 8 }}>Der Stadtrat hat den Kreditantrag für die Gesamtsanierung des Schulhauses Dürrenast in der Höhe von CHF 8.7 Mio. beraten. Die Bildungsdirektion hat in ihrem Bericht dargelegt, dass...</div>
                    <div style={{ marginBottom: 8 }}>Die Sanierung umfasst die energetische Erneuerung der Gebäudehülle, den Ersatz der Heizungsanlage sowie die Anpassung an aktuelle Sicherheitsstandards...</div>
                    <div style={{ marginBottom: 8 }}><strong>Beschluss:</strong> Der Kredit wird mit 6:1 Stimmen bewilligt.</div>
                    <div style={{ background: "#F59E0B22", padding: "4px 8px", borderRadius: 4, display: "inline-block", fontSize: 9, color: "#92400E", fontFamily: "sans-serif" }}>
                      ← AI extracted this section (conf: 71%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Structured data */}
              <div style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #1E293B" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>🧠 AI Extracted Data — Agenda Item #3</span>
                </div>
                <div style={{ flex: 1, padding: "14px", overflow: "auto" }}>
                  {AGENDA_ITEMS.filter((a) => a.docId === 103).map((item) => (
                    <div key={item.id} style={{
                      padding: "12px 14px", marginBottom: 8, borderRadius: 8,
                      background: editingItem === item.id ? "#1E293B" : "#0A0F1C",
                      border: `1px solid ${editingItem === item.id ? "#3B82F6" : "#1E293B"}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>#{item.number}</span>
                          <span style={{ fontSize: 10, marginLeft: 8, padding: "1px 6px", borderRadius: 3, background: "#8B5CF622", color: "#A78BFA", fontWeight: 700 }}>{item.type}</span>
                        </div>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          {confidenceBadge(item.confidence)}
                          <button onClick={() => setEditingItem(editingItem === item.id ? null : item.id)} style={{ ...btnGhost, padding: "3px 8px", fontSize: 9, marginLeft: 6 }}>
                            {editingItem === item.id ? "Done" : "Edit"}
                          </button>
                        </div>
                      </div>

                      {/* Editable fields */}
                      {[
                        { label: "Title", value: item.title, key: "title" },
                        { label: "Decision", value: item.decision, key: "decision" },
                        { label: "Votes", value: item.votes, key: "votes" },
                        { label: "Financials", value: item.financials || "—", key: "financials" },
                        { label: "Entities", value: item.entities.join(", ") || "None detected", key: "entities" },
                      ].map((field, fi) => (
                        <div key={fi} style={{ marginBottom: 6 }}>
                          <label style={{ fontSize: 9, color: "#475569", fontWeight: 700, letterSpacing: 0.5, display: "block", marginBottom: 2 }}>{field.label}</label>
                          {editingItem === item.id ? (
                            <input style={{ ...inputStyle, padding: "5px 8px", fontSize: 11 }} defaultValue={field.value} />
                          ) : (
                            <div style={{ fontSize: 12, color: "#E2E8F0", padding: "2px 0" }}>{field.value}</div>
                          )}
                        </div>
                      ))}

                      {editingItem === item.id && (
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <button style={{ ...btnPrimary, padding: "5px 12px", fontSize: 10, background: "#22C55E" }}>✓ Save & Approve</button>
                          <button style={{ ...btnGhost, padding: "5px 12px", fontSize: 10, color: "#EF4444" }}>✕ Flag Issue</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Review queue list */}
            <div style={cardStyle}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1E293B" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#F8FAFC" }}>Review Queue ({DOCUMENTS.filter((d) => d.reviewStatus !== "approved").length} documents)</span>
              </div>
              {DOCUMENTS.filter((d) => d.reviewStatus !== "approved").map((d) => (
                <div key={d.id} onClick={() => setReviewDoc(d.id)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderBottom: "1px solid #0A0F1C", cursor: "pointer",
                  background: reviewDoc === d.id ? "#1E293B" : "transparent",
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#475569" }}>#{d.id}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#F8FAFC" }}>{d.municipality}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{d.title}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {confidenceBadge(d.confidence)}
                    {statusBadge(d.reviewStatus)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ DATABASE ═══════ */}
        {nav === "database" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F8FAFC", margin: 0 }}>🗃️ Database Explorer</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={btnGhost}>Export Table</button>
                <button style={{ ...btnGhost, color: "#F59E0B", borderColor: "#F59E0B44" }}>SQL Console</button>
              </div>
            </div>

            {/* Table selector */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {DB_TABLES.map((t) => (
                <button key={t.name} onClick={() => setDbTable(t.name)} style={{
                  padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600,
                  fontFamily: "inherit",
                  background: dbTable === t.name ? "#1E293B" : "transparent",
                  border: dbTable === t.name ? "1px solid #475569" : "1px solid #1E293B",
                  color: dbTable === t.name ? "#F8FAFC" : "#64748B",
                }}>
                  {t.name} <span style={{ fontSize: 9, color: "#475569", marginLeft: 4 }}>({t.rows})</span>
                </button>
              ))}
            </div>

            {/* Table schema + inline editing */}
            {(() => {
              const table = DB_TABLES.find((t) => t.name === dbTable);
              if (!table) return null;
              const mockRows = dbTable === "municipalities"
                ? MUNICIPALITIES.map((m) => ({ id: m.id, name: m.name, canton: m.canton, language: m.language, url: m.url, cms_type: m.cms, scrape_frequency: m.frequency, status: m.status, tier: m.tier, created_at: "2026-01-15", updated_at: "2026-02-27" }))
                : dbTable === "documents"
                ? DOCUMENTS.map((d) => ({ id: d.id, municipality_id: MUNICIPALITIES.find((m) => m.name === d.municipality)?.id || "?", title: d.title, date: d.date, pdf_path: `/storage/${d.id}.pdf`, pdf_type: d.pdfType, ocr_method: d.ocrMethod, page_count: d.pages, ai_status: d.aiStatus, review_status: d.reviewStatus, confidence: d.confidence, created_at: d.date }))
                : [{ note: "Showing schema only — connect to live DB for data" }];

              return (
                <div style={cardStyle}>
                  {/* Schema bar */}
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid #1E293B", background: "#0F172A", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", letterSpacing: 0.5 }}>SCHEMA:</span>
                    {table.cols.map((col) => (
                      <span key={col} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#1E293B", color: "#94A3B8", fontFamily: "inherit" }}>{col}</span>
                    ))}
                  </div>

                  {/* Quick filter */}
                  <div style={{ padding: "8px 14px", borderBottom: "1px solid #1E293B", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#475569" }}>Filter:</span>
                    <input style={{ ...inputStyle, width: 300, padding: "5px 10px", fontSize: 11 }} placeholder={`WHERE clause... e.g. canton = 'ZH' AND status = 'active'`} />
                    <button style={{ ...btnGhost, padding: "5px 12px", fontSize: 10 }}>Apply</button>
                    <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto" }}>{table.rows} rows total</span>
                  </div>

                  {/* Data table with inline editing */}
                  <div style={{ overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ ...headerCellStyle, width: 30 }}></th>
                          {table.cols.map((col) => (
                            <th key={col} style={{ ...headerCellStyle, fontSize: 9, whiteSpace: "nowrap" }}>{col}</th>
                          ))}
                          <th style={headerCellStyle}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockRows.slice(0, 7).map((row, ri) => (
                          <tr key={ri} style={{ background: dbEdit === ri ? "#1E293B" : "transparent" }}>
                            <td style={{ ...cellStyle, textAlign: "center" }}>
                              <input type="checkbox" style={{ accentColor: "#3B82F6" }} />
                            </td>
                            {table.cols.map((col) => (
                              <td key={col} style={cellStyle}>
                                {dbEdit === ri ? (
                                  <input style={{ ...inputStyle, padding: "3px 6px", fontSize: 10, width: "auto", minWidth: 60 }} defaultValue={String(row[col] ?? "")} />
                                ) : (
                                  <span style={{ fontSize: 11, color: col === "id" ? "#475569" : "#CBD5E1", fontWeight: col === "name" || col === "title" ? 600 : 400 }}>
                                    {String(row[col] ?? "—").substring(0, 40)}
                                  </span>
                                )}
                              </td>
                            ))}
                            <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => setDbEdit(dbEdit === ri ? null : ri)} style={{ ...btnGhost, padding: "2px 8px", fontSize: 9 }}>
                                  {dbEdit === ri ? "Save" : "Edit"}
                                </button>
                                <button style={{ ...btnGhost, padding: "2px 8px", fontSize: 9, color: "#EF4444", borderColor: "#EF444444" }}>Del</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add row */}
                  <div style={{ padding: "10px 14px", borderTop: "1px solid #1E293B" }}>
                    <button style={{ ...btnGhost, fontSize: 10 }}>+ Add Row</button>
                  </div>
                </div>
              );
            })()}

            {/* SQL Console */}
            <div style={{ ...cardStyle, marginTop: 20 }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1E293B" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B" }}>SQL Console</span>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <textarea style={{ ...inputStyle, height: 80, resize: "vertical", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, lineHeight: 1.5 }} defaultValue={`SELECT m.name, m.canton, COUNT(d.id) as doc_count, AVG(d.confidence) as avg_confidence\nFROM municipalities m\nLEFT JOIN documents d ON d.municipality_id = m.id\nGROUP BY m.id\nORDER BY avg_confidence ASC;`} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button style={btnPrimary}>▶ Run Query</button>
                  <button style={btnGhost}>Format SQL</button>
                  <button style={btnGhost}>Save as Template</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
