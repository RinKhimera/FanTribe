"use node"

import { v } from "convex/values"
import { internal } from "../_generated/api"
import { internalAction } from "../_generated/server"

/**
 * Step 1: Backfill follows from active subscriptions.
 * Processes in batches of 25, self-scheduling continuation.
 *
 * Run: backfillFollowsAction:backfillFollowsFromSubscriptions({})
 */
export const backfillFollowsFromSubscriptions = internalAction({
  args: { cursor: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batch = await ctx.runQuery(
      internal.migrations.backfillFollows.getActiveSubscriptionsForBackfill,
      { cursor: args.cursor, batchSize: 25 },
    )

    for (const sub of batch.subscriptions) {
      await ctx.runMutation(
        internal.migrations.backfillFollows.createFollowIfNotExists,
        { followerId: sub.subscriber, followingId: sub.creator },
      )
    }

    console.log(
      `Processed ${batch.subscriptions.length} subscriptions, isDone: ${batch.isDone}`,
    )

    if (!batch.isDone) {
      await ctx.scheduler.runAfter(
        1000,
        internal.migrations.backfillFollowsAction
          .backfillFollowsFromSubscriptions,
        { cursor: batch.continueCursor },
      )
    }

    return null
  },
})

/**
 * Step 2: Make all users follow FanTribe official account.
 * Pass the FanTribe user ID from the Convex dashboard.
 *
 * Run: backfillFollowsAction:backfillFanTribeFollow({ fanTribeId: "jd7..." })
 */
export const backfillFanTribeFollow = internalAction({
  args: { cursor: v.optional(v.string()), fanTribeId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batch = await ctx.runQuery(
      internal.migrations.backfillFollows.getAllUserIds,
      { cursor: args.cursor, batchSize: 25 },
    )

    for (const userId of batch.userIds) {
      if (userId !== args.fanTribeId) {
        await ctx.runMutation(
          internal.migrations.backfillFollows.createFollowIfNotExists,
          {
            followerId: userId,
            followingId: args.fanTribeId as typeof userId,
          },
        )
      }
    }

    console.log(
      `Processed ${batch.userIds.length} users for FanTribe follow, isDone: ${batch.isDone}`,
    )

    if (!batch.isDone) {
      await ctx.scheduler.runAfter(
        1000,
        internal.migrations.backfillFollowsAction.backfillFanTribeFollow,
        { cursor: batch.continueCursor, fanTribeId: args.fanTribeId },
      )
    }

    return null
  },
})
