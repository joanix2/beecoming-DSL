from typing import Dict, Any, List, Optional
from pathlib import Path
import logging
from datetime import datetime

from services.template_service import template_service
from services.llm_service import llm_service
from models.uml import UMLDiagram, Class, Relation
from config import settings

logger = logging.getLogger(__name__)


class ScaffoldingService:
    """Service for generating code scaffolding from UML diagrams"""
    
    def __init__(self):
        self.template_service = template_service
        self.llm_service = llm_service
        self.output_dir = settings.OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def generate_from_uml(
        self, 
        uml_data: Dict[str, Any],
        language: str = "python",
        framework: Optional[str] = None,
        use_llm: bool = False
    ) -> Dict[str, Any]:
        """
        Generate code scaffolding from UML diagram
        
        Args:
            uml_data: UML diagram data with classes and relations
            language: Target programming language
            framework: Optional framework (e.g., 'fastapi', 'django', 'express')
            use_llm: Whether to use LLM for enhanced generation
            
        Returns:
            Dictionary containing generated files and metadata
        """
        logger.info(f"Generating {language} code from UML diagram")
        
        # Parse UML data
        uml_diagram = UMLDiagram(**uml_data)
        
        # Get LLM insights if requested
        llm_insights = None
        if use_llm:
            llm_insights = await self.llm_service.generate_code_from_uml(
                uml_data, 
                target_language=language
            )
            logger.info(f"LLM insights: {llm_insights}")
        
        # Generate code based on language
        generated_files = {}
        
        if language.lower() == "python":
            generated_files = await self._generate_python_code(
                uml_diagram, 
                framework,
                llm_insights
            )
        elif language.lower() == "typescript":
            generated_files = await self._generate_typescript_code(
                uml_diagram,
                framework,
                llm_insights
            )
        elif language.lower() == "csharp":
            generated_files = await self._generate_csharp_code(
                uml_diagram,
                framework,
                llm_insights
            )
        else:
            raise ValueError(f"Unsupported language: {language}")
        
        # Save files to output directory
        output_path = self._save_generated_files(generated_files, language)
        
        return {
            "success": True,
            "language": language,
            "framework": framework,
            "output_path": str(output_path),
            "files": list(generated_files.keys()),
            "llm_insights": llm_insights,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _generate_python_code(
        self,
        uml_diagram: UMLDiagram,
        framework: Optional[str],
        llm_insights: Optional[str]
    ) -> Dict[str, str]:
        """Generate Python code from UML diagram"""
        generated_files = {}
        
        # Choose template based on framework
        if framework == "fastapi":
            class_template = "python/fastapi_model.py.jinja2"
        elif framework == "django":
            class_template = "python/django_model.py.jinja2"
        else:
            class_template = "python/class.py.jinja2"
        
        # Generate models for each class
        for cls in uml_diagram.classes:
            # Find relations for this class
            relations = [
                r for r in uml_diagram.relations 
                if r.sourceId == cls.id or r.targetId == cls.id
            ]
            
            context = {
                "class": cls,
                "relations": relations,
                "all_classes": uml_diagram.classes,
                "timestamp": datetime.now().isoformat(),
                "llm_insights": llm_insights
            }
            
            try:
                content = self.template_service.render_template(class_template, context)
                filename = f"{cls.name.lower()}.py"
                generated_files[filename] = content
            except Exception as e:
                logger.warning(f"Template {class_template} not found, using default")
                # Fallback to string template
                content = self._generate_python_class_default(cls, relations)
                filename = f"{cls.name.lower()}.py"
                generated_files[filename] = content
        
        # Generate __init__.py
        generated_files["__init__.py"] = self._generate_python_init(uml_diagram)
        
        return generated_files
    
    def _generate_python_class_default(self, cls: Class, relations: List[Relation]) -> str:
        """Generate a default Python class when template is not available"""
        lines = [
            "from typing import Optional, List",
            "from datetime import datetime",
            "",
            "",
        ]
        
        # Class definition
        if cls.isAbstract:
            lines.append("from abc import ABC, abstractmethod")
            lines.append("")
            lines.append(f"class {cls.name}(ABC):")
        else:
            lines.append(f"class {cls.name}:")
        
        lines.append(f'    """Generated class for {cls.name}"""')
        lines.append("")
        
        # Constructor
        lines.append("    def __init__(self):")
        if cls.attributes:
            for attr in cls.attributes:
                default = "None" if attr.type != "String" else '""'
                lines.append(f"        self.{attr.name}: {attr.type} = {default}")
        else:
            lines.append("        pass")
        lines.append("")
        
        # Methods
        for method in cls.methods:
            if method.isAbstract:
                lines.append("    @abstractmethod")
            
            params = f"self, {method.parameters}" if method.parameters else "self"
            lines.append(f"    def {method.name}({params}) -> {method.returnType}:")
            lines.append(f'        """TODO: Implement {method.name}"""')
            
            if method.isAbstract:
                lines.append("        pass")
            else:
                if method.returnType != "void":
                    lines.append("        raise NotImplementedError")
                else:
                    lines.append("        pass")
            lines.append("")
        
        return "\n".join(lines)
    
    def _generate_python_init(self, uml_diagram: UMLDiagram) -> str:
        """Generate __init__.py file"""
        lines = [
            '"""Generated models from UML diagram"""',
            "",
        ]
        
        for cls in uml_diagram.classes:
            lines.append(f"from .{cls.name.lower()} import {cls.name}")
        
        lines.append("")
        lines.append("__all__ = [")
        for cls in uml_diagram.classes:
            lines.append(f'    "{cls.name}",')
        lines.append("]")
        
        return "\n".join(lines)
    
    async def _generate_typescript_code(
        self,
        uml_diagram: UMLDiagram,
        framework: Optional[str],
        llm_insights: Optional[str]
    ) -> Dict[str, str]:
        """Generate TypeScript code from UML diagram"""
        # Similar implementation for TypeScript
        generated_files = {}
        # TODO: Implement TypeScript generation
        return generated_files
    
    async def _generate_csharp_code(
        self,
        uml_diagram: UMLDiagram,
        framework: Optional[str],
        llm_insights: Optional[str]
    ) -> Dict[str, str]:
        """Generate C# code from UML diagram"""
        # Similar implementation for C#
        generated_files = {}
        # TODO: Implement C# generation
        return generated_files
    
    def _save_generated_files(self, files: Dict[str, str], language: str) -> Path:
        """Save generated files to output directory"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = self.output_dir / f"{language}_{timestamp}"
        output_path.mkdir(parents=True, exist_ok=True)
        
        for filename, content in files.items():
            file_path = output_path / filename
            file_path.write_text(content)
            logger.info(f"Generated file: {file_path}")
        
        return output_path


# Singleton instance
scaffolding_service = ScaffoldingService()
