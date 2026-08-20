# Processus DevOps TaskFlow

Ce document décrit le parcours d'apprentissage et la chaîne de livraison de TaskFlow. Chaque étape doit produire un résultat observable et une preuve de validation.

## Principes de travail

1. Une fonctionnalité commence par un besoin utilisateur et un critère d'acceptation.
2. Toute modification passe par une branche et une pull request.
3. La CI doit être verte avant la fusion dans `dev` ou la branche principale.
4. Les secrets ne sont jamais commités ; seul `.env.example` est versionné.
5. Les migrations de base de données sont versionnées avec le code.
6. Une décision technique importante est documentée avec son contexte et ses conséquences.
7. Une fonctionnalité n'est livrée que si sa sécurité, sa traçabilité et son exploitation sont vérifiables.

## Flux Git

- `master` : branche principale actuelle, déployée sur la cible Vercel Production.
- `dev` : branche d'intégration cible, à créer lorsque le rythme du Jalon 3 le justifiera.
- `feature/<nom>` : développement d'une fonctionnalité.
- `fix/<nom>` : correction ciblée.
- `docs/<nom>` : documentation et décisions sans changement fonctionnel.

Flux appliqué jusqu'à la clôture du Jalon 2 :

```text
feature/* | fix/* | docs/* -> Pull Request -> Preview -> validation -> master
```

Flux cible lorsque `dev` sera créée :

```text
feature/* -> Pull Request -> dev -> validation produit -> master -> production
```

La protection de `master` doit imposer au minimum une CI verte et une revue avant fusion. Un éventuel renommage de `master` en `main` sera une opération dédiée afin de mettre à jour GitHub, Vercel, la CI et les clones locaux sans ambiguïté.

## CI et CD

Le workflow `.github/workflows/ci.yml` s'exécute sur les pushs vers `master`, `main` et `dev`, ainsi que sur les pull requests. Il réalise :

- installation reproductible avec `pnpm install --frozen-lockfile` ;
- lint avec `pnpm lint` ;
- build de production avec `pnpm build` ;
- tests unitaires et d'intégration dès qu'ils existent ;
- lint et vérification TypeScript ;
- build de production ;
- scan de secrets et audit des dépendances ;
- production d'un artefact identifié par commit.

Le déploiement suit la chaîne : **tests -> vérifications sécurité -> build -> Preview -> validation -> production**. Une fusion vers la branche principale ne doit pas contourner les contrôles. Le déploiement de production est automatique uniquement après les protections de branche, les validations obligatoires et l'approbation définie par le niveau de risque.

Le pipeline minimal obligatoire est : `pnpm install --frozen-lockfile` -> lint -> typecheck -> tests unitaires/intégration -> audit dépendances -> scan secrets -> build. Les tests E2E, les tests RLS, le smoke test Preview et le déploiement production sont ajoutés dès que Supabase et Vercel sont connectés. Les outils et preuves sont détaillés dans [la stratégie de tests](TEST-STRATEGY.md).

L'audit de dépendances doit produire un ticket pour chaque vulnérabilité non corrigée. Une mise à niveau majeure, comme le passage éventuel de Next.js 15 à 16, est traitée séparément avec tests de compatibilité et rollback.

## CD actuel et cible

Vercel est connecté au dépôt GitHub :

- pull request : déploiement Preview ;
- `master` : cible Vercel Production ;
- `dev` : environnement d'intégration à activer ultérieurement.

Les variables Supabase publiques sont configurées dans Vercel pour Development, Preview et Production. `NEXT_PUBLIC_APP_URL` est limitée à Production ; les Previews utilisent leur URL Vercel propre. Les clés serveur, notamment Resend et Sentry, ne doivent jamais utiliser le préfixe `NEXT_PUBLIC_`.

À la clôture du Jalon 2, Preview et Production Vercel utilisent toutes deux Supabase staging. Cette configuration est volontairement limitée à l'évaluation. Elle ne satisfait pas encore la séparation exigée pour des utilisateurs réels ; le projet Supabase production, les sauvegardes, le rollback et l'observabilité restent des critères du jalon de mise en production.

Les migrations Supabase sont appliquées de façon versionnée, avec backup vérifié avant changement critique et procédure de restauration testée. Les logs de déploiement et les métriques de release sont conservés avec le SHA du commit.

## Exploitation

Prometheus collecte les métriques exposées via le collector adapté à l'hébergement ; Grafana fournit les dashboards et alertes. Les logs structurés sont corrélés par `request_id`, filtrés des secrets et conservés selon une politique documentée. Les runbooks d'alerte sont stockés avec la documentation d'exploitation.

Les alertes couvrent indisponibilité, erreurs, latence, saturation, quotas, jobs bloqués, dépendances obsolètes et signaux de sécurité. Chaque alerte indique un niveau P1-P4, un propriétaire, un seuil, une fenêtre et une action.

## Jalon 0 : socle validé

Statut : socle applicatif terminé ; gouvernance en cours.

- [x] Next.js 15 avec App Router et TypeScript
- [x] Tailwind CSS et ESLint
- [x] `pnpm lint` réussi localement
- [x] `pnpm build` réussi localement
- [x] CI GitHub Actions initiale
- [x] Dependabot hebdomadaire
- [x] modèle `.env.example`
- [x] règles de sécurité, conformité, observabilité et STPA documentées
- [x] matrice de traçabilité initiale

## Prochains jalons

### Jalon 1 : produit minimal visible

**Statut : terminé.** La première page TaskFlow et son layout responsive fournissent un parcours de démonstration sans backend.

### Jalon 2 : base de données et authentification

**Statut : terminé le 21 août 2026.** Le projet Supabase staging, les migrations, les tables utilisateurs/projets/membres, l'Auth SSR et les premières politiques RLS sont validés par la CI, la Preview et les tests d'isolation. Sortie atteinte : un utilisateur ne peut lire que les données autorisées par son appartenance au projet.

### Jalon 3 : vertical slice projet/tâche

Livrer le flux complet documenté : inscription confirmée, création d'un projet, invitation, création d'une tâche, attribution et modification de statut. Sortie : tests d'intégration, E2E et RLS du parcours principal.

### Jalon 4 : collaboration et activité

Ajouter commentaires, journal d'activité et premières notifications in-app. Sortie : une modification importante est visible dans son contexte et son historique.

### Jalon 5 : évaluation contrôlée

Ajouter les notes de livrables, leur historique et leurs règles de visibilité. Sortie : une évaluation est traçable, explicable, datée et accessible uniquement aux personnes autorisées.

### Jalon 6 : production et observabilité

**Statut : partiellement anticipé.** Vercel et GitHub sont connectés et les déploiements Preview/Production sont reproductibles. Restent à réaliser : Supabase production séparé, protection formelle de la branche principale, domaine éventuel, sauvegardes, procédure de rollback et preuves d'observabilité.

Sortie cible : déploiement reproductible de la branche principale avec procédure de rollback documentée.

## Rituel de chaque fonctionnalité

Avant de coder : besoin, périmètre, données touchées, risques et test prévu.

Pendant : branche courte, commits compréhensibles, lint local et revue de sécurité des entrées.

Après : pull request, CI, revue, déploiement Preview, validation manuelle puis fusion.

## Compétences CTO/DevOps visées

- arbitrer vitesse, coût, sécurité et dette technique ;
- concevoir une architecture multi-tenant ;
- comprendre le cycle de vie d'une migration ;
- construire une chaîne CI/CD fiable ;
- définir des indicateurs de qualité et de disponibilité ;
- rédiger des décisions compréhensibles par une équipe ;
- savoir diagnostiquer, corriger et revenir en arrière.
