# FanTribe AI Coding Instructions

## Architecture Overview

**FanTribe** is a French creator-focused social media platform built with Next.js 15, Convex (realtime backend), Clerk (auth), and TailwindCSS. The app supports subscription-based content access, messaging, and creator verification workflows.

### Key Architecture Patterns

- **Convex Backend**: All database operations, real-time subscriptions, and server functions use Convex. Never write traditional API routes for data operations.
- **Route Groups**: App uses Next.js route groups: `(app-pages)` for authenticated content, `(auth)` for sign-in/up flows
- **Authentication Flow**: Clerk → Convex token exchange → user lookup via `tokenIdentifier`
- **French Localization**: UI text and user-facing content should be in French

## Essential Development Workflows

### Running the Project

```bash
npm run dev          # Start with Turbopack (default)
npm run build-check  # Type check + lint before build
npm run fix-lint     # Auto-fix ESLint issues
```

### Convex Integration

- Use `useMutation(api.module.function)` for write operations
- Use `useQuery(api.module.function, args)` for real-time data
- Skip queries when not authenticated: `useQuery(api.fn, isAuthenticated ? args : "skip")`
- Internal functions for webhooks/background jobs use `internalMutation`

## Critical Patterns & Conventions

### Component Architecture

```tsx
// Standard component structure
"use client"

import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

// Standard component structure

// Standard component structure

// Standard component structure

// Standard component structure

export const MyComponent = () => {
  const { currentUser, isLoading } = useCurrentUser()
  // Component logic
}
```

### User Authentication & Routing

- All protected routes require completed username (enforced in `(app-pages)/layout.tsx`)
- Incomplete profiles redirect to `/onboarding`
- Use `useCurrentUser()` hook, not direct Clerk hooks
- Account types: `USER`, `CREATOR`, `SUPERUSER` with different permissions

### Data Access Patterns

```tsx
// Real-time subscriptions
const posts = useQuery(api.posts.getAllPosts, { limit: 20 })

// Mutations with optimistic updates
const createPost = useMutation(api.posts.createPost)
await createPost({ content, medias, visibility })
```

### Media Handling

- **Bunny CDN Architecture**: Videos use Bunny Stream (`iframe.mediadelivery.net`), images use Bunny Storage
- **User Collections**: Videos automatically organized in user-specific collections via `getOrCreateUserCollection`
- **Upload Process**: Use `BunnyUploadWidget` component → `uploadBunnyAsset` function → creates draft in `assetsDraft` table
- **Video Metadata**: Fetch via `/api/bunny/metadata` endpoint using video GUIDs extracted from iframe URLs
- **File Naming**: `userId/{randomSuffix}.{extension}` pattern for all uploads
- **Note**: All media handling uses Bunny CDN exclusively (Cloudinary is being phased out)

## Project-Specific Patterns

### Subscription System

- `subscriptions` table tracks creator subscriptions with types: `content_access`, `messaging_access`
- Status: `active`, `expired`, `canceled`, `pending`
- Posts respect visibility: `public` vs `subscribers_only`

### Notification System

- Fan-out pattern for notifications with deferred processing for large audiences
- Blocks table prevents notifications between blocked users
- Real-time via Convex subscriptions

### Creator Verification

- `creatorApplications` table with status: `pending`, `approved`, `rejected`
- Identity documents handled via Bunny CDN storage
- Account type automatically upgraded from `USER` to `CREATOR` upon approval

### Payment Integration

- **CinetPay**: African-focused payment processor for subscriptions
- **Test Mode**: Bypasses CinetPay verification in development (`TEST MODE` logs)
- **Payment Flow**: CinetPay → webhook notification → subscription activation
- **Return Handling**: `/api/return` validates transactions with CinetPay API

### Component Organization

```
components/
├── shared/          # Reusable components (LeftSidebar, ProfileImage, BunnyUploadWidget)
├── home/           # Feed-specific components
├── messages/       # Chat system components with media support
├── new-post/       # Post creation flow with draft system
├── profile/        # User profiles, subscribe/renew dialogs
└── ui/             # Shadcn/ui components
```

### Type Safety

- Use generated Convex types: `Doc<"tableName">`, `Id<"tableName">`
- Custom types in `types/index.ts` for complex data structures
- Zod schemas in `schemas/` for form validation

## Integration Points

### External Services

- **Clerk**: Authentication with French localization (`frFR`)
- **Bunny CDN**: Video delivery (bunny-sdk) and storage with organized user collections
- **Resend**: Email notifications
- **CinetPay**: Payment processing (African market focus)

### State Management

- Convex for server state (real-time)
- TanStack Query for additional client state
- React Hook Form + Zod for form state

## Development Guidelines

### When Adding Features

1. Define Convex schema changes first (`convex/schema.ts`)
2. Create/update Convex functions (`convex/*.ts`)
3. Build UI components with real-time data hooks
4. Test authentication states and loading patterns

### Common Gotchas

- Always handle `currentUser` loading states
- Use `"skip"` for conditional queries based on auth
- Remember French localization for user-facing text
- Test creator vs user permission flows
- Handle offline/online states in messaging
- Bunny CDN requires proper environment variables and collection management
- Avoid fixed width percentages in layouts - use ResponsiveLayout component instead

### File Naming

- PascalCase for component files: `MyComponent.tsx`
- Kebab-case for directories and non-component files
- API-like functions in `convex/` use camelCase
- Use meaningful prefixes: `use-` for hooks, descriptive names for components
