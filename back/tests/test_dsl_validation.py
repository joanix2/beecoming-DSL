from pathlib import Path
import json

from services.dsl_validation_service import DSLValidationService


def _load_example_spec():
    root = Path(__file__).resolve().parents[2]
    spec_path = root / "example-app-spec.json"
    return json.loads(spec_path.read_text())


def test_validate_example_spec():
    service = DSLValidationService()
    spec = _load_example_spec()

    result = service.validate_spec(spec)

    assert result["valid"] is True
    assert result["error_count"] == 0


def test_validate_missing_config():
    service = DSLValidationService()
    invalid_spec = {"models": []}

    result = service.validate_spec(invalid_spec)

    assert result["valid"] is False
    assert result["error_count"] > 0


def test_lex_spec_tokens():
    service = DSLValidationService()
    spec = _load_example_spec()

    tokens = service.lex_spec(spec)

    assert len(tokens) > 0
    assert any(token["type"] == "property" for token in tokens)
