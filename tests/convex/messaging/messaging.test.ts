import { convexTest } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api, internal } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"
import {
  insertConversation,
  insertCreator,
  insertSubscription,
  insertUser,
} from "../../helpers/convex-setup"

/**
 * Helper: set up a creator + user with both subscriptions (content + messaging)
 * and return their IDs for messaging tests.
 */
async function setupMessagingPair(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const creatorId = await insertCreator(ctx)
    const userId = await insertUser(ctx)
    await insertSubscription(ctx, {
      creator: creatorId,
      subscriber: userId,
      type: "content_access",
    })
    await insertSubscription(ctx, {
      creator: creatorId,
      subscriber: userId,
      type: "messaging_access",
    })
    return { creatorId, userId }
  })
}

describe("messaging", () => {
  // ===========================================================================
  // startConversation
  // ===========================================================================
  describe("startConversation", () => {
    it("should create a conversation with valid subscriptions", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { creatorId } = await setupMessagingPair(t)

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const conversationId = await user.mutation(
        api.messaging.startConversation,
        { creatorId },
      )

      expect(conversationId).toBeDefined()

      // Verify conversation was created
      const conversation = await t.run(async (ctx) => {
        return await ctx.db.get(conversationId)
      })
      expect(conversation).not.toBeNull()
      expect(conversation!.isLocked).toBe(false)
      expect(conversation!.initiatorRole).toBe("user")

      // Verify system message was created
      const messages = await t.run(async (ctx) => {
        return await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversationId),
          )
          .collect()
      })
      expect(messages).toHaveLength(1)
      expect(messages[0].messageType).toBe("system")
      expect(messages[0].systemMessageType).toBe("conversation_started")
    })

    it("should reject when target is not a creator", async () => {
      const t = convexTest(schema)

      const { userId2 } = await t.run(async (ctx) => {
        await insertUser(ctx)
        const userId2 = await insertUser(ctx, {
          tokenIdentifier: "other_user_id",
          email: "other@test.com",
          externalId: "ext_other",
        })
        return { userId2 }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      await expect(
        user.mutation(api.messaging.startConversation, {
          creatorId: userId2,
        }),
      ).rejects.toThrow("Ce utilisateur n'est pas un créateur")
    })

    it("should reject without content_access subscription", async () => {
      const t = convexTest(schema)

      const { creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        await insertUser(ctx)
        // No subscriptions at all
        return { creatorId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      await expect(
        user.mutation(api.messaging.startConversation, { creatorId }),
      ).rejects.toThrow()
    })

    it("should reject without messaging_access subscription", async () => {
      const t = convexTest(schema)

      const { creatorId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        // Only content_access, no messaging_access
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        return { creatorId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      await expect(
        user.mutation(api.messaging.startConversation, { creatorId }),
      ).rejects.toThrow()
    })

    it("should restore a soft-deleted conversation", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { creatorId, conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "messaging_access",
        })
        // Create and soft-delete conversation
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        await ctx.db.patch(conversationId, { deletedByUser: true })
        return { creatorId, conversationId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const result = await user.mutation(api.messaging.startConversation, {
        creatorId,
      })

      expect(result).toBe(conversationId)

      // Verify deletedByUser was cleared
      const conv = await t.run(async (ctx) => {
        return await ctx.db.get(conversationId)
      })
      expect(conv!.deletedByUser).toBe(false)
    })
  })

  // ===========================================================================
  // startConversationAsCreator
  // ===========================================================================
  describe("startConversationAsCreator", () => {
    it("should create conversation and grant 3-day messaging subscription", async () => {
      const t = convexTest(schema)

      const { userId } = await t.run(async (ctx) => {
        await insertCreator(ctx)
        const userId = await insertUser(ctx)
        return { userId }
      })

      const creator = t.withIdentity({ tokenIdentifier: "test_creator_id" })
      const conversationId = await creator.mutation(
        api.messaging.startConversationAsCreator,
        { userId },
      )

      expect(conversationId).toBeDefined()

      // Verify conversation
      const conv = await t.run(async (ctx) => {
        return await ctx.db.get(conversationId)
      })
      expect(conv!.initiatorRole).toBe("creator")
      expect(conv!.requiresSubscription).toBe(true)

      // Verify 3-day messaging subscription was created
      const subs = await t.run(async (ctx) => {
        return await ctx.db
          .query("subscriptions")
          .filter((q) => q.eq(q.field("type"), "messaging_access"))
          .collect()
      })
      expect(subs).toHaveLength(1)
      expect(subs[0].grantedByCreator).toBe(true)
      expect(subs[0].amountPaid).toBe(0)
      expect(subs[0].status).toBe("active")
    })

    it("should reject non-creator/non-admin callers", async () => {
      const t = convexTest(schema)

      const { creatorId } = await t.run(async (ctx) => {
        await insertUser(ctx)
        const creatorId = await insertCreator(ctx)
        return { creatorId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      await expect(
        user.mutation(api.messaging.startConversationAsCreator, {
          userId: creatorId,
        }),
      ).rejects.toThrow("Seuls les créateurs peuvent initier des conversations")
    })
  })

  // ===========================================================================
  // sendMessage
  // ===========================================================================
  describe("sendMessage", () => {
    it("should send a text message", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { creatorId, conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "messaging_access",
        })
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        return { creatorId, conversationId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const messageId = await user.mutation(api.messaging.sendMessage, {
        conversationId,
        content: "Hello creator!",
      })

      expect(messageId).toBeDefined()

      // Verify message was created
      const message = await t.run(async (ctx) => {
        return await ctx.db.get(messageId)
      })
      expect(message!.content).toBe("Hello creator!")
      expect(message!.messageType).toBe("text")
    })

    it("should update conversation lastMessageAt and unreadCount", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "messaging_access",
        })
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        return { conversationId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      await user.mutation(api.messaging.sendMessage, {
        conversationId,
        content: "Hello!",
      })

      // Creator's unread count should be incremented
      const conv = await t.run(async (ctx) => {
        return await ctx.db.get(conversationId)
      })
      expect(conv!.unreadCountCreator).toBe(1)
      expect(conv!.unreadCountUser).toBe(0)
      expect(conv!.lastMessagePreview).toBe("Hello!")
    })

    it("should reject media from non-creator users", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "messaging_access",
        })
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        return { conversationId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      await expect(
        user.mutation(api.messaging.sendMessage, {
          conversationId,
          medias: [
            {
              type: "image",
              url: "https://cdn.test.com/img.jpg",
              mediaId: "img_1",
              mimeType: "image/jpeg",
            },
          ],
        }),
      ).rejects.toThrow("Seuls les créateurs peuvent envoyer des médias")
    })
  })

  // ===========================================================================
  // editMessage
  // ===========================================================================
  describe("editMessage", () => {
    it("should edit own message within 15-minute window", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "messaging_access",
        })
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        return { conversationId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const messageId = await user.mutation(api.messaging.sendMessage, {
        conversationId,
        content: "Original text",
      })

      await user.mutation(api.messaging.editMessage, {
        messageId,
        newContent: "Edited text",
      })

      const message = await t.run(async (ctx) => {
        return await ctx.db.get(messageId)
      })
      expect(message!.content).toBe("Edited text")
      expect(message!.isEdited).toBe(true)
      expect(message!.originalContent).toBe("Original text")
    })

    it("should reject editing another user message", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "messaging_access",
        })
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        return { conversationId }
      })

      // User sends a message
      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const messageId = await user.mutation(api.messaging.sendMessage, {
        conversationId,
        content: "User message",
      })

      // Creator tries to edit it
      const creator = t.withIdentity({ tokenIdentifier: "test_creator_id" })

      await expect(
        creator.mutation(api.messaging.editMessage, {
          messageId,
          newContent: "Hacked",
        }),
      ).rejects.toThrow("Vous ne pouvez modifier que vos propres messages")
    })
  })

  // ===========================================================================
  // deleteMessage
  // ===========================================================================
  describe("deleteMessage", () => {
    it("should soft-delete own message", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "messaging_access",
        })
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        return { conversationId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const messageId = await user.mutation(api.messaging.sendMessage, {
        conversationId,
        content: "To be deleted",
      })

      await user.mutation(api.messaging.deleteMessage, { messageId })

      const message = await t.run(async (ctx) => {
        return await ctx.db.get(messageId)
      })
      expect(message!.isDeleted).toBe(true)
      expect(message!.deletedAt).toBeDefined()
    })
  })

  // ===========================================================================
  // markAsRead
  // ===========================================================================
  describe("markAsRead", () => {
    it("should reset unreadCount for the caller role", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "messaging_access",
        })
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        return { conversationId }
      })

      // User sends message (increments creator unread)
      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      await user.mutation(api.messaging.sendMessage, {
        conversationId,
        content: "Hello!",
      })

      // Creator marks as read
      const creator = t.withIdentity({ tokenIdentifier: "test_creator_id" })
      await creator.mutation(api.messaging.markAsRead, { conversationId })

      const conv = await t.run(async (ctx) => {
        return await ctx.db.get(conversationId)
      })
      expect(conv!.unreadCountCreator).toBe(0)
    })
  })

  // ===========================================================================
  // getMyConversations
  // ===========================================================================
  describe("getMyConversations", () => {
    it("should return conversations sorted by last activity", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        // 2 conversations with different lastMessageAt
        await ctx.db.insert("conversations", {
          creatorId,
          userId,
          unreadCountCreator: 0,
          unreadCountUser: 0,
          isLocked: false,
          lastMessageAt: 1000,
          lastMessagePreview: "Old",
        })
        // Need a second creator for second conversation
        const creator2 = await insertCreator(ctx, {
          tokenIdentifier: "creator2_id",
          email: "creator2@test.com",
          externalId: "ext_creator2",
        })
        await ctx.db.insert("conversations", {
          creatorId: creator2,
          userId,
          unreadCountCreator: 0,
          unreadCountUser: 0,
          isLocked: false,
          lastMessageAt: 2000,
          lastMessagePreview: "Recent",
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const result = await user.query(api.messaging.getMyConversations, {})

      expect(result).toHaveLength(2)
      // Most recent first
      expect(result[0].lastMessagePreview).toBe("Recent")
      expect(result[1].lastMessagePreview).toBe("Old")
    })

    it("should filter soft-deleted conversations", async () => {
      const t = convexTest(schema)

      await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)

        await ctx.db.insert("conversations", {
          creatorId,
          userId,
          unreadCountCreator: 0,
          unreadCountUser: 0,
          isLocked: false,
          lastMessageAt: Date.now(),
          deletedByUser: true,
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })
      const result = await user.query(api.messaging.getMyConversations, {})

      expect(result).toHaveLength(0)
    })
  })

  // ===========================================================================
  // getMessages
  // ===========================================================================
  describe("getMessages", () => {
    it("should return paginated messages for a conversation", async () => {
      const t = convexTest(schema)
      registerRateLimiter(t)

      const { conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "content_access",
        })
        await insertSubscription(ctx, {
          creator: creatorId,
          subscriber: userId,
          type: "messaging_access",
        })
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        return { conversationId }
      })

      const user = t.withIdentity({ tokenIdentifier: "test_user_id" })

      // Send a few messages
      await user.mutation(api.messaging.sendMessage, {
        conversationId,
        content: "Message 1",
      })
      await user.mutation(api.messaging.sendMessage, {
        conversationId,
        content: "Message 2",
      })

      const result = await user.query(api.messaging.getMessages, {
        conversationId,
      })

      // System message (conversation_started from insertConversation is not auto-created,
      // but the sent messages should be there)
      expect(result.messages.length).toBeGreaterThanOrEqual(2)
      expect(result.hasMore).toBe(false)
    })
  })

  // ===========================================================================
  // Lock/Unlock lifecycle
  // ===========================================================================
  describe("lock/unlock lifecycle", () => {
    it("should lock conversation on subscription expiry", async () => {
      const t = convexTest(schema)

      const { conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
        })
        return { conversationId }
      })

      await t.mutation(internal.messaging.lockConversationOnExpiry, {
        conversationId,
      })

      const conv = await t.run(async (ctx) => {
        return await ctx.db.get(conversationId)
      })
      expect(conv!.isLocked).toBe(true)
      expect(conv!.lockedReason).toBe("subscription_expired")

      // Verify system message was inserted
      const messages = await t.run(async (ctx) => {
        return await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversationId),
          )
          .collect()
      })
      expect(messages.some((m) => m.systemMessageType === "conversation_locked")).toBe(true)
    })

    it("should unlock conversation on subscription renewal", async () => {
      const t = convexTest(schema)

      const { conversationId } = await t.run(async (ctx) => {
        const creatorId = await insertCreator(ctx)
        const userId = await insertUser(ctx)
        const conversationId = await insertConversation(ctx, {
          creatorId,
          userId,
          isLocked: true,
        })
        // Set locked state properly
        await ctx.db.patch(conversationId, {
          lockedAt: Date.now(),
          lockedReason: "subscription_expired",
        })
        return { conversationId }
      })

      await t.mutation(internal.messaging.unlockConversationOnRenewal, {
        conversationId,
      })

      const conv = await t.run(async (ctx) => {
        return await ctx.db.get(conversationId)
      })
      expect(conv!.isLocked).toBe(false)
      expect(conv!.lockedReason).toBeUndefined()

      // Verify system message was inserted
      const messages = await t.run(async (ctx) => {
        return await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversationId),
          )
          .collect()
      })
      expect(messages.some((m) => m.systemMessageType === "conversation_unlocked")).toBe(true)
    })
  })
})
