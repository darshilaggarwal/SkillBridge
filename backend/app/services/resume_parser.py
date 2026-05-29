from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.core.config import settings


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


async def save_upload(upload: UploadFile) -> Path:
    original_name = upload.filename or "resume"
    extension = Path(original_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Upload a PDF, DOCX, or TXT resume.")

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = settings.upload_dir / f"{uuid4().hex}{extension}"

    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded resume is empty.")

    file_path.write_bytes(content)
    return file_path


def extract_text(file_path: Path) -> str:
    extension = file_path.suffix.lower()

    if extension == ".pdf":
        return extract_pdf_text(file_path)
    if extension == ".docx":
        return extract_docx_text(file_path)
    if extension == ".txt":
        return file_path.read_text(encoding="utf-8", errors="ignore")

    raise HTTPException(status_code=400, detail="Unsupported resume format.")


def extract_pdf_text(file_path: Path) -> str:
    try:
        import fitz
    except ImportError as exc:
        raise HTTPException(status_code=500, detail="PyMuPDF is not installed.") from exc

    with fitz.open(file_path) as document:
        text = "\n".join(page.get_text() for page in document)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from this PDF.")

    return text


def extract_docx_text(file_path: Path) -> str:
    try:
        from docx import Document
    except ImportError as exc:
        raise HTTPException(status_code=500, detail="python-docx is not installed.") from exc

    document = Document(file_path)
    text = "\n".join(paragraph.text for paragraph in document.paragraphs)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from this DOCX.")

    return text

