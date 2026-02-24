import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api, internal } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"
import { USD_TO_XAF_RATE, TIP_CREATOR_RATE } from "../../../convex/lib/constants"
import { insertCreator, insertUser } from "../../helpers/convex-setup"

describe("tips", () => {
  describe("processTipAtomic", () => {
    it("should create a tip and notify the creator", async () => {
      const t = convexTest(schema)

      const { senderId, creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const senderId = await insertUser(ctx)
        return { senderId, creatorId }
      })

      const result = await t.mutation(internal.tips.processTipAtomic, {
        provider: "stripe",
        providerTransactionId: "tx_001",
        senderId,
        creatorId,
        amount: 1000,
        currency: "XAF",
        message: "Great content!",
        context: "profile",
      })

      expect(result.success).toBe(true)
      expect(result.tipId).toBeDefined()
      expect(result.alreadyProcessed).toBe(false)
      expect(result.message).toBe("Tip processed successfully")

      // Verify tip was inserted
      const tips = await t.run(async (ctx) => {
        return await ctx.db.query("tips").collect()
      })
      expect(tips).toHaveLength(1)
      expect(tips[0].amount).toBe(1000)
      expect(tips[0].currency).toBe("XAF")
      expect(tips[0].status).toBe("succeeded")
      expect(tips[0].message).toBe("Great content!")

      // Verify notification was created
      const notifications = await t.run(async (ctx) => {
        return await ctx.db.query("notifications").collect()
      })
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe("tip")
      expect(notifications[0].recipientId).toBe(creatorId)
    })

    it("should be idempotent with same providerTransactionId", async () => {
      const t = convexTest(schema)

      const { senderId, creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const senderId = await insertUser(ctx)
        return { senderId, creatorId }
      })

      const args = {
        provider: "stripe",
        providerTransactionId: "tx_dup",
        senderId,
        creatorId,
        amount: 500,
        currency: "XAF",
      }

      const first = await t.mutation(internal.tips.processTipAtomic, args)
      const second = await t.mutation(internal.tips.processTipAtomic, args)

      expect(first.success).toBe(true)
      expect(first.alreadyProcessed).toBe(false)

      expect(second.success).toBe(true)
      expect(second.alreadyProcessed).toBe(true)
      expect(second.tipId).toBe(first.tipId)

      // Only 1 tip in DB
      const tips = await t.run(async (ctx) => {
        return await ctx.db.query("tips").collect()
      })
      expect(tips).toHaveLength(1)
    })

    it("should reject when creator does not exist", async () => {
      const t = convexTest(schema)

      const { senderId, fakeCreatorId } = await t.run(async (ctx) => {
        const senderId = await insertUser(ctx)
        // Create and delete to get a valid-looking but non-existent ID
        const fakeCreatorId = await insertCreator(ctx)
        await ctx.db.delete(fakeCreatorId)
        return { senderId, fakeCreatorId }
      })

      const result = await t.mutation(internal.tips.processTipAtomic, {
        provider: "stripe",
        providerTransactionId: "tx_invalid_creator",
        senderId,
        creatorId: fakeCreatorId,
        amount: 1000,
        currency: "XAF",
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe("Cannot tip non-creator user")
      expect(result.tipId).toBeNull()
    })

    it("should reject self-tipping", async () => {
      const t = convexTest(schema)

      const { creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        return { creatorId }
      })

      const result = await t.mutation(internal.tips.processTipAtomic, {
        provider: "stripe",
        providerTransactionId: "tx_self",
        senderId: creatorId,
        creatorId,
        amount: 1000,
        currency: "XAF",
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe("Cannot tip yourself")
      expect(result.tipId).toBeNull()
    })

    it("should convert USD tips to XAF for stats", async () => {
      const t = convexTest(schema)

      const { senderId, creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const senderId = await insertUser(ctx)
        return { senderId, creatorId }
      })

      await t.mutation(internal.tips.processTipAtomic, {
        provider: "stripe",
        providerTransactionId: "tx_usd",
        senderId,
        creatorId,
        amount: 10, // $10 USD
        currency: "usd",
      })

      // Verify stats were updated with XAF conversion
      const stats = await t.run(async (ctx) => {
        return await ctx.db
          .query("userStats")
          .withIndex("by_userId", (q) => q.eq("userId", creatorId))
          .unique()
      })

      expect(stats).not.toBeNull()
      expect(stats!.tipsReceived).toBe(1)
      expect(stats!.totalTipsAmount).toBe(10 * USD_TO_XAF_RATE)
    })

    it("should update userStats (create if missing)", async () => {
      const t = convexTest(schema)

      const { senderId, creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const senderId = await insertUser(ctx)
        return { senderId, creatorId }
      })

      // First tip — creates userStats
      await t.mutation(internal.tips.processTipAtomic, {
        provider: "stripe",
        providerTransactionId: "tx_stats1",
        senderId,
        creatorId,
        amount: 1000,
        currency: "XAF",
      })

      const stats1 = await t.run(async (ctx) => {
        return await ctx.db
          .query("userStats")
          .withIndex("by_userId", (q) => q.eq("userId", creatorId))
          .unique()
      })
      expect(stats1!.tipsReceived).toBe(1)
      expect(stats1!.totalTipsAmount).toBe(1000)

      // Second tip — updates existing
      await t.mutation(internal.tips.processTipAtomic, {
        provider: "stripe",
        providerTransactionId: "tx_stats2",
        senderId,
        creatorId,
        amount: 2000,
        currency: "XAF",
      })

      const stats2 = await t.run(async (ctx) => {
        return await ctx.db
          .query("userStats")
          .withIndex("by_userId", (q) => q.eq("userId", creatorId))
          .unique()
      })
      expect(stats2!.tipsReceived).toBe(2)
      expect(stats2!.totalTipsAmount).toBe(3000)
    })
  })

  describe("getCreatorTipEarnings", () => {
    it("should return aggregated earnings for a creator", async () => {
      const t = convexTest(schema)

      const { senderId, creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const senderId = await insertUser(ctx)
        return { senderId, creatorId }
      })

      // Create 2 tips
      await t.mutation(internal.tips.processTipAtomic, {
        provider: "stripe",
        providerTransactionId: "tx_e1",
        senderId,
        creatorId,
        amount: 1000,
        currency: "XAF",
        message: "Nice!",
        context: "post",
      })
      await t.mutation(internal.tips.processTipAtomic, {
        provider: "stripe",
        providerTransactionId: "tx_e2",
        senderId,
        creatorId,
        amount: 2000,
        currency: "XAF",
        context: "profile",
      })

      const creator = t.withIdentity({ tokenIdentifier: "test_creator_id" })
      const result = await creator.query(api.tips.getCreatorTipEarnings, {})

      expect(result.tipCount).toBe(2)
      expect(result.totalTipsGross).toBe(3000)
      expect(result.currency).toBe("XAF")
      expect(result.recentTips).toHaveLength(2)
      expect(result.recentTips[0].sender).not.toBeNull()
      expect(result.recentTips[0].sender!.name).toBe("Test User")
    })

    it("should calculate net with 70% creator rate", async () => {
      const t = convexTest(schema)

      const { senderId, creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const senderId = await insertUser(ctx)
        return { senderId, creatorId }
      })

      await t.mutation(internal.tips.processTipAtomic, {
        provider: "stripe",
        providerTransactionId: "tx_net",
        senderId,
        creatorId,
        amount: 10000,
        currency: "XAF",
      })

      const creator = t.withIdentity({ tokenIdentifier: "test_creator_id" })
      const result = await creator.query(api.tips.getCreatorTipEarnings, {})

      expect(result.totalTipsGross).toBe(10000)
      expect(result.totalTipsNet).toBe(Math.round(10000 * TIP_CREATOR_RATE))
    })

    it("should return empty stats for creator with no tips", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        await insertCreator(ctx)
      })

      const creator = t.withIdentity({ tokenIdentifier: "test_creator_id" })
      const result = await creator.query(api.tips.getCreatorTipEarnings, {})

      expect(result.tipCount).toBe(0)
      expect(result.totalTipsGross).toBe(0)
      expect(result.totalTipsNet).toBe(0)
      expect(result.recentTips).toHaveLength(0)
    })

    it("should reject non-creator users", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        await insertUser(ctx)
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      await expect(
        user.query(api.tips.getCreatorTipEarnings, {}),
      ).rejects.toThrow()
    })
  })
})
