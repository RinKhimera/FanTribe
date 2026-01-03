/**
 * Bunny CDN Signed URLs pour Convex
 *
 * Version utilisant l'API Web Crypto (compatible Convex).
 * Nécessite l'activation de "Token Authentication" dans le dashboard Bunny CDN.
 *
 * Configuration requise:
 * 1. Aller sur Bunny.net > Pull Zone > Security
 * 2. Activer "Token Authentication"
 * 3. Ajouter BUNNY_URL_TOKEN_KEY dans les variables d'environnement Convex
 */

/**
 * Génère une URL signée pour Bunny CDN avec expiration temporelle.
 * Utilise l'API Web Crypto pour la compatibilité avec l'environnement Convex.
 *
 * @param originalUrl - L'URL originale du média Bunny CDN
 * @param tokenKey - La clé de token Bunny CDN
 * @param expirySeconds - Durée de validité en secondes (défaut: 3600 = 1 heure)
 * @returns L'URL signée avec token et expiration
 */
export async function generateSignedBunnyUrl(
  originalUrl: string,
  tokenKey: string | undefined,
  expirySeconds: number = 3600,
): Promise<string> {
  // Si pas de clé configurée, retourner l'URL originale
  if (!tokenKey) {
    return originalUrl
  }

  try {
    const url = new URL(originalUrl)
    const expires = Math.floor(Date.now() / 1000) + expirySeconds
    const pathToSign = url.pathname

    // Format de signature Bunny CDN: SHA256(securityKey + pathToSign + expires)
    const hashableBase = `${tokenKey}${pathToSign}${expires}`

    // Utiliser Web Crypto API pour SHA256
    const encoder = new TextEncoder()
    const data = encoder.encode(hashableBase)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)

    // Convertir en base64 URL-safe
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const base64 = btoa(String.fromCharCode(...hashArray))
    const token = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "")

    // Ajouter les paramètres à l'URL
    url.searchParams.set("token", token)
    url.searchParams.set("expires", expires.toString())

    return url.toString()
  } catch {
    // En cas d'erreur, retourner l'URL originale
    return originalUrl
  }
}

/**
 * Signe un tableau d'URLs Bunny CDN.
 *
 * @param urls - Tableau d'URLs à signer
 * @param tokenKey - La clé de token Bunny CDN
 * @param expirySeconds - Durée de validité en secondes
 * @returns Promise d'un tableau d'URLs signées
 */
export async function signBunnyUrls(
  urls: string[],
  tokenKey: string | undefined,
  expirySeconds: number = 3600,
): Promise<string[]> {
  if (!tokenKey || urls.length === 0) {
    return urls
  }

  return Promise.all(
    urls.map((url) => generateSignedBunnyUrl(url, tokenKey, expirySeconds)),
  )
}
