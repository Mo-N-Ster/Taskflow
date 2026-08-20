# Feuille de route d'apprentissage

Chaque jalon possède une sortie vérifiable. Aucun jalon ne doit être déclaré terminé uniquement parce que le code compile.

## Jalon 0 : socle et documentation

**Statut : documentation de référence établie ; décisions MVP à valider.**

- [x] Next.js, TypeScript, App Router et lint installés
- [x] processus CI/CD initial documenté
- [x] vision, exigences, architecture et données documentées
- [ ] décision du périmètre MVP validée
- [ ] première décision d'architecture enregistrée
- [x] règles de sécurité et conformité définies
- [x] stratégie Prometheus/Grafana, logs et alertes définie
- [x] analyse STPA initiale et matrice de traçabilité définies

## Jalon 1 : expérience produit sans backend

Construire le shell applicatif, les écrans projets, tâches et dashboard avec des données de démonstration.

**Sortie :** parcours cliquable responsive et critères REQ reliés à des tests UI ou preuves manuelles.

## Jalon 2 : identité et multi-tenant

Ajouter Supabase Auth, les migrations initiales et les politiques RLS.

**Statut : terminé le 21 août 2026.** Le schéma initial, Supabase Auth SSR, les routes protégées, la confirmation email, la création persistée de projet, la déconnexion et les tests d'isolation sont implémentés. La CI, la Preview Vercel, la migration Supabase staging et le parcours manuel déployé ont été validés.

- [x] migration initiale versionnée et appliquée sur Supabase staging
- [x] authentification SSR, confirmation email et routes protégées
- [x] création atomique des profils et memberships propriétaires
- [x] politiques RLS validées par 18 assertions déterministes
- [x] parcours Auth/projet validé par 4 scénarios E2E
- [x] CI GitHub et Preview Vercel vertes avant fusion
- [x] validation manuelle du parcours déployé et des journaux Auth

**Sortie :** deux utilisateurs de projets différents ne peuvent pas lire les données l'un de l'autre.

**Décision de passage :** le critère de sortie est satisfait. Le développement fonctionnel passe au Jalon 3 ; les travaux de production et d'observabilité restent suivis séparément au Jalon 6.

## Jalon 3 : vertical slice projet/tâche

Livrer le parcours créer un projet, inviter un membre, créer une tâche, l'assigner et modifier son statut.

**Sortie :** parcours testé de bout en bout sur un environnement local puis Preview.

## Jalon 4 : collaboration et activité

Ajouter commentaires, journal d'activité et premières notifications in-app.

**Sortie :** une modification importante est visible dans son contexte et son historique.

## Jalon 5 : évaluation contrôlée

Ajouter les notes de livrables, l'historique et les règles de visibilité avant tout score automatique ou badge.

**Sortie :** une évaluation est traçable, explicable, datée et accessible uniquement aux personnes autorisées.

## Jalon 6 : production et observabilité

Configurer Vercel, Prometheus, Grafana, logs, Sentry, alertes, sauvegardes et procédure de rollback.

**Sortie :** une release peut être déployée, observée et annulée avec une procédure écrite.

## Jalon 7 : conformité et résilience

Vérifier RGPD, contrats fournisseurs, licences, rétention, restauration, rotation des secrets, expiration des sections temporaires et exercices d'incident.

**Sortie :** un dossier de conformité et un exercice STPA/incident sont approuvés avant l'ouverture à des utilisateurs réels.

## Règle de passage

Pour chaque jalon : démonstration fonctionnelle, tests automatisés pertinents, contrôle sécurité, documentation mise à jour et décision explicite de continuer ou de réduire le périmètre.
