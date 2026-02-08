/**
 * Bunny CDN - Module centralise pour Convex
 *
 * Gere toutes les interactions avec Bunny CDN :
 * - Storage (images) : upload, delete
 * - Stream (videos) : create, delete, metadata, collections
 * - Optimizer : helpers d'URL pour images optimisees
 *
 * Variables d'environnement Convex necessaires :
 * - BUNNY_STORAGE_ZONE : Nom de la Storage Zone
 * - BUNNY_STORAGE_PASSWORD : Mot de passe de la Storage Zone (AccessKey)
 * - BUNNY_CDN_HOSTNAME : Hostname de la Pull Zone (ex: "fantribe-media.b-cdn.net")
 * - BUNNY_STREAM_LIBRARY_ID : ID de la bibliotheque Stream
 * - BUNNY_STREAM_API_KEY : Cle API Stream
 * - BUNNY_URL_TOKEN_KEY : (optionnel) Cle pour les signed URLs
 */

// ============================================================================
// TYPES
// ============================================================================

export type BunnyUploadResult = {
  success: true
  url: string
  storagePath: string
}

export type BunnyUploadError = {
  success: false
  error: string
}

export type BunnyResult = BunnyUploadResult | BunnyUploadError

export type ImageOptimizationParams = {
  width?: number
  height?: number
  quality?: number
  crop?: "fit" | "fill" | "scale"
}

export type BunnyVideoRecord = {
  guid: string
  title: string
  status: number
  libraryId: string
}

export type BunnyVideoMetadata = {
  videoLibraryId: number
  guid: string
  title: string
  dateUploaded: string
  views: number
  isPublic: boolean
  length: number
  status: number
  framerate: number
  width: number
  height: number
  availableResolutions: string
  thumbnailCount: number
  encodeProgress: number
  storageSize: number
  thumbnailFileName: string
  collectionId: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const getStorageConfig = () => {
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const storagePassword = process.env.BUNNY_STORAGE_PASSWORD
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME

  if (!storageZone || !storagePassword || !cdnHostname) {
    throw new Error(
      "Configuration Bunny Storage manquante. Verifiez BUNNY_STORAGE_ZONE, BUNNY_STORAGE_PASSWORD et BUNNY_CDN_HOSTNAME dans le dashboard Convex.",
    )
  }

  return { storageZone, storagePassword, cdnHostname }
}

const getStreamConfig = () => {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID
  const apiKey = process.env.BUNNY_STREAM_API_KEY

  if (!libraryId || !apiKey) {
    throw new Error(
      "Configuration Bunny Stream manquante. Verifiez BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY dans le dashboard Convex.",
    )
  }

  return { libraryId, apiKey }
}

// ============================================================================
// STORAGE - Upload / Delete images
// ============================================================================

/**
 * Upload un fichier vers Bunny Storage.
 */
export const uploadToBunny = async (
  fileData: ArrayBuffer | Uint8Array,
  storagePath: string,
): Promise<BunnyResult> => {
  const config = getStorageConfig()

  const bodyData =
    fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData)

  try {
    const response = await fetch(
      `https://storage.bunnycdn.com/${config.storageZone}/${storagePath}`,
      {
        method: "PUT",
        headers: {
          AccessKey: config.storagePassword,
          "Content-Type": "application/octet-stream",
        },
        body: bodyData as unknown as BodyInit,
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Bunny upload failed: ${response.status} - ${errorText}`)

      if (response.status === 401) {
        return {
          success: false,
          error: "Authentification Bunny echouee. Verifiez l'API key.",
        }
      }

      return {
        success: false,
        error: `Echec de l'upload: ${response.status}`,
      }
    }

    const cdnUrl = `https://${config.cdnHostname}/${storagePath}`

    return { success: true, url: cdnUrl, storagePath }
  } catch (error) {
    console.error("Bunny upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur reseau",
    }
  }
}

/**
 * Supprime un fichier de Bunny Storage.
 */
export const deleteFromBunny = async (
  storagePath: string,
): Promise<boolean> => {
  const config = getStorageConfig()

  try {
    const response = await fetch(
      `https://storage.bunnycdn.com/${config.storageZone}/${storagePath}`,
      {
        method: "DELETE",
        headers: { AccessKey: config.storagePassword },
      },
    )

    if (!response.ok && response.status !== 404) {
      console.error(`Bunny delete failed: ${response.status}`)
      return false
    }

    // 200 = deleted, 404 = already deleted (both OK)
    return true
  } catch (error) {
    console.error("Bunny delete error:", error)
    return false
  }
}

// ============================================================================
// STREAM - Video management
// ============================================================================

/**
 * Cree un enregistrement video dans Bunny Stream.
 * Retourne le guid et les infos necessaires pour l'upload direct depuis le client.
 */
export const createVideoRecord = async (
  title: string,
  collectionId?: string,
): Promise<BunnyVideoRecord> => {
  const config = getStreamConfig()

  const body: Record<string, string> = { title }
  if (collectionId) body.collectionId = collectionId

  const response = await fetch(
    `https://video.bunnycdn.com/library/${config.libraryId}/videos`,
    {
      method: "POST",
      headers: {
        AccessKey: config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Bunny Stream create video failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  return {
    guid: data.guid,
    title: data.title,
    status: data.status,
    libraryId: config.libraryId,
  }
}

/**
 * Supprime une video de Bunny Stream.
 */
export const deleteVideoFromBunny = async (
  videoId: string,
): Promise<boolean> => {
  const config = getStreamConfig()

  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoId}`,
      {
        method: "DELETE",
        headers: { AccessKey: config.apiKey },
      },
    )

    if (!response.ok && response.status !== 404) {
      console.error(`Bunny video delete failed: ${response.status}`)
      return false
    }

    return true
  } catch (error) {
    console.error("Bunny video delete error:", error)
    return false
  }
}

/**
 * Recupere les metadonnees d'une video.
 */
export const getVideo = async (
  videoId: string,
): Promise<BunnyVideoMetadata> => {
  const config = getStreamConfig()

  const response = await fetch(
    `https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoId}`,
    {
      headers: { AccessKey: config.apiKey },
    },
  )

  if (!response.ok) {
    if (response.status === 404) throw new Error(`Video not found: ${videoId}`)
    if (response.status === 401) throw new Error("Unauthorized: Invalid access key")
    throw new Error(`Failed to fetch video metadata: ${response.status}`)
  }

  return response.json()
}

/**
 * Recupere les metadonnees de plusieurs videos en parallele.
 */
export const getMultipleVideos = async (
  videoIds: string[],
): Promise<Record<string, BunnyVideoMetadata>> => {
  const results = await Promise.allSettled(
    videoIds.map(async (videoId) => {
      const data = await getVideo(videoId)
      return { videoId, data }
    }),
  )

  const metadata: Record<string, BunnyVideoMetadata> = {}
  for (const result of results) {
    if (result.status === "fulfilled") {
      metadata[result.value.videoId] = result.value.data
    }
  }

  return metadata
}

/**
 * Obtient ou cree la collection d'un utilisateur dans Bunny Stream.
 */
export const getOrCreateUserCollection = async (
  userId: string,
): Promise<string> => {
  const config = getStreamConfig()
  const userCollectionName = `user_${userId}`

  // Lister les collections existantes
  const listRes = await fetch(
    `https://video.bunnycdn.com/library/${config.libraryId}/collections?page=1&itemsPerPage=250`,
    {
      headers: { AccessKey: config.apiKey },
    },
  )

  if (!listRes.ok) {
    throw new Error(`Failed to list collections: ${listRes.status}`)
  }

  const data = await listRes.json()
  const collections = data.items || []

  const existing = collections.find(
    (col: { name: string; guid: string }) => col.name === userCollectionName,
  )

  if (existing) return existing.guid

  // Creer une nouvelle collection
  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${config.libraryId}/collections`,
    {
      method: "POST",
      headers: {
        AccessKey: config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: userCollectionName }),
    },
  )

  if (!createRes.ok) {
    throw new Error(`Failed to create collection: ${createRes.status}`)
  }

  const newCollection = await createRes.json()
  return newCollection.guid
}

/**
 * Retourne l'accessKey Stream pour que le client puisse uploader directement.
 */
export const getStreamAccessKey = (): string => {
  const config = getStreamConfig()
  return config.apiKey
}

/**
 * Retourne le library ID Stream.
 */
export const getStreamLibraryId = (): string => {
  const config = getStreamConfig()
  return config.libraryId
}

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Genere une URL CDN optimisee avec les parametres Bunny Optimizer.
 */
export const getOptimizedImageUrl = (
  baseUrl: string,
  params: ImageOptimizationParams,
): string => {
  const searchParams = new URLSearchParams()

  if (params.width) searchParams.set("width", params.width.toString())
  if (params.height) searchParams.set("height", params.height.toString())
  if (params.quality) searchParams.set("quality", params.quality.toString())
  if (params.crop) searchParams.set("crop", params.crop)

  const queryString = searchParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Construit l'URL d'embed pour une video.
 */
export const getEmbedUrl = (videoId: string): string => {
  const config = getStreamConfig()
  return `https://iframe.mediadelivery.net/embed/${config.libraryId}/${videoId}`
}

/**
 * Extrait le GUID d'une URL iframe Bunny Stream.
 */
export const extractVideoGuidFromUrl = (iframeUrl: string): string | null => {
  const match = iframeUrl.match(/\/embed\/\d+\/([^?/]+)/)
  return match ? match[1] : null
}

// ============================================================================
// PATH HELPERS
// ============================================================================

/**
 * Genere un chemin de stockage unique pour un media.
 */
export const generateStoragePath = (
  userId: string,
  extension: string,
): string => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 15)
  const cleanExt = extension.replace(/^\./, "").toLowerCase()
  return `${userId}/${timestamp}-${randomSuffix}.${cleanExt}`
}

/**
 * Extrait l'extension d'un type MIME.
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  }
  return mimeToExt[mimeType] || "bin"
}

// ============================================================================
// VALIDATION
// ============================================================================

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 300 * 1024 * 1024 // 300MB

/**
 * Valide un fichier media avant upload.
 * @returns null si valide, message d'erreur sinon
 */
export const validateMediaFile = (
  mimeType: string,
  size: number,
  type: "image" | "video" | "both",
): string | null => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType)

  if (type === "image" && !isImage) {
    return "Format non supporte. Utilisez JPG, PNG, WebP ou GIF."
  }

  if (type === "video" && !isVideo) {
    return "Format non supporte. Utilisez MP4, WebM ou MOV."
  }

  if (type === "both" && !isImage && !isVideo) {
    return "Format non supporte. Utilisez JPG, PNG, WebP, GIF, MP4, WebM ou MOV."
  }

  if (isImage && size > MAX_IMAGE_SIZE) {
    return `Image trop volumineuse. Maximum ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`
  }

  if (isVideo && size > MAX_VIDEO_SIZE) {
    return `Video trop volumineuse. Maximum ${MAX_VIDEO_SIZE / (1024 * 1024)}MB.`
  }

  return null
}
