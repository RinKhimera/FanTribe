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
        currency: "EUR",
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
})
