from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from services.application_generator_service import application_generator_service

router = APIRouter()


@router.post("/generate")
async def generate_application(spec: Dict[str, Any]):
    """
    Generate a complete application from JSON specification
    
    Takes an application specification JSON and generates a complete
    full-stack application with backend, frontend, Docker configuration,
    database migrations, and tests.
    
    Args:
        spec: Application specification dictionary
        
    Returns:
        Generation results with paths and file list
    """
    try:
        result = await application_generator_service.generate_application(spec)
        return result
    
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid application specification: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Application generation failed: {str(e)}"
        )
