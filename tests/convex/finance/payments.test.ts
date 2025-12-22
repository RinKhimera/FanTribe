import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import { Doc } from "../../../convex/_generated/dataModel"
import schema from "../../../convex/schema"

describe("payments", () => {
  const modules = import.meta.glob("../../../convex/**/*.ts")

  it("should process a payment and create a subscription", async () => {
    const t = convexTest(schema, modules)

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
        email: "sub@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    const result = await t.action(api.internalActions.processPayment, {
      provider: "cinetpay",
      providerTransactionId: "tx_unique_123",
      creatorId,
      subscriberId,
      amount: 1000,
      currency: "XAF",
    })

    expect(result.success).toBe(true)
    expect(result.status).toBe("active")
    expect(result.subscriptionId).toBeDefined()

    const sub = await t.run(async (ctx) => {
      return (await ctx.db.get(result.subscriptionId!)) as Doc<"subscriptions">
    })
    expect(sub?.status).toBe("active")
    expect(sub?.amountPaid).toBe(1000)

    const tx = await t.run(async (ctx) => {
      return await ctx.db
        .query("transactions")
        .withIndex("by_providerTransactionId", (q) =>
          q.eq("providerTransactionId", "tx_unique_123"),
        )
        .unique()
    })
    expect(tx).not.toBeNull()
  })

  it("should be idempotent when processing the same transaction twice", async () => {
    const t = convexTest(schema, modules)

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
        email: "sub@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      })
    })

    // First call
    const result1 = await t.action(api.internalActions.processPayment, {
      provider: "cinetpay",
      providerTransactionId: "tx_idempotent_123",
      creatorId,
      subscriberId,
      amount: 1000,
      currency: "XAF",
    })

    // Second call
    const result2 = await t.action(api.internalActions.processPayment, {
      provider: "cinetpay",
      providerTransactionId: "tx_idempotent_123",
      creatorId,
      subscriberId,
      amount: 1000,
      currency: "XAF",
    })

    expect(result2.success).toBe(true)
    expect(result2.alreadyProcessed).toBe(true)
    expect(result2.subscriptionId).toBe(result1.subscriptionId)
  })
})
