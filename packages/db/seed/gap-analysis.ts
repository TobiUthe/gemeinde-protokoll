import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync } from "fs";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { isNull, or } from "drizzle-orm";
import { municipalities } from "../src/schema/index";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });

  const rows = await db
    .select({
      bfsNr: municipalities.bfsNr,
      name: municipalities.name,
      canton: municipalities.canton,
      language: municipalities.language,
      population: municipalities.population,
      websiteUrl: municipalities.websiteUrl,
    })
    .from(municipalities)
    .where(
      or(
        isNull(municipalities.language),
        isNull(municipalities.population),
        isNull(municipalities.websiteUrl),
      ),
    );

  const missingLang = rows.filter((r) => !r.language);
  const missingPop = rows.filter((r) => !r.population);
  const missingWeb = rows.filter((r) => !r.websiteUrl);

  console.log("=== GAP ANALYSIS ===");
  console.log(`Missing language: ${missingLang.length}`);
  console.log(`Missing population: ${missingPop.length}`);
  console.log(`Missing website: ${missingWeb.length}`);

  console.log("\n=== MISSING LANGUAGE (by canton) ===");
  const langByCanton: Record<string, { bfsNr: number; name: string }[]> = {};
  for (const r of missingLang) {
    if (!langByCanton[r.canton]) langByCanton[r.canton] = [];
    langByCanton[r.canton].push({ bfsNr: r.bfsNr, name: r.name });
  }
  for (const [canton, munis] of Object.entries(langByCanton)) {
    console.log(`${canton}: ${munis.map((m) => `${m.bfsNr} ${m.name}`).join(", ")}`);
  }

  console.log("\n=== MISSING POPULATION ===");
  for (const r of missingPop) {
    console.log(`${r.bfsNr} ${r.name} (${r.canton})`);
  }

  console.log("\n=== MISSING WEBSITE ===");
  for (const r of missingWeb) {
    console.log(`${r.bfsNr} ${r.name} (${r.canton})`);
  }

  writeFileSync(
    resolve(__dir, "gap-report.json"),
    JSON.stringify({ missingLang, missingPop, missingWeb }, null, 2),
  );
  console.log("\nWrote seed/gap-report.json");
}

main().catch((err) => {
  console.error("Gap analysis failed:", err);
  process.exit(1);
});
