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

- Draft assets stored in `assetsDraft` table during upload
- Video/image processing patterns in `lib/video-utils.ts`

## Project-Specific Patterns

### Subscription System

- `subscriptions` table tracks creator subscriptions with types: `content_access`, `messaging_access`
- Status: `active`, `expired`, `canceled`, `pending`
- Posts respect visibility: `public` vs `subscribers_only`

### Notification System

- Fan-out pattern for notifications with deferred processing for large audiences
- Blocks table prevents notifications between blocked users
- Real-time via Convex subscriptions

### Component Organization

```
components/
├── shared/          # Reusable components (left-sidebar, profile-image)
├── home/           # Feed-specific components
├── messages/       # Chat system components
├── new-post/       # Post creation flow
└── ui/             # Shadcn/ui components
```

### Type Safety

- Use generated Convex types: `Doc<"tableName">`, `Id<"tableName">`
- Custom types in `types/index.ts` for complex data structures
- Zod schemas in `schemas/` for form validation

## Integration Points

### External Services

- **Clerk**: Authentication with French localization (`frFR`)
- **Bunny CDN**: Video delivery (bunny-sdk)
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

### File Naming

- Kebab-case for files and directories
- Component files end with `.tsx`
- API-like functions in `convex/` use camelCase
- Use meaningful prefixes: `use-` for hooks, descriptive names for components
