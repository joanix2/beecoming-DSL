from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class VisibilityType(str, Enum):
    """UML visibility types"""
    PUBLIC = "+"
    PRIVATE = "-"
    PROTECTED = "#"
    PACKAGE = "~"


class RelationType(str, Enum):
    """UML relation types"""
    ASSOCIATION = "association"
    AGGREGATION = "aggregation"
    COMPOSITION = "composition"
    INHERITANCE = "inheritance"
    REALIZATION = "realization"
    DEPENDENCY = "dependency"


class Attribute(BaseModel):
    """UML Class Attribute"""
    id: str
    visibility: str = Field(default="+")
    name: str
    type: str = Field(default="String")
    isStatic: bool = Field(default=False)
    defaultValue: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "attr-123",
                "visibility": "-",
                "name": "id",
                "type": "String",
                "isStatic": False
            }
        }


class Method(BaseModel):
    """UML Class Method"""
    id: str
    visibility: str = Field(default="+")
    name: str
    returnType: str = Field(default="void")
    parameters: str = Field(default="")
    isStatic: bool = Field(default=False)
    isAbstract: bool = Field(default=False)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "method-123",
                "visibility": "+",
                "name": "getName",
                "returnType": "String",
                "parameters": "",
                "isStatic": False,
                "isAbstract": False
            }
        }


class Class(BaseModel):
    """UML Class"""
    id: str
    name: str
    isAbstract: bool = Field(default=False)
    attributes: List[Attribute] = Field(default_factory=list)
    methods: List[Method] = Field(default_factory=list)
    x: float = Field(default=0.0)
    y: float = Field(default=0.0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "class-123",
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
                "methods": [
                    {
                        "id": "method-1",
                        "visibility": "+",
                        "name": "getId",
                        "returnType": "String"
                    }
                ],
                "x": 100.0,
                "y": 100.0
            }
        }


class Relation(BaseModel):
    """UML Relation between classes"""
    id: str
    sourceId: str
    targetId: str
    type: RelationType
    sourceCardinality: Optional[str] = None
    targetCardinality: Optional[str] = None
    label: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "rel-123",
                "sourceId": "class-1",
                "targetId": "class-2",
                "type": "association",
                "sourceCardinality": "1",
                "targetCardinality": "*"
            }
        }


class UMLDiagram(BaseModel):
    """Complete UML Diagram"""
    classes: List[Class]
    relations: List[Relation] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "classes": [
                    {
                        "id": "7990cabb-c5f1-4cdb-b238-36cfa52b7e4f",
                        "name": "User",
                        "isAbstract": False,
                        "attributes": [
                            {
                                "id": "69573d93-d638-418f-ba9c-b9740cad79d5",
                                "visibility": "-",
                                "name": "id",
                                "type": "String"
                            }
                        ],
                        "methods": [
                            {
                                "id": "2441cda3-945f-4d46-b73e-351abd5779b7",
                                "visibility": "+",
                                "name": "method",
                                "returnType": "void"
                            }
                        ],
                        "x": 235.82,
                        "y": 74.65
                    }
                ],
                "relations": [
                    {
                        "id": "a301a72c-fdd1-464e-ba3d-487ffc40a2f5",
                        "sourceId": "7990cabb-c5f1-4cdb-b238-36cfa52b7e4f",
                        "targetId": "21e75888-cd02-4a58-86d4-c5801d4e47c0",
                        "type": "association"
                    }
                ]
            }
        }
