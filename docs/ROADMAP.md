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

**Statut : terminé le 22 août 2026.** Les invitations par dashboard et email, leur acceptation ou refus, les tâches persistantes, l'assignation multiple, le changement de statut, le départ d'un membre et la réassignation sont validés. La CI, les migrations Supabase staging, la Preview, la Production Vercel et le parcours manuel multi-utilisateur ont réussi.

- [x] migrations Jalon 3 versionnées et appliquées sur Supabase staging
- [x] invitations idempotentes, liées à l'adresse et transmises par Resend
- [x] notification dashboard, acceptation et refus validés manuellement
- [x] création, assignation multiple et changement de statut des tâches
- [x] départ d'un membre, libération et réassignation des tâches
- [x] 54 assertions RLS, 14 tests unitaires et 5 scénarios E2E réussis
- [x] PR #9 fusionnée et déploiement Production validé

**Sortie :** parcours testé de bout en bout sur un environnement local puis Preview.

**Décision de passage :** le critère de sortie est satisfait. Le développement fonctionnel passe au Jalon 4.

## Jalon 4 : collaboration et activité

Ajouter commentaires, journal d'activité et premières notifications in-app.

**Statut : terminé le 22 août 2026.** Les commentaires immuables, l'activité contextualisée et les notifications in-app lues/non lues sont validés par CI, RLS, E2E, staging et test manuel. Les observateurs restent en lecture seule.

- [x] commentaire contextualisé avec auteur et date
- [x] activité sans duplication du contenu privé
- [x] notifications personnelles lues/non lues
- [x] 66 assertions RLS et parcours E2E multi-utilisateur réussis
- [x] PR #10 fusionnée, migration staging et Production validées

**Sortie :** une modification importante est visible dans son contexte et son historique.

**Décision de passage :** le critère de sortie est satisfait. Le développement passe au Jalon 5.

## Jalon 5 : évaluation contrôlée

Ajouter les notes de livrables, l'historique et les règles de visibilité avant tout score automatique ou badge.

**Statut : terminé le 22 août 2026.** Les évaluations humaines, datées et immuables sont limitées aux responsables autorisés et aux membres assignés. Leur historique reste privé pour l'évalué et les responsables ; aucun score automatique, moyenne ou badge n'est produit.

- [x] note humaine de 1 à 5 avec commentaire facultatif et date
- [x] création réservée au propriétaire et au gestionnaire de projet
- [x] auto-évaluation et évaluation d'un membre non assigné interdites
- [x] historique immuable visible uniquement par l'évalué et les responsables
- [x] notification privée et activité sans copie de la note ni du commentaire
- [x] 82 assertions RLS et 5 scénarios E2E réussis
- [x] PR #11 fusionnée, migration staging et Production validées

**Sortie :** une évaluation est traçable, explicable, datée et accessible uniquement aux personnes autorisées.

**Décision de passage :** le critère de sortie est satisfait. Le développement passe au Jalon 6 consacré à la production et à l'observabilité.

## Jalon 6 : production et observabilité

Configurer Vercel, Prometheus, Grafana, logs, Sentry, alertes, sauvegardes et procédure de rollback.

**Statut : en cours depuis le 22 août 2026.** Le socle applicatif et les runbooks sont implémentés sur une branche dédiée. Supabase Production est séparé et migré ; Sentry et l'export OTLP Grafana sont reliés. Restent la protection GitHub et les exercices contrôlés d'alerte et de restauration.

- [x] health check applicatif et dépendance Supabase
- [x] corrélation `request_id` et logs JSON minimisés
- [x] instrumentation OpenTelemetry et Sentry sans PII par défaut
- [x] smoke test automatisé et runbooks incident/rollback/restore
- [x] projet Supabase Production séparé, migré et relié uniquement à Vercel Production
- [ ] sauvegarde externe chiffrée et restauration testée sur projet jetable
- [x] export OTLP Grafana validé sur des traces Preview réelles
- [ ] dashboards Grafana et alertes testés
- [ ] projet Sentry, source maps et alerte d'exception validés
- [ ] protection de `master` avec checks et revue obligatoires

**Sortie :** une release peut être déployée, observée et annulée avec une procédure écrite.

## Jalon 7 : conformité et résilience

Vérifier RGPD, contrats fournisseurs, licences, rétention, restauration, rotation des secrets, expiration des sections temporaires et exercices d'incident.

**Sortie :** un dossier de conformité et un exercice STPA/incident sont approuvés avant l'ouverture à des utilisateurs réels.

## Règle de passage

Pour chaque jalon : démonstration fonctionnelle, tests automatisés pertinents, contrôle sécurité, documentation mise à jour et décision explicite de continuer ou de réduire le périmètre.
