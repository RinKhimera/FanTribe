import { v } from "convex/values"
import { api } from "./_generated/api"
import { internalMutation, mutation } from "./_generated/server"

export const createDraftAsset = mutation({
  args: {
    author: v.id("users"),
    publicId: v.string(),
    assetType: v.string(),
  },
  handler: async (ctx, args) => {
    const { author, publicId, assetType } = args

    const draftAsset = await ctx.db.insert("assetsDraft", {
      author,
      publicId,
      assetType,
    })

    return draftAsset
  },
})

export const deleteDraftAsset = mutation({
  args: { publicId: v.string() },
  handler: async (ctx, args) => {
    const { publicId } = args

    const asset = await ctx.db
      .query("assetsDraft")
      .withIndex("by_publicId", (q) => q.eq("publicId", publicId))
      .first()

    if (asset) {
      await ctx.db.delete(asset._id)
      return { success: true }
    }

    return { success: false, error: "Asset not found" }
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

    // Les assets de posts contiennent maintenant des URLs complètes Bunny.net
    for (const asset of draftAssets) {
      // Le publicId est maintenant une URL complète pour Bunny.net
      mediaUrls.push(asset.publicId)

      try {
        await ctx.db.delete(asset._id)
        deleted++
      } catch (e) {
        console.error("Failed to delete draft asset record:", asset._id, e)
        errors++
      }
    }

    // Les documents de validation peuvent encore utiliser Cloudinary (à migrer plus tard)
    for (const doc of draftDocuments) {
      mediaUrls.push(doc.publicId)
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
        await ctx.scheduler.runAfter(0, api.internalActions.deleteBunnyAssets, {
          mediaUrls,
        })
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
