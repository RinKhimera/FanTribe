---
paths:
  - "tests/**"
  - "e2e/**"
  - "vitest.*.mts"
  - "playwright.config.ts"
---

# Testing

## Structure

- **Frontend**: `tests/frontend/` — Vitest + happy-dom + @testing-library
- **Convex**: `tests/convex/` — Vitest + convex-test (node environment)
- **E2E**: `e2e/` — Playwright + Clerk auth + Page Object Model
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

## E2E (Playwright)

- **Setup**: `@clerk/testing/playwright` for auth — `global.setup.ts` signs in 3 roles (user, creator, admin) and saves `storageState`
- **Page Object Model**: `e2e/pages/` — one class per page, extends `BasePage`
- **Projects**: `chromium` (public), `chromium-auth` (user), `chromium-creator`, `chromium-admin` — each loads matching storageState
- **Env vars**: `E2E_CLERK_USER_USERNAME/PASSWORD`, `E2E_CLERK_CREATOR_*`, `E2E_CLERK_ADMIN_*`
- **Run**: `bun run test:e2e` (uses dev server) — CI builds first (`bun run build && bun run start`)
- **Assertions**: UI text in French — match exact strings (e.g., `"Fil d'actualité"`, `"Explorer"`)

## Testing Gotchas

- **Barrel exports**: `hooks/index.ts` evaluates ALL modules — if any import fails, all tests importing from barrel fail. Mock failing modules or import directly.
- **`env.client.ts`**: Zod parse fails without env vars — mock `@/lib/config/env.client` in tests
- **Convex scheduler**: `ctx.scheduler.runAfter()` callbacks may fire after test end — handled in `vitest.convex.setup.ts`
- **ESLint zero-warning**: `--max-warnings 0` in `check` / `lint` — all warnings are errors
- **UI text changes break test assertions**: Tests use `getByText()` / `getByPlaceholderText()` with exact strings. When changing user-visible text in components (e.g., `"..."` → `"…"`, translations), always search `tests/` for matching assertions — they live outside `components/` so component-scoped operations miss them.
