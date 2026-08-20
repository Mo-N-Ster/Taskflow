# TaskFlow : vision produit

## Résumé

TaskFlow est une application SaaS/PWA de pilotage de projets d'équipe. Elle combine la gestion opérationnelle des tâches, la communication contextualisée et un historique de contribution exploitable par les membres.

**Promesse :** de l'idée à la livraison, valoriser l'impact de chaque membre à chaque étape.

## Problème

Les équipes utilisent souvent plusieurs outils séparés pour planifier, discuter, partager des fichiers et rendre compte de leur travail. Le responsable manque de visibilité fiable sur les blocages et la contribution réelle ; le membre ne dispose pas d'un historique structuré de ses collaborations.

## Utilisateurs cibles

| Persona | Objectif principal | Difficulté actuelle |
| --- | --- | --- |
| Chef de projet | Suivre l'avancement et débloquer l'équipe | Trop de relances et peu d'indicateurs fiables |
| Membre | Réaliser son travail et démontrer sa fiabilité | Contribution dispersée entre plusieurs outils |
| Observateur | Comprendre l'état du projet rapidement | Trop de détails ou informations manquantes |
| Propriétaire | Administrer le projet et ses membres | Gestion des droits et de la visibilité |

## Principes produit

1. **Clarté avant volume :** le MVP résout le suivi projet principal avant d'ajouter des fonctionnalités avancées.
2. **Contexte conservé :** une discussion, un fichier et une décision restent attachés à l'objet de travail concerné.
3. **Droits explicites :** chaque action dépend du rôle et de l'appartenance au projet.
4. **Évaluation responsable :** les scores sont expliqués, datés et séparés des faits opérationnels.
5. **Mobile d'abord :** les actions fréquentes restent utilisables sur un écran étroit.

## Périmètre MVP

- inscription et connexion ;
- confirmation de l'adresse email ;
- création et consultation de projets publics ou privés ;
- invitation et rôles de projet ;
- création, attribution et suivi de tâches ;
- statuts : À faire, En cours, En relecture, Terminé ;
- priorités, échéances et commentaires ;
- tableau de bord d'avancement ;
- première trace d'activité.

Le premier vertical slice est : inscription -> confirmation email -> création de projet -> invitation -> création de tâche -> attribution -> changement de statut.

## Hors périmètre MVP

Sous-tâches, calendrier avancé, dépendances complexes, pièces jointes, temps passé, notifications email métier, badges, scoring automatique, export PDF/CSV, abonnement Stripe, OAuth et intégrations externes. Ces éléments restent prévus dans la feuille de route, mais ne doivent pas bloquer le premier parcours utilisable.

## Indicateurs de réussite

- un utilisateur crée un projet en moins de deux minutes ;
- un responsable crée et attribue une tâche sans documentation externe ;
- un membre met à jour son statut et ajoute un commentaire ;
- un observateur comprend l'état du projet depuis le tableau de bord ;
- aucune donnée d'un projet n'est lisible par un utilisateur non autorisé.
