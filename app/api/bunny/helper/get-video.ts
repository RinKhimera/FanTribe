import axios, { isAxiosError } from "axios"
import { BunnyVideoGetResponse } from "@/types"

/**
 * Récupère les métadonnées d'une vidéo depuis l'API Bunny.net
 * @param videoId - Le GUID de la vidéo
 * @returns Les métadonnées complètes de la vidéo
 */
export async function getVideo(
  videoId: string,
): Promise<BunnyVideoGetResponse> {
  try {
    const response = await axios.get<BunnyVideoGetResponse>(
      `https://video.bunnycdn.com/library/${process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          AccessKey: process.env.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY!,
        },
      },
    )

    const videoData = response.data

    return videoData
  } catch (error) {
    console.error(
      `❌ Erreur lors de la récupération de la vidéo ${videoId}:`,
      error,
    )

    if (isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Video not found: ${videoId}`)
      }
      if (error.response?.status === 401) {
        throw new Error("Unauthorized: Invalid access key")
      }
      if (error.response?.status === 403) {
        throw new Error("Forbidden: Access denied")
      }
    }

    throw new Error(
      `Failed to fetch video metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

/**
 * Récupère les métadonnées de plusieurs vidéos en parallèle
 * @param videoIds - Array des GUIDs des vidéos
 * @returns Record avec les métadonnées indexées par GUID
 */
export async function getMultipleVideos(
  videoIds: string[],
): Promise<Record<string, BunnyVideoGetResponse>> {
  try {
    const promises = videoIds.map(async (videoId) => {
      try {
        const videoData = await getVideo(videoId)
        return { videoId, videoData, success: true as const }
      } catch (error) {
        console.error(`❌ Échec récupération vidéo ${videoId}:`, error)
        return { videoId, error, success: false as const }
      }
    })

    const results = await Promise.allSettled(promises)
    const videoMetadata: Record<string, BunnyVideoGetResponse> = {}

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.success) {
        videoMetadata[result.value.videoId] = result.value.videoData
      }
    })

    return videoMetadata
  } catch (error) {
    console.error("❌ Erreur lors de la récupération multiple:", error)
    throw error
  }
}

/**
 * Extrait le GUID d'une URL iframe Bunny.net
 * @param iframeUrl - URL de l'iframe (ex: https://iframe.mediadelivery.net/embed/494644/guid)
 * @returns Le GUID de la vidéo ou null si non trouvé
 */
export function extractVideoGuidFromUrl(iframeUrl: string): string | null {
  const match = iframeUrl.match(/\/embed\/\d+\/([^?/]+)/)
  return match ? match[1] : null
}

/**
 * Récupère les métadonnées pour une liste d'URLs de médias
 * Filtre automatiquement les vidéos et extrait les GUIDs
 * @param mediaUrls - Array des URLs de médias (images et vidéos)
 * @returns Record avec les métadonnées des vidéos uniquement
 */
export async function getVideoMetadataFromMediaUrls(
  mediaUrls: string[],
): Promise<Record<string, BunnyVideoGetResponse>> {
  try {
    // Filtrer les vidéos et extraire les GUIDs
    const videoGuids = mediaUrls
      .filter((url) =>
        url.startsWith("https://iframe.mediadelivery.net/embed/"),
      )
      .map((url) => extractVideoGuidFromUrl(url))
      .filter((guid): guid is string => guid !== null)

    if (videoGuids.length === 0) {
      return {}
    }

    return await getMultipleVideos(videoGuids)
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des métadonnées vidéos:",
      error,
    )
    return {}
  }
}
