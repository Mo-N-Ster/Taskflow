# Processus DevOps TaskFlow

Ce document décrit le parcours d'apprentissage et la chaîne de livraison de TaskFlow. Chaque étape doit produire un résultat observable et une preuve de validation.

## Principes de travail

1. Une fonctionnalité commence par un besoin utilisateur et un critère d'acceptation.
2. Toute modification passe par une branche et une pull request.
3. La CI doit être verte avant la fusion dans `dev` ou `main`.
4. Les secrets ne sont jamais commités ; seul `.env.example` est versionné.
5. Les migrations de base de données sont versionnées avec le code.
6. Une décision technique importante est documentée avec son contexte et ses conséquences.
7. Une fonctionnalité n'est livrée que si sa sécurité, sa traçabilité et son exploitation sont vérifiables.

## Flux Git proposé

- `main` : production, protégée, déployée sur Vercel.
- `dev` : intégration, déploiement preview.
- `feature/<nom>` : développement d'une fonctionnalité.
- `fix/<nom>` : correction ciblée.

Flux normal :

```text
feature/* -> Pull Request -> dev -> validation produit -> main -> production
```

La protection des branches devra imposer au minimum une CI verte et une revue avant fusion.

## CI et CD

Le workflow `.github/workflows/ci.yml` s'exécute sur les pushs vers `dev` et `main`, ainsi que sur les pull requests. Il réalise :

- installation reproductible avec `npm ci` ;
- lint avec `npm run lint` ;
- build de production avec `npm run build` ;
- tests unitaires et d'intégration dès qu'ils existent ;
- lint et vérification TypeScript ;
- build de production ;
- scan de secrets et audit des dépendances ;
- production d'un artefact identifié par commit.

Le déploiement suit la chaîne : **tests -> vérifications sécurité -> build -> Preview -> validation -> production**. Une fusion vers `main` ne doit pas contourner les contrôles. Le déploiement de production est automatique uniquement après les protections de branche, les validations obligatoires et l'approbation définie par le niveau de risque.

Le pipeline minimal obligatoire est : `npm ci` -> lint -> typecheck -> tests unitaires/intégration -> audit dépendances -> scan secrets -> build. Les tests E2E, les tests RLS, le smoke test Preview et le déploiement production sont ajoutés dès que Supabase et Vercel sont connectés. Les outils et preuves sont détaillés dans [la stratégie de tests](TEST-STRATEGY.md).

L'audit de dépendances doit produire un ticket pour chaque vulnérabilité non corrigée. Une mise à niveau majeure, comme le passage éventuel de Next.js 15 à 16, est traitée séparément avec tests de compatibilité et rollback.

## CD cible

Vercel sera connecté au dépôt GitHub :

- pull request : déploiement Preview ;
- `dev` : environnement d'intégration ;
- `main` : production.

Les variables d'environnement seront configurées dans Vercel par environnement. Les clés serveur, notamment Resend et Sentry, ne doivent jamais utiliser le préfixe `NEXT_PUBLIC_`.

Les migrations Supabase sont appliquées de façon versionnée, avec backup vérifié avant changement critique et procédure de restauration testée. Les logs de déploiement et les métriques de release sont conservés avec le SHA du commit.

## Exploitation

Prometheus collecte les métriques exposées via le collector adapté à l'hébergement ; Grafana fournit les dashboards et alertes. Les logs structurés sont corrélés par `request_id`, filtrés des secrets et conservés selon une politique documentée. Les runbooks d'alerte sont stockés avec la documentation d'exploitation.

Les alertes couvrent indisponibilité, erreurs, latence, saturation, quotas, jobs bloqués, dépendances obsolètes et signaux de sécurité. Chaque alerte indique un niveau P1-P4, un propriétaire, un seuil, une fenêtre et une action.

## Jalon 0 : socle validé

Statut : socle applicatif terminé ; gouvernance en cours.

- [x] Next.js 15 avec App Router et TypeScript
- [x] Tailwind CSS et ESLint
- [x] `npm run lint` réussi localement
- [x] `npm run build` réussi localement
- [x] CI GitHub Actions initiale
- [x] Dependabot hebdomadaire
- [x] modèle `.env.example`
- [x] règles de sécurité, conformité, observabilité et STPA documentées
- [x] matrice de traçabilité initiale

## Prochains jalons

### Jalon 1 : produit minimal visible

Créer la première page TaskFlow et son layout responsive, sans backend. Sortie : une page de présentation du dashboard avec composants réutilisables et critères d'acceptation écrits.

### Jalon 2 : base de données et authentification

Créer le projet Supabase, versionner les migrations, définir les tables utilisateurs/projets/membres et écrire les premières politiques RLS. Sortie : un utilisateur ne peut lire que les données autorisées par son appartenance au projet.

### Jalon 3 : vertical slice projet/tâche

Livrer le flux complet documenté : inscription confirmée, création d'un projet, invitation, création d'une tâche, attribution et modification de statut. Sortie : tests d'intégration, E2E et RLS du parcours principal.

### Jalon 4 : qualité et observabilité

Ajouter les tests, Sentry, les métriques Web Vitals et les alertes utiles. Sortie : une erreur simulée est visible et exploitable sans exposer de données sensibles.

### Jalon 5 : mise en production contrôlée

Configurer Vercel, les domaines, les environnements et la protection des branches. Sortie : déploiement reproductible de `main` avec procédure de rollback documentée.

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
