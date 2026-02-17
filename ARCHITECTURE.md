# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Beecoming DSL Generator                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   FastAPI Backend                         │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │   Routes   │  │   Services   │  │     Models      │  │  │
│  │  │            │  │              │  │                 │  │  │
│  │  │ /api/      │  │ Application  │  │ ApplicationSpec │  │  │
│  │  │ application│──│ Generator    │──│ ModelSpec       │  │  │
│  │  │ /generate  │  │              │  │ PropertySpec    │  │  │
│  │  │            │  │ Scaffolding  │  │ UMLDiagram      │  │  │
│  │  │ /api/      │  │              │  │                 │  │  │
│  │  │ scaffolding│  │ Template     │  │                 │  │  │
│  │  │            │  │              │  │                 │  │  │
│  │  │ /api/chat  │  │ LLM (opt)    │  │                 │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Jinja2 Templates                             │  │
│  │  ┌──────────────┐         ┌──────────────┐              │  │
│  │  │   Backend    │         │   Frontend   │              │  │
│  │  │  Templates   │         │  Templates   │              │  │
│  │  │              │         │              │              │  │
│  │  │ • Models     │         │ • Components │              │  │
│  │  │ • Controllers│         │ • Services   │              │  │
│  │  │ • DTOs       │         │ • Config     │              │  │
│  │  │ • DbContext  │         │              │              │  │
│  │  │ • Dockerfile │         │ • Dockerfile │              │  │
│  │  └──────────────┘         └──────────────┘              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JSON Specification
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Generated Application                           │
│                                                                   │
│  ┌──────────────────────┐        ┌──────────────────────┐      │
│  │  Backend (ASP.NET)   │        │  Frontend (Angular)  │      │
│  │                      │        │                      │      │
│  │ • Models             │◄───────│ • Components         │      │
│  │ • Controllers        │  API   │ • Services (OpenAPI) │      │
│  │ • DTOs               │        │ • Routing            │      │
│  │ • DbContext          │        │                      │      │
│  │ • Migrations         │        │                      │      │
│  │ • Tests              │        │ • Tests              │      │
│  └──────────────────────┘        └──────────────────────┘      │
│           │                                   │                  │
│           │                                   │                  │
│           ▼                                   ▼                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Docker Compose                          │       │
│  │                                                       │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐      │       │
│  │  │   API    │  │ Frontend │  │  PostgreSQL  │      │       │
│  │  │ (Docker) │  │ (Docker) │  │   (Docker)   │      │       │
│  │  └──────────┘  └──────────┘  └──────────────┘      │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Generation Flow

```
┌──────────────┐
│ JSON Spec    │
│ Input        │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 1. Parse Specification                   │
│    • Validate JSON                       │
│    • Create ApplicationSpec model        │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 2. Generate Backend                      │
│    • Create Models (EF Core)             │
│    • Generate Controllers (REST API)     │
│    • Create DTOs                         │
│    • Generate DbContext                  │
│    • Create Program.cs                   │
│    • Generate .csproj                    │
│    • Create Tests                        │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 3. Generate Frontend                     │
│    • Copy template structure             │
│    • Create component scaffolding        │
│    • Generate OpenAPI script             │
│    • Configure routing                   │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 4. Generate Docker Configuration         │
│    • Create backend Dockerfile           │
│    • Create frontend Dockerfile          │
│    • Generate docker-compose.yml         │
│    • Create .env.example                 │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 5. Generate Migrations                   │
│    • Create migration scripts            │
│    • Configure EF Core                   │
│    • Setup database initialization       │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 6. Generate Documentation                │
│    • Create README.md                    │
│    • Generate API.md                     │
│    • Document endpoints                  │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Complete App │
│ Output       │
└──────────────┘
```

## CI/CD Pipeline

```
┌────────────────────────────────────────────────────────────┐
│              GitHub Actions Workflow                        │
└────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌────────────────┐
│ test-generator│   │ build-and-test  │   │ docker-build   │
│               │   │   backend       │   │                │
│ • Install     │   │                 │   │ • Setup Docker │
│   deps        │   │ • Install deps  │   │ • Build images │
│ • Run E2E     │   │ • Start server  │   │ • Validate     │
│   test        │   │ • Test API      │   │                │
└───────────────┘   └─────────────────┘   └────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
          ┌─────────────────┐  ┌────────────────────┐
          │ build-and-test  │  │ generate-and-test  │
          │   frontend      │  │      app           │
          │                 │  │                    │
          │ • Install deps  │  │ • Generate app     │
          │ • Run linter    │  │ • Build .NET       │
          │ • Build         │  │ • Build Docker     │
          │ • Run tests     │  │ • Test compose     │
          └─────────────────┘  └────────────────────┘
```

## Technology Stack

### Generator (Backend)
```
┌─────────────────────────────────────┐
│ FastAPI 0.109.0                     │
│   • High-performance async API      │
│   • Automatic OpenAPI docs          │
│   • Pydantic validation             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Jinja2 3.1.3                        │
│   • Template rendering              │
│   • Code generation                 │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ LangChain (Optional)                │
│   • LLM integration                 │
│   • OpenAI support                  │
└─────────────────────────────────────┘
```

### Generated Applications

#### Backend
```
┌─────────────────────────────────────┐
│ ASP.NET Core 9.0                    │
│   • Web API framework               │
│   • Dependency injection            │
│   • Middleware pipeline             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Entity Framework Core 9.0           │
│   • ORM for database                │
│   • Migrations                      │
│   • LINQ queries                    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ PostgreSQL                          │
│   • Relational database             │
│   • ACID compliance                 │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ xUnit                               │
│   • Unit testing                    │
│   • Integration testing             │
└─────────────────────────────────────┘
```

#### Frontend
```
┌─────────────────────────────────────┐
│ Angular 17+                         │
│   • Component-based architecture    │
│   • TypeScript                      │
│   • RxJS                            │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Ionic                               │
│   • Mobile UI components            │
│   • Cross-platform                  │
└─────────────────────────────────────┘
```

#### Infrastructure
```
┌─────────────────────────────────────┐
│ Docker                              │
│   • Containerization                │
│   • Multi-stage builds              │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Docker Compose                      │
│   • Service orchestration           │
│   • Network management              │
└─────────────────────────────────────┘
```

## Data Flow

```
User Input (JSON)
      │
      ▼
┌─────────────────┐
│ API Endpoint    │
│ /api/application│
│ /generate       │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ ApplicationSpec     │
│ Model Validation    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Generator Service   │
│ • Backend           │
│ • Frontend          │
│ • Docker            │
│ • Tests             │
│ • Docs              │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Template Rendering  │
│ (Jinja2)            │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ File System Write   │
│ output/ProjectName/ │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Response (JSON)     │
│ • Output path       │
│ • Files generated   │
│ • Status            │
└─────────────────────┘
```

## Security Architecture

```
┌──────────────────────────────────────────┐
│          Input Validation                 │
│                                           │
│  • Pydantic Models                       │
│  • JSON Schema Validation                │
│  • Type Checking                         │
└──────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│       Code Generation Security           │
│                                           │
│  • Template Sandboxing                   │
│  • No Arbitrary Code Execution           │
│  • Safe String Operations                │
└──────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│         Output Validation                │
│                                           │
│  • File Path Validation                  │
│  • Content Sanitization                  │
│  • Safe File Operations                  │
└──────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│           CI/CD Security                 │
│                                           │
│  • CodeQL Analysis                       │
│  • GitHub Token Permissions              │
│  • Dependency Scanning                   │
└──────────────────────────────────────────┘
```

## Scalability

### Horizontal Scaling
- Generator API can run multiple instances
- Load balancer can distribute requests
- Stateless design enables easy scaling

### Vertical Scaling
- Async operations for heavy tasks
- Background job support
- Resource-efficient templates

### Caching
- Template caching in memory
- Compiled Jinja2 templates
- Output directory reuse possible

## Extensibility Points

```
┌─────────────────────────────────────┐
│ 1. Templates                        │
│    • Add new Jinja2 templates       │
│    • Customize existing ones        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 2. Language Support                 │
│    • Add TypeScript generator       │
│    • Add Python generator           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 3. Framework Support                │
│    • Add NestJS                     │
│    • Add Django                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 4. Database Providers               │
│    • Add MySQL                      │
│    • Add MongoDB                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 5. Testing Frameworks               │
│    • Add Jest                       │
│    • Add Pytest                     │
└─────────────────────────────────────┘
```

---

**Version:** 1.0.0  
**Last Updated:** February 17, 2026
