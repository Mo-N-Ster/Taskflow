# Architecture technique

## Décision cible

TaskFlow utilise une architecture web full-stack Next.js avec App Router. L'interface et les endpoints applicatifs sont déployés sur Vercel. Supabase fournit PostgreSQL, l'authentification et le stockage. Les opérations sensibles passent par des Server Actions ou des Route Handlers côté serveur.

```text
Navigateur / PWA
        |
        v
Next.js App Router (UI, Server Components, Server Actions, API)
        |
        +--> Supabase Auth
        +--> Supabase PostgreSQL + RLS
        +--> Supabase Storage
        +--> Resend (notifications, hors MVP)
        +--> OpenTelemetry / Prometheus collector
        +--> Grafana / journal centralisé / Sentry
```

## Responsabilités

| Couche | Responsabilité | Règle |
| --- | --- | --- |
| UI | Affichage, navigation, états de formulaire | Ne jamais considérer l'UI comme une autorisation |
| Server Actions / API | Cas d'usage et validation | Vérifier session, rôle et appartenance avant mutation |
| Supabase Auth | Identité et session | Utiliser les mécanismes officiels Supabase |
| PostgreSQL | Données métier et contraintes | RLS activé sur chaque table exposée |
| Storage | Fichiers projet | Buckets privés et politiques par projet |
| Vercel | Build, preview et production | Environnements séparés |
| Observabilité | Métriques, logs, traces et alertes | Données minimisées, corrélées et actionnables |

## Organisation cible du code

```text
src/
  app/                 Routes, layouts et pages
  components/          Composants d'interface réutilisables
  features/            Modules métier (projects, tasks, evaluations)
  lib/                 Clients, validation et utilitaires
  types/               Types partagés
supabase/
  migrations/          Migrations SQL versionnées
  seed.sql              Données locales de démonstration
docs/                   Décisions et documentation
```

## Flux principal

1. Le navigateur demande une page protégée.
2. Next.js vérifie la session côté serveur.
3. La requête métier est validée puis exécutée avec le contexte utilisateur.
4. PostgreSQL applique les contraintes et RLS.
5. La réponse est rendue sans exposer de clé serveur.

Les routes externes appliquent aussi rate limiting, validation d'entrée, CORS par allowlist et journalisation corrélée. Les webhooks vérifient leur signature avant tout traitement.

## Décisions encore ouvertes

- stratégie exacte de cache et de revalidation ;
- choix d'une librairie de formulaires et de validation ;
- choix de la bibliothèque de drag-and-drop ;
- politique de rétention des journaux et évaluations ;
- stratégie de tests end-to-end en CI.

Ces points deviennent des décisions ADR lorsqu'ils influencent plusieurs modules ou la production.
