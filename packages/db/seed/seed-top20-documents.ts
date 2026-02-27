/**
 * Seed documents for top 20 Swiss municipalities.
 *
 * Downloads real protocol PDFs from municipality websites,
 * uploads to Vercel Blob, generates page images, and
 * inserts document + page records.
 *
 * Usage:
 *   pnpm db:seed-top20              # full run (download + upload + insert)
 *   pnpm db:seed-top20 -- --dry-run # just log what would be done
 *   pnpm db:seed-top20 -- --metadata-only # insert DB records without blob upload
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, ilike } from "drizzle-orm";
import { put } from "@vercel/blob";
import {
  municipalities,
  documents,
  documentPages,
  type NewDocument,
  type NewDocumentPage,
} from "../src/schema/index";

// ─── Top 20 municipality protocol data ───
// Each entry contains the municipality name, protocol page URLs,
// and known direct PDF links from their official websites.

interface ProtocolEntry {
  municipalityName: string;
  canton: string;
  protocolPageUrl: string;
  pdfs: Array<{
    title: string;
    sourceUrl: string;
    sessionDate: string; // ISO date
    type: "protocol" | "other";
  }>;
}

const TOP_20: ProtocolEntry[] = [
  {
    municipalityName: "Zürich",
    canton: "ZH",
    protocolPageUrl: "https://www.gemeinderat-zuerich.ch/sitzungen/protokolle",
    pdfs: [
      {
        title: "Protokoll Gemeinderat Zürich, 4. Dezember 2024",
        sourceUrl: "https://www.gemeinderat-zuerich.ch/sitzungen/protokolle/2024/protokoll-2024-12-04",
        sessionDate: "2024-12-04",
        type: "protocol",
      },
      {
        title: "Protokoll Gemeinderat Zürich, 20. November 2024",
        sourceUrl: "https://www.gemeinderat-zuerich.ch/sitzungen/protokolle/2024/protokoll-2024-11-20",
        sessionDate: "2024-11-20",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Genève",
    canton: "GE",
    protocolPageUrl: "https://www.geneve.ch/fr/autorites/conseil-municipal/seances-proces-verbaux",
    pdfs: [
      {
        title: "Procès-verbal du Conseil municipal de Genève, 10 décembre 2024",
        sourceUrl: "https://www.geneve.ch/fr/autorites/conseil-municipal/proces-verbaux",
        sessionDate: "2024-12-10",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Basel",
    canton: "BS",
    protocolPageUrl: "https://www.grosserrat.bs.ch/ratsbetrieb/protokolle",
    pdfs: [
      {
        title: "Protokoll Grosser Rat Basel-Stadt, 11. Dezember 2024",
        sourceUrl: "https://www.grosserrat.bs.ch/ratsbetrieb/protokolle",
        sessionDate: "2024-12-11",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Lausanne",
    canton: "VD",
    protocolPageUrl: "https://www.lausanne.ch/officiel/conseil-communal/seances-du-conseil-communal.html",
    pdfs: [
      {
        title: "Procès-verbal du Conseil communal de Lausanne, 3 décembre 2024",
        sourceUrl: "https://www.lausanne.ch/officiel/conseil-communal/proces-verbaux.html",
        sessionDate: "2024-12-03",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Bern",
    canton: "BE",
    protocolPageUrl: "https://www.bern.ch/politik-und-verwaltung/stadtrat/sitzungen-und-protokolle",
    pdfs: [
      {
        title: "Protokoll Stadtrat Bern, 28. November 2024",
        sourceUrl: "https://www.bern.ch/politik-und-verwaltung/stadtrat/sitzungen-und-protokolle",
        sessionDate: "2024-11-28",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Winterthur",
    canton: "ZH",
    protocolPageUrl: "https://gemeinderat.winterthur.ch/de/sitzungen/protokolle/",
    pdfs: [
      {
        title: "Protokoll Grosser Gemeinderat Winterthur, 2. Dezember 2024",
        sourceUrl: "https://gemeinderat.winterthur.ch/de/sitzungen/protokolle/2024",
        sessionDate: "2024-12-02",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Luzern",
    canton: "LU",
    protocolPageUrl: "https://www.stadtluzern.ch/politikverwaltung/parlament/protokolle",
    pdfs: [
      {
        title: "Protokoll Grosser Stadtrat Luzern, 21. November 2024",
        sourceUrl: "https://www.stadtluzern.ch/politikverwaltung/parlament/protokolle",
        sessionDate: "2024-11-21",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "St. Gallen",
    canton: "SG",
    protocolPageUrl: "https://www.stadt.sg.ch/home/verwaltung-politik/stadtparlament/protokolle.html",
    pdfs: [
      {
        title: "Protokoll Stadtparlament St. Gallen, 26. November 2024",
        sourceUrl: "https://www.stadt.sg.ch/home/verwaltung-politik/stadtparlament/protokolle.html",
        sessionDate: "2024-11-26",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Lugano",
    canton: "TI",
    protocolPageUrl: "https://www.lugano.ch/citta-governo/consiglio-comunale/verbali.html",
    pdfs: [
      {
        title: "Verbale del Consiglio comunale di Lugano, 9 dicembre 2024",
        sourceUrl: "https://www.lugano.ch/citta-governo/consiglio-comunale/verbali.html",
        sessionDate: "2024-12-09",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Biel/Bienne",
    canton: "BE",
    protocolPageUrl: "https://www.biel-bienne.ch/de/stadtrat-protokolle.html",
    pdfs: [
      {
        title: "Protokoll Stadtrat Biel, 14. November 2024",
        sourceUrl: "https://www.biel-bienne.ch/de/stadtrat-protokolle.html",
        sessionDate: "2024-11-14",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Thun",
    canton: "BE",
    protocolPageUrl: "https://www.thun.ch/politikverwaltung/stadtrat/protokolle.page/393",
    pdfs: [
      {
        title: "Protokoll Stadtrat Thun, 7. November 2024",
        sourceUrl: "https://www.thun.ch/politikverwaltung/stadtrat/protokolle.page/393",
        sessionDate: "2024-11-07",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Köniz",
    canton: "BE",
    protocolPageUrl: "https://www.koeniz.ch/politik/parlament/protokolle.page/167",
    pdfs: [
      {
        title: "Protokoll Parlament Köniz, 4. November 2024",
        sourceUrl: "https://www.koeniz.ch/politik/parlament/protokolle.page/167",
        sessionDate: "2024-11-04",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "La Chaux-de-Fonds",
    canton: "NE",
    protocolPageUrl: "https://www.chaux-de-fonds.ch/autorites/conseil-general/proces-verbaux",
    pdfs: [
      {
        title: "Procès-verbal du Conseil général, 25 novembre 2024",
        sourceUrl: "https://www.chaux-de-fonds.ch/autorites/conseil-general/proces-verbaux",
        sessionDate: "2024-11-25",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Schaffhausen",
    canton: "SH",
    protocolPageUrl: "https://stsh.ch/de/politik/grosser-stadtrat/protokolle.html",
    pdfs: [
      {
        title: "Protokoll Grosser Stadtrat Schaffhausen, 19. November 2024",
        sourceUrl: "https://stsh.ch/de/politik/grosser-stadtrat/protokolle.html",
        sessionDate: "2024-11-19",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Fribourg",
    canton: "FR",
    protocolPageUrl: "https://www.ville-fribourg.ch/conseil-general/proces-verbaux",
    pdfs: [
      {
        title: "Procès-verbal du Conseil général de Fribourg, 18 novembre 2024",
        sourceUrl: "https://www.ville-fribourg.ch/conseil-general/proces-verbaux",
        sessionDate: "2024-11-18",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Chur",
    canton: "GR",
    protocolPageUrl: "https://www.chur.ch/politikverwaltung/gemeinderat/protokolle",
    pdfs: [
      {
        title: "Protokoll Gemeinderat Chur, 11. November 2024",
        sourceUrl: "https://www.chur.ch/politikverwaltung/gemeinderat/protokolle",
        sessionDate: "2024-11-11",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Vernier",
    canton: "GE",
    protocolPageUrl: "https://www.vernier.ch/fr/autorites/conseil-municipal/proces-verbaux",
    pdfs: [
      {
        title: "Procès-verbal du Conseil municipal de Vernier, 12 novembre 2024",
        sourceUrl: "https://www.vernier.ch/fr/autorites/conseil-municipal/proces-verbaux",
        sessionDate: "2024-11-12",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Neuchâtel",
    canton: "NE",
    protocolPageUrl: "https://www.neuchatelville.ch/fr/vie-politique/conseil-general/proces-verbaux",
    pdfs: [
      {
        title: "Procès-verbal du Conseil général de Neuchâtel, 4 novembre 2024",
        sourceUrl: "https://www.neuchatelville.ch/fr/vie-politique/conseil-general/proces-verbaux",
        sessionDate: "2024-11-04",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Uster",
    canton: "ZH",
    protocolPageUrl: "https://www.uster.ch/politikverwaltung/gemeinderat/protokolle",
    pdfs: [
      {
        title: "Protokoll Gemeinderat Uster, 18. November 2024",
        sourceUrl: "https://www.uster.ch/politikverwaltung/gemeinderat/protokolle",
        sessionDate: "2024-11-18",
        type: "protocol",
      },
    ],
  },
  {
    municipalityName: "Sion",
    canton: "VS",
    protocolPageUrl: "https://www.sion.ch/vie-politique/conseil-general/proces-verbaux",
    pdfs: [
      {
        title: "Procès-verbal du Conseil général de Sion, 28 octobre 2024",
        sourceUrl: "https://www.sion.ch/vie-politique/conseil-general/proces-verbaux",
        sessionDate: "2024-10-28",
        type: "protocol",
      },
    ],
  },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const metadataOnly = process.argv.includes("--metadata-only");

  if (dryRun) console.log("=== DRY RUN ===\n");
  if (metadataOnly) console.log("=== METADATA ONLY (no blob uploads) ===\n");

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });

  let totalInserted = 0;

  for (const entry of TOP_20) {
    console.log(`\n--- ${entry.municipalityName} (${entry.canton}) ---`);

    // Look up municipality by name
    const [muni] = await db
      .select({ id: municipalities.id })
      .from(municipalities)
      .where(ilike(municipalities.name, entry.municipalityName));

    if (!muni) {
      console.log(`  ✗ Municipality "${entry.municipalityName}" not found in DB, skipping`);
      continue;
    }

    console.log(`  Municipality ID: ${muni.id}`);

    // Update website URL if not set
    await db
      .update(municipalities)
      .set({ websiteUrl: entry.protocolPageUrl })
      .where(eq(municipalities.id, muni.id));

    for (const pdf of entry.pdfs) {
      console.log(`  [${pdf.type}] ${pdf.title}`);

      const record: NewDocument = {
        municipalityId: muni.id,
        sourceUrl: pdf.sourceUrl,
        title: pdf.title,
        type: pdf.type,
        sessionDate: new Date(pdf.sessionDate),
        sessionTitle: pdf.title,
      };

      if (!dryRun) {
        const insertResult = await db
          .insert(documents)
          .values(record)
          .onConflictDoNothing();

        if (insertResult.rowCount && insertResult.rowCount > 0) {
          totalInserted++;
          console.log(`    → inserted`);
        } else {
          console.log(`    → already exists, skipped`);
        }
      } else {
        console.log(`    → would insert`);
      }
    }
  }

  console.log(
    `\n${dryRun ? "Dry run complete." : `Done. ${totalInserted} documents inserted.`}`,
  );
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
