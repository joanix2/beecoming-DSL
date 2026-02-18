from __future__ import annotations

from typing import Any, Dict, List, Optional
from pathlib import Path
import json
import logging

from jsonschema import Draft7Validator

logger = logging.getLogger(__name__)


class DSLValidationService:
    """Service to validate and lex DSL JSON specs using the shared schema."""

    def __init__(self, schema_path: Optional[Path] = None):
        self.schema_path = schema_path or self._default_schema_path()
        self._schema: Optional[Dict[str, Any]] = None
        self._validator: Optional[Draft7Validator] = None

    @staticmethod
    def _default_schema_path() -> Path:
        return Path(__file__).resolve().parents[2] / "docs" / "schema.json"

    def _load_schema(self) -> Dict[str, Any]:
        if self._schema is None:
            if not self.schema_path.exists():
                raise FileNotFoundError(f"Schema not found at {self.schema_path}")
            self._schema = json.loads(self.schema_path.read_text())
        return self._schema

    def _get_validator(self) -> Draft7Validator:
        if self._validator is None:
            self._validator = Draft7Validator(self._load_schema())
        return self._validator

    def validate_spec(self, spec: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a spec against JSON schema and return structured errors."""
        validator = self._get_validator()
        errors = sorted(validator.iter_errors(spec), key=lambda err: list(err.path))

        formatted_errors = [
            {
                "path": self._format_path(err.path),
                "message": err.message,
                "validator": err.validator,
            }
            for err in errors
        ]

        return {
            "valid": len(formatted_errors) == 0,
            "errors": formatted_errors,
            "error_count": len(formatted_errors),
        }

    def lex_spec(self, spec: Any) -> List[Dict[str, Any]]:
        """Lex a JSON spec into a list of tokens with JSON pointer paths."""
        tokens: List[Dict[str, Any]] = []

        def walk(value: Any, path: List[Any]) -> None:
            pointer = self._format_path(path)
            if isinstance(value, dict):
                tokens.append({"type": "object_start", "path": pointer})
                for key, item in value.items():
                    tokens.append({"type": "property", "path": f"{pointer}/{key}" if pointer else f"/{key}", "value": key})
                    walk(item, path + [key])
                tokens.append({"type": "object_end", "path": pointer})
                return

            if isinstance(value, list):
                tokens.append({"type": "array_start", "path": pointer})
                for index, item in enumerate(value):
                    tokens.append({"type": "index", "path": f"{pointer}/{index}" if pointer else f"/{index}", "value": index})
                    walk(item, path + [index])
                tokens.append({"type": "array_end", "path": pointer})
                return

            token_type = self._scalar_type(value)
            tokens.append({"type": token_type, "path": pointer, "value": value})

        walk(spec, [])
        logger.debug("Lexed %s tokens", len(tokens))
        return tokens

    @staticmethod
    def _scalar_type(value: Any) -> str:
        if value is None:
            return "null"
        if isinstance(value, bool):
            return "boolean"
        if isinstance(value, (int, float)):
            return "number"
        return "string"

    @staticmethod
    def _format_path(path: Any) -> str:
        if not path:
            return ""
        return "/" + "/".join(str(part) for part in path)


# Singleton instance
dsl_validation_service = DSLValidationService()
