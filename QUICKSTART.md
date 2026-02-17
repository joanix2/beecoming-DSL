# Guide de Démarrage Rapide - Générateur d'Application

## 🚀 Démarrage en 5 Minutes

### 1. Prérequis

```bash
# Vérifier les installations
python --version  # Python 3.11+
node --version    # Node.js 20+
dotnet --version  # .NET 9.0+
docker --version  # Docker 20+
```

### 2. Installation

```bash
# Cloner le repository
git clone https://github.com/joanix2/beecoming-DSL.git
cd beecoming-DSL

# Installer les dépendances backend
cd back
pip install -r requirements.txt
cd ..
```

### 3. Générer Votre Première Application

```bash
# Option A : Via le script de test
python test_generator.py

# Option B : Via l'API
cd back
python main.py &  # Démarrer le serveur
sleep 5
curl -X POST http://localhost:8000/api/application/generate \
  -H "Content-Type: application/json" \
  -d @../example-app-spec.json
```

### 4. Lancer l'Application Générée

```bash
# Aller dans le répertoire de sortie
cd output/TaskManager_*

# Copier la configuration
cp .env.example .env

# Démarrer avec Docker
docker-compose up -d

# L'application est maintenant accessible :
# - Frontend: http://localhost:80
# - API: http://localhost:8080
# - API Docs: http://localhost:8080/swagger
```

## 📝 Créer Votre Propre Spécification

### Exemple Minimal

```json
{
  "project_name": "MonApp",
  "description": "Ma première application",
  "database": {
    "provider": "PostgreSQL",
    "connection_string_template": "Host=${POSTGRES_HOST};Port=${POSTGRES_PORT};Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}"
  },
  "models": [
    {
      "name": "Item",
      "properties": [
        {
          "name": "Id",
          "type": "int",
          "isPrimaryKey": true,
          "isAutoIncrement": true
        },
        {
          "name": "Name",
          "type": "string",
          "maxLength": 100,
          "isRequired": true
        }
      ]
    }
  ],
  "relations": [],
  "api": {
    "endpoints": [
      {
        "model": "Item",
        "methods": ["GET", "POST", "PUT", "DELETE"]
      }
    ]
  },
  "frontend": {
    "framework": "Angular",
    "components": [
      {
        "name": "ItemList",
        "route": "/items"
      }
    ]
  }
}
```

Sauvegardez ce fichier comme `my-app-spec.json` et générez :

```bash
cd back
python -c "
import json
from fastapi.testclient import TestClient
from main import app

with open('../my-app-spec.json', 'r') as f:
    spec = json.load(f)

client = TestClient(app)
response = client.post('/api/application/generate', json=spec)
print(response.json())
"
```

## 🧪 Tests

```bash
# Test du générateur
python test_generator.py

# Tests backend (dans une app générée)
cd output/TaskManager_*/backend/Tests
dotnet test

# Linter
cd back
pip install flake8
flake8 .
```

## 🔧 Développement

### Modifier le Générateur

Le code principal est dans :
- `back/services/application_generator_service.py` - Logique de génération
- `back/models/app_spec.py` - Modèles de spécification
- `back/routes/application.py` - Endpoint API

### Ajouter un Template

1. Créer le template Jinja2 dans `back/templates/back/`
2. Référencer dans `application_generator_service.py`
3. Tester avec `test_generator.py`

### Modifier la CI

Le workflow CI est dans `.github/workflows/ci.yml`

## 📚 Documentation Complète

Voir [GENERATOR.md](./GENERATOR.md) pour la documentation complète.

## 🐛 Dépannage

### Le serveur ne démarre pas

```bash
# Vérifier les dépendances
cd back
pip install -r requirements.txt --upgrade

# Vérifier les logs
python main.py
```

### La génération échoue

```bash
# Valider votre JSON
python -c "import json; json.load(open('my-app-spec.json'))"

# Vérifier les logs du serveur
```

### Docker ne démarre pas

```bash
# Vérifier docker-compose.yml
cd output/TaskManager_*/
docker-compose config

# Vérifier les logs
docker-compose logs
```

## 💡 Exemples

### Application de Blog

```json
{
  "project_name": "BlogApp",
  "description": "Application de blog simple",
  "models": [
    {
      "name": "Post",
      "properties": [
        {"name": "Id", "type": "int", "isPrimaryKey": true, "isAutoIncrement": true},
        {"name": "Title", "type": "string", "maxLength": 200, "isRequired": true},
        {"name": "Content", "type": "string", "maxLength": 5000, "isRequired": true},
        {"name": "PublishedAt", "type": "DateTime", "isRequired": false}
      ]
    },
    {
      "name": "Author",
      "properties": [
        {"name": "Id", "type": "int", "isPrimaryKey": true, "isAutoIncrement": true},
        {"name": "Name", "type": "string", "maxLength": 100, "isRequired": true},
        {"name": "Email", "type": "string", "maxLength": 255, "isRequired": true}
      ]
    }
  ],
  "relations": [
    {
      "name": "AuthorPosts",
      "from": "Author",
      "to": "Post",
      "type": "one-to-many",
      "foreignKey": "AuthorId"
    }
  ],
  "api": {
    "endpoints": [
      {"model": "Post", "methods": ["GET", "POST", "PUT", "DELETE"]},
      {"model": "Author", "methods": ["GET", "POST", "PUT", "DELETE"]}
    ]
  },
  "frontend": {
    "framework": "Angular",
    "components": [
      {"name": "PostList", "route": "/posts"},
      {"name": "AuthorList", "route": "/authors"}
    ]
  }
}
```

## 🎯 Prochaines Étapes

1. ✅ Générer votre première application
2. 📖 Lire la [documentation complète](./GENERATOR.md)
3. 🔧 Personnaliser votre spécification
4. 🚀 Déployer en production
5. 🤝 Contribuer au projet

## 🆘 Aide

- 📖 Documentation : [GENERATOR.md](./GENERATOR.md)
- 🐛 Issues : [GitHub Issues](https://github.com/joanix2/beecoming-DSL/issues)
- 💬 Discussions : [GitHub Discussions](https://github.com/joanix2/beecoming-DSL/discussions)
