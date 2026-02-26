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
```

## Rate Limiting
```typescript
await rateLimiter.limit(ctx, "createPost", { key: user._id, throws: true })
// Configured: sendMessage (10/min), createPost (5/hr), addComment (20/min), likePost (30/min), sendTip (3/min)
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
