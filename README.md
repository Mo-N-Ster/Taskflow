# TaskFlow

TaskFlow est une application collaborative destinée à devenir une PWA. Elle aide une équipe à transformer une idée en livraison, suivre les tâches et rendre visible la contribution de chacun.

Le projet est un parcours d'apprentissage CTO et DevOps. La documentation est la source de référence avant le code : elle décrit le produit, les décisions, les risques et les critères de validation.

## Documentation

- [Vue d'ensemble et vision produit](docs/PRODUCT.md)
- [Exigences fonctionnelles et scénarios](docs/REQUIREMENTS.md)
- [Parcours utilisateurs MVP](docs/USER-FLOWS.md)
- [Contrats applicatifs](docs/API-CONTRACTS.md)
- [Architecture technique](docs/ARCHITECTURE.md)
- [Modèle de données et sécurité RLS](docs/DATA-MODEL.md)
- [Environnement de développement](docs/DEVELOPMENT-ENVIRONMENT.md)
- [Stratégie de tests](docs/TEST-STRATEGY.md)
- [Guide de contribution](docs/CONTRIBUTING.md)
- [Décision ADR-001 : stack MVP](docs/ADR-001-MVP-STACK.md)
- [Sécurité, conformité et gouvernance](docs/SECURITY-COMPLIANCE.md)
- [Registre des données personnelles](docs/PERSONAL-DATA-REGISTER.md)
- [Observabilité, monitoring et alertes](docs/OBSERVABILITY.md)
- [Analyse STPA](docs/STPA.md)
- [Traçabilité et gestion des preuves](docs/TRACEABILITY.md)
- [Processus DevOps et CI/CD](docs/DEVOPS-PROCESS.md)
- [Feuille de route et critères de sortie](docs/ROADMAP.md)

## Démarrage local

Prérequis : Node.js LTS, Corepack et pnpm.

```bash
corepack enable
pnpm install
pnpm dev
```

Ouvrir ensuite http://localhost:3000.

Commandes de contrôle :

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## État actuel

Les Jalons 1 et 2 sont terminés. Le Jalon 3 est implémenté sur sa branche de livraison : invitations sécurisées, tâches persistantes, assignation multiple, changements de statut et journal minimal. Sa clôture formelle dépend encore de la CI, de la migration Supabase staging et de la validation Preview Vercel.
