"""Tier 1: PyMuPDF text extraction for digital PDFs.

Cost: Free
Speed: ~5ms/page
Use when: PDF has embedded text (digital-native, ~70% of municipal protocols)
"""

from dataclasses import dataclass

import pymupdf


@dataclass
class ExtractionResult:
    text: list[str]  # text per page
    total_chars: int
    avg_chars_per_page: int
    is_digital: bool
    method: str = "pymupdf"


DIGITAL_THRESHOLD = 50  # avg chars/page to consider digital


def extract_text(pdf_path: str) -> ExtractionResult:
    """Extract text from PDF using PyMuPDF.

    Returns ExtractionResult with is_digital=True if the PDF has
    enough embedded text (avg > 50 chars/page).
    """
    doc = pymupdf.open(pdf_path)
    page_texts: list[str] = []

    for page in doc:
        page_texts.append(page.get_text())

    total_chars = sum(len(t) for t in page_texts)
    page_count = max(len(doc), 1)
    avg_chars = total_chars // page_count

    doc.close()

    return ExtractionResult(
        text=page_texts,
        total_chars=total_chars,
        avg_chars_per_page=avg_chars,
        is_digital=avg_chars > DIGITAL_THRESHOLD,
    )
