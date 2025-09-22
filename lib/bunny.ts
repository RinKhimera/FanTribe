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
        `https://video.bunnycdn.com/library/${process.env.BUNNY_VIDEO_LIBRARY_ID}/videos/${mediaId}`,
        {
          method: "DELETE",
          headers: {
            AccessKey: process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY!,
          },
        },
      )

      const deleteResponse: BunnyDeleteResponse = await response.json()

      if (!response.ok) {
        console.error(
          "❌ Erreur lors de la suppression de la vidéo",
          deleteResponse,
        )
        return {
          success: false,
          message: deleteResponse.message || "Erreur lors de la suppression",
          statusCode: response.status,
        }
      }

      console.log("✅ Vidéo supprimée avec succès", deleteResponse)
      return deleteResponse
    } catch (error) {
      console.error(
        "❌ Erreur réseau lors de la suppression de la vidéo",
        error,
      )
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
        `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE_NAME}/${mediaId}`,
        {
          method: "DELETE",
          headers: {
            AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY!,
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Erreur lors de la suppression de l'image", errorText)
        return {
          success: false,
          message: errorText || "Erreur lors de la suppression de l'image",
          statusCode: response.status,
        }
      }

      console.log("✅ Image supprimée avec succès")
      return {
        success: true,
        message: "Image supprimée avec succès",
        statusCode: 200,
      }
    } catch (error) {
      console.error("❌ Erreur réseau lors de la suppression de l'image", error)
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
}: {
  file: File
  fileName: string
  userId: string
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

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (file.type.startsWith("video/")) {
      // Gestion des vidéos
      let videoData: BunnyVideoGetResponse

      try {
        // Obtenir ou créer la collection de l'utilisateur
        const userCollectionId = await getOrCreateUserCollection(userId)

        // Créer la vidéo dans la collection de l'utilisateur
        const videoResponse = await fetch(
          `https://video.bunnycdn.com/library/${process.env.BUNNY_VIDEO_LIBRARY_ID}/videos`,
          {
            method: "POST",
            headers: {
              AccessKey: process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: videoFileName,
              collectionId: userCollectionId,
            }),
          },
        )

        if (!videoResponse.ok) {
          throw new Error(`Erreur création vidéo: ${videoResponse.status}`)
        }

        videoData = await videoResponse.json()
      } catch (collectionError) {
        console.error(
          "❌ Erreur lors de la gestion des collections:",
          collectionError,
        )
        return {
          success: false,
          url: "",
          mediaId: "",
          type: "video",
          error: "Erreur lors de la création de la collection vidéo",
        }
      }

      // Upload de la vidéo
      const uploadResponse = await fetch(
        `https://video.bunnycdn.com/library/${process.env.BUNNY_VIDEO_LIBRARY_ID}/videos/${videoData.guid}`,
        {
          method: "PUT",
          headers: {
            AccessKey: process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY!,
            "Content-Type": file.type,
          },
          body: buffer,
        },
      )

      if (!uploadResponse.ok) {
        throw new Error(`Erreur upload vidéo: ${uploadResponse.status}`)
      }

      return {
        success: true,
        url: `https://iframe.mediadelivery.net/embed/${process.env.BUNNY_VIDEO_LIBRARY_ID}/${videoData.guid}`,
        mediaId: videoData.guid,
        type: "video",
      }
    } else {
      // Gestion des images
      const uploadResponse = await fetch(
        `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE_NAME}/${fileName}`,
        {
          method: "PUT",
          headers: {
            AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY!,
            "Content-Type": file.type,
          },
          body: buffer,
        },
      )

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(
          `Erreur upload image: ${uploadResponse.status} - ${errorText}`,
        )
      }

      return {
        success: true,
        url: `${process.env.BUNNY_PULL_ZONE_URL}/${fileName}`,
        mediaId: fileName,
        type: "image",
      }
    }
  } catch (error) {
    console.error("❌ Erreur uploadBunnyAsset:", error)
    return {
      success: false,
      url: "",
      mediaId: "",
      type: file.type.startsWith("video/") ? "video" : "image",
      error:
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de l'upload",
    }
  }
}

// Fonction helper pour obtenir ou créer la collection utilisateur
const getOrCreateUserCollection = async (userId: string): Promise<string> => {
  try {
    // Cache en mémoire pour éviter les appels répétés
    const userCollectionsCache = new Map<string, string>()

    // Vérifier le cache d'abord
    if (userCollectionsCache.has(userId)) {
      return userCollectionsCache.get(userId)!
    }

    // Récupérer toutes les collections pour voir si celle de l'utilisateur existe
    const collectionsResponse = await fetch(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_VIDEO_LIBRARY_ID}/collections`,
      {
        headers: {
          AccessKey: process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY!,
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
      `https://video.bunnycdn.com/library/${process.env.BUNNY_VIDEO_LIBRARY_ID}/collections`,
      {
        method: "POST",
        headers: {
          AccessKey: process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY!,
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
    console.error("❌ Erreur lors de la gestion des collections:", error)
    throw new Error("Failed to get or create user collection")
  }
}
