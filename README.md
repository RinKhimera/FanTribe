<div align="center">
  <img src="public/images/logo.png" alt="FanTribe Logo" width="120" height="120">

# FanTribe

### Plateforme Sociale pour Créateurs de Contenu

Une plateforme francophone dédiée aux créateurs et créatrices du marché africain, permettant de monétiser leur contenu via des abonnements et pourboires, avec support natif du paiement mobile money.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Convex-Realtime-orange?style=for-the-badge)](https://convex.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Demo](#) · [Signaler un Bug](https://github.com/RinKhimera/fantribe/issues) · [Demander une Fonctionnalité](https://github.com/RinKhimera/fantribe/issues)

</div>

---

## Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Pour Qui ?](#pour-qui-)
- [Stack Technique](#stack-technique)
- [Démarrage Rapide](#démarrage-rapide)
- [Architecture](#architecture)
- [Structure du Projet](#structure-du-projet)
- [Paiements](#paiements)
- [Authentification & Sécurité](#authentification--sécurité)
- [Tests](#tests)
- [Commandes](#commandes)
- [Déploiement](#déploiement)
- [Contributing](#contributing)
- [License](#license)
- [Auteur](#auteur)

---

## Fonctionnalités

### Pour les Créateurs

- **Gestion de Contenu**
  - Publication de posts (texte, images, vidéos) — max 3 images ou 1 vidéo par post
  - Contenu public ou réservé aux abonnés (blur overlay sur le contenu verrouillé)
  - Contenu adulte avec gating (`isAdult` + préférence utilisateur)
  - Système de commentaires et likes
  - Collections personnalisées avec drag & drop

- **Monétisation**
  - Abonnements mensuels (1000 XAF/mois)
  - Pourboires (tips) avec montants prédéfinis (500–10 000 XAF) ou personnalisés
  - Paiement Mobile Money (Orange Money, MTN) via CinetPay
  - Paiement par carte (Visa/Mastercard, Apple Pay, Google Pay) via Stripe
  - Commission : 70% créateur / 30% plateforme
  - Dashboard de performance avec statistiques

- **Vérification Créateur**
  - Processus de candidature en plusieurs étapes
  - Upload de documents d'identité
  - Validation par l'administration
  - Badge vérifié affiché partout

### Pour les Abonnés

- **Expérience Sociale**
  - Fil d'actualité personnalisé (filtré par créateurs suivis)
  - Page Explore pour découvrir des créateurs et posts publics
  - Système de follow gratuit (séparé des abonnements payants)
  - Interactions (likes, commentaires)
  - Messagerie privée avec créateurs abonnés
  - Notifications en temps réel (11 types, groupées)

- **Abonnements & Tips**
  - Accès au contenu exclusif + messagerie directe
  - Pourboires depuis un post, un profil ou une conversation
  - Historique des abonnements et transactions

### Pour les Administrateurs (Superuser)

- **Dashboard** (`/superuser`)
  - Statistiques globales (utilisateurs, posts, candidatures)
  - Gestion et recherche d'utilisateurs
  - Dashboard transactions avec filtres (période, créateur, provider)
  - Top/Low 5 earners, montant moyen, revenus par période
  - Modération : signalements, validation créateurs, actions de modération

---

## Pour Qui ?

**Créatrices & Créateurs** — Artistes, influenceurs, coachs, éducateurs souhaitant monétiser leur contenu et bâtir une communauté engagée.

**Fans & Abonnés** — Personnes souhaitant soutenir leurs créateurs favoris et accéder à du contenu exclusif.

**Marché Cible** — Marché francophone africain (Cameroun principalement) avec support natif du mobile money (Orange Money, MTN Mobile Money).

---

## Stack Technique

### Frontend

| Technologie         | Usage                                   | Version |
| ------------------- | --------------------------------------- | ------- |
| **Next.js**         | Framework React (App Router, Turbopack) | 16.x    |
| **React**           | Bibliothèque UI                         | 19.x    |
| **TypeScript**      | Typage statique (mode strict)           | 5.x     |
| **Tailwind CSS**    | Styling (OKLCH colors)                  | 4.x     |
| **shadcn/ui**       | Composants UI (CVA + Radix)             | Latest  |
| **Motion**          | Animations                              | 12.x    |
| **React Hook Form** | Gestion des formulaires                 | 7.x     |
| **Zod**             | Validation côté client                  | 3.x     |
| **Recharts**        | Graphiques (dashboard)                  | 3.x     |
| **Lucide React**    | Icônes                                  | Latest  |

### Backend & Services

| Service       | Usage                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| **Convex**    | Backend real-time (queries, mutations, actions, HTTP endpoints, crons) |
| **Clerk**     | Authentification (OAuth, Email/Password, JWT tokens)                   |
| **Bunny CDN** | Stockage images (HTTP Actions) + streaming vidéo (XHR direct)          |
| **CinetPay**  | Paiements mobile money africains (webhooks via Convex HTTP Actions)    |
| **Stripe**    | Paiements carte bancaire (webhooks via Convex HTTP Actions)            |
| **Sentry**    | Monitoring et tracking d'erreurs                                       |
| **Resend**    | Envoi d'emails transactionnels                                         |

### DevOps & Qualité

| Outil          | Usage                                         |
| -------------- | --------------------------------------------- |
| **Vercel**     | Hosting & déploiement continu                 |
| **Vitest**     | Tests unitaires (happy-dom + convex-test)     |
| **Playwright** | Tests E2E (Clerk auth, Page Object Model)     |
| **ESLint**     | Linting (zero warnings policy)                |
| **Prettier**   | Formatage (sans semi-colons, tri des imports) |

---

## Démarrage Rapide

### Prérequis

- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- Un compte [Convex](https://convex.dev/)
- Un compte [Clerk](https://clerk.com/)

### Installation

1. **Cloner le repository**

```bash
git clone https://github.com/RinKhimera/fantribe.git
cd fantribe
```

2. **Installer les dépendances**

```bash
bun install
```

3. **Configuration de l'environnement**

Créez un fichier `.env.local` à la racine :

```env
# Backend Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Authentification Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up

# CinetPay (Mobile Money)
NEXT_PUBLIC_CINETPAY_SITE_ID=
NEXT_PUBLIC_CINETPAY_API_KEY=

# Stripe (Cartes) — STRIPE_WEBHOOK_SECRET dans le dashboard Convex
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=

# Email
RESEND_API_KEY=

# Bunny CDN — Tous les secrets dans le dashboard Convex uniquement :
# BUNNY_STORAGE_ZONE, BUNNY_STORAGE_PASSWORD, BUNNY_CDN_HOSTNAME,
# BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY, BUNNY_URL_TOKEN_KEY
```

4. **Initialiser Convex**

```bash
bunx convex dev
```

5. **Lancer le serveur de développement**

```bash
bun dev
```

6. **Ouvrir** [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Client (Next.js 16 App Router + React 19)          │
│  ├── Turbopack (dev)                                │
│  ├── proxy.ts (middleware Next.js 16)                │
│  └── Clerk (auth côté client)                       │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  Convex Backend (real-time)                         │
│  ├── Queries (lectures réactives)                   │
│  ├── Mutations (écritures transactionnelles)        │
│  ├── Actions (appels externes)                      │
│  ├── HTTP Actions (webhooks Stripe/CinetPay/Bunny)  │
│  ├── Crons (expiration abonnements, queue notifs)   │
│  └── Rate Limiter                                   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  Services Externes                                  │
│  ├── Clerk (Auth, webhooks)                         │
│  ├── Bunny CDN (images + vidéo streaming)           │
│  ├── CinetPay (mobile money OM/MOMO)                │
│  ├── Stripe (cartes, Apple/Google Pay)              │
│  ├── Sentry (monitoring)                            │
│  └── Resend (emails)                                │
└─────────────────────────────────────────────────────┘
```

---

## Structure du Projet

```
fantribe/
├── app/                              # Next.js App Router
│   ├── (app-pages)/                  # Routes authentifiées (dashboard layout)
│   │   ├── (superuser)/superuser/    # Admin (stats, modération, transactions)
│   │   ├── [username]/               # Profil utilisateur dynamique
│   │   ├── account/                  # Paramètres du compte
│   │   ├── be-creator/               # Candidature créateur
│   │   ├── collections/              # Collections de posts
│   │   ├── dashboard/                # Dashboard créateur
│   │   ├── explore/                  # Découverte de créateurs
│   │   ├── messages/                 # Messagerie
│   │   ├── new-post/                 # Création de post
│   │   ├── notifications/            # Centre de notifications
│   │   ├── payment/                  # Pages de paiement
│   │   └── subscriptions/            # Gestion abonnements
│   ├── (auth)/                       # Sign-in, Sign-up (Clerk)
│   ├── (legal)/                      # Pages légales
│   ├── api/bunny/                    # Bunny presign route (webhooks → Convex HTTP Actions)
│   ├── onboarding/                   # Onboarding 3 étapes
│   └── welcome/                      # Page de bienvenue post-onboarding
│
├── components/
│   ├── domains/                      # Composants par domaine métier
│   │   ├── account/                  # Paramètres compte
│   │   ├── creators/                 # Créateurs
│   │   ├── dashboard/                # Dashboard stats
│   │   ├── messaging/                # Chat & conversations
│   │   ├── notifications/            # Notifications
│   │   ├── payment/                  # Flux de paiement
│   │   ├── posts/                    # Posts & interactions
│   │   ├── subscriptions/            # Abonnements
│   │   ├── tips/                     # Pourboires
│   │   └── users/                    # Profils, follow button
│   ├── post-composer/                # Compound components (Provider + Frame + Input + Media + Actions + Submit)
│   ├── new-post/                     # Flux de création de post
│   ├── home/                         # Fil d'actualité
│   ├── explore/                      # Page explore
│   ├── be-creator/                   # Candidature créateur
│   ├── superuser/                    # Panel admin
│   ├── onboarding/                   # Étapes d'onboarding
│   ├── collections/                  # Collections
│   ├── layout/                       # App shell, sidebar, nav
│   ├── legal/                        # Pages légales
│   ├── shared/                       # Composants partagés (stepper, post-media, etc.)
│   └── ui/                           # shadcn/ui (CVA + Radix primitives)
│
├── convex/                           # Backend Convex
│   ├── schema.ts                     # Modèle de données complet
│   ├── http.ts                       # HTTP Actions (Bunny, CORS, webhooks)
│   ├── stripeWebhook.ts             # Webhook Stripe (signature SDK)
│   ├── cinetpayWebhook.ts           # Webhook CinetPay (HMAC-SHA256)
│   ├── internalActions.ts           # Actions internes (processPaymentAtomic, etc.)
│   ├── users.ts                      # Utilisateurs & onboarding
│   ├── posts.ts                      # Publications & feed
│   ├── subscriptions.ts             # Abonnements
│   ├── transactions.ts              # Paiements
│   ├── tips.ts                       # Pourboires
│   ├── follows.ts                    # Système de follow
│   ├── messaging.ts                  # Messagerie
│   ├── notifications.ts             # Notifications
│   ├── notificationQueue.ts         # Fan-out notifications (batch)
│   ├── comments.ts                   # Commentaires
│   ├── likes.ts                      # Likes
│   ├── blocks.ts                     # Blocage utilisateurs
│   ├── bans.ts                       # Bannissements
│   ├── reports.ts                    # Signalements
│   ├── bookmarks.ts                  # Favoris
│   ├── creatorApplications.ts       # Candidatures créateur
│   ├── dashboard.ts                  # Stats dashboard
│   ├── superuser.ts                  # Fonctions admin
│   ├── userStats.ts                  # Statistiques utilisateur
│   ├── crons.ts                      # Tâches planifiées
│   ├── files.ts                      # Gestion fichiers
│   ├── validationDocuments.ts       # Documents de validation
│   ├── assetsDraft.ts               # Brouillons médias
│   └── lib/                          # Modules partagés
│       ├── auth.ts                   # getAuthenticatedUser(), requireCreator(), requireSuperuser()
│       ├── errors.ts                 # createAppError() — erreurs bilingues
│       ├── validators.ts            # Validators partagés
│       ├── notifications.ts         # Service central de notifications
│       ├── constants.ts             # Constantes métier (commissions, limites)
│       ├── subscriptions.ts         # canViewSubscribersOnlyContent()
│       ├── rateLimiter.ts           # Rate limiting
│       ├── bunny.ts                  # Intégration Bunny CDN
│       ├── signedUrls.ts            # URLs signées
│       ├── blocks.ts                 # Helpers blocage
│       ├── batch.ts                  # Batch processing
│       └── messaging.ts             # Helpers messagerie
│
├── hooks/                            # 12 custom React hooks
│   ├── useCurrentUser.ts            # Utilisateur courant
│   ├── useBunnyUpload.ts            # Upload média Bunny CDN
│   ├── useCinetpayPayment.ts        # Paiement CinetPay
│   ├── useDebounce.ts               # Debounce pour recherche
│   ├── useDialogState.ts            # État des dialogs
│   ├── useInfiniteScroll.ts         # Scroll infini
│   ├── useMessagesPagination.ts     # Pagination messages
│   ├── usePresence.ts               # Présence en ligne
│   ├── useSuperuserFilters.ts       # Filtres admin
│   └── ...
│
├── lib/
│   ├── config/                       # env.client.ts, env.ts, logger.ts
│   ├── formatters/                   # date/ (locale FR) + currency/ (XAF/USD)
│   ├── services/                     # stripe.ts, cinetpay.ts
│   ├── animations.ts                # Variants Motion
│   ├── constants.ts                  # Constantes frontend
│   └── utils.ts                      # cn() utility
│
├── schemas/                          # Schémas Zod (validation formulaires)
├── types/                            # Types TS partagés (PostMedia, MessageProps, TipContext, etc.)
├── tests/
│   ├── frontend/                     # Vitest + happy-dom + @testing-library
│   ├── convex/                       # Vitest + convex-test (node env)
│   └── helpers/                      # Utilitaires de test
│
└── e2e/                              # Tests E2E Playwright
    ├── pages/                        # Page Object Model (1 classe/page)
    ├── tests/                        # 15 specs (feed, profile, dashboard, etc.)
    └── helpers/                      # Sélecteurs & utilitaires
```

---

## Paiements

### Providers Supportés

#### CinetPay (Primaire — Mobile Money)

- Orange Money, MTN Mobile Money, Moov Money, Wave
- Webhook traité via Convex HTTP Actions (`cinetpayWebhook.ts`) avec HMAC-SHA256 + `crypto.timingSafeEqual`

#### Stripe (Secondaire — Cartes)

- Visa/Mastercard, Apple Pay, Google Pay
- Webhook traité via Convex HTTP Actions (`stripeWebhook.ts`) avec signature SDK
- Tips dynamiques via `price_data` (pas de `STRIPE_PRICE_ID` fixe)

### Tarification

- **Abonnement** : 1 000 XAF/mois (~1.50 €)
- **Tips** : min 500 XAF, presets 500 / 1 000 / 2 500 / 5 000 / 10 000 XAF + montant libre
- **Commission** : 70% créateur / 30% plateforme

### Gestion des Abonnements

- **Durée** : 30 jours
- **Renouvellement** : Manuel (pas d'auto-renewal pour mobile money)
- **Types** : `content_access` (contenu exclusif) + `messaging_access` (DMs)
- **Statuts** : `pending` → `active` → `expired` / `canceled`
- **Traitement idempotent** via `providerTransactionId` (index unique)

### Devise

- **Primaire** : XAF (zero-decimal) — `1 000 XAF`
- **Secondaire** : USD (Stripe) — taux de conversion : 1 USD = 562.2 XAF

---

## Authentification & Sécurité

### Clerk Authentication

- **Méthodes** : Email/Mot de passe, OAuth (Google, Facebook)
- **Localisation** : Interface en français (`frFR`)
- **Onboarding** : Flow 3 étapes (Identité → À propos → Préférences)
- **Token Exchange** : Convex ↔ Clerk via JWT (`template: "convex"`)

### Types d'Utilisateurs

```typescript
accountType: "USER" | "CREATOR" | "SUPERUSER"
```

- **USER** : Utilisateur standard (peut s'abonner, suivre, donner des tips)
- **CREATOR** : Créateur vérifié (reçoit abonnements et tips, badge vérifié)
- **SUPERUSER** : Administrateur (dashboard admin, modération)

### Mesures de Sécurité

- Validation Zod côté client + Convex validators côté backend
- Authentification requise pour toutes les mutations (`getAuthenticatedUser()`)
- Vérification des permissions par accountType (`requireCreator()`, `requireSuperuser()`)
- Rate limiting via `@convex-dev/rate-limiter`
- Filtrage des utilisateurs bloqués
- Erreurs bilingues (`createAppError()` — interne en anglais, `userMessage` en français)
- Webhooks sécurisés (Stripe SDK verification, CinetPay HMAC-SHA256 + timing-safe compare)

---

## Tests

```bash
# Tous les tests
bun run test

# Watch mode
bun run test:watch

# Tests Convex uniquement
bun run test:convex

# Couverture
bun run test:coverage

# Tests E2E (Playwright)
bun run test:e2e
```

- **Frontend** : Vitest + happy-dom + `@testing-library/react`
- **Backend** : Vitest + `convex-test` (environnement node)
- **E2E** : Playwright + `@clerk/testing/playwright` — Page Object Model, 3 rôles auth (user, creator, admin)

---

## Commandes

| Commande                | Description                          |
| ----------------------- | ------------------------------------ |
| `bun dev`               | Serveur de développement (Turbopack) |
| `bun run build`         | Build de production                  |
| `bun run check`         | TypeScript + ESLint (zero warnings)  |
| `bun run lint`          | ESLint (zero warnings)               |
| `bun run lint:fix`      | ESLint auto-fix                      |
| `bun run format`        | Prettier format all                  |
| `bun run format:check`  | Prettier check formatting            |
| `bun run test`          | Tous les tests (frontend + convex)   |
| `bun run test:watch`    | Tests en mode watch                  |
| `bun run test:convex`   | Tests Convex uniquement              |
| `bun run test:coverage` | Rapports de couverture               |
| `bun run test:e2e`      | Tests E2E (Playwright)               |
| `bunx convex dev`       | Convex dev + régénération des types  |
| `bunx convex deploy`    | Déploiement Convex en production     |

---

## Déploiement

### Vercel (Recommandé)

1. Push sur GitHub
2. Importer dans Vercel, configurer les variables d'environnement
3. Configurer les webhooks :
   - **Stripe** → `https://<convex-deployment>.convex.site/stripe`
   - **CinetPay** → URLs dérivées automatiquement de `NEXT_PUBLIC_CONVEX_URL`
   - **Clerk** → Route API Next.js standard

### Convex Production

```bash
bunx convex deploy
```

Configurer toutes les variables d'environnement dans le dashboard Convex (Bunny CDN, Stripe webhook secret, etc.).

---

## Contributing

Les contributions sont les bienvenues !

1. **Fork** le projet
2. **Créer** une branche : `git checkout -b feature/MaFonctionnalité`
3. **Commit** : `git commit -m 'Add: description de la fonctionnalité'`
4. **Push** : `git push origin feature/MaFonctionnalité`
5. **Ouvrir** une Pull Request

### Conventions

- Code en TypeScript strict
- UI en français
- Pas de semi-colons (Prettier)
- Responsive design obligatoire
- Tester localement avant PR (`bun run check && bun run test`)

---

## License

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## Auteur

<div align="center">
  <img src="https://github.com/RinKhimera.png" width="100" style="border-radius: 50%">

**Samuel Pokam**

Développeur Full Stack

[![GitHub](https://img.shields.io/badge/GitHub-RinKhimera-181717?style=for-the-badge&logo=github)](https://github.com/RinKhimera)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Samuel_Pokam-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/samuel-pokam)
[![Twitter](https://img.shields.io/badge/Twitter-@RinKhimera-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/RinKhimera)
[![Portfolio](https://img.shields.io/badge/Portfolio-samuelpokam.dev-FF5722?style=for-the-badge&logo=google-chrome)](https://samuelpokam.com)

</div>

---

<div align="center">

**FanTribe** — Construire une communauté, monétiser sa passion.

</div>
