# Business Logic

## Subscriptions
- Monthly model (1000 XAF/month), dual payment: CinetPay (mobile money) + Stripe (cards)
- States: `subscribe` → `renew` → `unsubscribe`
- Types: `content_access` (posts) + `messaging_access` (DMs)

## Content Visibility
- `public` or `subscribers_only` — locked content shows blur overlay
- Adult content gated by `isAdult` flag + user preference `allowAdultContent`
- Access check: `canViewSubscribersOnlyContent()` in `convex/lib/subscriptions.ts`

## Tips (Pourboires)
- Any logged-in user can tip a creator (posts, profile, messages)
- Presets: 500, 1000, 2500, 5000, 10000 XAF + custom (min 500 XAF)
- Optional message (max 200 chars), private visibility
- Commission: 70% creator / 30% platform (centralized in `convex/lib/constants.ts`)
- Dual payment: CinetPay (mobile money) + Stripe (dynamic `price_data`)
- Idempotent processing via `providerTransactionId` unique index
- TipDialog component: `components/domains/tips/tip-dialog.tsx`

## Notifications
- **10 types** (camelCase): `like`, `comment`, `newPost`, `newSubscription`, `renewSubscription`, `subscriptionExpired`, `subscriptionConfirmed`, `creatorApplicationApproved`, `creatorApplicationRejected`, `tip`
- **Write-time grouping**: 1 DB row per group (`groupKey`), `actorIds[]` (last 3) + `actorCount`
- **Central service**: All creation via `createNotification()` in `convex/lib/notifications.ts` — never insert directly
- **Preference enforcement**: `shouldNotify()` checks `notificationPreferences` before creating (opt-out model)
- **Anti-spam**: 50 unread max blocks high-volume types (`like`, `comment`, `newPost`); never blocks `tip`, `subscriptionConfirmed`, `creatorApplication*`
- **Ungrouping on unlike/comment-delete**: `removeActorFromNotification()` decrements or deletes
- **Pagination**: Cursor-based via `usePaginatedQuery` (frontend) + `.paginate()` (backend)
- **Fan-out**: `notificationQueue.ts` handles large recipient lists (>200) via batched queue + cron
- **Migration**: `clearAllNotifications` internalMutation (run once via dashboard, then delete)

## Post Media Constraints
- Max **3 images** per post, max **1 video** per post, **no mixing** images + videos
- Enforced in `convex/posts.ts` (`createPost` mutation) — old posts may violate these rules
- `PostMedia` schema: `{ type, url, mediaId, mimeType, fileName?, fileSize?, width?, height? }`
- `width`/`height` extracted at upload via `useBunnyUpload` (Image.onLoad + ObjectURL)
- **Display**: Single image clamped 4:5→1.91:1; 2 images side-by-side; 3 images 1+2 grid; 4+ images 2x2 with "+N" overlay
- Grid component: `components/shared/post-media.tsx`

## Currency
- Primary: XAF (zero-decimal) — `formatCurrency(1000, "XAF")` → `"1 000 XAF"`
- Secondary: USD (for Stripe) — conversion rate: 1 USD = 562.2 XAF
