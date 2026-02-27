/**
 * Seed an admin user for ProtokolBase.
 *
 * Usage: pnpm db:seed-admin
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dir, "../../../.env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { users } from "../src/schema/index";

// bcryptjs for password hashing
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@protokolbase.ch";
const ADMIN_NAME = "Admin";
const ADMIN_PASSWORD = "admin123456"; // Change in production!

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });

  // Check if admin already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL));

  if (existing) {
    console.log(`Admin user already exists (${ADMIN_EMAIL})`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await db.insert(users).values({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    hashedPassword,
    role: "admin",
  });

  console.log(`Admin user created: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD} (change in production!)`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
