# Scraper Service — services/scraper/

Municipality scrapers + scheduler + health monitor. Runs on Modal (serverless Python).

## Purpose
Scrapes 2,100+ Swiss municipality websites for new protocol documents (PDFs).

## Stack
- Python, Pydantic v2, async
- Modal for deployment
- `uv` for dependency management

## Commands

```bash
cd services/scraper
uv sync                   # install deps
uv run pytest tests/ -v   # run tests
modal deploy app.py       # deploy
```

## Key Behavior
- Municipality-specific configs live in `tools/municipality-configs/` (YAML), never hardcode URLs
- Emits `NewDocumentEvent` to trigger OCR pipeline
- Communicates via DB writes / Modal function calls, never HTTP
