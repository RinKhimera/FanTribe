"use client"

import { ImagePlus } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import TextareaAutosize from "react-textarea-autosize"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Doc } from "@/convex/_generated/dataModel"

export const CreatePost = ({
  currentUser,
}: {
  currentUser: Doc<"users"> | undefined
}) => {
  const router = useRouter()

  const handleCreatePostClick = () => {
    if (
      currentUser?.accountType === "CREATOR" ||
      currentUser?.accountType === "SUPERUSER"
    ) {
      router.push("/new-post")
    } else {
      router.push("/be-creator")
    }
  }

  return (
    <div
      className="border-muted relative flex cursor-pointer items-stretch space-x-3 border-b px-4 py-5 max-sm:hidden"
      onClick={handleCreatePostClick}
    >
      <Avatar>
        <Image
          src={currentUser?.image!}
          width={100}
          height={100}
          alt={currentUser?.username || "Profile image"}
        />
        <AvatarFallback className="size-11">
          <div className="animate-pulse rounded-full bg-gray-500"></div>
        </AvatarFallback>
      </Avatar>

      <div className="w-full">
        <div className="flex h-full w-full flex-col">
          <TextareaAutosize
            placeholder="Partager une publication"
            className="mt-1 h-full w-full cursor-pointer resize-none border-none bg-transparent text-xl outline-hidden"
            onClick={(e) => {
              e.stopPropagation()
              handleCreatePostClick()
            }}
            readOnly
            minRows={2}
            maxRows={4}
          />

          <div
            className="mt-2 flex w-full cursor-pointer items-center justify-between"
            onClick={handleCreatePostClick}
          >
            {currentUser !== undefined && (
              <div className="-ml-2">
                <Button
                  type="button"
                  size={"icon"}
                  className="rounded-full p-2 transition"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCreatePostClick()
                  }}
                >
                  <ImagePlus size={20} />
                </Button>
              </div>
            )}

            <Button
              className="w-fit rounded-full px-4 py-2 font-bold"
              onClick={(e) => {
                e.stopPropagation()
                handleCreatePostClick()
              }}
              type="button"
            >
              Publier
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
