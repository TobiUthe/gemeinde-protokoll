# CLAUDE.md

**ProtokolBase** — Swiss municipal protocol aggregation platform. Scrapes 2,100+ municipality websites, processes PDFs (OCR + AI), extracts structured data, serves searchable web interface with notifications.

## Structure

```
apps/web/                  — Next.js 15 frontend (Vercel)
services/
  scraper/                 — Municipality scrapers + scheduler
  ocr/                     — PDF processing (3-tier pipeline)
  ai-parser/               — LLM extraction + NER + classification
  notifications/           — Alert engine + email (Resend)
  api/                     — FastAPI REST API
packages/
  shared-types/            — Pydantic + Zod contracts (most important)
  db/                      — Drizzle ORM, Neon PostgreSQL
  config/                  — Shared ESLint, Prettier, TSConfig, pytest
tools/municipality-configs/ — Per-municipality YAML configs
docs/                      — Detailed documentation per component
```

## Data Flow

`Scraper → OCR → AI Parser → Database → API → Frontend`

## Quick Commands

| Context | Command |
|---------|---------|
| Frontend | `pnpm run dev / build / test / lint` |
| Service | `cd services/<name> && uv sync && uv run pytest tests/ -v` |
| Deploy | `modal deploy app.py` |
| DB | `drizzle-kit push / studio` |
| CI | `turbo run lint typecheck test --filter=...affected` |

## Conventions

- **Contract-first** — change `packages/shared-types` before services, update all consumers
- **Brevity** — favor concise communication over perfect syntax, keep it short
- **Documentation** — always add or update docs in `docs/` when changing behavior. Update `docs/index.md` to link any new docs
- **Skills first** — use available Claude Code skills before manual approaches
- **Testing** — always define tests for changes, iterate and fix until all tests pass
- **Reuse** — check existing libraries for building blocks before adding new dependencies; prefer broad, well-maintained libraries over building from scratch
- **Python** — Pydantic v2, async, `uv`, strict typing
- **TypeScript** — strict mode, Zod runtime validation
- **Commits** — `feat(scraper): add Thun adapter`, `fix(ocr): handle corrupted PDFs`
- **Dependencies** — add to specific package/service, never root
- **Secrets** — Modal Secrets / Vercel env vars, never in code
- **Services communicate** via DB or Modal function calls, never HTTP between services
- **Frontend** — Server Components query DB directly via Drizzle

## Planning

- **Plan first** — for non-trivial tasks (3+ steps, multiple files, architectural decisions), write a structured plan before coding
- **Plan format** — numbered steps, each with a clear deliverable; note files to modify and dependencies between steps
- **Review before executing** — re-read the plan for consistency, completeness, and correct order; fix gaps before starting
- **Step-by-step execution** — work through the plan one step at a time; mark each step done as you go
- **Validate after each step** — verify the step's outcome (tests pass, types check, behavior correct) before moving to the next
- **Adjust on the fly** — if a step reveals new information or a problem, update the remaining plan accordingly; don't blindly follow an outdated plan
- **Given a plan** — when provided with an external plan, follow it step-by-step with the same validate-and-adjust discipline

## Docs

Detailed docs live in `docs/`. Each app/service has its own file. See [docs/index.md](docs/index.md) for the full map.
