# Exigences fonctionnelles

Les exigences sont identifiées pour permettre la traçabilité entre besoin, implémentation et test.

## Comptes et accès

| ID | Exigence | Critère d'acceptation |
| --- | --- | --- |
| REQ-001 | Un visiteur peut créer un compte et se connecter. | Une session valide est créée et une session invalide est refusée avec un message compréhensible. |
| REQ-002 | Un utilisateur peut consulter son profil. | Le profil affiche son identité, ses projets accessibles et son activité autorisée. |
| REQ-003 | Un utilisateur peut se déconnecter. | La session est invalidée et les écrans privés deviennent inaccessibles. |

### Décisions d'authentification MVP

- email et mot de passe avec confirmation email obligatoire ;
- reset password via Supabase Auth ;
- OAuth, MFA et changement d'identité reportés après le MVP ;
- réponse unique `Email ou mot de passe incorrect` pour un login invalide ;
- session vérifiée côté serveur pour chaque page et mutation protégée ;
- invitations et liens de reset à usage unique avec expiration documentée ;
- rate limiting d'abord via les protections Supabase, puis Cloudflare Turnstile ou Upstash uniquement si les métriques le justifient.

## Projets et membres

| ID | Exigence | Critère d'acceptation |
| --- | --- | --- |
| REQ-010 | Le propriétaire crée un projet public ou privé. | Le projet apparaît dans son espace et sa visibilité est persistée. |
| REQ-011 | Le propriétaire invite un membre et lui attribue un rôle. | Le membre voit le projet selon son invitation et ses droits correspondent au rôle. |
| REQ-012 | Un observateur dispose d'un accès en lecture seule. | Toute action de mutation est masquée dans l'interface et refusée côté serveur. |
| REQ-013 | Un membre peut quitter un projet. | Son accès est révoqué sans supprimer l'historique du projet. |

### Matrice des permissions MVP

| Action | Propriétaire | Chef de projet | Membre | Observateur |
| --- | --- | --- | --- | --- |
| Lire le projet | Oui | Oui | Oui | Oui |
| Modifier le projet | Oui | Oui, champs opérationnels | Non | Non |
| Gérer les membres | Oui | Non | Non | Non |
| Créer une tâche | Oui | Oui | Non | Non |
| Modifier toutes les tâches | Oui | Oui | Non | Non |
| Modifier une tâche assignée | Oui | Oui | Oui | Non |
| Modifier son statut | Oui | Oui | Oui | Non |
| Commenter | Oui | Oui | Oui | Non |
| Supprimer une tâche | Oui | Oui | Non | Non |
| Supprimer le projet | Oui | Non | Non | Non |

Un propriétaire ne peut pas quitter son projet sans transférer la propriété. Le départ ou la révocation d'un membre conserve l'historique et désactive ses affectations futures.

## Tâches

| ID | Exigence | Critère d'acceptation |
| --- | --- | --- |
| REQ-020 | Un chef de projet crée et modifie une tâche. | Le titre, la description, le statut, la priorité et l'échéance sont persistés. |
| REQ-021 | Une tâche peut être attribuée à un ou plusieurs membres. | Seuls les membres du projet sont sélectionnables. |
| REQ-022 | Un membre met à jour une tâche qui lui est attribuée. | Le statut et les champs autorisés sont modifiables ; l'action est journalisée. |
| REQ-023 | Un utilisateur autorisé commente une tâche. | Le commentaire est visible selon les droits du projet et possède une date et un auteur. |
| REQ-024 | Le tableau de bord affiche l'avancement. | Le pourcentage est calculé à partir des tâches terminées et le calcul est cohérent avec la liste. |

## Évaluation, version initiale

| ID | Exigence | Critère d'acceptation |
| --- | --- | --- |
| REQ-030 | Un chef de projet peut noter un livrable. | La note est comprise entre 1 et 5, liée à une tâche et accompagnée d'un commentaire optionnel. |
| REQ-031 | L'utilisateur consulte son historique autorisé. | Les évaluations affichées sont datées, contextualisées et respectent la politique de visibilité. |

## Règles transverses

- Toute mutation est validée côté serveur ; l'interface ne constitue jamais une frontière de sécurité.
- Les entrées utilisateur sont validées par schéma avant écriture.
- Les dates sont stockées de façon non ambiguë et affichées dans le fuseau de l'utilisateur.
- Les erreurs ne révèlent ni secrets, ni détails SQL, ni données d'un autre projet.
- Chaque exigence livrée possède au moins un test ou une preuve manuelle documentée.
- Les exigences du MVP sont livrées dans l'ordre décrit dans [les parcours utilisateurs](USER-FLOWS.md).
