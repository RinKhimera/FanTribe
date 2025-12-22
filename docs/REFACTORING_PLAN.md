# Plan de Refactoring FanTribe

## ✅ Statut d'Implémentation - COMPLET

> **Dernière mise à jour :** 22 décembre 2025

### ✅ Étape 1 : Modularisation Convex + Erreurs personnalisées

**Fichiers créés :**

- [convex/lib/errors.ts](../convex/lib/errors.ts) - Système d'erreurs personnalisées avec messages bilingues (FR/EN)
- [convex/lib/auth.ts](../convex/lib/auth.ts) - Helpers d'authentification (`getAuthenticatedUser`, `requireCreator`, `requireSuperuser`)
- [convex/lib/blocks.ts](../convex/lib/blocks.ts) - Helpers pour la gestion des blocages
- [convex/lib/subscriptions.ts](../convex/lib/subscriptions.ts) - Helpers pour les abonnements
- [convex/lib/notifications.ts](../convex/lib/notifications.ts) - Helpers pour le fan-out de notifications
- [convex/lib/index.ts](../convex/lib/index.ts) - Export centralisé
- [lib/errors/client.ts](../lib/errors/client.ts) - Utilitaires client pour extraire les messages d'erreur français
- [lib/errors/index.ts](../lib/errors/index.ts) - Export centralisé

**Exemple d'utilisation :**

```typescript
// Avant (15+ lignes)
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new ConvexError("Not authenticated")
const user = await ctx.db.query("users").withIndex("by_tokenIdentifier", ...).unique()
if (!user) throw new ConvexError("User not found")

// Après (1 ligne)
import { getAuthenticatedUser, createAppError } from "./lib"
const user = await getAuthenticatedUser(ctx)
```

**Gestion d'erreurs bilingues :**

```typescript
// Côté Client
import { getUserErrorMessage } from "@/lib/errors"

// Côté Convex
throw createAppError("UNAUTHORIZED", {
  userMessage: "Vous n'êtes pas autorisé",
  context: { userId: user._id.toString() },
})

toast.error(getUserErrorMessage(error)) // "Vous n'êtes pas autorisé"
```

### ✅ Étape 2 : Optimisation Pagination avec usePaginatedQuery

**Fichiers mis à jour :**

- [components/domains/posts/news-feed.tsx](../components/domains/posts/news-feed.tsx) - Version optimisée avec `usePaginatedQuery`
- [convex/posts.ts](../convex/posts.ts) - Queries refactorées avec `paginationOptsValidator`

**Avantages :**

- Suppression de ~50 lignes de code de gestion manuelle de pagination
- Meilleure réactivité (Convex gère automatiquement les mises à jour)
- Gestion simplifiée des états de chargement (`LoadingFirstPage`, `CanLoadMore`, `Exhausted`)

**Note :** La migration v2 a été appliquée - les fichiers `posts-v2.ts` et `news-feed-v2.tsx` ont été intégrés.

### ✅ Étape 3 : Système de Fan-out Résilient

**Fichiers créés :**

- [convex/notificationQueue.ts](../convex/notificationQueue.ts) - Système de queue persistante pour fan-out
- [convex/schema.ts](../convex/schema.ts) - Table `pendingNotifications` ajoutée

**Architecture implémentée (Queue persistante) :**

- Table `pendingNotifications` pour stocker les batches de notifications
- Cron job toutes les minutes pour traiter la queue (`process-notification-queue`)
- Retry automatique (max 3 tentatives)
- Nettoyage automatique des entrées > 7 jours (`cleanup-notification-batches`)

**Pourquoi cette approche :**

- ✅ Résiliente aux erreurs (retry automatique)
- ✅ Monitorable (statistiques de queue)
- ✅ Scalable (batching automatique)
- ✅ Traçable (historique des traitements)

---

## 📋 Étape 4 : Réorganisation des Composants (À Choisir)

### Option A : Feature-Based Structure (Recommandée)

```
components/
├── features/
│   ├── posts/
│   │   ├── components/
│   │   │   ├── post-card.tsx
│   │   │   ├── post-form.tsx
│   │   │   └── post-media.tsx
│   │   ├── hooks/
│   │   │   └── use-post-actions.ts
│   │   └── index.ts
│   ├── messaging/
│   │   ├── components/
│   │   │   ├── chat-window.tsx
│   │   │   └── message-bubble.tsx
│   │   ├── hooks/
│   │   │   └── use-messages.ts
│   │   └── index.ts
│   └── subscriptions/
│       ├── components/
│       │   ├── subscription-dialog.tsx
│       │   └── subscription-badge.tsx
│       └── index.ts
├── ui/           # Composants atomiques (Button, Input, etc.)
├── layout/       # Layout components (Sidebar, Header, etc.)
└── shared/       # Composants partagés cross-features
```

**Avantages :**

- Forte cohésion par domaine métier
- Facilite le code splitting par feature
- Meilleure isolation pour les tests

**Inconvénients :**

- Migration plus longue
- Peut créer des dépendances circulaires si mal géré

---

### Option B : Atomic Design

```
components/
├── atoms/        # Button, Input, Icon, Avatar
├── molecules/    # SearchBar, UserCard, MediaPreview
├── organisms/    # PostCard, ChatWindow, Navbar
├── templates/    # PageLayout, ProfileLayout
└── pages/        # (Reste dans app/)
```

**Avantages :**

- Hiérarchie claire basée sur la complexité
- Facile à comprendre pour les nouveaux développeurs
- Bon pour les design systems

**Inconvénients :**

- Moins adapté à la logique métier complexe
- Peut mener à des dossiers "fourre-tout"

---

### Option C : Colocation avec Routes (Next.js 15 Pattern)

```
app/
├── (app-pages)/
│   ├── page.tsx
│   ├── _components/          # Composants spécifiques à cette route
│   │   ├── news-feed.tsx
│   │   └── create-post.tsx
│   ├── [username]/
│   │   ├── page.tsx
│   │   └── _components/
│   │       └── profile-header.tsx
│   └── messages/
│       ├── page.tsx
│       └── _components/
│           └── chat-window.tsx
components/
├── ui/           # Composants atomiques partagés
└── shared/       # Composants partagés globaux
```

**Avantages :**

- Pattern officiel Next.js (colocation)
- Chaque route a ses composants à côté
- Facile de trouver les composants d'une page

**Inconvénients :**

- Duplication potentielle si composants partagés entre routes
- `_components` peut devenir grand

---

### Option D : Hybrid (Feature + UI Layer)

```
components/
├── ui/                    # Shadcn/ui + composants atomiques
├── layout/                # Structure de page
├── domains/               # Par domaine métier
│   ├── posts/
│   ├── messaging/
│   ├── subscriptions/
│   └── notifications/
└── shared/                # Cross-domain (PostCard utilisé partout)
    ├── post-card/
    ├── user-avatar/
    └── media-player/
```

**Avantages :**

- Équilibre entre organisation métier et technique
- Clair pour distinguer UI générique vs logique métier
- Facile à migrer progressivement

---

## ✅ Étape 4 : Réorganisation des Composants (Option D)

**Structure implémentée :**

```
components/
├── ui/                    # Shadcn/ui + composants atomiques
├── layout/                # Structure de page (PageContainer, etc.)
├── domains/               # Par domaine métier
│   ├── posts/             # NewsFeed, CreatePost, CommentFeed, etc.
│   ├── messaging/         # ConversationLayout, MessageForm, etc.
│   ├── subscriptions/     # SubscriptionDialog, SubscriptionModal
│   ├── notifications/     # NotificationLayout, NotificationItem
│   ├── users/             # UserProfile, EditProfile, UserGallery
│   └── creators/          # (réservé pour futures fonctionnalités)
├── shared/                # Cross-domain (PostCard, UserAvatar, etc.)
├── home/                  # MainLayout
├── explore/               # ExploreLayout
├── collections/           # CollectionsLayout
├── new-post/              # NewPostLayout
└── superuser/             # Admin components
```

**Imports :**

```typescript
// Avant
import { NewsFeed } from "@/components/home/news-feed"
import { SubscriptionDialog } from "@/components/profile/subscription-dialog"

// Après
import { NewsFeed, CreatePost } from "@/components/domains/posts"
import { SubscriptionDialog } from "@/components/domains/subscriptions"
import { UserProfileLayout } from "@/components/domains/users"
```

---

## 📊 Résumé des Changements

| Métrique                 | Avant                 | Après                       |
| ------------------------ | --------------------- | --------------------------- |
| Lignes de code auth/user | ~15 lignes/mutation   | 1 ligne                     |
| Gestion erreurs          | Incohérente           | Messages FR/EN centralisés  |
| Pagination (NewsFeed)    | ~80 lignes manuel     | ~30 lignes avec hook        |
| Fan-out > 200 users      | Fire & forget         | Queue + retry + monitoring  |
| Organisation composants  | Par page (flat)       | Par domaine métier          |
| Tests                    | Difficiles (couplage) | Helpers testables isolément |

## 📝 Notes de Migration

- Les anciens dossiers (`components/messages/`, `components/notifications/`, etc.) ont été supprimés
- Tous les imports ont été mis à jour pour utiliser `@/components/domains/*`
- La query `getHomePosts` retourne maintenant `{ page, continueCursor, isDone }` au lieu de `{ posts, ... }`
- Les tests ont été mis à jour pour utiliser `paginationOptsValidator`
