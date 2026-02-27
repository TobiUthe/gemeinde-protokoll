export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { municipalities } from "@protokolbase/db/schema";
import { desc, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const cardStyle = "rounded-[10px] border [border-color:#1e293b] [background:#111827] overflow-hidden";
const headerCell =
  "text-left p-3 text-[10px] font-bold tracking-wide uppercase [color:#64748b] [border-bottom:1px_solid_#1e293b]";
const cell = "p-3 text-xs [color:#cbd5e1] [border-bottom:1px_solid_#0a0f1c]";

async function addMunicipality(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const canton = formData.get("canton") as string;
  const websiteUrl = formData.get("websiteUrl") as string;
  const bfsNr = parseInt(formData.get("bfsNr") as string, 10);

  if (!name || !canton || isNaN(bfsNr)) return;

  await db.insert(municipalities).values({
    name,
    canton: canton as any,
    bfsNr,
    websiteUrl: websiteUrl || null,
    status: "active",
  });

  revalidatePath("/admin/municipalities");
}

export default async function AdminMunicipalitiesPage() {
  const munis = await db
    .select({
      id: municipalities.id,
      bfsNr: municipalities.bfsNr,
      name: municipalities.name,
      canton: municipalities.canton,
      language: municipalities.language,
      population: municipalities.population,
      websiteUrl: municipalities.websiteUrl,
      status: municipalities.status,
      docCount: sql<number>`(SELECT count(*) FROM municipalities.documents WHERE municipality_id = ${municipalities.id})`,
    })
    .from(municipalities)
    .orderBy(desc(municipalities.population))
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold" style={{ color: "#f8fafc" }}>
          Municipality Manager
        </h2>
      </div>

      {/* Add form */}
      <form action={addMunicipality} className="mb-5">
        <div
          className="rounded-[10px] p-4 border"
          style={{ background: "#111827", borderColor: "#3b82f644" }}
        >
          <div className="text-xs font-bold mb-3" style={{ color: "#60a5fa" }}>
            Add New Municipality
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { name: "name", placeholder: "Name (e.g. Rapperswil-Jona)", required: true },
              { name: "canton", placeholder: "Canton (e.g. SG)", required: true },
              { name: "bfsNr", placeholder: "BFS Nr", required: true },
              { name: "websiteUrl", placeholder: "https://..." },
            ].map((field) => (
              <input
                key={field.name}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                className="rounded-md px-3 py-2 text-xs outline-none"
                style={{
                  background: "#0a0f1c",
                  border: "1px solid #334155",
                  color: "#e2e8f0",
                }}
              />
            ))}
          </div>
          <button
            type="submit"
            className="rounded-md px-4 py-2 text-xs font-bold"
            style={{ background: "#3b82f6", color: "#fff" }}
          >
            Save Municipality
          </button>
        </div>
      </form>

      {/* Table */}
      <div className={cardStyle}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["BFS", "Municipality", "Canton", "Lang", "Population", "Status", "Docs"].map(
                (h) => (
                  <th key={h} className={headerCell}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {munis.map((m) => (
              <tr key={m.id}>
                <td className={cell} style={{ color: "#475569", fontFamily: "monospace" }}>
                  {m.bfsNr}
                </td>
                <td className={cell}>
                  <div className="font-semibold" style={{ color: "#f8fafc" }}>
                    {m.name}
                  </div>
                  <div className="text-[10px] mt-0.5 truncate max-w-[200px]" style={{ color: "#475569" }}>
                    {m.websiteUrl || "No URL"}
                  </div>
                </td>
                <td className={cell}>{m.canton}</td>
                <td className={cell}>{m.language || "—"}</td>
                <td className={cell}>{m.population?.toLocaleString() || "—"}</td>
                <td className={cell}>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                    style={{
                      background:
                        m.status === "active"
                          ? "#22c55e22"
                          : m.status === "merged"
                            ? "#f59e0b22"
                            : "#64748b22",
                      color:
                        m.status === "active"
                          ? "#22c55e"
                          : m.status === "merged"
                            ? "#f59e0b"
                            : "#94a3b8",
                      border: `1px solid ${m.status === "active" ? "#22c55e44" : "#64748b44"}`,
                    }}
                  >
                    {m.status}
                  </span>
                </td>
                <td className={cell} style={{ fontWeight: 700, color: "#f8fafc" }}>
                  {m.docCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
