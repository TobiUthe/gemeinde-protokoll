export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { documents, municipalities } from "@protokolbase/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

const cardStyle = "rounded-[10px] border [border-color:#1e293b] [background:#111827] overflow-hidden";
const headerCell =
  "text-left p-3 text-[10px] font-bold tracking-wide uppercase [color:#64748b] [border-bottom:1px_solid_#1e293b]";
const cell = "p-3 text-xs [color:#cbd5e1] [border-bottom:1px_solid_#0a0f1c]";

export default async function AdminDocumentsPage() {
  const docs = await db
    .select({
      id: documents.id,
      title: documents.title,
      type: documents.type,
      sessionDate: documents.sessionDate,
      sourceUrl: documents.sourceUrl,
      blobUrl: documents.blobUrl,
      fileName: documents.fileName,
      fileSizeBytes: documents.fileSizeBytes,
      createdAt: documents.createdAt,
      municipalityName: municipalities.name,
      municipalityCanton: municipalities.canton,
    })
    .from(documents)
    .leftJoin(municipalities, eq(documents.municipalityId, municipalities.id))
    .orderBy(desc(documents.createdAt))
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold" style={{ color: "#f8fafc" }}>
          Document Manager
        </h2>
        <div className="flex gap-2">
          <Link
            href="/admin/documents"
            className="rounded-md px-3 py-1.5 text-xs font-bold"
            style={{ background: "#3b82f6", color: "#fff" }}
          >
            Refresh
          </Link>
        </div>
      </div>

      <div className={cardStyle}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["ID", "Municipality", "Title", "Type", "Date", "Blob", "Size"].map(
                (h) => (
                  <th key={h} className={headerCell}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td className={cell} style={{ color: "#475569", fontFamily: "monospace" }}>
                  #{doc.id}
                </td>
                <td className={cell}>
                  <span className="font-semibold" style={{ color: "#f8fafc" }}>
                    {doc.municipalityName || "Unknown"}
                  </span>
                  {doc.municipalityCanton && (
                    <span className="ml-1" style={{ color: "#64748b" }}>
                      ({doc.municipalityCanton})
                    </span>
                  )}
                </td>
                <td className={cell} style={{ maxWidth: "250px" }}>
                  <div className="truncate">{doc.title}</div>
                </td>
                <td className={cell}>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ background: "#3b82f622", color: "#60a5fa", border: "1px solid #3b82f644" }}
                  >
                    {doc.type}
                  </span>
                </td>
                <td className={cell}>
                  {doc.sessionDate
                    ? new Date(doc.sessionDate).toLocaleDateString("de-CH")
                    : "—"}
                </td>
                <td className={cell}>
                  {doc.blobUrl ? (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: "#22c55e22", color: "#22c55e" }}
                    >
                      uploaded
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: "#64748b22", color: "#94a3b8" }}
                    >
                      source only
                    </span>
                  )}
                </td>
                <td className={cell} style={{ color: "#94a3b8" }}>
                  {doc.fileSizeBytes
                    ? `${(doc.fileSizeBytes / 1024).toFixed(0)} kB`
                    : "—"}
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs" style={{ color: "#64748b" }}>
                  No documents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
