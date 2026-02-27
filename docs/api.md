# API Service — services/api/

FastAPI REST API. Runs on Modal.

## Purpose
Serves structured data to the frontend and external consumers.

## Stack
- FastAPI
- Python, Pydantic v2, async
- Modal for deployment

## Commands

```bash
cd services/api
uv sync
uv run pytest tests/ -v
modal deploy app.py
```
