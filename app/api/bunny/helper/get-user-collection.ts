"use server"

import axios from "axios"
import { BunnyCollectionCreateResponse } from "@/types"

// Cache en mémoire pour éviter les appels répétés
const userCollectionsCache = new Map<string, string>()

export async function getOrCreateUserCollection(
  userId: string,
): Promise<string> {
  try {
    // Vérifier le cache d'abord
    if (userCollectionsCache.has(userId)) {
      return userCollectionsCache.get(userId)!
    }

    // Récupérer toutes les collections pour voir si celle de l'utilisateur existe
    const collectionsResponse = await axios.get(
      `https://video.bunnycdn.com/library/${process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/collections`,
      {
        headers: {
          AccessKey: process.env.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY!,
        },
      },
    )

    const collections = collectionsResponse.data.items || []
    const userCollectionName = `user_${userId}`

    // Chercher si la collection existe déjà
    const existingCollection = collections.find(
      (col: { name: string; guid: string }) => col.name === userCollectionName,
    )

    if (existingCollection) {
      userCollectionsCache.set(userId, existingCollection.guid)
      return existingCollection.guid
    }

    // Créer une nouvelle collection si elle n'existe pas
    const createResponse = await axios.post<BunnyCollectionCreateResponse>(
      `https://video.bunnycdn.com/library/${process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/collections`,
      { name: userCollectionName },
      {
        headers: {
          AccessKey: process.env.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY!,
          "Content-Type": "application/json",
        },
      },
    )

    const newCollection = createResponse.data
    userCollectionsCache.set(userId, newCollection.guid)

    return newCollection.guid
  } catch (error) {
    console.error("❌ Erreur lors de la gestion des collections:", error)
    console.error("❌ Détails de l'erreur:", {
      message: error instanceof Error ? error.message : "Unknown error",
      response:
        error instanceof Error && "response" in error ? error.response : null,
    })
    throw new Error("Failed to get or create user collection")
  }
}
