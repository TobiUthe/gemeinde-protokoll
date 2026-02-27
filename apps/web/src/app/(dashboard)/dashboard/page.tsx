export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { municipalities, documents } from "@protokolbase/db/schema";
import { count, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, Globe } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [muniCount] = await db.select({ value: count() }).from(municipalities);
  const [docCount] = await db.select({ value: count() }).from(documents);

  const recentDocs = await db
    .select({
      id: documents.id,
      title: documents.title,
      type: documents.type,
      sessionDate: documents.sessionDate,
      municipalityId: documents.municipalityId,
    })
    .from(documents)
    .orderBy(desc(documents.createdAt))
    .limit(10);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Municipalities", value: muniCount.value.toLocaleString(), icon: Globe },
          { label: "Documents", value: docCount.value.toLocaleString(), icon: FileText },
          { label: "Cantons", value: "26", icon: Building2 },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
                <Icon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent documents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No documents yet. Documents will appear here as they are processed.
            </p>
          ) : (
            <div className="space-y-2">
              {recentDocs.map((doc) => (
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
