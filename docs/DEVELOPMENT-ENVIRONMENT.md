# Environnement de développement

## Environnements

| Environnement | Usage | Données |
| --- | --- | --- |
| Local | développement et tests rapides | Supabase local, données synthétiques |
| Preview | validation d'une pull request | projet Supabase staging |
| Production | utilisateurs réels | projet Supabase production |

La base de production n'est jamais utilisée pour développer ou tester manuellement.

## Prérequis

- Node.js LTS et npm ;
- Docker Desktop pour Supabase local ;
- Supabase CLI ;
- Git et GitHub ;
- navigateur récent.

## Variables d'environnement

Le fichier `.env.example` documente les noms sans secret :

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` est serveur uniquement. Les valeurs `NEXT_PUBLIC_*` sont publiques par conception et ne doivent jamais être utilisées pour autoriser une action.

## Base locale

Les migrations sont appliquées avec la Supabase CLI. Le seed local ne contient aucune donnée personnelle réelle. Une réinitialisation locale doit pouvoir être exécutée sans toucher aux environnements distants.

```text
supabase start
supabase db reset
supabase stop
```

Les commandes exactes seront ajoutées après installation de la CLI et validées sur Windows, macOS et Linux.

## Comptes de test

Les tests utilisent des comptes synthétiques distincts : propriétaire, chef de projet, membre, observateur et utilisateur extérieur. Aucun compte personnel ni mot de passe réel ne doit apparaître dans le dépôt, les fixtures ou les logs.

## Procédure de démarrage

1. Copier `.env.example` vers `.env.local`.
2. Démarrer Supabase local.
3. Appliquer les migrations et le seed.
4. Installer les dépendances avec `npm ci`.
5. Lancer `npm run dev`.
6. Vérifier `npm run lint`, `npm run typecheck` et les tests.

## Reset et incident local

Une base locale corrompue est recréée avec les migrations et le seed. Une erreur Preview est diagnostiquée dans les logs corrélés à la release ; aucune correction manuelle de production n'est faite sans migration versionnée.
