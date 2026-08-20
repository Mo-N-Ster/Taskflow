# TaskFlow

TaskFlow est une PWA collaborative qui aide une équipe à transformer une idée en livraison, suivre les tâches et rendre visible la contribution de chacun.

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

Prérequis : Node.js LTS et npm.

```bash
npm ci
npm run dev
```

Ouvrir ensuite http://localhost:3000.

Commandes de contrôle :

```bash
npm run lint
npm run build
```

## État actuel

Le socle Next.js 15, TypeScript, App Router, Tailwind CSS et ESLint est installé. L'écran métier, Supabase et l'authentification ne sont pas encore implémentés. Les règles de sécurité et d'exploitation sont documentées avant le prochain jalon d'implémentation.
