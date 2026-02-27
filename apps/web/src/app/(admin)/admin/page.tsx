export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { municipalities, documents, users } from "@protokolbase/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";

const cardStyle =
  "rounded-[10px] p-4 border" +
  " " +
  "[border-color:#1e293b] [background:#111827]";

const statLabel = "text-[10px] font-semibold tracking-wide uppercase [color:#64748b]";
const statValue = "text-2xl font-extrabold mt-1 [color:#f8fafc]";

export default async function AdminDashboardPage() {
  const [muniCount] = await db.select({ value: count() }).from(municipalities);
  const [docCount] = await db.select({ value: count() }).from(documents);
  const [userCount] = await db.select({ value: count() }).from(users);

  const activeMunis = await db
    .select({ value: count() })
    .from(municipalities)
    .where(eq(municipalities.status, "active"));

  const recentDocs = await db
    .select({
      id: documents.id,
      title: documents.title,
      type: documents.type,
      sessionDate: documents.sessionDate,
      createdAt: documents.createdAt,
      municipalityName: municipalities.name,
    })
    .from(documents)
    .leftJoin(municipalities, eq(documents.municipalityId, municipalities.id))
    .orderBy(desc(documents.createdAt))
    .limit(10);

  return (
    <div>
      <h2 className="text-base font-bold mb-5" style={{ color: "#f8fafc" }}>
        Pipeline Monitor
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Municipalities", value: muniCount.value, sub: `${activeMunis[0].value} active`, color: "#3b82f6" },
          { label: "Documents", value: docCount.value, sub: "Total indexed", color: "#22c55e" },
          { label: "Users", value: userCount.value, sub: "Registered", color: "#8b5cf6" },
          { label: "Pending OCR", value: 0, sub: "In queue", color: "#f59e0b" },
        ].map((stat) => (
          <div key={stat.label} className={cardStyle}>
            <div className={statLabel}>{stat.label}</div>
            <div className={statValue} style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-[10px] mt-1" style={{ color: "#64748b" }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Recent documents */}
      <div className={cardStyle}>
        <div className="pb-3 mb-3" style={{ borderBottom: "1px solid #1e293b" }}>
          <span className="text-xs font-bold" style={{ color: "#f8fafc" }}>
            Recent Documents
          </span>
        </div>
        {recentDocs.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color: "#64748b" }}>
            No documents yet
          </div>
        ) : (
          <div className="space-y-0">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-2 px-1"
                style={{ borderBottom: "1px solid #0a0f1c" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono" style={{ color: "#475569" }}>
                    #{doc.id}
                  </span>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "#f8fafc" }}>
                      {doc.title}
                    </div>
                    <div className="text-[10px]" style={{ color: "#64748b" }}>
                      {doc.municipalityName || "Unknown"} ·{" "}
                      {doc.sessionDate
                        ? new Date(doc.sessionDate).toLocaleDateString("de-CH")
                        : "No date"}
                    </div>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    background: "#3b82f622",
                    color: "#60a5fa",
                    border: "1px solid #3b82f644",
                  }}
                >
                  {doc.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
