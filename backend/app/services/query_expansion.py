import re


DOMAIN_EXPANSIONS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("aoi误报", ("aoi false call", "false call reduction", "false alarm")),
    ("误报", ("false call", "false alarm")),
    ("焊膏检测", ("solder paste inspection", "spi")),
    ("spi", ("solder paste inspection", "spi")),
    ("虚焊", ("cold solder joint", "insufficient solder", "solder defect")),
    ("焊点", ("solder joint",)),
    ("排故", ("troubleshooting", "troubleshoot")),
    ("回流焊", ("reflow soldering", "reflow")),
    ("空洞", ("voiding", "void")),
    ("温度曲线", ("reflow profile", "temperature profile", "profile")),
    ("贴片位置偏移", ("placement offset", "placement misalignment", "pick and place offset")),
    ("贴片偏移", ("placement offset", "placement misalignment", "pick and place offset")),
    ("偏移", ("offset", "misalignment")),
    ("校准", ("calibration", "calibrate")),
    ("吸嘴", ("nozzle",)),
    ("供料", ("feeder", "feeding")),
    ("贴装", ("placement", "pick and place")),
    ("手册", ("manual", "user guide", "guide")),
    ("设置", ("setup", "configuration")),
    ("检查", ("inspection", "check")),
    ("sop", ("standard operating procedure", "work instruction")),
)

LINE_TYPE_EXPANSIONS: dict[str, tuple[str, ...]] = {
    "smt": ("surface mount", "surface mount technology", "smt"),
    "spi": ("solder paste inspection", "spi"),
    "aoi": ("automated optical inspection", "aoi"),
}

INTENT_PROFILES: dict[str, dict[str, tuple[str, ...]]] = {
    "placement_offset": {
        "triggers": (
            "贴片偏移",
            "贴片位置偏移",
            "placement offset",
            "placement misalignment",
        ),
        "positive": (
            "placement accuracy",
            "placement inaccuracy",
            "placement pressure",
            "component placement",
            "component shifted",
            "placement calibration",
            "pick and place",
            "nozzle",
            "feeder",
            "fiducial",
            "z-height",
            "calibrated machinery",
            "re-teach fiducials",
        ),
        "negative": (
            "stencil misalignment",
            "stencil design",
            "solder paste printing",
            "printing process",
            "paste deposit",
        ),
    }
}


class QueryExpansion:
    @staticmethod
    def expand_terms(question: str, *, line_type: str | None = None) -> list[str]:
        normalized = question.lower().strip()
        terms: list[str] = []

        for source, expansions in DOMAIN_EXPANSIONS:
            if source in normalized:
                terms.extend(expansions)

        if line_type:
            terms.extend(LINE_TYPE_EXPANSIONS.get(line_type.lower().strip(), (line_type.lower().strip(),)))

        terms.extend(QueryExpansion._extract_english_tokens(normalized))
        return QueryExpansion._unique_terms(terms)

    @staticmethod
    def build_query_text(
        question: str,
        *,
        line_type: str | None = None,
        sequence: int | None = None,
    ) -> str:
        parts = [question]
        if line_type:
            parts.append(line_type)
        if sequence is not None:
            parts.append(f"异常 {sequence}")

        expanded_terms = QueryExpansion.expand_terms(question, line_type=line_type)
        if expanded_terms:
            parts.extend(expanded_terms)
        return " ".join(QueryExpansion._unique_terms(parts))

    @staticmethod
    def detect_intents(question: str) -> set[str]:
        normalized = question.lower().strip()
        matched: set[str] = set()
        for intent, profile in INTENT_PROFILES.items():
            triggers = profile.get("triggers", ())
            if any(trigger in normalized for trigger in triggers):
                matched.add(intent)
        return matched

    @staticmethod
    def positive_terms_for(question: str) -> list[str]:
        positives: list[str] = []
        for intent in QueryExpansion.detect_intents(question):
            positives.extend(INTENT_PROFILES[intent].get("positive", ()))
        return QueryExpansion._unique_terms(positives)

    @staticmethod
    def negative_terms_for(question: str) -> list[str]:
        negatives: list[str] = []
        for intent in QueryExpansion.detect_intents(question):
            negatives.extend(INTENT_PROFILES[intent].get("negative", ()))
        return QueryExpansion._unique_terms(negatives)

    @staticmethod
    def _extract_english_tokens(text: str) -> list[str]:
        return [
            token
            for token in re.findall(r"[a-z0-9_#-]+", text)
            if token.strip()
        ]

    @staticmethod
    def _unique_terms(values: list[str]) -> list[str]:
        unique_values: list[str] = []
        for value in values:
            normalized = " ".join(value.split()).strip()
            if normalized and normalized not in unique_values:
                unique_values.append(normalized)
        return unique_values
