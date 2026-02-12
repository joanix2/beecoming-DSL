# FastAPI Scaffolder with LLM

API Python FastAPI avec intégration LangChain pour la génération de JSON et scaffolding de code à partir de diagrammes UML.

## Fonctionnalités

- 🤖 **Service LLM** : Génération de JSON avec LangChain et OpenAI
- 💬 **Chat SSE** : Route de chat en temps réel avec Server-Sent Events
- 📝 **Templates Jinja** : Gestion de templates pour le scaffolding
- 🏗️ **Scaffolding** : Génération de code à partir de JSON UML

## Installation

1. Installer les dépendances :
```bash
pip install -r requirements.txt
```

2. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Éditer .env avec votre clé API OpenAI
```

3. Lancer l'application :
```bash
python main.py
```

ou avec uvicorn :
```bash
uvicorn main:app --reload
```

## Utilisation

### API Documentation
Accéder à la documentation interactive : http://localhost:8000/docs

### Endpoints

#### Chat SSE
```bash
POST /api/chat/stream
Content-Type: application/json

{
  "message": "Generate a user model",
  "context": {}
}
```

#### Scaffolding
```bash
POST /api/scaffolding/generate
Content-Type: application/json

{
  "classes": [...],
  "relations": [...]
}
```

## Structure du projet

```
.
├── main.py                 # Point d'entrée FastAPI
├── config.py              # Configuration de l'application
├── requirements.txt       # Dépendances Python
├── models/               # Modèles Pydantic
│   ├── uml.py           # Modèles UML
│   └── chat.py          # Modèles Chat
├── routes/              # Routes FastAPI
│   ├── chat.py         # Routes de chat
│   └── scaffolding.py  # Routes de scaffolding
├── services/           # Services métier
│   ├── llm_service.py        # Service LLM
│   ├── template_service.py   # Service de templates
│   └── scaffolding_service.py # Service de scaffolding
└── templates/          # Templates Jinja
    ├── class.py.jinja2
    └── controller.py.jinja2
```

## Licence

MIT
