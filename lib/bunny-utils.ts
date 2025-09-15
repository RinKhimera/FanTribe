/**
 * Supprime un asset via l'API Bunny.net
 * @param publicId - Le publicId/GUID de l'asset à supprimer
 * @param type - Le type d'asset ("image" ou "video")
 * @returns Promise<void>
 */
export async function deleteBunnyAsset(
  publicId: string,
  type: "image" | "video",
): Promise<void> {
  const response = await fetch(
    `/api/bunny/delete?publicId=${encodeURIComponent(publicId)}&type=${type}`,
    {
      method: "DELETE",
    },
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || `Failed to delete ${type}`)
  }
}

/**
 * Supprime un document de validation (image Cloudinary ou Bunny)
 * Pour la compatibilité avec les documents existants
 * @param publicId - Le publicId du document
 */
export async function deleteValidationDocument(
  publicId: string,
): Promise<void> {
  // Pour l'instant, on assume que c'est une image
  // TODO: Détecter automatiquement le type selon l'URL/publicId
  try {
    await deleteBunnyAsset(publicId, "image")
  } catch (error) {
    console.error("Erreur lors de la suppression du document:", error)
    throw error
  }
}
