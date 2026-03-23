from pathlib import Path

from app.services.langchain_document_ingestion_service import (
    LangChainDocumentIngestionService,
)


def test_langchain_document_ingestion_service_loads_text_documents(tmp_path: Path):
    file_path = tmp_path / "setup_check.md"
    file_path.write_text(
        "Setup Check\n\nVerify stencil alignment and conveyor calibration.",
        encoding="utf-8",
    )

    service = LangChainDocumentIngestionService()
    documents = service.load_documents(file_path, min_page_chars=10, source_dir=tmp_path)

    assert len(documents) == 1
    assert "Verify stencil alignment" in documents[0].page_content
    assert documents[0].metadata["document_id"] == "setup_check"
    assert documents[0].metadata["file_type"] == "md"
    assert documents[0].metadata["page"] == 1
    assert documents[0].metadata["section"] == "Setup Check"
    assert len(documents[0].metadata["document_hash"]) == 64


def test_langchain_document_ingestion_service_to_document_pages(tmp_path: Path):
    file_path = tmp_path / "guide.txt"
    file_path.write_text("First line\n\nSecond line", encoding="utf-8")

    service = LangChainDocumentIngestionService()
    pages = service.load_pages(file_path, min_page_chars=5, source_dir=tmp_path)

    assert len(pages) == 1
    assert pages[0].page == 1
    assert pages[0].section == "First line"


def test_langchain_document_ingestion_service_loads_pdf_documents(monkeypatch, tmp_path: Path):
    file_path = tmp_path / "guide.pdf"
    file_path.write_text("fake", encoding="utf-8")

    class StubPdfLoader:
        def __init__(self, path: str) -> None:
            self.path = path

        def load(self):
            return [
                type(
                    "Doc",
                    (),
                    {
                        "page_content": "Header\nPage 1 content\nPage 1 content",
                        "metadata": {"page": 1, "title": "PDF Title"},
                    },
                )(),
                type(
                    "Doc",
                    (),
                    {
                        "page_content": "Copyright notice\nGlobal headquarters",
                        "metadata": {"page": 2, "title": "PDF Title"},
                    },
                )(),
            ]

    monkeypatch.setattr(
        "app.services.langchain_document_ingestion_service.PyPDFLoader",
        StubPdfLoader,
    )

    service = LangChainDocumentIngestionService()
    documents = service.load_documents(file_path, min_page_chars=10, source_dir=tmp_path)

    assert len(documents) == 1
    assert documents[0].metadata["page"] == 1
    assert documents[0].metadata["title"] == "PDF Title"
    assert "Page 1 content" in documents[0].page_content
