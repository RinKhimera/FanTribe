# FanTribe

Creator-focused social platform for the African market (French-speaking). Creators share exclusive content with paying subscribers.

> **Instruction routing**: Detailed rules live in `.claude/rules/`. When adding new patterns or updating existing ones, edit the appropriate rules file — NOT this root file. Route by topic:
> - Convex/backend → `.claude/rules/convex-patterns.md`
> - Frontend/React/hooks → `.claude/rules/frontend-patterns.md`
> - Performance → `.claude/rules/react-performance.md`
> - UI/UX/accessibility → `.claude/rules/ui-ux-rules.md`
> - Testing → `.claude/rules/testing.md`
> - Business logic → `.claude/rules/business-logic.md`

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Backend**: Convex (real-time queries, mutations, actions, HTTP endpoints)
- **Auth**: Clerk (webhooks, JWT tokens with `template: "convex"`)
- **Styling**: Tailwind CSS 4 (OKLCH colors) + shadcn/ui + Motion (animations)
- **Payments**: CinetPay (mobile money OM/MOMO) + Stripe (cards)
- **Media**: Bunny CDN via Convex HTTP Actions (images) + direct XHR (videos)
- **Monitoring**: Sentry (errors) + Resend (email)
- **Validation**: Zod (forms + env vars) + Convex validators (backend)

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run build-check` | TypeScript + ESLint check (zero warnings) |
| `npm run lint` | ESLint read-only check |
| `npm run fix-lint` | ESLint auto-fix |
| `npm test` | All tests (frontend + convex) |
| `npm run test:watch` | Watch mode |
| `npm run test:convex` | Convex tests only |
| `npm run test:coverage` | Coverage reports |
| `npx convex dev` | Start Convex dev + regenerate types |

## Architecture

```
app/                      # Next.js App Router
├── (app-pages)/          # Main routes (dashboard layout, auth guards)
├── (auth)/               # Sign-in, sign-up
├── api/                  # Webhooks only (stripe, cinetpay, clerk)
components/
├── domains/              # Feature components (messaging, posts, users, subscriptions, notifications, tips)
├── shared/               # Cross-feature reusable components
├── post-composer/        # Post creation compound components (Provider + Frame + Input + Media + Actions + Submit)
├── new-post/             # Post creation flow (uses PostComposer)
├── layout/               # App shell, sidebar, nav
└── ui/                   # shadcn/ui (CVA + Radix primitives)
convex/                   # Backend functions
├── lib/                  # Shared: auth, errors, validators, rateLimiter, bunny, constants, subscriptions, blocks, notifications, signedUrls, batch
hooks/                    # 13 custom hooks
lib/
├── config/               # env.client.ts, env.ts (server), logger.ts
├── formatters/           # date/ (French locale) + currency/ (XAF/USD)
├── services/             # stripe.ts, cinetpay.ts
└── utils.ts              # cn() utility
schemas/                  # Zod validation schemas
types/                    # Shared TS types (PostMedia, MessageProps, etc.)
tests/
├── frontend/             # Vitest + happy-dom + @testing-library
└── convex/               # Vitest + convex-test (node env)
```

## Key Files

- `convex/schema.ts` — Data model (all tables, indexes, search indexes)
- `convex/http.ts` — HTTP Actions (Bunny upload/delete, CORS, webhooks)
- `convex/lib/auth.ts` — `getAuthenticatedUser()`, `requireSuperuser()`, `requireCreator()`
- `convex/lib/errors.ts` — `createAppError(code, { userMessage })` bilingual errors
- `convex/lib/validators.ts` — Shared validators (`postMediaValidator`, `userDocValidator`, `enrichedNotificationValidator`)
- `convex/lib/notifications.ts` — Central notification service (`createNotification`, `removeActorFromNotification`)
- `convex/lib/constants.ts` — Centralized business constants (commissions, tip presets, limits)
- `types/index.ts` — PostMedia, MessageProps, TipContext, EnrichedNotification, NotificationType

## Coding Conventions

- **UI text**: All in **French** (target audience: Cameroon)
- **Code**: English variable/function names, comments in English or French
- **Semi-colons**: Disabled (Prettier `semi: false`)
- **Imports**: Sorted by `@trivago/prettier-plugin-sort-imports` (node → npm → local)
- **Path alias**: `@/*` maps to project root
- **Convex types**: `Doc<"tableName">` for documents, `Id<"tableName">` for IDs
- **Error messages**: Internal in English, user-facing (`userMessage`) in French
- **Loading text**: Use `…` not `...` (e.g., "Chargement…", "Envoi…")

## Gotchas

- **`.next/dev/types` cache**: Stale after deleting API routes — delete `.next/dev/types` to clear
- **`convex/_generated`**: Committed to git — run `npx convex dev` to regenerate after schema changes, then commit the updated files
- **Bunny secrets**: All in Convex dashboard env vars, NOT in Next.js/Vercel env
- **Convex site URL**: `NEXT_PUBLIC_CONVEX_URL.replace(".cloud", ".site")` for HTTP Actions
- **Auth tokens for HTTP Actions**: `useAuth().getToken({ template: "convex" })` → `Authorization: Bearer ${token}`
- **Convex `internal` circular types**: `internalActions.ts` functions calling `internal.xxx` can cause circular type inference — use explicit type annotation on `result` variable
- **Stripe dynamic tips**: Use `price_data` (not fixed `STRIPE_PRICE_ID`) for variable amounts like tips
- **Validator completeness**: Convex validators used in `returns:` MUST include ALL schema fields. Missing fields cause `ReturnsValidationError` at runtime.
