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

## Socle implémenté au Jalon 2

La migration `20260820193000_initial_identity_and_multitenancy.sql` crée `profiles`, `projects` et `project_members`. Un trigger crée le profil lors de l'inscription Supabase et un second crée atomiquement le membership `owner` avec chaque projet.

La valeur `visibility = public` est persistée, mais elle n'accorde pas encore de lecture anonyme : tant que le contrat de publication publique n'est pas défini, seuls les membres peuvent lire un projet. Le transfert de propriété est également bloqué jusqu'à l'ajout d'un workflow atomique dédié.

Les tables de session, invitation et reset sont gérées par le fournisseur d'identité lorsque c'est possible. Elles doivent néanmoins respecter des dates d'expiration, une révocation et une consommation unique.

## Tranche verticale du Jalon 3

La migration `20260821090000_jalon_3_vertical_slice.sql` ajoute `project_invitations`, `tasks`, `task_assignees` et `activity_events`. Les invitations conservent uniquement un hash SHA-256 du jeton, expirent après sept jours dans l'application et ne peuvent être acceptées qu'une fois par un compte dont l'email authentifié correspond.

La fonction `create_project_task` crée atomiquement la tâche et ses assignations. Les triggers contrôlent que chaque personne assignée est membre actif non observateur et journalisent la création ainsi que les changements de statut. Un membre assigné peut uniquement changer le statut ; les champs de pilotage restent réservés au propriétaire et au chef de projet.

La migration `20260822130000_invitation_notifications_and_reassignment.sql` rend la réinvitation idempotente, expose les invitations en attente uniquement au compte correspondant et ajoute acceptation/refus depuis le dashboard. Le départ d'un membre supprime automatiquement ses assignations sans supprimer les tâches ; owner et chef de projet peuvent ensuite les réassigner atomiquement.

## Collaboration du Jalon 4

La migration `20260822190000_jalon_4_collaboration_activity.sql` ajoute des commentaires immuables et des notifications in-app privées. Le contenu reste uniquement dans `comments` ; les événements et notifications ne recopient pas le texte. Les membres commentent, les observateurs lisent seulement et chaque notification appartient exclusivement à son destinataire.

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

La matrice projets, memberships, invitations, tâches, assignations, commentaires, notifications et événements est traduite en politiques SQL. Les commentaires suivent le cycle de vie de leur tâche.

Les tests RLS doivent couvrir les lectures, insertions, mises à jour et suppressions pour chaque rôle, ainsi que les cas de projet supprimé, membre révoqué et session expirée. Une policy permissive par défaut est interdite.

## Données sensibles

Les secrets, tokens de session et clés privées ne sont jamais stockés dans les tables métier ni dans Git. Les données d'évaluation demandent une politique de visibilité explicite avant l'implémentation du profil public.
