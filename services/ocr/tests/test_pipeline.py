"""Tests for the OCR pipeline components."""

import tempfile
from pathlib import Path

import pymupdf
import pytest

from src.tier1_pymupdf import extract_text, DIGITAL_THRESHOLD
from src.page_images import render_pages, save_pages_to_disk
from src.quality import check_quality, detect_language


@pytest.fixture
def digital_pdf(tmp_path: Path) -> str:
    """Create a simple digital PDF with embedded text."""
    path = str(tmp_path / "digital.pdf")
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    text = (
        "Protokoll der Gemeinderatssitzung vom 15. Februar 2026\n\n"
        "Traktandum 1: Genehmigung des Protokolls\n"
        "Das Protokoll der letzten Sitzung wird einstimmig genehmigt.\n\n"
        "Traktandum 2: Kredit für Schulhaussanierung\n"
        "Der Gemeinderat bewilligt einen Kredit von CHF 2.5 Mio.\n"
        "Abstimmung: 5 Ja, 2 Nein. Der Kredit wird genehmigt.\n\n"
        "Traktandum 3: Interpellation betreffend Velowegnetz\n"
        "Die Antwort des Stadtrats wird zur Kenntnis genommen.\n"
    )
    page.insert_text((50, 72), text, fontsize=11)
    doc.save(path)
    doc.close()
    return path


@pytest.fixture
def blank_pdf(tmp_path: Path) -> str:
    """Create a blank PDF (simulates scanned without OCR)."""
    path = str(tmp_path / "blank.pdf")
    doc = pymupdf.open()
    doc.new_page(width=595, height=842)
    doc.save(path)
    doc.close()
    return path


class TestTier1PyMuPDF:
    def test_digital_pdf_detected(self, digital_pdf: str):
        result = extract_text(digital_pdf)
        assert result.is_digital is True
        assert result.avg_chars_per_page > DIGITAL_THRESHOLD
        assert len(result.text) == 1
        assert "Protokoll" in result.text[0]

    def test_blank_pdf_not_digital(self, blank_pdf: str):
        result = extract_text(blank_pdf)
        assert result.is_digital is False
        assert result.avg_chars_per_page <= DIGITAL_THRESHOLD


class TestPageImages:
    def test_render_pages(self, digital_pdf: str):
        images = render_pages(digital_pdf, dpi=72)
        assert len(images) == 1
        assert images[0].page_number == 1
        assert images[0].width > 0
        assert images[0].height > 0
        assert len(images[0].png_bytes) > 100  # valid PNG

    def test_save_pages_to_disk(self, digital_pdf: str, tmp_path: Path):
        results = save_pages_to_disk(digital_pdf, str(tmp_path / "images"), dpi=72)
        assert len(results) == 1
        page_num, file_path, width, height = results[0]
        assert page_num == 1
        assert Path(file_path).exists()
        assert width > 0
        assert height > 0


class TestQuality:
    def test_good_quality(self):
        text = "a" * 5000
        report = check_quality(text, 5)
        assert report.quality == "good"
        assert report.chars_per_page == 1000.0

    def test_review_quality(self):
        text = "short"
        report = check_quality(text, 5)
        assert report.quality == "review"

    def test_detect_german(self):
        text = "Der Gemeinderat hat das Protokoll genehmigt und der Beschluss ist gefallen."
        assert detect_language(text) == "de"

    def test_detect_french(self):
        text = "Le conseil a décidé les mesures suivantes dans le procès-verbal."
        assert detect_language(text) == "fr"

    def test_detect_italian(self):
        text = "Il consiglio ha deciso nella sessione del verbale."
        assert detect_language(text) == "it"
