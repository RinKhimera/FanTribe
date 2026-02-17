---
paths:
  - "components/**"
  - "app/**"
  - "hooks/**"
---

# Frontend Patterns

## Data Fetching
```typescript
// Reactive query
const data = useQuery(api.posts.getPost, { postId })

// Conditional query (skip when args unavailable)
const sub = useQuery(api.subscriptions.get, userId ? { userId } : "skip")

// Mutation with useTransition
const [isPending, startTransition] = useTransition()
const createPost = useMutation(api.posts.createPost)
startTransition(async () => { await createPost({ ... }) })

// Paginated query (infinite scroll)
const { results, status, loadMore } = usePaginatedQuery(
  api.posts.getFeed, isAuthenticated ? queryArgs : "skip",
  { initialNumItems: 20 },
)
const { loadMoreRef } = useInfiniteScroll({ status, loadMore, numItems: 10 })
// Render: <div ref={loadMoreRef} /> as sentinel element
```
**Caveat**: `usePaginatedQuery` does NOT support `preloadQuery` — paginated pages always start with a client loading state. Use `fetchQuery` for server-side auth guard only, let pagination load client-side.

## Async Handler (preferred for mutations with user feedback)
```typescript
const { execute, isPending } = useAsyncHandler({
  successMessage: "Post créé avec succès",
  errorMessage: "Erreur lors de la création",
  onSuccess: () => router.push("/"),
})
execute(() => createPost({ content, medias, visibility }))
```

## Compound Components (Context + Provider)
Pattern: State in Provider, UI in sub-components. See `components/post-composer/` for full example.
```typescript
// 1. Context + Provider with useMemo'd value
const MyContext = createContext<ContextValue | null>(null)
export const useMyContext = () => use(MyContext)
export function MyProvider({ children }) {
  const value = useMemo(() => ({ state, actions }), [deps])
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>
}
// 2. Sub-components consume context via use(MyContext)
// 3. Compose: <MyProvider><SubA /><SubB /></MyProvider>
```

## State Machines (Explicit Modes)
```typescript
// ❌ Boolean props create impossible states
<Dialog showSkip={true} onSkip={...} />  // 2^n combinations

// ✅ Explicit mode eliminates invalid states
type DialogMode = "single" | "queue"
<Dialog mode="queue" onSkip={...} />  // Only valid combinations
```

## Forms (React Hook Form + Zod)
```typescript
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { content: "" },
})
// Submit: form.handleSubmit(onSubmit)
// Reset: form.reset({ content: "" })
// Field: <FormField control={form.control} name="content" render={...} />
```

## Animations (motion/react)
```typescript
import { motion, AnimatePresence } from "motion/react"
// Entry: initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
// Interactive: whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
// Swap: <AnimatePresence mode="wait"><motion.div key={state} ...></AnimatePresence>
// Duration: 150-300ms for UI transitions
```

## Styling
- `cn()` for conditional Tailwind classes: `cn("base", condition && "active")`
- Glass effects: `glass-card`, `glass-premium`, `glass-button`, `glass-input`
- Premium buttons: `btn-premium`, `btn-premium-outline`
- OKLCH colors via CSS vars: `--primary`, `--gold-500`, etc.
- Dark mode: automatic via `.dark` class (next-themes)

## Component Types
- Props use Convex `Doc<"users">` and `Id<"posts">` types
- shadcn/ui: CVA variants + Radix primitives + `asChild` pattern
- Next.js 15 params: `params: Promise<{ slug: string }>` → `const { slug } = use(params)`

## React 19 APIs
```typescript
// Context: use() instead of useContext()
import { createContext, use } from "react"
const value = use(MyContext)  // ✅ React 19

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
| `useInfiniteScroll` | IntersectionObserver sentinel for `usePaginatedQuery` auto-load (`{ status, loadMore }` → `{ loadMoreRef }`) |
| `useScrollLock` | Lock body scroll for modals/fullscreen |
| `useBunnyPlayerControl` | Bunny video player controls |
| `useVideoMetadata` | Fetch Bunny video metadata |
| `useKeyboardNavigation` | Keyboard nav in lists |
| `useCinetpayPayment` | CinetPay payment processing |
| `useSuperuserFilters` | Admin dashboard filter state |

## Navigation Gotcha
Nav link filters (`creatorOnlyLinks`, `superuserOnlyLinks`) exist in BOTH `components/layout/` AND `components/shared/` (left-sidebar, mobile-menu/mobile-navigation). Update **all 4 files** when changing nav links or visibility rules.
