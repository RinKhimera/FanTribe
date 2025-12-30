import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

/**
 * Tests pour Search & Discovery (convex/users.ts)
 */
describe("search and discovery", () => {
  const modules = import.meta.glob("../../../convex/**/*.ts")

  describe("getSuggestedCreators", () => {
    it("should return only CREATOR accounts", async () => {
      const t = convexTest(schema, modules)

      // Créer différents types d'utilisateurs
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Viewer",
          tokenIdentifier: "viewer_id",
          accountType: "USER",
          email: "viewer@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "Creator 1",
          tokenIdentifier: "creator1_id",
          accountType: "CREATOR",
          email: "creator1@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "Creator 2",
          tokenIdentifier: "creator2_id",
          accountType: "CREATOR",
          email: "creator2@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "Regular User",
          tokenIdentifier: "user_id",
          accountType: "USER",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const viewer = t.withIdentity({ tokenIdentifier: "viewer_id" })
      const result = await viewer.query(api.users.getSuggestedCreators, {})

      expect(result).toHaveLength(2)
      expect(result.every((u) => u.accountType === "CREATOR")).toBe(true)
    })

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules)

      await expect(
        t.query(api.users.getSuggestedCreators, {}),
      ).rejects.toThrow()
    })

    it("should return maximum 48 creators", async () => {
      const t = convexTest(schema, modules)

      // Créer un viewer
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Viewer",
          tokenIdentifier: "viewer_id",
          accountType: "USER",
          email: "viewer@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      // Créer 60 créateurs
      await t.run(async (ctx) => {
        for (let i = 0; i < 60; i++) {
          await ctx.db.insert("users", {
            name: `Creator ${i}`,
            tokenIdentifier: `creator_${i}_id`,
            accountType: "CREATOR",
            email: `creator${i}@test.com`,
            image: "https://test.com/image.png",
            isOnline: true,
          })
        }
      })

      const viewer = t.withIdentity({ tokenIdentifier: "viewer_id" })
      const result = await viewer.query(api.users.getSuggestedCreators, {})

      expect(result.length).toBeLessThanOrEqual(48)
    })
  })

  describe("searchUsers", () => {
    it("should find users by name", async () => {
      const t = convexTest(schema, modules)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Searcher",
          username: "searcher",
          tokenIdentifier: "searcher_id",
          accountType: "USER",
          email: "searcher@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "John Doe",
          username: "johndoe",
          tokenIdentifier: "john_id",
          accountType: "CREATOR",
          email: "john@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "Jane Smith",
          username: "janesmith",
          tokenIdentifier: "jane_id",
          accountType: "CREATOR",
          email: "jane@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const searcher = t.withIdentity({ tokenIdentifier: "searcher_id" })
      const result = await searcher.query(api.users.searchUsers, {
        searchTerm: "John",
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("John Doe")
    })

    it("should find users by username", async () => {
      const t = convexTest(schema, modules)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Searcher",
          username: "searcher",
          tokenIdentifier: "searcher_id",
          accountType: "USER",
          email: "searcher@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "Creator One",
          username: "coolcreator",
          tokenIdentifier: "creator_id",
          accountType: "CREATOR",
          email: "creator@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const searcher = t.withIdentity({ tokenIdentifier: "searcher_id" })
      const result = await searcher.query(api.users.searchUsers, {
        searchTerm: "coolcreator",
      })

      expect(result).toHaveLength(1)
      expect(result[0].username).toBe("coolcreator")
    })

    it("should be case-insensitive", async () => {
      const t = convexTest(schema, modules)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Searcher",
          username: "searcher",
          tokenIdentifier: "searcher_id",
          accountType: "USER",
          email: "searcher@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "John DOE",
          username: "JOHNDOE",
          tokenIdentifier: "john_id",
          accountType: "CREATOR",
          email: "john@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const searcher = t.withIdentity({ tokenIdentifier: "searcher_id" })
      const result = await searcher.query(api.users.searchUsers, {
        searchTerm: "john",
      })

      expect(result).toHaveLength(1)
    })

    it("should not return the current user in results", async () => {
      const t = convexTest(schema, modules)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "John Searcher",
          username: "johnsearcher",
          tokenIdentifier: "john_searcher_id",
          accountType: "USER",
          email: "johnsearcher@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "John Other",
          username: "johnother",
          tokenIdentifier: "john_other_id",
          accountType: "CREATOR",
          email: "johnother@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const searcher = t.withIdentity({ tokenIdentifier: "john_searcher_id" })
      const result = await searcher.query(api.users.searchUsers, {
        searchTerm: "John",
      })

      // Should only find John Other, not John Searcher (current user)
      expect(result).toHaveLength(1)
      expect(result[0].username).toBe("johnother")
    })

    it("should not return users without username", async () => {
      const t = convexTest(schema, modules)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Searcher",
          username: "searcher",
          tokenIdentifier: "searcher_id",
          accountType: "USER",
          email: "searcher@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        // User without username (incomplete profile)
        await ctx.db.insert("users", {
          name: "Incomplete User",
          tokenIdentifier: "incomplete_id",
          accountType: "USER",
          email: "incomplete@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const searcher = t.withIdentity({ tokenIdentifier: "searcher_id" })
      const result = await searcher.query(api.users.searchUsers, {
        searchTerm: "Incomplete",
      })

      expect(result).toHaveLength(0)
    })

    it("should return empty array for unauthenticated users", async () => {
      const t = convexTest(schema, modules)

      const result = await t.query(api.users.searchUsers, {
        searchTerm: "test",
      })

      expect(result).toEqual([])
    })

    it("should limit results to 10", async () => {
      const t = convexTest(schema, modules)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Searcher",
          username: "searcher",
          tokenIdentifier: "searcher_id",
          accountType: "USER",
          email: "searcher@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })

        // Créer 15 utilisateurs avec "test" dans le nom
        for (let i = 0; i < 15; i++) {
          await ctx.db.insert("users", {
            name: `Test User ${i}`,
            username: `testuser${i}`,
            tokenIdentifier: `test_${i}_id`,
            accountType: "CREATOR",
            email: `test${i}@test.com`,
            image: "https://test.com/image.png",
            isOnline: true,
          })
        }
      })

      const searcher = t.withIdentity({ tokenIdentifier: "searcher_id" })
      const result = await searcher.query(api.users.searchUsers, {
        searchTerm: "test",
      })

      expect(result).toHaveLength(10)
    })

    it("should return empty array for no matches", async () => {
      const t = convexTest(schema, modules)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Searcher",
          username: "searcher",
          tokenIdentifier: "searcher_id",
          accountType: "USER",
          email: "searcher@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "John Doe",
          username: "johndoe",
          tokenIdentifier: "john_id",
          accountType: "CREATOR",
          email: "john@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const searcher = t.withIdentity({ tokenIdentifier: "searcher_id" })
      const result = await searcher.query(api.users.searchUsers, {
        searchTerm: "xyz123notfound",
      })

      expect(result).toHaveLength(0)
    })

    it("should find partial matches", async () => {
      const t = convexTest(schema, modules)

      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          name: "Searcher",
          username: "searcher",
          tokenIdentifier: "searcher_id",
          accountType: "USER",
          email: "searcher@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        await ctx.db.insert("users", {
          name: "SuperCreator",
          username: "supercreator",
          tokenIdentifier: "super_id",
          accountType: "CREATOR",
          email: "super@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const searcher = t.withIdentity({ tokenIdentifier: "searcher_id" })
      const result = await searcher.query(api.users.searchUsers, {
        searchTerm: "creat",
      })

      expect(result).toHaveLength(1)
      expect(result[0].username).toBe("supercreator")
    })
  })
})
