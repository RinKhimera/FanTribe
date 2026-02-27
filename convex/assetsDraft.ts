import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalMutation, mutation } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"
import { createAppError } from "./lib/errors"

export const createDraftAsset = mutation({
  args: {
    author: v.id("users"),
    mediaId: v.string(),
    mediaUrl: v.string(),
    assetType: v.union(v.literal("image"), v.literal("video")),
  },
  returns: v.id("assetsDraft"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    if (user._id !== args.author) {
      throw createAppError("FORBIDDEN")
    }

    const { author, mediaId, mediaUrl, assetType } = args

    const draftAsset = await ctx.db.insert("assetsDraft", {
      author,
      mediaId,
      mediaUrl,
      assetType,
    })

    return draftAsset
  },
})

export const deleteDraftWithAsset = mutation({
  args: { mediaId: v.string() },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    message: v.optional(v.string()),
    statusCode: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const { mediaId } = args

    const asset = await ctx.db
      .query("assetsDraft")
      .withIndex("by_mediaId", (q) => q.eq("mediaId", mediaId))
      .first()

    if (!asset) {
      return { success: false, error: "Asset not found" }
    }

    if (asset.author !== user._id) {
      throw createAppError("FORBIDDEN")
    }

    try {
      // Supprimer l'asset de Bunny.net via une action interne
      await ctx.scheduler.runAfter(
        0,
        internal.internalActions.deleteSingleBunnyAsset,
        {
          mediaId: asset.mediaId,
          assetType: asset.assetType,
        },
      )

      // Supprimer de la DB Convex immédiatement
      await ctx.db.delete(asset._id)
      return {
        success: true,
        message: "Asset supprimé de la DB, suppression Bunny en cours",
      }
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error)
      return {
        success: false,
        message: "Erreur serveur lors de la suppression",
        statusCode: 500,
      }
    }
  },
})

export const deleteDraftWithoutAsset = mutation({
  args: { mediaId: v.string() },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    message: v.optional(v.string()),
    statusCode: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const { mediaId } = args

    const asset = await ctx.db
      .query("assetsDraft")
      .withIndex("by_mediaId", (q) => q.eq("mediaId", mediaId))
      .first()

    if (!asset) {
      return { success: false, error: "Asset not found" }
    }

    if (asset.author !== user._id) {
      throw createAppError("FORBIDDEN")
    }

    try {
      // Supprimer de la DB Convex immédiatement
      await ctx.db.delete(asset._id)
      return {
        success: true,
        message: "Asset supprimé de la DB, suppression Bunny différée",
      }
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error)
      return {
        success: false,
        message: "Erreur serveur lors de la suppression",
        statusCode: 500,
      }
    }
  },
})

export const cleanUpDraftAssets = internalMutation({
  args: {},
  returns: v.object({
    total: v.number(),
    scheduledBunnyDeletes: v.number(),
    dbDeleted: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx) => {
    const draftAssets = await ctx.db.query("assetsDraft").take(1000)
    const draftDocuments = await ctx.db
      .query("validationDocumentsDraft")
      .take(1000)

    const totalAssets = draftAssets.length + draftDocuments.length

    let deleted = 0
    let errors = 0

    // Collecter toutes les URLs de médias pour suppression en lot
    const mediaUrls: string[] = []

    for (const asset of draftAssets) {
      mediaUrls.push(asset.mediaUrl)
      try {
        await ctx.db.delete(asset._id)
        deleted++
      } catch (e) {
        console.error("Failed to delete draft asset record:", asset._id, e)
        errors++
      }
    }

    for (const doc of draftDocuments) {
      mediaUrls.push(doc.mediaUrl)
      try {
        await ctx.db.delete(doc._id)
        deleted++
      } catch (e) {
        console.error("Failed to delete draft validation record:", doc._id, e)
        errors++
      }
    }

    // Planifier la suppression des médias Bunny.net en lot
    if (mediaUrls.length > 0) {
      try {
        await ctx.scheduler.runAfter(
          0,
          internal.internalActions.deleteMultipleBunnyAssets,
          {
            mediaUrls,
          },
        )
      } catch (e) {
        console.error("Failed to schedule Bunny.net assets deletion:", e)
        errors++
      }
    }

    return {
      total: totalAssets,
      scheduledBunnyDeletes: mediaUrls.length,
      dbDeleted: deleted,
      errors,
    }
  },
})
