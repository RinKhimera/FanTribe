import { v } from "convex/values"
import { internalMutation, internalQuery } from "../_generated/server"
import { postMediaValidator } from "../lib/validators"

/**
 * Migration v2: Re-backfill image dimensions with EXIF orientation fix.
 *
 * Run once via Convex dashboard:
 *   backfillImageDimensionsAction:backfillImageDimensions({})
 *
 * Delete both files after migration completes.
 */

// ============================================================================
// Query: find ALL posts with image medias (to fix EXIF orientation)
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

    // Select ALL posts with image medias (re-fix dimensions with EXIF)
    const withImages = result.page
      .filter((post) => post.medias.some((m) => m.type === "image"))
      .map((post) => ({ _id: post._id, medias: post.medias }))

    return {
      posts: withImages,
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
