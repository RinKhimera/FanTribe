# FanTribe

Creator-focused social platform for the African market (French-speaking). Creators share exclusive content with paying subscribers.

> **Instruction routing**: Detailed rules live in `.claude/rules/`. When adding new patterns or updating existing ones, edit the appropriate rules file — NOT this root file. Route by topic:
>
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

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `bun dev`               | Start dev server (Turbopack)              |
| `bun run build`         | Production build                          |
| `bun run check`         | TypeScript + ESLint check (zero warnings) |
| `bun run lint`          | ESLint (zero warnings)                    |
| `bun run lint:fix`      | ESLint auto-fix                           |
| `bun run format`        | Prettier format all files                 |
| `bun run format:check`  | Prettier check formatting                 |
| `bun test`              | All tests (frontend + convex)             |
| `bun run test:watch`    | Watch mode                                |
| `bun run test:convex`   | Convex tests only                         |
| `bun run test:coverage` | Coverage reports                          |
| `bun run test:e2e`      | Playwright E2E tests                      |
| `bunx convex dev`       | Start Convex dev + regenerate types       |

## Architecture

```
app/                      # Next.js App Router
├── (app-pages)/          # Main routes (dashboard layout, auth guards)
├── (auth)/               # Sign-in, sign-up
├── api/                  # Clerk webhook only (Stripe + CinetPay → Convex HTTP Actions)
components/
├── domains/              # Feature components (messaging, posts, users, subscriptions, notifications, tips)
├── shared/               # Cross-feature reusable components
├── post-composer/        # Post creation compound components (Provider + Frame + Input + Media + Actions + Submit)
├── new-post/             # Post creation flow (uses PostComposer)
├── home/                 # Home page components (news feed)
├── be-creator/           # Creator application flow (step-based)
├── superuser/            # Admin panel (search, stats, moderation dialogs)
├── legal/                # Legal pages (layout, sections)
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
- `convex/http.ts` — HTTP Actions (Bunny upload/delete, CORS, webhook routing)
- `convex/stripeWebhook.ts` — Stripe webhook handler (`internalAction`, SDK signature verification)
- `convex/cinetpayWebhook.ts` — CinetPay webhook handler (`internalAction`, HMAC-SHA256 + `crypto.timingSafeEqual`)
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
- **`convex/_generated`**: Committed to git — run `bunx convex dev` to regenerate after schema changes, then commit the updated files
- **Bunny secrets**: All in Convex dashboard env vars, NOT in Next.js/Vercel env
- **Convex site URL**: `NEXT_PUBLIC_CONVEX_URL.replace(".cloud", ".site")` for HTTP Actions
- **Auth tokens for HTTP Actions**: `useAuth().getToken({ template: "convex" })` → `Authorization: Bearer ${token}`
- **Convex `internal` circular types**: `internalActions.ts` functions calling `internal.xxx` can cause circular type inference — use explicit type annotation on `result` variable
- **Stripe dynamic tips**: Use `price_data` (not fixed `STRIPE_PRICE_ID`) for variable amounts like tips
- **Validator completeness**: Convex validators used in `returns:` MUST include ALL schema fields. Missing fields cause `ReturnsValidationError` at runtime.
- **ESLint inline disables vs config overrides**: `eslint-disable-next-line` can fail across environments (CI vs local) if plugin versions differ. Prefer ESLint config overrides in `eslint.config.mjs` for stable suppression (e.g., `@next/next/no-img-element` off for OG image files).
