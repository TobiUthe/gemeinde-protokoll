"""Main OCR pipeline orchestrator.

Routes each PDF through the 3-tier hybrid pipeline:
  Tier 1: PyMuPDF (digital PDFs, free)
  Tier 2: Mistral OCR 3 (scanned, $1/1K pages)
  Tier 3: Azure Doc Intelligence (fallback, $10/1K pages)
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .tier1_pymupdf import extract_text
from .page_images import render_pages, PageImage
from .quality import check_quality, QualityReport


MISTRAL_CONFIDENCE_THRESHOLD = 60.0


@dataclass
class PipelineResult:
    text: str
    page_texts: list[str]
    method: str  # pymupdf, mistral, azure
    confidence: float
    quality: QualityReport
    page_images: list[PageImage] = field(default_factory=list)
    tier: int = 1


def process_pdf_tier1(pdf_path: str) -> PipelineResult | None:
    """Try Tier 1: PyMuPDF text extraction (digital PDFs).

    Returns PipelineResult if the PDF is digital, None if OCR is needed.
    """
    result = extract_text(pdf_path)

    if not result.is_digital:
        return None

    full_text = "\n\n".join(result.text)
    quality = check_quality(full_text, len(result.text))

    return PipelineResult(
        text=full_text,
        page_texts=result.text,
        method="pymupdf",
        confidence=min(95.0, result.avg_chars_per_page / 10.0),
        quality=quality,
        tier=1,
    )


async def process_pdf_tier2(pdf_path: str) -> PipelineResult | None:
    """Try Tier 2: Mistral OCR 3 (scanned PDFs).

    Returns PipelineResult if confidence is above threshold,
    None if Azure fallback is needed.
    """
    from .tier2_mistral import ocr_with_mistral

    result = await ocr_with_mistral(pdf_path)

    if result.confidence < MISTRAL_CONFIDENCE_THRESHOLD:
        return None

    quality = check_quality(result.text, len(result.page_texts))

    return PipelineResult(
        text=result.text,
        page_texts=result.page_texts,
        method="mistral",
        confidence=result.confidence,
        quality=quality,
        tier=2,
    )


async def process_pdf_tier3(pdf_path: str) -> PipelineResult:
    """Tier 3: Azure Document Intelligence fallback."""
    from .tier3_azure import ocr_with_azure

    result = await ocr_with_azure(pdf_path)
    quality = check_quality(result.text, len(result.page_texts))

    return PipelineResult(
        text=result.text,
        page_texts=result.page_texts,
        method="azure",
        confidence=result.confidence,
        quality=quality,
        tier=3,
    )


async def process_pdf(
    pdf_path: str,
    *,
    generate_images: bool = True,
    image_dpi: int = 150,
) -> PipelineResult:
    """Process a PDF through the full 3-tier pipeline.

    1. Try PyMuPDF (free, instant) — works for ~70% of docs
    2. If not digital, try Mistral OCR 3 ($1/1K pages) — works for ~25%
    3. If Mistral confidence is low, fallback to Azure ($10/1K pages) — ~5%

    Always generates page images if generate_images=True.
    """
    # Generate page images (always do this regardless of OCR tier)
    page_images: list[PageImage] = []
    if generate_images:
        page_images = render_pages(pdf_path, dpi=image_dpi)

    # Tier 1: PyMuPDF
    result = process_pdf_tier1(pdf_path)
    if result:
        result.page_images = page_images
        return result

    # Tier 2: Mistral OCR
    try:
        result = await process_pdf_tier2(pdf_path)
        if result:
            result.page_images = page_images
            return result
    except Exception:
        pass  # Fall through to Tier 3

    # Tier 3: Azure fallback
    result = await process_pdf_tier3(pdf_path)
    result.page_images = page_images
    return result
