from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any

from models.scaffolding import ScaffoldingRequest, ScaffoldingResponse
from services.scaffolding_service import scaffolding_service

router = APIRouter()


@router.post("/generate", response_model=ScaffoldingResponse)
async def generate_scaffolding(request: ScaffoldingRequest):
    """
    Generate code scaffolding from UML diagram
    
    Takes a UML diagram JSON and generates code in the specified language
    and framework using Jinja templates and optionally LLM assistance.
    
    Args:
        request: ScaffoldingRequest with UML data and generation options
        
    Returns:
        ScaffoldingResponse with generation results and file paths
    """
    try:
        result = await scaffolding_service.generate_from_uml(
            uml_data=request.uml_data,
            language=request.language,
            framework=request.framework,
            use_llm=request.use_llm
        )
        
        return ScaffoldingResponse(**result)
    
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid UML data or configuration: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scaffolding generation failed: {str(e)}"
        )


@router.post("/generate-async")
async def generate_scaffolding_async(
    request: ScaffoldingRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate code scaffolding asynchronously
    
    Starts the generation process in the background and returns immediately.
    Useful for large diagrams that may take longer to process.
    
    Args:
        request: ScaffoldingRequest with UML data and generation options
        background_tasks: FastAPI background tasks manager
        
    Returns:
        Status message with job ID
    """
    import uuid
    job_id = str(uuid.uuid4())
    
    async def generate_task():
        """Background task for code generation"""
        try:
            await scaffolding_service.generate_from_uml(
                uml_data=request.uml_data,
                language=request.language,
                framework=request.framework,
                use_llm=request.use_llm
            )
        except Exception as e:
            print(f"Background generation failed for job {job_id}: {e}")
    
    background_tasks.add_task(generate_task)
    
    return {
        "status": "accepted",
        "job_id": job_id,
        "message": "Code generation started in background"
    }


@router.get("/languages")
async def get_supported_languages():
    """
    Get list of supported programming languages
    
    Returns:
        List of supported languages and their frameworks
    """
    return {
        "languages": [
            {
                "name": "python",
                "frameworks": ["fastapi", "django", "flask"],
                "default_framework": "fastapi"
            },
            {
                "name": "typescript",
                "frameworks": ["express", "nestjs"],
                "default_framework": "express"
            },
            {
                "name": "csharp",
                "frameworks": ["aspnet", "minimal-api"],
                "default_framework": "aspnet"
            }
        ]
    }


@router.get("/templates")
async def list_available_templates(language: str = "python"):
    """
    List available templates for a specific language
    
    Args:
        language: Programming language to list templates for
        
    Returns:
        List of available template names
    """
    try:
        from services.template_service import template_service
        
        pattern = f"{language}/**/*.jinja2"
        templates = template_service.list_templates(pattern)
        
        return {
            "language": language,
            "templates": templates,
            "count": len(templates)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list templates: {str(e)}"
        )
