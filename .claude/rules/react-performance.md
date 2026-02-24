---
paths:
  - "components/**"
  - "app/**"
---

# React Performance Rules

## Critical
- **No waterfalls**: `Promise.all()` for independent async ops. Start promises early, await late.
- **Dynamic imports**: `next/dynamic` for heavy components not needed on initial render (e.g., emoji picker, editors).
- **No barrel imports from large libs**: lucide-react and recharts are handled by `optimizePackageImports` in next.config — safe to import normally. Add new heavy libs there before considering `next/dynamic`.

## High
- **Minimize RSC serialization**: Pass only needed fields to client components, not full objects.
- **Suspense boundaries**: Wrap async data-dependent sections, let shell render immediately.

## Medium
- **Derive state inline**: `const fullName = first + ' ' + last` — no `useState` + `useEffect` for computed values. **Exception**: `Date.now()` is impure — React Compiler blocks it during render (`react-hooks/purity`). Keep time-dependent derived state in `useEffect`.
- **Functional setState**: `setItems(curr => [...curr, newItem])` — avoids stale closures, enables stable callbacks.
- **useTransition**: For non-urgent updates (search filtering, scroll tracking).
- **Explicit conditionals**: `count > 0 ? <Badge /> : null` — never `count && <Badge />` (renders `0`).
- **Immutable arrays**: `toSorted()` not `sort()`, `toReversed()` not `reverse()`.
- **Lazy state init**: `useState(() => expensive())` not `useState(expensive())`.
- **Narrow effect deps**: Depend on `user.id` not `user`. Derive booleans from continuous values.
- **Handlers not effects**: User-triggered actions go in event handlers, not `useEffect`.
- **Stable effect callbacks via `useEffectEvent`**: Use for callbacks read inside `useEffect` (e.g., IntersectionObserver, event listeners). Avoids re-subscribing when the callback changes. **Restriction**: can ONLY be called from Effects — NOT from `useCallback`, and NOT passed as dependency array entry.
