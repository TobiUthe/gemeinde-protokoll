CREATE SCHEMA "municipalities";
--> statement-breakpoint
CREATE TYPE "municipalities"."canton" AS ENUM('AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH');--> statement-breakpoint
CREATE TYPE "municipalities"."municipality_language" AS ENUM('de', 'fr', 'it', 'rm');--> statement-breakpoint
CREATE TYPE "municipalities"."municipality_status" AS ENUM('active', 'merged', 'dissolved');--> statement-breakpoint
CREATE TABLE "municipalities"."municipalities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "municipalities"."municipalities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"bfs_nr" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"canton" "municipalities"."canton" NOT NULL,
	"district_nr" integer,
	"district_name" varchar(255),
	"language" "municipalities"."municipality_language",
	"population" integer,
	"website_url" text,
	"status" "municipalities"."municipality_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_municipalities_bfs_nr" ON "municipalities"."municipalities" USING btree ("bfs_nr");--> statement-breakpoint
CREATE INDEX "idx_municipalities_canton" ON "municipalities"."municipalities" USING btree ("canton");--> statement-breakpoint
CREATE INDEX "idx_municipalities_name" ON "municipalities"."municipalities" USING btree ("name");