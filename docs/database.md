# Database — packages/db/

Drizzle ORM schema and migrations, backed by Neon PostgreSQL.

## Stack
- Drizzle ORM (`drizzle-orm` + `drizzle-kit`)
- Neon PostgreSQL (serverless, `@neondatabase/serverless` neon-http driver)
- Zod runtime validation via `drizzle-zod`

## Commands

```bash
cd packages/db
pnpm db:push          # apply schema to Neon
pnpm db:studio        # interactive schema browser
pnpm db:generate      # generate migration files
pnpm db:seed          # seed municipalities from OpenPLZ API
pnpm db:enrich        # populate language, population, website_url from Wikidata
pnpm db:fill-languages # auto-fill language for monolingual cantons
pnpm db:gap-analysis  # report missing fields by canton
pnpm db:apply-research # apply web-researched data from research-results.json
pnpm db:ingest-ingenbohl          # scrape + upload + insert Ingenbohl documents
pnpm db:ingest-ingenbohl --dry-run # preview without changes
pnpm db:seed-admin    # seed admin user (admin@protokolbase.ch)
pnpm db:seed-top20    # seed top 20 municipality documents
pnpm db:seed-top20 -- --dry-run     # preview without changes
pnpm db:seed-top20 -- --metadata-only # DB records only, no blob upload
pnpm typecheck        # type-check
```

## PostgreSQL Schemas

Each domain uses its own PostgreSQL schema for clean separation. Configure `schemaFilter` in `drizzle.config.ts` when adding new schemas.

- **`municipalities`** — municipality reference data, documents, auth, and page images

## Tables

### municipalities.municipalities

Reference registry of all Swiss municipalities (2,115 rows). Seeded from [OpenPLZ API](https://openplzapi.org).

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | Auto-generated identity |
| `bfs_nr` | integer | BFS number, unique |
| `name` | varchar(255) | Official name |
| `canton` | enum | 2-letter code (AG..ZH) |
| `district_nr` | integer | District BFS number |
| `district_name` | varchar(255) | District name |
| `language` | enum | de/fr/it/rm — Wikidata + canton mapping + web research |
| `population` | integer | Wikidata + web research |
| `website_url` | text | Wikidata + web research |
| `status` | enum | active/merged/dissolved, default active |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

Indexes: `bfs_nr` (unique), `canton`, `name`

### municipalities.documents

Protocol documents and related files scraped from municipality websites. Linked to municipalities via foreign key. PDFs stored in Vercel Blob.

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | Auto-generated identity |
| `municipality_id` | integer FK | References municipalities.id |
| `source_url` | text | Original URL, unique |
| `source_doc_id` | varchar(64) | CMS document ID |
| `session_id` | varchar(64) | CMS session ID |
| `title` | varchar(500) | Document title |
| `type` | enum | protocol / financial_report / appendix / income_statement / valuation / agenda_item / other |
| `session_date` | timestamp | Meeting date |
| `session_title` | varchar(500) | Meeting title |
| `file_name` | varchar(500) | Stored filename |
| `file_size_bytes` | integer | File size |
| `mime_type` | varchar(128) | Default application/pdf |
| `blob_url` | text | Vercel Blob URL |
| `blob_download_url` | text | Vercel Blob download URL |
| `blob_pathname` | varchar(500) | Path in blob store |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

Indexes: `source_url` (unique), `municipality_id`, `type`, `session_date`, `source_doc_id`

### municipalities.users

Auth.js v5 user accounts. Text UUIDs as primary keys (Auth.js requirement).

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | UUID, auto-generated |
| `name` | text | Display name |
| `email` | text | Unique, required |
| `email_verified` | timestamp | Email verification |
| `image` | text | Avatar URL |
| `hashed_password` | text | bcrypt hash |
| `role` | enum | user / admin |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

### municipalities.accounts / sessions / verification_tokens

Standard Auth.js v5 tables for OAuth providers, session management, and email verification. See `packages/db/src/schema/auth.ts`.

### municipalities.document_pages

Page-level images for document viewing. Each PDF page is rendered to a PNG and stored in Vercel Blob for fast web display.

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | Auto-generated identity |
| `document_id` | integer FK | References documents.id, cascade delete |
| `page_number` | integer | 1-based page number |
| `image_url` | text | Vercel Blob URL for page PNG |
| `image_blob_pathname` | text | Path in blob store |
| `width` | integer | Image width in pixels |
| `height` | integer | Image height in pixels |
| `text_content` | text | Extracted text for this page |
| `created_at` | timestamptz | Auto |

Indexes: `document_id` (FK), unique(`document_id`, `page_number`)

## Patterns
- Frontend Server Components query DB directly via Drizzle (read-only for public pages)
- Services write to DB, never communicate via HTTP between each other
- Connection loads `.env.local` from repo root automatically
