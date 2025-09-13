"use client"

import {
  CloudinaryUploadWidget,
  CloudinaryUploadWidgetResults,
} from "@cloudinary-util/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { CircleX, Globe, ImagePlus, LoaderCircle, Lock } from "lucide-react"
import {
  CldImage,
  CldUploadWidget,
  CloudinaryUploadWidgetInfo,
} from "next-cloudinary"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"
import { z } from "zod"
import { deleteAsset } from "@/actions/upload-cloudinary"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { cn } from "@/lib/utils"
import { postFormSchema } from "@/schemas/post"
import { ProfileImage } from "../shared/profile-image"

export const NewPostLayout = () => {
  const router = useRouter()

  const { currentUser } = useCurrentUser()

  const createDraftAsset = useMutation(api.assetsDraft.createDraftAsset)
  const deleteDraftAsset = useMutation(api.assetsDraft.deleteDraftAsset)

  const [medias, setMedias] = useState<
    { url: string; publicId: string; type: "image" | "video" }[]
  >([])
  const [isPending, startTransition] = useTransition()
  const [visibility, setVisibility] = useState<"public" | "subscribers_only">(
    "public",
  )

  const isPostCreatedRef = useRef(false)

  if (currentUser?.accountType === "USER") router.push("/")

  useEffect(() => {
    return () => {
      // Nettoie tous les assets si le post n'a pas été créé
      if (medias.length > 0 && !isPostCreatedRef.current) {
        medias.forEach((media) => {
          deleteAsset(media.publicId, media.type).catch((error) => {
            console.error("Erreur lors de la suppression de l'asset:", error)
          })

          deleteDraftAsset({ publicId: media.publicId }).catch((error) => {
            console.error("Erreur lors de la suppression du brouillon:", error)
          })
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteDraftAsset])

  const createPost = useMutation(api.posts.createPost)

  const form = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      content: "",
      media: [],
    },
  })

  const handleUploadSuccess = (
    result: CloudinaryUploadWidgetResults,
    widget: CloudinaryUploadWidget,
  ) => {
    const data = result.info as CloudinaryUploadWidgetInfo
    console.log("Upload réussi:", data)

    const isVideo = data.secure_url.startsWith(
      "https://res.cloudinary.com/onlyscam/video/",
    )

    const newMedia = {
      url: data.secure_url,
      publicId: data.public_id,
      type: (isVideo ? "video" : "image") as "image" | "video",
    }

    setMedias((prev) => [...prev, newMedia])

    if (currentUser) {
      createDraftAsset({
        author: currentUser._id,
        publicId: data.public_id,
        assetType: data.resource_type,
      }).catch((error) => {
        console.error("Erreur lors de l'enregistrement du brouillon:", error)
      })
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

        // Marquer le post comme créé en utilisant la référence
        isPostCreatedRef.current = true

        // Supprimer tous les draft assets après création du post
        medias.forEach(async (media) => {
          await deleteDraftAsset({ publicId: media.publicId })
        })

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
            <ProfileImage
              src={currentUser.image}
              width={100}
              height={100}
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
                                onClick={async () => {
                                  // Supprimer le média du tableau
                                  setMedias((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  )

                                  // Supprimer l'asset de Cloudinary
                                  await deleteAsset(media.publicId, media.type)

                                  // Supprimer le draft asset
                                  await deleteDraftAsset({
                                    publicId: media.publicId,
                                  })
                                }}
                              >
                                <CircleX size={22} />
                              </Button>

                              {/* Affichage conditionnel selon le type de média */}
                              {media.type === "video" ? (
                                <div className="mt-2">
                                  <video
                                    src={media.url}
                                    controls
                                    width={500}
                                    height={300}
                                    className="max-h-[300px] w-full rounded-md object-cover"
                                  >
                                    Votre navigateur ne supporte pas la lecture
                                    vidéo.
                                  </video>
                                </div>
                              ) : (
                                <CldImage
                                  src={media.publicId}
                                  alt={""}
                                  width={500}
                                  height={300}
                                  sizes="(max-width: 768px) 100vw,
                          (max-width: 1200px) 50vw,
                          33vw"
                                  className="mt-2 max-h-[300px] w-full rounded-md object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Actions de gauche (upload + visibilité) */}
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Bouton upload */}
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
                            <CldUploadWidget
                              uploadPreset="post-assets"
                              signatureEndpoint="/api/sign-cloudinary-params"
                              options={{
                                sources: [
                                  "local",
                                  "camera",
                                  "google_drive",
                                  "url",
                                ],
                                multiple: true,
                                maxFiles: 5,
                                maxFileSize: 50 * 1024 * 1024,
                                clientAllowedFormats: ["image", "video"],
                              }}
                              onSuccess={(result, { widget }) =>
                                handleUploadSuccess(result, widget)
                              }
                              onQueuesEnd={(result, { widget }) => {
                                widget.close()
                              }}
                            >
                              {({ open }) => (
                                <Button
                                  type="button"
                                  variant="default"
                                  className={cn(
                                    "border-muted flex items-center gap-2 rounded-full",
                                    { "cursor-not-allowed": isPending },
                                  )}
                                  onClick={() => open()}
                                  disabled={isPending}
                                >
                                  <ImagePlus size={18} />
                                  <span className="hidden sm:inline">
                                    Média
                                  </span>
                                </Button>
                              )}
                            </CldUploadWidget>
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

                        {/* Bouton de publication */}
                        <Button
                          type="submit"
                          disabled={isPending}
                          className="w-full rounded-full px-4 py-2 font-bold sm:w-auto"
                        >
                          {isPending ? (
                            <LoaderCircle className="mr-2 animate-spin" />
                          ) : null}
                          <span>Publier</span>
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
    </main>
  )
}
