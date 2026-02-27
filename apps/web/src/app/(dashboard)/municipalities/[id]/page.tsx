export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { municipalities, documents } from "@protokolbase/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function MunicipalityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const muniId = parseInt(id, 10);
  if (isNaN(muniId)) notFound();

  const [muni] = await db
    .select()
    .from(municipalities)
    .where(eq(municipalities.id, muniId))
    .limit(1);

  if (!muni) notFound();

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.municipalityId, muniId))
    .orderBy(desc(documents.sessionDate));

  return (
    <div>
      <Link
        href="/municipalities"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to municipalities
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{muni.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{muni.canton}</Badge>
            {muni.language && <Badge variant="secondary">{muni.language}</Badge>}
            {muni.population && (
              <span className="text-sm text-muted-foreground">
                {muni.population.toLocaleString()} residents
              </span>
            )}
          </div>
        </div>
        {muni.websiteUrl && (
          <a href={muni.websiteUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" /> Website
            </Button>
          </a>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Documents ({docs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No documents indexed for this municipality yet.
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.sessionDate
                          ? new Date(doc.sessionDate).toLocaleDateString("de-CH")
                          : "No date"}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{doc.type}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
