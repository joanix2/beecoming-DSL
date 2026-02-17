# Format JSON des Modèles - UML Scaffolder

## Structure d'une Spécification

```json
{
  "project_name": "MyApp",
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
          "name": "firstName",
          "type": "text",
          "required": true,
          "max_length": 100
        },
        {
          "name": "isActive",
          "type": "boolean",
          "default": true
        }
      ]
    },
    {
      "name": "Task",
      "properties": [
        {
          "name": "title",
          "type": "text",
          "required": true,
          "max_length": 200
        },
        {
          "name": "description",
          "type": "textarea",
          "nullable": true
        },
        {
          "name": "priority",
          "type": "number",
          "required": true,
          "min_value": 1,
          "max_value": 5
        },
        {
          "name": "status",
          "type": "select",
          "required": true,
          "options": ["todo", "in_progress", "done"]
        }
      ]
    }
  ]
}
```

## Propriétés Disponibles

| Propriété     | Type    | Défaut  | Description                                      |
| ------------- | ------- | ------- | ------------------------------------------------ |
| `name`        | string  | -       | Nom unique de la propriété (en PascalCase)       |
| `type`        | string  | -       | Type de données (voir TYPES.md)                  |
| `required`    | boolean | `true`  | Champ obligatoire                                |
| `nullable`    | boolean | `false` | Permet la valeur `null`                          |
| `unique`      | boolean | `false` | Valeur unique dans la BD                         |
| `max_length`  | number  | -       | Longueur max (pour `text`)                       |
| `min_value`   | number  | -       | Valeur min (pour `number`)                       |
| `max_value`   | number  | -       | Valeur max (pour `number`)                       |
| `default`     | any     | -       | Valeur par défaut                                |
| `label`       | string  | -       | Label pour le formulaire                         |
| `placeholder` | string  | -       | Placeholder pour le formulaire                   |
| `help_text`   | string  | -       | Texte d'aide                                     |
| `options`     | array   | -       | Valeurs possibles (pour `select`, `multiselect`) |

## Champs Automatiques (générés)

Chaque modèle génère automatiquement :

```csharp
[Key]
public Guid Id { get; set; }

public DateTime CreatedAt { get; set; }
public DateTime? UpdatedAt { get; set; }
public DateTime? DeletedAt { get; set; } // soft delete
```

**Ne pas les inclure dans la spécification JSON.**
