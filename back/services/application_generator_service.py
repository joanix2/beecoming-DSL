from typing import Dict, Any, List, Optional
from pathlib import Path
import logging
import json
import shutil
from datetime import datetime

from services.template_service import template_service
from models.app_spec import ApplicationSpec
from config import settings

logger = logging.getLogger(__name__)


class ApplicationGeneratorService:
    """Service for generating complete applications from JSON specifications"""
    
    def __init__(self):
        self.template_service = template_service
        self.templates_dir = settings.TEMPLATES_DIR
        self.output_dir = settings.OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def generate_application(
        self,
        app_spec_data: Dict[str, Any],
        output_path: Optional[Path] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete application from specification
        
        Args:
            app_spec_data: Application specification as dictionary
            output_path: Optional custom output path
            
        Returns:
            Dictionary containing generation results
        """
        logger.info(f"Generating application from specification")
        
        # Parse application specification
        app_spec = ApplicationSpec(**app_spec_data)
        
        # Create output directory
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = self.output_dir / f"{app_spec.project_name}_{timestamp}"
        
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Generate backend
        backend_path = output_path / "backend"
        backend_files = await self._generate_backend(app_spec, backend_path)
        
        # Generate frontend
        frontend_path = output_path / "frontend"
        frontend_files = await self._generate_frontend(app_spec, frontend_path)
        
        # Generate Docker configuration
        docker_files = await self._generate_docker_config(app_spec, output_path)
        
        # Generate database migrations
        migration_files = await self._generate_migrations(app_spec, backend_path)
        
        # Generate tests
        test_files = await self._generate_tests(app_spec, backend_path, frontend_path)
        
        # Generate README and documentation
        doc_files = await self._generate_documentation(app_spec, output_path)
        
        all_files = {
            **backend_files,
            **frontend_files,
            **docker_files,
            **migration_files,
            **test_files,
            **doc_files
        }
        
        return {
            "success": True,
            "project_name": app_spec.project_name,
            "output_path": str(output_path),
            "backend_path": str(backend_path),
            "frontend_path": str(frontend_path),
            "files_generated": len(all_files),
            "files": list(all_files.keys()),
            "timestamp": datetime.now().isoformat()
        }
    
    async def _generate_backend(
        self,
        app_spec: ApplicationSpec,
        output_path: Path
    ) -> Dict[str, str]:
        """Generate backend application"""
        logger.info(f"Generating backend at {output_path}")
        output_path.mkdir(parents=True, exist_ok=True)
        
        generated_files = {}
        context = self._create_template_context(app_spec)
        
        # Copy entire backend template structure
        backend_template_dir = self.templates_dir / "back"
        if backend_template_dir.exists():
            self._copy_template_directory(backend_template_dir, output_path, context, generated_files)
        
        # Generate Models
        models_dir = output_path / "Models"
        models_dir.mkdir(parents=True, exist_ok=True)
        
        for model in app_spec.models:
            model_context = {**context, "model": model}
            try:
                content = self.template_service.render_template(
                    "back/Models/Model.cs.j2",
                    model_context
                )
                file_path = models_dir / f"{model.name}.cs"
                file_path.write_text(content)
                generated_files[str(file_path.relative_to(output_path))] = content
            except Exception as e:
                logger.warning(f"Using fallback for model {model.name}: {e}")
                content = self._generate_model_fallback(model, app_spec)
                file_path = models_dir / f"{model.name}.cs"
                file_path.write_text(content)
                generated_files[str(file_path.relative_to(output_path))] = content
        
        # Generate Controllers
        controllers_dir = output_path / "Controllers"
        controllers_dir.mkdir(parents=True, exist_ok=True)
        
        for endpoint in app_spec.api.endpoints:
            model = next((m for m in app_spec.models if m.name == endpoint.model), None)
            if model:
                controller_context = {**context, "model": model, "endpoint": endpoint}
                try:
                    content = self.template_service.render_template(
                        "back/Controllers/Controller.cs.j2",
                        controller_context
                    )
                except Exception as e:
                    logger.warning(f"Using fallback for controller {model.name}: {e}")
                    content = self._generate_controller_fallback(model, endpoint, app_spec)
                
                file_path = controllers_dir / f"{model.name}Controller.cs"
                file_path.write_text(content)
                generated_files[str(file_path.relative_to(output_path))] = content
        
        # Generate DTOs
        dtos_dir = output_path / "DTOs"
        dtos_dir.mkdir(parents=True, exist_ok=True)
        
        for model in app_spec.models:
            dto_context = {**context, "model": model}
            try:
                content = self.template_service.render_template(
                    "back/DTOs/DTO.cs.jinja",
                    dto_context
                )
            except Exception as e:
                logger.warning(f"Using fallback for DTO {model.name}: {e}")
                content = self._generate_dto_fallback(model, app_spec)
            
            file_path = dtos_dir / f"{model.name}DTO.cs"
            file_path.write_text(content)
            generated_files[str(file_path.relative_to(output_path))] = content
        
        # Generate DbContext
        try:
            dbcontext_content = self.template_service.render_template(
                "back/ApplicationDbContext.cs.j2",
                context
            )
        except Exception as e:
            logger.warning(f"Using fallback for DbContext: {e}")
            dbcontext_content = self._generate_dbcontext_fallback(app_spec)
        
        dbcontext_path = output_path / "ApplicationDbContext.cs"
        dbcontext_path.write_text(dbcontext_content)
        generated_files["ApplicationDbContext.cs"] = dbcontext_content
        
        # Generate Program.cs
        try:
            program_content = self.template_service.render_template(
                "back/Program.cs.j2",
                context
            )
        except Exception as e:
            logger.warning(f"Using fallback for Program.cs: {e}")
            program_content = self._generate_program_fallback(app_spec)
        
        program_path = output_path / "Program.cs"
        program_path.write_text(program_content)
        generated_files["Program.cs"] = program_content
        
        # Generate .csproj file
        try:
            csproj_content = self.template_service.render_template(
                "back/{{ project_name }}-api.csproj.j2",
                context
            )
        except Exception as e:
            logger.warning(f"Using fallback for .csproj: {e}")
            csproj_content = self._generate_csproj_fallback(app_spec)
        
        csproj_path = output_path / f"{app_spec.project_name}-api.csproj"
        csproj_path.write_text(csproj_content)
        generated_files[f"{app_spec.project_name}-api.csproj"] = csproj_content
        
        return generated_files
    
    async def _generate_frontend(
        self,
        app_spec: ApplicationSpec,
        output_path: Path
    ) -> Dict[str, str]:
        """Generate frontend application"""
        logger.info(f"Generating frontend at {output_path}")
        output_path.mkdir(parents=True, exist_ok=True)
        
        generated_files = {}
        context = self._create_template_context(app_spec)
        
        # Copy entire frontend template structure
        frontend_template_dir = self.templates_dir / "front"
        if frontend_template_dir.exists():
            self._copy_template_directory(frontend_template_dir, output_path, context, generated_files)
        
        # Generate OpenAPI setup script
        openapi_script = self._generate_openapi_setup_script(app_spec)
        script_path = output_path / "scripts" / "generate-api-services.sh"
        script_path.parent.mkdir(parents=True, exist_ok=True)
        script_path.write_text(openapi_script)
        script_path.chmod(0o755)
        generated_files["scripts/generate-api-services.sh"] = openapi_script
        
        return generated_files
    
    async def _generate_docker_config(
        self,
        app_spec: ApplicationSpec,
        output_path: Path
    ) -> Dict[str, str]:
        """Generate Docker configuration files"""
        logger.info("Generating Docker configuration")
        
        generated_files = {}
        context = self._create_template_context(app_spec)
        
        # Generate backend Dockerfile
        try:
            backend_dockerfile = self.template_service.render_template(
                "back/Dockerfile.j2",
                context
            )
        except Exception as e:
            logger.warning(f"Using fallback for backend Dockerfile: {e}")
            backend_dockerfile = self._generate_backend_dockerfile_fallback(app_spec)
        
        backend_dockerfile_path = output_path / "backend" / "Dockerfile"
        backend_dockerfile_path.parent.mkdir(parents=True, exist_ok=True)
        backend_dockerfile_path.write_text(backend_dockerfile)
        generated_files["backend/Dockerfile"] = backend_dockerfile
        
        # Generate frontend Dockerfile
        frontend_dockerfile = self._generate_frontend_dockerfile(app_spec)
        frontend_dockerfile_path = output_path / "frontend" / "Dockerfile"
        frontend_dockerfile_path.parent.mkdir(parents=True, exist_ok=True)
        frontend_dockerfile_path.write_text(frontend_dockerfile)
        generated_files["frontend/Dockerfile"] = frontend_dockerfile
        
        # Generate docker-compose.yml
        try:
            docker_compose = self.template_service.render_template(
                "back/docker-compose.yml.j2",
                context
            )
        except Exception as e:
            logger.warning(f"Using fallback for docker-compose: {e}")
            docker_compose = self._generate_docker_compose_fallback(app_spec)
        
        docker_compose_path = output_path / "docker-compose.yml"
        docker_compose_path.write_text(docker_compose)
        generated_files["docker-compose.yml"] = docker_compose
        
        # Generate .env.example
        env_example = self._generate_env_example(app_spec)
        env_path = output_path / ".env.example"
        env_path.write_text(env_example)
        generated_files[".env.example"] = env_example
        
        return generated_files
    
    async def _generate_migrations(
        self,
        app_spec: ApplicationSpec,
        backend_path: Path
    ) -> Dict[str, str]:
        """Generate database migration scripts"""
        logger.info("Generating database migrations")
        
        generated_files = {}
        
        # Create migrations directory
        migrations_dir = backend_path / "Migrations"
        migrations_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate initial migration script
        migration_script = self._generate_initial_migration_script(app_spec)
        script_path = migrations_dir / "apply-migrations.sh"
        script_path.write_text(migration_script)
        script_path.chmod(0o755)
        generated_files["Migrations/apply-migrations.sh"] = migration_script
        
        return generated_files
    
    async def _generate_tests(
        self,
        app_spec: ApplicationSpec,
        backend_path: Path,
        frontend_path: Path
    ) -> Dict[str, str]:
        """Generate test files for backend and frontend"""
        logger.info("Generating test files")
        
        generated_files = {}
        
        # Backend tests
        backend_tests_dir = backend_path / "Tests"
        backend_tests_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unit tests for each model
        for model in app_spec.models:
            test_content = self._generate_model_test(model, app_spec)
            test_path = backend_tests_dir / f"{model.name}Tests.cs"
            test_path.write_text(test_content)
            generated_files[f"backend/Tests/{model.name}Tests.cs"] = test_content
        
        # Generate integration tests
        integration_test = self._generate_integration_test(app_spec)
        integration_path = backend_tests_dir / "IntegrationTests.cs"
        integration_path.write_text(integration_test)
        generated_files["backend/Tests/IntegrationTests.cs"] = integration_test
        
        # Generate test project file
        test_csproj = self._generate_test_csproj(app_spec)
        test_csproj_path = backend_tests_dir / f"{app_spec.project_name}.Tests.csproj"
        test_csproj_path.write_text(test_csproj)
        generated_files[f"backend/Tests/{app_spec.project_name}.Tests.csproj"] = test_csproj
        
        return generated_files
    
    async def _generate_documentation(
        self,
        app_spec: ApplicationSpec,
        output_path: Path
    ) -> Dict[str, str]:
        """Generate documentation files"""
        logger.info("Generating documentation")
        
        generated_files = {}
        
        # Generate README
        readme_content = self._generate_readme(app_spec)
        readme_path = output_path / "README.md"
        readme_path.write_text(readme_content)
        generated_files["README.md"] = readme_content
        
        # Generate API documentation
        api_docs = self._generate_api_documentation(app_spec)
        api_docs_path = output_path / "API.md"
        api_docs_path.write_text(api_docs)
        generated_files["API.md"] = api_docs
        
        return generated_files
    
    def _create_template_context(self, app_spec: ApplicationSpec) -> Dict[str, Any]:
        """Create context dictionary for template rendering"""
        return {
            "project_name": app_spec.project_name,
            "description": app_spec.description,
            "models": app_spec.models,
            "relations": app_spec.relations,
            "database": app_spec.database,
            "api": app_spec.api,
            "frontend": app_spec.frontend,
            "timestamp": datetime.now().isoformat()
        }
    
    def _copy_template_directory(
        self,
        src_dir: Path,
        dest_dir: Path,
        context: Dict[str, Any],
        generated_files: Dict[str, str]
    ):
        """Copy template directory, rendering templates and renaming files"""
        for item in src_dir.rglob("*"):
            if item.is_file():
                # Calculate relative path
                rel_path = item.relative_to(src_dir)
                
                # Skip if in certain directories
                if any(part.startswith('.') for part in rel_path.parts):
                    continue
                
                # Render filename if it contains template variables
                dest_rel_path_str = str(rel_path)
                if "{{" in dest_rel_path_str:
                    from jinja2 import Template
                    dest_rel_path_str = Template(dest_rel_path_str).render(context)
                
                dest_path = dest_dir / dest_rel_path_str
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                
                # If it's a Jinja template, render it
                if item.suffix in ['.j2', '.jinja', '.jinja2']:
                    try:
                        template_path = str(item.relative_to(self.templates_dir))
                        content = self.template_service.render_template(template_path, context)
                        
                        # Remove template extension
                        if dest_path.suffix in ['.j2', '.jinja', '.jinja2']:
                            dest_path = dest_path.with_suffix('')
                        
                        dest_path.write_text(content)
                        generated_files[str(dest_path.relative_to(dest_dir))] = content
                    except Exception as e:
                        logger.warning(f"Could not render template {item}: {e}")
                        # Copy as-is if rendering fails
                        shutil.copy2(item, dest_path)
                else:
                    # Copy non-template files as-is
                    shutil.copy2(item, dest_path)
    
    # Fallback generators when templates are not available
    
    def _generate_model_fallback(self, model: ModelSpec, app_spec: ApplicationSpec) -> str:
        """Generate a C# model class as fallback"""
        lines = [
            "using System;",
            "using System.ComponentModel.DataAnnotations;",
            "using System.ComponentModel.DataAnnotations.Schema;",
            "",
            f"namespace {app_spec.project_name}.Models",
            "{",
            f"    public class {model.name}",
            "    {",
        ]
        
        for prop in model.properties:
            # Add attributes
            if prop.isPrimaryKey:
                lines.append("        [Key]")
            if prop.isAutoIncrement:
                lines.append("        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]")
            if prop.isRequired and not prop.isPrimaryKey:
                lines.append("        [Required]")
            if prop.maxLength:
                lines.append(f"        [MaxLength({prop.maxLength})]")
            
            # Add property
            csharp_type = self._convert_to_csharp_type(prop.type)
            nullable = "" if (prop.isRequired or prop.isPrimaryKey or csharp_type == "bool") else "?"
            lines.append(f"        public {csharp_type}{nullable} {prop.name} {{ get; set; }}")
            lines.append("")
        
        lines.append("    }")
        lines.append("}")
        
        return "\n".join(lines)
    
    def _generate_controller_fallback(self, model: ModelSpec, endpoint: EndpointSpec, app_spec: ApplicationSpec) -> str:
        """Generate a C# controller as fallback"""
        lines = [
            "using Microsoft.AspNetCore.Mvc;",
            "using Microsoft.EntityFrameworkCore;",
            "using System.Collections.Generic;",
            "using System.Linq;",
            "using System.Threading.Tasks;",
            f"using {app_spec.project_name}.Models;",
            f"using {app_spec.project_name}.DTOs;",
            "",
            f"namespace {app_spec.project_name}.Controllers",
            "{",
            "    [ApiController]",
            f"    [Route(\"api/[controller]\")]",
            f"    public class {model.name}Controller : ControllerBase",
            "    {",
            "        private readonly ApplicationDbContext _context;",
            "",
            f"        public {model.name}Controller(ApplicationDbContext context)",
            "        {",
            "            _context = context;",
            "        }",
            "",
        ]
        
        if "GET" in endpoint.methods:
            lines.extend([
                "        [HttpGet]",
                f"        public async Task<ActionResult<IEnumerable<{model.name}>>> GetAll()",
                "        {",
                f"            return await _context.{model.name}s.ToListAsync();",
                "        }",
                "",
                "        [HttpGet(\"{id}\")]",
                f"        public async Task<ActionResult<{model.name}>> GetById(int id)",
                "        {",
                f"            var item = await _context.{model.name}s.FindAsync(id);",
                "            if (item == null) return NotFound();",
                "            return item;",
                "        }",
                "",
            ])
        
        if "POST" in endpoint.methods:
            lines.extend([
                "        [HttpPost]",
                f"        public async Task<ActionResult<{model.name}>> Create({model.name}DTO dto)",
                "        {",
                f"            var item = new {model.name}();",
                "            // Map DTO to model",
                f"            _context.{model.name}s.Add(item);",
                "            await _context.SaveChangesAsync();",
                "            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);",
                "        }",
                "",
            ])
        
        if "PUT" in endpoint.methods:
            lines.extend([
                "        [HttpPut(\"{id}\")]",
                f"        public async Task<IActionResult> Update(int id, {model.name}DTO dto)",
                "        {",
                f"            var item = await _context.{model.name}s.FindAsync(id);",
                "            if (item == null) return NotFound();",
                "            // Map DTO to model",
                "            await _context.SaveChangesAsync();",
                "            return NoContent();",
                "        }",
                "",
            ])
        
        if "DELETE" in endpoint.methods:
            lines.extend([
                "        [HttpDelete(\"{id}\")]",
                "        public async Task<IActionResult> Delete(int id)",
                "        {",
                f"            var item = await _context.{model.name}s.FindAsync(id);",
                "            if (item == null) return NotFound();",
                f"            _context.{model.name}s.Remove(item);",
                "            await _context.SaveChangesAsync();",
                "            return NoContent();",
                "        }",
            ])
        
        lines.extend([
            "    }",
            "}",
        ])
        
        return "\n".join(lines)
    
    def _generate_dto_fallback(self, model: ModelSpec, app_spec: ApplicationSpec) -> str:
        """Generate a C# DTO as fallback"""
        lines = [
            "using System;",
            "using System.ComponentModel.DataAnnotations;",
            "",
            f"namespace {app_spec.project_name}.DTOs",
            "{",
            f"    public class {model.name}DTO",
            "    {",
        ]
        
        for prop in model.properties:
            if not prop.isPrimaryKey:  # Skip primary key in DTO
                if prop.isRequired:
                    lines.append("        [Required]")
                if prop.maxLength:
                    lines.append(f"        [MaxLength({prop.maxLength})]")
                
                csharp_type = self._convert_to_csharp_type(prop.type)
                nullable = "" if (prop.isRequired or csharp_type == "bool") else "?"
                lines.append(f"        public {csharp_type}{nullable} {prop.name} {{ get; set; }}")
                lines.append("")
        
        lines.append("    }")
        lines.append("}")
        
        return "\n".join(lines)
    
    def _generate_dbcontext_fallback(self, app_spec: ApplicationSpec) -> str:
        """Generate ApplicationDbContext as fallback"""
        lines = [
            "using Microsoft.EntityFrameworkCore;",
            f"using {app_spec.project_name}.Models;",
            "",
            f"namespace {app_spec.project_name}",
            "{",
            "    public class ApplicationDbContext : DbContext",
            "    {",
            "        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)",
            "            : base(options)",
            "        {",
            "        }",
            "",
        ]
        
        for model in app_spec.models:
            lines.append(f"        public DbSet<{model.name}> {model.name}s {{ get; set; }}")
        
        lines.extend([
            "",
            "        protected override void OnModelCreating(ModelBuilder modelBuilder)",
            "        {",
            "            base.OnModelCreating(modelBuilder);",
            "            // Configure relationships and constraints here",
        ])
        
        # Add relationship configurations
        for relation in app_spec.relations:
            if relation.type == "one-to-many":
                lines.append(f"            // {relation.name}: {relation.from_model} -> {relation.to_model}")
        
        lines.extend([
            "        }",
            "    }",
            "}",
        ])
        
        return "\n".join(lines)
    
    def _generate_program_fallback(self, app_spec: ApplicationSpec) -> str:
        """Generate Program.cs as fallback"""
        return f"""using Microsoft.EntityFrameworkCore;
using {app_spec.project_name};

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS
builder.Services.AddCors(options =>
{{
    options.AddPolicy("AllowAll",
        policy =>
        {{
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }});
}});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{{
    app.UseSwagger();
    app.UseSwaggerUI();
}}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
"""
    
    def _generate_csproj_fallback(self, app_spec: ApplicationSpec) -> str:
        """Generate .csproj file as fallback"""
        return f"""<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>{app_spec.project_name}</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="9.0.0">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.6.2" />
  </ItemGroup>

</Project>
"""
    
    def _generate_frontend_dockerfile(self, app_spec: ApplicationSpec) -> str:
        """Generate frontend Dockerfile"""
        return """# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"""
    
    def _generate_backend_dockerfile_fallback(self, app_spec: ApplicationSpec) -> str:
        """Generate backend Dockerfile as fallback"""
        return f"""FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["{app_spec.project_name}-api.csproj", "."]
RUN dotnet restore "{app_spec.project_name}-api.csproj"
COPY . .
RUN dotnet build "{app_spec.project_name}-api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "{app_spec.project_name}-api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "{app_spec.project_name}-api.dll"]
"""
    
    def _generate_docker_compose_fallback(self, app_spec: ApplicationSpec) -> str:
        """Generate docker-compose.yml as fallback"""
        return f"""services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: {app_spec.project_name.lower()}-api
    restart: unless-stopped
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=${{POSTGRES_DB}};Username=${{POSTGRES_USER}};Password=${{POSTGRES_PASSWORD}}"
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: {app_spec.project_name.lower()}-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - api
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    container_name: {app_spec.project_name.lower()}-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${{POSTGRES_USER}}
      POSTGRES_PASSWORD: ${{POSTGRES_PASSWORD}}
      POSTGRES_DB: ${{POSTGRES_DB}}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres-data:

networks:
  app-network:
    driver: bridge
"""
    
    def _generate_env_example(self, app_spec: ApplicationSpec) -> str:
        """Generate .env.example file"""
        return f"""# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB={app_spec.project_name.lower()}_db

# API Configuration
API_URL=http://localhost:8080
ENVIRONMENT=Development

# Frontend Configuration
FRONT_URL=http://localhost:80
"""
    
    def _generate_openapi_setup_script(self, app_spec: ApplicationSpec) -> str:
        """Generate OpenAPI service generation script"""
        return f"""#!/bin/bash
set -e

echo "Generating API services from OpenAPI schema..."

# Wait for API to be ready
echo "Waiting for API to be available..."
timeout 60 bash -c 'until curl -f http://localhost:8080/swagger/v1/swagger.json > /dev/null 2>&1; do sleep 2; done'

# Download OpenAPI schema
curl -o openapi.json http://localhost:8080/swagger/v1/swagger.json

# Generate TypeScript services using openapi-generator
npx @openapitools/openapi-generator-cli generate \\
  -i openapi.json \\
  -g typescript-angular \\
  -o src/app/services/api \\
  --additional-properties=ngVersion=17,npmName={app_spec.project_name}-api-client

echo "API services generated successfully!"
"""
    
    def _generate_initial_migration_script(self, app_spec: ApplicationSpec) -> str:
        """Generate migration application script"""
        return f"""#!/bin/bash
set -e

echo "Applying database migrations for {app_spec.project_name}..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
timeout 60 bash -c 'until pg_isready -h postgres -p 5432 -U $POSTGRES_USER > /dev/null 2>&1; do sleep 2; done'

# Apply migrations using Entity Framework
dotnet ef database update --project {app_spec.project_name}-api.csproj

echo "Migrations applied successfully!"
"""
    
    def _generate_model_test(self, model: ModelSpec, app_spec: ApplicationSpec) -> str:
        """Generate unit tests for a model"""
        return f"""using Xunit;
using {app_spec.project_name}.Models;

namespace {app_spec.project_name}.Tests
{{
    public class {model.name}Tests
    {{
        [Fact]
        public void {model.name}_CanBeCreated()
        {{
            // Arrange & Act
            var item = new {model.name}();
            
            // Assert
            Assert.NotNull(item);
        }}
        
        [Fact]
        public void {model.name}_PropertiesCanBeSet()
        {{
            // Arrange
            var item = new {model.name}();
            
            // Act
            {self._generate_property_assignments(model)}
            
            // Assert
            {self._generate_property_assertions(model)}
        }}
    }}
}}
"""
    
    def _generate_property_assignments(self, model: ModelSpec) -> str:
        """Generate property assignment code for tests"""
        lines = []
        for prop in model.properties:
            if not prop.isAutoIncrement:
                value = self._get_test_value(prop.type)
                lines.append(f"item.{prop.name} = {value};")
        return "\n            ".join(lines)
    
    def _generate_property_assertions(self, model: ModelSpec) -> str:
        """Generate property assertion code for tests"""
        lines = []
        for prop in model.properties:
            if not prop.isAutoIncrement:
                value = self._get_test_value(prop.type)
                lines.append(f"Assert.Equal({value}, item.{prop.name});")
        return "\n            ".join(lines)
    
    def _get_test_value(self, prop_type: str) -> str:
        """Get a test value for a given property type"""
        type_map = {
            "string": '"Test Value"',
            "int": "42",
            "bool": "true",
            "DateTime": "DateTime.Now",
            "decimal": "99.99m",
            "double": "99.99",
            "float": "99.99f"
        }
        return type_map.get(prop_type, '"test"')
    
    def _generate_integration_test(self, app_spec: ApplicationSpec) -> str:
        """Generate integration tests"""
        return f"""using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;

namespace {app_spec.project_name}.Tests
{{
    public class IntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {{
        private readonly HttpClient _client;
        
        public IntegrationTests(WebApplicationFactory<Program> factory)
        {{
            _client = factory.CreateClient();
        }}
        
        [Fact]
        public async Task HealthCheck_ReturnsSuccess()
        {{
            // Act
            var response = await _client.GetAsync("/health");
            
            // Assert
            response.EnsureSuccessStatusCode();
        }}
        
        [Fact]
        public async Task Swagger_IsAccessible()
        {{
            // Act
            var response = await _client.GetAsync("/swagger/v1/swagger.json");
            
            // Assert
            response.EnsureSuccessStatusCode();
        }}
    }}
}}
"""
    
    def _generate_test_csproj(self, app_spec: ApplicationSpec) -> str:
        """Generate test project file"""
        return f"""<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="9.0.0" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.9.0" />
    <PackageReference Include="xunit" Version="2.6.6" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.5.6">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="../{app_spec.project_name}-api.csproj" />
  </ItemGroup>

</Project>
"""
    
    def _generate_readme(self, app_spec: ApplicationSpec) -> str:
        """Generate README.md"""
        return f"""# {app_spec.project_name}

{app_spec.description}

## Generated Application

This application was automatically generated using the Beecoming DSL generator.

### Architecture

- **Backend**: ASP.NET Core 9.0 Web API
- **Frontend**: {app_spec.frontend.framework}
- **Database**: {app_spec.database.provider}

### Models

{self._list_models(app_spec)}

### API Endpoints

{self._list_endpoints(app_spec)}

## Getting Started

### Prerequisites

- Docker and Docker Compose
- .NET 9.0 SDK (for local development)
- Node.js 20+ (for frontend development)

### Running with Docker

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Start all services:
```bash
docker-compose up -d
```

3. Apply database migrations:
```bash
docker-compose exec api bash -c "cd /app && bash Migrations/apply-migrations.sh"
```

4. Access the application:
   - Frontend: http://localhost:80
   - API: http://localhost:8080
   - API Documentation: http://localhost:8080/swagger

### Running Locally

#### Backend

```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

### Running Tests

#### Backend Tests

```bash
cd backend/Tests
dotnet test
```

#### Frontend Tests

```bash
cd frontend
npm test
```

## Project Structure

```
.
├── backend/              # ASP.NET Core API
│   ├── Controllers/      # API Controllers
│   ├── Models/           # Data Models
│   ├── DTOs/             # Data Transfer Objects
│   ├── Migrations/       # Database Migrations
│   └── Tests/            # Unit and Integration Tests
├── frontend/             # {app_spec.frontend.framework} Application
│   ├── src/
│   └── scripts/          # Build and setup scripts
├── docker-compose.yml    # Docker Compose configuration
└── README.md            # This file
```

## API Documentation

The API documentation is available via Swagger UI at `/swagger` when the application is running.

## License

Generated by Beecoming DSL - {datetime.now().year}
"""
    
    def _list_models(self, app_spec: ApplicationSpec) -> str:
        """List all models for README"""
        lines = []
        for model in app_spec.models:
            lines.append(f"- **{model.name}**: {len(model.properties)} properties")
        return "\n".join(lines)
    
    def _list_endpoints(self, app_spec: ApplicationSpec) -> str:
        """List all endpoints for README"""
        lines = []
        for endpoint in app_spec.api.endpoints:
            methods = ", ".join(endpoint.methods)
            lines.append(f"- `/api/{endpoint.model}`: {methods}")
        return "\n".join(lines)
    
    def _generate_api_documentation(self, app_spec: ApplicationSpec) -> str:
        """Generate API documentation"""
        lines = [
            f"# {app_spec.project_name} API Documentation",
            "",
            "## Endpoints",
            "",
        ]
        
        for endpoint in app_spec.api.endpoints:
            model = next((m for m in app_spec.models if m.name == endpoint.model), None)
            if model:
                lines.append(f"### {model.name}")
                lines.append("")
                lines.append(f"Base URL: `/api/{model.name}`")
                lines.append("")
                
                if "GET" in endpoint.methods:
                    lines.append("#### Get All")
                    lines.append("```")
                    lines.append(f"GET /api/{model.name}")
                    lines.append("```")
                    lines.append("")
                    
                    lines.append("#### Get By ID")
                    lines.append("```")
                    lines.append(f"GET /api/{model.name}/{{id}}")
                    lines.append("```")
                    lines.append("")
                
                if "POST" in endpoint.methods:
                    lines.append("#### Create")
                    lines.append("```")
                    lines.append(f"POST /api/{model.name}")
                    lines.append("Content-Type: application/json")
                    lines.append("")
                    lines.append(self._generate_sample_dto(model))
                    lines.append("```")
                    lines.append("")
                
                if "PUT" in endpoint.methods:
                    lines.append("#### Update")
                    lines.append("```")
                    lines.append(f"PUT /api/{model.name}/{{id}}")
                    lines.append("Content-Type: application/json")
                    lines.append("")
                    lines.append(self._generate_sample_dto(model))
                    lines.append("```")
                    lines.append("")
                
                if "DELETE" in endpoint.methods:
                    lines.append("#### Delete")
                    lines.append("```")
                    lines.append(f"DELETE /api/{model.name}/{{id}}")
                    lines.append("```")
                    lines.append("")
        
        return "\n".join(lines)
    
    def _generate_sample_dto(self, model: ModelSpec) -> str:
        """Generate a sample DTO JSON"""
        props = {}
        for prop in model.properties:
            if not prop.isAutoIncrement and not prop.isPrimaryKey:
                props[prop.name] = self._get_sample_json_value(prop.type)
        
        import json
        return json.dumps(props, indent=2)
    
    def _get_sample_json_value(self, prop_type: str):
        """Get a sample JSON value for a property type"""
        type_map = {
            "string": "sample string",
            "int": 1,
            "bool": True,
            "DateTime": "2024-01-01T00:00:00Z",
            "decimal": 99.99,
            "double": 99.99,
            "float": 99.99
        }
        return type_map.get(prop_type, "value")
    
    def _convert_to_csharp_type(self, type_str: str) -> str:
        """Convert a type string to C# type"""
        type_map = {
            "string": "string",
            "int": "int",
            "bool": "bool",
            "DateTime": "DateTime",
            "decimal": "decimal",
            "double": "double",
            "float": "float"
        }
        return type_map.get(type_str, "string")


# Singleton instance
application_generator_service = ApplicationGeneratorService()
