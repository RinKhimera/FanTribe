import { v } from "convex/values"
import { mutation } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"
import { createAppError } from "./lib/errors"

export const createDraftDocument = mutation({
  args: {
    userId: v.id("users"),
    mediaUrl: v.string(),
    documentType: v.union(v.literal("identity_card"), v.literal("selfie")),
  },
  returns: v.id("validationDocumentsDraft"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    if (user._id !== args.userId) {
      throw createAppError("FORBIDDEN")
    }

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
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const { mediaUrl } = args

    // Rechercher le document par mediaUrl
    const document = await ctx.db
      .query("validationDocumentsDraft")
      .withIndex("by_mediaUrl", (q) => q.eq("mediaUrl", mediaUrl))
      .first()

    if (!document) {
      return { success: false, error: "Document not found" }
    }

    if (document.userId !== user._id) {
      throw createAppError("FORBIDDEN")
    }

    await ctx.db.delete(document._id)
    return { success: true }
  },
})
