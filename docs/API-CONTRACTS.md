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
| `declineInvitation` | invitationId ou token | Adresse authentifiée invitée | `member.invitation_declined` |
| `createTask` | projectId, title, description, priority, dueDate | Owner ou project manager | `task.created` |
| `updateTask` | taskId, champs modifiables | Owner/manager ou membre assigné | `task.updated` |
| `updateTaskStatus` | taskId, status | Owner/manager ou membre assigné | `task.status_changed` |
| `addComment` | taskId, body | Membre du projet non observateur | `comment.created` |
| `reassignTask` | taskId, assigneeIds | Owner ou project manager | `task.assignees_changed` |

### Contrats livrés au Jalon 3

`inviteMember`, `acceptInvitation`, `declineInvitation`, `leaveProject`, `createTask`, `reassignTask` et `updateTaskStatus` sont implémentés par Server Actions. Les invitations répétées renouvellent atomiquement la ligne active et invalident l'ancien lien. Le destinataire peut accepter ou refuser depuis son dashboard ou le lien email. Les jetons bruts ne sont jamais persistés et les refus d'autorisation sont ramenés à des codes génériques dans l'interface.

### Contrats du Jalon 4

`addTaskComment` valide 1 à 5000 caractères puis crée atomiquement le commentaire, l'activité et les notifications des autres membres. `openNotification` ne peut marquer comme lue qu'une notification du compte authentifié.

### Contrats du Jalon 5

`createEvaluation` accepte une tâche, un membre assigné, une note entière de 1 à 5 et un commentaire facultatif de 2000 caractères maximum. La RPC réserve l'action au propriétaire et au chef de projet, interdit l'auto-évaluation et crée atomiquement l'historique, l'audit et la notification de l'évalué.

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
