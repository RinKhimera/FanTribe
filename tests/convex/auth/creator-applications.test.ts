import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("creator-applications", () => {
  it("should submit and review a creator application", async () => {
    const t = convexTest(schema)

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Applicant",
        tokenIdentifier: "applicant_id",
        accountType: "USER",
        email: "applicant@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Admin",
        tokenIdentifier: "admin_id",
        accountType: "SUPERUSER",
        email: "admin@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })

    // Submit
    await applicant.mutation(api.creatorApplications.submitApplication, {
      userId,
      personalInfo: {
        fullName: "John Doe",
        dateOfBirth: "1990-01-01",
        address: "123 Main St",
        phoneNumber: "123456789",
      },
      applicationReason: "I want to be a creator",
      identityDocuments: [
        {
          type: "identity_card",
          url: "https://test.com/id.png",
          publicId: "id_1",
          uploadedAt: Date.now(),
        },
      ],
    })

    const app = await t.run(async (ctx) => {
      return await ctx.db
        .query("creatorApplications")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique()
    })
    expect(app?.status).toBe("pending")

    const admin = t.withIdentity({ tokenIdentifier: "admin_id" })

    // Review - Approve
    await admin.mutation(api.creatorApplications.reviewApplication, {
      applicationId: app!._id,
      decision: "approved",
      adminNotes: "Looks good",
    })

    const updatedUser = await t.run(async (ctx) => {
      return await ctx.db.get(userId)
    })
    expect(updatedUser?.accountType).toBe("CREATOR")

    const updatedApp = await t.run(async (ctx) => {
      return await ctx.db.get(app!._id)
    })
    expect(updatedApp?.status).toBe("approved")
  })

  it("should reject a creator application", async () => {
    const t = convexTest(schema)

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Applicant",
        tokenIdentifier: "applicant_id",
        accountType: "USER",
        email: "applicant@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Admin",
        tokenIdentifier: "admin_id",
        accountType: "SUPERUSER",
        email: "admin@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })

    // Submit
    await applicant.mutation(api.creatorApplications.submitApplication, {
      userId,
      personalInfo: {
        fullName: "John Doe",
        dateOfBirth: "1990-01-01",
        address: "123 Main St",
        phoneNumber: "123456789",
      },
      applicationReason: "I want to be a creator",
      identityDocuments: [],
    })

    const app = await t.run(async (ctx) => {
      return await ctx.db
        .query("creatorApplications")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique()
    })

    const admin = t.withIdentity({ tokenIdentifier: "admin_id" })

    // Review - Reject
    await admin.mutation(api.creatorApplications.reviewApplication, {
      applicationId: app!._id,
      decision: "rejected",
      adminNotes: "Not enough info",
    })

    const updatedUser = await t.run(async (ctx) => {
      return await ctx.db.get(userId)
    })
    expect(updatedUser?.accountType).toBe("USER")

    const updatedApp = await t.run(async (ctx) => {
      return await ctx.db.get(app!._id)
    })
    expect(updatedApp?.status).toBe("rejected")
  })
})
