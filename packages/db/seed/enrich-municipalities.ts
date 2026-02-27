import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { municipalities } from "../src/schema/index";

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "ProtokolBase/1.0 (municipality-enrichment)";

const SPARQL_QUERY = `
SELECT ?bfsNr ?population ?website ?language WHERE {
  ?municipality wdt:P31 wd:Q70208 .
  ?municipality wdt:P771 ?bfsNr .
  OPTIONAL { ?municipality wdt:P1082 ?population . }
  OPTIONAL { ?municipality wdt:P856 ?website . }
  OPTIONAL { ?municipality wdt:P37 ?language . }
}
`;

const LANGUAGE_MAP: Record<string, "de" | "fr" | "it" | "rm"> = {
  "http://www.wikidata.org/entity/Q188": "de",
  "http://www.wikidata.org/entity/Q150": "fr",
  "http://www.wikidata.org/entity/Q652": "it",
  "http://www.wikidata.org/entity/Q13199": "rm",
};

interface WikidataBinding {
  bfsNr: { type: string; value: string };
  population?: { type: string; value: string };
  website?: { type: string; value: string };
  language?: { type: string; value: string };
}

interface Enrichment {
  bfsNr: number;
  language: "de" | "fr" | "it" | "rm" | null;
  population: number | null;
  websiteUrl: string | null;
}

async function fetchFromWikidata(): Promise<WikidataBinding[]> {
  const url = new URL(SPARQL_ENDPOINT);
  url.searchParams.set("query", SPARQL_QUERY);
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`Wikidata SPARQL error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.results.bindings as WikidataBinding[];
}

function parseResults(bindings: WikidataBinding[]): Map<number, Enrichment> {
  const map = new Map<number, Enrichment>();
  const multiLang: number[] = [];

  for (const row of bindings) {
    const bfsNr = parseInt(row.bfsNr.value, 10);
    if (isNaN(bfsNr)) continue;

    const langQid = row.language?.value;
    const lang = langQid ? (LANGUAGE_MAP[langQid] ?? null) : null;
    const pop = row.population ? parseInt(row.population.value, 10) : null;
    const web = row.website?.value ?? null;

    const existing = map.get(bfsNr);
    if (!existing) {
      map.set(bfsNr, { bfsNr, language: lang, population: pop, websiteUrl: web });
    } else {
      if (existing.language && lang && existing.language !== lang) {
        multiLang.push(bfsNr);
      }
      if (!existing.language && lang) existing.language = lang;
      if (!existing.population && pop) existing.population = pop;
      if (!existing.websiteUrl && web) existing.websiteUrl = web;
    }
  }

  if (multiLang.length > 0) {
    const unique = [...new Set(multiLang)];
    console.log(`Bilingual municipalities (first language kept): ${unique.join(", ")}`);
  }

  return map;
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });

  console.log("Fetching municipality data from Wikidata...");
  const bindings = await fetchFromWikidata();
  console.log(`Received ${bindings.length} rows from Wikidata`);

  const enrichments = parseResults(bindings);
  console.log(`Parsed ${enrichments.size} unique municipalities`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let missingLang = 0;
  let missingPop = 0;
  let missingWeb = 0;

  const entries = Array.from(enrichments.values());
  const BATCH = 50;

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);

    const results = await Promise.allSettled(
      batch.map(async (e) => {
        const data: Record<string, unknown> = {};
        if (e.language) data.language = e.language;
        else missingLang++;
        if (e.population) data.population = e.population;
        else missingPop++;
        if (e.websiteUrl) data.websiteUrl = e.websiteUrl;
        else missingWeb++;

        if (Object.keys(data).length === 0) {
          skipped++;
          return;
        }

        await db
          .update(municipalities)
          .set(data)
          .where(eq(municipalities.bfsNr, e.bfsNr));

        updated++;
      }),
    );

    for (const r of results) {
      if (r.status === "rejected") {
        errors++;
        console.error("Update failed:", r.reason);
      }
    }

    if ((i + BATCH) % 200 === 0 || i + BATCH >= entries.length) {
      console.log(`Progress: ${Math.min(i + BATCH, entries.length)}/${entries.length}`);
    }
  }

  console.log(`\nEnrichment complete:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (no data): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Missing language: ${missingLang}`);
  console.log(`  Missing population: ${missingPop}`);
  console.log(`  Missing website: ${missingWeb}`);
}

main().catch((err) => {
  console.error("Enrichment failed:", err);
  process.exit(1);
});
