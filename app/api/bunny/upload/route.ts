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
    const fileName = formData.get("fileName") as string
    const userId = formData.get("userId") as string

    if (!file || !userId || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    const randomSuffix = crypto.randomUUID().replace(/-/g, "").substring(0, 13)
    const fileExtension = file.name.split(".").pop()
    const videoFileName = `${randomSuffix}.${fileExtension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (file.type.startsWith("video/")) {
      let videoData: BunnyVideoGetResponse

      try {
        // Obtenir ou créer la collection de l'utilisateur
        const userCollectionId = await getOrCreateUserCollection(userId)

        // Créer la vidéo dans la collection de l'utilisateur
        const videoResponse = await axios.post(
          `https://video.bunnycdn.com/library/${process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/videos`,
          {
            title: videoFileName,
            collectionId: userCollectionId,
          },
          {
            headers: {
              AccessKey: process.env.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY!,
              "Content-Type": "application/json",
            },
          },
        )

        videoData = videoResponse.data
      } catch (collectionError) {
        console.error(
          "❌ Erreur lors de la gestion des collections:",
          collectionError,
        )
        throw collectionError
      }

      // Upload de la video
      await axios.put(
        `https://video.bunnycdn.com/library/${process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/videos/${videoData.guid}`,
        buffer,
        {
          headers: {
            AccessKey: process.env.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY!,
            "Content-Type": file.type,
          },
        },
      )

      return NextResponse.json<BunnyApiResponse>({
        success: true,
        url: `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID}/${videoData.guid}`,
        mediaId: videoData.guid,
        type: "video",
      })
    } else {
      // Upload de l'image
      await axios.put(
        `https://storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME}/${fileName}`,
        buffer,
        {
          headers: {
            AccessKey: process.env.NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY!,
            "Content-Type": file.type,
          },
        },
      )

      return NextResponse.json<BunnyApiResponse>({
        success: true,
        url: `${process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_URL}/${fileName}`,
        mediaId: fileName,
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
