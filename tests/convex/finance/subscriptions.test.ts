import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api, internal } from "../../../convex/_generated/api"
import { Doc } from "../../../convex/_generated/dataModel"
import schema from "../../../convex/schema"

describe("subscriptions", () => {
  it("should create a new subscription via processPaymentAtomic", async () => {
    const t = convexTest(schema)

    const creatorId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Creator",
        tokenIdentifier: "creator_id",
        accountType: "CREATOR",
        email: "creator@test.com",
        externalId: "ext_creator",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const subscriberId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "subscriber_id",
        accountType: "USER",
        email: "sub@test.com",
        externalId: "ext_sub",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const result = await t.mutation(
      internal.internalActions.processPaymentAtomic,
      {
        provider: "test",
        providerTransactionId: "tx_123",
        creatorId,
        subscriberId,
        amount: 1000,
        currency: "XAF",
        startedAt: new Date().toISOString(),
      },
    )

    expect(result.success).toBe(true)
    expect(result.action).toBe("created")

    const sub = await t.run(async (ctx) => {
      return (await ctx.db.get(result.subscriptionId!)) as Doc<"subscriptions">
    })

    expect(sub?.status).toBe("active")
    expect(sub?.amountPaid).toBe(1000)
  })

  it("should renew an active subscription", async () => {
    const t = convexTest(schema)

    const creatorId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Creator",
        tokenIdentifier: "creator_id",
        accountType: "CREATOR",
        email: "creator@test.com",
        externalId: "ext_creator",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const subscriberId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "subscriber_id",
        accountType: "USER",
        email: "sub@test.com",
        externalId: "ext_sub",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    // Create initial sub
    const initial = await t.mutation(
      internal.internalActions.processPaymentAtomic,
      {
        provider: "test",
        providerTransactionId: "tx_1",
        creatorId,
        subscriberId,
        amount: 1000,
        currency: "XAF",
        startedAt: new Date().toISOString(),
      },
    )

    const subBefore = await t.run(
      async (ctx) =>
        (await ctx.db.get(initial.subscriptionId!)) as Doc<"subscriptions">,
    )

    // Renew with a different transaction ID
    const result = await t.mutation(
      internal.internalActions.processPaymentAtomic,
      {
        provider: "test",
        providerTransactionId: "tx_2",
        creatorId,
        subscriberId,
        amount: 1000,
        currency: "XAF",
        startedAt: new Date().toISOString(),
      },
    )

    expect(result.success).toBe(true)
    expect(result.action).toBe("renewed")

    const subAfter = await t.run(
      async (ctx) =>
        (await ctx.db.get(result.subscriptionId!)) as Doc<"subscriptions">,
    )
    expect(subAfter?.endDate).toBeGreaterThan(subBefore!.endDate)
    expect(subAfter?.renewalCount).toBe(1)
  })

  it("should cancel a subscription", async () => {
    const t = convexTest(schema)

    const creatorId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Creator",
        tokenIdentifier: "creator_id",
        accountType: "CREATOR",
        email: "creator@test.com",
        externalId: "ext_creator",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const subscriberId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "subscriber_id",
        accountType: "USER",
        email: "sub@test.com",
        externalId: "ext_sub",
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
        endDate: Date.now() + 100000,
        amountPaid: 1000,
        currency: "XAF",
        renewalCount: 0,
        lastUpdateTime: Date.now(),
      })
    })

    const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })

    const result = await subscriber.mutation(
      api.subscriptions.cancelSubscription,
      {
        subscriptionId: subId,
      },
    )

    expect(result.canceled).toBe(true)

    const sub = await t.run(async (ctx) => await ctx.db.get(subId))
    expect(sub?.status).toBe("canceled")
  })

  describe("canUserSubscribe", () => {
    it("should return false when trying to subscribe to self", async () => {
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

      const user = t.withIdentity({ tokenIdentifier: "creator_id" })
      const result = await user.query(api.subscriptions.canUserSubscribe, {
        creatorId: userId,
      })

      expect(result.canSubscribe).toBe(false)
      expect(result.reason).toBe("self")
    })

    it("should return false when target is not a creator", async () => {
      const t = convexTest(schema)

      const regularUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Regular",
          tokenIdentifier: "regular_id",
          accountType: "USER",
          email: "regular@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
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
      const result = await subscriber.query(api.subscriptions.canUserSubscribe, {
        creatorId: regularUserId,
      })

      expect(result.canSubscribe).toBe(false)
      expect(result.reason).toBe("not_creator")
    })

    it("should return false when subscription is already active", async () => {
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
      const result = await subscriber.query(api.subscriptions.canUserSubscribe, {
        creatorId,
      })

      expect(result.canSubscribe).toBe(false)
      expect(result.reason).toBe("already_active")
    })

    it("should allow subscription to a creator", async () => {
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
          name: "Subscriber",
          tokenIdentifier: "subscriber_id",
          accountType: "USER",
          email: "subscriber@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
      const result = await subscriber.query(api.subscriptions.canUserSubscribe, {
        creatorId,
      })

      expect(result.canSubscribe).toBe(true)
      expect(result.reason).toBeNull()
    })
  })

  describe("checkAndUpdateExpiredSubscriptions", () => {
    it("should mark expired subscriptions and create notifications", async () => {
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
          startDate: Date.now() - 2592000000,
          endDate: Date.now() - 1000, // Already expired
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now() - 2592000000,
        })
      })

      const result = await t.mutation(
        internal.subscriptions.checkAndUpdateExpiredSubscriptions
      )

      expect(result.expiredUpdated).toBe(1)
      expect(result.notified).toBe(1)

      const sub = await t.run(async (ctx) => ctx.db.get(subId))
      expect(sub?.status).toBe("expired")

      const notifications = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", subscriberId))
          .collect()
      })
      expect(notifications.some((n) => n.type === "subscription_expired")).toBe(true)
    })

    it("should not affect non-expired subscriptions", async () => {
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
          endDate: Date.now() + 2592000000, // Future
          amountPaid: 1000,
          currency: "XAF",
          renewalCount: 0,
          lastUpdateTime: Date.now(),
        })
      })

      const result = await t.mutation(
        internal.subscriptions.checkAndUpdateExpiredSubscriptions
      )

      expect(result.expiredUpdated).toBe(0)

      const sub = await t.run(async (ctx) => ctx.db.get(subId))
      expect(sub?.status).toBe("active")
    })
  })

  describe("getMyContentAccessSubscriptionsStats", () => {
    it("should return enriched subscription stats", async () => {
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
        // Create a post for the creator
        await ctx.db.insert("posts", {
          author: creatorId,
          content: "Creator post",
          visibility: "public",
          medias: [],
        })
        // Create userStats for the creator (denormalized postsCount)
        await ctx.db.insert("userStats", {
          userId: creatorId,
          postsCount: 1,
          subscribersCount: 1,
          totalLikes: 0,
          lastUpdated: Date.now(),
        })
      })

      const subscriber = t.withIdentity({ tokenIdentifier: "subscriber_id" })
      const stats = await subscriber.query(
        api.subscriptions.getMyContentAccessSubscriptionsStats
      )

      expect(stats.creatorsCount).toBe(1)
      expect(stats.postsCount).toBe(1)
      expect(stats.subscriptions).toHaveLength(1)
      expect(stats.subscriptions[0].creatorUser?.name).toBe("Creator")
    })
  })

  describe("getMySubscribersStats", () => {
    it("should return enriched subscriber stats for creator", async () => {
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
      const stats = await creator.query(api.subscriptions.getMySubscribersStats)

      expect(stats.subscribersCount).toBe(1)
      expect(stats.subscribers).toHaveLength(1)
      expect(stats.subscribers[0].subscriberUser?.name).toBe("Subscriber")
    })
  })
})
