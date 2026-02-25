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
export const MyProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo(() => ({ state, actions }), [deps])
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>
}
// 2. Sub-components consume context via use(MyContext)
// 3. Compose: <MyProvider><SubA /><SubB /></MyProvider>
```

### Context Splitting (Large Providers)
When a provider exceeds ~300 lines, split into focused sub-contexts. Keep a backward-compatible convenience hook:
```typescript
// 3 sub-contexts: Config (outer, stable) → Form → Media (inner, changes often)
<ConfigContext.Provider value={config}>
  <FormContext.Provider value={formValue}>
    <MediaContext.Provider value={mediaValue}>
      {children}
    </MediaContext.Provider>
  </FormContext.Provider>
</ConfigContext.Provider>

// Convenience hook assembles all 3 (100% backward compatible)
export const useMyContext = () => {
  const config = useConfig(); const form = useForm(); const media = useMedia()
  return useMemo(() => ({ state: { ...form, ...media }, actions, config }), [config, form, media])
}
```
**Nesting order**: least-changing context outermost → most-changing innermost (reduces re-renders).
See `components/post-composer/` for real implementation with `usePostComposerForm`, `usePostComposerMedia`, `usePostComposerConfig`.

## State Machines (Explicit Modes)
```typescript
// ❌ Boolean props create impossible states
<Dialog showSkip={true} onSkip={...} />  // 2^n combinations

// ✅ Explicit mode eliminates invalid states
type DialogMode = "single" | "queue"
<Dialog mode="queue" onSkip={...} />  // Only valid combinations
```

### Discriminated Union for Related State
When 2-3 `useState` represent a single concept, use a discriminated union to eliminate impossible states:
```typescript
// ❌ 3 useState with implicit coupling
const [selectedPreset, setSelectedPreset] = useState(1000)
const [customInput, setCustomInput] = useState("")
const [isCustom, setIsCustom] = useState(false)

// ✅ Single discriminated union
type Amount = { type: "preset"; value: number } | { type: "custom"; input: string }
const [amount, setAmount] = useState<Amount>({ type: "preset", value: 1000 })
const resolved = amount.type === "preset" ? amount.value : parseInt(amount.input, 10) || 0
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

## Formatters (`lib/formatters/`)
- **`formatCurrency(amount, currency)`** — XAF/USD formatting (see `lib/formatters/currency/`)
- **`formatDate(date, format?)`** — French locale dates (see `lib/formatters/date/`)
- **`pluralize(count, singular, plural?)`** — French pluralization. Auto-adds "s" or use explicit plural for irregulars:
  ```typescript
  pluralize(3, "abonné")                    // → "abonnés"
  pluralize(1, "post exclusif", "posts exclusifs") // → "post exclusif"
  ```

## Styling
- `cn()` for conditional Tailwind classes: `cn("base", condition && "active")`
- Glass effects: `glass-card`, `glass-premium`, `glass-button`, `glass-input`
- Premium buttons: `btn-premium`, `btn-premium-outline`
- OKLCH colors via CSS vars: `--primary`, `--gold-500`, etc.
- Dark mode: automatic via `.dark` class (next-themes)

## Function Style — Arrow Functions Only
**Always use `const` arrow functions** instead of `function` declarations:
```typescript
// ✅ Correct
export const MyComponent = ({ title }: Props) => { ... }
const handleClick = () => { ... }
export const getUser = async (id: string) => { ... }

// ❌ Never use function declarations
export function MyComponent({ title }: Props) { ... }
function handleClick() { ... }
export async function getUser(id: string) { ... }
```
- Applies to all custom code: components, hooks, helpers, actions, convex functions, API routes, tests
- **Exception**: `components/ui/` (shadcn-generated) — leave as-is since `npx shadcn add` generates `function` declarations

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

### React 19 Gotchas
- **No ref mutation in render**: `ref.current = value` in the component body triggers `react-hooks/refs`. Two solutions:
  ```typescript
  const callbackRef = useRef(callback)
  // ❌ callbackRef.current = callback  ← side effect in render

  // ✅ Option A: useEffectEvent (preferred for effect callbacks)
  const stableCallback = useEffectEvent(callback)
  useEffect(() => { window.addEventListener("scroll", stableCallback) }, [])

  // ✅ Option B: useEffect sync (when useEffectEvent doesn't fit)
  useEffect(() => { callbackRef.current = callback }, [callback])
  ```
- **`useEffectEvent` restrictions**: Can ONLY be called from Effects and other Effect Events. Cannot be called from `useCallback`, cannot be added to dependency arrays, cannot be passed down as props. Violating this triggers `react-hooks/rules-of-hooks`.
- **Hooks before early return**: All hooks must be called on every render. Use `"skip"` to disable queries instead of returning before hooks:
  ```typescript
  // ❌ if (!id) return null; const data = useQuery(api.foo, { id })
  // ✅ const data = useQuery(api.foo, id ? { id } : "skip"); if (!id) return null
  ```

## Hooks Reference

| Hook | Purpose |
|------|---------|
| `useAsyncHandler` | Standardized try-catch with toast + logger + useTransition |
| `useCurrentUser` | Auth state + current user query (`{ currentUser, isLoading, isAuthenticated }`) |
| `useBunnyUpload` | Media upload/delete. Returns `width`/`height` for images (extracted via `Image.onLoad` + ObjectURL before upload) |
| `usePresence` | Online presence heartbeat (2min intervals, visibility-aware) |
| `useDialogState` | Dialog open/close + isPending + startTransition |
| `useDebounce` | Debounce values (default 300ms) |
| `useInfiniteScroll` | IntersectionObserver sentinel for `usePaginatedQuery` auto-load (`{ status, loadMore }` → `{ loadMoreRef }`) |
| `useBunnyPlayerControl` | Bunny video player controls |
| `useVideoMetadata` | Fetch Bunny video metadata |
| `useKeyboardNavigation` | Keyboard nav in lists |
| `useMessagesPagination` | Messages pagination + scroll (`{ conversationId }` → messages, hasMore, loadMore, scrollToBottom, refs) |
| `useCinetpayPayment` | CinetPay payment processing |
| `useSuperuserFilters` | Admin dashboard filter state |

## PostCard Context
`components/shared/post-card/` uses `PostCardContext` to eliminate prop drilling. Sub-components (`PostHeader`, `PostActions`) consume `usePostCard()`. `CommentSection` supports dual-mode: `useOptionalPostCard()` (returns null for standalone usage) + optional props fallback.

## Unicode in JSX Gotcha
- **Unicode escapes (`\u2026`, `\u00e9`, etc.) render literally in JSX text content** — they only work inside JS string literals (quotes/template literals), NOT in raw text between tags. Always use actual Unicode characters (`…`, `é`, `è`, `à`, `É`) in JSX text. Example: `<span>Chargement…</span>` not `<span>Chargement\u2026</span>`.

## Navigation Gotcha
Nav link filters (`creatorOnlyLinks`, `superuserOnlyLinks`) exist in BOTH `components/layout/` AND `components/shared/` (left-sidebar, mobile-menu/mobile-navigation). Update **all 4 files** when changing nav links or visibility rules.
