import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ client: sql, schema });
export type Database = typeof db;
