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

## Implémentation TaskFlow

- `src/instrumentation.ts` initialise OpenTelemetry avec le service `taskflow-web` ; Vercel peut exporter les traces vers Grafana Cloud par Drain OTLP.
- Sentry capture les exceptions serveur, Edge, navigateur et App Router lorsque les DSN sont configurés. `sendDefaultPii` reste désactivé et Sentry réutilise l'instrumentation OpenTelemetry existante.
- `/api/health` contrôle la configuration et Supabase Auth en trois secondes au maximum. La réponse ne contient ni URL, ni clé, ni donnée utilisateur et n'est jamais mise en cache.
- le middleware propage un `x-request-id` validé ; les logs JSON contiennent seulement des champs autorisés et le SHA Vercel.
- `.github/workflows/production-smoke.yml` vérifie deux fois par heure l'accueil et les dépendances. La variable GitHub `TASKFLOW_PRODUCTION_URL` est obligatoire.

L'export OTLP utilise `OTEL_EXPORTER_OTLP_ENDPOINT` et `OTEL_EXPORTER_OTLP_HEADERS`, configurés comme secrets Vercel serveur. Les identifiants Sentry sont décrits dans `.env.example`.

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

| Alerte initiale | Niveau | Seuil et fenêtre | Action |
| --- | --- | --- | --- |
| health ou smoke en échec | P1 | 2 contrôles consécutifs | runbook incident, dépendances puis rollback |
| réponses 5xx | P1 | > 5 % pendant 5 min | corréler release, Sentry et Supabase |
| latence p95 | P2 | > 2 s pendant 10 min | identifier route/span et saturation |
| Auth 4xx anormaux | P2 | doublement sur 10 min | vérifier attaque, quota et configuration |
| base ou stockage | P2 | > 70 % warning, > 85 % critique | réduire charge ou augmenter capacité |
| absence de sauvegarde valide | P1 | > 24 h | suspendre les migrations destructives |

Les actions détaillées sont dans [le runbook incident](runbooks/INCIDENT-RESPONSE.md), [le rollback](runbooks/ROLLBACK.md) et [la restauration](runbooks/BACKUP-RESTORE.md).

## SLO initiaux

- disponibilité mensuelle cible : 99,5 % hors maintenance annoncée ;
- 95 % des pages principales sous 2 secondes dans l'environnement cible ;
- restauration testée au moins une fois par trimestre ;
- temps de détection d'un incident critique inférieur à 5 minutes ;
- temps de première réponse P1 inférieur à 15 minutes pendant une période couverte.
