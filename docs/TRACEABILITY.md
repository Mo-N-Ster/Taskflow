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
| REQ-001, REQ-003, SEC-14, SEC-17 | actions Auth SSR, confirmation Mailpit, cookies de session et déconnexion | `e2e/auth-project.spec.ts` |
| SEC-16, SEC-24, STPA UCA-06 | pipeline GitHub Actions avec qualité, build, Supabase, RLS et E2E | exécution CI `32405554659` réussie |

### Dossier de clôture du Jalon 2

| Preuve | Référence | Résultat |
| --- | --- | --- |
| Implémentation identité et multi-tenant | commits `b357c5e` et `8f12904` | schéma, Auth SSR, projet persistant et tests E2E intégrés |
| Tests unitaires | `pnpm test` | 11 tests réussis |
| Tests d'isolation | `supabase/tests/001_identity_and_multitenancy_rls.sql` | 18 assertions réussies |
| Parcours navigateur | `e2e/auth-project.spec.ts` | 4 scénarios Playwright réussis |
| CI de référence | [GitHub Actions `32405554659`](https://github.com/Mo-N-Ster/Taskflow/actions/runs/32405554659) | pipeline complet réussi |
| Préparation des callbacks par environnement | [PR #6](https://github.com/Mo-N-Ster/Taskflow/pull/6) | Preview et CI réussies |
| Durcissement du logout | [PR #7](https://github.com/Mo-N-Ster/Taskflow/pull/7) | cookies supprimés et route protégée refusée après logout |
| Supabase distant | projet `taskflow-staging`, migration `20260820193000` | migration locale et distante synchronisée |
| Déploiement de validation | [TaskFlow sur Vercel](https://taskflow-eight-kappa.vercel.app) | accueil, login, inscription et parcours manuel accessibles |

**Décision du 21 août 2026 :** les preuves automatisées et manuelles satisfont le critère de sortie du Jalon 2. Les invitations et les données de tâches restent hors périmètre et ouvrent le Jalon 3.

### Dossier de clôture du Jalon 3

| Exigence | Implémentation | Preuve validée |
| --- | --- | --- |
| REQ-011, SEC-19 | invitations hashées, expirantes, liées à l'email et à usage unique | `002_jalon_3_tasks_and_invitations_rls.sql`, scénario Playwright multi-utilisateur |
| REQ-012, SEC-06 | observateur en lecture seule et contrôles de rôle côté serveur/RLS | tests négatifs pgTAP |
| REQ-020, REQ-021 | tâche persistante et assignations atomiques | `create_project_task`, UI projet et E2E |
| REQ-022 | changement de statut par membre assigné et journalisation | trigger `tasks_log_activity`, pgTAP et E2E |
| REQ-024 | avancement calculé depuis les tâches terminées | carte d'avancement projet et assertion SQL |
| REQ-011, SEC-19 | notification dashboard, email Resend, renouvellement et refus d'invitation | `003_invitation_notifications_and_reassignment.sql`, E2E multi-utilisateur |
| REQ-013, REQ-021 | départ, libération des assignations et réassignation atomique | triggers de départ, `set_task_assignees`, pgTAP et E2E |

| Preuve de livraison | Référence | Résultat |
| --- | --- | --- |
| Pull request | [PR #9](https://github.com/Mo-N-Ster/Taskflow/pull/9) | fusionnée dans `master` au commit `c1959f9` |
| CI de clôture | [GitHub Actions `32576654423`](https://github.com/Mo-N-Ster/Taskflow/actions/runs/32576654423) | qualité, migrations, 54 assertions RLS et 5 scénarios E2E réussis |
| Supabase staging | migrations jusqu'à `20260822170000` | schéma distant synchronisé |
| Validation manuelle | invitation vers une adresse réelle | email reçu, notification dashboard visible et acceptation réussie |
| Production | [TaskFlow sur Vercel](https://taskflow-eight-kappa.vercel.app) | déploiement `Ready` du commit de fusion |

**Décision du 22 août 2026 :** le parcours vertical projet/tâche satisfait son critère de sortie. Le Jalon 4 peut commencer sur une branche dédiée.

## Definition of Done

- exigence et critère d'acceptation identifiés ;
- menace et contrôle sécurité évalués ;
- validation serveur et données vérifiées ;
- tests ajoutés ou preuve manuelle explicite ;
- logs et métriques utiles ajoutés sans données sensibles ;
- documentation et ADR mis à jour ;
- CI verte et Preview contrôlée ;
- rollback connu avant production.
