import { convexTest } from "convex-test"
import { beforeEach, describe, expect, it } from "vitest"
import { api, internal } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("user presence", () => {
  beforeEach(() => {
    process.env.CLERK_APP_DOMAIN = "test-domain"
  })

  describe("incrementUserSession", () => {
    it("should increment session count and set user online", async () => {
      const t = convexTest(schema)

      // Create a user first
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          email: "test@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|user_123",
          externalId: "user_123",
          accountType: "USER",
          isOnline: false,
          activeSessions: 0,
        })
      })

      // Increment session (simulating session.created webhook)
      await t.mutation(internal.users.incrementUserSession, {
        externalId: "user_123",
      })

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) => q.eq("externalId", "user_123"))
          .unique()
      })

      expect(user).not.toBeNull()
      expect(user?.isOnline).toBe(true)
      expect(user?.activeSessions).toBe(1)
      expect(user?.lastSeenAt).toBeDefined()
    })

    it("should handle multiple sessions", async () => {
      const t = convexTest(schema)

      // Create a user with one active session
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          email: "test@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|user_123",
          externalId: "user_123",
          accountType: "USER",
          isOnline: true,
          activeSessions: 1,
        })
      })

      // Add a second session
      await t.mutation(internal.users.incrementUserSession, {
        externalId: "user_123",
      })

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) => q.eq("externalId", "user_123"))
          .unique()
      })

      expect(user?.activeSessions).toBe(2)
      expect(user?.isOnline).toBe(true)
    })

    it("should not throw for non-existent user", async () => {
      const t = convexTest(schema)

      // Should not throw, just log warning
      await expect(
        t.mutation(internal.users.incrementUserSession, {
          externalId: "non_existent",
        }),
      ).resolves.not.toThrow()
    })
  })

  describe("decrementUserSession", () => {
    it("should decrement session count and set user offline when no sessions left", async () => {
      const t = convexTest(schema)

      // Create a user with one active session
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          email: "test@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|user_123",
          externalId: "user_123",
          accountType: "USER",
          isOnline: true,
          activeSessions: 1,
        })
      })

      // Remove the session (simulating session.ended webhook)
      await t.mutation(internal.users.decrementUserSession, {
        externalId: "user_123",
      })

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) => q.eq("externalId", "user_123"))
          .unique()
      })

      expect(user?.isOnline).toBe(false)
      expect(user?.activeSessions).toBe(0)
      expect(user?.lastSeenAt).toBeDefined()
    })

    it("should keep user online if there are remaining sessions", async () => {
      const t = convexTest(schema)

      // Create a user with two active sessions
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          email: "test@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|user_123",
          externalId: "user_123",
          accountType: "USER",
          isOnline: true,
          activeSessions: 2,
        })
      })

      // Remove one session
      await t.mutation(internal.users.decrementUserSession, {
        externalId: "user_123",
      })

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) => q.eq("externalId", "user_123"))
          .unique()
      })

      expect(user?.isOnline).toBe(true)
      expect(user?.activeSessions).toBe(1)
    })

    it("should not go below 0 sessions", async () => {
      const t = convexTest(schema)

      // Create a user with 0 sessions
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          email: "test@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|user_123",
          externalId: "user_123",
          accountType: "USER",
          isOnline: false,
          activeSessions: 0,
        })
      })

      // Try to decrement below 0
      await t.mutation(internal.users.decrementUserSession, {
        externalId: "user_123",
      })

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) => q.eq("externalId", "user_123"))
          .unique()
      })

      expect(user?.activeSessions).toBe(0)
    })
  })

  describe("updatePresenceHeartbeat", () => {
    it("should update lastSeenAt and set user online", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          email: "test@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|user_123",
          externalId: "user_123",
          accountType: "USER",
          isOnline: false,
          lastSeenAt: Date.now() - 60000, // 1 minute ago
        })
      })

      const authenticated = t.withIdentity({
        tokenIdentifier: "test-domain|user_123",
      })

      const result = await authenticated.mutation(
        api.users.updatePresenceHeartbeat,
        {},
      )

      expect(result).toEqual({ success: true })

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_tokenIdentifier", (q) =>
            q.eq("tokenIdentifier", "test-domain|user_123"),
          )
          .unique()
      })

      expect(user?.isOnline).toBe(true)
      // lastSeenAt should be updated (within last second)
      expect(user?.lastSeenAt).toBeDefined()
      expect(Date.now() - (user?.lastSeenAt ?? 0)).toBeLessThan(1000)
    })

    it("should return null when not authenticated", async () => {
      const t = convexTest(schema)
      const result = await t.mutation(api.users.updatePresenceHeartbeat, {})
      expect(result).toBeNull()
    })
  })

  describe("setUserOffline", () => {
    it("should set user offline when no active sessions", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          email: "test@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|user_123",
          externalId: "user_123",
          accountType: "USER",
          isOnline: true,
          activeSessions: 0,
        })
      })

      const authenticated = t.withIdentity({
        tokenIdentifier: "test-domain|user_123",
      })

      await authenticated.mutation(api.users.setUserOffline, {})

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_tokenIdentifier", (q) =>
            q.eq("tokenIdentifier", "test-domain|user_123"),
          )
          .unique()
      })

      expect(user?.isOnline).toBe(false)
      expect(user?.lastSeenAt).toBeDefined()
    })

    it("should only update lastSeenAt when there are active sessions", async () => {
      const t = convexTest(schema)

      const initialLastSeen = Date.now() - 60000

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Test User",
          email: "test@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|user_123",
          externalId: "user_123",
          accountType: "USER",
          isOnline: true,
          activeSessions: 2,
          lastSeenAt: initialLastSeen,
        })
      })

      const authenticated = t.withIdentity({
        tokenIdentifier: "test-domain|user_123",
      })

      await authenticated.mutation(api.users.setUserOffline, {})

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_tokenIdentifier", (q) =>
            q.eq("tokenIdentifier", "test-domain|user_123"),
          )
          .unique()
      })

      // Should remain online because there are active sessions
      expect(user?.isOnline).toBe(true)
      // But lastSeenAt should be updated
      expect(user?.lastSeenAt).toBeGreaterThan(initialLastSeen)
    })
  })

  describe("markStaleUsersOffline", () => {
    it("should mark users offline if lastSeenAt is older than 2 minutes", async () => {
      const t = convexTest(schema)

      const threeMinutesAgo = Date.now() - 3 * 60 * 1000

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Stale User",
          email: "stale@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|stale_user",
          externalId: "stale_user",
          accountType: "USER",
          isOnline: true,
          activeSessions: 1,
          lastSeenAt: threeMinutesAgo,
        })
      })

      const result = await t.mutation(internal.users.markStaleUsersOffline, {})

      expect(result.markedOfflineCount).toBe(1)

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) => q.eq("externalId", "stale_user"))
          .unique()
      })

      expect(user?.isOnline).toBe(false)
      expect(user?.activeSessions).toBe(0)
    })

    it("should not mark users offline if lastSeenAt is recent", async () => {
      const t = convexTest(schema)

      const oneMinuteAgo = Date.now() - 1 * 60 * 1000

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Active User",
          email: "active@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|active_user",
          externalId: "active_user",
          accountType: "USER",
          isOnline: true,
          activeSessions: 1,
          lastSeenAt: oneMinuteAgo,
        })
      })

      const result = await t.mutation(internal.users.markStaleUsersOffline, {})

      expect(result.markedOfflineCount).toBe(0)

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) => q.eq("externalId", "active_user"))
          .unique()
      })

      expect(user?.isOnline).toBe(true)
      expect(user?.activeSessions).toBe(1)
    })

    it("should handle users without lastSeenAt", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "No LastSeen User",
          email: "nolastseen@test.com",
          image: "https://test.com/image.png",
          tokenIdentifier: "test-domain|nolastseen_user",
          externalId: "nolastseen_user",
          accountType: "USER",
          isOnline: true,
          activeSessions: 1,
          // No lastSeenAt - defaults to 0, which is older than 2 minutes
        })
      })

      const result = await t.mutation(internal.users.markStaleUsersOffline, {})

      expect(result.markedOfflineCount).toBe(1)

      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) =>
            q.eq("externalId", "nolastseen_user"),
          )
          .unique()
      })

      expect(user?.isOnline).toBe(false)
    })
  })
})
