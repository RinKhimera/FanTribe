/**
 * Central Notification Service
 *
 * Single entry point for ALL notification creation in the app.
 * Handles: preference checks, anti-spam throttling, write-time grouping.
 */
import { Doc, Id } from "../_generated/dataModel"
import { MutationCtx } from "../_generated/server"

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
  | "like"
  | "comment"
  | "newPost"
  | "newSubscription"
  | "renewSubscription"
  | "subscriptionExpired"
  | "subscriptionConfirmed"
  | "creatorApplicationApproved"
  | "creatorApplicationRejected"
  | "tip"

export interface CreateNotificationParams {
  type: NotificationType
  recipientId: Id<"users">
  actorId: Id<"users">
  postId?: Id<"posts">
  commentId?: Id<"comments">
  tipId?: Id<"tips">
  tipAmount?: number
  tipCurrency?: string
}

export interface CreateNotificationResult {
  created: boolean
  reason?: string
}

// ============================================================================
// Constants
// ============================================================================

const MAX_ACTORS_STORED = 3
const MAX_UNREAD_NOTIFICATIONS = 50

// Preference mapping: notification type → user pref key
// null = always send (no pref toggle)
type NotificationPreferences = NonNullable<Doc<"users">["notificationPreferences"]>
const PREF_MAP: Record<NotificationType, keyof NotificationPreferences | null> = {
  like: "likes",
  comment: "comments",
  newPost: "newPosts",
  newSubscription: "subscriptions",
  renewSubscription: "subscriptions",
  subscriptionExpired: "subscriptions",
  subscriptionConfirmed: "subscriptions",
  creatorApplicationApproved: null,
  creatorApplicationRejected: null,
  tip: "tips",
}

// Types that can be throttled when too many unread
const THROTTLEABLE_TYPES: Set<NotificationType> = new Set([
  "like",
  "comment",
  "newPost",
])

// ============================================================================
// Preference check
// ============================================================================

/**
 * Check if a notification should be sent based on user preferences.
 * Pure function — no DB access.
 */
export function shouldNotify(
  recipient: Doc<"users">,
  type: NotificationType,
): boolean {
  const prefKey = PREF_MAP[type]
  if (!prefKey) return true // null = always send

  const prefs = recipient.notificationPreferences
  if (!prefs) return true // No prefs set = opt-out model, all enabled

  return prefs[prefKey] !== false
}

// ============================================================================
// Anti-spam throttle
// ============================================================================

/**
 * Check if the recipient has too many unread notifications.
 * Only throttles high-volume types (likes, comments, newPost).
 */
async function isThrottled(
  ctx: MutationCtx,
  recipientId: Id<"users">,
  type: NotificationType,
): Promise<boolean> {
  if (!THROTTLEABLE_TYPES.has(type)) return false

  const unread = await ctx.db
    .query("notifications")
    .withIndex("by_recipient_read", (q) =>
      q.eq("recipientId", recipientId).eq("isRead", false),
    )
    .take(MAX_UNREAD_NOTIFICATIONS + 1)

  return unread.length > MAX_UNREAD_NOTIFICATIONS
}

// ============================================================================
// Group key computation
// ============================================================================

function computeGroupKey(
  type: NotificationType,
  params: {
    postId?: Id<"posts">
    tipId?: Id<"tips">
    timestamp?: number
  },
): string {
  const ts = params.timestamp ?? Date.now()
  const day = new Date(ts).toISOString().slice(0, 10) // YYYY-MM-DD

  switch (type) {
    // Grouped by post
    case "like":
      return `like:${params.postId}`
    case "comment":
      return `comment:${params.postId}`

    // Grouped by day
    case "newSubscription":
      return `newSub:${day}`
    case "renewSubscription":
      return `renewSub:${day}`

    // Not grouped — unique key per event
    case "newPost":
      return `newPost:${params.postId}`
    case "subscriptionExpired":
      return `subExpired:${ts}`
    case "subscriptionConfirmed":
      return `subConfirmed:${ts}`
    case "creatorApplicationApproved":
      return `appApproved:${ts}`
    case "creatorApplicationRejected":
      return `appRejected:${ts}`
    case "tip":
      return `tip:${params.tipId ?? ts}`
  }
}

// ============================================================================
// Main entry point
// ============================================================================

/**
 * Create or update a notification. Single entry point for ALL notification creation.
 *
 * Handles:
 * 1. Self-check (don't notify yourself)
 * 2. Preference check (respects user's notificationPreferences)
 * 3. Anti-spam throttle (50 unread max for high-volume types)
 * 4. Write-time grouping (likes/comments grouped by post, subscriptions by day)
 */
export async function createNotification(
  ctx: MutationCtx,
  params: CreateNotificationParams,
): Promise<CreateNotificationResult> {
  // 1. Self-check
  if (params.recipientId === params.actorId) {
    return { created: false, reason: "self" }
  }

  // 2. Preference check
  const recipient = await ctx.db.get(params.recipientId)
  if (!recipient) {
    return { created: false, reason: "recipient_not_found" }
  }

  if (!shouldNotify(recipient, params.type)) {
    return { created: false, reason: "preference_disabled" }
  }

  // 3. Anti-spam throttle
  if (await isThrottled(ctx, params.recipientId, params.type)) {
    return { created: false, reason: "throttled" }
  }

  // 4. Compute group key
  const groupKey = computeGroupKey(params.type, params)

  // 5. Find existing group
  const existing = await ctx.db
    .query("notifications")
    .withIndex("by_group", (q) =>
      q.eq("recipientId", params.recipientId).eq("groupKey", groupKey),
    )
    .unique()

  const now = Date.now()

  if (existing) {
    // Update existing group: prepend actor, keep max 3, deduplicate
    const filteredActors = existing.actorIds.filter(
      (id) => id !== params.actorId,
    )
    const newActorIds = [params.actorId, ...filteredActors].slice(
      0,
      MAX_ACTORS_STORED,
    )

    // Only increment count if actor is new (not already in the group)
    const isNewActor = !existing.actorIds.includes(params.actorId)
    const newCount = isNewActor
      ? existing.actorCount + 1
      : existing.actorCount

    await ctx.db.patch(existing._id, {
      actorIds: newActorIds,
      actorCount: newCount,
      isRead: false,
      lastActivityAt: now,
      // Update latest related entity if provided
      ...(params.commentId ? { commentId: params.commentId } : {}),
    })

    return { created: true }
  }

  // 6. Create new notification
  await ctx.db.insert("notifications", {
    type: params.type,
    recipientId: params.recipientId,
    groupKey,
    actorIds: [params.actorId],
    actorCount: 1,
    postId: params.postId,
    commentId: params.commentId,
    tipId: params.tipId,
    tipAmount: params.tipAmount,
    tipCurrency: params.tipCurrency,
    isRead: false,
    lastActivityAt: now,
  })

  return { created: true }
}

// ============================================================================
// Remove actor (for unlike / comment delete)
// ============================================================================

/**
 * Remove an actor from a grouped notification.
 * Deletes the notification entirely if it was the last actor.
 */
export async function removeActorFromNotification(
  ctx: MutationCtx,
  params: {
    type: "like" | "comment"
    recipientId: Id<"users">
    actorId: Id<"users">
    postId: Id<"posts">
  },
): Promise<void> {
  const groupKey = computeGroupKey(params.type, { postId: params.postId })

  const existing = await ctx.db
    .query("notifications")
    .withIndex("by_group", (q) =>
      q.eq("recipientId", params.recipientId).eq("groupKey", groupKey),
    )
    .unique()

  if (!existing) return

  if (existing.actorCount <= 1) {
    await ctx.db.delete(existing._id)
    return
  }

  const newActorIds = existing.actorIds.filter((id) => id !== params.actorId)
  const wasRemoved = newActorIds.length < existing.actorIds.length

  await ctx.db.patch(existing._id, {
    actorIds: newActorIds,
    actorCount: wasRemoved ? existing.actorCount - 1 : existing.actorCount,
  })
}
