# FanTribe

Creator-focused social platform for the African market (French-speaking). Creators share exclusive content with paying subscribers.

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
hooks/                    # 12 custom hooks (see below)
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
- `convex/notifications.ts` — Notification queries/mutations (paginated, typed returns)
- `convex/lib/rateLimiter.ts` — Rate limits on mutations (sendMessage, createPost, etc.)
- `convex/lib/bunny.ts` — Bunny CDN service (upload, delete, signed URLs)
- `hooks/useAsyncHandler.ts` — Wraps async ops with toast/logger/useTransition
- `hooks/useBunnyUpload.ts` — Media upload (images via HTTP Action, videos via direct XHR)
- `hooks/useCurrentUser.ts` — Auth state + user query
- `hooks/usePresence.ts` — Online presence heartbeat (2min interval)
- `convex/tips.ts` — Tip processing (processTipAtomic) + creator earnings query
- `convex/lib/constants.ts` — Centralized business constants (commissions, tip presets, limits)
- `actions/stripe/tip-checkout.ts` — Stripe server action for tip payments (dynamic price_data)
- `types/index.ts` — PostMedia, MessageProps, ConversationProps, PaymentStatus, TipContext, TipProps, EnrichedNotification, NotificationType
- `lib/config/env.client.ts` — Zod-validated public env vars
- `lib/config/env.ts` — Zod-validated server-only secrets

## Convex Backend Patterns

### Function Definition
All functions use explicit `args` + `returns` validators:
```typescript
export const myQuery = query({
  args: { id: v.id("posts") },
  returns: v.union(v.object({ ... }), v.null()),
  handler: async (ctx, args) => { ... }
})
```

### Authentication
```typescript
// Standard auth check (throws if not authenticated)
const user = await getAuthenticatedUser(ctx)

// Optional (returns null if not authenticated)
const user = await getAuthenticatedUser(ctx, { optional: true })

// Role-restricted
const admin = await requireSuperuser(ctx)
const creator = await requireCreator(ctx)
```

### Error Handling
```typescript
throw createAppError("POST_NOT_FOUND")
throw createAppError("INVALID_INPUT", {
  userMessage: "Le contenu doit avoir au moins 10 caractères"  // French for user
})
// Client: getUserErrorMessage(error) extracts French message
```

### Queries — Always Use Indexes
```typescript
// Single index
ctx.db.query("posts").withIndex("by_author", q => q.eq("author", id))

// Composite index
ctx.db.query("users").withIndex("by_isOnline_lastSeenAt", q =>
  q.eq("isOnline", true).lt("lastSeenAt", cutoff)
)

// Pagination
ctx.db.query("posts").order("desc").paginate(paginationOpts)

// Search
ctx.db.query("users").withSearchIndex("search_users", q => q.search("name", term))

// NEVER: unbounded .collect() — always .take(n) or .paginate()
```

### Rate Limiting
```typescript
await rateLimiter.limit(ctx, "createPost", { key: user._id, throws: true })
// Configured: sendMessage (10/min), createPost (5/hr), addComment (20/min), likePost (30/min), sendTip (3/min)
```

### Batch Operations
```typescript
// Batch-fetch related data with Promise.all
const authors = await Promise.all(authorIds.map(id => ctx.db.get(id)))
const authorsMap = new Map(authorIds.map((id, i) => [id, authors[i]]))
```

## Frontend Patterns

### Data Fetching
```typescript
// Reactive query
const data = useQuery(api.posts.getPost, { postId })

// Conditional query (skip when args unavailable)
const sub = useQuery(api.subscriptions.get, userId ? { userId } : "skip")

// Mutation with useTransition
const [isPending, startTransition] = useTransition()
const createPost = useMutation(api.posts.createPost)
startTransition(async () => { await createPost({ ... }) })
```

### Async Handler (preferred for mutations with user feedback)
```typescript
const { execute, isPending } = useAsyncHandler({
  successMessage: "Post créé avec succès",
  errorMessage: "Erreur lors de la création",
  onSuccess: () => router.push("/"),
})
execute(() => createPost({ content, medias, visibility }))
```

### Compound Components (Context + Provider)
```typescript
// Pattern: State in Provider, UI in sub-components
// Example: components/post-composer/

// 1. Context + Provider (post-composer-context.tsx)
const PostComposerContext = createContext<ContextValue | null>(null)
export const usePostComposer = () => use(PostComposerContext)

export function PostComposerProvider({ config, children }) {
  const [content, setContent] = useState("")
  const value = useMemo(() => ({
    state: { content, ... },
    actions: { setContent, submit, ... },
    config,
  }), [deps])
  return <PostComposerContext.Provider value={value}>{children}</PostComposerContext.Provider>
}

// 2. Sub-components consume context
export function PostComposerInput() {
  const { state, actions } = usePostComposer()
  return <TextareaAutosize value={state.content} onChange={e => actions.setContent(e.target.value)} />
}

// 3. Usage: Compose with children
<PostComposerProvider config={{ userId, maxMedia: 3 }}>
  <PostComposerFrame>
    <PostComposerInput />
    <PostComposerMedia />
    <PostComposerActions />
    <PostComposerSubmit />
  </PostComposerFrame>
</PostComposerProvider>
```

### State Machines (Explicit Modes)
```typescript
// ❌ Boolean props create impossible states
<Dialog showSkip={true} onSkip={...} />  // 2^n combinations

// ✅ Explicit mode eliminates invalid states
type DialogMode = "single" | "queue"
<Dialog mode="queue" onSkip={...} />  // Only valid combinations

// Example: ImageCropDialog
mode="single"  // No skip button
mode="queue"   // Shows skip button + remaining count

// Example: UserListsCard
mode="blocked-list"  // Shows "Débloquer" button
mode="subscription-list" subscriptionStatus="subscribed"  // Shows "Abonné" button
```

### Forms (React Hook Form + Zod)
```typescript
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { content: "" },
})
// Submit: form.handleSubmit(onSubmit)
// Reset: form.reset({ content: "" })
// Field: <FormField control={form.control} name="content" render={...} />
```

### Animations (motion/react)
```typescript
import { motion, AnimatePresence } from "motion/react"
// Entry: initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
// Interactive: whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
// Swap: <AnimatePresence mode="wait"><motion.div key={state} ...></AnimatePresence>
// Duration: 150-300ms for UI transitions
```

### Styling
- `cn()` for conditional Tailwind classes: `cn("base", condition && "active")`
- Glass effects: `glass-card`, `glass-premium`, `glass-button`, `glass-input`
- Premium buttons: `btn-premium`, `btn-premium-outline`
- OKLCH colors via CSS vars: `--primary`, `--gold-500`, etc.
- Dark mode: automatic via `.dark` class (next-themes)

### Component Types
- Props use Convex `Doc<"users">` and `Id<"posts">` types
- shadcn/ui: CVA variants + Radix primitives + `asChild` pattern
- Next.js 15 params: `params: Promise<{ slug: string }>` → `const { slug } = use(params)`

### React 19 APIs
```typescript
// Context: use() instead of useContext()
import { createContext, use } from "react"
const value = use(MyContext)  // ✅ React 19
// const value = useContext(MyContext)  // ❌ Legacy

// Refs: standard prop, no forwardRef needed
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}
const Button = ({ ref, ...props }: ButtonProps) => <button ref={ref} {...props} />
// ❌ Don't use React.forwardRef() in React 19
```

## Hooks Reference

| Hook | Purpose |
|------|---------|
| `useAsyncHandler` | Standardized try-catch with toast + logger + useTransition |
| `useCurrentUser` | Auth state + current user query (`{ currentUser, isLoading, isAuthenticated }`) |
| `useBunnyUpload` | Media upload/delete (images via Convex HTTP Action, videos via XHR to Bunny Stream) |
| `usePresence` | Online presence heartbeat (2min intervals, visibility-aware) |
| `useDialogState` | Dialog open/close + isPending + startTransition |
| `useDebounce` | Debounce values (default 300ms) |
| `useScrollLock` | Lock body scroll for modals/fullscreen |
| `useBunnyPlayerControl` | Bunny video player controls |
| `useVideoMetadata` | Fetch Bunny video metadata |
| `useKeyboardNavigation` | Keyboard nav in lists |
| `useCinetpayPayment` | CinetPay payment processing |
| `useSuperuserFilters` | Admin dashboard filter state |

## Coding Conventions

- **UI text**: All in **French** (target audience: Cameroon)
- **Code**: English variable/function names, comments in English or French
- **Semi-colons**: Disabled (Prettier `semi: false`)
- **Imports**: Sorted by `@trivago/prettier-plugin-sort-imports` (node → npm → local)
- **Path alias**: `@/*` maps to project root
- **Convex types**: `Doc<"tableName">` for documents, `Id<"tableName">` for IDs
- **Error messages**: Internal in English, user-facing (`userMessage`) in French
- **Loading text**: Use `…` not `...` (e.g., "Chargement…", "Envoi…")

## React Performance Rules

Follow these when writing React code:

### Critical
- **No waterfalls**: `Promise.all()` for independent async ops. Start promises early, await late.
- **Dynamic imports**: `next/dynamic` for heavy components not needed on initial render (e.g., emoji picker, editors).
- **No barrel imports from large libs**: lucide-react is handled by `optimizePackageImports` in next.config — safe to import normally.

### High
- **Minimize RSC serialization**: Pass only needed fields to client components, not full objects.
- **Suspense boundaries**: Wrap async data-dependent sections, let shell render immediately.

### Medium
- **Derive state inline**: `const fullName = first + ' ' + last` — no `useState` + `useEffect` for computed values.
- **Functional setState**: `setItems(curr => [...curr, newItem])` — avoids stale closures, enables stable callbacks.
- **useTransition**: For non-urgent updates (search filtering, scroll tracking).
- **Explicit conditionals**: `count > 0 ? <Badge /> : null` — never `count && <Badge />` (renders `0`).
- **Immutable arrays**: `toSorted()` not `sort()`, `toReversed()` not `reverse()`.
- **Lazy state init**: `useState(() => expensive())` not `useState(expensive())`.
- **Narrow effect deps**: Depend on `user.id` not `user`. Derive booleans from continuous values.
- **Handlers not effects**: User-triggered actions go in event handlers, not `useEffect`.

## UI/UX Rules

Follow these when writing UI components:

### Accessibility
- Icon-only `<button>` → must have `aria-label`
- Form `<input>` → must have `<label htmlFor>` or `aria-label`
- Focus states: `focus-visible:ring-*` — never `outline-none` without replacement
- Semantic HTML: `<button>` for actions, `<a>`/`<Link>` for navigation — never `onClick` on `<div>`

### Forms
- Set `autocomplete` and `inputmode` on inputs
- Never block paste
- `spellCheck={false}` on emails, codes, usernames
- Placeholders end with `…`: `"exemple@mail.com…"`
- Submit button: enabled until request starts, then show spinner
- Inline error messages; focus first error on submit

### Animation
- Honor `prefers-reduced-motion` — provide reduced/disabled variant
- Animate only `transform` and `opacity` (compositor-friendly)
- Never `transition: all` — list properties explicitly
- SVG: animate wrapper `<div>`, not SVG element directly

### Content
- Text overflow: always handle with `truncate`, `line-clamp-*`, or `break-words`
- `min-w-0` on flex children for truncation to work
- Number columns: `font-variant-numeric: tabular-nums`
- Render empty states, never broken UI
- `touch-action: manipulation` on interactive mobile elements

### Images & Performance
- Use Next.js `<Image>` with `fill` + `sizes` or explicit `width`/`height`
- Below-fold: `loading="lazy"`. Above-fold: `priority`
- Virtualize lists > 50 items (`content-visibility: auto` or virtualization lib)

### Navigation
- URL reflects app state (filters, tabs, pagination)
- Destructive actions require confirmation modal

## Testing

### Structure
- **Frontend**: `tests/frontend/` — Vitest + happy-dom + @testing-library
- **Convex**: `tests/convex/` — Vitest + convex-test (node environment)
- **Coverage**: 75% frontend, 65% backend (enforced in config)

### Patterns
```typescript
// Frontend hook test
const { result } = renderHook(() => useAsyncHandler({ successMessage: "OK" }))
await act(async () => { await result.current.execute(() => mockFn()) })

// Convex function test
const t = convexTest(schema)
await t.run(async (ctx) => { await ctx.db.insert("users", { ... }) })
const result = await t.withIdentity({ tokenIdentifier: "test" })
  .query(api.users.getCurrentUser)
```

## Gotchas

- **`.next/dev/types` cache**: Stale after deleting API routes — delete `.next/dev/types` to clear
- **Barrel exports in tests**: `hooks/index.ts` evaluates ALL modules — if any import fails, all tests importing from barrel fail. Mock failing modules or import directly.
- **`env.client.ts` in tests**: Zod parse fails without env vars — mock `@/lib/config/env.client` in tests
- **Convex scheduler in tests**: `ctx.scheduler.runAfter()` callbacks may fire after test end — handled in `vitest.convex.setup.ts`
- **`convex/_generated`**: Committed to git — run `npx convex dev` to regenerate after schema changes, then commit the updated files
- **ESLint zero-warning**: `--max-warnings 0` in `build-check` — all warnings are errors
- **Bunny secrets**: All in Convex dashboard env vars, NOT in Next.js/Vercel env
- **Convex site URL**: `NEXT_PUBLIC_CONVEX_URL.replace(".cloud", ".site")` for HTTP Actions
- **Auth tokens for HTTP Actions**: `useAuth().getToken({ template: "convex" })` → `Authorization: Bearer ${token}`
- **Convex `internal` circular types**: `internalActions.ts` functions calling `internal.xxx` can cause circular type inference — use explicit type annotation on `result` variable
- **Stripe dynamic tips**: Use `price_data` (not fixed `STRIPE_PRICE_ID`) for variable amounts like tips
- **Validator completeness**: Convex validators used in `returns:` MUST include ALL schema fields. Example: `userDocValidator` needs `notificationPreferences`, `privacySettings` even if optional. Missing fields cause `ReturnsValidationError` at runtime.

## Business Logic

### Subscriptions
- Monthly model (1000 XAF/month), dual payment: CinetPay (mobile money) + Stripe (cards)
- States: `subscribe` → `renew` → `unsubscribe`
- Types: `content_access` (posts) + `messaging_access` (DMs)

### Content Visibility
- `public` or `subscribers_only` — locked content shows blur overlay
- Adult content gated by `isAdult` flag + user preference `allowAdultContent`
- Access check: `canViewSubscribersOnlyContent()` in `convex/lib/subscriptions.ts`

### Tips (Pourboires)
- Any logged-in user can tip a creator (posts, profile, messages)
- Presets: 500, 1000, 2500, 5000, 10000 XAF + custom (min 500 XAF)
- Optional message (max 200 chars), private visibility
- Commission: 70% creator / 30% platform (centralized in `convex/lib/constants.ts`)
- Dual payment: CinetPay (mobile money) + Stripe (dynamic `price_data`)
- Idempotent processing via `providerTransactionId` unique index
- TipDialog component: `components/domains/tips/tip-dialog.tsx`

### Notifications
- **10 types** (camelCase): `like`, `comment`, `newPost`, `newSubscription`, `renewSubscription`, `subscriptionExpired`, `subscriptionConfirmed`, `creatorApplicationApproved`, `creatorApplicationRejected`, `tip`
- **Write-time grouping**: 1 DB row per group (`groupKey`), `actorIds[]` (last 3) + `actorCount`
- **Central service**: All creation via `createNotification()` in `convex/lib/notifications.ts` — never insert directly
- **Preference enforcement**: `shouldNotify()` checks `notificationPreferences` before creating (opt-out model)
- **Anti-spam**: 50 unread max blocks high-volume types (`like`, `comment`, `newPost`); never blocks `tip`, `subscriptionConfirmed`, `creatorApplication*`
- **Ungrouping on unlike/comment-delete**: `removeActorFromNotification()` decrements or deletes
- **Pagination**: Cursor-based via `usePaginatedQuery` (frontend) + `.paginate()` (backend)
- **Fan-out**: `notificationQueue.ts` handles large recipient lists (>200) via batched queue + cron
- **Migration**: `clearAllNotifications` internalMutation (run once via dashboard, then delete)

### Currency
- Primary: XAF (zero-decimal) — `formatCurrency(1000, "XAF")` → `"1 000 XAF"`
- Secondary: USD (for Stripe) — conversion rate: 1 USD = 562.2 XAF
