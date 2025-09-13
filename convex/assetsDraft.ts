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

    let scheduled = 0
    let deleted = 0
    let errors = 0

    // Utilitaire de planification (ignore erreurs de scheduling individuelles)
    const scheduleDeletion = async (publicId: string) => {
      try {
        await ctx.scheduler.runAfter(
          0,
          api.internalActions.deleteCloudinaryAsset,
          { publicId },
        )
        scheduled++
      } catch (e) {
        console.error("Failed to schedule Cloudinary deletion:", publicId, e)
        errors++
      }
    }

    // Traiter assets de posts
    for (const asset of draftAssets) {
      await scheduleDeletion(asset.publicId)
      try {
        await ctx.db.delete(asset._id)
        deleted++
      } catch (e) {
        console.error("Failed to delete draft asset record:", asset._id, e)
        errors++
      }
    }

    // Traiter documents de validation
    for (const doc of draftDocuments) {
      await scheduleDeletion(doc.publicId)
      try {
        await ctx.db.delete(doc._id)
        deleted++
      } catch (e) {
        console.error("Failed to delete draft validation record:", doc._id, e)
        errors++
      }
    }

    console.log(
      `Cleaned up draft assets: total=${totalAssets}, scheduled=${scheduled}, dbDeleted=${deleted}, errors=${errors}`,
    )

    return {
      total: totalAssets,
      scheduledCloudinaryDeletes: scheduled,
      dbDeleted: deleted,
      errors,
    }
  },
})
