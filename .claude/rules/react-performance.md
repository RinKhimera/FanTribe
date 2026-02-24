---
paths:
  - "components/**"
  - "app/**"
---

# React Performance Rules

## Critical
- **No waterfalls**: `Promise.all()` for independent async ops. Start promises early, await late.
- **Dynamic imports**: `next/dynamic` for heavy components not needed on initial render (e.g., emoji picker, editors).
- **No barrel imports from large libs**: lucide-react is handled by `optimizePackageImports` in next.config — safe to import normally.

## High
- **Minimize RSC serialization**: Pass only needed fields to client components, not full objects.
- **Suspense boundaries**: Wrap async data-dependent sections, let shell render immediately.

## Medium
- **Derive state inline**: `const fullName = first + ' ' + last` — no `useState` + `useEffect` for computed values.
- **Functional setState**: `setItems(curr => [...curr, newItem])` — avoids stale closures, enables stable callbacks.
- **useTransition**: For non-urgent updates (search filtering, scroll tracking).
- **Explicit conditionals**: `count > 0 ? <Badge /> : null` — never `count && <Badge />` (renders `0`).
- **Immutable arrays**: `toSorted()` not `sort()`, `toReversed()` not `reverse()`.
- **Lazy state init**: `useState(() => expensive())` not `useState(expensive())`.
- **Narrow effect deps**: Depend on `user.id` not `user`. Derive booleans from continuous values.
- **Handlers not effects**: User-triggered actions go in event handlers, not `useEffect`.
