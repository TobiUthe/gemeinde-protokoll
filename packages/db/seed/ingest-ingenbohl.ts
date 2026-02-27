import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import * as cheerio from "cheerio";
import {
  municipalities,
  documents,
  type NewDocument,
} from "../src/schema/index";

const BASE_URL = "https://www.ingenbohl.ch";
const INGENBOHL_BFS_NR = 1002;

// Known session IDs — expand as new sessions are discovered
const SESSION_IDS = ["5342411", "6431182"];

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mär: 2, Mar: 2, Apr: 3, Mai: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Okt: 9, Nov: 10, Dez: 11,
};

function classifyDocument(title: string): NewDocument["type"] {
  const lower = title.toLowerCase();
  if (lower.includes("protokoll")) return "protocol";
  if (lower.includes("anhang")) return "appendix";
  if (lower.includes("jahresrechnung")) return "financial_report";
  if (lower.includes("erfolgsrechnung")) return "income_statement";
  if (lower.includes("schatzung") || lower.includes("schätzung"))
    return "valuation";
  if (lower.includes("traktandum")) return "agenda_item";
  return "other";
}

/** Parse "17. Apr. 2023, 20.00 Uhr" → Date */
function parseSessionDate(text: string): Date | null {
  // Match: "17. Apr. 2023" or "7. Apr. 2025"
  const m = text.match(/(\d{1,2})\.\s*(\w{3})\.?\s*(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = MONTH_MAP[m[2]];
  const year = parseInt(m[3], 10);
  if (month === undefined) return null;
  return new Date(year, month, day);
}

interface ParsedDoc {
  docId: string;
  title: string;
  sourceUrl: string;
}

interface ParsedSession {
  sessionId: string;
  sessionTitle: string;
  sessionDate: Date | null;
  documents: ParsedDoc[];
}

async function parseSessionPage(sessionId: string): Promise<ParsedSession> {
  const url = `${BASE_URL}/sitzungen/${sessionId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Extract session title from h1 or the main heading
  const sessionTitle =
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*[-|].*$/, "").trim();

  // Extract date from the page text
  let sessionDate: Date | null = null;
  const bodyText = $("body").text();
  const dateMatch = bodyText.match(
    /(\d{1,2}\.\s*\w{3}\.?\s*\d{4}),?\s*\d{1,2}\.\d{2}\s*Uhr/,
  );
  if (dateMatch) {
    sessionDate = parseSessionDate(dateMatch[1]);
  }

  // Extract document links with /_doc/ pattern
  const docs: ParsedDoc[] = [];
  const seen = new Set<string>();

  $('a[href^="/_doc/"]').each((_, el) => {
    const href = $(el).attr("href")!;
    const docId = href.replace("/_doc/", "");
    if (seen.has(docId)) return; // skip duplicate download links
    seen.add(docId);

    const title =
      $(el).attr("title") || $(el).text().trim();
    if (!title || title.toLowerCase() === "download") return;

    docs.push({
      docId,
      title,
      sourceUrl: `${BASE_URL}${href}`,
    });
  });

  return { sessionId, sessionTitle, sessionDate, documents: docs };
}

async function downloadAndUpload(
  sourceUrl: string,
  blobPathname: string,
): Promise<{
  blobUrl: string;
  blobDownloadUrl: string;
  blobPathname: string;
  sizeBytes: number;
}> {
  const res = await fetch(sourceUrl);
  if (!res.ok)
    throw new Error(`Failed to download ${sourceUrl}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const blob = await put(blobPathname, buffer, {
    access: "private",
    allowOverwrite: true,
    contentType: "application/pdf",
    addRandomSuffix: false,
  });

  return {
    blobUrl: blob.url,
    blobDownloadUrl: blob.downloadUrl,
    blobPathname: blob.pathname,
    sizeBytes: buffer.length,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("=== DRY RUN — no uploads or DB writes ===\n");

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });

  // Look up Ingenbohl municipality ID
  const [muni] = await db
    .select({ id: municipalities.id })
    .from(municipalities)
    .where(eq(municipalities.bfsNr, INGENBOHL_BFS_NR));

  if (!muni) throw new Error(`Municipality BFS ${INGENBOHL_BFS_NR} not found`);
  console.log(`Ingenbohl municipality ID: ${muni.id}\n`);

  let totalInserted = 0;

  for (const sessionId of SESSION_IDS) {
    console.log(`Processing session ${sessionId}...`);
    const session = await parseSessionPage(sessionId);
    console.log(
      `  Title: ${session.sessionTitle}`,
    );
    console.log(
      `  Date:  ${session.sessionDate?.toISOString().slice(0, 10) ?? "unknown"}`,
    );
    console.log(`  Documents: ${session.documents.length}\n`);

    for (const doc of session.documents) {
      const type = classifyDocument(doc.title);
      console.log(`  [${type}] ${doc.title} (doc ${doc.docId})`);

      const blobPath = `ingenbohl/${sessionId}/${doc.docId}.pdf`;

      let blobData: Awaited<ReturnType<typeof downloadAndUpload>> | null = null;
      if (!dryRun) {
        try {
          blobData = await downloadAndUpload(doc.sourceUrl, blobPath);
          console.log(
            `    → uploaded ${(blobData.sizeBytes / 1024).toFixed(0)} kB to ${blobData.blobPathname}`,
          );
        } catch (err) {
          console.error(`    ✗ upload failed: ${err}`);
        }
      } else {
        console.log(`    → would upload to ${blobPath}`);
      }

      const record: NewDocument = {
        municipalityId: muni.id,
        sourceUrl: doc.sourceUrl,
        sourceDocId: doc.docId,
        sessionId,
        title: doc.title,
        type,
        sessionDate: session.sessionDate,
        sessionTitle: session.sessionTitle,
        fileName: `${doc.docId}.pdf`,
        fileSizeBytes: blobData?.sizeBytes ?? null,
        blobUrl: blobData?.blobUrl ?? null,
        blobDownloadUrl: blobData?.blobDownloadUrl ?? null,
        blobPathname: blobData?.blobPathname ?? null,
      };

      if (!dryRun) {
        // Try insert; on conflict update blob fields if we have new data
        const insertResult = await db
          .insert(documents)
          .values(record)
          .onConflictDoNothing();

        if (insertResult.rowCount && insertResult.rowCount > 0) {
          totalInserted++;
        } else if (blobData) {
          // Row exists but we have fresh blob data — update it
          await db
            .update(documents)
            .set({
              blobUrl: blobData.blobUrl,
              blobDownloadUrl: blobData.blobDownloadUrl,
              blobPathname: blobData.blobPathname,
              fileSizeBytes: blobData.sizeBytes,
            })
            .where(eq(documents.sourceUrl, doc.sourceUrl));
          console.log(`    → updated existing record with blob data`);
        } else {
          console.log(`    → already exists, skipped`);
        }
      }
    }

    console.log();
  }

  console.log(
    dryRun
      ? "Dry run complete."
      : `Ingestion complete. ${totalInserted} documents inserted.`,
  );
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
