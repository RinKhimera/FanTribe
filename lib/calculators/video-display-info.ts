import type { BunnyVideoGetResponse } from "@/types"

export type AspectRatio =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:3"
  | "3:4"
  | "21:9"
  | "custom"

export interface VideoDisplayInfo {
  aspectRatio: AspectRatio
  isPortrait: boolean
  isLandscape: boolean
  displayWidth: number
  displayHeight: number
  rotation: number
}

/**
 * Calcule l'aspect ratio et les dimensions d'affichage d'une vidéo Bunny.net
 * en tenant compte de la rotation
 */
export const getVideoDisplayInfo = (
  videoData: BunnyVideoGetResponse,
): VideoDisplayInfo => {
  const { width, height, rotation } = videoData

  // Calculer les dimensions après rotation
  // Si rotation = ±90°, les dimensions sont inversées
  const needsRotation = Math.abs(rotation) === 90
  const displayWidth = needsRotation ? height : width
  const displayHeight = needsRotation ? width : height

  // Déterminer orientation
  const isPortrait = displayHeight > displayWidth
  const isLandscape = displayWidth > displayHeight

  // Calculer le ratio
  const ratio = displayWidth / displayHeight

  // Déterminer l'aspect ratio standard le plus proche
  let aspectRatio: AspectRatio = "custom"

  // Tolérance pour la comparaison des ratios
  const tolerance = 0.05

  if (Math.abs(ratio - 1) < tolerance) {
    // 1:1 (carré)
    aspectRatio = "1:1"
  } else if (Math.abs(ratio - 16 / 9) < tolerance) {
    // 16:9 (paysage standard)
    aspectRatio = "16:9"
  } else if (Math.abs(ratio - 9 / 16) < tolerance) {
    // 9:16 (portrait standard)
    aspectRatio = "9:16"
  } else if (Math.abs(ratio - 4 / 3) < tolerance) {
    // 4:3 (paysage classique)
    aspectRatio = "4:3"
  } else if (Math.abs(ratio - 3 / 4) < tolerance) {
    // 3:4 (portrait classique)
    aspectRatio = "3:4"
  } else if (Math.abs(ratio - 21 / 9) < tolerance) {
    // 21:9 (ultra-wide)
    aspectRatio = "21:9"
  }

  return {
    aspectRatio,
    isPortrait,
    isLandscape,
    displayWidth,
    displayHeight,
    rotation,
  }
}

/**
 * Convertit un aspect ratio en valeur CSS
 */
export const aspectRatioToCSS = (aspectRatio: AspectRatio): string => {
  switch (aspectRatio) {
    case "16:9":
      return "16 / 9"
    case "9:16":
      return "9 / 16"
    case "1:1":
      return "1 / 1"
    case "4:3":
      return "4 / 3"
    case "3:4":
      return "3 / 4"
    case "21:9":
      return "21 / 9"
    default:
      return "16 / 9" // fallback
  }
}

/**
 * Détermine l'aspect ratio optimal pour l'affichage en fonction du contexte
 */
export const getOptimalDisplayRatio = (videoInfo: VideoDisplayInfo): string => {
  // Pour le feed, limiter la hauteur des vidéos portrait
  if (videoInfo.isPortrait) {
    // Pour les vidéos très hautes (comme 9:16), limiter à un ratio moins extrême
    if (videoInfo.aspectRatio === "9:16") {
      return "9 / 16"
    }
    // Pour d'autres vidéos portrait, utiliser le ratio calculé
    return aspectRatioToCSS(videoInfo.aspectRatio)
  }

  // Pour les autres cas, utiliser le ratio calculé
  return aspectRatioToCSS(videoInfo.aspectRatio)
}
