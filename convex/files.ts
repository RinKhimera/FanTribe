import { v } from "convex/values"
import { mutation } from "./_generated/server"

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    return await ctx.storage.generateUploadUrl()
  },
})
