import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "drizzle-kit";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../.env.local") });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  schemaFilter: ["municipalities"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
