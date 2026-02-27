"""Tier 3: Azure Document Intelligence fallback.

Cost: $10/1K pages (Layout), $1.50/1K pages (Read)
Speed: ~1 sec/page
Use when: Mistral returns low confidence, or doc has handwritten content.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import httpx


@dataclass
class AzureOcrResult:
    text: str
    page_texts: list[str]
    confidence: float
    method: str = "azure"


async def ocr_with_azure(
    pdf_path: str,
    *,
    endpoint: str | None = None,
    api_key: str | None = None,
    model: str = "prebuilt-read",
) -> AzureOcrResult:
    """Send PDF to Azure Document Intelligence and get text back.

    Note: This is a stub implementation. Full integration requires
    the Azure SDK or multi-step REST API calls (submit → poll → get results).
    """
    endpoint = endpoint or os.environ.get("AZURE_DOC_INTELLIGENCE_ENDPOINT", "")
    api_key = api_key or os.environ.get("AZURE_DOC_INTELLIGENCE_KEY", "")

    if not endpoint or not api_key:
        raise ValueError(
            "AZURE_DOC_INTELLIGENCE_ENDPOINT and AZURE_DOC_INTELLIGENCE_KEY must be set"
        )

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    analyze_url = f"{endpoint}/documentintelligence/documentModels/{model}:analyze?api-version=2024-11-30"

    async with httpx.AsyncClient(timeout=120) as client:
        # Submit analysis
        submit_resp = await client.post(
            analyze_url,
            headers={
                "Ocp-Apim-Subscription-Key": api_key,
                "Content-Type": "application/pdf",
            },
            content=pdf_bytes,
        )
        submit_resp.raise_for_status()

        result_url = submit_resp.headers.get("Operation-Location", "")
        if not result_url:
            raise RuntimeError("No Operation-Location header in Azure response")

        # Poll for results
        import asyncio

        for _ in range(60):
            await asyncio.sleep(2)
            poll_resp = await client.get(
                result_url,
                headers={"Ocp-Apim-Subscription-Key": api_key},
            )
            poll_resp.raise_for_status()
            result = poll_resp.json()

            if result.get("status") == "succeeded":
                content = result.get("analyzeResult", {}).get("content", "")
                pages = result.get("analyzeResult", {}).get("pages", [])
                page_texts = []
                for page in pages:
                    lines = page.get("lines", [])
                    page_texts.append("\n".join(line.get("content", "") for line in lines))

                avg_confidence = 0.0
                if pages:
                    word_confs = []
                    for page in pages:
                        for word in page.get("words", []):
                            word_confs.append(word.get("confidence", 0))
                    avg_confidence = (
                        sum(word_confs) / len(word_confs) * 100 if word_confs else 50.0
                    )

                return AzureOcrResult(
                    text=content,
                    page_texts=page_texts,
                    confidence=avg_confidence,
                )

            if result.get("status") == "failed":
                raise RuntimeError(f"Azure analysis failed: {result}")

        raise TimeoutError("Azure Document Intelligence polling timed out")
