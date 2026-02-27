"""Quality check for extracted text."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class QualityReport:
    chars_per_page: float
    quality: str  # "good", "acceptable", "review"
    has_tables: bool
    detected_language: str | None


# Simple language detection based on common words
_LANG_HINTS: dict[str, list[str]] = {
    "de": ["der", "die", "das", "und", "ist", "wird", "Gemeinderat", "Protokoll", "Beschluss"],
    "fr": ["les", "des", "est", "une", "sont", "procès-verbal", "conseil", "décision"],
    "it": ["del", "della", "sono", "nella", "consiglio", "verbale", "decisione"],
}


def detect_language(text: str) -> str | None:
    """Simple language detection based on word frequency."""
    text_lower = text.lower()
    scores: dict[str, int] = {}

    for lang, hints in _LANG_HINTS.items():
        scores[lang] = sum(1 for h in hints if h.lower() in text_lower)

    if not scores or max(scores.values()) == 0:
        return None

    return max(scores, key=scores.get)  # type: ignore[arg-type]


def check_quality(text: str, page_count: int) -> QualityReport:
    """Run quality checks on extracted text."""
    chars_per_page = len(text) / max(page_count, 1)

    if chars_per_page > 500:
        quality = "good"
    elif chars_per_page > 200:
        quality = "acceptable"
    else:
        quality = "review"

    has_tables = "<table" in text or "│" in text or "\t" in text

    return QualityReport(
        chars_per_page=chars_per_page,
        quality=quality,
        has_tables=has_tables,
        detected_language=detect_language(text),
    )
