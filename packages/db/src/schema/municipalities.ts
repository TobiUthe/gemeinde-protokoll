import {
  pgTable,
  pgEnum,
  pgSchema,
  integer,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const municipalitiesSchema = pgSchema("municipalities");

export const cantonEnum = municipalitiesSchema.enum("canton", [
  "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR",
  "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG",
  "TI", "UR", "VD", "VS", "ZG", "ZH",
]);

export const municipalityLanguageEnum = municipalitiesSchema.enum("municipality_language", [
  "de", "fr", "it", "rm",
]);

export const municipalityStatusEnum = municipalitiesSchema.enum("municipality_status", [
  "active", "merged", "dissolved",
]);

export const municipalities = municipalitiesSchema.table(
  "municipalities",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    bfsNr: integer("bfs_nr").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    canton: cantonEnum("canton").notNull(),
    districtNr: integer("district_nr"),
    districtName: varchar("district_name", { length: 255 }),
    language: municipalityLanguageEnum("language"),
    population: integer("population"),
    websiteUrl: text("website_url"),
    status: municipalityStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("uq_municipalities_bfs_nr").on(t.bfsNr),
    index("idx_municipalities_canton").on(t.canton),
    index("idx_municipalities_name").on(t.name),
  ],
);

export type Municipality = typeof municipalities.$inferSelect;
export type NewMunicipality = typeof municipalities.$inferInsert;
