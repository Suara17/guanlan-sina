from app.services.document_chunker import DocumentChunker, DocumentPage


def test_document_chunker_cleans_noise_and_merges_broken_lines():
    chunker = DocumentChunker()

    cleaned = chunker.clean_text(
        "PAGE 1\n"
        "Bridging defects often happen when solder paste volume is too high\n"
        "and stencil aperture design is not controlled.\n\n"
        "1 / 12\n"
        "Corrective Actions:\n"
        "- Reduce paste volume\n"
    )

    assert "PAGE 1" not in cleaned
    assert "1 / 12" not in cleaned
    assert "too high and stencil aperture design" in cleaned
    assert "Corrective Actions:" in cleaned


def test_document_chunker_builds_page_chunks_with_section_and_keywords():
    chunker = DocumentChunker(target_chars=220, max_chars=260, overlap_chars=40)

    chunks = chunker.chunk_text(
        document_id="smt-guide",
        page=12,
        text=(
            "Bridging Defects:\n\n"
            "Bridging defects usually come from excessive solder paste, "
            "poor stencil release, or component misalignment during placement.\n\n"
            "Recommended actions include cleaning the stencil, reducing paste volume, "
            "and recalibrating placement coordinates."
        ),
    )

    assert len(chunks) == 1
    assert chunks[0].chunk_id == "smt-guide:p12:c01"
    assert chunks[0].page == 12
    assert chunks[0].section == "Bridging Defects:"
    assert "solder" in chunks[0].keywords
    assert chunks[0].tokens_estimate > 10


def test_document_chunker_splits_long_text_with_overlap():
    chunker = DocumentChunker(target_chars=120, max_chars=160, overlap_chars=30)
    long_sentence = " ".join(f"token{i}" for i in range(80))

    chunks = chunker.chunk_pages(
        document_id="vector-guide",
        pages=[DocumentPage(page=3, text=long_sentence)],
    )

    assert len(chunks) >= 2
    assert chunks[0].chunk_id == "vector-guide:p3:c01"
    assert len(chunks[0].text) <= 160
    assert "token" in chunks[1].text


def test_document_chunker_preserves_section_hint_across_pages():
    chunker = DocumentChunker(target_chars=180, max_chars=220, overlap_chars=40)

    chunks = chunker.chunk_pages(
        document_id="manual",
        pages=[
            DocumentPage(page=5, text="Inspection Checklist:\n\nVerify nozzle wear and alignment."),
            DocumentPage(page=6, text="Check feeder tension and solder paste condition."),
        ],
    )

    assert len(chunks) == 2
    assert chunks[0].section == "Inspection Checklist:"
    assert chunks[1].section == "Inspection Checklist:"
