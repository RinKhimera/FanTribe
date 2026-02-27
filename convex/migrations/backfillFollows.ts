import { v } from "convex/values"
import { internalMutation, internalQuery } from "../_generated/server"
import { incrementUserStat } from "../userStats"

/**
 * Migration: Backfill follows from active subscriptions + auto-follow FanTribe.
 *
 * Run via Convex dashboard:
 *   1. backfillFollowsAction:backfillFollowsFromSubscriptions({})
 *   2. backfillFollowsAction:backfillFanTribeFollow({ fanTribeId: "..." })
 *
 * Delete both files after migration completes.
 */

// ============================================================================
// Query: paginated active subscriptions
// ============================================================================

export const getActiveSubscriptionsForBackfill = internalQuery({
  args: { cursor: v.optional(v.string()), batchSize: v.number() },
  returns: v.object({
    subscriptions: v.array(
      v.object({
        subscriber: v.id("users"),
        creator: v.id("users"),
      }),
    ),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .paginate({
        numItems: args.batchSize,
        cursor: args.cursor ?? null,
      })
    return {
      subscriptions: result.page.map((s) => ({
        subscriber: s.subscriber,
        creator: s.creator,
      })),
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    }
  },
})

// ============================================================================
// Query: paginated user IDs
// ============================================================================

export const getAllUserIds = internalQuery({
  args: { cursor: v.optional(v.string()), batchSize: v.number() },
  returns: v.object({
    userIds: v.array(v.id("users")),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("users")
      .paginate({
        numItems: args.batchSize,
        cursor: args.cursor ?? null,
      })
    return {
      userIds: result.page.map((u) => u._id),
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    }
  },
})

// ============================================================================
// Mutation: idempotent follow creation
// ============================================================================

export const createFollowIfNotExists = internalMutation({
  args: { followerId: v.id("users"), followingId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId),
      )
      .unique()
    if (!existing) {
      await ctx.db.insert("follows", {
        followerId: args.followerId,
        followingId: args.followingId,
      })
      await incrementUserStat(ctx, args.followingId, { followersCount: 1 })
    }
    return null
  },
})
