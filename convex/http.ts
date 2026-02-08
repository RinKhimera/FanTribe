"use server"

import type { WebhookEvent } from "@clerk/backend"
import { httpRouter } from "convex/server"
import { Webhook } from "svix"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"
import {
  createVideoRecord,
  deleteFromBunny,
  deleteVideoFromBunny,
  extractVideoGuidFromUrl,
  generateStoragePath,
  getExtensionFromMimeType,
  getMultipleVideos,
  getOrCreateUserCollection,
  getStreamAccessKey,
  getStreamLibraryId,
  getEmbedUrl,
  uploadToBunny,
  validateMediaFile,
} from "./lib/bunny"

const http = httpRouter()

http.route({
  path: "/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request)
    if (!event) {
      return new Response("Error occured while calling webhook", {
        status: 400,
      })
    }
    switch (event.type) {
      case "user.created":
        await ctx.runMutation(internal.users.createUser, {
          externalId: event.data.id,
          tokenIdentifier: `${process.env.CLERK_APP_DOMAIN}|${event.data.id}`,
          name: `${event.data.first_name ?? "Guest"} ${event.data.last_name ?? ""}`,
          email: event.data.email_addresses[0]?.email_address,
          image: event.data.image_url,
        })
        break

      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        })
        break

      case "user.deleted": {
        const clerkUserId = event.data.id!
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId })
        break
      }

      case "session.created": {
        const userId = event.data.user_id
        if (userId) {
          await ctx.runMutation(internal.users.incrementUserSession, {
            externalId: userId,
          })
        }
        break
      }

      case "session.ended":
      case "session.removed":
      case "session.revoked": {
        const userId = event.data.user_id
        if (userId) {
          await ctx.runMutation(internal.users.decrementUserSession, {
            externalId: userId,
          })
        }
        break
      }

      default:
        console.log("Ignored Clerk webhook event", event.type)
    }

    return new Response(null, { status: 200 })
  }),
})

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text()
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  }
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent
  } catch (error) {
    console.error("Error verifying webhook event", error)
    return null
  }
}

// ============================================================================
// BUNNY CDN - CORS & Helpers
// ============================================================================

const ALLOWED_ORIGINS = [
  "https://fantribe.app",
  "https://www.fantribe.app",
  "http://localhost:3000",
]

const getCorsHeaders = (request?: Request) => {
  const origin = request?.headers.get("Origin") ?? ""
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

const jsonResponse = (data: object, status: number = 200, request?: Request) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(request),
    },
  })

// ============================================================================
// BUNNY CDN - Upload Image
// ============================================================================

http.route({
  path: "/api/bunny/upload-image",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }),
})

http.route({
  path: "/api/bunny/upload-image",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return jsonResponse({ error: "Non authentifie" }, 401, request)
    }

    try {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      const fileName = formData.get("fileName") as string | null

      if (!file) {
        return jsonResponse({ error: "Fichier manquant" }, 400, request)
      }

      // Valider le fichier
      const validationError = validateMediaFile(file.type, file.size, "image")
      if (validationError) {
        return jsonResponse({ error: validationError }, 400, request)
      }

      // Generer le chemin de stockage
      const extension = getExtensionFromMimeType(file.type)
      const storagePath = fileName || generateStoragePath(identity.subject, extension)

      // Upload vers Bunny Storage
      const fileBuffer = await file.arrayBuffer()
      const result = await uploadToBunny(fileBuffer, storagePath)

      if (!result.success) {
        return jsonResponse({ error: result.error }, 500, request)
      }

      return jsonResponse(
        {
          success: true,
          url: result.url,
          mediaId: result.storagePath,
          type: "image" as const,
        },
        200,
        request,
      )
    } catch (error) {
      console.error("Image upload error:", error)
      return jsonResponse({ error: "Erreur lors de l'upload" }, 500, request)
    }
  }),
})

// ============================================================================
// BUNNY CDN - Upload Video (retourne un token pour upload direct)
// ============================================================================

http.route({
  path: "/api/bunny/upload-video",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }),
})

http.route({
  path: "/api/bunny/upload-video",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return jsonResponse({ error: "Non authentifie" }, 401, request)
    }

    try {
      const body = await request.json()
      const { fileName, userId } = body as { fileName?: string; userId?: string }

      if (!fileName || !userId) {
        return jsonResponse(
          { error: "fileName et userId requis" },
          400,
          request,
        )
      }

      // Obtenir ou creer la collection utilisateur
      const collectionId = await getOrCreateUserCollection(userId)

      // Creer l'enregistrement video dans Bunny Stream
      const randomSuffix = Math.random().toString(36).substring(2, 15)
      const videoTitle = `${randomSuffix}_${fileName}`
      const videoRecord = await createVideoRecord(videoTitle, collectionId)

      // Retourner les infos pour upload direct depuis le client
      return jsonResponse(
        {
          success: true,
          videoId: videoRecord.guid,
          accessKey: getStreamAccessKey(),
          libraryId: getStreamLibraryId(),
          embedUrl: getEmbedUrl(videoRecord.guid),
        },
        200,
        request,
      )
    } catch (error) {
      console.error("Video upload token error:", error)
      return jsonResponse(
        { error: "Erreur lors de la creation de la video" },
        500,
        request,
      )
    }
  }),
})

// ============================================================================
// BUNNY CDN - Delete
// ============================================================================

http.route({
  path: "/api/bunny/delete",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }),
})

http.route({
  path: "/api/bunny/delete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return jsonResponse({ error: "Non authentifie" }, 401, request)
    }

    try {
      const body = await request.json()
      const { mediaId, type, mediaUrl } = body as {
        mediaId?: string
        type?: "image" | "video"
        mediaUrl?: string
      }

      if (!type) {
        return jsonResponse({ error: "type requis" }, 400, request)
      }

      let success = false

      if (type === "video") {
        // Extraire le GUID si on recoit une URL
        const videoId = mediaUrl
          ? extractVideoGuidFromUrl(mediaUrl)
          : mediaId

        if (!videoId) {
          return jsonResponse({ error: "mediaId ou mediaUrl requis pour video" }, 400, request)
        }

        success = await deleteVideoFromBunny(videoId)
      } else {
        // Pour les images, extraire le path depuis l'URL si necessaire
        let storagePath = mediaId

        if (!storagePath && mediaUrl) {
          const match = mediaUrl.match(/https:\/\/[^/]+\/(.+)/)
          storagePath = match ? match[1] : undefined
        }

        if (!storagePath) {
          return jsonResponse({ error: "mediaId ou mediaUrl requis pour image" }, 400, request)
        }

        success = await deleteFromBunny(storagePath)
      }

      return jsonResponse({ success }, success ? 200 : 500, request)
    } catch (error) {
      console.error("Delete error:", error)
      return jsonResponse({ error: "Erreur lors de la suppression" }, 500, request)
    }
  }),
})

// ============================================================================
// BUNNY CDN - Video Metadata
// ============================================================================

http.route({
  path: "/api/bunny/metadata",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }),
})

http.route({
  path: "/api/bunny/metadata",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return jsonResponse({ error: "Non authentifie" }, 401, request)
    }

    try {
      const body = await request.json()
      const { videoGuids } = body as { videoGuids?: string[] }

      if (!videoGuids || !Array.isArray(videoGuids) || videoGuids.length === 0) {
        return jsonResponse({ error: "videoGuids array requis" }, 400, request)
      }

      const metadata = await getMultipleVideos(videoGuids)

      return jsonResponse({ success: true, data: metadata }, 200, request)
    } catch (error) {
      console.error("Metadata error:", error)
      return jsonResponse(
        { error: "Erreur lors de la recuperation des metadonnees" },
        500,
        request,
      )
    }
  }),
})

export default http
