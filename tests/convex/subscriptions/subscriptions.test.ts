import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("subscriptions", () => {
  describe("getFollowSubscription", () => {
    it("should return the subscription between two users", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
      const result = await subscriber.query(
        api.subscriptions.getFollowSubscription,
        { creatorId, subscriberId },
      )

      expect(result).not.toBeNull()
      expect(result!.creator).toBe(creatorId)
      expect(result!.subscriber).toBe(subscriberId)
      expect(result!.status).toBe("active")
      expect(result!.type).toBe("content_access")
    })

    it("should return null when no subscription exists", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
      const result = await subscriber.query(
        api.subscriptions.getFollowSubscription,
        { creatorId, subscriberId },
      )

      expect(result).toBeNull()
    })

    it("should not return messaging_access subscriptions", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      // Insert only a messaging_access subscription
      await t.run(async (ctx) => {
        await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "messaging_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 2000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
      const result = await subscriber.query(
        api.subscriptions.getFollowSubscription,
        { creatorId, subscriberId },
      )

      expect(result).toBeNull()
    })

    it("should reject unauthenticated users", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await expect(
        t.query(api.subscriptions.getFollowSubscription, {
          creatorId,
          subscriberId,
        }),
      ).rejects.toThrow()
    })
  })

  describe("cancelSubscription", () => {
    it("should cancel an active subscription as the subscriber", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const subId = await t.run(async (ctx) => {
        return await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
      const result = await subscriber.mutation(
        api.subscriptions.cancelSubscription,
        { subscriptionId: subId },
      )

      expect(result.canceled).toBe(true)

      const sub = await t.run(async (ctx) => await ctx.db.get(subId))
      expect(sub?.status).toBe("canceled")
    })

    it("should cancel an active subscription as the creator", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const subId = await t.run(async (ctx) => {
        return await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const creator = t.withIdentity({ tokenIdentifier: "creator_id" })
      const result = await creator.mutation(
        api.subscriptions.cancelSubscription,
        { subscriptionId: subId },
      )

      expect(result.canceled).toBe(true)

      const sub = await t.run(async (ctx) => await ctx.db.get(subId))
      expect(sub?.status).toBe("canceled")
    })

    it("should return already canceled when subscription is already canceled", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const subId = await t.run(async (ctx) => {
        return await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "canceled",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
      const result = await subscriber.mutation(
        api.subscriptions.cancelSubscription,
        { subscriptionId: subId },
      )

      expect(result.canceled).toBe(false)
      expect(result.reason).toBe("Already canceled")
    })

    it("should reject unauthorized user who is neither subscriber nor creator", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
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

      const subId = await t.run(async (ctx) => {
        return await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const other = t.withIdentity({ tokenIdentifier: "other_id" })
      await expect(
        other.mutation(api.subscriptions.cancelSubscription, {
          subscriptionId: subId,
        }),
      ).rejects.toThrow("Unauthorized")
    })

    it("should reject unauthenticated user", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const subId = await t.run(async (ctx) => {
        return await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      await expect(
        t.mutation(api.subscriptions.cancelSubscription, {
          subscriptionId: subId,
        }),
      ).rejects.toThrow()
    })

    it("should throw when subscription does not exist", async () => {
      const t = convexTest(schema)

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

      // Create and immediately delete a subscription to get a valid but nonexistent ID
      const subId = await t.run(async (ctx) => {
        const creatorId = await ctx.db.insert("users", {
          name: "Temp Creator",
          tokenIdentifier: "temp_creator_id",
          accountType: "CREATOR",
          email: "temp@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
        const id = await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: creatorId,
          status: "active",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
        await ctx.db.delete(id)
        return id
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      await expect(
        user.mutation(api.subscriptions.cancelSubscription, {
          subscriptionId: subId,
        }),
      ).rejects.toThrow("Subscription not found")
    })
  })

  describe("listSubscriberSubscriptions", () => {
    it("should list subscriptions for the authenticated subscriber", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
        // Also insert a messaging subscription (should not be returned)
        await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "messaging_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 2000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
      const result = await subscriber.query(
        api.subscriptions.listSubscriberSubscriptions,
        { subscriberId },
      )

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe("content_access")
    })

    it("should reject when requesting another users subscriptions", async () => {
      const t = convexTest(schema)

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
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

      const other = t.withIdentity({ tokenIdentifier: "other_id" })
      await expect(
        other.query(api.subscriptions.listSubscriberSubscriptions, {
          subscriberId,
        }),
      ).rejects.toThrow("Unauthorized")
    })

    it("should return empty array when subscriber has no subscriptions", async () => {
      const t = convexTest(schema)

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
      const result = await subscriber.query(
        api.subscriptions.listSubscriberSubscriptions,
        { subscriberId },
      )

      expect(result).toHaveLength(0)
    })
  })

  describe("listCreatorSubscribers", () => {
    it("should list subscribers for the authenticated creator", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const creator = t.withIdentity({ tokenIdentifier: "creator_id" })
      const result = await creator.query(
        api.subscriptions.listCreatorSubscribers,
        { creatorId },
      )

      expect(result).toHaveLength(1)
      expect(result[0].subscriber).toBe(subscriberId)
    })

    it("should reject when requesting another creators subscribers", async () => {
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
          name: "Other",
          tokenIdentifier: "other_id",
          accountType: "USER",
          email: "other@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const other = t.withIdentity({ tokenIdentifier: "other_id" })
      await expect(
        other.query(api.subscriptions.listCreatorSubscribers, { creatorId }),
      ).rejects.toThrow("Unauthorized")
    })

    it("should only return content_access subscriptions", async () => {
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

      const subscriberId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "content_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
        await ctx.db.insert("subscriptions", {
          creator: creatorId,
          subscriber: subscriberId,
          status: "active",
          type: "messaging_access",
          startDate: Date.now(),
          endDate: Date.now() + 2592000000,
          amountPaid: 2000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const creator = t.withIdentity({ tokenIdentifier: "creator_id" })
      const result = await creator.query(
        api.subscriptions.listCreatorSubscribers,
        { creatorId },
      )

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe("content_access")
    })
  })
})
