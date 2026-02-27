---
paths:
  - "convex/**"
---

# Convex Backend Patterns

## Function Definition
All functions use explicit `args` + `returns` validators:
```typescript
export const myQuery = query({
  args: { id: v.id("posts") },
  returns: v.union(v.object({ ... }), v.null()),
  handler: async (ctx, args) => { ... }
})
```
**Helper functions**: Use arrow functions (`const foo = () => ...`), not `function` declarations. See `frontend-patterns.md` → "Function Style".

## Authentication
```typescript
// Standard auth check (throws if not authenticated)
const user = await getAuthenticatedUser(ctx)

// Optional (returns null if not authenticated)
const user = await getAuthenticatedUser(ctx, { optional: true })

// Role-restricted
const admin = await requireSuperuser(ctx)
const creator = await requireCreator(ctx)
```

**Never add `tokenIdentifier` to mutation/query args.** Identity is always derived server-side. Accepting it from the client creates a misleading security surface (`getAuthenticatedUser` is the source of truth regardless):
```typescript
// ❌ Anti-pattern — tokenIdentifier ignored, adds confusion
export const updateProfile = mutation({
  args: { name: v.string(), tokenIdentifier: v.string() },
  ...
})
// ✅ Correct
export const updateProfile = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => { const user = await getAuthenticatedUser(ctx) }
})
```

## Security: `action` vs `internalAction`
Functions called **only** via `ctx.scheduler.runAfter/runAt` or other Convex functions must be `internalAction`, not `action`. Public `action` is browser-callable.

```typescript
export const processQueue = internalAction({ ... })  // ✅ not exposed to clients
```

**Critical gotcha when converting `action` → `internalAction`**: update ALL scheduler references from `api.module.fn` → `internal.module.fn`. TypeScript does NOT catch this mismatch at compile time — it only fails at runtime.

```typescript
// ✅ After conversion
await ctx.scheduler.runAfter(0, internal.myModule.processQueue, args)
// ❌ Still compiles but wrong — api.* references a now-internal function
await ctx.scheduler.runAfter(0, api.myModule.processQueue, args)
```

## Security: HTTP Actions — Server-Verified Identity Only
In Convex HTTP Actions, always derive the user from the JWT — never from the request body:
```typescript
const identity = await ctx.auth.getUserIdentity()
if (!identity) return jsonResponse({ error: "Non authentifie" }, 401, request)
const userId = identity.subject  // ✅ JWT-verified Clerk user ID

// ❌ Never: const { userId } = await request.json() — privilege escalation risk
```

## Payment Webhooks → Convex HTTP Actions
Stripe and CinetPay webhooks are `internalAction` in `convex/stripeWebhook.ts` and `convex/cinetpayWebhook.ts`, routed via `http.route()` in `convex/http.ts`. Do NOT recreate them as Next.js API routes — they verify signatures server-side and call internal mutations directly.

## Error Handling
```typescript
throw createAppError("POST_NOT_FOUND")
throw createAppError("INVALID_INPUT", {
  userMessage: "Le contenu doit avoir au moins 10 caractères"  // French for user
})
// Client: getUserErrorMessage(error) extracts French message
```

## Queries — Always Use Indexes
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
// Cron/internalMutation reference bounds:
//   subscriptions active  → .take(5000)
//   bans active           → .take(1000)
//   creatorApplications   → .take(1000)
//   notifications (per-user delete) → .take(10000)
```

## Rate Limiting
```typescript
await rateLimiter.limit(ctx, "createPost", { key: user._id, throws: true })
// Configured: sendMessage (10/min), createPost (5/hr), addComment (20/min), likePost (30/min), sendTip (3/min), followUser (30/min)
```

## Batch Operations
```typescript
// Batch-fetch related data with Promise.all
const authors = await Promise.all(authorIds.map(id => ctx.db.get(id)))
const authorsMap = new Map(authorIds.map((id, i) => [id, authors[i]]))
```

## Returns Validators — Use Shared Validators
When returning full documents (e.g., user as `author`), **use shared validators** from `convex/lib/validators.ts` (`userDocValidator`, `postMediaValidator`, etc.) instead of inline `v.object({...})`. Inline validators silently miss new schema fields → `ReturnsValidationError` at runtime.
```typescript
// ✅ Stays in sync with schema
returns: v.object({ author: userDocValidator, ... })

// ❌ Breaks when schema gains new fields
returns: v.object({ author: v.object({ name: v.string(), ... }), ... })
```

## Server-Generated Values Must Mirror Client Zod Rules
When a query generates suggestions or candidates (e.g., `suggestUsernames`), apply the **same constraints** as the client-side Zod schema before returning — otherwise suggestions pass server validation but fail Zod on click:
```typescript
// Zod schema rule: max 1 underscore, no trailing underscore
// Mirror this in the Convex query:
const candidates = rawCandidates
  .filter(c => !c.endsWith("_") && (c.match(/_/g) || []).length <= 1)
```
If Zod rules change, update the Convex query filter too.

## Denormalized Stats — Always Pair Insert with Increment
Tables with denormalized counters (e.g., `follows` → `followersCount` in `userStats`) require `incrementUserStat()` alongside every insert/delete — including in migration scripts. Forgetting this causes stat drift that only `updateAllCreatorStats` cron corrects.

**`updateAllCreatorStats` must query both CREATOR and SUPERUSER** — if it only queries CREATOR, SUPERUSER accounts (e.g., FanTribe) never get stats recalculated.

## Adding a New Notification Type — Checklist (~7+ locations)
1. `convex/schema.ts` — `notifications.type` + `pendingNotifications.type` unions
2. `convex/lib/validators.ts` — `notificationTypeValidator`
3. `types/index.ts` — `NotificationType` union
4. `convex/lib/notifications.ts` — `PREF_MAP` + `computeGroupKey` case
5. `convex/notificationQueue.ts` — both inline type unions
6. `convex/notifications.ts` — `notificationFilterValidator`
7. `components/domains/notifications/notification-filter-tabs.tsx` — `NotificationFilterType` + `filterOptions`
8. `components/domains/notifications/notification-layout.tsx` — `emptyStateConfig`
9. `components/domains/notifications/notification-item.tsx` — `getIcon()`, `getMessage()`, `handleRoute()`
10. `app/(app-pages)/account/notifications/page.tsx` — preferences toggle
11. `convex/schema.ts` — `notificationPreferences` (if opt-in/out needed)
12. `convex/users.ts` — inline `notificationPreferences` validators in `updateProfile` + `updateNotificationPreferences`

## Migration Scripts (Self-Scheduling Batch)
For data backfill on existing documents, use `convex/migrations/`:
1. `internalQuery` — paginated fetch of documents needing migration
2. `internalMutation` — patch one document
3. `internalAction` — orchestrator: fetch → process → patch → `ctx.scheduler.runAfter(1000, self, { cursor })`

**Critical**: If the action needs Node.js (`"use node"`), it MUST be in a **separate file** from queries/mutations. Convex rejects `"use node"` files containing non-action exports.
```
convex/migrations/
  myMigration.ts          ← query + mutation (default runtime)
  myMigrationAction.ts    ← "use node" action (Node.js runtime)
```

Run via Convex dashboard. Batch size 25, 1s delay between batches. Delete files after migration.

## Node.js Packages in Actions
- `image-size`: Named export — `const { imageSize } = require("image-size")` (NOT `require("image-size")` directly)
- **EXIF orientation**: `image-size` returns raw pixel dimensions ignoring EXIF rotation. Phone photos often have orientation tags 5-8 (90°/270° rotation) requiring width↔height swap. Use `useBunnyUpload` client-side when possible (browsers auto-rotate via `Image.onLoad`).

## Paginated Enrichment Pattern
For paginated queries needing joined data (e.g., subscription + creator details):
```typescript
// 1. Paginate with index
const result = await ctx.db.query("subscriptions")
  .withIndex("by_subscriber", q => q.eq("subscriber", userId))
  .order("desc").paginate(paginationOpts)

// 2. Batch-fetch related IDs (deduplicated)
const creatorIds = [...new Set(result.page.map(s => s.creator))]
const creators = await Promise.all(creatorIds.map(id => ctx.db.get(id)))
const creatorMap = new Map(creatorIds.map((id, i) => [id, creators[i]]))

// 3. Enrich + filter nulls
const enriched = result.page.map(s => {
  const creator = creatorMap.get(s.creator)
  if (!creator) return null
  return { ...s, creator: { _id: creator._id, name: creator.name } }
}).filter((e): e is NonNullable<typeof e> => e !== null)

// 4. Return with pagination metadata
return { ...result, page: enriched }
```
- Validator: wrap with `v.object({ page: v.array(enrichedValidator), isDone: v.boolean(), continueCursor: v.string(), ... })`
- In-memory search: acceptable when joined data volume is bounded (e.g., <100 subs/user)
