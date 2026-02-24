---
paths:
  - "tests/**"
  - "vitest.*.mts"
---

# Testing

## Structure
- **Frontend**: `tests/frontend/` — Vitest + happy-dom + @testing-library
- **Convex**: `tests/convex/` — Vitest + convex-test (node environment)
- **Coverage**: 75% frontend, 65% backend (enforced in config)

## Patterns
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

## Testing Gotchas
- **Barrel exports**: `hooks/index.ts` evaluates ALL modules — if any import fails, all tests importing from barrel fail. Mock failing modules or import directly.
- **`env.client.ts`**: Zod parse fails without env vars — mock `@/lib/config/env.client` in tests
- **Convex scheduler**: `ctx.scheduler.runAfter()` callbacks may fire after test end — handled in `vitest.convex.setup.ts`
- **ESLint zero-warning**: `--max-warnings 0` in `build-check` — all warnings are errors
