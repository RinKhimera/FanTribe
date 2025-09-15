import axios from "axios"
import { NextRequest, NextResponse } from "next/server"
import { getOrCreateUserCollection } from "@/app/api/bunny/helper/get-user-collection"
import {
  BunnyApiErrorResponse,
  BunnyApiResponse,
  BunnyVideoGetResponse,
} from "@/types"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`🚀 API Route - Début upload: ${file.name}`)

    const randomSuffix = crypto.randomUUID().replace(/-/g, "").substring(0, 13)
    const fileExtension = file.name.split(".").pop()
    const fileName = `${userId}/${randomSuffix}.${fileExtension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (file.type.startsWith("video/")) {
      console.log(`🎥 Début traitement vidéo pour l'utilisateur: ${userId}`)

      let videoData: BunnyVideoGetResponse

      try {
        // Obtenir ou créer la collection de l'utilisateur
        console.log(
          `🔍 Recherche/création de collection pour userId: ${userId}`,
        )
        const userCollectionId = await getOrCreateUserCollection(userId)
        console.log(`✅ Collection obtenue/créée: ${userCollectionId}`)

        // Créer la vidéo dans la collection de l'utilisateur
        console.log(
          `📹 Création de la vidéo avec collectionId: ${userCollectionId}`,
        )
        const videoResponse = await axios.post(
          `https://video.bunnycdn.com/library/${process.env.BUNNY_VIDEO_LIBRARY_ID}/videos`,
          {
            title: fileName,
            collectionId: userCollectionId,
          },
          {
            headers: {
              AccessKey: process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY!,
              "Content-Type": "application/json",
            },
          },
        )

        videoData = videoResponse.data
        console.log(`✅ Vidéo créée avec GUID: ${videoData.guid}`)
      } catch (collectionError) {
        console.error(
          "❌ Erreur lors de la gestion des collections:",
          collectionError,
        )
        // Fallback: créer la vidéo sans collection
        console.log("🔄 Fallback: création de vidéo sans collection")
        const videoResponse = await axios.post(
          `https://video.bunnycdn.com/library/${process.env.BUNNY_VIDEO_LIBRARY_ID}/videos`,
          { title: fileName },
          {
            headers: {
              AccessKey: process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY!,
              "Content-Type": "application/json",
            },
          },
        )
        videoData = videoResponse.data
        console.log(`✅ Vidéo créée en fallback avec GUID: ${videoData.guid}`)
      } // Upload du fichier
      await axios.put(
        `https://video.bunnycdn.com/library/${process.env.BUNNY_VIDEO_LIBRARY_ID}/videos/${videoData.guid}`,
        buffer,
        {
          headers: {
            AccessKey: process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY!,
            "Content-Type": file.type,
          },
        },
      )

      return NextResponse.json<BunnyApiResponse>({
        success: true,
        url: `https://iframe.mediadelivery.net/embed/${process.env.BUNNY_VIDEO_LIBRARY_ID}/${videoData.guid}`,
        publicId: videoData.guid,
        type: "video",
      })
    } else {
      // Upload image
      await axios.put(
        `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE_NAME}/${fileName}`,
        buffer,
        {
          headers: {
            AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY!,
            "Content-Type": file.type,
          },
        },
      )

      return NextResponse.json<BunnyApiResponse>({
        success: true,
        url: `${process.env.BUNNY_PULL_ZONE_URL}/${fileName}`,
        publicId: fileName,
        type: "image",
      })
    }
  } catch (error) {
    console.error("❌ Upload error:", error)
    return NextResponse.json<BunnyApiErrorResponse>(
      { error: "Upload failed" },
      { status: 500 },
    )
  }
}
