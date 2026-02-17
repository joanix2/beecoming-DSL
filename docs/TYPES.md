# Types et Conversions - UML Scaffolder

## Table de Conversion des Types

| Type JSON      | C# (ORM)       | TypeScript | SQL                | Composant Angular                     |
| -------------- | -------------- | ---------- | ------------------ | ------------------------------------- |
| `text`         | `string`       | `string`   | `VARCHAR(n)`       | `<app-edit-text-field>`               |
| `textarea`     | `string`       | `string`   | `TEXT`             | `<app-edit-textarea-field>`           |
| `integer`      | `int`          | `number`   | `INT`              | `<app-edit-number-field>`             |
| `number`       | `decimal`      | `number`   | `DECIMAL(18,2)`    | `<app-edit-number-field>`             |
| `select`       | `string`       | `string`   | `VARCHAR(50)`      | `<app-edit-select-field>`             |
| `multiselect`  | `List<string>` | `string[]` | `JSON`             | `<app-edit-multi-select-field>`       |
| `autocomplete` | `Guid`         | `string`   | `UNIQUEIDENTIFIER` | `<app-edit-async-autocomplete-field>` |
| `boolean`      | `bool`         | `boolean`  | `BIT`              | `<app-switch-button>`                 |
| `date`         | `DateOnly`     | `Date`     | `DATE`             | `<app-edit-date-field>`               |
| `datetime`     | `DateTime`     | `Date`     | `DATETIME2`        | `<app-edit-date-field>`               |
| `address`      | `Guid` (FK)    | `Address`  | `UNIQUEIDENTIFIER` | `<app-address>`                       |

## Propriétés Communes

```json
{
  "name": "propertyName",
  "type": "text|textarea|integer|number|select|multiselect|autocomplete|boolean|date|datetime|address",
  "required": true,
  "nullable": false,
  "unique": false,
  "max_length": 100,
  "min_value": 0,
  "max_value": 1000,
  "default": null,
  "label": "Label",
  "placeholder": "Placeholder",
  "help_text": "Help"
}
```

## Champs Automatiques (générés)

```csharp
[Key]
public Guid Id { get; set; }

public DateTime CreatedAt { get; set; }
public DateTime? UpdatedAt { get; set; }
public DateTime? DeletedAt { get; set; }
```
