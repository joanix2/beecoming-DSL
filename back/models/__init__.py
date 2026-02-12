"""Pydantic models for API requests and responses"""

from .uml import (
    UMLDiagram,
    Class,
    Relation,
    Attribute,
    Method,
    VisibilityType,
    RelationType,
)
from .chat import ChatMessage, ChatResponse, JSONGenerationRequest
from .scaffolding import ScaffoldingRequest, ScaffoldingResponse

__all__ = [
    "UMLDiagram",
    "Class",
    "Relation",
    "Attribute",
    "Method",
    "VisibilityType",
    "RelationType",
    "ChatMessage",
    "ChatResponse",
    "JSONGenerationRequest",
    "ScaffoldingRequest",
    "ScaffoldingResponse",
]
