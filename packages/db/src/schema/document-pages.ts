import {
  integer,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { municipalitiesSchema } from "./municipalities";
import { documents } from "./documents";

export const documentPages = municipalitiesSchema.table(
  "document_pages",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    imageUrl: text("image_url").notNull(),
    imageBlobPathname: text("image_blob_pathname"),
    width: integer("width"),
    height: integer("height"),
    textContent: text("text_content"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("uq_document_pages_doc_page").on(t.documentId, t.pageNumber),
    index("idx_document_pages_document_id").on(t.documentId),
  ],
);

export type DocumentPage = typeof documentPages.$inferSelect;
export type NewDocumentPage = typeof documentPages.$inferInsert;
