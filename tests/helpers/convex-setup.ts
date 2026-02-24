/**
 * Shared setup helpers for Convex tests.
 * Reduces boilerplate by wrapping common DB insertions.
 *
 * Usage inside t.run():
 *   const userId = await insertUser(ctx)
 *   const creatorId = await insertCreator(ctx, { name: "Alice" })
 *   const subId = await insertSubscription(ctx, { creator: creatorId, subscriber: userId })
 */

import { GenericMutationCtx } from "convex/server"
import { Id } from "../../convex/_generated/dataModel"
import type { DataModel } from "../../convex/_generated/dataModel"

type Ctx = GenericMutationCtx<DataModel>

// ============================================================================
// Users
// ============================================================================

export const insertUser = async (
  ctx: Ctx,
  overrides: Record<string, unknown> = {},
): Promise<Id<"users">> =>
  ctx.db.insert("users", {
    name: "Test User",
    tokenIdentifier: "test_user_id",
    accountType: "USER" as const,
    email: "user@test.com",
    externalId: "ext_user",
    image: "https://test.com/image.png",
    isOnline: true,
    ...overrides,
  })

export const insertCreator = async (
  ctx: Ctx,
  overrides: Record<string, unknown> = {},
): Promise<Id<"users">> =>
  ctx.db.insert("users", {
    name: "Test Creator",
    tokenIdentifier: "test_creator_id",
    accountType: "CREATOR" as const,
    email: "creator@test.com",
    externalId: "ext_creator",
    image: "https://test.com/image.png",
    isOnline: true,
    ...overrides,
  })

export const insertSuperuser = async (
  ctx: Ctx,
  overrides: Record<string, unknown> = {},
): Promise<Id<"users">> =>
  ctx.db.insert("users", {
    name: "Test Admin",
    tokenIdentifier: "test_admin_id",
    accountType: "SUPERUSER" as const,
    email: "admin@test.com",
    externalId: "ext_admin",
    image: "https://test.com/image.png",
    isOnline: true,
    ...overrides,
  })

// ============================================================================
// Content
// ============================================================================

export const insertPost = async (
  ctx: Ctx,
  opts: {
    author: Id<"users">
    content?: string
    visibility?: "public" | "subscribers_only"
    medias?: Array<Record<string, unknown>>
  },
): Promise<Id<"posts">> =>
  ctx.db.insert("posts", {
    author: opts.author,
    content: opts.content ?? "Test post content",
    medias: (opts.medias ?? []) as never,
    visibility: opts.visibility ?? "public",
  })

// ============================================================================
// Subscriptions
// ============================================================================

export const insertSubscription = async (
  ctx: Ctx,
  opts: {
    creator: Id<"users">
    subscriber: Id<"users">
    type?: "content_access" | "messaging_access"
    status?: "active" | "expired" | "canceled" | "pending"
    endDate?: number
  },
): Promise<Id<"subscriptions">> =>
  ctx.db.insert("subscriptions", {
    creator: opts.creator,
    subscriber: opts.subscriber,
    status: opts.status ?? "active",
    type: opts.type ?? "content_access",
    startDate: Date.now(),
    endDate: opts.endDate ?? Date.now() + 30 * 24 * 60 * 60 * 1000,
    amountPaid: 1000,
    currency: "XAF",
    renewalCount: 0,
    lastUpdateTime: Date.now(),
  })

// ============================================================================
// Conversations
// ============================================================================

export const insertConversation = async (
  ctx: Ctx,
  opts: {
    creatorId: Id<"users">
    userId: Id<"users">
    isLocked?: boolean
  },
): Promise<Id<"conversations">> =>
  ctx.db.insert("conversations", {
    creatorId: opts.creatorId,
    userId: opts.userId,
    unreadCountCreator: 0,
    unreadCountUser: 0,
    isLocked: opts.isLocked ?? false,
    lastMessageAt: Date.now(),
  })
