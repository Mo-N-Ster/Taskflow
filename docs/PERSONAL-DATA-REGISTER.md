# Registre initial des données personnelles

Ce registre prépare la revue RGPD. Il ne remplace pas une validation juridique.

| Donnée | Source | Finalité | Accès | Conservation initiale |
| --- | --- | --- | --- | --- |
| Email | utilisateur | authentification, invitation | Auth, propriétaire autorisé | compte actif + durée légale à définir |
| Nom affiché | utilisateur | affichage produit | membres autorisés | compte actif |
| Avatar | utilisateur, optionnel | identification visuelle | membres autorisés | compte actif |
| Membership et rôle | système/propriétaire | autorisation multi-tenant | membres du projet | durée du projet + historique nécessaire |
| Commentaire | utilisateur | collaboration | membres autorisés | durée du projet + politique à définir |
| Événement d'activité | système | audit et compréhension du projet | membres autorisés, opérateurs minimisés | durée documentée |
| Évaluation | chef de projet | feedback de livrable | selon politique explicite | durée documentée et droit de rectification |
| Logs techniques | système | sécurité et diagnostic | opérateurs habilités | rétention courte et minimisée |

## Droits à implémenter

- accès et export des données ;
- correction du profil ;
- suppression du compte selon contraintes d'historique ;
- retrait d'un projet ;
- opposition ou limitation lorsque applicable ;
- notification des sous-traitants si nécessaire.

## Principes

Minimisation, finalité explicite, accès par rôle, chiffrement en transit, secrets séparés, logs sans contenu privé et suppression automatique lorsque la conservation n'est plus justifiée.

Avant la production, compléter les durées, bases légales, responsables, lieux de traitement, sous-traitants, mécanisme d'exercice des droits et procédure de violation de données.
