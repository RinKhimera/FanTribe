import { convexTest } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

/**
 * Tests pour les auth helpers (convex/lib/auth.ts)
 * Ces helpers sont testés indirectement via les fonctions qui les utilisent
 */
describe("auth helpers", () => {
  const modules = import.meta.glob("../../../convex/**/*.ts")

  describe("getAuthenticatedUser", () => {
    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      // Tenter d'accéder à une fonction protégée sans authentification
      await expect(
        t.query(api.posts.getHomePosts, {
          paginationOpts: { numItems: 10, cursor: null },
        }),
      ).rejects.toThrow()
    })

    it("should allow authenticated users", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
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
      const result = await user.query(api.posts.getHomePosts, {
        paginationOpts: { numItems: 10, cursor: null },
      })

      expect(result).toBeDefined()
      expect(result.page).toBeDefined()
    })

    it("should return null for optional auth when not authenticated", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      // getCurrentUser retourne null si non authentifié (via optional)
      const result = await t.query(api.users.getCurrentUser, {})
      expect(result).toBeNull()
    })
  })

  describe("requireSuperuser", () => {
    it("should reject non-SUPERUSER users for admin functions", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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

      // getAllReports requiert SUPERUSER
      await expect(user.query(api.reports.getAllReports, {})).rejects.toThrow(
        "Unauthorized",
      )
    })

    it("should reject CREATOR for admin functions", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Creator",
          tokenIdentifier: "creator_id",
          accountType: "CREATOR",
          email: "creator@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const creator = t.withIdentity({ tokenIdentifier: "creator_id" })

      await expect(
        creator.query(api.reports.getAllReports, {}),
      ).rejects.toThrow("Unauthorized")
    })

    it("should allow SUPERUSER for admin functions", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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
      const result = await admin.query(api.reports.getAllReports, {})

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe("requireCreator", () => {
    it("should reject CREATOR-only functions for regular USER", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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

      // getCreatorEarnings vérifie accountType CREATOR/SUPERUSER
      await expect(
        user.query(api.transactions.getCreatorEarnings, {}),
      ).rejects.toThrow("Access forbidden")
    })

    it("should allow CREATOR for creator functions", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Creator",
          tokenIdentifier: "creator_id",
          accountType: "CREATOR",
          email: "creator@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          username: "creator",
        })
      })

      const creator = t.withIdentity({ tokenIdentifier: "creator_id" })
      const result = await creator.query(api.transactions.getCreatorEarnings, {})

      expect(result).toBeDefined()
      expect(result.totalNetEarned).toBeDefined()
    })

    it("should allow SUPERUSER for creator functions", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          username: "admin",
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.query(api.transactions.getCreatorEarnings, {})

      expect(result).toBeDefined()
      expect(result.totalNetEarned).toBeDefined()
    })
  })
})
