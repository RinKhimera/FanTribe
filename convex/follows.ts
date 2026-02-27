import { ConvexError, v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"
import { isBlocked } from "./lib/blocks"
import { createAppError } from "./lib/errors"
import { createNotification } from "./lib/notifications"
import { rateLimiter } from "./lib/rateLimiter"
import { incrementUserStat } from "./userStats"

// ============================================================================
// Helpers (exported for use in posts.ts, blocks.ts, internalActions.ts)
// ============================================================================

/**
 * Get the set of creator IDs that a user follows.
 * Used by the feed query to filter posts.
 */
export const getFollowedCreatorIds = async (
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Set<Id<"users">>> => {
  const follows = await ctx.db
    .query("follows")
    .withIndex("by_follower", (q) => q.eq("followerId", userId))
    .collect()
  return new Set(follows.map((f) => f.followingId))
}

/**
 * Get all follower IDs for a creator.
 * Used for sending newPost notifications to followers.
 */
export const getFollowerIds = async (
  ctx: QueryCtx | MutationCtx,
  creatorId: Id<"users">,
): Promise<Id<"users">[]> => {
  const follows = await ctx.db
    .query("follows")
    .withIndex("by_following", (q) => q.eq("followingId", creatorId))
    .collect()
  return follows.map((f) => f.followerId)
}

/**
 * Remove follows between two users (bidirectional).
 * Called when one user blocks another.
 */
export const removeFollowsBetweenUsers = async (
  ctx: MutationCtx,
  userA: Id<"users">,
  userB: Id<"users">,
): Promise<number> => {
  let removed = 0

  const [aFollowsB, bFollowsA] = await Promise.all([
    ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", userA).eq("followingId", userB),
      )
      .unique(),
    ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", userB).eq("followingId", userA),
      )
      .unique(),
  ])

  if (aFollowsB) {
    await ctx.db.delete(aFollowsB._id)
    await incrementUserStat(ctx, userB, { followersCount: -1 })
    removed++
  }
  if (bFollowsA) {
    await ctx.db.delete(bFollowsA._id)
    await incrementUserStat(ctx, userA, { followersCount: -1 })
    removed++
  }

  return removed
}

// ============================================================================
// Public mutations
// ============================================================================

export const followUser = mutation({
  args: { targetUserId: v.id("users") },
  returns: v.object({
    already: v.optional(v.boolean()),
    followed: v.optional(v.boolean()),
    followId: v.id("follows"),
  }),
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx)
    if (me._id === args.targetUserId)
      throw new ConvexError("Cannot follow yourself")

    await rateLimiter.limit(ctx, "followUser", { key: me._id, throws: true })

    // Verify target is CREATOR or SUPERUSER
    const target = await ctx.db.get(args.targetUserId)
    if (
      !target ||
      (target.accountType !== "CREATOR" && target.accountType !== "SUPERUSER")
    )
      throw createAppError("INVALID_INPUT", {
        userMessage: "Vous ne pouvez suivre que des créateurs",
      })

    // Check not already following (idempotent)
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", me._id).eq("followingId", args.targetUserId),
      )
      .unique()
    if (existing) return { already: true, followId: existing._id }

    // Check block
    if (await isBlocked(ctx, me._id, args.targetUserId))
      throw createAppError("FORBIDDEN", {
        userMessage: "Impossible de suivre cet utilisateur",
      })

    const followId = await ctx.db.insert("follows", {
      followerId: me._id,
      followingId: args.targetUserId,
    })

    await incrementUserStat(ctx, args.targetUserId, { followersCount: 1 })

    await createNotification(ctx, {
      type: "follow",
      recipientId: args.targetUserId,
      actorId: me._id,
    })

    return { followed: true, followId }
  },
})

export const unfollowUser = mutation({
  args: { targetUserId: v.id("users") },
  returns: v.object({ removed: v.boolean() }),
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx)

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", me._id).eq("followingId", args.targetUserId),
      )
      .unique()
    if (!existing) return { removed: false }

    await ctx.db.delete(existing._id)
    await incrementUserStat(ctx, args.targetUserId, { followersCount: -1 })

    return { removed: true }
  },
})

// ============================================================================
// Public queries
// ============================================================================

export const isFollowing = query({
  args: { targetUserId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx, { optional: true })
    if (!me) return false

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", me._id).eq("followingId", args.targetUserId),
      )
      .unique()
    return existing !== null
  },
})

export const getFollowerCount = query({
  args: { userId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect()
    return follows.length
  },
})
