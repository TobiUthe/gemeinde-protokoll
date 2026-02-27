# OCR Service — services/ocr/

PDF processing through a 3-tier OCR pipeline. Runs on Modal.

## 3-Tier Pipeline

| Tier | Tool | Coverage | Cost | Use Case |
|------|------|----------|------|----------|
| 1 | PyMuPDF | ~70% | Free | Digital-native PDFs with embedded text |
| 2 | Mistral OCR 3 Batch | ~25% | $1/1K pages | Scanned PDFs, outputs Markdown |
| 3 | Azure Doc Intelligence | ~5% | $10/1K pages | Complex edge cases (fallback) |

## Routing Logic

1. Attempt PyMuPDF text extraction
2. If avg chars/page > 50 → use PyMuPDF result
3. Otherwise → escalate to Mistral OCR
4. If Mistral confidence is low → escalate to Azure

Always go through this pipeline. Never skip tiers.

## Contracts
- Receives: `NewDocumentEvent` (from Scraper)
- Emits: `ExtractedTextEvent` (to AI Parser)

## Commands

```bash
cd services/ocr
uv sync
uv run pytest tests/ -v
modal deploy app.py
```
