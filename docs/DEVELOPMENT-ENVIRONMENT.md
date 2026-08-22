# Environnement de développement

## Environnements

| Environnement | Usage | Données |
| --- | --- | --- |
| Local | développement et tests rapides | Supabase local, données synthétiques |
| Preview | validation d'une pull request | projet Supabase staging |
| Production | utilisateurs réels | projet Supabase production |

La base de production n'est jamais utilisée pour développer ou tester manuellement.

### État déployé au 21 août 2026

Le projet Vercel `taskflow` est connecté à GitHub et déploie les pull requests en Preview ainsi que `master` sur la cible Vercel Production. Les deux cibles utilisent temporairement le projet Supabase `taskflow-staging` (`ylaobnddeyhxnvfzkpsi`). Le déploiement de `master` constitue donc une release d'évaluation publique, pas encore une production avec données utilisateur réelles.

Avant l'ouverture à des utilisateurs réels, un projet Supabase production distinct doit être créé, migré, sauvegardé et configuré uniquement dans l'environnement Vercel Production. Les variables Preview doivent rester liées au staging.

### Email d'invitation

L'envoi métier utilise Resend exclusivement côté serveur. Configurer `RESEND_API_KEY` et `RESEND_FROM_EMAIL` dans Vercel Preview/Production et dans `.env.local` pour un test local réel. `RESEND_FROM_EMAIL` doit utiliser un expéditeur ou domaine vérifié. Si le fournisseur est absent ou indisponible, l'invitation reste visible dans le dashboard et l'owner reçoit un lien de secours ; aucune clé ni erreur fournisseur n'est exposée au navigateur.

## Prérequis

- Node.js LTS et Corepack ;
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

Après une modification de `supabase/config.toml` ou d'un template Auth, exécuter `pnpm supabase:stop` puis `pnpm supabase:start` : un simple reset de base ne recrée pas le service Auth.

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

1. Activer Corepack avec `corepack enable`.
2. Copier `.env.example` vers `.env.local`.
3. Démarrer Supabase local avec `pnpm supabase:start`.
4. Appliquer les migrations et le seed avec `pnpm supabase:reset`.
5. Installer les dépendances avec `pnpm install`.
6. Lancer `pnpm dev`.
7. Vérifier `pnpm lint`, `pnpm typecheck` et `pnpm test`.
8. Vérifier les politiques RLS avec `pnpm test:db`.

## Reset et incident local

Une base locale corrompue est recréée avec les migrations et le seed. Une erreur Preview est diagnostiquée dans les logs corrélés à la release ; aucune correction manuelle de production n'est faite sans migration versionnée.
