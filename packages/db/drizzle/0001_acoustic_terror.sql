CREATE TYPE "municipalities"."document_type" AS ENUM('protocol', 'financial_report', 'appendix', 'income_statement', 'valuation', 'agenda_item', 'other');--> statement-breakpoint
CREATE TABLE "municipalities"."documents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "municipalities"."documents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"municipality_id" integer NOT NULL,
	"source_url" text NOT NULL,
	"source_doc_id" varchar(64),
	"session_id" varchar(64),
	"title" varchar(500) NOT NULL,
	"type" "municipalities"."document_type" DEFAULT 'other' NOT NULL,
	"session_date" timestamp,
	"session_title" varchar(500),
	"file_name" varchar(500),
	"file_size_bytes" integer,
	"mime_type" varchar(128) DEFAULT 'application/pdf',
	"blob_url" text,
	"blob_download_url" text,
	"blob_pathname" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "municipalities"."documents" ADD CONSTRAINT "documents_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"."municipalities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_documents_source_url" ON "municipalities"."documents" USING btree ("source_url");--> statement-breakpoint
CREATE INDEX "idx_documents_municipality_id" ON "municipalities"."documents" USING btree ("municipality_id");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "municipalities"."documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_documents_session_date" ON "municipalities"."documents" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "idx_documents_source_doc_id" ON "municipalities"."documents" USING btree ("source_doc_id");