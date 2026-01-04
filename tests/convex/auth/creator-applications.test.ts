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
        whatsappNumber: "+237123456789",
        mobileMoneyNumber: "+237123456789",
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
        whatsappNumber: "+237123456789",
        mobileMoneyNumber: "+237123456789",
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

  describe("requestReapplication", () => {
    it("should allow reapplication after first rejection", async () => {
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

      // Create a rejected application with immediate reapplication allowed
      await t.run(async (ctx) => {
        return await ctx.db.insert("creatorApplications", {
          userId,
          status: "rejected",
          personalInfo: {
            fullName: "John Doe",
            dateOfBirth: "1990-01-01",
            address: "123 Main St",
            whatsappNumber: "+237123456789",
            mobileMoneyNumber: "+237123456789",
          },
          applicationReason: "I want to be a creator",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
          reviewedAt: Date.now() - 43200000,
          rejectionCount: 1,
          reapplicationAllowedAt: Date.now() - 1000, // Already allowed
        })
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })
      const result = await applicant.mutation(
        api.creatorApplications.requestReapplication,
        { userId }
      )

      expect(result.canReapply).toBe(true)
      expect(result.mustContactSupport).toBe(false)
    })

    it("should block reapplication during soft lock period", async () => {
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

      const futureTime = Date.now() + 86400000 // 24h from now

      // Create a rejected application with 24h lock
      await t.run(async (ctx) => {
        return await ctx.db.insert("creatorApplications", {
          userId,
          status: "rejected",
          personalInfo: {
            fullName: "John Doe",
            dateOfBirth: "1990-01-01",
            address: "123 Main St",
            whatsappNumber: "+237123456789",
            mobileMoneyNumber: "+237123456789",
          },
          applicationReason: "I want to be a creator",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
          reviewedAt: Date.now(),
          rejectionCount: 2,
          reapplicationAllowedAt: futureTime,
        })
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })
      const result = await applicant.mutation(
        api.creatorApplications.requestReapplication,
        { userId }
      )

      expect(result.canReapply).toBe(false)
      expect(result.waitUntil).toBe(futureTime)
    })

    it("should require support contact after 3 rejections", async () => {
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

      // Create 3 rejected applications
      await t.run(async (ctx) => {
        for (let i = 0; i < 3; i++) {
          await ctx.db.insert("creatorApplications", {
            userId,
            status: "rejected",
            personalInfo: {
              fullName: "John Doe",
              dateOfBirth: "1990-01-01",
              address: "123 Main St",
              whatsappNumber: "+237123456789",
            mobileMoneyNumber: "+237123456789",
            },
            applicationReason: "I want to be a creator",
            identityDocuments: [],
            submittedAt: Date.now() - 86400000 * (3 - i),
            reviewedAt: Date.now() - 43200000 * (3 - i),
            rejectionCount: i + 1,
          })
        }
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })
      const result = await applicant.mutation(
        api.creatorApplications.requestReapplication,
        { userId }
      )

      expect(result.canReapply).toBe(false)
      expect(result.mustContactSupport).toBe(true)
    })
  })

  describe("getUserApplication", () => {
    it("should prioritize pending over rejected", async () => {
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

      // Create rejected and pending applications
      await t.run(async (ctx) => {
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "rejected",
          personalInfo: {
            fullName: "John Doe",
            dateOfBirth: "1990-01-01",
            address: "123 Main St",
            whatsappNumber: "+237123456789",
            mobileMoneyNumber: "+237123456789",
          },
          applicationReason: "First attempt",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
          rejectionCount: 1,
        })
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "John Doe",
            dateOfBirth: "1990-01-01",
            address: "123 Main St",
            whatsappNumber: "+237123456789",
            mobileMoneyNumber: "+237123456789",
          },
          applicationReason: "Second attempt",
          identityDocuments: [],
          submittedAt: Date.now(),
          attemptNumber: 2,
        })
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })
      const app = await applicant.query(api.creatorApplications.getUserApplication, {
        userId,
      })

      expect(app?.status).toBe("pending")
      expect(app?.applicationReason).toBe("Second attempt")
    })

    it("should return null for user with no applications", async () => {
      const t = convexTest(schema)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      const app = await user.query(api.creatorApplications.getUserApplication, {
        userId,
      })

      expect(app).toBeNull()
    })
  })

  describe("getAllApplications", () => {
    it("should return applications with enriched user data", async () => {
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

      await t.run(async (ctx) => {
        return await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "John Doe",
            dateOfBirth: "1990-01-01",
            address: "123 Main St",
            whatsappNumber: "+237123456789",
            mobileMoneyNumber: "+237123456789",
          },
          applicationReason: "I want to be a creator",
          identityDocuments: [],
          submittedAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const applications = await admin.query(api.creatorApplications.getAllApplications)

      expect(applications).toHaveLength(1)
      expect(applications[0].user?.name).toBe("Applicant")
    })

    it("should reject non-admin users", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Regular User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      await expect(
        user.query(api.creatorApplications.getAllApplications)
      ).rejects.toThrow("Unauthorized")
    })
  })

  describe("revokeCreatorStatus", () => {
    it("should revoke creator status and reject the application", async () => {
      const t = convexTest(schema)

      const creatorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Creator",
          tokenIdentifier: "creator_id",
          accountType: "CREATOR",
          email: "creator@test.com",
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

      // Create an approved application for the creator
      const appId = await t.run(async (ctx) => {
        return await ctx.db.insert("creatorApplications", {
          userId: creatorId,
          status: "approved",
          personalInfo: {
            fullName: "Creator Name",
            dateOfBirth: "1990-01-01",
            address: "123 Main St",
            whatsappNumber: "+237123456789",
            mobileMoneyNumber: "+237123456789",
          },
          applicationReason: "I want to be a creator",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
          reviewedAt: Date.now() - 43200000,
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })

      await admin.mutation(api.creatorApplications.revokeCreatorStatus, {
        userId: creatorId,
        reason: "Violation of terms",
      })

      // User should be demoted to USER
      const updatedUser = await t.run(async (ctx) => {
        return await ctx.db.get(creatorId)
      })
      expect(updatedUser?.accountType).toBe("USER")

      // Application should be rejected
      const updatedApp = await t.run(async (ctx) => {
        return await ctx.db.get(appId)
      })
      expect(updatedApp?.status).toBe("rejected")
      expect(updatedApp?.adminNotes).toBe("Violation of terms")
    })

    it("should reject revocation of non-creator user", async () => {
      const t = convexTest(schema)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Regular User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
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

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })

      await expect(
        admin.mutation(api.creatorApplications.revokeCreatorStatus, {
          userId,
        })
      ).rejects.toThrow("L'utilisateur n'est pas un créateur")
    })

    it("should reject non-admin users", async () => {
      const t = convexTest(schema)

      const creatorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Creator",
          tokenIdentifier: "creator_id",
          accountType: "CREATOR",
          email: "creator@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Regular User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })

      await expect(
        user.mutation(api.creatorApplications.revokeCreatorStatus, {
          userId: creatorId,
        })
      ).rejects.toThrow("Unauthorized")
    })
  })

  describe("reviewApplication validation", () => {
    it("should prevent rejecting an approved application", async () => {
      const t = convexTest(schema)

      const creatorId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Creator",
          tokenIdentifier: "creator_id",
          accountType: "CREATOR",
          email: "creator@test.com",
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

      const appId = await t.run(async (ctx) => {
        return await ctx.db.insert("creatorApplications", {
          userId: creatorId,
          status: "approved",
          personalInfo: {
            fullName: "John Doe",
            dateOfBirth: "1990-01-01",
            address: "123 Main St",
            whatsappNumber: "+237123456789",
            mobileMoneyNumber: "+237123456789",
          },
          applicationReason: "I want to be a creator",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
          reviewedAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })

      await expect(
        admin.mutation(api.creatorApplications.reviewApplication, {
          applicationId: appId,
          decision: "rejected",
          adminNotes: "Changed my mind",
        })
      ).rejects.toThrow("Impossible de rejeter une candidature déjà approuvée")
    })

    it("should allow approving a rejected application", async () => {
      const t = convexTest(schema)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
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

      const appId = await t.run(async (ctx) => {
        return await ctx.db.insert("creatorApplications", {
          userId,
          status: "rejected",
          personalInfo: {
            fullName: "John Doe",
            dateOfBirth: "1990-01-01",
            address: "123 Main St",
            whatsappNumber: "+237123456789",
            mobileMoneyNumber: "+237123456789",
          },
          applicationReason: "I want to be a creator",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
          reviewedAt: Date.now() - 43200000,
          rejectionCount: 1,
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })

      await admin.mutation(api.creatorApplications.reviewApplication, {
        applicationId: appId,
        decision: "approved",
        adminNotes: "Correcting the error",
      })

      const updatedApp = await t.run(async (ctx) => {
        return await ctx.db.get(appId)
      })
      expect(updatedApp?.status).toBe("approved")

      const updatedUser = await t.run(async (ctx) => {
        return await ctx.db.get(userId)
      })
      expect(updatedUser?.accountType).toBe("CREATOR")
    })
  })
})
