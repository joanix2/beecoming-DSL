from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class ScaffoldingRequest(BaseModel):
    """Request for code scaffolding"""
    uml_data: Dict[str, Any] = Field(
        ...,
        description="UML diagram data with classes and relations",
        alias="umlData"
    )
    language: str = Field(
        default="python",
        description="Target programming language (python, typescript, csharp)"
    )
    framework: Optional[str] = Field(
        default=None,
        description="Optional framework (fastapi, django, express, etc.)"
    )
    use_llm: bool = Field(
        default=False,
        description="Use LLM for enhanced code generation",
        alias="useLlm"
    )
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "umlData": {
                    "classes": [
                        {
                            "id": "class-1",
                            "name": "User",
                            "isAbstract": False,
                            "attributes": [
                                {
                                    "id": "attr-1",
                                    "visibility": "-",
                                    "name": "id",
                                    "type": "String"
                                }
                            ],
                            "methods": []
                        }
                    ],
                    "relations": []
                },
                "language": "python",
                "framework": "fastapi",
                "useLlm": True
            }
        }


class ScaffoldingResponse(BaseModel):
    """Response from scaffolding generation"""
    success: bool
    language: str
    framework: Optional[str]
    output_path: str = Field(..., alias="outputPath")
    files: List[str]
    llm_insights: Optional[str] = Field(default=None, alias="llmInsights")
    timestamp: str
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "success": True,
                "language": "python",
                "framework": "fastapi",
                "outputPath": "./output/python_20260212_143022",
                "files": ["user.py", "mission.py", "__init__.py"],
                "llmInsights": "The UML diagram represents...",
                "timestamp": "2026-02-12T14:30:22"
            }
        }
