# Contribuer à TaskFlow

## Avant de coder

1. Relier le travail à une exigence, un risque ou un contrôle.
2. Définir le périmètre, les données touchées, les permissions et le test attendu.
3. Créer une branche courte : `feature/<nom>` ou `fix/<nom>`.
4. Vérifier qu'aucun secret ou donnée personnelle réelle n'est utilisé.

## Structure

```text
src/app          routes et pages
src/components   composants UI réutilisables
src/features     modules métier
src/lib          clients, validation et autorisation
src/types        types partagés
supabase         migrations et seed
docs             documentation, ADR et runbooks
```

## Convention de code

- TypeScript strict et noms explicites ;
- Zod pour valider les entrées ;
- Server Actions pour les mutations internes ;
- RLS et contrôle serveur pour l'autorisation ;
- aucun `console.log` de debug ou secret ;
- erreurs génériques côté client et logs corrélés côté serveur ;
- une migration versionnée par changement de schéma ;
- commentaires de code uniquement lorsqu'ils expliquent une décision non évidente.

## Pull request

La description doit contenir : exigence ou contrôle couvert, comportement ajouté, migration éventuelle, risques sécurité/conformité, tests exécutés, preuve Preview si l'interface change et plan de rollback si la modification touche les données ou la production.

La fusion exige une CI verte et une revue. Les changements de permissions, d'authentification, de RLS, de secrets ou de données personnelles exigent une seconde revue.

## Commits

Utiliser des messages courts et explicites, par exemple :

```text
feat(tasks): add status transition
fix(auth): reject expired confirmation token
docs(security): document webhook signature policy
```

## Definition of Done

Voir la [Definition of Done](TRACEABILITY.md). Une fonctionnalité n'est pas terminée si elle fonctionne seulement dans l'interface : elle doit être autorisée côté serveur, testée, observable et documentée.
