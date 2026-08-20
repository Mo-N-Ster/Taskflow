# ADR-001 : stack et stratégie MVP

- Statut : accepté
- Date : 2026-08-20
- Décideur : propriétaire du projet

## Contexte

TaskFlow doit permettre un apprentissage full-stack et DevOps avec un budget minimal, sans sacrifier l'isolation multi-tenant, la traçabilité ni la possibilité de passer en production.

## Décision

Le MVP utilise Next.js 15 avec App Router et TypeScript, Supabase pour Auth/PostgreSQL/Storage futur, Vercel pour l'hébergement, GitHub Actions pour la CI/CD, Vitest et Playwright pour les tests, Zod pour la validation et Grafana Cloud/Sentry pour l'observabilité progressive.

Le premier parcours couvre email/mot de passe confirmé, projet, invitation, tâche, attribution et changement de statut. Les fichiers, Stripe, OAuth, scoring automatique et intégrations sont reportés.

## Conséquences

- faible coût initial et peu d'infrastructure à maintenir ;
- dépendance à Supabase et Vercel à surveiller ;
- observabilité Prometheus adaptée par collector, pas par processus auto-hébergé dans Vercel ;
- migration vers une infrastructure plus autonome possible ultérieurement, mais non nécessaire au MVP ;
- tout changement majeur doit produire un nouvel ADR.
