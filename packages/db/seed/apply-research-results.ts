import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { municipalities } from "../src/schema/index";

interface ResearchResult {
  bfsNr: number;
  language?: "de" | "fr" | "it" | "rm" | null;
  population?: number | null;
  websiteUrl?: string | null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const filePath = resolve(__dir, "research-results.json");

  let results: ResearchResult[];
  try {
    results = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    console.error(`Could not read ${filePath}`);
    process.exit(1);
  }

  console.log(`Loaded ${results.length} research results${dryRun ? " (DRY RUN)" : ""}`);

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const BATCH = 50;
  for (let i = 0; i < results.length; i += BATCH) {
    const batch = results.slice(i, i + BATCH);

    const outcomes = await Promise.allSettled(
      batch.map(async (r) => {
        const data: Record<string, unknown> = {};
        if (r.language) data.language = r.language;
        if (r.population) data.population = r.population;
        if (r.websiteUrl) data.websiteUrl = r.websiteUrl;

        if (Object.keys(data).length === 0) {
          skipped++;
          return;
        }

        if (dryRun) {
          console.log(`  [DRY] BFS ${r.bfsNr}: ${JSON.stringify(data)}`);
          updated++;
          return;
        }

        await db
          .update(municipalities)
          .set(data)
          .where(eq(municipalities.bfsNr, r.bfsNr));

        updated++;
      }),
    );

    for (const o of outcomes) {
      if (o.status === "rejected") {
        errors++;
        console.error("Update failed:", o.reason);
      }
    }

    if ((i + BATCH) % 200 === 0 || i + BATCH >= results.length) {
      console.log(`Progress: ${Math.min(i + BATCH, results.length)}/${results.length}`);
    }
  }

  console.log(`\nApply complete:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (no data): ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

main().catch((err) => {
  console.error("Apply failed:", err);
  process.exit(1);
});
