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
