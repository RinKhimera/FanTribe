"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { motion } from "motion/react"
import {
  ArrowLeft,
  CircleX,
  Globe,
  ImagePlus,
  LoaderCircle,
  Lock,
  Sparkles,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"
import { z } from "zod"
import { PageContainer } from "@/components/layout/page-container"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { logger } from "@/lib/config/logger"
import { uploadBunnyAsset } from "@/lib/services/bunny"
import { cn } from "@/lib/utils"
import { postFormSchema } from "@/schemas/post"
import { BunnyApiResponse } from "@/types"

export const NewPostLayout = () => {
  const router = useRouter()
  const { currentUser, isLoading } = useCurrentUser()

  const createDraftAsset = useMutation(api.assetsDraft.createDraftAsset)
  const deleteDraftWithAsset = useMutation(api.assetsDraft.deleteDraftWithAsset)
  const deleteDraftWithoutAsset = useMutation(
    api.assetsDraft.deleteDraftWithoutAsset,
  )

  const [medias, setMedias] = useState<
    { url: string; publicId: string; type: "image" | "video" }[]
  >([])
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  )
  const [visibility, setVisibility] = useState<"public" | "subscribers_only">(
    "public",
  )

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

  if (isLoading || !currentUser) return null
  if (currentUser.accountType === "USER") router.push("/")

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const totalMediasAfterUpload = medias.length + files.length
    if (totalMediasAfterUpload > 5) {
      toast.error(
        `Limite de 5 médias par post. Vous avez ${medias.length} média(s) et essayez d'ajouter ${files.length} média(s).`,
      )
      return
    }

    setIsUploading(true)

    try {
      for (const file of Array.from(files)) {
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          toast.error(`Format non supporté: ${file.name}`)
          continue
        }
        if (file.size > 300 * 1024 * 1024) {
          toast.error(`Fichier trop volumineux: ${file.name} (max 300MB)`)
          continue
        }

        const randomSuffix = crypto
          .randomUUID()
          .replace(/-/g, "")
          .substring(0, 13)
        const fileExtension = file.name.split(".").pop()
        const fileName = `${currentUser._id}/${randomSuffix}.${fileExtension}`

        const fileKey = `${file.name}_${Date.now()}`
        setUploadProgress((prev) => ({ ...prev, [fileKey]: 0 }))

        try {
          const result: BunnyApiResponse = await uploadBunnyAsset({
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
            const newMedia = {
              url: result.url,
              publicId: result.mediaId,
              type: result.type,
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
        }
      }
    } catch (error) {
      logger.error("Upload error", error)
      toast.error("Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
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
        data.media = medias.map((media) => media.url)

        await createPost({
          content: data.content,
          medias: data.media,
          visibility: visibility,
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

  // Back button component
  const BackButton = (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 rounded-full hover:bg-primary/10"
      asChild
    >
      <Link href="/">
        <ArrowLeft className="size-5" />
      </Link>
    </Button>
  )

  return (
    <PageContainer
      title="Nouvelle publication"
      headerLeftAction={BackButton}
    >
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
            "border border-primary/10",
            "p-5 md:p-6",
          )}
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="size-12 shrink-0 ring-2 ring-background">
              {currentUser?.image ? (
                <AvatarImage
                  src={currentUser.image}
                  width={100}
                  height={100}
                  className="aspect-square h-full w-full object-cover"
                  alt={currentUser?.username || "Profile image"}
                />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {currentUser?.name?.charAt(0) || "?"}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Form */}
            <div className="flex-1 min-w-0">
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
                                "text-lg placeholder:text-muted-foreground/50",
                                "outline-none focus:outline-none",
                              )}
                              minRows={3}
                              maxRows={12}
                              {...field}
                            />

                            {/* Media Preview Grid */}
                            {medias.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 grid grid-cols-2 gap-3"
                              >
                                {medias.map((media, index) => (
                                  <motion.div
                                    key={media.publicId}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group relative overflow-hidden rounded-xl"
                                  >
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="secondary"
                                      className={cn(
                                        "absolute top-2 right-2 z-10 size-8",
                                        "bg-black/60 hover:bg-black/80",
                                        "opacity-0 group-hover:opacity-100",
                                        "transition-opacity duration-200",
                                      )}
                                      onClick={() => handleRemoveMedia(index)}
                                    >
                                      <CircleX className="size-5 text-white" />
                                    </Button>

                                    {media.type === "video" ? (
                                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
                                        <iframe
                                          src={media.url}
                                          loading="lazy"
                                          className="w-full h-full"
                                          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                                          allowFullScreen
                                        />
                                      </div>
                                    ) : (
                                      <Image
                                        src={media.url}
                                        alt=""
                                        width={500}
                                        height={300}
                                        className="aspect-video w-full rounded-xl object-cover"
                                      />
                                    )}
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}

                            {/* Upload Progress */}
                            {isUploading &&
                              Object.keys(uploadProgress).length > 0 && (
                                <div className="mt-4 space-y-2">
                                  {Object.entries(uploadProgress).map(
                                    ([key, prog]) => (
                                      <div
                                        key={key}
                                        className="flex items-center gap-3"
                                      >
                                        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                                          <motion.div
                                            className="h-full bg-primary rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${prog}%` }}
                                            transition={{ duration: 0.3 }}
                                          />
                                        </div>
                                        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                                          {prog}%
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}

                            {/* Divider */}
                            <div className="h-px bg-border my-5" />

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
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "rounded-full h-10 gap-2",
                                    "hover:bg-primary/10 hover:text-primary hover:border-primary/30",
                                    "transition-all duration-200",
                                    (isPending ||
                                      isUploading ||
                                      medias.length >= 5) &&
                                      "opacity-50 cursor-not-allowed",
                                  )}
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={
                                    isPending ||
                                    isUploading ||
                                    medias.length >= 5
                                  }
                                >
                                  {isUploading ? (
                                    <LoaderCircle className="size-4 animate-spin" />
                                  ) : (
                                    <ImagePlus className="size-4" />
                                  )}
                                  <span className="hidden sm:inline">
                                    {isUploading
                                      ? "Upload..."
                                      : medias.length >= 5
                                        ? "Limite atteinte"
                                        : `Média (${medias.length}/5)`}
                                  </span>
                                </Button>

                                {/* Visibility Selector */}
                                <Select
                                  defaultValue="public"
                                  onValueChange={(value) =>
                                    setVisibility(
                                      value as "public" | "subscribers_only",
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={cn(
                                      "h-10 w-auto rounded-full bg-transparent",
                                      "border-border hover:bg-muted/50",
                                      "transition-all duration-200",
                                    )}
                                  >
                                    {visibility === "public" ? (
                                      <div className="flex items-center gap-2">
                                        <Globe className="size-4 text-green-500" />
                                        <span className="hidden sm:inline text-sm">
                                          Tout le monde
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <Lock className="size-4 text-primary" />
                                        <span className="hidden sm:inline text-sm">
                                          Fans uniquement
                                        </span>
                                      </div>
                                    )}
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="public">
                                      <div className="flex items-center gap-2">
                                        <Globe className="size-4 text-green-500" />
                                        <span>Tout le monde</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="subscribers_only">
                                      <div className="flex items-center gap-2">
                                        <Lock className="size-4 text-primary" />
                                        <span>Fans uniquement</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Submit Button */}
                              <Button
                                type="submit"
                                disabled={isPending || isUploading}
                                className={cn(
                                  "rounded-full px-6 h-10",
                                  "font-semibold tracking-wide",
                                  "w-full sm:w-auto",
                                )}
                              >
                                {isPending ? (
                                  <LoaderCircle className="size-4 mr-2 animate-spin" />
                                ) : (
                                  <Sparkles className="size-4 mr-2" />
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
    </PageContainer>
  )
}
