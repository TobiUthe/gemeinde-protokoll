# ProtokolBase Documentation

Overarching guide for the ProtokolBase platform. Each component has its own doc file linked below.

## Architecture

Monorepo with independent deployments. Services run on Modal (serverless Python), frontend on Vercel (Next.js).

```
Scraper → OCR Pipeline → AI Parser → Database → API → Frontend
```

## Key Contracts (packages/shared-types)

| Contract | From → To |
|----------|-----------|
| `NewDocumentEvent` | Scraper → OCR |
| `ExtractedTextEvent` | OCR → AI Parser |
| `StructuredDocument` | AI Parser → Database |
| `ContentChangeEvent` | AI Parser → Notifications |

Change contracts first, then update all consumers.

## Component Docs

### Applications
- [web.md](web.md) — Next.js 15 frontend (marketing, auth, dashboard, admin)

### Services
- [scraper.md](scraper.md) — Municipality scrapers + scheduler + health monitor
- [ocr.md](ocr.md) — PDF processing: 3-tier hybrid OCR pipeline (PyMuPDF → Mistral → Azure)
- [ai-parser.md](ai-parser.md) — LLM structured extraction, NER, topic classification
- [notifications.md](notifications.md) — Alert rule engine, email delivery
- [api.md](api.md) — FastAPI REST API

### Packages
- [shared-types.md](shared-types.md) — Pydantic + Zod contract types
- [database.md](database.md) — Drizzle ORM schema (municipalities, documents, auth, document_pages), Neon PostgreSQL

### Tools
- [municipality-configs.md](municipality-configs.md) — Per-municipality YAML scraper configs

## CI/CD

Path-filtered GitHub Actions — each service deploys independently when its code changes.
