# Beecoming DSL - Générateur d'Applications Full-Stack

[![CI/CD Pipeline](https://github.com/joanix2/beecoming-DSL/actions/workflows/ci.yml/badge.svg)](https://github.com/joanix2/beecoming-DSL/actions/workflows/ci.yml)

Générateur automatique d'applications complètes full-stack à partir de spécifications JSON. Génère le backend (ASP.NET Core), le frontend (Angular), la configuration Docker, les migrations de base de données, et les tests.

## ✨ Fonctionnalités

- 🚀 **Génération Automatique Complète**
  - Backend ASP.NET Core 9.0 avec Entity Framework
  - Frontend Angular/Ionic
  - Configuration Docker et docker-compose
  - Migrations de base de données
  - Tests unitaires et d'intégration

- 🐳 **Support Docker Complet**
  - Dockerfiles optimisés multi-stage
  - docker-compose.yml prêt pour production
  - Configuration PostgreSQL
  - Variables d'environnement

- 🧪 **Tests Intégrés**
  - Tests unitaires (xUnit)
  - Tests d'intégration
  - Test end-to-end du générateur
  - CI/CD avec GitHub Actions

- 📡 **Génération API**
  - Controllers REST complets (CRUD)
  - Documentation Swagger/OpenAPI
  - DTOs avec validation
  - Services frontend générés automatiquement

- 🤖 **Intégration LLM** (Optionnel)
  - Support LangChain et OpenAI
  - Chat en temps réel (SSE)
  - Génération assistée par IA

## 🚀 Démarrage Rapide

### Prérequis

- Python 3.11+
- Node.js 20+
- .NET 9.0 SDK
- Docker & Docker Compose

### Installation

```bash
# Cloner le repository
git clone https://github.com/joanix2/beecoming-DSL.git
cd beecoming-DSL

# Installer les dépendances
cd back
pip install -r requirements.txt
```

### Générer une Application

```bash
# Option 1 : Test end-to-end complet
python test_generator.py

# Option 2 : Via l'API
cd back
python main.py &
sleep 5
curl -X POST http://localhost:8000/api/application/generate \
  -H "Content-Type: application/json" \
  -d @../example-app-spec.json
```

### Lancer l'Application Générée

```bash
cd output/TaskManager_*/
cp .env.example .env
docker-compose up -d

# Accès :
# - Frontend: http://localhost:80
# - API: http://localhost:8080
# - Swagger: http://localhost:8080/swagger
```

## 📖 Documentation

- **[Guide de Démarrage Rapide](./QUICKSTART.md)** - Commencez en 5 minutes
- **[Documentation Complète](./GENERATOR.md)** - Architecture et détails techniques
- **[Spécification JSON](./example-app-spec.json)** - Exemple de spécification

## 🏗️ Architecture

```
beecoming-DSL/
├── back/                      # Backend FastAPI (générateur)
│   ├── models/
│   │   ├── app_spec.py       # Modèles de spécification
│   │   ├── uml.py            # Modèles UML
│   │   └── chat.py           # Modèles Chat
│   ├── routes/
│   │   ├── application.py    # Génération d'application
│   │   ├── scaffolding.py    # Scaffolding UML
│   │   └── chat.py           # Chat LLM
│   ├── services/
│   │   ├── application_generator_service.py
│   │   ├── scaffolding_service.py
│   │   ├── template_service.py
│   │   └── llm_service.py
│   └── templates/            # Templates Jinja2
│       ├── back/             # Templates C# ASP.NET
│       └── front/            # Templates Angular
├── front/                    # Frontend interface (optionnel)
├── example-app-spec.json     # Exemple de spécification
├── test_generator.py         # Test end-to-end
└── .github/workflows/ci.yml  # Pipeline CI/CD
```

## 📝 Exemple de Spécification

```json
{
  "project_name": "TaskManager",
  "description": "Application de gestion de tâches",
  "database": {
    "provider": "PostgreSQL",
    "connection_string_template": "Host=${POSTGRES_HOST};..."
  },
  "models": [
    {
      "name": "Task",
      "properties": [
        {
          "name": "Id",
          "type": "int",
          "isPrimaryKey": true,
          "isAutoIncrement": true
        },
        {
          "name": "Title",
          "type": "string",
          "maxLength": 200,
          "isRequired": true
        }
      ]
    }
  ],
  "api": {
    "endpoints": [
      {
        "model": "Task",
        "methods": ["GET", "POST", "PUT", "DELETE"]
      }
    ]
  },
  "frontend": {
    "framework": "Angular",
    "components": [
      {"name": "TaskList", "route": "/tasks"}
    ]
  }
}
```

## 🧪 Tests

```bash
# Test du générateur (complet)
python test_generator.py

# Tests backend du générateur
cd back
pip install pytest
pytest

# Tests d'une application générée
cd output/TaskManager_*/backend/Tests
dotnet test
```

## 🔄 CI/CD

Le pipeline GitHub Actions exécute automatiquement :

1. ✅ Installation des dépendances
2. ✅ Tests du générateur
3. ✅ Génération d'une application depuis JSON
4. ✅ Build des images Docker
5. ✅ Validation docker-compose
6. ✅ Tests de l'application générée

Voir [.github/workflows/ci.yml](./.github/workflows/ci.yml)

## 🎯 Application Générée

Une application complète est générée avec :

### Backend (ASP.NET Core 9.0)
- ✅ Models avec Entity Framework
- ✅ Controllers REST (CRUD complet)
- ✅ DTOs avec validation
- ✅ DbContext configuré
- ✅ Swagger/OpenAPI
- ✅ Tests unitaires et d'intégration
- ✅ Dockerfile optimisé

### Frontend (Angular)
- ✅ Structure de projet
- ✅ Configuration build
- ✅ Script de génération de services API
- ✅ Dockerfile Nginx

### Infrastructure
- ✅ docker-compose.yml complet
- ✅ Configuration PostgreSQL
- ✅ Scripts de migration
- ✅ Variables d'environnement
- ✅ Documentation (README + API docs)

## 🛠️ Technologies

**Générateur**
- FastAPI (Python)
- Jinja2 (Templates)
- LangChain (LLM optionnel)
- Pydantic (Validation)

**Applications Générées**
- ASP.NET Core 9.0
- Entity Framework Core
- PostgreSQL
- Angular/Ionic
- Docker & Docker Compose
- xUnit (Tests)

## 📊 Endpoints API

Le générateur expose les endpoints suivants :

```
POST   /api/application/generate        # Générer une application complète
POST   /api/scaffolding/generate        # Scaffolding depuis UML
POST   /api/chat/stream                 # Chat LLM (SSE)
GET    /api/scaffolding/languages       # Langages supportés
GET    /health                          # Health check
GET    /docs                            # Documentation Swagger
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir le workflow de développement :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT

## 🙏 Remerciements

- FastAPI pour le framework web
- LangChain pour l'intégration LLM
- ASP.NET Core pour le backend généré
- Angular pour le frontend généré

## 📞 Support

- 📖 [Documentation](./GENERATOR.md)
- 🚀 [Quick Start](./QUICKSTART.md)
- 🐛 [Issues](https://github.com/joanix2/beecoming-DSL/issues)
- 💬 [Discussions](https://github.com/joanix2/beecoming-DSL/discussions)

---

Développé avec ❤️ pour automatiser la création d'applications full-stack
