"""Modal app entrypoint for the OCR service.

Deploy: modal deploy app.py
Test locally: python -m src.pipeline
"""

# This file will be configured with Modal when deploying.
# For now it serves as the entrypoint documentation.

# Example Modal setup (uncomment when deploying):
#
# import modal
#
# app = modal.App("protokolbase-ocr")
#
# image = modal.Image.debian_slim(python_version="3.12").pip_install(
#     "pymupdf", "pdfplumber", "httpx", "Pillow", "psycopg2-binary"
# )
#
# @app.function(image=image, secrets=[modal.Secret.from_name("protokolbase")])
# async def process_document(pdf_url: str, document_id: int):
#     """Download PDF, run OCR pipeline, upload page images, update DB."""
#     from src.pipeline import process_pdf
#     # ... implementation
