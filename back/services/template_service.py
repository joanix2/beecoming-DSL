from jinja2 import Environment, FileSystemLoader, Template, TemplateNotFound
from pathlib import Path
from typing import Dict, Any, List, Optional
from config import settings
import logging

logger = logging.getLogger(__name__)


class TemplateService:
    """Service for managing and rendering Jinja2 templates"""
    
    def __init__(self, templates_dir: Optional[Path] = None):
        """
        Initialize the template service
        
        Args:
            templates_dir: Directory containing Jinja2 templates
        """
        self.templates_dir = templates_dir or settings.TEMPLATES_DIR
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=False,  # We're generating code, not HTML
            trim_blocks=True,
            lstrip_blocks=True,
        )
        
        # Add custom filters
        self.env.filters['camel_case'] = self._to_camel_case
        self.env.filters['snake_case'] = self._to_snake_case
        self.env.filters['pascal_case'] = self._to_pascal_case
        self.env.filters['kebab_case'] = self._to_kebab_case
    
    @staticmethod
    def _to_camel_case(text: str) -> str:
        """Convert text to camelCase"""
        words = text.replace('-', '_').split('_')
        return words[0].lower() + ''.join(word.capitalize() for word in words[1:])
    
    @staticmethod
    def _to_snake_case(text: str) -> str:
        """Convert text to snake_case"""
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower().replace('-', '_')
    
    @staticmethod
    def _to_pascal_case(text: str) -> str:
        """Convert text to PascalCase"""
        words = text.replace('-', '_').split('_')
        return ''.join(word.capitalize() for word in words)
    
    @staticmethod
    def _to_kebab_case(text: str) -> str:
        """Convert text to kebab-case"""
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', text)
        return re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1).lower().replace('_', '-')
    
    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render a template with the given context
        
        Args:
            template_name: Name of the template file
            context: Dictionary of variables to pass to the template
            
        Returns:
            Rendered template as a string
            
        Raises:
            TemplateNotFound: If the template file doesn't exist
        """
        try:
            template = self.env.get_template(template_name)
            return template.render(**context)
        except TemplateNotFound:
            logger.error(f"Template not found: {template_name}")
            raise
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {e}")
            raise
    
    def render_string(self, template_string: str, context: Dict[str, Any]) -> str:
        """
        Render a template from a string
        
        Args:
            template_string: Template content as a string
            context: Dictionary of variables to pass to the template
            
        Returns:
            Rendered template as a string
        """
        template = self.env.from_string(template_string)
        return template.render(**context)
    
    def list_templates(self, pattern: Optional[str] = None) -> List[str]:
        """
        List available templates
        
        Args:
            pattern: Optional glob pattern to filter templates
            
        Returns:
            List of template names
        """
        if pattern:
            return [str(p.relative_to(self.templates_dir)) 
                   for p in self.templates_dir.glob(pattern)]
        else:
            return self.env.list_templates()
    
    def create_template(self, name: str, content: str) -> Path:
        """
        Create a new template file
        
        Args:
            name: Name of the template file
            content: Template content
            
        Returns:
            Path to the created template
        """
        template_path = self.templates_dir / name
        template_path.parent.mkdir(parents=True, exist_ok=True)
        template_path.write_text(content)
        logger.info(f"Created template: {name}")
        return template_path
    
    def template_exists(self, name: str) -> bool:
        """
        Check if a template exists
        
        Args:
            name: Name of the template file
            
        Returns:
            True if the template exists, False otherwise
        """
        return (self.templates_dir / name).exists()


# Singleton instance
template_service = TemplateService()
