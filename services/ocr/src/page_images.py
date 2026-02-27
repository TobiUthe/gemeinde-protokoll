"""Generate page images from PDF for fast web rendering.

Each PDF page is rendered to a PNG at 150 DPI using PyMuPDF,
suitable for web display without loading the full PDF.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pymupdf


@dataclass
class PageImage:
    page_number: int
    png_bytes: bytes
    width: int
    height: int


def render_pages(pdf_path: str, *, dpi: int = 150) -> list[PageImage]:
    """Render each PDF page to a PNG image.

    Args:
        pdf_path: Path to the PDF file.
        dpi: Resolution for rendering (150 is good for web display).

    Returns:
        List of PageImage with PNG bytes and dimensions.
    """
    doc = pymupdf.open(pdf_path)
    images: list[PageImage] = []

    zoom = dpi / 72.0  # 72 DPI is the PDF default
    mat = pymupdf.Matrix(zoom, zoom)

    for page_num, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=mat)
        images.append(
            PageImage(
                page_number=page_num,
                png_bytes=pix.tobytes("png"),
                width=pix.width,
                height=pix.height,
            )
        )

    doc.close()
    return images


def save_pages_to_disk(
    pdf_path: str, output_dir: str, *, dpi: int = 150
) -> list[tuple[int, str, int, int]]:
    """Render PDF pages and save to disk.

    Returns:
        List of (page_number, file_path, width, height)
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    pages = render_pages(pdf_path, dpi=dpi)
    results: list[tuple[int, str, int, int]] = []

    for page in pages:
        file_path = out / f"page-{page.page_number:03d}.png"
        file_path.write_bytes(page.png_bytes)
        results.append((page.page_number, str(file_path), page.width, page.height))

    return results
