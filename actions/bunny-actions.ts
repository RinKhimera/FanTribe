/**
 * Supprime un asset via l'API Bunny.net
 * @param mediaId - L'ID de l'asset à supprimer
 * @param type - Le type d'asset ("image" ou "video")
 * @returns Promise<void>
 */
export async function deleteBunnyAsset(
  mediaId: string,
  type: "image" | "video",
): Promise<void> {
  const response = await fetch(
    `/api/bunny/delete?mediaId=${encodeURIComponent(mediaId)}&type=${type}`,
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
 * Supprime un document de validation (image Bunny)
 * @param mediaId - L'ID du document
 */
export async function deleteValidationDocument(mediaId: string): Promise<void> {
  try {
    await deleteBunnyAsset(mediaId, "image")
  } catch (error) {
    console.error("Erreur lors de la suppression du document:", error)
    throw error
  }
}
