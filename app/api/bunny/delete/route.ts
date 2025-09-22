import { NextRequest, NextResponse } from "next/server"
import { BunnyApiErrorResponse } from "@/types"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("mediaId")
    const type = searchParams.get("type") as "image" | "video"

    if (!mediaId || !type) {
      return NextResponse.json<BunnyApiErrorResponse>(
        { error: "mediaId and type are required" },
        { status: 400 },
      )
    }

    if (type === "video") {
      // Supprimer la vidéo de la bibliothèque
      const deleteResponse = await fetch(
        `https://video.bunnycdn.com/library/${process.env.BUNNY_VIDEO_LIBRARY_ID}/videos/${mediaId}`,
        {
          method: "DELETE",
          headers: {
            AccessKey: process.env.BUNNY_VIDEO_LIBRARY_ACCESS_KEY!,
          },
        },
      )

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text()
        console.error("❌ Erreur suppression vidéo:", errorText)
        return NextResponse.json<BunnyApiErrorResponse>(
          { error: "Failed to delete video" },
          { status: deleteResponse.status },
        )
      }

      console.log("✅ Vidéo supprimée avec succès")
    } else {
      // Supprimer l'image du storage
      const deleteResponse = await fetch(
        `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE_NAME}/${mediaId}`,
        {
          method: "DELETE",
          headers: {
            AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY!,
          },
        },
      )

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text()
        console.error("❌ Erreur suppression image:", errorText)
        return NextResponse.json<BunnyApiErrorResponse>(
          { error: "Failed to delete image" },
          { status: deleteResponse.status },
        )
      }

      console.log("✅ Image supprimée avec succès")
    }

    return NextResponse.json({
      success: true,
      message: `${type} deleted successfully`,
    })
  } catch (error) {
    console.error("❌ Delete error:", error)
    return NextResponse.json<BunnyApiErrorResponse>(
      { error: "Delete failed" },
      { status: 500 },
    )
  }
}
