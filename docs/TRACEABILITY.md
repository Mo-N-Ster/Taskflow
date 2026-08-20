# Traçabilité et preuves

## Chaîne de traçabilité

```text
Besoin / risque -> REQ ou SEC -> issue -> branche -> pull request
-> test / revue -> artefact CI -> release -> métrique / incident
```

Une fonctionnalité n'est complète que lorsque cette chaîne est consultable. Les décisions structurantes sont enregistrées dans un ADR avec contexte, options, décision, conséquences et date.

## Matrice initiale

| Domaine | Références | Preuve attendue | Responsable de validation |
| --- | --- | --- | --- |
| Authentification | REQ-001 à 003, SEC-03 à 08, SEC-14, SEC-17, STPA UCA-02 | tests login, expiration, confirmation et cookies | responsable backend |
| Multi-tenant | REQ-010 à 013, SEC-04 et 06, STPA UCA-01 | tests avec deux utilisateurs et rôles opposés | responsable données |
| Tâches | REQ-020 à 024 | tests unitaires, intégration et preuve UI | responsable produit |
| Évaluation | REQ-030 à 031, STPA L6 | test de rôle, visibilité et audit | responsable produit + sécurité |
| Fichiers | SEC-09 à 11, SEC-20, STPA UCA-03 | tests taille/type/quota et téléchargement privé | responsable backend |
| Webhooks | SEC-15, STPA UCA-04 | signatures valides, invalides, replay et idempotence | responsable intégration |
| Pipeline | SEC-16, SEC-24, STPA UCA-06 | logs CI, artefact et déploiement contrôlé | responsable DevOps |
| Exploitation | SEC-18, SEC-25, STPA UCA-05 | backup restore, dashboard, alerte testée, runbook | responsable opérations |
| Conformité | SEC-23 | revue RGPD, fournisseurs, licences et politiques | propriétaire du produit |

## Preuves du Jalon 2

| Références | Implémentation | Preuve automatisée |
| --- | --- | --- |
| REQ-002 | trigger de création de `profiles`, lecture limitée à soi-même ou aux membres d'un projet commun | `001_identity_and_multitenancy_rls.sql` |
| REQ-010, REQ-011 | `projects`, `project_members`, membership propriétaire automatique | `001_identity_and_multitenancy_rls.sql` |
| REQ-012 | rôle `observer` en lecture seule | `001_identity_and_multitenancy_rls.sql` |
| REQ-013 | révocation d'un membre et protection du propriétaire | `001_identity_and_multitenancy_rls.sql` |
| SEC-04, SEC-06, STPA UCA-01 | RLS et fonctions privées anti-récursion | test croisé de deux propriétaires, deux projets et un observateur |
| REQ-001, REQ-003, SEC-14, SEC-17 | actions Auth SSR, confirmation Mailpit et cookies de session | `e2e/auth-project.spec.ts` |

## Definition of Done

- exigence et critère d'acceptation identifiés ;
- menace et contrôle sécurité évalués ;
- validation serveur et données vérifiées ;
- tests ajoutés ou preuve manuelle explicite ;
- logs et métriques utiles ajoutés sans données sensibles ;
- documentation et ADR mis à jour ;
- CI verte et Preview contrôlée ;
- rollback connu avant production.
