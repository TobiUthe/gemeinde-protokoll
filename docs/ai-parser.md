# AI Parser Service — services/ai-parser/

LLM structured extraction, NER, and topic classification. Runs on Modal.

## Purpose
Takes extracted text from OCR and produces structured data: decisions, entities, financials.

## Stack
- Claude API for structured extraction
- spaCy for Named Entity Recognition (NER)
- Topic classification

## Contracts
- Receives: `ExtractedTextEvent` (from OCR)
- Emits: `StructuredDocument` (to Database)
- Emits: `ContentChangeEvent` (to Notifications)

## Commands

```bash
cd services/ai-parser
uv sync
uv run pytest tests/ -v
modal deploy app.py
```
