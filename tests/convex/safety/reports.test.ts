import { convexTest } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, it } from "vitest"
import { api } from "../../../convex/_generated/api"
import schema from "../../../convex/schema"

describe("reports", () => {
  const modules = import.meta.glob("../../../convex/**/*.ts")

  describe("createReport", () => {
    it("should create a user report", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const targetId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporter = t.withIdentity({ tokenIdentifier: "reporter_id" })
      const result = await reporter.mutation(api.reports.createReport, {
        reportedUserId: targetId,
        type: "user",
        reason: "spam",
        description: "This user is spamming",
      })

      expect(result.success).toBe(true)

      const reports = await t.run(async (ctx) => {
        return await ctx.db.query("reports").collect()
      })

      expect(reports).toHaveLength(1)
      expect(reports[0].reporterId).toBe(reporterId)
      expect(reports[0].reportedUserId).toBe(targetId)
      expect(reports[0].type).toBe("user")
      expect(reports[0].reason).toBe("spam")
      expect(reports[0].status).toBe("pending")
    })

    it("should create a post report", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      // Reporter user must exist in DB for authentication
      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: creatorId,
          content: "Inappropriate content",
          visibility: "public",
          medias: [],
        })
      })

      const reporter = t.withIdentity({ tokenIdentifier: "reporter_id" })
      const result = await reporter.mutation(api.reports.createReport, {
        reportedPostId: postId,
        type: "post",
        reason: "inappropriate_content",
      })

      expect(result.success).toBe(true)

      const reports = await t.run(async (ctx) => {
        return await ctx.db.query("reports").collect()
      })

      expect(reports).toHaveLength(1)
      expect(reports[0].reportedPostId).toBe(postId)
      expect(reports[0].type).toBe("post")
    })

    it("should create a comment report", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      // Reporter user must exist in DB for authentication
      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: creatorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: creatorId,
          post: postId,
          content: "Harassing comment",
        })
      })

      const reporter = t.withIdentity({ tokenIdentifier: "reporter_id" })
      const result = await reporter.mutation(api.reports.createReport, {
        reportedCommentId: commentId,
        type: "comment",
        reason: "harassment",
      })

      expect(result.success).toBe(true)

      const reports = await t.run(async (ctx) => {
        return await ctx.db.query("reports").collect()
      })

      expect(reports).toHaveLength(1)
      expect(reports[0].reportedCommentId).toBe(commentId)
      expect(reports[0].type).toBe("comment")
    })

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      const targetId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await expect(
        t.mutation(api.reports.createReport, {
          reportedUserId: targetId,
          type: "user",
          reason: "spam",
        }),
      ).rejects.toThrow("Unauthorized")
    })

    it("should reject self-reporting", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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

      const user = t.withIdentity({ tokenIdentifier: "user_id" })

      await expect(
        user.mutation(api.reports.createReport, {
          reportedUserId: userId,
          type: "user",
          reason: "spam",
        }),
      ).rejects.toThrow("Cannot report yourself")
    })

    it("should reject reporting own post", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: userId,
          content: "My post",
          visibility: "public",
          medias: [],
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })

      await expect(
        user.mutation(api.reports.createReport, {
          reportedPostId: postId,
          type: "post",
          reason: "spam",
        }),
      ).rejects.toThrow("Cannot report your own post")
    })

    it("should reject reporting own comment", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: userId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: userId,
          post: postId,
          content: "My comment",
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })

      await expect(
        user.mutation(api.reports.createReport, {
          reportedCommentId: commentId,
          type: "comment",
          reason: "spam",
        }),
      ).rejects.toThrow("Cannot report your own comment")
    })

    it("should require at least one target", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporter = t.withIdentity({ tokenIdentifier: "reporter_id" })

      await expect(
        reporter.mutation(api.reports.createReport, {
          type: "user",
          reason: "spam",
        }),
      ).rejects.toThrow("Must report either a user, a post, or a comment")
    })
  })

  describe("getAllReports", () => {
    it("should return all reports for SUPERUSER", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      // Admin user must exist in DB for authentication
      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const targetId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("reports", {
          reporterId,
          reportedUserId: targetId,
          type: "user",
          reason: "spam",
          status: "pending",
          createdAt: Date.now(),
        })
        await ctx.db.insert("reports", {
          reporterId,
          reportedUserId: targetId,
          type: "user",
          reason: "harassment",
          status: "pending",
          createdAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const reports = await admin.query(api.reports.getAllReports, {})

      expect(reports).toHaveLength(2)
      expect(reports[0].reporter).toBeDefined()
      expect(reports[0].reportedUser).toBeDefined()
    })

    it("should reject non-SUPERUSER users", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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

      await expect(user.query(api.reports.getAllReports, {})).rejects.toThrow(
        "Unauthorized",
      )
    })

    it("should include enriched data for post reports", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: creatorId,
          content: "Reported post",
          visibility: "public",
          medias: [],
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert("reports", {
          reporterId,
          reportedPostId: postId,
          type: "post",
          reason: "inappropriate_content",
          status: "pending",
          createdAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const reports = await admin.query(api.reports.getAllReports, {})

      expect(reports).toHaveLength(1)
      expect(reports[0].reportedPost).toBeDefined()
      expect(reports[0].reportedPost?.content).toBe("Reported post")
      expect(reports[0].reportedPost?.author).toBeDefined()
    })
  })

  describe("updateReportStatus", () => {
    it("should update status to resolved with dismissed action", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      const adminId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const targetId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reportId = await t.run(async (ctx) => {
        return await ctx.db.insert("reports", {
          reporterId,
          reportedUserId: targetId,
          type: "user",
          reason: "spam",
          status: "pending",
          createdAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.mutation(api.reports.updateReportStatus, {
        reportId,
        status: "resolved",
        resolutionAction: "dismissed",
      })

      expect(result.success).toBe(true)

      const report = await t.run(async (ctx) => {
        return await ctx.db.get(reportId)
      })

      expect(report?.status).toBe("resolved")
      expect(report?.resolutionAction).toBe("dismissed")
      expect(report?.reviewedBy).toBe(adminId)
      expect(report?.reviewedAt).toBeDefined()
    })

    it("should update status to resolved with admin notes", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      // Admin user must exist in DB for authentication
      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const targetId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reportId = await t.run(async (ctx) => {
        return await ctx.db.insert("reports", {
          reporterId,
          reportedUserId: targetId,
          type: "user",
          reason: "spam",
          status: "reviewing",
          createdAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      await admin.mutation(api.reports.updateReportStatus, {
        reportId,
        status: "resolved",
        adminNotes: "Warning issued to user",
      })

      const report = await t.run(async (ctx) => {
        return await ctx.db.get(reportId)
      })

      expect(report?.status).toBe("resolved")
      expect(report?.adminNotes).toBe("Warning issued to user")
    })

    it("should reject non-SUPERUSER users", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const targetId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reportId = await t.run(async (ctx) => {
        return await ctx.db.insert("reports", {
          reporterId,
          reportedUserId: targetId,
          type: "user",
          reason: "spam",
          status: "pending",
          createdAt: Date.now(),
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })

      await expect(
        user.mutation(api.reports.updateReportStatus, {
          reportId,
          status: "resolved",
        }),
      ).rejects.toThrow("Unauthorized")
    })
  })

  describe("getReportsStats", () => {
    it("should return correct counts by status and type", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const targetId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Target",
          tokenIdentifier: "target_id",
          accountType: "USER",
          email: "target@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: creatorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      await t.run(async (ctx) => {
        // 2 pending user reports
        await ctx.db.insert("reports", {
          reporterId,
          reportedUserId: targetId,
          type: "user",
          reason: "spam",
          status: "pending",
          createdAt: Date.now(),
        })
        await ctx.db.insert("reports", {
          reporterId,
          reportedUserId: targetId,
          type: "user",
          reason: "harassment",
          status: "pending",
          createdAt: Date.now(),
        })
        // 1 resolved post report
        await ctx.db.insert("reports", {
          reporterId,
          reportedPostId: postId,
          type: "post",
          reason: "inappropriate_content",
          status: "resolved",
          createdAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const stats = await admin.query(api.reports.getReportsStats, {})

      expect(stats.total).toBe(3)
      expect(stats.pending).toBe(2)
      expect(stats.resolved).toBe(1)
      expect(stats.userReports).toBe(2)
      expect(stats.postReports).toBe(1)
    })

    it("should reject non-SUPERUSER users", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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

      await expect(user.query(api.reports.getReportsStats, {})).rejects.toThrow(
        "Unauthorized",
      )
    })
  })

  describe("deleteReportedContentAndResolve", () => {
    it("should delete reported post and resolve report", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: creatorId,
          content: "Inappropriate post",
          visibility: "public",
          medias: [],
        })
      })

      const reportId = await t.run(async (ctx) => {
        return await ctx.db.insert("reports", {
          reporterId,
          reportedPostId: postId,
          type: "post",
          reason: "inappropriate_content",
          status: "reviewing",
          createdAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.mutation(
        api.reports.deleteReportedContentAndResolve,
        {
          reportId,
          adminNotes: "Content removed for policy violation",
        },
      )

      expect(result.success).toBe(true)

      // Check report is resolved
      const report = await t.run(async (ctx) => {
        return await ctx.db.get(reportId)
      })
      expect(report?.status).toBe("resolved")

      // Check post is deleted
      const post = await t.run(async (ctx) => {
        return await ctx.db.get(postId)
      })
      expect(post).toBeNull()
    })

    it("should delete post comments, likes, bookmarks, and notifications", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: creatorId,
          content: "Post to delete",
          visibility: "public",
          medias: [],
        })
      })

      // Add related content
      await t.run(async (ctx) => {
        await ctx.db.insert("comments", {
          author: reporterId,
          post: postId,
          content: "A comment",
        })
        await ctx.db.insert("likes", {
          postId,
          userId: reporterId,
        })
        await ctx.db.insert("bookmarks", {
          postId,
          userId: reporterId,
        })
        await ctx.db.insert("notifications", {
          recipientId: creatorId,
          type: "like",
          groupKey: `like:${postId}`,
          actorIds: [reporterId],
          actorCount: 1,
          postId,
          isRead: false,
          lastActivityAt: Date.now(),
        })
      })

      const reportId = await t.run(async (ctx) => {
        return await ctx.db.insert("reports", {
          reporterId,
          reportedPostId: postId,
          type: "post",
          reason: "inappropriate_content",
          status: "reviewing",
          createdAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      await admin.mutation(api.reports.deleteReportedContentAndResolve, {
        reportId,
      })

      // Check all related content is deleted
      const comments = await t.run(async (ctx) => {
        return await ctx.db.query("comments").collect()
      })
      const likes = await t.run(async (ctx) => {
        return await ctx.db.query("likes").collect()
      })
      const bookmarks = await t.run(async (ctx) => {
        return await ctx.db.query("bookmarks").collect()
      })
      const notifications = await t.run(async (ctx) => {
        return await ctx.db.query("notifications").collect()
      })

      expect(comments).toHaveLength(0)
      expect(likes).toHaveLength(0)
      expect(bookmarks).toHaveLength(0)
      expect(notifications).toHaveLength(0)
    })

    it("should delete reported comment and resolve report", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

      await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin",
          tokenIdentifier: "admin_id",
          accountType: "SUPERUSER",
          email: "admin@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: creatorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const commentId = await t.run(async (ctx) => {
        return await ctx.db.insert("comments", {
          author: creatorId,
          post: postId,
          content: "Harassing comment",
        })
      })

      const reportId = await t.run(async (ctx) => {
        return await ctx.db.insert("reports", {
          reporterId,
          reportedCommentId: commentId,
          type: "comment",
          reason: "harassment",
          status: "reviewing",
          createdAt: Date.now(),
        })
      })

      const admin = t.withIdentity({ tokenIdentifier: "admin_id" })
      const result = await admin.mutation(
        api.reports.deleteReportedContentAndResolve,
        {
          reportId,
        },
      )

      expect(result.success).toBe(true)

      // Check comment is deleted
      const comment = await t.run(async (ctx) => {
        return await ctx.db.get(commentId)
      })
      expect(comment).toBeNull()

      // Check post still exists
      const post = await t.run(async (ctx) => {
        return await ctx.db.get(postId)
      })
      expect(post).not.toBeNull()
    })

    it("should reject non-SUPERUSER users", async () => {
      const t = convexTest(schema, modules)
      registerRateLimiter(t)

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

      const reporterId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Reporter",
          tokenIdentifier: "reporter_id",
          accountType: "USER",
          email: "reporter@test.com",
          image: "https://test.com/image.png",
          isOnline: true,
        })
      })

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

      const postId = await t.run(async (ctx) => {
        return await ctx.db.insert("posts", {
          author: creatorId,
          content: "A post",
          visibility: "public",
          medias: [],
        })
      })

      const reportId = await t.run(async (ctx) => {
        return await ctx.db.insert("reports", {
          reporterId,
          reportedPostId: postId,
          type: "post",
          reason: "spam",
          status: "reviewing",
          createdAt: Date.now(),
        })
      })

      const user = t.withIdentity({ tokenIdentifier: "user_id" })

      await expect(
        user.mutation(api.reports.deleteReportedContentAndResolve, {
          reportId,
        }),
      ).rejects.toThrow("Unauthorized")
    })
  })
})
