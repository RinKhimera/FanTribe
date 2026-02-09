# FanTribe AI Coding Instructions

## Architecture Overview

**FanTribe** is a French creator-focused social media platform built with Next.js 15, Convex (realtime backend), Clerk (auth), and TailwindCSS. The app supports subscription-based content access, messaging, and creator verification workflows.

### Key Architecture Patterns

- **Convex Backend**: All database operations, real-time subscriptions, and server functions use Convex. Never write traditional API routes for data operations (exceptions: webhooks at `/api/notification`, `/api/stripe`).
- **Route Groups**: App uses Next.js route groups: `(app-pages)` for authenticated content, `(auth)` for sign-in/up flows, `(superuser)` for admin functions
- **Authentication Flow**: Clerk → Convex token exchange → user lookup via `tokenIdentifier` (see `convex/auth.config.ts`)
- **French Localization**: All UI text and user-facing content MUST be in French

## Essential Development Workflows

### Running the Project

```bash
npm run dev          # Start with Turbopack (default)
npm run build-check  # Type check + lint before build
npm run fix-lint     # Auto-fix ESLint issues
```

### Environment Variables Required

```env
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up

# Bunny CDN — All secrets managed in Convex dashboard only
# See Convex env vars: BUNNY_STORAGE_ZONE, BUNNY_STORAGE_PASSWORD,
# BUNNY_CDN_HOSTNAME, BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY, BUNNY_URL_TOKEN_KEY

# CinetPay (African payment processor)
NEXT_PUBLIC_CINETPAY_SITE_ID=
NEXT_PUBLIC_CINETPAY_API_KEY=

# Stripe (card payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Email
RESEND_API_KEY=
```

### Convex Integration Patterns

- Use `useMutation(api.module.function)` for write operations
- Use `useQuery(api.module.function, args)` for real-time data
- Skip queries when not authenticated: `useQuery(api.fn, isAuthenticated ? args : "skip")`
- Internal functions for webhooks/background jobs use `internalMutation` and `internalAction`

## Critical Patterns & Conventions

### Component Architecture

```tsx
"use client"

// Required for Convex hooks
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export const MyComponent = () => {
  const { currentUser, isLoading } = useCurrentUser() // Standard auth hook

  // Handle loading state
  if (isLoading) return <Loader />

  // Component logic with real-time data
  const data = useQuery(api.module.function, currentUser ? { args } : "skip")
}
```

### User Authentication & Routing

- **Protected Routes**: All routes under `(app-pages)` require completed username (enforced in `app/(app-pages)/layout.tsx`)
- **Onboarding Flow**: Incomplete profiles (no username) redirect to `/onboarding`
- **Auth Hook**: Always use `useCurrentUser()` hook, NOT direct Clerk hooks
- **Account Types**: `USER` (default) → `CREATOR` (subscription enabled) → `SUPERUSER` (admin)
- **Proxy**: Public routes defined in `proxy.ts` - `/auth/*`, `/api/*`, `/payment/*`

### Data Access Patterns

```tsx
// Mutations with proper error handling
import { logger } from "@/lib/logger"

// Real-time subscriptions (auto-updates on changes)
const posts = useQuery(api.posts.getAllPosts, { limit: 20 })

const createPost = useMutation(api.posts.createPost)
try {
  const result = await createPost({ content, medias, visibility })
  logger.success("Post created", { postId: result.postId })
  toast.success("Post créé avec succès")
} catch (error) {
  logger.error("Post creation failed", error, { contentLength: content.length })
  toast.error("Erreur lors de la création", {
    description: error instanceof Error ? error.message : "Erreur inconnue",
  })
}
```

### Error Handling & Logging

- **Logger**: Use `lib/logger.ts` for structured logging (see `lib/LOGGER_GUIDE.md`)
- **Pattern**: Always log errors with context (user IDs, operation names, relevant data)
- **Toast Messages**: User-facing messages in French, log messages in English
- **Example**: See `components/profile/subscription-dialog.tsx` for reference implementation

```tsx
import { logger } from "@/lib/logger"

try {
  await someOperation()
} catch (error) {
  logger.error("Operation failed", error, {
    userId: currentUser._id,
    operation: "operationName",
  })

  toast.error("L'opération a échoué", {
    description: error instanceof Error ? error.message : "Erreur inconnue",
  })
}
```

### Media Handling (Bunny CDN via Convex)

- **Architecture**: All Bunny operations go through Convex HTTP Actions (`convex/http.ts`). No Bunny secrets in client code.
- **Images**: Upload via `convex.site/api/bunny/upload-image` (Convex proxies to Bunny Storage)
- **Videos**: Hybrid — get upload token from `convex.site/api/bunny/upload-video`, then browser uploads directly to Bunny Stream
- **Client Hook**: Use `useBunnyUpload()` from `@/hooks` for all uploads/deletes
- **Server Module**: `convex/lib/bunny.ts` centralizes all Bunny API calls
- **User Collections**: Videos organized per-user via `getOrCreateUserCollection` in `convex/lib/bunny.ts`
- **Upload Flow**:
  1. Upload via `useBunnyUpload().uploadMedia()` → get `mediaId` and `url`
  2. Create draft in `assetsDraft` table via `convex/assetsDraft.ts`
  3. Publish by adding URL to post's `medias` array
- **Video Metadata**: Fetch via `convex.site/api/bunny/metadata` (authenticated) using video GUIDs
- **File Naming**: `userId/{randomSuffix}.{extension}` for all uploads
- **Deletion**: Use `useBunnyUpload().deleteMedia()`, cleanup drafts in Convex

### Database Schema (Convex)

Key tables in `convex/schema.ts`:

- `users`: Core user data, `accountType` (USER/CREATOR/SUPERUSER), `isOnline`, `lastSeenAt`
- `posts`: `author`, `content`, `medias[]`, `visibility` (public/subscribers_only)
- `subscriptions`: `subscriber`, `creator`, `type` (content_access/messaging_access), `status` (active/expired/canceled/pending)
- `messages`: `conversation`, `sender`, `messageType` (text/image/video)
- `notifications`: `recipientId`, `sender`, `type`, `read`, optional `post`/`comment` refs
- `blocks`: `blockerId`, `blockedId` (prevents interactions)
- `assetsDraft`: Temporary storage for uploaded media before post creation

## Project-Specific Patterns

### Subscription System

- **Dual Payment Providers**: CinetPay (OM/MOMO) and Stripe (cards) for 1000 XAF/month
- **Subscription Types**: `content_access` (view posts) and `messaging_access` (DMs)
- **Status Flow**: `pending` → `active` → `expired` (auto-expires after 30 days) or `canceled` (user initiated)
- **Visibility Logic**: `subscribers_only` posts filter by active subscriptions (see `convex/posts.ts`)
- **Renewal Flow**: Frontend checks `canUserSubscribe` (see `convex/subscriptions.ts`) before showing subscribe/renew dialogs
- **Example**: `components/profile/subscription-dialog.tsx` handles all subscription UI flows

### Notification System

- **Fan-out Pattern**: Direct insert for <200 subscribers, deferred background processing for large audiences (see `convex/posts.ts`)
- **Types**: `new_post`, `like`, `comment`, `follow`, `subscription`
- **Blocking**: Queries filter out notifications between blocked users via `blocks` table
- **Real-time**: Uses Convex subscriptions for instant updates (see `convex/notifications.ts`)

### Creator Verification

- **Application Flow**: Submit via `convex/creatorApplications.ts` with identity docs
- **Status**: `pending` → `approved`/`rejected` (admin review in superuser panel)
- **Identity Documents**: Upload via Bunny CDN, stored in `identityDocuments` array
- **Auto-upgrade**: On approval, `accountType` changes from `USER` to `CREATOR`

### Payment Integration

- **CinetPay (Primary)**: African mobile money (Orange Money, MTN Mobile Money)
  - Webhook: `/app/api/notification/route.ts` receives payment notifications
  - Test Mode: Bypasses verification in development (`console.log("🧪 TEST MODE")`)
  - Transaction ID stored in `transactions` table with `providerTransactionId`
- **Stripe (Secondary)**: Card payments for international users
  - Webhook: `/app/api/stripe/route.ts` handles `checkout.session.completed`
  - Both call `api.internalActions.processPayment` to activate subscriptions

### Cron Jobs (Convex Scheduled Tasks)

Defined in `convex/crons.ts`:

- **check-expired-subscriptions**: Daily at 00:00 UTC
  - Checks subscriptions past `endDate` and updates status from `active` → `expired`
  - Function: `internal.subscriptions.checkAndUpdateExpiredSubscriptions`
- **clean-draft-assets**: Daily at 03:00 UTC
  - Removes orphaned media in `assetsDraft` table (uploads never used in posts)
  - Function: `internal.assetsDraft.cleanUpDraftAssets`
  - Prevents storage bloat from abandoned uploads

### Layout & Responsiveness

- **ResponsiveLayout**: Three-column layout (`LeftSidebar` + content + `RightSidebarRouter`)
- **Pattern**: Pages should NOT define fixed widths - let ResponsiveLayout handle responsiveness
- **Example**: See `app/(app-pages)/layout.tsx` for implementation
- **Sticky Sidebars**: Left and right sidebars use sticky positioning for scroll persistence

## Integration Points

### External Services

- **Clerk**: Authentication with French localization (`frFR` in `app/layout.tsx`)
- **Bunny CDN**: Video delivery and storage via Convex HTTP Actions (`convex/lib/bunny.ts`)
- **Resend**: Email notifications for reports (`templates/report-email-template.tsx`)
- **CinetPay**: Primary payment processor for African markets
- **Stripe**: Secondary payment processor for card transactions

### State Management

- **Server State**: Convex (real-time, optimistic updates)
- **Client State**: TanStack Query for non-Convex data (see `providers/tanstack-provider.tsx`)
- **Form State**: React Hook Form + Zod validation (schemas in `schemas/`)

## Development Guidelines

### When Adding Features

1. **Schema First**: Define Convex schema changes in `convex/schema.ts` with proper indexes
2. **Convex Functions**: Create queries/mutations in `convex/*.ts` (use TypeScript doc comments)
3. **UI Components**: Build with `useQuery`/`useMutation` hooks, handle loading/error states
4. **Testing**: Test auth states (logged out, USER, CREATOR, SUPERUSER), check mobile responsiveness

### Common Gotchas

- **Loading States**: Always check `isLoading` from `useCurrentUser()` before rendering
- **Skip Pattern**: Use `"skip"` for conditional queries: `useQuery(api.fn, condition ? args : "skip")`
- **French**: All user-facing text MUST be French (check existing components for tone)
- **Permissions**: Check `accountType` for CREATOR-only features (subscriptions, verification)
- **Blocking**: Remember to filter blocked users in queries (see `convex/posts.ts` for pattern)
- **Bunny CDN**: All operations via `useBunnyUpload()` hook; secrets only in Convex dashboard
- **ResponsiveLayout**: Don't set fixed widths in page content - breaks responsive design
- **Logging**: Use `logger` from `@/lib/config/logger`, NOT `console.log/error` in client components
- **Types**: Prefer `Doc<"tableName">` over manual type definitions (see `types/index.ts`)

### File Naming & Organization

- **Components**: **kebab-case** for files (`bunny-upload-widget.tsx`), PascalCase for exports (`BunnyUploadWidget`)
- **Convex**: camelCase for functions (`getUser`, `createPost`)
- **Hooks**: Prefix with `use` (`useCurrentUser.ts`)
- **Actions**: Server actions in `actions/` directory (`actions/stripe/checkout.ts`)
- **Types**: Centralized in `types/index.ts`, use `Doc<"tableName">` from Convex when possible
- **Directories**: Always kebab-case (`user-lists/`, `new-post/`)

### Lib Directory Structure

All utility functions are organized under `lib/`:

```
lib/
├── bunny.ts           # ⚠️ DEPRECATED - Bunny CDN ops now in convex/lib/bunny.ts
├── dates.ts           # ⚠️ DEPRECATED - use lib/formatters/
├── svgs.tsx           # SVG components
├── utils.ts           # General utilities (cn, debounce, etc.)
├── calculators/       # Pure calculation functions
│   ├── index.ts
│   └── video-display-info.ts  # Aspect ratio calculations
├── config/            # App configuration
│   └── logger.ts      # Structured logging (see LOGGER_GUIDE.md)
├── context/           # React contexts
├── formatters/        # Data formatting functions
│   ├── index.ts
│   ├── format-custom-time-ago.ts
│   ├── format-date.ts
│   └── format-post-date.ts
├── generators/        # ID/string generators
│   ├── index.ts
│   ├── create-initials.ts
│   └── generate-random-string.ts
├── services/          # External service integrations
│   ├── stripe.ts      # Stripe payment helpers
│   └── cinetpay.ts    # CinetPay payment helpers
├── ui/                # UI helper functions
│   ├── index.ts
│   └── get-status-badge.tsx
└── validators/        # Validation functions
    ├── index.ts
    └── detect-risk-factors.tsx
```

**Import Pattern**: Use barrel exports from index.ts:

```tsx
import { calculateVideoDisplayInfo } from "@/lib/calculators"
import { formatCustomTimeAgo, formatPostDate } from "@/lib/formatters"
import { createInitials, generateRandomString } from "@/lib/generators"
```

### Code Style Preferences

- **Function Declarations**: Always use **arrow functions** (`const myFunction = () => {}`) instead of traditional function declarations (`function myFunction() {}`)
  - Applies to: Components, utilities, helpers, event handlers
  - Exception: Convex mutations/queries/actions use arrow function syntax by default
  - Example: `export const MyComponent = () => { ... }` NOT `export function MyComponent() { ... }`

### Type Definitions Pattern

Prefer using Convex's generated types with `Doc<>`:

```tsx
import { Doc, Id } from "@/convex/_generated/dataModel"

// ✅ Preferred: Use Convex Doc types
type User = Doc<"users">
type Post = Doc<"posts">

// For extended types with relations
type PostWithAuthor = Doc<"posts"> & {
  author: Doc<"users"> | null
}

// ❌ Avoid: Manual type definitions that duplicate schema
interface User {
  _id: Id<"users">
  name: string
  // ... duplicates schema
}
```

See `types/index.ts` for centralized type definitions.
