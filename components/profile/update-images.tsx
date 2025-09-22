"use client"

import { useMutation } from "convex/react"
import { SwitchCamera, X } from "lucide-react"
import Image from "next/image"
import { useTransition } from "react"
import { toast } from "sonner"
import { BunnyUploadWidget } from "@/components/shared/bunny-upload-widget"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"
import { UserProps } from "@/types"

export const UpdateImages = ({ currentUser }: { currentUser: UserProps }) => {
  const [isPending, startTransition] = useTransition()
  const updateProfileImage = useMutation(api.users.updateProfileImage)
  const updateBannerImage = useMutation(api.users.updateBannerImage)

  const handleUploadProfile = (result: {
    url: string
    mediaId: string
    type: "image" | "video"
  }) => {
    startTransition(async () => {
      try {
        await updateProfileImage({
          imgUrl: result.url,
          tokenIdentifier: currentUser?.tokenIdentifier!,
        })
        toast.success("Photo de profil mise à jour")
      } catch (error) {
        console.error(error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const handleUploadBanner = (result: {
    url: string
    mediaId: string
    type: "image" | "video"
  }) => {
    startTransition(async () => {
      try {
        await updateBannerImage({
          bannerUrl: result.url,
          tokenIdentifier: currentUser?.tokenIdentifier!,
        })
        toast.success("Bannière mise à jour")
      } catch (error) {
        console.error(error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const handleDeleteBanner = () => {
    startTransition(async () => {
      try {
        await updateBannerImage({
          bannerUrl: "https://cdn.fantribe.io/fantribe/placeholder.jpg",
          tokenIdentifier: currentUser?.tokenIdentifier!,
        })

        toast.success("Votre photo de bannière a été supprimée")
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
    <div className="relative">
      <div>
        <AspectRatio ratio={3 / 1} className="bg-muted relative">
          <Image
            src={
              currentUser?.imageBanner ||
              "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
            }
            alt={currentUser?.name as string}
            className="object-cover"
            fill
          />

          <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/60 transition duration-300 hover:opacity-100 md:opacity-0">
            <BunnyUploadWidget
              userId={currentUser?._id!}
              fileName={`${currentUser?._id}/banner`}
              uploadType="image"
              onSuccess={handleUploadBanner}
            >
              {({ open }) => {
                return (
                  <div
                    className={cn(
                      "bg-accent hover:bg-accent/60 flex size-11 cursor-pointer items-center justify-center rounded-full text-white transition",
                      { "cursor-not-allowed": isPending },
                    )}
                    onClick={() => open()}
                  >
                    <SwitchCamera />
                  </div>
                )
              }}
            </BunnyUploadWidget>

            <div
              className={cn(
                "bg-accent hover:bg-accent/60 flex size-11 cursor-pointer items-center justify-center rounded-full text-white transition",
                { "cursor-not-allowed": isPending },
              )}
              onClick={isPending ? undefined : handleDeleteBanner}
            >
              <X />
            </div>
          </div>
        </AspectRatio>
      </div>

      <div className="absolute -bottom-[48px] left-5 max-sm:-bottom-[38px]">
        <BunnyUploadWidget
          userId={currentUser?._id!}
          fileName={`${currentUser?._id}/profile`}
          uploadType="image"
          onSuccess={handleUploadProfile}
        >
          {({ open }) => {
            return (
              <Avatar
                className={cn(
                  "border-accent relative size-36 cursor-pointer border-4 object-none object-center max-sm:size-24",
                  { "cursor-not-allowed": isPending },
                )}
                onClick={() => open()}
              >
                {currentUser?.image ? (
                  <Image
                    src={currentUser.image}
                    width={600}
                    height={600}
                    alt={currentUser?.name || "Profile image"}
                  />
                ) : (
                  <AvatarFallback>XO</AvatarFallback>
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 hover:opacity-100">
                  <div className="bg-accent flex size-11 items-center justify-center rounded-full text-white">
                    <SwitchCamera />
                  </div>
                </div>
              </Avatar>
            )
          }}
        </BunnyUploadWidget>
      </div>
    </div>
  )
}
