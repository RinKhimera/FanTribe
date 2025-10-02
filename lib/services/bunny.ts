import axios from "axios"
import { clientEnv } from "@/lib/config/env.client"
import { logger } from "@/lib/config/logger"
import {
  BunnyApiResponse,
  BunnyCollectionCreateResponse,
  BunnyDeleteResponse,
  BunnyVideoGetResponse,
} from "@/types"

export const deleteBunnyAsset = async (
  mediaId: string,
  type: "image" | "video",
): Promise<BunnyDeleteResponse> => {
  if (type === "video") {
    try {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/videos/${mediaId}`,
        {
          method: "DELETE",
          headers: {
            AccessKey: clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY,
          },
        },
      )

      const deleteResponse: BunnyDeleteResponse = await response.json()

      if (!response.ok) {
        logger.error("Bunny video deletion failed", deleteResponse, {
          mediaId,
          type: "video",
          statusCode: response.status,
        })
        return {
          success: false,
          message: deleteResponse.message || "Erreur lors de la suppression",
          statusCode: response.status,
        }
      }

      logger.success("Bunny video deleted successfully", {
        mediaId,
        statusCode: response.status,
      })
      return deleteResponse
    } catch (error) {
      logger.error("Bunny video deletion network error", error, {
        mediaId,
        type: "video",
      })
      return {
        success: false,
        message: "Erreur réseau lors de la suppression",
        statusCode: 500,
      }
    }
  }

  if (type === "image") {
    try {
      const response = await fetch(
        `https://storage.bunnycdn.com/${clientEnv.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME}/${mediaId}`,
        {
          method: "DELETE",
          headers: {
            AccessKey: clientEnv.NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY,
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        logger.error("Bunny image deletion failed", errorText, {
          mediaId,
          type: "image",
          statusCode: response.status,
        })
        return {
          success: false,
          message: errorText || "Erreur lors de la suppression de l'image",
          statusCode: response.status,
        }
      }

      logger.success("Bunny image deleted successfully", { mediaId })
      return {
        success: true,
        message: "Image supprimée avec succès",
        statusCode: 200,
      }
    } catch (error) {
      logger.error("Bunny image deletion network error", error, {
        mediaId,
        type: "image",
      })
      return {
        success: false,
        message: "Erreur réseau lors de la suppression",
        statusCode: 500,
      }
    }
  }

  // Type non supporté
  return {
    success: false,
    message: "Type de média non supporté",
    statusCode: 400,
  }
}

export const uploadBunnyAsset = async ({
  file,
  fileName,
  userId,
  onProgress,
}: {
  file: File
  fileName: string
  userId: string
  onProgress?: (percent: number) => void
}): Promise<BunnyApiResponse> => {
  if (!file || !userId || !fileName) {
    return {
      success: false,
      url: "",
      mediaId: "",
      type: "image",
      error: "Paramètres manquants: file, fileName et userId requis",
    }
  }

  try {
    const randomSuffix = crypto.randomUUID().replace(/-/g, "").substring(0, 13)
    const fileExtension = file.name.split(".").pop()
    const videoFileName = `${randomSuffix}.${fileExtension}`

    if (file.type.startsWith("video/")) {
      // Gestion des vidéos via axios
      let videoData: BunnyVideoGetResponse
      try {
        const userCollectionId = await getOrCreateUserCollection(userId)
        const createRes = await axios.post(
          `https://video.bunnycdn.com/library/${clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/videos`,
          {
            title: videoFileName,
            collectionId: userCollectionId,
          },
          {
            headers: {
              AccessKey: clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY,
              "Content-Type": "application/json",
            },
          },
        )
        videoData = createRes.data
      } catch (e: any) {
        logger.error("Bunny video creation failed", e, {
          userId,
          fileName: videoFileName,
        })
        return {
          success: false,
          url: "",
          mediaId: "",
          type: "video",
          error: "Erreur lors de la création de la vidéo",
        }
      }

      try {
        await axios.put(
          `https://video.bunnycdn.com/library/${clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/videos/${videoData.guid}`,
          file,
          {
            headers: {
              AccessKey: clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY,
              "Content-Type": file.type,
            },
            onUploadProgress: (evt) => {
              if (evt.total && onProgress) {
                onProgress(Math.round((evt.loaded / evt.total) * 100))
              }
            },
          },
        )
        onProgress?.(100)
      } catch (e: any) {
        logger.error("Bunny video upload failed", e, {
          videoGuid: videoData.guid,
          userId,
          fileName: videoFileName,
        })
        return {
          success: false,
          url: "",
          mediaId: videoData.guid,
          type: "video",
          error: "Erreur lors de l'upload vidéo",
        }
      }

      return {
        success: true,
        url: `https://iframe.mediadelivery.net/embed/${clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/${videoData.guid}`,
        mediaId: videoData.guid,
        type: "video",
      }
    } else {
      // Images via axios
      try {
        await axios.put(
          `https://storage.bunnycdn.com/${clientEnv.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME}/${fileName}`,
          file,
          {
            headers: {
              AccessKey: clientEnv.NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY,
              "Content-Type": file.type,
            },
            onUploadProgress: (evt) => {
              if (evt.total && onProgress) {
                onProgress(Math.round((evt.loaded / evt.total) * 100))
              }
            },
          },
        )
        onProgress?.(100)
      } catch (e: any) {
        logger.error("Bunny image upload failed", e, {
          fileName,
          userId,
          fileType: file.type,
        })
        return {
          success: false,
          url: "",
          mediaId: fileName,
          type: "image",
          error: "Erreur lors de l'upload image",
        }
      }

      return {
        success: true,
        url: `${clientEnv.NEXT_PUBLIC_BUNNY_PULL_ZONE_URL}/${fileName}`,
        mediaId: fileName,
        type: "image",
      }
    }
  } catch (error) {
    const mediaType = file.type.startsWith("video/") ? "video" : "image"
    logger.error("Bunny asset upload failed", error, {
      fileName,
      userId,
      fileType: file.type,
      mediaType,
    })
    return {
      success: false,
      url: "",
      mediaId: "",
      type: mediaType,
      error:
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de l'upload",
    }
  }
}

// Cache module-level pour conserver les collections utilisateur entre appels
const userCollectionsCache = new Map<string, string>()

// Fonction helper pour obtenir ou créer la collection utilisateur
const getOrCreateUserCollection = async (userId: string): Promise<string> => {
  try {
    if (userCollectionsCache.has(userId)) {
      return userCollectionsCache.get(userId)!
    }

    // Récupérer toutes les collections pour voir si celle de l'utilisateur existe
    const collectionsResponse = await fetch(
      `https://video.bunnycdn.com/library/${clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/collections`,
      {
        headers: {
          AccessKey: clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY,
        },
      },
    )

    if (!collectionsResponse.ok) {
      throw new Error(
        `Erreur récupération collections: ${collectionsResponse.status}`,
      )
    }

    const collectionsData = await collectionsResponse.json()
    const collections = collectionsData.items || []
    const userCollectionName = `user_${userId}`

    // Chercher si la collection existe déjà
    const existingCollection = collections.find(
      (col: any) => col.name === userCollectionName,
    )

    if (existingCollection) {
      userCollectionsCache.set(userId, existingCollection.guid)
      return existingCollection.guid
    }

    // Créer une nouvelle collection si elle n'existe pas
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/collections`,
      {
        method: "POST",
        headers: {
          AccessKey: clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: userCollectionName }),
      },
    )

    if (!createResponse.ok) {
      throw new Error(`Erreur création collection: ${createResponse.status}`)
    }

    const newCollection: BunnyCollectionCreateResponse =
      await createResponse.json()
    userCollectionsCache.set(userId, newCollection.guid)

    return newCollection.guid
  } catch (error) {
    logger.error("Bunny collection management failed", error, { userId })
    throw new Error("Failed to get or create user collection")
  }
}
