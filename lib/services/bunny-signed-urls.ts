/**
 * Bunny CDN Signed URLs
 *
 * Génère des URLs signées avec expiration pour Bunny CDN.
 * Nécessite l'activation de "Token Authentication" dans le dashboard Bunny CDN.
 *
 * Configuration requise:
 * 1. Aller sur Bunny.net > Pull Zone > Security
 * 2. Activer "Token Authentication"
 * 3. Copier la clé dans .env.local comme BUNNY_URL_TOKEN_KEY
 */

import crypto from "crypto"

const BUNNY_TOKEN_KEY = process.env.BUNNY_URL_TOKEN_KEY

/**
 * Génère une URL signée pour Bunny CDN avec expiration temporelle.
 *
 * @param originalUrl - L'URL originale du média Bunny CDN
 * @param expirySeconds - Durée de validité en secondes (défaut: 3600 = 1 heure)
 * @returns L'URL signée avec token et expiration, ou l'URL originale si non configuré
 *
 * @example
 * const signedUrl = generateSignedBunnyUrl(
 *   "https://myzone.b-cdn.net/images/photo.jpg",
 *   3600
 * )
 * // Résultat: https://myzone.b-cdn.net/images/photo.jpg?token=xxx&expires=1234567890
 */
export function generateSignedBunnyUrl(
  originalUrl: string,
  expirySeconds: number = 3600,
): string {
  // Si pas de clé configurée, retourner l'URL originale
  if (!BUNNY_TOKEN_KEY) {
    return originalUrl
  }

  try {
    const url = new URL(originalUrl)
    const expires = Math.floor(Date.now() / 1000) + expirySeconds
    const pathToSign = url.pathname

    // Format de signature Bunny CDN: SHA256(securityKey + pathToSign + expires)
    const hashableBase = `${BUNNY_TOKEN_KEY}${pathToSign}${expires}`
    const token = crypto
      .createHash("sha256")
      .update(hashableBase)
      .digest("base64")
      // URL-safe base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "")

    // Ajouter les paramètres à l'URL
    url.searchParams.set("token", token)
    url.searchParams.set("expires", expires.toString())

    return url.toString()
  } catch {
    // En cas d'erreur, retourner l'URL originale
    console.error("Erreur lors de la génération de l'URL signée")
    return originalUrl
  }
}

/**
 * Signe un tableau d'URLs Bunny CDN.
 *
 * @param urls - Tableau d'URLs à signer
 * @param expirySeconds - Durée de validité en secondes
 * @returns Tableau d'URLs signées
 */
export function signBunnyUrls(
  urls: string[],
  expirySeconds: number = 3600,
): string[] {
  return urls.map((url) => generateSignedBunnyUrl(url, expirySeconds))
}

/**
 * Vérifie si les signed URLs sont configurées.
 */
export function isSignedUrlsEnabled(): boolean {
  return !!BUNNY_TOKEN_KEY
}
