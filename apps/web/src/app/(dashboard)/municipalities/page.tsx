export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { municipalities, documents } from "@protokolbase/db/schema";
import { count, desc, eq, ilike, sql } from "drizzle-orm";
import Link from "next/link";
import { Globe, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function MunicipalitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; canton?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const cantonFilter = params.canton || "";

  const conditions = [];
  if (query) {
    conditions.push(ilike(municipalities.name, `%${query}%`));
  }
  if (cantonFilter) {
    conditions.push(eq(municipalities.canton, cantonFilter as any));
  }

  const munis = await db
    .select({
      id: municipalities.id,
      name: municipalities.name,
      canton: municipalities.canton,
      language: municipalities.language,
      population: municipalities.population,
      websiteUrl: municipalities.websiteUrl,
      docCount: sql<number>`(SELECT count(*) FROM municipalities.documents WHERE municipality_id = ${municipalities.id})`,
    })
    .from(municipalities)
    .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
    .orderBy(desc(municipalities.population))
    .limit(100);

  const cantons = [
    "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR",
    "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG",
    "TI", "UR", "VD", "VS", "ZG", "ZH",
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Municipalities</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <form className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search municipalities..."
              className="pl-10"
            />
          </div>
          <select
            name="canton"
            defaultValue={cantonFilter}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All cantons</option>
            {cantons.map((c) => (
              <option key={c} value={c}>
                {c}
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
              <th className="text-left p-3 font-medium text-muted-foreground">Municipality</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Canton</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Language</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Population</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Documents</th>
            </tr>
          </thead>
          <tbody>
            {munis.map((m) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="p-3">
                  <Link
                    href={`/municipalities/${m.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {m.name}
                  </Link>
                </td>
                <td className="p-3">
                  <Badge variant="outline">{m.canton}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">{m.language || "—"}</td>
                <td className="p-3 text-right text-muted-foreground">
                  {m.population?.toLocaleString() || "—"}
                </td>
                <td className="p-3 text-right font-medium">{m.docCount}</td>
              </tr>
            ))}
            {munis.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No municipalities found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
