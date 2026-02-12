from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class ChatMessage(BaseModel):
    """Chat message model"""
    message: str = Field(..., description="The user's message")
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context for the chat"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "How can I generate a REST API from this UML diagram?",
                "context": {
                    "language": "python",
                    "framework": "fastapi"
                }
            }
        }


class ChatResponse(BaseModel):
    """Chat response model"""
    response: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "To generate a REST API from your UML diagram..."
            }
        }


class JSONGenerationRequest(BaseModel):
    """Request for JSON generation"""
    prompt: str = Field(..., description="The prompt for JSON generation")
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context for the generation"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Generate a JSON schema for a user profile",
                "context": {
                    "fields": ["name", "email", "age"]
                }
            }
        }
