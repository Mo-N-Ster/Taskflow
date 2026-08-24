# Runbook de sauvegarde et restauration Supabase

## Objectifs initiaux

- RPO : 24 heures sur l'offre gratuite avec export logique quotidien externe ; à réduire par PITR avant données critiques.
- RTO : 4 heures pour une restauration contrôlée sur un projet de remplacement.
- rétention : 7 sauvegardes quotidiennes, 4 hebdomadaires et 3 mensuelles, chiffrées hors du dépôt.

## Sauvegarde

1. Utiliser une URL de connexion Production explicite, jamais le lien staging implicite.
2. Exécuter `supabase db dump --db-url <URL> --file <chemin-securise>/roles.sql --role-only`.
3. Exécuter `supabase db dump --db-url <URL> --file <chemin-securise>/schema.sql`.
4. Exécuter `supabase db dump --db-url <URL> --file <chemin-securise>/data.sql --data-only --use-copy`.
5. Chiffrer les fichiers, calculer leurs SHA-256 et les stocker hors du poste et du dépôt.
6. Noter date UTC, projet, version Postgres, SHA applicatif et résultat dans le registre d'exploitation.

Les sauvegardes PostgreSQL ne restaurent pas les objets Storage supprimés ; ceux-ci nécessitent une sauvegarde distincte.

## Test de restauration

1. Créer un projet Supabase jetable et isolé, sans utilisateur réel.
2. Appliquer les rôles, le schéma puis les données avec les outils PostgreSQL/Supabase compatibles.
3. Vérifier les migrations, les contraintes, RLS, comptes synthétiques et volumes par table.
4. Lancer les tests pgTAP et un smoke test contre un déploiement temporaire.
5. Détruire le projet jetable seulement après conservation de la preuve non sensible.

Une sauvegarde non restaurée avec succès n'est pas considérée comme valide. Le test est trimestriel et obligatoire avant toute migration destructive.
