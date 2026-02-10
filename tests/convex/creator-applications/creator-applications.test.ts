import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("creator-applications", () => {
  describe("submitApplication", () => {
    it("should submit a creator application successfully", async () => {
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

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })

      const result = await applicant.mutation(
        api.creatorApplications.submitApplication,
        {
          userId,
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Je veux partager du contenu exclusif",
          identityDocuments: [
            {
              type: "identity_card",
              url: "https://cdn.test.com/id-card.jpg",
              publicId: "doc_1",
              uploadedAt: Date.now(),
            },
            {
              type: "selfie",
              url: "https://cdn.test.com/selfie.jpg",
              publicId: "doc_2",
              uploadedAt: Date.now(),
            },
          ],
        },
      )

      expect(result.success).toBe(true)

      // Verify the application was created with correct data
      const application = await t.run(async (ctx) => {
        return await ctx.db
          .query("creatorApplications")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()
      })

      expect(application).not.toBeNull()
      expect(application!.status).toBe("pending")
      expect(application!.personalInfo.fullName).toBe("Jean Dupont")
      expect(application!.applicationReason).toBe(
        "Je veux partager du contenu exclusif",
      )
      expect(application!.identityDocuments).toHaveLength(2)
      expect(application!.attemptNumber).toBe(1)
      expect(application!.rejectionCount).toBe(0)
    })

    it("should reject if an active application already exists", async () => {
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

      // Create an existing pending application
      await t.run(async (ctx) => {
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "First attempt",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
        })
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })

      await expect(
        applicant.mutation(api.creatorApplications.submitApplication, {
          userId,
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Duplicate attempt",
          identityDocuments: [],
        }),
      ).rejects.toThrow("Une candidature est déjà en cours")
    })

    it("should also reject if an approved application exists", async () => {
      const t = convexTest(schema)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Applicant",
          tokenIdentifier: "applicant_id",
          accountType: "CREATOR",
          email: "applicant@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      // Create an approved application
      await t.run(async (ctx) => {
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "approved",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Approved application",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
          reviewedAt: Date.now() - 43200000,
        })
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })

      await expect(
        applicant.mutation(api.creatorApplications.submitApplication, {
          userId,
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Redundant attempt",
          identityDocuments: [],
        }),
      ).rejects.toThrow("Une candidature est déjà en cours")
    })

    it("should allow reapplication after rejection", async () => {
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

      // Create a rejected application
      await t.run(async (ctx) => {
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "rejected",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Rejected attempt",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
          reviewedAt: Date.now() - 43200000,
          rejectionCount: 1,
          adminNotes: "Missing documents",
        })
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })

      const result = await applicant.mutation(
        api.creatorApplications.submitApplication,
        {
          userId,
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Second attempt with better docs",
          identityDocuments: [
            {
              type: "identity_card",
              url: "https://cdn.test.com/id-card.jpg",
              publicId: "doc_1",
              uploadedAt: Date.now(),
            },
          ],
        },
      )

      expect(result.success).toBe(true)

      // Verify the new application has correct attempt metadata
      const applications = await t.run(async (ctx) => {
        return await ctx.db
          .query("creatorApplications")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect()
      })

      // Should have both the rejected and the new pending application
      expect(applications).toHaveLength(2)

      const newApp = applications.find((a) => a.status === "pending")
      expect(newApp).toBeDefined()
      expect(newApp!.attemptNumber).toBe(2)
      expect(newApp!.rejectionCount).toBe(1)
      expect(newApp!.previousRejectionReason).toBe("Missing documents")
    })

    it("should reject unauthenticated submission", async () => {
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

      await expect(
        t.mutation(api.creatorApplications.submitApplication, {
          userId,
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Unauthorized",
          identityDocuments: [],
        }),
      ).rejects.toThrow("Unauthorized")
    })

    it("should reject submission for a different user", async () => {
      const t = convexTest(schema)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target User",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Impersonator",
          tokenIdentifier: "impersonator_id",
          accountType: "USER",
          email: "impersonator@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const impersonator = t.withIdentity({
        tokenIdentifier: "impersonator_id",
      })

      await expect(
        impersonator.mutation(api.creatorApplications.submitApplication, {
          userId,
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Impersonation attempt",
          identityDocuments: [],
        }),
      ).rejects.toThrow("Unauthorized")
    })

    it("should clean up validation document drafts after submission", async () => {
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

      // Create draft documents
      await t.run(async (ctx) => {
        await ctx.db.insert("validationDocumentsDraft", {
          userId,
          mediaUrl: "https://cdn.test.com/draft-id.jpg",
          documentType: "identity_card",
        })
        await ctx.db.insert("validationDocumentsDraft", {
          userId,
          mediaUrl: "https://cdn.test.com/draft-selfie.jpg",
          documentType: "selfie",
        })
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })

      await applicant.mutation(api.creatorApplications.submitApplication, {
        userId,
        personalInfo: {
          fullName: "Jean Dupont",
          dateOfBirth: "1995-05-15",
          address: "Douala, Cameroun",
          whatsappNumber: "+237690000000",
          mobileMoneyNumber: "+237670000000",
        },
        applicationReason: "Testing draft cleanup",
        identityDocuments: [],
      })

      // Verify drafts were deleted
      const drafts = await t.run(async (ctx) => {
        return await ctx.db
          .query("validationDocumentsDraft")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect()
      })

      expect(drafts).toHaveLength(0)
    })
  })

  describe("getUserApplication", () => {
    it("should return the users application", async () => {
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
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "I want to create",
          identityDocuments: [],
          submittedAt: Date.now(),
        })
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })
      const result = await applicant.query(
        api.creatorApplications.getUserApplication,
        { userId },
      )

      expect(result).not.toBeNull()
      expect(result!.status).toBe("pending")
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
      const result = await user.query(
        api.creatorApplications.getUserApplication,
        { userId },
      )

      expect(result).toBeNull()
    })

    it("should prioritize pending over rejected application", async () => {
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
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "rejected",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "First rejected",
          identityDocuments: [],
          submittedAt: Date.now() - 86400000,
          rejectionCount: 1,
        })
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Second pending",
          identityDocuments: [],
          submittedAt: Date.now(),
          attemptNumber: 2,
        })
      })

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })
      const result = await applicant.query(
        api.creatorApplications.getUserApplication,
        { userId },
      )

      expect(result!.status).toBe("pending")
      expect(result!.applicationReason).toBe("Second pending")
    })

    it("should allow superuser to view any users application", async () => {
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
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "I want to create",
          identityDocuments: [],
          submittedAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.query(
        api.creatorApplications.getUserApplication,
        { userId },
      )

      expect(result).not.toBeNull()
      expect(result!.status).toBe("pending")
    })

    it("should reject non-owner non-superuser from viewing another users application", async () => {
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
          name: "Other",
          tokenIdentifier: "other_id",
          accountType: "USER",
          email: "other@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "I want to create",
          identityDocuments: [],
          submittedAt: Date.now(),
        })
      })

      const other = t.withIdentity({ tokenIdentifier: "other_id" })
      await expect(
        other.query(api.creatorApplications.getUserApplication, { userId }),
      ).rejects.toThrow("Unauthorized")
    })

    it("should return null for unauthenticated user", async () => {
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

      const result = await t.query(
        api.creatorApplications.getUserApplication,
        { userId },
      )

      expect(result).toBeNull()
    })
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

      await t.run(async (ctx) => {
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "rejected",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "First attempt",
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
        { userId },
      )

      expect(result.canReapply).toBe(true)
      expect(result.mustContactSupport).toBe(false)
      expect(result.waitUntil).toBeNull()
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

      await t.run(async (ctx) => {
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "rejected",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Second attempt",
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
        { userId },
      )

      expect(result.canReapply).toBe(false)
      expect(result.mustContactSupport).toBe(false)
      expect(result.waitUntil).toBe(futureTime)
    })

    it("should require support contact after 3 or more rejections", async () => {
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
              fullName: "Jean Dupont",
              dateOfBirth: "1995-05-15",
              address: "Douala, Cameroun",
              whatsappNumber: "+237690000000",
              mobileMoneyNumber: "+237670000000",
            },
            applicationReason: `Attempt ${i + 1}`,
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
        { userId },
      )

      expect(result.canReapply).toBe(false)
      expect(result.mustContactSupport).toBe(true)
    })

    it("should reject unauthenticated reapplication request", async () => {
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

      await expect(
        t.mutation(api.creatorApplications.requestReapplication, { userId }),
      ).rejects.toThrow("Unauthorized")
    })

    it("should reject reapplication request for a different user", async () => {
      const t = convexTest(schema)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Impersonator",
          tokenIdentifier: "impersonator_id",
          accountType: "USER",
          email: "impersonator@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const impersonator = t.withIdentity({
        tokenIdentifier: "impersonator_id",
      })
      await expect(
        impersonator.mutation(api.creatorApplications.requestReapplication, {
          userId,
        }),
      ).rejects.toThrow("Unauthorized")
    })

    it("should throw if no rejected application exists", async () => {
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

      const applicant = t.withIdentity({ tokenIdentifier: "applicant_id" })
      await expect(
        applicant.mutation(api.creatorApplications.requestReapplication, {
          userId,
        }),
      ).rejects.toThrow("Aucune candidature rejetée trouvée")
    })
  })

  describe("reviewApplication", () => {
    it("should approve an application and upgrade user to CREATOR", async () => {
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

      const appId = await t.run(async (ctx) => {
        return await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "I want to create",
          identityDocuments: [],
          submittedAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.mutation(
        api.creatorApplications.reviewApplication,
        {
          applicationId: appId,
          decision: "approved",
          adminNotes: "Documents verified",
        },
      )

      expect(result.success).toBe(true)

      const updatedApp = await t.run(async (ctx) => await ctx.db.get(appId))
      expect(updatedApp!.status).toBe("approved")
      expect(updatedApp!.adminNotes).toBe("Documents verified")
      expect(updatedApp!.reviewedAt).toBeDefined()

      const updatedUser = await t.run(async (ctx) => await ctx.db.get(userId))
      expect(updatedUser!.accountType).toBe("CREATOR")
    })

    it("should reject an application", async () => {
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

      const appId = await t.run(async (ctx) => {
        return await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "I want to create",
          identityDocuments: [],
          submittedAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.mutation(
        api.creatorApplications.reviewApplication,
        {
          applicationId: appId,
          decision: "rejected",
          adminNotes: "Missing selfie photo",
        },
      )

      expect(result.success).toBe(true)

      const updatedApp = await t.run(async (ctx) => await ctx.db.get(appId))
      expect(updatedApp!.status).toBe("rejected")
      expect(updatedApp!.rejectionCount).toBe(1)

      // User should still be USER
      const updatedUser = await t.run(async (ctx) => await ctx.db.get(userId))
      expect(updatedUser!.accountType).toBe("USER")
    })

    it("should prevent rejecting an already approved application", async () => {
      const t = convexTest(schema)

      const userId = await t.run(async (ctx) => {
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
          userId,
          status: "approved",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "Approved",
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
          adminNotes: "Changed mind",
        }),
      ).rejects.toThrow(
        "Impossible de rejeter une candidature déjà approuvée",
      )
    })

    it("should reject non-superuser review attempt", async () => {
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

      const appId = await t.run(async (ctx) => {
        return await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "I want to create",
          identityDocuments: [],
          submittedAt: Date.now(),
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      await expect(
        user.mutation(api.creatorApplications.reviewApplication, {
          applicationId: appId,
          decision: "approved",
        }),
      ).rejects.toThrow("Unauthorized")
    })
  })

  describe("getAllApplications", () => {
    it("should return all applications with enriched user data for superuser", async () => {
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
        await ctx.db.insert("creatorApplications", {
          userId,
          status: "pending",
          personalInfo: {
            fullName: "Jean Dupont",
            dateOfBirth: "1995-05-15",
            address: "Douala, Cameroun",
            whatsappNumber: "+237690000000",
            mobileMoneyNumber: "+237670000000",
          },
          applicationReason: "I want to create",
          identityDocuments: [],
          submittedAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const applications = await admin.query(
        api.creatorApplications.getAllApplications,
      )

      expect(applications).toHaveLength(1)
      expect(applications[0].user?.name).toBe("Applicant")
    })

    it("should reject non-superuser access", async () => {
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
        user.query(api.creatorApplications.getAllApplications),
      ).rejects.toThrow("Unauthorized")
    })
  })
})
