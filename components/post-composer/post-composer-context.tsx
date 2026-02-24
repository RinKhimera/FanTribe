"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import { useBunnyUpload } from "@/hooks"
import { logger } from "@/lib/config/logger"
import { MediaItem } from "@/components/new-post/components/media-preview-grid"
import { PostVisibility } from "@/components/new-post/components/visibility-selector"
import type {
  PostComposerContextValue,
  PostComposerConfig,
  MediaMode,
  CropQueueState,
} from "./types"
import {
  PostComposerConfigContext,
  PostComposerFormContext,
  PostComposerMediaContext,
  usePostComposerConfig,
  usePostComposerForm,
  usePostComposerMedia,
} from "./contexts"

/**
 * Convenience hook — assembles all 3 sub-contexts into the original
 * { state, actions, config } shape. 100% backward compatible.
 */
export const usePostComposer = (): PostComposerContextValue => {
  const config = usePostComposerConfig()
  const form = usePostComposerForm()
  const media = usePostComposerMedia()

  return useMemo(
    (): PostComposerContextValue => ({
      state: {
        content: form.content,
        medias: media.medias,
        visibility: form.visibility,
        isAdult: form.isAdult,
        upload: media.upload,
        cropQueue: media.cropQueue,
        isPending: form.isPending,
        mediaMode: media.mediaMode,
        canAddMedia: media.canAddMedia,
        fileAccept: media.fileAccept,
      },
      actions: {
        setContent: form.setContent,
        addMedia: media.addMedia,
        removeMedia: media.removeMedia,
        reorderMedias: media.reorderMedias,
        setVisibility: form.setVisibility,
        setIsAdult: form.setIsAdult,
        startUpload: media.startUpload,
        updateUploadProgress: media.updateUploadProgress,
        finishUpload: media.finishUpload,
        startCropQueue: media.startCropQueue,
        processNextInQueue: media.processNextInQueue,
        cancelCropQueue: media.cancelCropQueue,
        handleCropConfirm: media.handleCropConfirm,
        handleCropSkip: media.handleCropSkip,
        handleCropCancel: media.handleCropCancel,
        handleFileSelect: media.handleFileSelect,
        submit: form.submit,
        reset: form.reset,
      },
      config,
    }),
    [config, form, media],
  )
}

type PostComposerProviderProps = {
  config: PostComposerConfig
  children: React.ReactNode
}

export function PostComposerProvider({ config, children }: PostComposerProviderProps) {
  // --- States ---
  const [content, setContent] = useState("")
  const [medias, setMedias] = useState<MediaItem[]>([])
  const [visibility, setVisibility] = useState<PostVisibility>("public")
  const [isAdult, setIsAdult] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [cropQueue, setCropQueue] = useState<CropQueueState>({ current: null, remaining: [] })

  // Refs
  const isPostCreatedRef = useRef(false)
  const mediasRef = useRef(medias)

  // Update mediasRef when medias change
  useEffect(() => {
    mediasRef.current = medias
  }, [medias])

  // Mutations
  const createPost = useMutation(api.posts.createPost)
  const createDraftAsset = useMutation(api.assetsDraft.createDraftAsset)
  const deleteDraftWithAsset = useMutation(api.assetsDraft.deleteDraftWithAsset)
  const deleteDraftWithoutAsset = useMutation(api.assetsDraft.deleteDraftWithoutAsset)

  const { uploadMedia } = useBunnyUpload()

  // Cleanup drafts on unmount
  useEffect(() => {
    return () => {
      if (mediasRef.current.length > 0 && !isPostCreatedRef.current) {
        mediasRef.current.forEach(async (media) => {
          try {
            await deleteDraftWithAsset({ mediaId: media.publicId })
          } catch (error) {
            logger.error("Failed to delete draft asset on unmount", error, {
              mediaId: media.publicId,
            })
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Derived state ---
  const mediaMode: MediaMode = useMemo(() => {
    if (medias.length === 0) return "empty"
    return medias[0].type === "video" ? "video" : "images"
  }, [medias])

  const canAddMedia = useMemo(() => {
    if (mediaMode === "video") return false
    return medias.length < config.maxMedia
  }, [mediaMode, medias.length, config.maxMedia])

  const fileAccept = useMemo(() => {
    if (mediaMode === "images") return "image/*"
    if (mediaMode === "video") return "video/*"
    return "image/*,video/*"
  }, [mediaMode])

  // --- Actions ---

  const addMedia = useCallback((media: MediaItem) => {
    setMedias((prev) => [...prev, media])
  }, [])

  const removeMedia = useCallback(
    async (index: number) => {
      const media = medias[index]
      setMedias((prev) => prev.filter((_, i) => i !== index))

      try {
        await deleteDraftWithAsset({ mediaId: media.publicId })
        toast.success("Média supprimé avec succès")
      } catch (error) {
        logger.error("Failed to delete media", error, { mediaId: media.publicId })
        toast.error("Erreur lors de la suppression du média")
      }
    },
    [medias, deleteDraftWithAsset],
  )

  const reorderMedias = useCallback((reordered: MediaItem[]) => {
    setMedias(reordered)
  }, [])

  const startUpload = useCallback((fileKey: string) => {
    setUploadProgress((prev) => ({ ...prev, [fileKey]: 0 }))
  }, [])

  const updateUploadProgress = useCallback((fileKey: string, percent: number) => {
    setUploadProgress((prev) => ({ ...prev, [fileKey]: percent }))
  }, [])

  const finishUpload = useCallback((fileKey: string) => {
    setUploadProgress((prev) => {
      const newProgress = { ...prev }
      delete newProgress[fileKey]
      return newProgress
    })
  }, [])

  const uploadSingleFile = useCallback(
    async (file: File) => {
      setIsUploading(true)

      const randomSuffix = crypto.randomUUID().replace(/-/g, "").substring(0, 13)
      const fileExtension = file.name.split(".").pop()
      const fileName = `${config.userId}/${randomSuffix}.${fileExtension}`

      const fileKey = `${file.name}_${Date.now()}`
      startUpload(fileKey)

      try {
        const result = await uploadMedia({
          file,
          fileName,
          userId: config.userId,
          onProgress: (percent) => {
            updateUploadProgress(fileKey, percent)
          },
        })

        finishUpload(fileKey)

        if (result.success) {
          const newMedia: MediaItem = {
            url: result.url,
            publicId: result.mediaId,
            type: result.type,
            mimeType: result.mimeType,
            fileName: result.fileName,
            fileSize: result.fileSize,
            width: result.width,
            height: result.height,
            thumbnailUrl: result.thumbnailUrl,
          }
          addMedia(newMedia)
          await createDraftAsset({
            author: config.userId,
            mediaId: result.mediaId,
            mediaUrl: result.url,
            assetType: result.type,
          })
          toast.success("Le média a été ajouté avec succès")
        } else {
          toast.error(`Erreur upload ${file.name}: ${result.error}`)
        }
      } catch (e) {
        finishUpload(fileKey)
        logger.error("Failed to upload file", e, { fileName: file.name })
        toast.error(`Erreur upload ${file.name}`)
      } finally {
        setIsUploading(false)
      }
    },
    [config.userId, uploadMedia, startUpload, updateUploadProgress, finishUpload, addMedia, createDraftAsset],
  )

  const startCropQueue = useCallback((files: File[]) => {
    if (files.length === 0) return
    const [first, ...rest] = files
    const objectUrl = URL.createObjectURL(first)
    setCropQueue({ current: { file: first, imageSrc: objectUrl }, remaining: rest })
  }, [])

  const processNextInQueue = useCallback(() => {
    setCropQueue((prev) => {
      if (!prev.current) return prev

      // Revoke current ObjectURL
      URL.revokeObjectURL(prev.current.imageSrc)

      // Move to next file
      if (prev.remaining.length > 0) {
        const [next, ...rest] = prev.remaining
        const objectUrl = URL.createObjectURL(next)
        return { current: { file: next, imageSrc: objectUrl }, remaining: rest }
      }

      // Queue finished
      return { current: null, remaining: [] }
    })
  }, [])

  const cancelCropQueue = useCallback(() => {
    setCropQueue((prev) => {
      if (prev.current) {
        URL.revokeObjectURL(prev.current.imageSrc)
      }
      return { current: null, remaining: [] }
    })
  }, [])

  const handleCropConfirm = useCallback(
    async (croppedBlob: Blob) => {
      if (!cropQueue.current) return
      const croppedFile = new File([croppedBlob], cropQueue.current.file.name, {
        type: croppedBlob.type,
      })
      processNextInQueue()
      await uploadSingleFile(croppedFile)
    },
    [cropQueue, processNextInQueue, uploadSingleFile],
  )

  const handleCropSkip = useCallback(async () => {
    if (!cropQueue.current) return
    const originalFile = cropQueue.current.file
    processNextInQueue()
    await uploadSingleFile(originalFile)
  }, [cropQueue, processNextInQueue, uploadSingleFile])

  const handleCropCancel = useCallback(() => {
    // Cancel = skip current image, continue with remaining files
    processNextInQueue()
  }, [processNextInQueue])

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      // Snapshot into a regular array BEFORE resetting input (FileList is live)
      const files = Array.from(event.target.files ?? [])
      if (files.length === 0) return

      // Reset input
      if (event.target) event.target.value = ""

      // Validate individual files
      const validFiles: File[] = []
      for (const file of files) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          toast.error(`Format non supporté: ${file.name}`)
          continue
        }
        if (file.size > 300 * 1024 * 1024) {
          toast.error(`Fichier trop volumineux: ${file.name} (max 300MB)`)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length === 0) return

      const videoFiles = validFiles.filter((f) => f.type.startsWith("video/"))
      const imageFiles = validFiles.filter((f) => f.type.startsWith("image/"))

      // No-mix enforcement
      if (mediaMode === "video") {
        toast.error("1 seule vidéo par post. Supprimez la vidéo actuelle pour ajouter d'autres médias.")
        return
      }
      if (mediaMode === "images" && videoFiles.length > 0) {
        toast.error("Impossible de mixer images et vidéos dans un même post.")
        return
      }
      if (mediaMode === "empty" && videoFiles.length > 0 && imageFiles.length > 0) {
        toast.error("Impossible de mixer images et vidéos dans un même post.")
        return
      }

      // Video mode: accept only 1 video
      if (videoFiles.length > 0) {
        if (videoFiles.length > 1) {
          toast.error("1 seule vidéo par post.")
        }
        await uploadSingleFile(videoFiles[0])
        return
      }

      // Image mode: check limit
      const totalAfterUpload = medias.length + imageFiles.length
      if (totalAfterUpload > config.maxMedia) {
        toast.error(
          `Limite de ${config.maxMedia} images par post. Vous avez ${medias.length} image(s) et essayez d'en ajouter ${imageFiles.length}.`,
        )
        return
      }

      // Start crop queue for images
      startCropQueue(imageFiles)
    },
    [mediaMode, medias.length, config.maxMedia, uploadSingleFile, startCropQueue],
  )

  const submit = useCallback(async () => {
    startTransition(async () => {
      try {
        const mediaObjects = medias.map((media) => ({
          type: media.type,
          url: media.url,
          mediaId: media.publicId,
          mimeType: media.mimeType,
          fileName: media.fileName,
          fileSize: media.fileSize,
          width: media.width,
          height: media.height,
          thumbnailUrl: media.thumbnailUrl,
        }))

        const result = await createPost({
          content,
          medias: mediaObjects,
          visibility,
          isAdult,
        })

        isPostCreatedRef.current = true

        // Cleanup draft assets
        for (const media of medias) {
          await deleteDraftWithoutAsset({ mediaId: media.publicId })
        }

        toast.success("Votre publication a été partagée")
        config.onSuccess?.(result.postId)
      } catch (error) {
        logger.error("Failed to create post", error)
        toast.error("Une erreur s'est produite !", {
          description: "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }, [content, medias, visibility, isAdult, createPost, deleteDraftWithoutAsset, config])

  const reset = useCallback(() => {
    setContent("")
    setMedias([])
    setVisibility("public")
    setIsAdult(false)
    setUploadProgress({})
    setCropQueue({ current: null, remaining: [] })
    isPostCreatedRef.current = false
  }, [])

  // --- Sub-context values ---
  const formValue = useMemo(
    () => ({
      content,
      visibility,
      isAdult,
      isPending,
      setContent,
      setVisibility,
      setIsAdult,
      submit,
      reset,
    }),
    [content, visibility, isAdult, isPending, setContent, setVisibility, setIsAdult, submit, reset],
  )

  const mediaValue = useMemo(
    () => ({
      medias,
      mediaMode,
      canAddMedia,
      fileAccept,
      upload: { isUploading, progress: uploadProgress },
      cropQueue,
      addMedia,
      removeMedia,
      reorderMedias,
      startUpload,
      updateUploadProgress,
      finishUpload,
      startCropQueue,
      processNextInQueue,
      cancelCropQueue,
      handleCropConfirm,
      handleCropSkip,
      handleCropCancel,
      handleFileSelect,
    }),
    [
      medias,
      mediaMode,
      canAddMedia,
      fileAccept,
      isUploading,
      uploadProgress,
      cropQueue,
      addMedia,
      removeMedia,
      reorderMedias,
      startUpload,
      updateUploadProgress,
      finishUpload,
      startCropQueue,
      processNextInQueue,
      cancelCropQueue,
      handleCropConfirm,
      handleCropSkip,
      handleCropCancel,
      handleFileSelect,
    ],
  )

  return (
    <PostComposerConfigContext.Provider value={config}>
      <PostComposerFormContext.Provider value={formValue}>
        <PostComposerMediaContext.Provider value={mediaValue}>
          {children}
        </PostComposerMediaContext.Provider>
      </PostComposerFormContext.Provider>
    </PostComposerConfigContext.Provider>
  )
}
