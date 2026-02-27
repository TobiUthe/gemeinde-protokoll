import { useState } from "react";

const PARSERS = [
  {
    id: "azure",
    name: "Azure Doc Intelligence",
    vendor: "Microsoft",
    type: "cloud",
    current: true,
    logo: "🔷",
    pricing: {
      model: "Per page",
      read: 1.50,
      layout: 10.00,
      unit: "per 1,000 pages",
      batch: null,
      note: "Read = $1.50, Layout (tables/structure) = $10.00",
    },
    quality: { printed: 95, handwriting: 78, tables: 90, multilingual: 88, scanned: 92 },
    pros: [
      "Excellent structure + table extraction with Layout model",
      "Strong multilingual support (DE/FR/IT covered)",
      "Containerised deployment option for data sovereignty",
      "Mature, enterprise-grade with SLAs",
      "You already have it integrated",
    ],
    cons: [
      "Layout model at $10/1K pages is expensive at scale",
      "Even Read at $1.50/1K adds up with 500K+ pages/year",
      "Cloud lock-in to Azure ecosystem",
      "Overkill for digital-native PDFs (most municipal protocols)",
    ],
    bestFor: "You're already using it — keep for complex scanned docs as a fallback",
    languages: "90+ languages",
    speed: "~1 sec/page",
    selfHost: "Container available",
    license: "Proprietary / SaaS",
  },
  {
    id: "mistral",
    name: "Mistral OCR 3",
    vendor: "Mistral AI",
    type: "cloud",
    current: false,
    logo: "🟠",
    recommended: true,
    pricing: {
      model: "Per page",
      read: 2.00,
      layout: 2.00,
      unit: "per 1,000 pages",
      batch: 1.00,
      note: "Flat $2/1K pages (includes tables). Batch API: $1/1K pages",
    },
    quality: { printed: 97, handwriting: 89, tables: 94, multilingual: 95, scanned: 93 },
    pros: [
      "State-of-the-art accuracy across all categories",
      "Flat pricing — tables/structure included at $2/1K (vs Azure's $10)",
      "Batch API halves cost to $1/1K pages — ideal for your nightly batch pipeline",
      "Native Markdown output — perfect for downstream LLM parsing",
      "Excellent multilingual: DE/FR/IT/Romansh all supported",
      "88.9% handwriting accuracy (best in class)",
      "Self-hosting available for data sovereignty",
    ],
    cons: [
      "Proprietary SaaS — no local free tier",
      "Newer service — less track record than Azure/Google",
      "No offline/air-gapped mode without enterprise self-host contract",
      "API-only — must build integration",
    ],
    bestFor: "Primary parser for all documents. Best cost/quality ratio at scale.",
    languages: "1000s of scripts/fonts",
    speed: "~2,000 pages/min",
    selfHost: "Enterprise self-host available",
    license: "Proprietary / SaaS",
  },
  {
    id: "docling",
    name: "Docling",
    vendor: "IBM Research",
    type: "open-source",
    current: false,
    logo: "🔵",
    pricing: {
      model: "Free",
      read: 0,
      layout: 0,
      unit: "self-hosted compute only",
      batch: 0,
      note: "Free (MIT license). Only cost = your GPU/CPU compute",
    },
    quality: { printed: 88, handwriting: 55, tables: 85, multilingual: 78, scanned: 72 },
    pros: [
      "Completely free — MIT license, commercial use OK",
      "Strong table extraction (TableFormer model)",
      "Preserves reading order and document structure",
      "Outputs Markdown or JSON — LLM-ready",
      "Good speed: 0.49 sec/page on GPU, 3.1 sec/page on CPU",
      "Integrates with LangChain / LlamaIndex",
      "Full data sovereignty — runs locally",
    ],
    cons: [
      "Weak on scanned documents — needs external OCR (Tesseract/EasyOCR)",
      "Handwriting recognition is poor",
      "Requires GPU for decent speed on large batches",
      "Less accurate than cloud services on complex layouts",
      "Community-maintained — no SLA",
    ],
    bestFor: "Digital-native PDFs at zero marginal cost. Great for the 70%+ of protocols that aren't scanned.",
    languages: "OCR backend dependent",
    speed: "0.49 sec/page (GPU)",
    selfHost: "Yes — fully local",
    license: "MIT (fully open)",
  },
  {
    id: "marker",
    name: "Marker + Surya",
    vendor: "Vik Paruchuri",
    type: "open-source",
    current: false,
    logo: "🟣",
    pricing: {
      model: "Free*",
      read: 0,
      layout: 0,
      unit: "self-hosted compute only",
      batch: 0,
      note: "Free for non-commercial. Commercial license required for business use.",
    },
    quality: { printed: 90, handwriting: 62, tables: 80, multilingual: 85, scanned: 80 },
    pros: [
      "Surya OCR supports 90+ languages — strong DE/FR/IT",
      "Fast: 122 pages/sec on H100 (projected throughput)",
      "Good structure fidelity for headings, lists, paragraphs",
      "Handles DOCX, EPUB, images — not just PDF",
      "Active development, solid community",
      "Can use --use_llm flag for better table recognition",
    ],
    cons: [
      "Commercial license required — not truly free for your use case",
      "GPL-like restrictions on Surya models may affect your product",
      "Table extraction weaker than Docling/Mistral without LLM flag",
      "Needs ~5GB VRAM per worker process",
      "Heading hierarchy detection can be inaccurate",
    ],
    bestFor: "Good all-rounder if you negotiate the commercial license. Strong multilingual OCR.",
    languages: "90+ via Surya",
    speed: "0.86 sec/page (GPU)",
    selfHost: "Yes — fully local",
    license: "GPL / Commercial license needed",
  },
  {
    id: "mineru",
    name: "MinerU",
    vendor: "OpenDataLab",
    type: "open-source",
    current: false,
    logo: "🟢",
    pricing: {
      model: "Free",
      read: 0,
      layout: 0,
      unit: "self-hosted compute only",
      batch: 0,
      note: "Free (Apache 2.0 license). GPU recommended for speed.",
    },
    quality: { printed: 89, handwriting: 58, tables: 88, multilingual: 84, scanned: 78 },
    pros: [
      "Fastest open-source on GPU: 0.21 sec/page on L4",
      "Strong table extraction — renders as HTML",
      "84 language OCR support via PaddleOCR",
      "Good header/footer removal — useful for protocol pages",
      "Apache 2.0 license — fully commercial OK",
      "Active community, web interface available",
    ],
    cons: [
      "GPU strongly recommended — slow on CPU",
      "Docker/CUDA setup complexity",
      "Primarily optimised for Chinese/scientific docs — less tested on European gov docs",
      "MacOS support is spotty",
      "Smaller Western community",
    ],
    bestFor: "High-throughput batch processing if you have GPU infrastructure.",
    languages: "84 via PaddleOCR",
    speed: "0.21 sec/page (GPU)",
    selfHost: "Yes — fully local",
    license: "Apache 2.0 (fully open)",
  },
  {
    id: "pymupdf",
    name: "PyMuPDF + pdfplumber",
    vendor: "Open Source",
    type: "open-source",
    current: false,
    logo: "📋",
    pricing: {
      model: "Free",
      read: 0,
      layout: 0,
      unit: "zero cost",
      batch: 0,
      note: "Completely free. No compute overhead — pure text extraction.",
    },
    quality: { printed: 82, handwriting: 0, tables: 65, multilingual: 70, scanned: 0 },
    pros: [
      "Extremely fast — milliseconds per page",
      "Zero cost, zero infrastructure",
      "Perfect for digital-native PDFs (text already embedded)",
      "pdfplumber extracts tables well from structured PDFs",
      "No GPU needed, runs anywhere",
      "Battle-tested, millions of users",
    ],
    cons: [
      "Zero OCR capability — completely useless for scanned docs",
      "No layout understanding — just raw text extraction",
      "No heading/structure detection",
      "Tables from complex layouts may break",
      "Can't handle image-based PDFs at all",
    ],
    bestFor: "First-pass for digital PDFs. Use as a fast pre-filter before expensive OCR.",
    languages: "Any embedded text",
    speed: "~5ms/page",
    selfHost: "Yes — pip install",
    license: "AGPL / Commercial",
  },
];

const qualityLabels = {
  printed: "Printed Text",
  handwriting: "Handwriting",
  tables: "Table Extraction",
  multilingual: "Multilingual (DE/FR/IT)",
  scanned: "Scanned Docs",
};

const qualityColor = (v) => {
  if (v >= 90) return "#22C55E";
  if (v >= 80) return "#84CC16";
  if (v >= 70) return "#EAB308";
  if (v >= 50) return "#F97316";
  return "#EF4444";
};

export default function PDFParserComparison() {
  const [pages, setPages] = useState(100000);
  const [view, setView] = useState("overview");
  const [expanded, setExpanded] = useState(null);

  const costForPages = (p, mode = "read") => {
    if (p.pricing.model === "Free" || p.pricing.model === "Free*") return 0;
    const rate = mode === "batch" && p.pricing.batch ? p.pricing.batch : (mode === "layout" ? p.pricing.layout : p.pricing.read);
    return (pages / 1000) * rate;
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", background: "#0A0F1C", color: "#E2E8F0", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderBottom: "1px solid #1E3A5F", padding: "28px 32px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: 3, color: "#F59E0B", fontWeight: 700 }}>PROTOKOLBASE · LEVEL 1</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 8px", color: "#F8FAFC" }}>PDF Parser Selection Guide</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
            Comparing 6 options to replace/complement Azure Document Intelligence
          </p>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "0 32px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 0 }}>
          {[
            { id: "overview", label: "Overview & Recommendation" },
            { id: "cost", label: "Cost Calculator" },
            { id: "quality", label: "Quality Matrix" },
            { id: "strategy", label: "Hybrid Strategy" },
          ].map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              background: "none", border: "none", padding: "12px 18px", cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: view === t.id ? "#F59E0B" : "#64748B",
              borderBottom: view === t.id ? "2px solid #F59E0B" : "2px solid transparent",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px 60px" }}>

        {/* ═══════ OVERVIEW ═══════ */}
        {view === "overview" && (
          <div>
            {/* Recommendation box */}
            <div style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #0F172A 100%)", border: "1px solid #22C55E44", borderRadius: 12, padding: "24px 28px", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>✅</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#22C55E", margin: 0 }}>Recommended: Hybrid 3-Tier Pipeline</h2>
              </div>
              <p style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.7, margin: "0 0 16px" }}>
                Don't pick one parser — build a tiered pipeline that routes each document to the cheapest adequate parser. Most Swiss municipal protocols are <strong style={{ color: "#F8FAFC" }}>digital-native PDFs</strong> (text is already embedded), so expensive OCR is wasted on them. Reserve cloud AI parsing for the documents that actually need it.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { tier: "Tier 1 — Fast Extract", pct: "~70%", tool: "PyMuPDF / pdfplumber", cost: "≈ $0", desc: "Digital PDFs with embedded text. Extract instantly at zero cost. If text is found → done.", color: "#22C55E" },
                  { tier: "Tier 2 — AI OCR", pct: "~25%", tool: "Mistral OCR 3 (Batch)", cost: "≈ $1/1K pages", desc: "Scanned PDFs or poor text extraction. Send to Mistral Batch API. Markdown output feeds AI pipeline.", color: "#F59E0B" },
                  { tier: "Tier 3 — Fallback", pct: "~5%", tool: "Azure Doc Intelligence", cost: "≈ $10/1K pages", desc: "Complex edge cases, handwritten notes, heavily damaged scans. Use your existing Azure setup.", color: "#EF4444" },
                ].map((t, i) => (
                  <div key={i} style={{ background: "#111827", borderRadius: 10, padding: "16px 18px", border: `1px solid ${t.color}33` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: t.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{t.tier}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", marginBottom: 2 }}>{t.pct}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>of documents</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", marginBottom: 4 }}>{t.tool}</div>
                    <div style={{ fontSize: 11, color: t.color, fontWeight: 700, marginBottom: 8 }}>{t.cost}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", background: "#0F172A", borderRadius: 8, border: "1px solid #1E293B" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>💰 Blended cost at 100K pages/year</div>
                <div style={{ fontSize: 13, color: "#CBD5E1" }}>
                  70K × $0 + 25K × $1/1K + 5K × $10/1K = <strong style={{ color: "#22C55E", fontSize: 16 }}>~$75/year</strong> vs. <strong style={{ color: "#EF4444" }}>~$1,000/year</strong> (Azure Layout for all) or <strong style={{ color: "#F59E0B" }}>$150/year</strong> (Azure Read for all)
                </div>
              </div>
            </div>

            {/* Parser cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
              {PARSERS.map((p) => (
                <div key={p.id} onClick={() => setExpanded(expanded === p.id ? null : p.id)} style={{
                  background: "#111827", borderRadius: 12, overflow: "hidden", cursor: "pointer",
                  border: p.recommended ? "1px solid #22C55E55" : p.current ? "1px solid #3B82F655" : "1px solid #1E293B",
                  transition: "all 0.15s",
                }}>
                  <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{p.logo}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC" }}>{p.name}</span>
                        {p.recommended && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#22C55E22", color: "#22C55E", border: "1px solid #22C55E44" }}>RECOMMENDED</span>}
                        {p.current && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#3B82F622", color: "#60A5FA", border: "1px solid #3B82F644" }}>CURRENT</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{p.vendor} · {p.type === "cloud" ? "☁️ Cloud API" : "🏠 Self-Hosted"} · {p.license}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: p.pricing.model === "Free" || p.pricing.model === "Free*" ? "#22C55E" : "#F8FAFC" }}>
                        {p.pricing.model === "Free" || p.pricing.model === "Free*" ? "Free" : `$${p.pricing.batch || p.pricing.read}`}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>{p.pricing.unit}</div>
                    </div>
                  </div>

                  {/* Quality bars */}
                  <div style={{ padding: "0 20px 12px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {Object.entries(p.quality).map(([k, v]) => (
                        <div key={k} style={{ flex: 1 }}>
                          <div style={{ height: 4, borderRadius: 2, background: "#1E293B", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${v}%`, background: qualityColor(v), borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 8, color: "#64748B", marginTop: 3, textAlign: "center" }}>{k.slice(0, 5)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: "0 20px 14px" }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic", lineHeight: 1.5 }}>{p.bestFor}</div>
                  </div>

                  {/* Expanded detail */}
                  {expanded === p.id && (
                    <div style={{ borderTop: "1px solid #1E293B", padding: "14px 20px", background: "#0F172A" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", letterSpacing: 0.5, marginBottom: 6 }}>PROS</div>
                          {p.pros.map((pro, i) => (
                            <div key={i} style={{ fontSize: 11, color: "#CBD5E1", padding: "3px 0", display: "flex", gap: 6 }}>
                              <span style={{ color: "#22C55E", flexShrink: 0 }}>+</span> {pro}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: 0.5, marginBottom: 6 }}>CONS</div>
                          {p.cons.map((con, i) => (
                            <div key={i} style={{ fontSize: 11, color: "#CBD5E1", padding: "3px 0", display: "flex", gap: 6 }}>
                              <span style={{ color: "#EF4444", flexShrink: 0 }}>−</span> {con}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#94A3B8", borderTop: "1px solid #1E293B", paddingTop: 10 }}>
                        <span>⚡ {p.speed}</span>
                        <span>🌐 {p.languages}</span>
                        <span>🏠 {p.selfHost}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ COST CALCULATOR ═══════ */}
        {view === "cost" && (
          <div>
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1E293B", padding: "24px 28px", marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC", margin: "0 0 16px" }}>Annual Page Volume</h3>
              <input
                type="range" min={10000} max={1000000} step={10000} value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#F59E0B" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>10K pages</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#F59E0B" }}>{(pages / 1000).toFixed(0)}K pages/year</span>
                <span style={{ fontSize: 11, color: "#64748B" }}>1M pages</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>
                ≈ {Math.round(pages / 20 / 12)} protocols/month × 20 pages avg — that's roughly {Math.round(pages / 20 / 12 / 12)} municipalities with monthly protocols
              </div>
            </div>

            {/* Cost comparison table */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1E293B", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Parser", "Model", "Cost/1K pages", "Annual Cost", "vs Azure Layout"].map((h, i) => (
                      <th key={i} style={{ textAlign: i >= 2 ? "right" : "left", padding: "12px 16px", fontSize: 10, fontWeight: 700, color: "#64748B", borderBottom: "1px solid #1E293B", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Azure Doc Intelligence (Layout)", logo: "🔷", rate: 10, mode: "layout", id: "azure-layout" },
                    { name: "Azure Doc Intelligence (Read)", logo: "🔷", rate: 1.5, mode: "read", id: "azure-read" },
                    { name: "Mistral OCR 3 (Standard)", logo: "🟠", rate: 2, mode: "standard", id: "mistral-std" },
                    { name: "Mistral OCR 3 (Batch)", logo: "🟠", rate: 1, mode: "batch", id: "mistral-batch", recommended: true },
                    { name: "Google Document AI", logo: "🟡", rate: 1.5, mode: "read", id: "google" },
                    { name: "AWS Textract", logo: "🟧", rate: 1.5, mode: "read", id: "aws" },
                    { name: "Docling (self-hosted)", logo: "🔵", rate: 0, mode: "free", id: "docling" },
                    { name: "MinerU (self-hosted)", logo: "🟢", rate: 0, mode: "free", id: "mineru" },
                    { name: "PyMuPDF (digital only)", logo: "📋", rate: 0, mode: "free", id: "pymupdf" },
                    { name: "Hybrid Pipeline ✨", logo: "⚡", rate: null, mode: "hybrid", id: "hybrid", recommended: true },
                  ].map((row, i) => {
                    const annualCost = row.mode === "hybrid"
                      ? (pages * 0.7 * 0 + pages * 0.25 * 1 / 1000 + pages * 0.05 * 10 / 1000)
                      : row.mode === "free" ? 0 : (pages / 1000) * row.rate;
                    const azureLayoutCost = (pages / 1000) * 10;
                    const savings = azureLayoutCost > 0 ? Math.round((1 - annualCost / azureLayoutCost) * 100) : 100;
                    return (
                      <tr key={row.id} style={{ borderBottom: "1px solid #0F172A", background: row.recommended ? "#22C55E08" : "transparent" }}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span>{row.logo}</span>
                            <span style={{ fontSize: 12, fontWeight: row.recommended ? 700 : 500, color: row.recommended ? "#22C55E" : "#E2E8F0" }}>{row.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 11, color: "#94A3B8" }}>{row.mode}</td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: row.rate === 0 || row.mode === "hybrid" ? "#22C55E" : "#F8FAFC" }}>
                            {row.mode === "hybrid" ? "blended" : row.rate === 0 ? "Free" : `$${row.rate.toFixed(2)}`}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: annualCost === 0 ? "#22C55E" : annualCost < 200 ? "#84CC16" : annualCost < 1000 ? "#F59E0B" : "#EF4444" }}>
                            ${annualCost.toFixed(0)}
                          </span>
                          <span style={{ fontSize: 10, color: "#64748B" }}>/yr</span>
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                            background: savings >= 90 ? "#22C55E22" : savings >= 50 ? "#84CC1622" : "#F59E0B22",
                            color: savings >= 90 ? "#22C55E" : savings >= 50 ? "#84CC16" : "#F59E0B",
                          }}>
                            {savings > 0 ? `${savings}% cheaper` : "baseline"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>
              * Self-hosted costs (Docling, MinerU, PyMuPDF) exclude compute infrastructure. On Modal serverless GPU, estimate ~$0.10–0.30/1K pages for Docling/MinerU. PyMuPDF runs on CPU at negligible cost.
            </div>
          </div>
        )}

        {/* ═══════ QUALITY MATRIX ═══════ */}
        {view === "quality" && (
          <div>
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1E293B", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 10, fontWeight: 700, color: "#64748B", borderBottom: "1px solid #1E293B", letterSpacing: 0.5 }}>PARSER</th>
                    {Object.entries(qualityLabels).map(([k, label]) => (
                      <th key={k} style={{ textAlign: "center", padding: "12px 10px", fontSize: 10, fontWeight: 700, color: "#64748B", borderBottom: "1px solid #1E293B", letterSpacing: 0.5 }}>{label.toUpperCase()}</th>
                    ))}
                    <th style={{ textAlign: "center", padding: "12px 16px", fontSize: 10, fontWeight: 700, color: "#64748B", borderBottom: "1px solid #1E293B" }}>AVG</th>
                  </tr>
                </thead>
                <tbody>
                  {PARSERS.sort((a, b) => {
                    const avgA = Object.values(a.quality).reduce((s, v) => s + v, 0) / 5;
                    const avgB = Object.values(b.quality).reduce((s, v) => s + v, 0) / 5;
                    return avgB - avgA;
                  }).map((p) => {
                    const avg = Math.round(Object.values(p.quality).reduce((s, v) => s + v, 0) / 5);
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #0F172A" }}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span>{p.logo}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0" }}>{p.name}</div>
                              <div style={{ fontSize: 10, color: "#64748B" }}>{p.type === "cloud" ? "Cloud" : "Self-hosted"}</div>
                            </div>
                          </div>
                        </td>
                        {Object.entries(p.quality).map(([k, v]) => (
                          <td key={k} style={{ padding: "10px", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, background: `${qualityColor(v)}18`, border: `1px solid ${qualityColor(v)}44` }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: qualityColor(v) }}>{v || "—"}</span>
                            </div>
                          </td>
                        ))}
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: qualityColor(avg) }}>{avg}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20, background: "#111827", borderRadius: 12, border: "1px solid #1E293B", padding: "20px 24px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", margin: "0 0 10px" }}>Key Insight for ProtokolBase</h3>
              <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>
                For <strong>municipal protocols specifically</strong>, "Printed Text" and "Tables" are the two quality dimensions that matter most.
                Handwriting is largely irrelevant (protocols are typed). "Scanned Docs" matters for ~25% of municipalities that still publish image-based PDFs.
                Mistral OCR 3 leads in every category that matters for your use case, at a fraction of Azure Layout's cost.
              </p>
            </div>
          </div>
        )}

        {/* ═══════ HYBRID STRATEGY ═══════ */}
        {view === "strategy" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F8FAFC", margin: "0 0 20px" }}>Recommended Hybrid Pipeline — Implementation</h2>

            {/* Pipeline flow */}
            {[
              {
                step: 1, title: "Document Arrives", icon: "📥", color: "#94A3B8",
                desc: "Scraper downloads new PDF from municipality website. Stored in object storage (R2/S3).",
                code: null,
              },
              {
                step: 2, title: "Digital Text Check", icon: "📋", color: "#22C55E",
                desc: "Attempt text extraction with PyMuPDF. If meaningful text is found (>50 chars/page avg), the PDF is digital-native. This takes milliseconds and costs nothing.",
                code: `import pymupdf\n\ndef extract_if_digital(pdf_path):\n    doc = pymupdf.open(pdf_path)\n    total_chars = sum(len(page.get_text()) for page in doc)\n    avg_chars = total_chars / len(doc) if doc else 0\n    \n    if avg_chars > 50:  # Digital PDF — text is embedded\n        return {\n            "method": "pymupdf",\n            "text": [page.get_text() for page in doc],\n            "cost": 0.0\n        }\n    return None  # Needs OCR — escalate to Tier 2`,
              },
              {
                step: 3, title: "Table Extraction (Digital)", icon: "📊", color: "#84CC16",
                desc: "For digital PDFs with tables, use pdfplumber to extract table structures. Combined with PyMuPDF text, this gives you structured content at zero cost.",
                code: `import pdfplumber\n\ndef extract_tables(pdf_path):\n    with pdfplumber.open(pdf_path) as pdf:\n        tables = []\n        for page in pdf.pages:\n            page_tables = page.extract_tables()\n            if page_tables:\n                tables.extend(page_tables)\n    return tables`,
              },
              {
                step: 4, title: "OCR via Mistral (Scanned)", icon: "🟠", color: "#F59E0B",
                desc: "If PyMuPDF found little text → the PDF is scanned/image-based. Send to Mistral OCR 3 Batch API. Returns Markdown with tables preserved as HTML. Cost: $1 per 1,000 pages.",
                code: `import httpx\n\nasync def ocr_with_mistral(pdf_path: str):\n    with open(pdf_path, "rb") as f:\n        pdf_data = base64.b64encode(f.read()).decode()\n    \n    response = await httpx.post(\n        "https://api.mistral.ai/v1/ocr",\n        headers={"Authorization": f"Bearer {MISTRAL_KEY}"},\n        json={\n            "model": "mistral-ocr-latest",\n            "document": {\n                "type": "document_url",  # or base64\n                "document_url": pdf_url\n            }\n        }\n    )\n    return response.json()  # Markdown with tables`,
              },
              {
                step: 5, title: "Azure Fallback (Edge Cases)", icon: "🔷", color: "#3B82F6",
                desc: "If Mistral returns low-confidence results or the document has handwritten annotations, fall back to your existing Azure Doc Intelligence setup. This handles ~5% of documents.",
                code: null,
              },
              {
                step: 6, title: "Quality Check & Store", icon: "✅", color: "#22C55E",
                desc: "Run a simple quality check: character count, language detection, structure validation. Flag low-quality extractions for manual review. Store structured text alongside original PDF.",
                code: `def quality_check(extracted_text: str, page_count: int):\n    chars_per_page = len(extracted_text) / max(page_count, 1)\n    \n    return {\n        "quality": "good" if chars_per_page > 200 else "review",\n        "chars_per_page": chars_per_page,\n        "language": detect_language(extracted_text),\n        "has_tables": "<table" in extracted_text or "│" in extracted_text\n    }`,
              },
            ].map((step) => (
              <div key={step.step} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 40 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${step.color}22`, border: `2px solid ${step.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {step.icon}
                  </div>
                  {step.step < 6 && <div style={{ width: 2, flex: 1, background: "#1E293B", marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, background: "#111827", borderRadius: 10, border: "1px solid #1E293B", padding: "16px 20px", marginBottom: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: step.color, letterSpacing: 0.5, marginBottom: 4 }}>STEP {step.step}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC", marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6, marginBottom: step.code ? 10 : 0 }}>{step.desc}</div>
                  {step.code && (
                    <pre style={{ background: "#0A0F1C", border: "1px solid #1E293B", borderRadius: 8, padding: "12px 16px", fontSize: 11, color: "#94A3B8", overflow: "auto", margin: 0, lineHeight: 1.5, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                      {step.code}
                    </pre>
                  )}
                </div>
              </div>
            ))}

            {/* Decision tree summary */}
            <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1E293B", padding: "20px 24px", marginTop: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", margin: "0 0 12px" }}>Decision Logic Summary</h3>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#CBD5E1", lineHeight: 2, whiteSpace: "pre-wrap" }}>
{`PDF arrives → PyMuPDF text extraction
  ├── avg chars/page > 50? → ✅ DIGITAL PDF (Tier 1: Free)
  │     └── pdfplumber for tables → Store structured text
  │
  └── avg chars/page ≤ 50? → 📸 SCANNED PDF (needs OCR)
        ├── Mistral OCR 3 Batch → Markdown output (Tier 2: $1/1K)
        │     ├── confidence OK? → Store structured text
        │     └── confidence LOW? → Escalate to Tier 3
        │
        └── Azure Doc Intelligence (Tier 3: $10/1K)
              └── Store structured text + flag for review`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
