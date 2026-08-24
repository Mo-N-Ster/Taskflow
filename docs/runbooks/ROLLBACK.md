# Runbook de rollback

## Application Vercel

1. Identifier la dernière release saine et son SHA dans Vercel.
2. Vérifier que son schéma reste compatible avec la base actuelle.
3. Promouvoir la release saine depuis Vercel uniquement après accord du responsable d'incident.
4. Exécuter `TASKFLOW_BASE_URL=<url-production> pnpm smoke`.
5. Conserver la release fautive et ses logs pour l'analyse ; corriger ensuite par une nouvelle PR.

## Migration Supabase

Les migrations sont préférentiellement corrigées vers l'avant. Une migration destructive doit fournir avant fusion : sauvegarde vérifiée, requête de contrôle, migration compensatoire et estimation de l'indisponibilité.

Ne jamais modifier manuellement l'historique `supabase_migrations` ni restaurer staging/production sans fenêtre d'incident approuvée. Si les données sont corrompues, suivre `BACKUP-RESTORE.md`.

## Critère de fin

Le health check, le smoke test, les parcours Auth et les logs des dépendances sont sains pendant au moins 30 minutes.
