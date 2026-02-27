export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { documents, municipalities } from "@protokolbase/db/schema";
import { count, eq, isNull, isNotNull, sql } from "drizzle-orm";

const cardStyle = "rounded-[10px] p-4 border [border-color:#1e293b] [background:#111827]";

export default async function PipelinePage() {
  const [totalDocs] = await db.select({ value: count() }).from(documents);
  const [withBlob] = await db
    .select({ value: count() })
    .from(documents)
    .where(isNotNull(documents.blobUrl));
  const [withoutBlob] = await db
    .select({ value: count() })
    .from(documents)
    .where(isNull(documents.blobUrl));

  const byCanton = await db
    .select({
      canton: municipalities.canton,
      docCount: count(documents.id),
    })
    .from(municipalities)
    .leftJoin(documents, eq(municipalities.id, documents.municipalityId))
    .groupBy(municipalities.canton)
    .orderBy(sql`count(${documents.id}) DESC`);

  const stages = [
    {
      label: "Scraped",
      desc: "PDFs found on municipality websites",
      value: totalDocs.value,
      color: "#3b82f6",
    },
    {
      label: "Uploaded to Blob",
      desc: "PDFs stored in Vercel Blob",
      value: withBlob.value,
      color: "#22c55e",
    },
    {
      label: "Pending Upload",
      desc: "Source URL only, not yet downloaded",
      value: withoutBlob.value,
      color: "#f59e0b",
    },
    {
      label: "OCR Processed",
      desc: "Text extracted via OCR pipeline",
      value: 0,
      color: "#8b5cf6",
    },
    {
      label: "AI Parsed",
      desc: "Structured data extracted by LLM",
      value: 0,
      color: "#ec4899",
    },
  ];

  return (
    <div>
      <h2 className="text-base font-bold mb-5" style={{ color: "#f8fafc" }}>
        Pipeline Status
      </h2>

      {/* Pipeline stages */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {stages.map((s) => (
          <div key={s.label} className={cardStyle}>
            <div className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: "#64748b" }}>
              {s.label}
            </div>
            <div className="text-2xl font-extrabold mt-1" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[10px] mt-1" style={{ color: "#64748b" }}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline flow diagram */}
      <div className={cardStyle + " mb-6"}>
        <div className="text-xs font-bold mb-3" style={{ color: "#f8fafc" }}>
          Processing Pipeline
        </div>
        <div
          className="font-mono text-xs leading-loose whitespace-pre"
          style={{ color: "#cbd5e1" }}
        >
          {`Scraper → PDF Download → Blob Storage → Page Image Generation
    ↓
OCR Pipeline (3-tier):
  ├── Tier 1: PyMuPDF (digital PDFs, ~70%, free)
  ├── Tier 2: Mistral OCR 3 (scanned, ~25%, $1/1K pages)
  └── Tier 3: Azure Doc Intelligence (fallback, ~5%)
    ↓
AI Parser → Structured Data → Database → Frontend`}
        </div>
      </div>

      {/* Documents by canton */}
      <div className={cardStyle}>
        <div className="text-xs font-bold mb-3" style={{ color: "#f8fafc" }}>
          Documents by Canton
        </div>
        <div className="grid grid-cols-4 gap-2">
          {byCanton.map(({ canton, docCount }) => (
            <div
              key={canton}
              className="flex items-center justify-between py-1 px-2 rounded text-[11px]"
              style={{ background: "#0a0f1c" }}
            >
              <span style={{ color: "#94a3b8" }}>{canton}</span>
              <span className="font-bold" style={{ color: docCount > 0 ? "#22c55e" : "#475569" }}>
                {docCount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
