export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { documents, municipalities } from "@protokolbase/db/schema";
import { desc, ilike, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const typeFilter = params.type || "";

  const conditions = [];
  if (query) {
    conditions.push(ilike(documents.title, `%${query}%`));
  }
  if (typeFilter) {
    conditions.push(eq(documents.type, typeFilter as any));
  }

  const docs = await db
    .select({
      id: documents.id,
      title: documents.title,
      type: documents.type,
      sessionDate: documents.sessionDate,
      municipalityId: documents.municipalityId,
      sourceUrl: documents.sourceUrl,
      blobUrl: documents.blobUrl,
      municipalityName: municipalities.name,
      municipalityCanton: municipalities.canton,
    })
    .from(documents)
    .leftJoin(municipalities, eq(documents.municipalityId, municipalities.id))
    .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
    .orderBy(desc(documents.sessionDate))
    .limit(100);

  const docTypes = [
    "protocol",
    "financial_report",
    "appendix",
    "income_statement",
    "agenda_item",
    "other",
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Documents</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <form className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search documents..."
              className="pl-10"
            />
          </div>
          <select
            name="type"
            defaultValue={typeFilter}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All types</option>
            {docTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
          <button type="submit" className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Municipality</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="p-3">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {doc.title}
                  </Link>
                </td>
                <td className="p-3">
                  {doc.municipalityName && (
                    <Link
                      href={`/municipalities/${doc.municipalityId}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {doc.municipalityName} ({doc.municipalityCanton})
                    </Link>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant="secondary">{doc.type.replace("_", " ")}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {doc.sessionDate
                    ? new Date(doc.sessionDate).toLocaleDateString("de-CH")
                    : "—"}
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
