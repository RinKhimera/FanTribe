import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api, internal } from "../../../convex/_generated/api"
import { Doc } from "../../../convex/_generated/dataModel"
import { verifyNotifyToken } from "../../../convex/lib/cinetpay"
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

    const result = await t.mutation(
      internal.internalActions.processPaymentAtomic,
      {
        provider: "stripe",
        providerTransactionId: "tx_unique_123",
        creatorId,
        subscriberId,
        amount: 1000,
        currency: "XAF",
      },
    )

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
    const result1 = await t.mutation(
      internal.internalActions.processPaymentAtomic,
      {
        provider: "stripe",
        providerTransactionId: "tx_idempotent_123",
        creatorId,
        subscriberId,
        amount: 1000,
        currency: "XAF",
      },
    )

    // Second call
    const result2 = await t.mutation(
      internal.internalActions.processPaymentAtomic,
      {
        provider: "stripe",
        providerTransactionId: "tx_idempotent_123",
        creatorId,
        subscriberId,
        amount: 1000,
        currency: "XAF",
      },
    )

    expect(result2.success).toBe(true)
    expect(result2.alreadyProcessed).toBe(true)
    expect(result2.subscriptionId).toBe(result1.subscriptionId)
  })
})

describe("cinetpay", () => {
  const modules = import.meta.glob("../../../convex/**/*.ts")

  it("verifyNotifyToken: equal strings match in constant time", () => {
    expect(verifyNotifyToken("abc123", "abc123")).toBe(true)
  })

  it("verifyNotifyToken: different strings do not match", () => {
    expect(verifyNotifyToken("abc123", "abc124")).toBe(false)
    expect(verifyNotifyToken("abc", "abc123")).toBe(false)
    expect(verifyNotifyToken("", "abc")).toBe(false)
  })

  it("createPending → attachTokens → markSucceeded transitions row state", async () => {
    const t = convexTest(schema, modules)

    const creatorId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        name: "Creator",
        tokenIdentifier: "cp_creator",
        accountType: "CREATOR",
        email: "creator@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      }),
    )
    const subscriberId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "cp_subscriber",
        accountType: "USER",
        email: "sub@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      }),
    )

    const paymentId = await t.mutation(internal.cinetpay.createPending, {
      merchantTransactionId: "ft_test_mtx_001",
      subscriberId,
      creatorId,
      amount: 1000,
      intent: "subscribe",
    })

    const initial = await t.run(
      async (ctx) => (await ctx.db.get(paymentId)) as Doc<"cinetpayPayments">,
    )
    expect(initial.status).toBe("pending")
    expect(initial.paymentToken).toBe("")
    expect(initial.notifyToken).toBe("")

    await t.mutation(internal.cinetpay.attachTokens, {
      paymentId,
      paymentToken: "pt_xxx",
      notifyToken: "nt_xxx",
    })

    const afterTokens = await t.run(
      async (ctx) => (await ctx.db.get(paymentId)) as Doc<"cinetpayPayments">,
    )
    expect(afterTokens.paymentToken).toBe("pt_xxx")
    expect(afterTokens.notifyToken).toBe("nt_xxx")

    await t.mutation(internal.cinetpay.markSucceeded, {
      paymentId,
      cinetpayTransactionId: "cp_tx_999",
    })

    const final = await t.run(
      async (ctx) => (await ctx.db.get(paymentId)) as Doc<"cinetpayPayments">,
    )
    expect(final.status).toBe("succeeded")
    expect(final.cinetpayTransactionId).toBe("cp_tx_999")
  })

  it("processPaymentAtomic creates a transaction with provider=cinetpay", async () => {
    const t = convexTest(schema, modules)

    const creatorId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        name: "Creator",
        tokenIdentifier: "cp_creator2",
        accountType: "CREATOR",
        email: "creator2@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      }),
    )
    const subscriberId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "cp_subscriber2",
        accountType: "USER",
        email: "sub2@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      }),
    )

    const result = await t.mutation(
      internal.internalActions.processPaymentAtomic,
      {
        provider: "cinetpay",
        providerTransactionId: "cp_provider_tx_42",
        creatorId,
        subscriberId,
        amount: 1000,
        currency: "XAF",
        paymentMethod: "mobile_money",
      },
    )

    expect(result.success).toBe(true)
    expect(result.status).toBe("active")

    const tx = await t.run(async (ctx) =>
      ctx.db
        .query("transactions")
        .withIndex("by_providerTransactionId", (q) =>
          q.eq("providerTransactionId", "cp_provider_tx_42"),
        )
        .unique(),
    )
    expect(tx?.provider).toBe("cinetpay")
    expect(tx?.amount).toBe(1000)
  })

  it("getStatusByMtx returns row status for the owner", async () => {
    const t = convexTest(schema, modules)

    const creatorId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        name: "Creator",
        tokenIdentifier: "cp_creator3",
        accountType: "CREATOR",
        email: "creator3@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      }),
    )
    const subscriberId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "cp_subscriber3",
        accountType: "USER",
        email: "sub3@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      }),
    )

    await t.mutation(internal.cinetpay.createPending, {
      merchantTransactionId: "ft_test_mtx_002",
      subscriberId,
      creatorId,
      amount: 1000,
      intent: "subscribe",
    })

    const status = await t
      .withIdentity({ tokenIdentifier: "cp_subscriber3" })
      .query(api.cinetpay.getStatusByMtx, {
        merchantTransactionId: "ft_test_mtx_002",
      })

    expect(status.found).toBe(true)
    if (status.found) {
      expect(status.status).toBe("pending")
    }
  })

  it("getStatusByMtx returns found=false for unknown mtx", async () => {
    const t = convexTest(schema, modules)

    await t.run(async (ctx) =>
      ctx.db.insert("users", {
        name: "Subscriber",
        tokenIdentifier: "cp_subscriber4",
        accountType: "USER",
        email: "sub4@test.com",
        image: "https://test.com/image.png",
        isOnline: true,
      }),
    )

    const status = await t
      .withIdentity({ tokenIdentifier: "cp_subscriber4" })
      .query(api.cinetpay.getStatusByMtx, {
        merchantTransactionId: "ft_unknown_mtx",
      })

    expect(status.found).toBe(false)
  })
})
