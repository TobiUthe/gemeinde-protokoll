import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, isNull } from "drizzle-orm";
import { municipalities } from "../src/schema/index";

const MONOLINGUAL_CANTONS: Record<string, "de" | "fr" | "it"> = {
  AG: "de", AI: "de", AR: "de", BL: "de", BS: "de", GL: "de",
  LU: "de", NW: "de", OW: "de", SG: "de", SH: "de", SO: "de",
  SZ: "de", TG: "de", UR: "de", ZG: "de", ZH: "de",
  GE: "fr", JU: "fr", NE: "fr", VD: "fr",
  TI: "it",
};

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });

  let total = 0;

  for (const [canton, lang] of Object.entries(MONOLINGUAL_CANTONS)) {
    const result = await db
      .update(municipalities)
      .set({ language: lang })
      .where(
        and(
          eq(municipalities.canton, canton as typeof municipalities.canton.enumValues[number]),
          isNull(municipalities.language),
        ),
      );

    const count = result.rowCount ?? 0;
    if (count > 0) {
      console.log(`${canton}: set language=${lang} for ${count} municipalities`);
      total += count;
    }
  }

  console.log(`\nFilled language for ${total} municipalities in monolingual cantons.`);
}

main().catch((err) => {
  console.error("Fill languages failed:", err);
  process.exit(1);
});
