import { v } from "convex/values"
import { mutation } from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx)

    return await ctx.storage.generateUploadUrl()
  },
})
