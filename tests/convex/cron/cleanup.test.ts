import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { internal } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

/**
 * Tests pour les cron jobs de nettoyage
 */
describe("cron jobs cleanup", () => {
  const modules = import.meta.glob("../../../convex/**/*.ts")

  describe("cleanUpDraftAssets", () => {
    it("should delete all draft assets from database", async () => {
      const t = convexTest(schema, modules)

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

      // Créer des assets drafts
      await t.run(async (ctx) => {
        await ctx.db.insert("assetsDraft", {
          author: userId,
          mediaId: "media_1",
          mediaUrl: "https://cdn.example.com/media_1.jpg",
          assetType: "image",
        })
        await ctx.db.insert("assetsDraft", {
          author: userId,
          mediaId: "media_2",
          mediaUrl: "https://cdn.example.com/media_2.mp4",
          assetType: "video",
        })
      })

      // Vérifier qu'il y a des assets
      const beforeCleanup = await t.run(async (ctx) => {
        return await ctx.db.query("assetsDraft").collect()
      })
      expect(beforeCleanup).toHaveLength(2)

      // Exécuter le cleanup
      const result = await t.mutation(internal.assetsDraft.cleanUpDraftAssets)

      expect(result.total).toBe(2)
      expect(result.dbDeleted).toBe(2)
      expect(result.scheduledBunnyDeletes).toBe(2)

      // Vérifier que les assets sont supprimés
      const afterCleanup = await t.run(async (ctx) => {
        return await ctx.db.query("assetsDraft").collect()
      })
      expect(afterCleanup).toHaveLength(0)
    })

    it("should handle empty draft assets gracefully", async () => {
      const t = convexTest(schema, modules)

      const result = await t.mutation(internal.assetsDraft.cleanUpDraftAssets)

      expect(result.total).toBe(0)
      expect(result.dbDeleted).toBe(0)
      expect(result.scheduledBunnyDeletes).toBe(0)
    })

    it("should also clean up validation documents drafts", async () => {
      const t = convexTest(schema, modules)

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

      // Créer des documents de validation en draft
      await t.run(async (ctx) => {
        await ctx.db.insert("validationDocumentsDraft", {
          userId,
          mediaUrl: "https://cdn.example.com/doc_1.jpg",
          documentType: "identity_card",
        })
      })

      const result = await t.mutation(internal.assetsDraft.cleanUpDraftAssets)

      expect(result.total).toBe(1)
      expect(result.dbDeleted).toBe(1)

      const afterCleanup = await t.run(async (ctx) => {
        return await ctx.db.query("validationDocumentsDraft").collect()
      })
      expect(afterCleanup).toHaveLength(0)
    })
  })

  describe("cleanupCompletedBatches", () => {
    it("should delete completed notification batches older than 7 days", async () => {
      const t = convexTest(schema, modules)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "User",
          tokenIdentifier: "user_id",
          accountType: "CREATOR",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
      const oneDayAgo = Date.now() - 1 * 24 * 60 * 60 * 1000

      // Créer des batches - un ancien et un récent
      await t.run(async (ctx) => {
        // Batch ancien (devrait être supprimé)
        await ctx.db.insert("pendingNotifications", {
          type: "newPost",
          actorId: userId,
          recipientIds: [userId],
          status: "completed",
          attempts: 1,
          processedCount: 1,
          createdAt: eightDaysAgo,
        })
        // Batch récent (ne devrait pas être supprimé)
        await ctx.db.insert("pendingNotifications", {
          type: "newPost",
          actorId: userId,
          recipientIds: [userId],
          status: "completed",
          attempts: 1,
          processedCount: 1,
          createdAt: oneDayAgo,
        })
      })

      const result = await t.mutation(
        internal.notificationQueue.cleanupCompletedBatches,
      )

      expect(result.deleted).toBe(1)

      const remaining = await t.run(async (ctx) => {
        return await ctx.db.query("pendingNotifications").collect()
      })
      expect(remaining).toHaveLength(1)
      expect(remaining[0].createdAt).toBe(oneDayAgo)
    })

    it("should not delete pending or failed batches", async () => {
      const t = convexTest(schema, modules)

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "User",
          tokenIdentifier: "user_id",
          accountType: "CREATOR",
          email: "user@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000

      await t.run(async (ctx) => {
        // Batch pending ancien
        await ctx.db.insert("pendingNotifications", {
          type: "newPost",
          actorId: userId,
          recipientIds: [userId],
          status: "pending",
          attempts: 0,
          processedCount: 0,
          createdAt: eightDaysAgo,
        })
        // Batch failed ancien
        await ctx.db.insert("pendingNotifications", {
          type: "newPost",
          actorId: userId,
          recipientIds: [userId],
          status: "failed",
          attempts: 3,
          processedCount: 0,
          createdAt: eightDaysAgo,
        })
      })

      const result = await t.mutation(
        internal.notificationQueue.cleanupCompletedBatches,
      )

      expect(result.deleted).toBe(0)

      const remaining = await t.run(async (ctx) => {
        return await ctx.db.query("pendingNotifications").collect()
      })
      expect(remaining).toHaveLength(2)
    })
  })

  describe("processNextBatches", () => {
    it("should process pending notification batches", async () => {
      const t = convexTest(schema, modules)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "CREATOR",
          email: "sender@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const recipientId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Recipient",
          tokenIdentifier: "recipient_id",
          accountType: "USER",
          email: "recipient@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: senderId,
          content: "Test post",
          visibility: "public",
          medias: [],
        })
      })

      // Créer un batch pending
      await t.run(async (ctx) => {
        await ctx.db.insert("pendingNotifications", {
          type: "newPost",
          actorId: senderId,
          recipientIds: [recipientId],
          postId,
          status: "pending",
          attempts: 0,
          processedCount: 0,
          createdAt: Date.now(),
        })
      })

      // Exécuter le traitement
      const result = await t.mutation(
        internal.notificationQueue.processNextBatches,
      )

      expect(result.processed).toBe(1)
      expect(result.batchesProcessed).toBe(1)

      // Vérifier que la notification a été créée
      const notifications = await t.run(async (ctx) => {
        return await ctx.db.query("notifications").collect()
      })
      expect(notifications).toHaveLength(1)
      expect(notifications[0].recipientId).toBe(recipientId)
      expect(notifications[0].type).toBe("newPost")

      // Vérifier que le batch est marqué comme completed
      const batches = await t.run(async (ctx) => {
        return await ctx.db.query("pendingNotifications").collect()
      })
      expect(batches[0].status).toBe("completed")
    })

    it("should return empty result when no pending batches", async () => {
      const t = convexTest(schema, modules)

      const result = await t.mutation(
        internal.notificationQueue.processNextBatches,
      )

      expect(result.processed).toBe(0)
      expect(result.message).toBe("No pending batches")
    })

    it("should process multiple recipients in a batch", async () => {
      const t = convexTest(schema, modules)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "CREATOR",
          email: "sender@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const recipientIds = await t.run(async (ctx) => {
        const ids = []
        for (let i = 0; i < 5; i++) {
          const id = await ctx.db.insert("users", {
            name: `Recipient ${i}`,
            tokenIdentifier: `recipient_${i}_id`,
            accountType: "USER",
            email: `recipient${i}@test.com`,
            image: "https://test.com/image.png",
            isOnline: true,
          })
          ids.push(id)
        }
        return ids
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: senderId,
          content: "Test post",
          visibility: "public",
          medias: [],
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("pendingNotifications", {
          type: "newPost",
          actorId: senderId,
          recipientIds,
          postId,
          status: "pending",
          attempts: 0,
          processedCount: 0,
          createdAt: Date.now(),
        })
      })

      const result = await t.mutation(
        internal.notificationQueue.processNextBatches,
      )

      expect(result.processed).toBe(5)

      const notifications = await t.run(async (ctx) => {
        return await ctx.db.query("notifications").collect()
      })
      expect(notifications).toHaveLength(5)
    })
  })

  describe("enqueueNotifications", () => {
    it("should create batches for large recipient lists", async () => {
      const t = convexTest(schema, modules)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "CREATOR",
          email: "sender@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      // Créer 120 recipients (plus que BATCH_SIZE de 50)
      const recipientIds = await t.run(async (ctx) => {
        const ids = []
        for (let i = 0; i < 120; i++) {
          const id = await ctx.db.insert("users", {
            name: `Recipient ${i}`,
            tokenIdentifier: `recipient_${i}_id`,
            accountType: "USER",
            email: `recipient${i}@test.com`,
            image: "https://test.com/image.png",
            isOnline: true,
          })
          ids.push(id)
        }
        return ids
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: senderId,
          content: "Test post",
          visibility: "public",
          medias: [],
        })
      })

      const result = await t.mutation(
        internal.notificationQueue.enqueueNotifications,
        {
          type: "newPost",
          actorId: senderId,
          recipientIds,
          postId,
        },
      )

      expect(result.totalRecipients).toBe(120)
      expect(result.batchCount).toBe(3) // 120 / 50 = 2.4, ceil = 3 batches
      expect(result.queueIds).toHaveLength(3)

      const batches = await t.run(async (ctx) => {
        return await ctx.db.query("pendingNotifications").collect()
      })
      expect(batches).toHaveLength(3)
      expect(batches.every((b) => b.status === "pending")).toBe(true)
    })
  })
})
