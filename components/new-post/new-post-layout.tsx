"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { CircleX, Globe, ImagePlus, LoaderCircle, Lock } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"
import { z } from "zod"
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
import { uploadBunnyAsset } from "@/lib/bunny"
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

  useEffect(() => {
    return () => {
      // Nettoie tous les assets si le post n'a pas été créé
      if (medias.length > 0 && !isPostCreatedRef.current) {
        medias.forEach(async (media) => {
          try {
            await deleteDraftWithAsset({ mediaId: media.publicId })
          } catch (error) {
            console.error("Erreur lors de la suppression de l'asset:", error)
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteDraftWithAsset])

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

    // Vérifier la limite de 5 médias
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
        } catch (e: any) {
          setUploadProgress((prev) => {
            const np = { ...prev }
            delete np[fileKey]
            return np
          })
          console.error(e)
          toast.error(`Erreur upload ${file.name}`)
        }
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveMedia = async (index: number) => {
    const media = medias[index]

    // Supprimer le média du tableau
    setMedias((prev) => prev.filter((_, i) => i !== index))

    try {
      await deleteDraftWithAsset({ mediaId: media.publicId })
      toast.success("Média supprimé avec succès")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
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

        // Marquer le post comme créé
        isPostCreatedRef.current = true

        // Supprimer tous les draft assets après création du post
        for (const media of medias) {
          await deleteDraftWithoutAsset({ mediaId: media.publicId })
        }

        toast.success("Votre publication a été partagée")
        router.push("/")
      } catch (error) {
        console.error(error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-lg:w-[80%] max-sm:w-full">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Nouvelle publication
      </h1>

      <div className="border-muted relative flex items-stretch space-x-3 border-b px-4 py-5">
        <Avatar>
          {currentUser?.image ? (
            <AvatarImage
              src={currentUser.image}
              width={100}
              height={100}
              className="aspect-square h-full w-full object-cover"
              alt={currentUser?.username || "Profile image"}
            />
          ) : (
            <AvatarFallback className="size-11">
              <div className="animate-pulse rounded-full bg-gray-500"></div>
            </AvatarFallback>
          )}
        </Avatar>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex h-full w-full flex-col">
                      <TextareaAutosize
                        placeholder="Ecrivez une nouvelle publication"
                        className="mt-1 h-full w-full resize-none border-none text-xl outline-hidden"
                        minRows={2}
                        maxRows={10}
                        {...field}
                      />

                      {medias.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                          {medias.map((media, index) => (
                            <div key={media.publicId} className="relative">
                              <Button
                                type="button"
                                size={"icon"}
                                className="bg-muted absolute top-3 right-[10px] z-10 size-8"
                                onClick={() => handleRemoveMedia(index)}
                              >
                                <CircleX size={22} />
                              </Button>

                              {/* Affichage conditionnel selon le type de média */}
                              {media.type === "video" ? (
                                <div className="mt-2">
                                  <iframe
                                    src={media.url}
                                    loading="lazy"
                                    width={500}
                                    height={300}
                                    allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              ) : (
                                <Image
                                  src={media.url}
                                  alt=""
                                  width={500}
                                  height={300}
                                  className="mt-2 max-h-[300px] w-full rounded-md object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          {!currentUser ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className={cn(
                                "border-muted flex items-center gap-2 rounded-full hover:bg-blue-600/15 hover:text-blue-500",
                                "cursor-not-allowed opacity-60",
                              )}
                              disabled
                            >
                              <ImagePlus size={18} />
                              <span className="hidden sm:inline">Média</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="default"
                              className={cn(
                                "border-muted flex items-center gap-2 rounded-full",
                                {
                                  "cursor-not-allowed":
                                    isPending ||
                                    isUploading ||
                                    medias.length >= 5,
                                },
                              )}
                              onClick={() => fileInputRef.current?.click()}
                              disabled={
                                isPending || isUploading || medias.length >= 5
                              }
                            >
                              {isUploading ? (
                                <LoaderCircle
                                  className="animate-spin"
                                  size={18}
                                />
                              ) : (
                                <ImagePlus size={18} />
                              )}
                              <span className="hidden sm:inline">
                                {isUploading
                                  ? "Upload..."
                                  : medias.length >= 5
                                    ? "Limite atteinte"
                                    : `Média (${medias.length}/5)`}
                              </span>
                            </Button>
                          )}

                          {/* Sélecteur de visibilité */}
                          <Select
                            defaultValue="public"
                            onValueChange={(value) =>
                              setVisibility(
                                value as "public" | "subscribers_only",
                              )
                            }
                          >
                            <SelectTrigger className="border-muted hover:bg-muted/30 h-9 w-auto rounded-full bg-transparent">
                              {visibility === "public" ? (
                                <div className="flex items-center gap-2">
                                  <Globe size={18} className="text-green-500" />
                                  <span className="hidden sm:inline">
                                    Tout le monde
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Lock size={18} className="text-primary" />
                                  <span className="hidden sm:inline">
                                    Fans uniquement
                                  </span>
                                </div>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">
                                <div className="flex items-center gap-2">
                                  <Globe size={16} className="text-green-500" />
                                  <span>Tout le monde</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="subscribers_only">
                                <div className="flex items-center gap-2">
                                  <Lock size={16} className="text-primary" />
                                  <span>Fans uniquement</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="submit"
                          disabled={isPending || isUploading}
                          className="w-full rounded-full px-4 py-2 font-bold sm:w-auto"
                        >
                          {isPending ? (
                            <LoaderCircle className="mr-2 animate-spin" />
                          ) : null}
                          <span>Publier</span>
                        </Button>
                      </div>
                      {isUploading &&
                        Object.keys(uploadProgress).length > 0 && (
                          <div className="mt-4 space-y-2">
                            {Object.entries(uploadProgress).map(
                              ([key, prog]) => (
                                <div
                                  key={key}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <div className="bg-muted h-2 w-full rounded-full">
                                    <div
                                      className="bg-primary h-2 rounded-full transition-all"
                                      style={{ width: `${prog}%` }}
                                    />
                                  </div>
                                  <span className="w-10 text-right tabular-nums">
                                    {prog}%
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  </FormControl>
                  {field.value && <FormMessage />}
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </main>
  )
}
