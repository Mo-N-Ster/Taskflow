# Analyse de sécurité STPA

STPA (System-Theoretic Process Analysis) est appliquée pour identifier les contrôles dangereux, leurs conditions et les contraintes de sécurité avant l'implémentation des parcours sensibles.

## Frontière du système

Le système comprend navigateur/PWA, Next.js, Supabase Auth, PostgreSQL/RLS, Storage, services email/webhooks, Vercel, observabilité et opérateurs. Les utilisateurs, fournisseurs et administrateurs sont des contrôleurs ou acteurs externes.

## Contrôleurs et contraintes

| Contrôleur | Action contrôlée | Contrainte de sécurité |
| --- | --- | --- |
| Authentification | créer session, confirmer email, reset | ne jamais révéler l'existence d'un compte ; session valide seulement après contrôles |
| API/Server Action | lire ou muter une ressource | session, rôle, appartenance et validation doivent être vérifiés ensemble |
| PostgreSQL/RLS | autoriser une ligne | aucune lecture ou mutation inter-projets |
| Storage | déposer ou télécharger un fichier | taille, type, quota, projet et droit contrôlés |
| Webhook | accepter un événement externe | signature valide, timestamp acceptable, idempotence |
| CI/CD | publier une release | uniquement artefact testé et source autorisée |
| Monitoring | déclencher une intervention | signal fiable, gravité et runbook associés |

## Unsafe Control Actions initiales

| UCA | Situation dangereuse | Contrôle requis |
| --- | --- | --- |
| UCA-01 | Une tâche privée est renvoyée à un utilisateur non membre | RLS + vérification serveur + test d'isolation |
| UCA-02 | Une mutation est acceptée après expiration de session | vérifier session au moment de l'action |
| UCA-03 | Un upload malveillant est servi comme document sûr | MIME, signature, taille, stockage privé et analyse adaptée |
| UCA-04 | Un webhook rejoué crée deux évaluations ou paiements | signature, timestamp et clé d'idempotence |
| UCA-05 | Une alerte critique est perdue dans le bruit | seuils, déduplication, escalade et test périodique |
| UCA-06 | Une release non validée atteint la production | gates CI, approbation et rollback |
| UCA-07 | Un log révèle un secret ou une donnée personnelle | filtrage, revue et test de non-divulgation |

## Scénarios de perte

- L1 : divulgation de données entre tenants.
- L2 : modification non autorisée d'une tâche ou d'une évaluation.
- L3 : perte ou corruption de données après incident.
- L4 : indisponibilité non détectée d'un service critique.
- L5 : compromission par secret, webhook ou fichier uploadé.
- L6 : décision produit injuste basée sur une évaluation non contextualisée.

## Preuves STPA exigées

Chaque contrôle doit être relié à une exigence, une implémentation, un test négatif ou une preuve d'exploitation dans [la matrice de traçabilité](TRACEABILITY.md). L'analyse est revue à chaque nouvelle intégration externe, changement de droits, migration de données ou incident significatif.
