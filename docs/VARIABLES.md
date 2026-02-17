# Configuration et Modèles - UML Scaffolder

## Structure Générale

```json
{
  "config": {
    "project_name": "MyApp",
    "description": "Application description",
    "database": { ... },
    "api": { ... },
    "frontend": { ... },
    "features": { ... }
  },
  "models": [
    { ... },
    { ... }
  ]
}
```

## Section `config`

### Variables Globales

```json
{
  "config": {
    "project_name": "MyApp",
    "description": "Application description",
    "database": {
      "provider": "postgres",
      "connection_string": "Server=localhost;Database=myapp;..."
    },
    "api": {
      "port": 5000,
      "version": "v1",
      "base_url": "/api"
    },
    "frontend": {
      "port": 3000,
      "framework": "angular"
    },
    "features": {
      "auth": true,
      "email_service": false,
      "file_service": false,
      "notifications": false,
      "logging": true
    }
  }
}
```

### Description des Variables

#### Générales

| Variable       | Type   | Requis | Description                  |
| -------------- | ------ | ------ | ---------------------------- |
| `project_name` | string | ✅     | Nom de l'application         |
| `description`  | string | ❌     | Description de l'application |

#### Base de Données

| Variable                     | Type   | Défaut     | Description                                         |
| ---------------------------- | ------ | ---------- | --------------------------------------------------- |
| `database.provider`          | string | `postgres` | Type de BD : `postgres`, `mssql`, `mysql`, `sqlite` |
| `database.connection_string` | string | -          | Chaîne de connexion                                 |

#### API Backend

| Variable       | Type   | Défaut | Description                 |
| -------------- | ------ | ------ | --------------------------- |
| `api.port`     | number | `5000` | Port d'écoute du serveur C# |
| `api.version`  | string | `v1`   | Version de l'API            |
| `api.base_url` | string | `/api` | URL de base des endpoints   |

#### Frontend

| Variable             | Type   | Défaut    | Description                           |
| -------------------- | ------ | --------- | ------------------------------------- |
| `frontend.port`      | number | `3000`    | Port de développement                 |
| `frontend.framework` | string | `angular` | Framework : `angular`, `react`, `vue` |

#### Features (Services optionnels)

| Feature                  | Type    | Défaut  | Génère                               |
| ------------------------ | ------- | ------- | ------------------------------------ |
| `features.auth`          | boolean | `true`  | `AuthController`, `AuthService`, JWT |
| `features.email_service` | boolean | `false` | `EmailService`, envoi d'emails       |
| `features.file_service`  | boolean | `false` | `FileService`, uploads               |
| `features.notifications` | boolean | `false` | `NotificationService`, WebSockets    |
| `features.logging`       | boolean | `true`  | Logging centralisé                   |

## Section `models`

Voir `MODELS.md` pour la structure détaillée.

## Exemple Complet

```json
{
  "config": {
    "project_name": "ECommerce",
    "description": "E-commerce platform",
    "database": {
      "provider": "mssql"
    },
    "api": {
      "port": 8080,
      "version": "v2"
    },
    "frontend": {
      "port": 4200
    },
    "features": {
      "auth": true,
      "email_service": true,
      "file_service": true,
      "notifications": true,
      "logging": true
    }
  },
  "models": [
    {
      "name": "User",
      "properties": [
        {
          "name": "email",
          "type": "text",
          "required": true,
          "unique": true,
          "max_length": 255
        },
        {
          "name": "isActive",
          "type": "boolean",
          "default": true
        }
      ]
    },
    {
      "name": "Product",
      "properties": [
        {
          "name": "name",
          "type": "text",
          "required": true,
          "max_length": 200
        },
        {
          "name": "price",
          "type": "number",
          "required": true
        },
        {
          "name": "description",
          "type": "textarea",
          "nullable": true
        }
      ]
    }
  ]
}
```
