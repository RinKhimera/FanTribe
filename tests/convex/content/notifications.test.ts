import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import {
  createNotification,
  removeActorFromNotification,
} from "../../../convex/lib/notifications"
import schema from "../../../convex/schema"

// Helper to create test users
async function createTestUser(
  t: ReturnType<typeof convexTest>,
  overrides: { name: string; tokenIdentifier: string; email: string } & Record<string, unknown>,
) {
  const { name, tokenIdentifier, email, accountType, ...rest } = overrides
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      name,
      tokenIdentifier,
      accountType: (accountType as "USER" | "CREATOR") ?? "USER",
      email,
      image: "https://test.com/image.png",
      isOnline: true,
      ...rest,
    })
  })
}

// Helper to insert a notification directly (new schema shape)
async function insertNotification(
  t: ReturnType<typeof convexTest>,
  data: {
    type: string
    recipientId: string
    actorId: string
    postId?: string
    isRead?: boolean
  },
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("notifications", {
      type: data.type as "like",
      recipientId: data.recipientId as never,
      groupKey: `${data.type}:${data.postId ?? Date.now()}`,
      actorIds: [data.actorId as never],
      actorCount: 1,
      postId: data.postId as never,
      isRead: data.isRead ?? false,
      lastActivityAt: Date.now(),
    })
  })
}

describe("notifications", () => {
  describe("createNotification (central service)", () => {
    it("should create a notification with grouping fields", async () => {
      const t = convexTest(schema)

      const senderId = await createTestUser(t, {
        name: "Sender",
        tokenIdentifier: "sender_id",
        email: "sender@test.com",
      })

      const recipientId = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
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
        const result = await createNotification(ctx, {
          type: "like",
          recipientId,
          actorId: senderId,
          postId,
        })
        expect(result.created).toBe(true)
      })

      // Verify the notification was created with proper fields
      const notif = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", recipientId))
          .first()
      })

      expect(notif).not.toBeNull()
      expect(notif!.type).toBe("like")
      expect(notif!.actorIds).toHaveLength(1)
      expect(notif!.actorCount).toBe(1)
      expect(notif!.groupKey).toBe(`like:${postId}`)
      expect(notif!.isRead).toBe(false)
    })

    it("should group multiple likes on the same post", async () => {
      const t = convexTest(schema)

      const actor1 = await createTestUser(t, {
        name: "Actor1",
        tokenIdentifier: "actor1",
        email: "actor1@test.com",
      })
      const actor2 = await createTestUser(t, {
        name: "Actor2",
        tokenIdentifier: "actor2",
        email: "actor2@test.com",
      })
      const actor3 = await createTestUser(t, {
        name: "Actor3",
        tokenIdentifier: "actor3",
        email: "actor3@test.com",
      })

      const recipient = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: recipient,
          content: "Test post",
          visibility: "public",
          medias: [],
        })
      })

      // 3 different users like the same post
      await t.run(async (ctx) => {
        await createNotification(ctx, {
          type: "like",
          recipientId: recipient,
          actorId: actor1,
          postId,
        })
        await createNotification(ctx, {
          type: "like",
          recipientId: recipient,
          actorId: actor2,
          postId,
        })
        await createNotification(ctx, {
          type: "like",
          recipientId: recipient,
          actorId: actor3,
          postId,
        })
      })

      // Should be 1 grouped notification, not 3 separate
      const notifs = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", recipient))
          .collect()
      })

      expect(notifs).toHaveLength(1)
      expect(notifs[0].actorCount).toBe(3)
      expect(notifs[0].actorIds).toHaveLength(3)
    })

    it("should skip self-notifications", async () => {
      const t = convexTest(schema)

      const userId = await createTestUser(t, {
        name: "Self",
        tokenIdentifier: "self_id",
        email: "self@test.com",
      })

      await t.run(async (ctx) => {
        const result = await createNotification(ctx, {
          type: "like",
          recipientId: userId,
          actorId: userId,
        })
        expect(result.created).toBe(false)
        expect(result.reason).toBe("self")
      })
    })

    it("should respect user notification preferences", async () => {
      const t = convexTest(schema)

      const senderId = await createTestUser(t, {
        name: "Sender",
        tokenIdentifier: "sender_id",
        email: "sender@test.com",
      })

      // Recipient with likes disabled
      const recipientId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Recipient",
          tokenIdentifier: "recipient_id",
          accountType: "USER",
          email: "recipient@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
          notificationPreferences: { likes: false },
        })
      })

      await t.run(async (ctx) => {
        const result = await createNotification(ctx, {
          type: "like",
          recipientId,
          actorId: senderId,
        })
        expect(result.created).toBe(false)
        expect(result.reason).toBe("preference_disabled")
      })
    })
  })

  describe("removeActorFromNotification", () => {
    it("should decrement actorCount when removing an actor", async () => {
      const t = convexTest(schema)

      const actor1 = await createTestUser(t, {
        name: "Actor1",
        tokenIdentifier: "actor1",
        email: "actor1@test.com",
      })
      const actor2 = await createTestUser(t, {
        name: "Actor2",
        tokenIdentifier: "actor2",
        email: "actor2@test.com",
      })
      const recipient = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: recipient,
          content: "Test",
          visibility: "public",
          medias: [],
        })
      })

      // Create grouped notification
      await t.run(async (ctx) => {
        await createNotification(ctx, {
          type: "like",
          recipientId: recipient,
          actorId: actor1,
          postId,
        })
        await createNotification(ctx, {
          type: "like",
          recipientId: recipient,
          actorId: actor2,
          postId,
        })
      })

      // Remove actor1 (unlike)
      await t.run(async (ctx) => {
        await removeActorFromNotification(ctx, {
          type: "like",
          recipientId: recipient,
          actorId: actor1,
          postId,
        })
      })

      const notif = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", recipient))
          .first()
      })

      expect(notif).not.toBeNull()
      expect(notif!.actorCount).toBe(1)
    })

    it("should delete notification when last actor removed", async () => {
      const t = convexTest(schema)

      const actor = await createTestUser(t, {
        name: "Actor",
        tokenIdentifier: "actor",
        email: "actor@test.com",
      })
      const recipient = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
      })

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: recipient,
          content: "Test",
          visibility: "public",
          medias: [],
        })
      })

      await t.run(async (ctx) => {
        await createNotification(ctx, {
          type: "like",
          recipientId: recipient,
          actorId: actor,
          postId,
        })
      })

      await t.run(async (ctx) => {
        await removeActorFromNotification(ctx, {
          type: "like",
          recipientId: recipient,
          actorId: actor,
          postId,
        })
      })

      const notifs = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", recipient))
          .collect()
      })

      expect(notifs).toHaveLength(0)
    })
  })

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const t = convexTest(schema)

      const senderId = await createTestUser(t, {
        name: "Sender",
        tokenIdentifier: "sender_id",
        email: "sender@test.com",
      })

      const recipientId = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
      })

      const notifId = await insertNotification(t, {
        type: "like",
        recipientId: recipientId as unknown as string,
        actorId: senderId as unknown as string,
      })

      const user = t.withIdentity({ tokenIdentifier: "recipient_id" })
      await user.mutation(api.notifications.markAsRead, {
        notificationId: notifId,
      })

      const notif = await t.run(async (ctx) => ctx.db.get(notifId))
      expect(notif?.isRead).toBe(true)
    })

    it("should throw for non-existent notification", async () => {
      const t = convexTest(schema)

      const recipientId = await createTestUser(t, {
        name: "User",
        tokenIdentifier: "user_id",
        email: "user@test.com",
      })

      const fakeId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("notifications", {
          type: "like",
          recipientId,
          groupKey: "like:fake",
          actorIds: [recipientId],
          actorCount: 1,
          isRead: false,
          lastActivityAt: Date.now(),
        })
        await ctx.db.delete(id)
        return id
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      await expect(
        user.mutation(api.notifications.markAsRead, {
          notificationId: fakeId,
        }),
      ).rejects.toThrow()
    })
  })

  describe("markAllAsRead", () => {
    it("should mark all unread notifications as read", async () => {
      const t = convexTest(schema)

      const senderId = await createTestUser(t, {
        name: "Sender",
        tokenIdentifier: "sender_id",
        email: "sender@test.com",
      })

      const recipientId = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
      })

      // Create 3 unread notifications
      for (let i = 0; i < 3; i++) {
        await insertNotification(t, {
          type: "like",
          recipientId: recipientId as unknown as string,
          actorId: senderId as unknown as string,
        })
      }

      const user = t.withIdentity({ tokenIdentifier: "recipient_id" })
      const result = await user.mutation(api.notifications.markAllAsRead)

      expect(result.count).toBe(3)

      const notifs = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", recipientId))
          .collect()
      })

      expect(notifs.every((n) => n.isRead)).toBe(true)
    })

    it("should return count of 0 when all already read", async () => {
      const t = convexTest(schema)

      const senderId = await createTestUser(t, {
        name: "Sender",
        tokenIdentifier: "sender_id",
        email: "sender@test.com",
      })

      const recipientId = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
      })

      await insertNotification(t, {
        type: "like",
        recipientId: recipientId as unknown as string,
        actorId: senderId as unknown as string,
        isRead: true,
      })

      const user = t.withIdentity({ tokenIdentifier: "recipient_id" })
      const result = await user.mutation(api.notifications.markAllAsRead)

      expect(result.count).toBe(0)
    })
  })

  describe("deleteNotification", () => {
    it("should delete own notification", async () => {
      const t = convexTest(schema)

      const senderId = await createTestUser(t, {
        name: "Sender",
        tokenIdentifier: "sender_id",
        email: "sender@test.com",
      })

      const recipientId = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
      })

      const notifId = await insertNotification(t, {
        type: "like",
        recipientId: recipientId as unknown as string,
        actorId: senderId as unknown as string,
      })

      const user = t.withIdentity({ tokenIdentifier: "recipient_id" })
      await user.mutation(api.notifications.deleteNotification, {
        notificationId: notifId,
      })

      const notif = await t.run(async (ctx) => ctx.db.get(notifId))
      expect(notif).toBeNull()
    })

    it("should reject deletion of others' notifications", async () => {
      const t = convexTest(schema)

      const senderId = await createTestUser(t, {
        name: "Sender",
        tokenIdentifier: "sender_id",
        email: "sender@test.com",
      })

      const recipientId = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
      })

      await createTestUser(t, {
        name: "Other",
        tokenIdentifier: "other_id",
        email: "other@test.com",
      })

      const notifId = await insertNotification(t, {
        type: "like",
        recipientId: recipientId as unknown as string,
        actorId: senderId as unknown as string,
      })

      const other = t.withIdentity({ tokenIdentifier: "other_id" })
      await expect(
        other.mutation(api.notifications.deleteNotification, {
          notificationId: notifId,
        }),
      ).rejects.toThrow()
    })
  })

  describe("getUnreadCounts", () => {
    it("should count unread notifications", async () => {
      const t = convexTest(schema)

      const senderId = await createTestUser(t, {
        name: "Sender",
        tokenIdentifier: "sender_id",
        email: "sender@test.com",
      })

      const recipientId = await createTestUser(t, {
        name: "Recipient",
        tokenIdentifier: "recipient_id",
        email: "recipient@test.com",
      })

      // Create 2 unread and 1 read notification
      await insertNotification(t, {
        type: "like",
        recipientId: recipientId as unknown as string,
        actorId: senderId as unknown as string,
        isRead: false,
      })
      await insertNotification(t, {
        type: "comment",
        recipientId: recipientId as unknown as string,
        actorId: senderId as unknown as string,
        isRead: false,
      })
      await insertNotification(t, {
        type: "newPost",
        recipientId: recipientId as unknown as string,
        actorId: senderId as unknown as string,
        isRead: true,
      })

      const user = t.withIdentity({ tokenIdentifier: "recipient_id" })
      const counts = await user.query(api.notifications.getUnreadCounts)

      expect(counts.unreadNotificationsCount).toBe(2)
    })
  })
})
