# Shared Types — packages/shared-types/

Pydantic (Python) + Zod (TypeScript) contract types. **Most important directory** — all inter-service contracts live here.

## Contracts

| Type | Direction | Purpose |
|------|-----------|---------|
| `NewDocumentEvent` | Scraper → OCR | New document discovered |
| `ExtractedTextEvent` | OCR → AI Parser | Text extracted from PDF |
| `StructuredDocument` | AI Parser → Database | Parsed structured data |
| `ContentChangeEvent` | AI Parser → Notifications | Trigger for alerts |

## Convention
- **Contract-first**: always change this package before updating services
- When changing a contract, update ALL consumers
- Python types use Pydantic v2
- TypeScript types use Zod for runtime validation
