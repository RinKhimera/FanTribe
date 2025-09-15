import { v } from "convex/values"
import { mutation } from "./_generated/server"

export const createDraftDocument = mutation({
  args: {
    userId: v.id("users"),
    publicId: v.string(),
    documentType: v.union(v.literal("identity_card"), v.literal("selfie")),
  },
  handler: async (ctx, args) => {
    const { userId, publicId, documentType } = args

    const draftDocument = await ctx.db.insert("validationDocumentsDraft", {
      userId,
      publicId,
      documentType,
    })

    return draftDocument
  },
})

export const deleteDraftDocument = mutation({
  args: { publicId: v.string() },
  handler: async (ctx, args) => {
    const { publicId } = args

    // Rechercher le document par publicId
    const document = await ctx.db
      .query("validationDocumentsDraft")
      .withIndex("by_publicId", (q) => q.eq("publicId", publicId))
      .first()

    // Si le document existe, le supprimer
    if (document) {
      await ctx.db.delete(document._id)
      return { success: true }
    }

    return { success: false, error: "Document not found" }
  },
})
