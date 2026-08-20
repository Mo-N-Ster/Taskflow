# Données et sécurité

## Entités métier

```text
auth.users 1---1 profiles
profiles   1---N project_members N---1 projects
projects   1---N milestones
projects   1---N tasks
tasks      1---N task_assignees N---1 profiles
tasks      1---N comments
tasks      1---N evaluations
```

## Tables prévues

| Table | Rôle | Champs principaux |
| --- | --- | --- |
| `profiles` | Profil public applicatif | `id`, `display_name`, `avatar_url`, `created_at` |
| `projects` | Projet et paramètres | `id`, `owner_id`, `name`, `description`, `visibility`, `start_date`, `end_date` |
| `project_members` | Appartenance et rôle | `project_id`, `user_id`, `role`, `joined_at` |
| `milestones` | Étape de projet | `id`, `project_id`, `name`, `due_date`, `status` |
| `tasks` | Unité de travail | `id`, `project_id`, `milestone_id`, `title`, `status`, `priority`, `due_date` |
| `task_assignees` | Attribution multiple | `task_id`, `user_id` |
| `comments` | Discussion contextualisée | `id`, `task_id`, `author_id`, `body`, `created_at` |
| `evaluations` | Évaluation d'un livrable | `id`, `task_id`, `reviewer_id`, `member_id`, `score`, `comment` |
| `activity_events` | Historique fonctionnel | `id`, `project_id`, `actor_id`, `event_type`, `payload`, `created_at` |

Les tables de session, invitation et reset sont gérées par le fournisseur d'identité lorsque c'est possible. Elles doivent néanmoins respecter des dates d'expiration, une révocation et une consommation unique.

## Règles d'intégrité

- Les identifiants sont des UUID et les dates sont stockées en UTC.
- Les rôles sont limités à `owner`, `project_manager`, `member` et `observer`.
- Une tâche, un jalon, un commentaire ou une évaluation appartient toujours à un projet identifiable.
- Les suppressions importantes sont préférées en archivage lorsque l'historique doit rester lisible.
- Les contraintes SQL complètent la validation TypeScript ; elles ne sont pas remplacées par celle-ci.

## Politique RLS

Chaque table métier doit avoir RLS activé. La politique minimale est : un utilisateur peut lire une ressource si son identifiant figure dans `project_members` ou s'il est propriétaire du projet. Les mutations sont ensuite restreintes par rôle :

| Action | Propriétaire | Chef de projet | Membre | Observateur |
| --- | --- | --- | --- | --- |
| Lire le projet | Oui | Oui | Oui | Oui |
| Administrer les membres | Oui | Non | Non | Non |
| Créer une tâche | Oui | Oui | Selon décision MVP | Non |
| Modifier une tâche assignée | Oui | Oui | Oui | Non |
| Noter un livrable | Oui | Oui | Non | Non |

La matrice sera traduite en politiques SQL et testée avec des utilisateurs de rôles différents avant l'ouverture de données réelles.

Les tests RLS doivent couvrir les lectures, insertions, mises à jour et suppressions pour chaque rôle, ainsi que les cas de projet supprimé, membre révoqué et session expirée. Une policy permissive par défaut est interdite.

## Données sensibles

Les secrets, tokens de session et clés privées ne sont jamais stockés dans les tables métier ni dans Git. Les données d'évaluation demandent une politique de visibilité explicite avant l'implémentation du profil public.
