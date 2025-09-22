import { v } from "convex/values"
import { mutation } from "./_generated/server"

export const createDraftDocument = mutation({
  args: {
    userId: v.id("users"),
    mediaUrl: v.string(),
    documentType: v.union(v.literal("identity_card"), v.literal("selfie")),
  },
  handler: async (ctx, args) => {
    const { userId, mediaUrl, documentType } = args

    const draftDocument = await ctx.db.insert("validationDocumentsDraft", {
      userId,
      mediaUrl,
      documentType,
    })

    return draftDocument
  },
})

export const deleteDraftDocument = mutation({
  args: { mediaUrl: v.string() },
  handler: async (ctx, args) => {
    const { mediaUrl } = args

    // Rechercher le document par mediaUrl
    const document = await ctx.db
      .query("validationDocumentsDraft")
      .withIndex("by_mediaUrl", (q) => q.eq("mediaUrl", mediaUrl))
      .first()

    // Si le document existe, le supprimer
    if (document) {
      await ctx.db.delete(document._id)
      return { success: true }
    }

    return { success: false, error: "Document not found" }
  },
})
