# Notifications Service — services/notifications/

Alert rule engine and email delivery. Runs on Modal.

## Purpose
Processes content change events and sends notifications to subscribed users.

## Stack
- Python, Pydantic v2, async
- Resend for email delivery
- Modal for deployment

## Contracts
- Receives: `ContentChangeEvent` (from AI Parser)

## Commands

```bash
cd services/notifications
uv sync
uv run pytest tests/ -v
modal deploy app.py
```
