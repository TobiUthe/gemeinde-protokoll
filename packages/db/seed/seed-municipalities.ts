import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { municipalities, type NewMunicipality } from "../src/schema/index";

const CANTON_KEYS = Array.from({ length: 26 }, (_, i) => i + 1);
const PAGE_SIZE = 50;

interface OpenPlzCommune {
  key: string;
  historicalCode: string;
  name: string;
  shortName: string;
  district: { key: string; name: string; shortName: string };
  canton: { key: string; name: string; shortName: string };
}

async function fetchCommunesForCanton(
  cantonKey: number,
): Promise<OpenPlzCommune[]> {
  const all: OpenPlzCommune[] = [];
  let page = 1;

  while (true) {
    const url = `https://openplzapi.org/ch/Cantons/${cantonKey}/Communes?page=${page}&pageSize=${PAGE_SIZE}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status} for ${url}`);

    const data: OpenPlzCommune[] = await res.json();
    if (data.length === 0) break;

    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  return all;
}

function toCantonCode(
  shortName: string,
): NewMunicipality["canton"] {
  const valid = [
    "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR",
    "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG",
    "TI", "UR", "VD", "VS", "ZG", "ZH",
  ] as const;
  const code = shortName as (typeof valid)[number];
  if (!valid.includes(code)) throw new Error(`Unknown canton: ${shortName}`);
  return code;
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });

  let total = 0;

  for (const cantonKey of CANTON_KEYS) {
    const communes = await fetchCommunesForCanton(cantonKey);
    if (communes.length === 0) continue;

    const records: NewMunicipality[] = communes.map((c) => ({
      bfsNr: parseInt(c.key, 10),
      name: c.name,
      canton: toCantonCode(c.canton.shortName),
      districtNr: parseInt(c.district.key, 10),
      districtName: c.district.shortName,
    }));

    // Batch insert
    const BATCH = 100;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      await db
        .insert(municipalities)
        .values(batch)
        .onConflictDoNothing({ target: municipalities.bfsNr });
    }

    total += communes.length;
    console.log(
      `${communes[0].canton.shortName}: ${communes.length} communes (total: ${total})`,
    );
  }

  console.log(`\nSeeded ${total} municipalities.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
