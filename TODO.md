# TODO - UML Scaffolder / MDE Generator

## Phase 1 : Définition du Système de Types

- [ ] Définir les types primitifs supportés (string, integer, number, boolean, date, datetime, uuid, etc.)
- [ ] Créer la table de mapping vers C# (string -> string, integer -> int, number -> decimal, etc.)
- [ ] Créer la table de mapping vers TypeScript (string -> string, integer -> number, etc.)
- [ ] Créer la table de mapping vers Python (string -> str, integer -> int, etc.)
- [ ] Documenter les types dans `TYPES.md`

## Phase 2 : Format JSON de Spécification

- [ ] Définir le schéma JSON pour les variables d'environnement
  - [ ] `project_name` (requis)
  - [ ] `description` (optionnel)
  - [ ] Autres variables globales (database, ports, etc.)
- [ ] Définir le schéma JSON pour les modèles
  - [ ] `name` : nom du modèle
  - [ ] `properties` : liste des propriétés
    - [ ] `name` : nom de la propriété
    - [ ] `type` : type de la propriété
    - [ ] `nullable` : booléen (défaut: false)
    - [ ] `required` : booléen (défaut: true)
    - [ ] `unique` : booléen (défaut: false)
    - [ ] `max_length` : nombre (optionnel, pour strings)
- [ ] Créer un fichier exemple `spec.example.json`
- [ ] Créer un schéma de validation JSON Schema

## Phase 3 : Backend - Génération ORM (C#/Entity Framework)

- [ ] Créer le template Jinja2 pour les Models
  - [ ] Template pour un seul model (`_ModelName.cs.j2`)
  - [ ] Inclure les annotations `[Key]`, `[Required]`, `[MaxLength]`
  - [ ] Ajouter les champs automatiques : `Id`, `CreatedAt`, `UpdatedAt`, `DeletedAt`
- [ ] Mettre à jour `ApplicationDbContext.cs.j2`
  - [ ] Générer automatiquement les `DbSet<Model>` pour chaque modèle
  - [ ] Ajouter les query filters pour le soft delete

## Phase 4 : Backend - Génération DTOs

- [ ] Créer le template Jinja2 pour les DTOs (`_ModelDTO.cs.j2`)
  - [ ] Inclure uniquement les propriétés du modèle (pas les champs auto)
  - [ ] Conserver les validations (`[Required]`, `[MaxLength]`)

## Phase 5 : Backend - Génération Controllers CRUD

- [ ] Créer le template Jinja2 pour les Controllers (`_ModelController.cs.j2`)
  - [ ] Endpoint GET /api/Model (liste avec soft delete filter)
  - [ ] Endpoint GET /api/Model/{id} (détail)
  - [ ] Endpoint POST /api/Model (création)
  - [ ] Endpoint PUT /api/Model/{id} (mise à jour)
  - [ ] Endpoint DELETE /api/Model/{id} (soft delete)
- [ ] Ajouter la gestion des erreurs standard

## Phase 6 : Frontend - Génération Services API

- [ ] Créer le template Jinja2 pour les services (`_ModelService.ts.j2`)
  - [ ] Méthode `getAll()`
  - [ ] Méthode `getById(id)`
  - [ ] Méthode `create(data)`
  - [ ] Méthode `update(id, data)`
  - [ ] Méthode `delete(id)`
- [ ] Utiliser axios et typage TypeScript

## Phase 7 : Frontend - Génération Interfaces TypeScript

- [ ] Créer le template Jinja2 pour les types (`_Model.ts.j2`)
  - [ ] Interface avec tous les champs (y compris id, createdAt, etc.)
  - [ ] Typage nullable (`field?: type`)

## Phase 8 : Frontend - Génération DataGrids

- [ ] Créer le template Jinja2 pour les grilles (`_ModelGrid.tsx.j2`)
  - [ ] Colonnes automatiques pour chaque propriété
  - [ ] Typage des colonnes (string, number, boolean, date)
  - [ ] Actions : edit, delete
  - [ ] Pagination et tri

## Phase 9 : Frontend - Génération Formulaires

- [ ] Créer le template Jinja2 pour les forms (`_ModelForm.tsx.j2`)
  - [ ] Input type adapté au type de propriété (text, number, checkbox, date)
  - [ ] Validation via react-hook-form
  - [ ] Gestion des champs requis
  - [ ] MaxLength pour les strings
  - [ ] Textarea pour les longs textes (max_length > 100)

## Phase 10 : Services Backend Additionnels

- [ ] Template pour EmailService (si nécessaire)
- [ ] Template pour FileService (si nécessaire)
- [ ] Template pour AuthService
- [ ] Template pour NotificationService

## Phase 11 : Macros Jinja2

- [ ] Créer `macros.j2` avec les fonctions de conversion de types
- [ ] Macro `csharp_type(property_type)`
- [ ] Macro `typescript_type(property_type)`
- [ ] Macro `python_type(property_type)`
- [ ] Macro pour génération de CRUD complet

## Phase 12 : Service Python de Génération

- [ ] Refactorer `application_generator_service.py` pour qu'il soit template-driven
- [ ] Parsing du dossier `templates/`
- [ ] Identification des templates "per-model" (préfixe `_`)
- [ ] Rendu des templates avec contexte (project_name + models)
- [ ] Génération automatique d'un fichier par modèle

## Phase 13 : Tests & Documentation

- [ ] Créer des tests avec différents types de modèles
- [ ] Documenter l'usage dans `README.md`
- [ ] Créer des exemples de spécifications JSON
- [ ] Ajouter des diagrammes d'architecture

---

## Anciennes tâches (à trier)

- [ ] clean back
- [ ] clean front
- [ ] rechercher les types
- [ ] scaffolding
- [ ] ajout LLMs
- [ ] créer un AGENTS.md / claude.md
- [ ] skill
- [ ] hooks
- [ ] agents
- [ ] Commands Customisés
