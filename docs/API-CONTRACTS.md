# Contrats applicatifs MVP

Les mutations internes utilisent des Server Actions typées. Les Route Handlers sont réservés aux webhooks et intégrations externes. Toutes les entrées sont validées avec Zod, puis l'autorisation est vérifiée côté serveur et par RLS.

## Convention

Chaque action retourne une enveloppe discriminée :

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };
```

Les messages retournés au navigateur sont génériques. Les logs utilisent `request_id` et un code interne sans secret ni contenu privé.

## Actions MVP

| Action | Entrée principale | Autorisation | Événement |
| --- | --- | --- | --- |
| `register` | email, password, displayName | Public, rate limited | `auth.registered` |
| `login` | email, password | Public, rate limited | `auth.login_succeeded` ou `auth.login_failed` |
| `logout` | aucune | Session valide | `auth.logout` |
| `createProject` | name, description, visibility, dates | Utilisateur confirmé | `project.created` |
| `inviteMember` | projectId, email, role | Owner uniquement | `member.invited` |
| `acceptInvitation` | invitationToken | Token valide et non expiré | `member.joined` |
| `leaveProject` | projectId | Membre, sauf owner | `member.left` |
| `createTask` | projectId, title, description, priority, dueDate | Owner ou project manager | `task.created` |
| `updateTask` | taskId, champs modifiables | Owner/manager ou membre assigné | `task.updated` |
| `updateTaskStatus` | taskId, status | Owner/manager ou membre assigné | `task.status_changed` |
| `addComment` | taskId, body | Membre du projet non observateur | `comment.created` |

### Contrats livrés au Jalon 3

`inviteMember`, `acceptInvitation`, `createTask` et `updateTaskStatus` sont implémentés par Server Actions. L'acceptation et la création atomique de tâche utilisent respectivement les fonctions PostgreSQL `accept_project_invitation` et `create_project_task`. Les jetons bruts ne sont jamais persistés et les refus d'autorisation sont ramenés à des codes génériques dans l'interface.

## Règles de validation

| Champ | Règle MVP |
| --- | --- |
| Email | format valide, normalisé en minuscules |
| Mot de passe | exigences Supabase, jamais journalisé |
| Nom projet | obligatoire, 1 à 120 caractères |
| Description | facultative, 0 à 2000 caractères |
| Titre tâche | obligatoire, 1 à 160 caractères |
| Commentaire | obligatoire, 1 à 5000 caractères |
| Priorité | `low`, `medium`, `high` |
| Statut | `todo`, `in_progress`, `in_review`, `done` |
| Date | ISO valide, cohérente avec les règles métier |

## Erreurs standard

`VALIDATION_ERROR`, `AUTH_REQUIRED`, `AUTH_INVALID`, `EMAIL_NOT_CONFIRMED`, `PROJECT_NOT_FOUND`, `PROJECT_ACCESS_DENIED`, `ROLE_FORBIDDEN`, `TASK_NOT_FOUND`, `INVITATION_EXPIRED`, `RATE_LIMITED`, `INTERNAL_ERROR`.

Une erreur `INTERNAL_ERROR` ne contient jamais de stack trace en production.
