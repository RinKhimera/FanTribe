import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { ActionCtx } from "./_generated/server"
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server"
import { getAuthenticatedUser } from "./lib/auth"
import {
  generateMerchantTransactionId,
  initPayment,
  loginAndGetAccessToken,
} from "./lib/cinetpay"
import { createAppError } from "./lib/errors"
import { SUBSCRIPTION_PRICE_XAF } from "./lib/constants"

// ============================================================================
// Access token cache (singleton row in cinetpayAuthCache)
// ============================================================================

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000

export const getCachedAccessToken = internalQuery({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const row = await ctx.db.query("cinetpayAuthCache").order("desc").first()
    if (!row) return null
    if (row.expiresAt - TOKEN_REFRESH_BUFFER_MS <= Date.now()) return null
    return row.accessToken
  },
})

export const cacheAccessToken = internalMutation({
  args: {
    accessToken: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const old = await ctx.db.query("cinetpayAuthCache").take(50)
    for (const row of old) {
      await ctx.db.delete(row._id)
    }
    await ctx.db.insert("cinetpayAuthCache", {
      accessToken: args.accessToken,
      expiresAt: args.expiresAt,
    })
    return null
  },
})

const ensureAccessToken = async (ctx: ActionCtx): Promise<string> => {
  const cached = await ctx.runQuery(internal.cinetpay.getCachedAccessToken, {})
  if (cached) return cached

  const baseUrl = process.env.CINETPAY_BASE_URL
  const apiKey = process.env.CINETPAY_API_KEY
  const apiPassword = process.env.CINETPAY_SECRET_KEY
  if (!baseUrl || !apiKey || !apiPassword) {
    throw createAppError("EXTERNAL_SERVICE_ERROR", {
      message: "CinetPay env vars missing in Convex dashboard",
    })
  }

  const login = await loginAndGetAccessToken(baseUrl, apiKey, apiPassword)
  const expiresAt = Date.now() + login.expires_in * 1000
  await ctx.runMutation(internal.cinetpay.cacheAccessToken, {
    accessToken: login.access_token,
    expiresAt,
  })
  return login.access_token
}

// ============================================================================
// Pending payment lifecycle (internal mutations)
// ============================================================================

export const createPending = internalMutation({
  args: {
    merchantTransactionId: v.string(),
    subscriberId: v.id("users"),
    creatorId: v.id("users"),
    amount: v.number(),
    intent: v.union(v.literal("subscribe"), v.literal("renew")),
  },
  returns: v.id("cinetpayPayments"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("cinetpayPayments", {
      merchantTransactionId: args.merchantTransactionId,
      paymentToken: "",
      notifyToken: "",
      subscriberId: args.subscriberId,
      creatorId: args.creatorId,
      amount: args.amount,
      currency: "XAF",
      intent: args.intent,
      status: "pending",
    })
  },
})

export const attachTokens = internalMutation({
  args: {
    paymentId: v.id("cinetpayPayments"),
    paymentToken: v.string(),
    notifyToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      paymentToken: args.paymentToken,
      notifyToken: args.notifyToken,
    })
    return null
  },
})

export const markSucceeded = internalMutation({
  args: {
    paymentId: v.id("cinetpayPayments"),
    cinetpayTransactionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      status: "succeeded",
      cinetpayTransactionId: args.cinetpayTransactionId,
    })
    return null
  },
})

export const markFailed = internalMutation({
  args: { paymentId: v.id("cinetpayPayments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, { status: "failed" })
    return null
  },
})

export const getByMerchantTransactionId = internalQuery({
  args: { merchantTransactionId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("cinetpayPayments"),
      _creationTime: v.number(),
      merchantTransactionId: v.string(),
      paymentToken: v.string(),
      notifyToken: v.string(),
      subscriberId: v.id("users"),
      creatorId: v.id("users"),
      amount: v.number(),
      currency: v.literal("XAF"),
      intent: v.union(v.literal("subscribe"), v.literal("renew")),
      status: v.union(
        v.literal("pending"),
        v.literal("succeeded"),
        v.literal("failed"),
      ),
      cinetpayTransactionId: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cinetpayPayments")
      .withIndex("by_merchantTransactionId", (q) =>
        q.eq("merchantTransactionId", args.merchantTransactionId),
      )
      .first()
  },
})

// ============================================================================
// Public action: initiate a subscription payment
// ============================================================================

export const initiateSubscription = action({
  args: { creatorId: v.id("users") },
  returns: v.object({
    paymentUrl: v.string(),
    merchantTransactionId: v.string(),
  }),
  handler: async (ctx, args): Promise<{ paymentUrl: string; merchantTransactionId: string }> => {
    const user = await ctx.runQuery(internal.cinetpay.getActionUser, {})
    if (!user) {
      throw createAppError("NOT_AUTHENTICATED")
    }
    if (user._id === args.creatorId) {
      throw createAppError("INVALID_INPUT", {
        userMessage: "Vous ne pouvez pas vous abonner à vous-même",
      })
    }

    const creator = await ctx.runQuery(internal.cinetpay.getCreatorPublic, {
      creatorId: args.creatorId,
    })
    if (
      !creator ||
      (creator.accountType !== "CREATOR" && creator.accountType !== "SUPERUSER")
    ) {
      throw createAppError("USER_NOT_FOUND", {
        userMessage: "Ce créateur est introuvable",
      })
    }

    const existingSub = await ctx.runQuery(
      internal.cinetpay.findExistingSubscription,
      { creatorId: args.creatorId, subscriberId: user._id },
    )
    if (existingSub && existingSub.status === "active") {
      throw createAppError("ALREADY_EXISTS", {
        userMessage: "Vous êtes déjà abonné à ce créateur",
      })
    }
    const intent: "subscribe" | "renew" = existingSub ? "renew" : "subscribe"

    const merchantTransactionId = generateMerchantTransactionId()

    const paymentId = await ctx.runMutation(internal.cinetpay.createPending, {
      merchantTransactionId,
      subscriberId: user._id,
      creatorId: args.creatorId,
      amount: SUBSCRIPTION_PRICE_XAF,
      intent,
    })

    const accessToken = await ensureAccessToken(ctx)

    const convexSiteUrl = process.env.CONVEX_SITE_URL
    const appUrl = process.env.APP_URL
    const baseUrl = process.env.CINETPAY_BASE_URL
    if (!convexSiteUrl || !appUrl || !baseUrl) {
      throw createAppError("EXTERNAL_SERVICE_ERROR", {
        message: "Missing CONVEX_SITE_URL / APP_URL / CINETPAY_BASE_URL",
      })
    }

    const [firstName, ...lastParts] = (user.name ?? "FanTribe User").split(" ")
    const lastName = lastParts.join(" ") || "User"

    const init = await initPayment({
      accessToken,
      baseUrl,
      merchantTransactionId,
      amount: SUBSCRIPTION_PRICE_XAF,
      currency: "XAF",
      designation:
        intent === "renew"
          ? `Renouvellement abonnement ${creator.username ?? creator.name}`
          : `Abonnement ${creator.username ?? creator.name}`,
      clientEmail: user.email,
      clientFirstName: firstName || "FanTribe",
      clientLastName: lastName,
      successUrl: `${appUrl}/payment/result?provider=cinetpay&mtx=${merchantTransactionId}&status=success&username=${encodeURIComponent(creator.username ?? "")}`,
      failedUrl: `${appUrl}/payment/result?provider=cinetpay&mtx=${merchantTransactionId}&status=failed&reason=payment_failed`,
      notifyUrl: `${convexSiteUrl}/cinetpay/webhook`,
    })

    await ctx.runMutation(internal.cinetpay.attachTokens, {
      paymentId,
      paymentToken: init.payment_token,
      notifyToken: init.notify_token,
    })

    return {
      paymentUrl: init.payment_url,
      merchantTransactionId,
    }
  },
})

// ============================================================================
// Internal helpers used by the action (so the action stays in default runtime)
// ============================================================================

export const getActionUser = internalQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first()
    if (!user) return null
    return { _id: user._id, name: user.name, email: user.email }
  },
})

export const getCreatorPublic = internalQuery({
  args: { creatorId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      username: v.optional(v.string()),
      accountType: v.union(
        v.literal("USER"),
        v.literal("CREATOR"),
        v.literal("SUPERUSER"),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId)
    if (!creator) return null
    return {
      _id: creator._id,
      name: creator.name,
      username: creator.username,
      accountType: creator.accountType,
    }
  },
})

export const findExistingSubscription = internalQuery({
  args: {
    creatorId: v.id("users"),
    subscriberId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("subscriptions"),
      status: v.union(
        v.literal("active"),
        v.literal("pending"),
        v.literal("expired"),
        v.literal("canceled"),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator_subscriber", (q) =>
        q.eq("creator", args.creatorId).eq("subscriber", args.subscriberId),
      )
      .filter((q) => q.eq(q.field("type"), "content_access"))
      .first()
    if (!sub) return null
    return { _id: sub._id, status: sub.status }
  },
})

// ============================================================================
// Public query: status polled by /payment/result page
// ============================================================================

export const getStatusByMtx = query({
  args: { merchantTransactionId: v.string() },
  returns: v.union(
    v.object({ found: v.literal(false) }),
    v.object({
      found: v.literal(true),
      status: v.union(
        v.literal("pending"),
        v.literal("succeeded"),
        v.literal("failed"),
      ),
      cinetpayTransactionId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const row = await ctx.db
      .query("cinetpayPayments")
      .withIndex("by_merchantTransactionId", (q) =>
        q.eq("merchantTransactionId", args.merchantTransactionId),
      )
      .first()
    if (!row) return { found: false as const }
    if (row.subscriberId !== user._id) {
      throw createAppError("FORBIDDEN")
    }
    return {
      found: true as const,
      status: row.status,
      cinetpayTransactionId: row.cinetpayTransactionId,
    }
  },
})
