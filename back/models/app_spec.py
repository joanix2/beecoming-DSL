from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class PropertySpec(BaseModel):
    """Specification for a model property"""
    name: str
    type: str
    isPrimaryKey: bool = Field(default=False, alias="isPrimaryKey")
    isAutoIncrement: bool = Field(default=False, alias="isAutoIncrement")
    isRequired: bool = Field(default=False, alias="isRequired")
    isUnique: bool = Field(default=False, alias="isUnique")
    maxLength: Optional[int] = Field(default=None, alias="maxLength")
    defaultValue: Optional[str] = Field(default=None, alias="defaultValue")
    
    class Config:
        populate_by_name = True


class ModelSpec(BaseModel):
    """Specification for a data model"""
    name: str
    properties: List[PropertySpec]


class RelationSpec(BaseModel):
    """Specification for a model relation"""
    name: str
    from_model: str = Field(..., alias="from")
    to_model: str = Field(..., alias="to")
    type: str  # one-to-many, many-to-one, many-to-many, one-to-one
    foreignKey: Optional[str] = None
    
    class Config:
        populate_by_name = True


class EndpointSpec(BaseModel):
    """Specification for an API endpoint"""
    model: str
    methods: List[str]


class ApiSpec(BaseModel):
    """Specification for the API"""
    endpoints: List[EndpointSpec]


class ComponentSpec(BaseModel):
    """Specification for a frontend component"""
    name: str
    route: str


class FrontendSpec(BaseModel):
    """Specification for the frontend"""
    framework: str
    components: List[ComponentSpec]


class DatabaseSpec(BaseModel):
    """Specification for the database"""
    provider: str
    connection_string_template: str = Field(..., alias="connection_string_template")
    
    class Config:
        populate_by_name = True


class ApplicationSpec(BaseModel):
    """Complete application specification"""
    project_name: str = Field(..., alias="project_name")
    description: str
    database: DatabaseSpec
    models: List[ModelSpec]
    relations: List[RelationSpec] = Field(default_factory=list)
    api: ApiSpec
    frontend: FrontendSpec
    
    class Config:
        populate_by_name = True
