from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class ValidationRequest(BaseModel):
    """Request payload for DSL validation and lexing."""
    spec: Dict[str, Any]


class ValidationErrorItem(BaseModel):
    """Single validation error detail."""
    path: str = Field(default="")
    message: str
    validator: Optional[str] = None


class ValidationResponse(BaseModel):
    """Response payload for DSL validation."""
    valid: bool
    errors: List[ValidationErrorItem]
    error_count: int = Field(..., alias="errorCount")

    class Config:
        populate_by_name = True


class LexerToken(BaseModel):
    """Single token produced by the lexer."""
    type: str
    path: str
    value: Optional[Any] = None


class LexerResponse(BaseModel):
    """Response payload for DSL lexing."""
    tokens: List[LexerToken]
    count: int

    class Config:
        populate_by_name = True
