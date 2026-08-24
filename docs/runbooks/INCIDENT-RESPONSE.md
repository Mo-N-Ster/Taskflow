# Runbook de réponse aux incidents

## Déclenchement et responsabilités

| Niveau | Exemple | Première réponse | Responsable |
| --- | --- | --- | --- |
| P1 | indisponibilité, corruption ou fuite probable | 15 minutes | propriétaire technique |
| P2 | fonction centrale dégradée, erreurs > 5 % pendant 5 min | 1 heure | responsable applicatif |
| P3 | latence ou capacité en hausse | jour ouvré | responsable plateforme |
| P4 | information sans impact immédiat | backlog | équipe produit |

## Procédure

1. Accuser réception et noter l'heure, l'environnement, la release et le `request_id`.
2. Vérifier `/api/health`, Vercel Observability, Sentry et les logs Supabase.
3. Déterminer l'impact sans copier de données personnelles dans le ticket.
4. Stabiliser : désactiver la fonctionnalité concernée ou appliquer le rollback documenté.
5. Si une perte de données est possible, geler les migrations et suivre le runbook de restauration.
6. Valider le retour à la normale par le smoke test et surveiller pendant 30 minutes.
7. Rédiger sous 48 heures une chronologie, la cause, les actions et les contrôles préventifs.

Une alerte n'est close qu'après validation du service et création des actions de suivi.
