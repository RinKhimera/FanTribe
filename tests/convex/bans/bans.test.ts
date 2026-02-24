import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("bans", () => {
  describe("banUser", () => {
    it("should ban a user as superuser with permanent ban", async () => {
      const t = convexTest(schema)

      const superuserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

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

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.mutation(api.bans.banUser, {
        userId,
        banType: "permanent",
        reason: "Violation of terms",
      })

      expect(result.success).toBe(true)

      const bannedUser = await t.run(async (ctx) => await ctx.db.get(userId))
      expect(bannedUser?.isBanned).toBe(true)
      expect(bannedUser?.banDetails?.type).toBe("permanent")
      expect(bannedUser?.banDetails?.reason).toBe("Violation of terms")
      expect(bannedUser?.banDetails?.bannedBy).toBe(superuserId)
      expect(bannedUser?.banHistory).toHaveLength(1)
    })

    it("should ban a user with temporary ban", async () => {
      const t = convexTest(schema)

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

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.mutation(api.bans.banUser, {
        userId,
        banType: "temporary",
        reason: "Spamming",
        durationDays: 7,
      })

      expect(result.success).toBe(true)

      const bannedUser = await t.run(async (ctx) => await ctx.db.get(userId))
      expect(bannedUser?.isBanned).toBe(true)
      expect(bannedUser?.banDetails?.type).toBe("temporary")
      expect(bannedUser?.banDetails?.expiresAt).toBeDefined()
    })

    it("should reject non-superuser ban attempt", async () => {
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

      const targetId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      await expect(
        user.mutation(api.bans.banUser, {
          userId: targetId,
          banType: "permanent",
          reason: "Trying to ban",
        }),
      ).rejects.toThrow("Accès refusé - Réservé aux administrateurs")
    })

    it("should reject self-ban", async () => {
      const t = convexTest(schema)

      const adminId = await t.run(async (ctx) => {
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
        admin.mutation(api.bans.banUser, {
          userId: adminId,
          banType: "permanent",
          reason: "Self ban attempt",
        }),
      ).rejects.toThrow("Vous ne pouvez pas vous bannir vous-même")
    })

    it("should reject banning another superuser", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin 1",
          tokenIdentifier: "admin1_id",
          accountType: "SUPERUSER",
          email: "admin1@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const admin2Id = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin 2",
          tokenIdentifier: "admin2_id",
          accountType: "SUPERUSER",
          email: "admin2@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const admin1 = t.withIdentity({ tokenIdentifier: "admin1_id" })
      await expect(
        admin1.mutation(api.bans.banUser, {
          userId: admin2Id,
          banType: "permanent",
          reason: "Trying to ban admin",
        }),
      ).rejects.toThrow("Vous ne pouvez pas bannir un administrateur")
    })

    it("should reject banning an already banned user", async () => {
      const t = convexTest(schema)

      const adminId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Banned User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          isBanned: true,
          banDetails: {
            type: "permanent",
            reason: "Previous ban",
            bannedAt: Date.now(),
            bannedBy: adminId,
          },
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      await expect(
        admin.mutation(api.bans.banUser, {
          userId,
          banType: "permanent",
          reason: "Double ban",
        }),
      ).rejects.toThrow("Cet utilisateur est déjà banni")
    })

    it("should reject temporary ban without durationDays", async () => {
      const t = convexTest(schema)

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

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      await expect(
        admin.mutation(api.bans.banUser, {
          userId,
          banType: "temporary",
          reason: "Temp ban without duration",
        }),
      ).rejects.toThrow(
        "La durée est requise pour un bannissement temporaire",
      )
    })

    it("should reject unauthenticated ban attempt", async () => {
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

      await expect(
        t.mutation(api.bans.banUser, {
          userId,
          banType: "permanent",
          reason: "Unauthenticated",
        }),
      ).rejects.toThrow("Non autorisé")
    })

    it("should resolve linked report when banning", async () => {
      const t = convexTest(schema)

      const adminId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reported User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reportId = await t.run(async (ctx) => {
        return await ctx.db.insert("reports", {
          reporterId,
          reportedUserId: userId,
          type: "user",
          reason: "harassment",
          status: "pending",
          createdAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      await admin.mutation(api.bans.banUser, {
        userId,
        banType: "permanent",
        reason: "Harassment",
        reportId,
      })

      const report = await t.run(async (ctx) => await ctx.db.get(reportId))
      expect(report?.status).toBe("resolved")
      expect(report?.resolutionAction).toBe("banned")
      expect(report?.reviewedBy).toBe(adminId)
    })
  })

  describe("unbanUser", () => {
    it("should unban a banned user as superuser", async () => {
      const t = convexTest(schema)

      const adminId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Banned User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          isBanned: true,
          banDetails: {
            type: "permanent",
            reason: "Previous ban",
            bannedAt: Date.now() - 86400000,
            bannedBy: adminId,
          },
          banHistory: [
            {
              type: "permanent" as const,
              reason: "Previous ban",
              bannedAt: Date.now() - 86400000,
              bannedBy: adminId,
            },
          ],
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.mutation(api.bans.unbanUser, { userId })

      expect(result.success).toBe(true)

      const unbannedUser = await t.run(async (ctx) => await ctx.db.get(userId))
      expect(unbannedUser?.isBanned).toBe(false)
      expect(unbannedUser?.banDetails).toBeUndefined()
      // Ban history should have liftedAt and liftedBy set
      expect(unbannedUser?.banHistory?.[0].liftedAt).toBeDefined()
      expect(unbannedUser?.banHistory?.[0].liftedBy).toBe(adminId)
    })

    it("should reject unban of non-banned user", async () => {
      const t = convexTest(schema)

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

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      await expect(
        admin.mutation(api.bans.unbanUser, { userId }),
      ).rejects.toThrow("Cet utilisateur n'est pas banni")
    })

    it("should reject non-superuser unban attempt", async () => {
      const t = convexTest(schema)

      const adminId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Banned User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          isBanned: true,
          banDetails: {
            type: "permanent",
            reason: "Banned",
            bannedAt: Date.now(),
            bannedBy: adminId,
          },
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Regular User",
          tokenIdentifier: "regular_id",
          accountType: "USER",
          email: "regular@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const regular = t.withIdentity({ tokenIdentifier: "regular_id" })
      await expect(
        regular.mutation(api.bans.unbanUser, { userId }),
      ).rejects.toThrow("Accès refusé - Réservé aux administrateurs")
    })

    it("should reject unauthenticated unban attempt", async () => {
      const t = convexTest(schema)

      const adminId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Banned User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          isBanned: true,
          banDetails: {
            type: "permanent",
            reason: "Banned",
            bannedAt: Date.now(),
            bannedBy: adminId,
          },
        })
      })

      await expect(
        t.mutation(api.bans.unbanUser, { userId }),
      ).rejects.toThrow("Non autorisé")
    })
  })

  describe("getAllBannedUsers", () => {
    it("should return all banned users for superuser", async () => {
      const t = convexTest(schema)

      const adminId = await t.run(async (ctx) => {
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
        await ctx.db.insert("users", {
          name: "Banned User 1",
          tokenIdentifier: "banned1_id",
          accountType: "USER",
          email: "banned1@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          isBanned: true,
          banDetails: {
            type: "permanent",
            reason: "Reason 1",
            bannedAt: Date.now() - 86400000,
            bannedBy: adminId,
          },
        })
        await ctx.db.insert("users", {
          name: "Banned User 2",
          tokenIdentifier: "banned2_id",
          accountType: "USER",
          email: "banned2@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          isBanned: true,
          banDetails: {
            type: "temporary",
            reason: "Reason 2",
            bannedAt: Date.now(),
            bannedBy: adminId,
            expiresAt: Date.now() + 604800000,
          },
        })
        // Non-banned user should not appear
        await ctx.db.insert("users", {
          name: "Normal User",
          tokenIdentifier: "normal_id",
          accountType: "USER",
          email: "normal@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.query(api.bans.getAllBannedUsers)

      expect(result).not.toBeNull()
      expect(result).toHaveLength(2)
      // Sorted by bannedAt desc - most recent first
      expect(result![0].name).toBe("Banned User 2")
      expect(result![1].name).toBe("Banned User 1")
      expect(result![0].bannedByName).toBe("Admin")
    })

    it("should return null for non-superuser", async () => {
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
      const result = await user.query(api.bans.getAllBannedUsers)

      expect(result).toBeNull()
    })

    it("should return null for unauthenticated user", async () => {
      const t = convexTest(schema)

      const result = await t.query(api.bans.getAllBannedUsers)

      expect(result).toBeNull()
    })
  })

  describe("getUserBanInfo", () => {
    it("should return ban info for a specific user as superuser", async () => {
      const t = convexTest(schema)

      const adminId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Banned User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          isBanned: true,
          banDetails: {
            type: "permanent",
            reason: "Bad behavior",
            bannedAt: Date.now(),
            bannedBy: adminId,
          },
          banHistory: [
            {
              type: "permanent" as const,
              reason: "Bad behavior",
              bannedAt: Date.now(),
              bannedBy: adminId,
            },
          ],
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.query(api.bans.getUserBanInfo, { userId })

      expect(result).not.toBeNull()
      expect(result!.isBanned).toBe(true)
      expect(result!.banType).toBe("permanent")
      expect(result!.banReason).toBe("Bad behavior")
      expect(result!.banHistory).toHaveLength(1)
      expect(result!.banHistory[0].bannedByName).toBe("Admin")
    })

    it("should return null for non-superuser", async () => {
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

      const targetId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      const result = await user.query(api.bans.getUserBanInfo, {
        userId: targetId,
      })

      expect(result).toBeNull()
    })
  })
})
