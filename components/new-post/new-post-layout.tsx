"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { ArrowLeft, LoaderCircle, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"
import { z } from "zod"
import { PageContainer } from "@/components/layout/page-container"
import { POST_CROP_PRESETS } from "@/components/shared/image-crop/aspect-ratio-presets"
import { ImageCropDialog } from "@/components/shared/image-crop/image-crop-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { api } from "@/convex/_generated/api"
import { useBunnyUpload, useCurrentUser } from "@/hooks"
import { logger } from "@/lib/config/logger"
import { cn } from "@/lib/utils"
import { postFormSchema } from "@/schemas/post"
import {
  AdultContentToggle,
  type MediaItem,
  MediaPreviewGrid,
  MediaUploadButton,
  type PostVisibility,
  UploadProgress,
  VisibilitySelector,
} from "./components"

type CropQueueState = {
  file: File
  imageSrc: string
  remainingFiles: File[]
} | null

export const NewPostLayout = () => {
  const router = useRouter()
  const { currentUser, isLoading } = useCurrentUser()
  const { uploadMedia } = useBunnyUpload()

  const createDraftAsset = useMutation(api.assetsDraft.createDraftAsset)
  const deleteDraftWithAsset = useMutation(api.assetsDraft.deleteDraftWithAsset)
  const deleteDraftWithoutAsset = useMutation(
    api.assetsDraft.deleteDraftWithoutAsset,
  )

  const [medias, setMedias] = useState<MediaItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  )
  const [visibility, setVisibility] = useState<PostVisibility>("public")
  const [isAdult, setIsAdult] = useState(false)
  const [cropQueue, setCropQueue] = useState<CropQueueState>(null)

  const isPostCreatedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediasRef = useRef(medias)

  useEffect(() => {
    mediasRef.current = medias
  }, [medias])

  useEffect(() => {
    return () => {
      if (mediasRef.current.length > 0 && !isPostCreatedRef.current) {
        mediasRef.current.forEach(async (media) => {
          try {
            await deleteDraftWithAsset({ mediaId: media.publicId })
          } catch (error) {
            logger.error("Failed to delete draft asset", error, {
              mediaId: media.publicId,
            })
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createPost = useMutation(api.posts.createPost)

  const form = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      content: "",
      media: [],
    },
  })

  useEffect(() => {
    if (!isLoading && currentUser?.accountType === "USER") {
      router.push("/")
    }
  }, [isLoading, currentUser?.accountType, router])

  if (isLoading || !currentUser) return null
  if (currentUser.accountType === "USER") return null

  const uploadSingleFile = async (file: File) => {
    setIsUploading(true)

    const randomSuffix = crypto.randomUUID().replace(/-/g, "").substring(0, 13)
    const fileExtension = file.name.split(".").pop()
    const fileName = `${currentUser._id}/${randomSuffix}.${fileExtension}`

    const fileKey = `${file.name}_${Date.now()}`
    setUploadProgress((prev) => ({ ...prev, [fileKey]: 0 }))

    try {
      const result = await uploadMedia({
        file,
        fileName,
        userId: currentUser._id,
        onProgress: (percent) => {
          setUploadProgress((prev) => ({ ...prev, [fileKey]: percent }))
        },
      })

      setUploadProgress((prev) => {
        const np = { ...prev }
        delete np[fileKey]
        return np
      })

      if (result.success) {
        const newMedia: MediaItem = {
          url: result.url,
          publicId: result.mediaId,
          type: result.type,
          mimeType: result.mimeType,
          fileName: result.fileName,
          fileSize: result.fileSize,
        }
        setMedias((prev) => [...prev, newMedia])
        if (currentUser) {
          await createDraftAsset({
            author: currentUser._id,
            mediaId: result.mediaId,
            mediaUrl: result.url,
            assetType: result.type,
          })
        }
        toast.success("Le média a été ajouté avec succès")
      } else {
        toast.error(`Erreur upload ${file.name}: ${result.error}`)
      }
    } catch (e) {
      setUploadProgress((prev) => {
        const np = { ...prev }
        delete np[fileKey]
        return np
      })
      logger.error("Failed to upload file", e, { fileName: file.name })
      toast.error(`Erreur upload ${file.name}`)
    } finally {
      setIsUploading(false)
    }
  }

  const startCropQueue = (files: File[]) => {
    const [first, ...rest] = files
    const objectUrl = URL.createObjectURL(first)
    setCropQueue({ file: first, imageSrc: objectUrl, remainingFiles: rest })
  }

  const processNextInQueue = () => {
    if (!cropQueue) return
    URL.revokeObjectURL(cropQueue.imageSrc)

    if (cropQueue.remainingFiles.length > 0) {
      const [next, ...rest] = cropQueue.remainingFiles
      const objectUrl = URL.createObjectURL(next)
      setCropQueue({ file: next, imageSrc: objectUrl, remainingFiles: rest })
    } else {
      setCropQueue(null)
    }
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // Snapshot into a regular array BEFORE resetting input (FileList is live and gets cleared)
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    if (fileInputRef.current) fileInputRef.current.value = ""

    const totalMediasAfterUpload = medias.length + files.length
    if (totalMediasAfterUpload > 5) {
      toast.error(
        `Limite de 5 médias par post. Vous avez ${medias.length} média(s) et essayez d'ajouter ${files.length} média(s).`,
      )
      return
    }

    const validFiles: File[] = []
    for (const file of Array.from(files)) {
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

    // Split: videos upload immediately, images go to crop queue
    const videoFiles = validFiles.filter((f) => f.type.startsWith("video/"))
    const imageFiles = validFiles.filter((f) => f.type.startsWith("image/"))

    // Upload videos immediately (no crop)
    for (const videoFile of videoFiles) {
      await uploadSingleFile(videoFile)
    }

    // Start crop queue for images
    if (imageFiles.length > 0) {
      startCropQueue(imageFiles)
    }
  }

  const handlePostCropConfirm = async (croppedBlob: Blob) => {
    if (!cropQueue) return
    const croppedFile = new File([croppedBlob], cropQueue.file.name, {
      type: croppedBlob.type,
    })
    processNextInQueue()
    await uploadSingleFile(croppedFile)
  }

  const handlePostCropSkip = async () => {
    if (!cropQueue) return
    const originalFile = cropQueue.file
    processNextInQueue()
    await uploadSingleFile(originalFile)
  }

  const handlePostCropCancel = () => {
    if (cropQueue) {
      URL.revokeObjectURL(cropQueue.imageSrc)
    }
    setCropQueue(null)
  }

  const handleRemoveMedia = async (index: number) => {
    const media = medias[index]
    setMedias((prev) => prev.filter((_, i) => i !== index))

    try {
      await deleteDraftWithAsset({ mediaId: media.publicId })
      toast.success("Média supprimé avec succès")
    } catch (error) {
      logger.error("Failed to delete media", error, { mediaId: media.publicId })
      toast.error("Erreur lors de la suppression du média")
    }
  }

  const onSubmit = async (data: z.infer<typeof postFormSchema>) => {
    startTransition(async () => {
      try {
        const mediaObjects = medias.map((media) => ({
          type: media.type,
          url: media.url,
          mediaId: media.publicId,
          mimeType: media.mimeType,
          fileName: media.fileName,
          fileSize: media.fileSize,
        }))

        await createPost({
          content: data.content,
          medias: mediaObjects,
          visibility: visibility,
          isAdult: isAdult,
        })

        isPostCreatedRef.current = true

        for (const media of medias) {
          await deleteDraftWithoutAsset({ mediaId: media.publicId })
        }

        toast.success("Votre publication a été partagée")
        router.push("/")
      } catch (error) {
        logger.error("Failed to create post", error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  // Crop queue count for dialog title
  const remainingCount = cropQueue ? cropQueue.remainingFiles.length + 1 : 0

  // Back button component
  const BackButton = (
    <Button
      variant="ghost"
      size="icon"
      className="hover:bg-primary/10 size-9 rounded-full"
      asChild
    >
      <Link href="/">
        <ArrowLeft className="size-5" />
      </Link>
    </Button>
  )

  return (
    <PageContainer title="Nouvelle publication" headerLeftAction={BackButton}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="p-4"
      >
        {/* Form Card - Glass Premium Style */}
        <div
          className={cn(
            "relative rounded-2xl",
            "glass-premium",
            "border-primary/10 border",
            "p-5 md:p-6",
          )}
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="ring-background size-12 shrink-0 ring-2">
              {currentUser?.image ? (
                <AvatarImage
                  src={currentUser.image}
                  alt={currentUser?.username || "Profile image"}
                />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {currentUser?.name?.charAt(0) || "?"}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Form */}
            <div className="min-w-0 flex-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex w-full flex-col">
                            <TextareaAutosize
                              placeholder="Partagez quelque chose avec vos fans..."
                              className={cn(
                                "w-full resize-none border-none bg-transparent",
                                "placeholder:text-muted-foreground/50 text-lg",
                                "outline-none focus:outline-none",
                              )}
                              minRows={3}
                              maxRows={12}
                              {...field}
                            />

                            {/* Media Preview Grid */}
                            <MediaPreviewGrid
                              medias={medias}
                              onRemove={handleRemoveMedia}
                            />

                            {/* Upload Progress */}
                            <UploadProgress
                              progress={uploadProgress}
                              isUploading={isUploading}
                            />

                            {/* Divider */}
                            <div className="bg-border my-5 h-px" />

                            {/* Actions Bar */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              {/* Left Actions */}
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  multiple
                                  accept="image/*,video/*"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                />

                                {/* Media Button */}
                                <MediaUploadButton
                                  mediaCount={medias.length}
                                  maxMedia={5}
                                  isPending={isPending}
                                  isUploading={isUploading}
                                  onUploadClick={() =>
                                    fileInputRef.current?.click()
                                  }
                                />

                                {/* Visibility Selector */}
                                <VisibilitySelector
                                  value={visibility}
                                  onChange={setVisibility}
                                />

                                {/* Adult Content Toggle */}
                                <AdultContentToggle
                                  value={isAdult}
                                  onChange={setIsAdult}
                                  disabled={isPending || isUploading}
                                />
                              </div>

                              {/* Submit Button */}
                              <Button
                                type="submit"
                                disabled={isPending || isUploading}
                                className={cn(
                                  "h-10 rounded-full px-6",
                                  "font-semibold tracking-wide",
                                  "w-full sm:w-auto",
                                )}
                              >
                                {isPending ? (
                                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                                ) : (
                                  <Sparkles className="mr-2 size-4" />
                                )}
                                Publier
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        {field.value && <FormMessage />}
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Crop Dialog for images */}
      {cropQueue && (
        <ImageCropDialog
          imageSrc={cropQueue.imageSrc}
          open={true}
          onOpenChange={(open) => {
            if (!open) handlePostCropCancel()
          }}
          onConfirm={handlePostCropConfirm}
          onCancel={handlePostCropCancel}
          onSkip={handlePostCropSkip}
          showSkip={true}
          cropShape="rect"
          presets={POST_CROP_PRESETS}
          title={
            remainingCount > 1
              ? `Recadrer l'image (${remainingCount} restante${remainingCount > 1 ? "s" : ""})`
              : "Recadrer l'image"
          }
        />
      )}
    </PageContainer>
  )
}
