# Stratégie de tests

## Outils retenus

- Vitest pour les fonctions métier et validations ;
- Testing Library pour les composants et interactions ;
- Playwright pour les parcours end-to-end ;
- Supabase local pour les migrations et tests RLS ;
- GitHub Actions pour l'exécution sur chaque pull request.

Les tests RLS sont exécutés avec `pnpm test:db` après `pnpm supabase:reset`. Le fichier `supabase/tests/001_identity_and_multitenancy_rls.sql` couvre 18 assertions déterministes liées à REQ-002, REQ-010 à 013, SEC-04 et SEC-06.

Le scénario `e2e/auth-project.spec.ts` utilise une identité synthétique unique et Mailpit. Il vérifie l'inscription, la confirmation email, la session protégée, la création persistée d'un projet, la suppression des cookies lors de la déconnexion, le refus d'un nouvel accès au dashboard et la reconnexion. Il est exécuté dans le job CI Supabase après les tests RLS.

## Baseline validée au Jalon 2

Au 21 août 2026, la baseline automatisée comprend 11 tests unitaires, 18 assertions RLS et 4 scénarios Playwright. La CI exécute le lint, le typecheck, les tests unitaires, l'audit des dépendances, le build, la réinitialisation Supabase, les tests RLS et le parcours E2E avant validation d'une pull request.

## Pyramide de tests

| Niveau | Cible | Obligatoire avant fusion |
| --- | --- | --- |
| Unitaire | schémas Zod, calcul d'avancement, règles pures | Oui |
| Composant | formulaires, états erreur/chargement, permissions visibles | Oui pour les écrans livrés |
| Intégration | Server Actions + Supabase local + RLS | Oui pour chaque mutation |
| E2E | inscription, projet, invitation, tâche, statut | Oui pour le vertical slice |
| Smoke Preview | application démarrée, login de test, route principale | Oui avant production |

## Cas obligatoires

- login invalide avec message uniforme ;
- confirmation email et session non confirmée ;
- expiration d'invitation et de session ;
- isolation de deux projets ;
- refus de mutation pour observateur ;
- refus de modification d'une tâche non assignée ;
- création de projet et membership owner ;
- création, attribution et changement de statut ;
- commentaire autorisé ;
- erreur serveur sans stack trace en production.

## Règle de qualité

Il n'y a pas de seuil artificiel de couverture au démarrage. En revanche, toutes les règles d'autorisation critiques et tout le vertical slice doivent être testés. Toute exception est documentée dans la pull request avec un ticket de suivi.

## Données de test

Les fixtures sont déterministes, synthétiques et réinitialisables. Les tests ne partagent pas d'état implicite et ne dépendent pas de données de production. Les tests RLS utilisent au minimum les cinq identités de [l'environnement de développement](DEVELOPMENT-ENVIRONMENT.md).

## Preuves

Chaque test est relié à une exigence `REQ-*`, un contrôle `SEC-*` ou une contrainte STPA dans [la matrice de traçabilité](TRACEABILITY.md).
