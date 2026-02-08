import { useAuth } from "@clerk/nextjs"
import { useState, useEffect, useMemo } from "react"
import { clientEnv } from "@/lib/config/env.client"
import { logger } from "@/lib/config"
import type { BunnyVideoGetResponse } from "@/types"

interface UseVideoMetadataOptions {
  mediaUrls: string[]
  enabled?: boolean
}

interface UseVideoMetadataResult {
  metadata: Record<string, BunnyVideoGetResponse>
  isLoading: boolean
  error: Error | null
}

const extractVideoGuidFromUrl = (url: string): string | null => {
  const match = url.match(
    /https:\/\/iframe\.mediadelivery\.net\/embed\/\d+\/([a-f0-9-]+)/
  )
  return match ? match[1] : null
}

const getConvexSiteUrl = () =>
  clientEnv.NEXT_PUBLIC_CONVEX_URL.replace(".cloud", ".site")

export function useVideoMetadata(
  options: UseVideoMetadataOptions
): UseVideoMetadataResult {
  const { mediaUrls, enabled = true } = options
  const { getToken } = useAuth()
  const [metadata, setMetadata] = useState<
    Record<string, BunnyVideoGetResponse>
  >({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Extract video GUIDs
  const videoGuids = useMemo(() => {
    return mediaUrls
      .filter((url) => url.startsWith("https://iframe.mediadelivery.net/embed/"))
      .map((url) => extractVideoGuidFromUrl(url))
      .filter((guid): guid is string => guid !== null)
  }, [mediaUrls])

  // Stable key to prevent unnecessary refetches
  const videoGuidsKey = useMemo(() => videoGuids.join(","), [videoGuids])

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!enabled || videoGuids.length === 0) return

      setIsLoading(true)
      setError(null)

      try {
        const token = await getToken({ template: "convex" })
        if (!token) {
          throw new Error("Not authenticated")
        }

        const siteUrl = getConvexSiteUrl()
        const response = await fetch(`${siteUrl}/api/bunny/metadata`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoGuids }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data) {
          setMetadata(result.data)
        } else {
          throw new Error("Invalid response from metadata API")
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        logger.error("Failed to fetch video metadata", error)
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoGuidsKey, enabled])

  return { metadata, isLoading, error }
}
