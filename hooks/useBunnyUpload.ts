"use client"

import { useAuth } from "@clerk/nextjs"
import { useCallback, useRef, useState } from "react"
import { clientEnv } from "@/lib/config/env.client"

// ============================================================================
// Types
// ============================================================================

type UploadMediaResult = {
  success: boolean
  url: string
  mediaId: string
  type: "image" | "video"
  mimeType: string
  fileName: string
  fileSize: number
  width?: number
  height?: number
  thumbnailUrl?: string
  error?: string
}

type DeleteMediaResult = {
  success: boolean
}

// ============================================================================
// Helpers
// ============================================================================

/** Derive convex.site URL from convex.cloud URL */
const getConvexSiteUrl = () =>
  clientEnv.NEXT_PUBLIC_CONVEX_URL.replace(".cloud", ".site")

/** Extract image dimensions from a File using an ObjectURL + Image element */
function extractImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

// ============================================================================
// Hook
// ============================================================================

export function useBunnyUpload() {
  const { getToken } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Upload un media (image ou video).
   *
   * - Images : POST FormData vers convex.site/api/bunny/upload-image
   * - Videos : 1) POST vers convex.site/api/bunny/upload-video (obtient token)
   *            2) PUT direct vers Bunny Stream (progress reel via XHR)
   */
  const uploadMedia = useCallback(
    async (options: {
      file: File
      fileName: string
      userId: string
      onProgress?: (percent: number) => void
    }): Promise<UploadMediaResult> => {
      const { file, fileName, userId, onProgress } = options

      setIsUploading(true)
      const fileKey = `${file.name}_${Date.now()}`

      try {
        const token = await getToken({ template: "convex" })
        if (!token) {
          return {
            success: false,
            url: "",
            mediaId: "",
            type: file.type.startsWith("video/") ? "video" : "image",
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
            error: "Non authentifie",
          }
        }

        const siteUrl = getConvexSiteUrl()

        if (file.type.startsWith("video/")) {
          // ── VIDEO : 2-step (token + upload direct) ──

          // Step 1 : Obtenir le token d'upload depuis Convex
          const tokenRes = await fetch(`${siteUrl}/api/bunny/upload-video`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fileName, userId }),
          })

          if (!tokenRes.ok) {
            const err = await tokenRes.json()
            return {
              success: false,
              url: "",
              mediaId: "",
              type: "video",
              mimeType: file.type,
              fileName: file.name,
              fileSize: file.size,
              error: err.error || "Erreur creation video",
            }
          }

          const { videoId, accessKey, libraryId, embedUrl, thumbnailUrl } =
            await tokenRes.json()

          // Step 2 : Upload direct vers Bunny Stream avec progress reel
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            abortControllerRef.current = new AbortController()

            xhr.open(
              "PUT",
              `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
            )
            xhr.setRequestHeader("AccessKey", accessKey)
            xhr.setRequestHeader("Content-Type", file.type)

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100)
                setProgress((prev) => ({ ...prev, [fileKey]: pct }))
                onProgress?.(pct)
              }
            }

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setProgress((prev) => {
                  const np = { ...prev }
                  delete np[fileKey]
                  return np
                })
                onProgress?.(100)
                resolve()
              } else {
                reject(new Error(`Upload video echoue: ${xhr.status}`))
              }
            }

            xhr.onerror = () => reject(new Error("Erreur reseau upload video"))

            abortControllerRef.current.signal.addEventListener("abort", () => {
              xhr.abort()
              reject(new Error("Upload annule"))
            })

            xhr.send(file)
          })

          return {
            success: true,
            url: embedUrl,
            mediaId: videoId,
            type: "video",
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
            thumbnailUrl,
          }
        } else {
          // ── IMAGE : upload via Convex HTTP Action ──

          // Extract dimensions before upload (instant — reads file header only)
          const dimensions = await extractImageDimensions(file)

          // Simuler le progress (comme NOMAQbanq)
          let simulatedProgress = 0
          const progressInterval = setInterval(() => {
            if (simulatedProgress < 90) {
              simulatedProgress += 10
              setProgress((prev) => ({
                ...prev,
                [fileKey]: simulatedProgress,
              }))
              onProgress?.(simulatedProgress)
            }
          }, 200)

          const formData = new FormData()
          formData.append("file", file)
          formData.append("fileName", fileName)

          const res = await fetch(`${siteUrl}/api/bunny/upload-image`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })

          clearInterval(progressInterval)

          if (!res.ok) {
            const err = await res.json()
            setProgress((prev) => {
              const np = { ...prev }
              delete np[fileKey]
              return np
            })
            return {
              success: false,
              url: "",
              mediaId: "",
              type: "image",
              mimeType: file.type,
              fileName: file.name,
              fileSize: file.size,
              error: err.error || "Erreur upload image",
            }
          }

          const result = await res.json()

          setProgress((prev) => {
            const np = { ...prev }
            delete np[fileKey]
            return np
          })
          onProgress?.(100)

          return {
            success: true,
            url: result.url,
            mediaId: result.mediaId,
            type: "image",
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
            width: dimensions.width || undefined,
            height: dimensions.height || undefined,
          }
        }
      } catch (error) {
        setProgress((prev) => {
          const np = { ...prev }
          delete np[fileKey]
          return np
        })
        return {
          success: false,
          url: "",
          mediaId: "",
          type: file.type.startsWith("video/") ? "video" : "image",
          mimeType: file.type,
          fileName: file.name,
          fileSize: file.size,
          error:
            error instanceof Error ? error.message : "Erreur inconnue",
        }
      } finally {
        setIsUploading(false)
        abortControllerRef.current = null
      }
    },
    [getToken],
  )

  /**
   * Supprime un media via Convex HTTP Action.
   */
  const deleteMedia = useCallback(
    async (options: {
      mediaId?: string
      mediaUrl?: string
      type: "image" | "video"
    }): Promise<DeleteMediaResult> => {
      try {
        const token = await getToken({ template: "convex" })
        if (!token) return { success: false }

        const siteUrl = getConvexSiteUrl()

        const res = await fetch(`${siteUrl}/api/bunny/delete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mediaId: options.mediaId,
            mediaUrl: options.mediaUrl,
            type: options.type,
          }),
        })

        if (!res.ok) return { success: false }

        const result = await res.json()
        return { success: result.success }
      } catch {
        return { success: false }
      }
    },
    [getToken],
  )

  return {
    uploadMedia,
    deleteMedia,
    isUploading,
    progress,
  }
}
