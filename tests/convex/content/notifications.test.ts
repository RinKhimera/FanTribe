import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("notifications", () => {
  describe("getUserNotifications", () => {
    it("should return enriched notifications with sender and post", async () => {
      const t = convexTest(schema)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "USER",
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

      await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          type: "like",
          recipientId,
          sender: senderId,
          post: postId,
          read: false,
        })
      })

      const recipient = t.withIdentity({ tokenIdentifier: "recipient_id" })
      const notifications = await recipient.query(api.notifications.getUserNotifications)

      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe("like")
      expect(notifications[0].sender?.name).toBe("Sender")
      expect(notifications[0].post?.content).toBe("Test post")
      expect(notifications[0].read).toBe(false)
    })

    it("should return empty array for user with no notifications", async () => {
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

      const user = t.withIdentity({ tokenIdentifier: "user_id" })
      const notifications = await user.query(api.notifications.getUserNotifications)

      expect(notifications).toHaveLength(0)
    })
  })

  describe("getNotificationsByType", () => {
    it("should filter by type 'like'", async () => {
      const t = convexTest(schema)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "USER",
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

      // Create a like notification
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          type: "like",
          recipientId,
          sender: senderId,
          post: postId,
          read: false,
        })
      })

      // Create a comment notification
      await t.run(async (ctx) => {
        const commentId = await ctx.db.insert("comments", {
          author: senderId,
          post: postId,
          content: "Test comment",
        })
        await ctx.db.insert("notifications", {
          type: "comment",
          recipientId,
          sender: senderId,
          post: postId,
          comment: commentId,
          read: false,
        })
      })

      const recipient = t.withIdentity({ tokenIdentifier: "recipient_id" })
      const likeNotifs = await recipient.query(api.notifications.getNotificationsByType, {
        type: "like",
      })

      expect(likeNotifs).toHaveLength(1)
      expect(likeNotifs[0].type).toBe("like")
    })

    it("should return all when type is 'all'", async () => {
      const t = convexTest(schema)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "USER",
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

      // Create multiple notification types
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          type: "like",
          recipientId,
          sender: senderId,
          post: postId,
          read: false,
        })
        await ctx.db.insert("notifications", {
          type: "newPost",
          recipientId,
          sender: senderId,
          post: postId,
          read: false,
        })
      })

      const recipient = t.withIdentity({ tokenIdentifier: "recipient_id" })
      const allNotifs = await recipient.query(api.notifications.getNotificationsByType, {
        type: "all",
      })

      expect(allNotifs).toHaveLength(2)
    })
  })

  describe("markNotificationAsRead", () => {
    it("should mark notification as read", async () => {
      const t = convexTest(schema)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "USER",
          email: "sender@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Recipient",
          tokenIdentifier: "recipient_id",
          accountType: "USER",
          email: "recipient@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const recipientId = await t.run(async (ctx) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", "recipient_id"))
          .unique()
        return user!._id
      })

      const notifId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          type: "like",
          recipientId,
          sender: senderId,
          read: false,
        })
      })

      const recipient = t.withIdentity({ tokenIdentifier: "recipient_id" })
      await recipient.mutation(api.notifications.markNotificationAsRead, {
        notificationId: notifId,
      })

      const notif = await t.run(async (ctx) => ctx.db.get(notifId))
      expect(notif?.read).toBe(true)
    })

    it("should throw for non-existent notification", async () => {
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

      const user = t.withIdentity({ tokenIdentifier: "user_id" })

      // Create a valid notification ID format but non-existent
      const fakeId = await t.run(async (ctx) => {
        const notifId = await ctx.db.insert("notifications", {
          type: "like",
          recipientId: (await ctx.db.query("users").first())!._id,
          sender: (await ctx.db.query("users").first())!._id,
          read: false,
        })
        await ctx.db.delete(notifId)
        return notifId
      })

      await expect(
        user.mutation(api.notifications.markNotificationAsRead, {
          notificationId: fakeId,
        })
      ).rejects.toThrow("Notification not found")
    })
  })

  describe("markAllAsRead", () => {
    it("should mark all unread notifications as read", async () => {
      const t = convexTest(schema)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "USER",
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

      // Create 3 unread notifications
      await t.run(async (ctx) => {
        for (let i = 0; i < 3; i++) {
          await ctx.db.insert("notifications", {
            type: "like",
            recipientId,
            sender: senderId,
            read: false,
          })
        }
      })

      const recipient = t.withIdentity({ tokenIdentifier: "recipient_id" })
      const result = await recipient.mutation(api.notifications.markAllAsRead)

      expect(result.count).toBe(3)

      const notifications = await t.run(async (ctx) => {
        return await ctx.db
          .query("notifications")
          .withIndex("by_recipient", (q) => q.eq("recipientId", recipientId))
          .collect()
      })

      expect(notifications.every((n) => n.read)).toBe(true)
    })

    it("should return count of 0 when all already read", async () => {
      const t = convexTest(schema)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "USER",
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

      // Create already-read notification
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          type: "like",
          recipientId,
          sender: senderId,
          read: true,
        })
      })

      const recipient = t.withIdentity({ tokenIdentifier: "recipient_id" })
      const result = await recipient.mutation(api.notifications.markAllAsRead)

      expect(result.count).toBe(0)
    })
  })

  describe("deleteNotification", () => {
    it("should delete own notification", async () => {
      const t = convexTest(schema)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "USER",
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

      const notifId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          type: "like",
          recipientId,
          sender: senderId,
          read: false,
        })
      })

      const recipient = t.withIdentity({ tokenIdentifier: "recipient_id" })
      await recipient.mutation(api.notifications.deleteNotification, {
        notificationId: notifId,
      })

      const notif = await t.run(async (ctx) => ctx.db.get(notifId))
      expect(notif).toBeNull()
    })

    it("should reject deletion of others' notifications", async () => {
      const t = convexTest(schema)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "USER",
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

      const notifId = await t.run(async (ctx) => {
        return await ctx.db.insert("notifications", {
          type: "like",
          recipientId,
          sender: senderId,
          read: false,
        })
      })

      const other = t.withIdentity({ tokenIdentifier: "other_id" })
      await expect(
        other.mutation(api.notifications.deleteNotification, {
          notificationId: notifId,
        })
      ).rejects.toThrow("Unauthorized")
    })
  })

  describe("getUnreadCounts", () => {
    it("should count unread notifications", async () => {
      const t = convexTest(schema)

      const senderId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Sender",
          tokenIdentifier: "sender_id",
          accountType: "USER",
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

      // Create 2 unread and 1 read notification
      await t.run(async (ctx) => {
        await ctx.db.insert("notifications", {
          type: "like",
          recipientId,
          sender: senderId,
          read: false,
        })
        await ctx.db.insert("notifications", {
          type: "comment",
          recipientId,
          sender: senderId,
          read: false,
        })
        await ctx.db.insert("notifications", {
          type: "newPost",
          recipientId,
          sender: senderId,
          read: true,
        })
      })

      const recipient = t.withIdentity({ tokenIdentifier: "recipient_id" })
      const counts = await recipient.query(api.notifications.getUnreadCounts)

      expect(counts.unreadNotificationsCount).toBe(2)
    })
  })
})
