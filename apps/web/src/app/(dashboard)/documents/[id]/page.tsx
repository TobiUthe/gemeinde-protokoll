export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { documents, municipalities, documentPages } from "@protokolbase/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const docId = parseInt(id, 10);
  if (isNaN(docId)) notFound();

  const [doc] = await db
    .select({
      id: documents.id,
      title: documents.title,
      type: documents.type,
      sessionDate: documents.sessionDate,
      sessionTitle: documents.sessionTitle,
      sourceUrl: documents.sourceUrl,
      blobUrl: documents.blobUrl,
      blobDownloadUrl: documents.blobDownloadUrl,
      fileName: documents.fileName,
      fileSizeBytes: documents.fileSizeBytes,
      municipalityId: documents.municipalityId,
      municipalityName: municipalities.name,
      municipalityCanton: municipalities.canton,
    })
    .from(documents)
    .leftJoin(municipalities, eq(documents.municipalityId, municipalities.id))
    .where(eq(documents.id, docId))
    .limit(1);

  if (!doc) notFound();

  const pages = await db
    .select()
    .from(documentPages)
    .where(eq(documentPages.documentId, docId))
    .orderBy(asc(documentPages.pageNumber));

  return (
    <div>
      <Link
        href="/documents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to documents
      </Link>

      {/* Document header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{doc.type.replace("_", " ")}</Badge>
            {doc.municipalityName && (
              <Link
                href={`/municipalities/${doc.municipalityId}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {doc.municipalityName} ({doc.municipalityCanton})
              </Link>
            )}
            {doc.sessionDate && (
              <span className="text-sm text-muted-foreground">
                {new Date(doc.sessionDate).toLocaleDateString("de-CH")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {doc.blobDownloadUrl && (
            <a href={doc.blobDownloadUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
            </a>
          )}
          {doc.sourceUrl && (
            <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" /> Source
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Page images gallery */}
      {pages.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pages ({pages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="border rounded-lg overflow-hidden bg-slate-50"
                >
                  <div className="px-3 py-1.5 bg-muted/50 border-b text-xs text-muted-foreground font-medium">
                    Page {page.pageNumber}
                  </div>
                  <div className="p-4 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={page.imageUrl}
                      alt={`Page ${page.pageNumber}`}
                      className="max-w-full shadow-md rounded"
                      style={{
                        maxHeight: "800px",
                        width: page.width ? `${Math.min(page.width, 700)}px` : "auto",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : doc.blobUrl ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe
              src={doc.blobUrl}
              className="w-full h-[800px] border rounded-lg"
              title={doc.title}
            />
          </CardContent>
        </Card>
      ) : doc.sourceUrl ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Page images not yet generated for this document.
            </p>
            <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> View original PDF
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No preview available for this document.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
