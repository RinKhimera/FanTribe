"use server"

import { deleteBunnyAsset } from "@/lib/bunny"

export const deleteAsset = async (
  mediaId: string,
  type: "image" | "video",
): Promise<{
  success: boolean
  message: string
  statusCode: number | null
}> => {
  try {
    // Validation des paramètres
    if (!mediaId || !type) {
      return {
        success: false,
        message: "ID du média et type requis",
        statusCode: null,
      }
    }

    // Validation du type
    if (type !== "image" && type !== "video") {
      return {
        success: false,
        message: "Type de média invalide",
        statusCode: null,
      }
    }

    // Appel de la logique métier
    const result = await deleteBunnyAsset(mediaId, type)

    if (!result.success) {
      return {
        success: false,
        message: `Échec de la suppression: ${result.message}`,
        statusCode: result.statusCode,
      }
    }

    return {
      success: true,
      message: `${type === "video" ? "Vidéo" : "Image"} supprimée avec succès`,
      statusCode: result.statusCode || 200,
    }
  } catch (error) {
    console.error("❌ Erreur dans deleteAsset server action:", error)
    return {
      success: false,
      message: "Erreur serveur lors de la suppression",
      statusCode: 500,
    }
  }
}
