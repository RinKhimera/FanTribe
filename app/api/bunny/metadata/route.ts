import { NextRequest, NextResponse } from "next/server"
import { getMultipleVideos } from "@/app/api/bunny/helper/get-video"
import type { BunnyApiErrorResponse } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const { videoGuids } = await request.json()

    if (!videoGuids || !Array.isArray(videoGuids) || videoGuids.length === 0) {
      return NextResponse.json<BunnyApiErrorResponse>(
        { error: "Video GUIDs array is required" },
        { status: 400 },
      )
    }

    const videoMetadata = await getMultipleVideos(videoGuids)

    return NextResponse.json({
      success: true,
      data: videoMetadata,
    })
  } catch (error) {
    console.error(
      "❌ API: Erreur lors de la récupération des métadonnées:",
      error,
    )
    return NextResponse.json<BunnyApiErrorResponse>(
      { error: "Failed to fetch video metadata" },
      { status: 500 },
    )
  }
}
