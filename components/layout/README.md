# Layout System - Documentation

## Architecture

Le système de layout de FanTribe utilise une architecture modulaire à 3 colonnes inspirée des réseaux sociaux modernes (Twitter/X, OnlyFans, Facebook).

```
┌─────────────────────────────────────────────────────────────┐
│                     max-w: 1280px                           │
├──────────────┬────────────────────────┬────────────────────┤
│   LeftSidebar│     Main Content       │   RightSidebar     │
│   (nav)      │     (PageContainer)    │   (contextuel)     │
│              │                        │                    │
│   - Logo     │   - PageHeader         │   - Recherche      │
│   - Nav links│   - Content            │   - Suggestions    │
│   - Publish  │                        │   - Abonnement     │
│   - Profile  │                        │                    │
│              │                        │                    │
│   sticky     │   scrollable           │   sticky           │
│   20-260px   │   50-80% width         │   280-380px        │
├──────────────┴────────────────────────┴────────────────────┤
│              MobileNavigation (bottom bar < 500px)          │
└─────────────────────────────────────────────────────────────┘
```

## Composants

### `AppLayout`

Layout principal englobant les 3 colonnes. Utilisé dans le layout racine de l'app.

```tsx
<AppLayout currentUser={user} variant="default">
  {children}
</AppLayout>
```

**Props:**

- `variant`: `"default"` | `"wide"` | `"full"` - Type de layout
- `hideRightSidebar`: Masquer la sidebar droite même en mode default

### `PageContainer`

Conteneur pour le contenu de chaque page avec header sticky optionnel.

```tsx
// Page standard
<PageContainer title="Accueil">
  <Feed />
</PageContainer>

// Page sans header (header personnalisé)
<PageContainer hideHeader>
  <CustomHeader />
  <Content />
</PageContainer>

// Page élargie (messages, user-lists)
<PageContainer variant="wide" title="Messages">
  <MessagesList />
</PageContainer>
```

**Props:**

- `title`: Titre affiché dans le header
- `headerContent`: Contenu custom pour le header
- `headerActions`: Boutons à droite du header
- `variant`: `"default"` | `"wide"` | `"full"`
- `hideHeader`: Masquer le header

### `SplitPanelLayout`

Layout spécial pour pages à deux panneaux (messages, user-lists).

```tsx
<SplitPanelLayout title="Messages" navigationPanel={<ConversationsList />}>
  <ConversationContent />
</SplitPanelLayout>
```

### `PageHeader`

Header sticky réutilisable.

```tsx
<PageHeader title="Notifications" actions={<MarkAllReadButton />} />
```

## CSS Variables (Design Tokens)

Les dimensions sont centralisées dans `globals.css`:

```css
:root {
  /* Layout Container */
  --layout-max-width: 1280px;
  --layout-gap: 0;

  /* Left Sidebar */
  --sidebar-left-width: clamp(72px, 20vw, 260px);
  --sidebar-left-padding: 0.5rem;

  /* Right Sidebar */
  --sidebar-right-width: clamp(280px, 28vw, 380px);
  --sidebar-right-padding: 1.5rem;

  /* Split Panel */
  --content-split-nav-width: 40%;
  --content-split-main-width: 60%;

  /* Header */
  --header-height: 64px;
  --header-padding: 1rem;

  /* Mobile Navigation */
  --mobile-nav-height: 64px;
}
```

**Note:** Le contenu principal remplit automatiquement l'espace entre les sidebars grâce à `flex-1`. Pas besoin de définir des largeurs fixes.

## Responsive Breakpoints

| Breakpoint | Comportement                                 |
| ---------- | -------------------------------------------- |
| < 500px    | Mobile: sidebar cachée, bottom nav visible   |
| 500-1024px | Tablet: sidebar gauche icônes, droite cachée |
| > 1024px   | Desktop: toutes sidebars visibles            |

## Exemples d'utilisation

### Page standard (feed, notifications, etc.)

```tsx
// components/home/main-layout.tsx
export const MainLayout = () => {
  return (
    <PageContainer title="Accueil">
      <CreatePost />
      <NewsFeed />
    </PageContainer>
  )
}
```

### Page profil (header custom)

```tsx
// components/profile/user-profile-layout.tsx
export const UserProfileLayout = ({ userProfile }) => {
  return (
    <PageContainer hideHeader>
      <header className="sticky top-0 z-20 ...">
        <h1>{userProfile.name}</h1>
      </header>
      <ProfileBanner />
      <ProfileContent />
    </PageContainer>
  )
}
```

### Page messages (split layout)

```tsx
// components/messages/conversation-layout.tsx
export const ConversationLayout = () => {
  return (
    <SplitPanelLayout title="Messages" navigationPanel={<ConversationsList />}>
      <EmptyConversation />
    </SplitPanelLayout>
  )
}
```

## Migration depuis l'ancien système

L'ancien système utilisait `ResponsiveLayout` et des classes répétées dans chaque composant:

```tsx
// ❌ Ancien
<main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-[500px]:pb-16 max-lg:w-[80%] max-sm:w-full">
  <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
    Titre
  </h1>
  {/* contenu */}
</main>

// ✅ Nouveau
<PageContainer title="Titre">
  {/* contenu */}
</PageContainer>
```

Les fichiers suivants de `components/shared/` sont désormais dépréciés:

- `responsive-layout.tsx` → Remplacé par `components/layout/app-layout.tsx`
- `left-sidebar.tsx` → Remplacé par `components/layout/left-sidebar.tsx`
- `right-sidebar-router.tsx` → Remplacé par `components/layout/right-sidebar.tsx`
- `mobile-menu.tsx` → Remplacé par `components/layout/mobile-navigation.tsx`
