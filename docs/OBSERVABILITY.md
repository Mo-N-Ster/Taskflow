# Observabilité, monitoring et alertes

## Objectif

Détecter une panne, une dégradation ou une obsolescence avant qu'elles ne deviennent un incident utilisateur, puis fournir assez de contexte pour agir sans divulguer de données sensibles.

## Architecture cible

```text
Next.js / services
   | metrics (OpenTelemetry/Prometheus), logs JSON, traces
   v
Collector ou endpoint de collecte
   +--> Prometheus ou service compatible Prometheus
   +--> Grafana (dashboards et alertes)
   +--> journal centralisé
   +--> Sentry (exceptions applicatives)
```

Les fonctions serverless ne sont pas des agents Prometheus persistants. La collecte doit donc utiliser un collector ou un endpoint compatible avec l'environnement Vercel ; on ne promet pas un scraping direct d'un processus qui n'existe pas en permanence.

## Signaux obligatoires

| Signal | Exemples de métriques/logs | Première alerte |
| --- | --- | --- |
| Disponibilité | taux de réponses 5xx, health check, succès login | critique si health check échoue ou 5xx > 5 % pendant 5 min |
| Latence | p50/p95/p99 par route et action | warning si p95 dépasse le SLO 2 min, critique 10 min |
| Authentification | échecs login, rate-limit hits, confirmations | alerte si hausse anormale ou attaque probable |
| Base de données | connexions, erreurs, latence, saturation, deadlocks | warning à 70 %, critique à 85 % d'une limite |
| Jobs/webhooks | âge du dernier succès, retries, signature invalide | critique si aucune réussite dans la fenêtre attendue |
| Stockage | quota projet, upload refusé, taille cumulée | warning à 80 %, critique à 95 % |
| Dépendances | CVE, version EOL, échec de mise à jour | ticket obligatoire, critique si exposition connue |
| Produit | projets créés, tâches terminées, erreurs de workflow | signal de régression fonctionnelle |

Les seuils seront calibrés avec les mesures réelles. Chaque alerte doit préciser gravité, propriétaire, runbook, fenêtre et action attendue.

## Journalisation

Les logs sont structurés en JSON avec `timestamp`, `level`, `service`, `environment`, `request_id`, `route`, `status` et durée. Ils ne contiennent jamais mot de passe, token, clé API, contenu privé de tâche ou données personnelles inutiles. Les erreurs côté client utilisent un identifiant de corrélation, pas une stack trace.

## Dashboards Grafana

- **Overview :** disponibilité, erreurs, latence, trafic et statut des dépendances.
- **Auth & sécurité :** échecs, rate limiting, sessions et webhooks rejetés.
- **Business :** projets actifs, tâches en retard, activité et erreurs métier.
- **Data & capacity :** base, stockage, quotas, backups et restauration.
- **Release :** version déployée, erreurs après release et rollback.

## Politique d'alertes

- P1 critique : astreinte immédiate, impact utilisateur ou perte de données possible.
- P2 élevé : dégradation importante ou panne d'une fonction non centrale, action dans la journée.
- P3 moyen : tendance, dette ou capacité à surveiller, ticket planifié.
- P4 information : événement utile sans action immédiate.

Une alerte doit être testée au moins une fois par trimestre. Les alertes bruyantes sont corrigées ou supprimées ; une alerte ignorée est un défaut de conception.

## SLO initiaux

- disponibilité mensuelle cible : 99,5 % hors maintenance annoncée ;
- 95 % des pages principales sous 2 secondes dans l'environnement cible ;
- restauration testée au moins une fois par trimestre ;
- temps de détection d'un incident critique inférieur à 5 minutes ;
- temps de première réponse P1 inférieur à 15 minutes pendant une période couverte.
