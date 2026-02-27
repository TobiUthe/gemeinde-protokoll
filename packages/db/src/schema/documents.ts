import {
  integer,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { municipalitiesSchema, municipalities } from "./municipalities";

export const documentTypeEnum = municipalitiesSchema.enum("document_type", [
  "protocol",
  "financial_report",
  "appendix",
  "income_statement",
  "valuation",
  "agenda_item",
  "other",
]);

export const documents = municipalitiesSchema.table(
  "documents",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    municipalityId: integer("municipality_id")
      .notNull()
      .references(() => municipalities.id),
    sourceUrl: text("source_url").notNull(),
    sourceDocId: varchar("source_doc_id", { length: 64 }),
    sessionId: varchar("session_id", { length: 64 }),
    title: varchar("title", { length: 500 }).notNull(),
    type: documentTypeEnum("type").notNull().default("other"),
    sessionDate: timestamp("session_date", { mode: "date" }),
    sessionTitle: varchar("session_title", { length: 500 }),
    fileName: varchar("file_name", { length: 500 }),
    fileSizeBytes: integer("file_size_bytes"),
    mimeType: varchar("mime_type", { length: 128 }).default("application/pdf"),
    blobUrl: text("blob_url"),
    blobDownloadUrl: text("blob_download_url"),
    blobPathname: varchar("blob_pathname", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("uq_documents_source_url").on(t.sourceUrl),
    index("idx_documents_municipality_id").on(t.municipalityId),
    index("idx_documents_type").on(t.type),
    index("idx_documents_session_date").on(t.sessionDate),
    index("idx_documents_source_doc_id").on(t.sourceDocId),
  ],
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
