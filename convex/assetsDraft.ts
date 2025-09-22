import { v } from "convex/values"
import { api, internal } from "./_generated/api"
import { internalMutation, mutation } from "./_generated/server"

export const createDraftAsset = mutation({
  args: {
    author: v.id("users"),
    mediaId: v.string(),
    mediaUrl: v.string(),
    assetType: v.union(v.literal("image"), v.literal("video")),
  },
  handler: async (ctx, args) => {
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

export const deleteDraftAsset = mutation({
  args: { mediaId: v.string() },
  handler: async (ctx, args) => {
    const { mediaId } = args

    const asset = await ctx.db
      .query("assetsDraft")
      .withIndex("by_mediaId", (q) => q.eq("mediaId", mediaId))
      .first()

    if (!asset) {
      return { success: false, error: "Asset not found" }
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

export const cleanUpDraftAssets = internalMutation({
  handler: async (ctx) => {
    const draftAssets = await ctx.db.query("assetsDraft").collect()
    const draftDocuments = await ctx.db
      .query("validationDocumentsDraft")
      .collect()

    const totalAssets = draftAssets.length + draftDocuments.length
    console.log(
      `Found ${totalAssets} draft items to clean up (${draftAssets.length} post assets + ${draftDocuments.length} validation documents)`,
    )

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
          api.internalActions.deleteMultipleBunnyAssets,
          {
            mediaUrls,
          },
        )
        console.log(
          `Scheduled deletion of ${mediaUrls.length} Bunny.net assets`,
        )
      } catch (e) {
        console.error("Failed to schedule Bunny.net assets deletion:", e)
        errors++
      }
    }

    console.log(
      `Cleaned up draft assets: total=${totalAssets}, dbDeleted=${deleted}, errors=${errors}`,
    )

    return {
      total: totalAssets,
      scheduledBunnyDeletes: mediaUrls.length,
      dbDeleted: deleted,
      errors,
    }
  },
})
