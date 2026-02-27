"""Tier 2: Mistral OCR 3 for scanned PDFs.

Cost: $1/1K pages (batch), $2/1K pages (standard)
Speed: ~2000 pages/min
Use when: PDF is scanned/image-based (Tier 1 found <50 chars/page avg)
"""

from __future__ import annotations

import base64
import os
from dataclasses import dataclass, field

import httpx


@dataclass
class MistralOcrResult:
    text: str  # Markdown output
    page_texts: list[str]
    confidence: float
    method: str = "mistral"


MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"


async def ocr_with_mistral(
    pdf_path: str,
    *,
    api_key: str | None = None,
) -> MistralOcrResult:
    """Send PDF to Mistral OCR 3 and get Markdown text back."""
    api_key = api_key or os.environ.get("MISTRAL_API_KEY", "")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY not set")

    with open(pdf_path, "rb") as f:
        pdf_b64 = base64.b64encode(f.read()).decode()

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            MISTRAL_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "mistral-ocr-latest",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "document_url",
                                "document_url": f"data:application/pdf;base64,{pdf_b64}",
                            },
                        ],
                    }
                ],
            },
        )
        response.raise_for_status()
        data = response.json()

    # Extract text from response
    pages = data.get("pages", [])
    page_texts = [p.get("markdown", "") for p in pages] if pages else []
    full_text = "\n\n---\n\n".join(page_texts) if page_texts else data.get("choices", [{}])[0].get("message", {}).get("content", "")

    # Rough confidence: if we got substantial text, confidence is high
    total_chars = len(full_text)
    confidence = min(95.0, max(30.0, total_chars / 100.0))

    return MistralOcrResult(
        text=full_text,
        page_texts=page_texts if page_texts else [full_text],
        confidence=confidence,
    )
