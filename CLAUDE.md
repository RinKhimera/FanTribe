# FanTribe - Claude Code Context

## Project Overview
FanTribe is a creator-focused social platform (similar to OnlyFans) built for the African market, primarily targeting French-speaking users in Cameroon. Creators can share exclusive content with paying subscribers.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Backend**: Convex (real-time backend with functions, queries, mutations)
- **Auth**: Clerk
- **Styling**: Tailwind CSS 4.x + shadcn/ui components
- **Animations**: Motion (framer-motion successor)
- **Payments**: CinetPay (African mobile money: OM/MOMO) + Stripe (cards)
- **Media Storage**: Bunny CDN (videos) + Convex storage (images)
- **Forms**: React Hook Form + Zod validation
- **Language**: TypeScript (strict mode)

## Architecture Patterns

### Directory Structure
```
app/                    # Next.js App Router pages
├── (app-pages)/        # Main app routes (with layout)
├── (auth)/             # Auth pages (sign-in, sign-up)
├── api/                # API routes (webhooks)
components/
├── domains/            # Feature-specific components
│   ├── messaging/
│   ├── notifications/
│   ├── posts/
│   ├── subscriptions/
│   └── users/
├── shared/             # Reusable components across features
├── superuser/          # Admin dashboard components
├── new-post/           # Post creation flow
└── ui/                 # shadcn/ui base components
convex/                 # Backend functions
├── _lib/               # Shared utilities for backend
hooks/                  # Custom React hooks
lib/
├── config/             # Environment, logger config
├── formatters/         # Date and currency formatters
│   ├── date/           # formatDate, formatPostDate, formatLastSeen
│   └── currency/       # formatCurrency, convertCurrency, convertStripeAmount
├── services/           # External service clients (stripe, bunny)
└── utils.ts            # General utilities (cn, etc.)
schemas/                # Zod validation schemas
types/                  # TypeScript type definitions
```

### Custom Hooks (hooks/)
| Hook | Purpose |
|------|---------|
| `useAsyncHandler` | Standardized try-catch with toast notifications and logger |
| `useDialogState` | Dialog open/close state with pending transition |
| `useDebounce` | Debounce values (e.g., search input) |
| `useScrollLock` | Lock body scroll (for modals, fullscreen viewers) |
| `useVideoMetadata` | Fetch Bunny video metadata |
| `useKeyboardNavigation` | Keyboard navigation in lists |
| `useCurrentUser` | Get current authenticated user |
| `useCinetpayPayment` | CinetPay payment processing |

### Component Patterns
1. **Sub-component folders**: Large components are split into sub-folders
   - `post-media.tsx` → `post-media/locked-content-overlay.tsx`
   - `fullscreen-image-viewer.tsx` → `fullscreen-viewer/*.tsx`

2. **Barrel exports**: Each component folder has an `index.ts` for clean imports

3. **Controlled vs Uncontrolled**: Many components support both modes
   - Example: `SubscriptionUnified` accepts `isOpen`/`onClose` OR `trigger`

## Coding Conventions

### Language
- All UI text is in **French** (target audience)
- Code comments can be in English or French
- Variable/function names in English

### State Management
- Use `useEffectEvent` for setState calls inside effects (React 19 pattern)
- Prefer computing values inline over storing derived state
- Use Convex's real-time queries (`useQuery`) for data fetching

### Error Handling
```typescript
// Use useAsyncHandler for mutations with toast feedback
const { execute, isPending } = useAsyncHandler({
  successMessage: "Action réussie",
  errorMessage: "Erreur lors de l'action",
  onSuccess: () => closeDialog(),
})

execute(() => someMutation({ ... }))
```

### Styling
- Use `cn()` utility for conditional classes
- Prefer Tailwind classes over custom CSS
- Glass morphism pattern: `glass-card`, `glass-input`, `glass-button`
- Use `motion/react` for animations (not framer-motion)

## Testing
- **Unit tests**: Vitest
- **Convex tests**: Separate config (`vitest.convex.config.mts`)
- Run all tests: `npm test`
- Run with watch: `npm run test:watch`

## Commands
```bash
npm run dev           # Start dev server
npm run build-check   # TypeScript + ESLint check
npm run test          # Run all tests
npm run lint          # Lint with auto-fix
```

## Key Business Logic

### Subscriptions
- Monthly subscription model (1000 XAF/month)
- Three states: `subscribe`, `renew`, `unsubscribe`
- Dual payment: CinetPay (mobile money) + Stripe (cards)

### Creator Applications
- Multi-step application process (be-creator flow)
- Documents: ID card + selfie for verification
- Admin approval required
- Reapplication supported after rejection

### Content Visibility
- Posts can be `public` or `subscribers_only`
- Locked content shows artistic blur overlay
- Videos stored on Bunny CDN with signed URLs

## Currency
- Primary: XAF (Central African CFA franc) - zero-decimal
- Secondary: USD (for Stripe international)
- Conversion rate defined in `lib/formatters/currency/`
