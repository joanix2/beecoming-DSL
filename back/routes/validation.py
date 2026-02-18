from fastapi import APIRouter, HTTPException

from models.validation import ValidationRequest, ValidationResponse, LexerResponse
from services.dsl_validation_service import dsl_validation_service

router = APIRouter()


@router.post("/validate", response_model=ValidationResponse)
async def validate_spec(request: ValidationRequest):
    """Validate a DSL JSON specification against the schema."""
    try:
        result = dsl_validation_service.validate_spec(request.spec)
        return ValidationResponse(**result)
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Validation failed: {error}")


@router.post("/lex", response_model=LexerResponse)
async def lex_spec(request: ValidationRequest):
    """Lex a DSL JSON specification into tokens."""
    try:
        tokens = dsl_validation_service.lex_spec(request.spec)
        return LexerResponse(tokens=tokens, count=len(tokens))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Lexing failed: {error}")
