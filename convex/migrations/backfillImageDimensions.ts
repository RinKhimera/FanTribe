import { v } from "convex/values"
import { internal } from "../_generated/api"
import { internalAction, internalMutation, internalQuery } from "../_generated/server"
import { postMediaValidator } from "../lib/validators"

/**
 * Migration: Backfill image dimensions (width/height) for existing posts.
 *
 * Run once via Convex dashboard:
 *   backfillImageDimensions({})
 *
 * It self-schedules subsequent batches with 1s delay.
 * Delete this file after migration completes.
 */

// ============================================================================
// Query: find posts needing dimension backfill
// ============================================================================

export const getPostsNeedingDimensions = internalQuery({
  args: { cursor: v.optional(v.string()), batchSize: v.number() },
  returns: v.object({
    posts: v.array(
      v.object({
        _id: v.id("posts"),
        medias: v.array(postMediaValidator),
      }),
    ),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("posts")
      .order("asc")
      .paginate({
        numItems: args.batchSize,
        cursor: args.cursor ?? null,
      })

    // Filter to posts that have image medias without dimensions
    const needsBackfill = result.page
      .filter((post) =>
        post.medias.some(
          (m) => m.type === "image" && (!m.width || !m.height),
        ),
      )
      .map((post) => ({ _id: post._id, medias: post.medias }))

    return {
      posts: needsBackfill,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    }
  },
})

// ============================================================================
// Mutation: patch one post's medias array
// ============================================================================

export const patchPostMediaDimensions = internalMutation({
  args: {
    postId: v.id("posts"),
    medias: v.array(postMediaValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, { medias: args.medias })
    return null
  },
})

// ============================================================================
// Action: orchestrator — fetch images, extract dimensions, patch
// ============================================================================

export const backfillImageDimensions = internalAction({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 25
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sizeOf = require("image-size")

    const { posts, continueCursor, isDone } = await ctx.runQuery(
      internal.migrations.backfillImageDimensions.getPostsNeedingDimensions,
      { cursor: args.cursor, batchSize },
    )

    let patchedCount = 0

    for (const post of posts) {
      const updatedMedias = await Promise.all(
        post.medias.map(async (media) => {
          if (media.type !== "image" || (media.width && media.height)) {
            return media
          }
          try {
            const res = await fetch(media.url)
            const buffer = Buffer.from(await res.arrayBuffer())
            const dims = sizeOf(buffer)
            if (dims.width && dims.height) {
              return { ...media, width: dims.width, height: dims.height }
            }
            return media
          } catch (e) {
            console.error(`Failed to get dimensions for ${media.url}:`, e)
            return media
          }
        }),
      )

      await ctx.runMutation(
        internal.migrations.backfillImageDimensions.patchPostMediaDimensions,
        { postId: post._id, medias: updatedMedias },
      )
      patchedCount++
    }

    console.log(
      `Backfill batch done: ${patchedCount} posts patched. isDone: ${isDone}`,
    )

    if (!isDone) {
      await ctx.scheduler.runAfter(
        1000,
        internal.migrations.backfillImageDimensions.backfillImageDimensions,
        { cursor: continueCursor, batchSize },
      )
    } else {
      console.log("Backfill complete! All image dimensions have been updated.")
    }

    return null
  },
})
