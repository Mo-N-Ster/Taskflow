# Sécurité, conformité et gouvernance

Ce document est la référence des contrôles à respecter pour chaque fonctionnalité et chaque release. Un contrôle non applicable doit être justifié dans la pull request ; il ne doit pas être silencieusement ignoré.

## Règles obligatoires

| ID | Règle | Mise en œuvre attendue | Preuve / gate |
| --- | --- | --- | --- |
| SEC-01 | Les API keys restent dans l'environnement | `.env.local` et secrets du fournisseur ; jamais dans le code ou les logs | scan de secrets CI |
| SEC-02 | Les fichiers `.env` sont ignorés | `.env*` dans `.gitignore`, seul `.env.example` est versionné | contrôle Git |
| SEC-03 | Le login est limité | rate limiting par IP et identifiant, réponse générique, journalisation sans mot de passe | test de dépassement |
| SEC-04 | RLS est activée | chaque table métier exposée possède RLS et des policies testées | tests d'isolation |
| SEC-05 | Les mots de passe sont hachés | Supabase Auth gère le hash ; aucun mot de passe n'est stocké par TaskFlow | revue de schéma |
| SEC-06 | Les droits sont vérifiés côté serveur | session, appartenance et rôle revérifiés dans Server Actions/API et par RLS | test négatif par rôle |
| SEC-07 | Seules les clés publiques vont au client | préfixe `NEXT_PUBLIC_` réservé aux valeurs explicitement publiques | revue des variables |
| SEC-08 | HTTPS partout | HTTPS en production, redirection et cookies Secure/HttpOnly/SameSite | test d'environnement |
| SEC-09 | Les entrées sont validées | schéma partagé, limites de taille, normalisation et requêtes paramétrées | tests de validation |
| SEC-10 | Les uploads sont bornés | limite par fichier, quota par projet, types autorisés et stockage privé | test d'upload |
| SEC-11 | CORS est restrictif | aucune origine `*` en production ; allowlist des domaines connus | revue de configuration |
| SEC-12 | Les erreurs sont maîtrisées | messages génériques en production, détails uniquement dans logs corrélés | test de réponse |
| SEC-13 | Les consoles sont propres | aucun `console.log` de debug ou secret ; logger structuré côté serveur | lint/revue |
| SEC-14 | Login à réponse uniforme | un seul message pour email ou mot de passe incorrect afin d'éviter l'énumération | test d'authentification |
| SEC-15 | Les webhooks sont signés | vérifier la signature avec comparaison constante et rejeter les requêtes invalides | test de signature |
| SEC-16 | Les dépendances sont maintenues | lockfile, Dependabot, audit, traitement des CVE et justification des exceptions | CI + registre de risques |
| SEC-17 | Confirmation email | compte non confirmé limité selon la politique Supabase avant accès sensible | test du parcours |
| SEC-18 | Sauvegarde automatique | backups Supabase, vérification de restauration et rétention documentée | preuve de restore |
| SEC-19 | Les sections temporaires expirent | sessions, invitations, liens de reset et tokens ont TTL et révocation | test d'expiration |
| SEC-20 | Types de fichiers vérifiés | extension, MIME détecté, signature binaire si nécessaire ; nom et chemin générés | test de fichier déguisé |
| SEC-21 | Dépôt structuré | séparation app/features/lib/types, migrations et docs selon l'architecture | revue de structure |
| SEC-22 | Fonctionnalités traçables | exigence -> issue -> PR -> test -> release | matrice de traçabilité |
| SEC-23 | Conformité contrôlée | RGPD, contrats fournisseurs, licences, fiscalité et obligations applicables évalués | revue avant production |
| SEC-24 | Pipeline automatisée | tests -> build -> déploiement contrôlé de la nouvelle version | workflow CI/CD |
| SEC-25 | Système monitoré | métriques, logs, traces utiles, dashboards et alertes actionnables | test d'alerte |

## Gestion des secrets

Les secrets sont créés dans le gestionnaire du fournisseur, injectés au runtime et renouvelés selon leur criticité. Une fuite entraîne révocation immédiate, rotation, recherche dans les logs et rapport d'incident. `.env.example` contient uniquement des noms et des valeurs fictives.

## Authentification et sessions

Supabase Auth est le fournisseur d'identité prévu. Il hache les mots de passe ; TaskFlow ne doit jamais implémenter son propre stockage de mots de passe. Les sessions sont courtes ou renouvelables par mécanisme sûr, les cookies sont protégés et les liens d'invitation/reset expirent.

## Conformité

Avant production, une revue doit couvrir au minimum : base légale et consentement RGPD, droit d'accès/suppression/export, minimisation et durée de conservation, sous-traitants (Vercel, Supabase, Resend, Sentry), localisation des données, registre des traitements, licences open source, conditions d'utilisation et politique de confidentialité. Cette documentation ne remplace pas un avis juridique.

## Réponse à incident

1. Détecter, qualifier et ouvrir un incident avec un identifiant.
2. Contenir : désactiver une clé, un webhook, une session ou un déploiement.
3. Préserver les preuves sans exposer de données personnelles.
4. Corriger, tester et déployer avec revue renforcée.
5. Notifier les parties concernées selon les obligations applicables.
6. Produire un post-mortem avec cause racine et actions préventives.
