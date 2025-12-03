"use client"

import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { ImageIcon, MailPlus } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export const UserListDialog = () => {
  const { isAuthenticated } = useConvexAuth()
  const { currentUser } = useCurrentUser()

  const users = useQuery(
    api.users.getUsers,
    isAuthenticated ? undefined : "skip",
  )

  const createConversation = useMutation(api.conversations.createConversation)
  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl)

  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [groupName, setGroupName] = useState("")
  const [renderedImage, setRenderedImage] = useState("")
  const [isPending, startTransition] = useTransition()
  const imgRef = useRef<HTMLInputElement>(null)
  const dialogCloseRef = useRef<HTMLButtonElement>(null)

  const router = useRouter()

  // Utiliser useEffectEvent pour éviter le setState synchrone dans l'effect
  const updateRenderedImage = useEffectEvent((imageData: string) => {
    setRenderedImage(imageData)
  })

  useEffect(() => {
    if (!selectedImage) {
      updateRenderedImage("")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => updateRenderedImage(e.target?.result as string)
    reader.readAsDataURL(selectedImage)
  }, [selectedImage])

  const handleCreateConversation = () => {
    if (selectedUsers.length === 0 || !currentUser?._id) return
    startTransition(async () => {
      try {
        const isGroup = selectedUsers.length > 1

        let conversationId

        if (!isGroup) {
          conversationId = await createConversation({
            participants: [...selectedUsers, currentUser._id],
            isGroup: false,
          })
        } else {
          const postUrl = await generateUploadUrl()

          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": selectedImage?.type || "image/png" },
            body: selectedImage,
          })

          const { storageId } = await result.json()

          conversationId = await createConversation({
            participants: [...selectedUsers, currentUser._id],
            isGroup: true,
            admin: currentUser._id,
            groupName,
            groupImage: storageId,
          })
        }

        dialogCloseRef.current?.click()
        setSelectedUsers([])
        setGroupName("")
        setSelectedImage(null)

        router.push(`/messages/${conversationId}`)
      } catch (error) {
        console.error(error)
        toast.error("Une erreur s'est produite !", {
          description:
            "La discussion n'a pas été créee. Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger>
        <MailPlus />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          {/* TODO: <DialogClose /> will be here */}
          <DialogClose ref={dialogCloseRef} />
          <DialogTitle>Nouvelle conversation</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          Commencez une nouvelle conversation
        </DialogDescription>
        {renderedImage && (
          <div className="relative mx-auto h-16 w-16">
            <Image
              src={renderedImage}
              fill
              alt="user image"
              className="rounded-full object-cover"
            />
          </div>
        )}
        {/* TODO: input file */}
        <input
          type="file"
          accept="image/*"
          ref={imgRef}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setSelectedImage(file)
              setRenderedImage(URL.createObjectURL(file))
            }
          }}
          hidden
        />
        {selectedUsers.length > 1 && (
          <>
            <Input
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <Button
              className="flex gap-2"
              onClick={() => imgRef.current?.click()}
            >
              <ImageIcon size={20} />
              Photo du groupe
            </Button>
          </>
        )}
        <div className="flex max-h-60 flex-col gap-3 overflow-auto">
          {users?.map((user) => (
            <div
              key={user._id}
              className={`flex cursor-pointer items-center gap-3 rounded p-2 transition-all duration-300 ease-in-out active:scale-95 ${selectedUsers.includes(user._id) ? "bg-sky-600" : ""}`}
              onClick={() => {
                if (selectedUsers.includes(user._id)) {
                  setSelectedUsers(
                    selectedUsers.filter((id) => id !== user._id),
                  )
                } else {
                  setSelectedUsers([...selectedUsers, user._id])
                }
              }}
            >
              <Avatar className="overflow-visible">
                {user.isOnline && (
                  <div className="border-foreground absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
                )}
                <Image
                  src={user.image}
                  width={100}
                  height={100}
                  alt={user.username || "Profile image"}
                  className="rounded-full object-cover"
                />
                <AvatarFallback>
                  <div className="bg-muted h-full w-full animate-pulse rounded-full"></div>
                </AvatarFallback>
              </Avatar>

              <div className="text-left text-sm">
                <div className="truncate">{user.name}</div>
                <div className="text-muted-foreground">@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <DialogClose asChild>
            <Button variant={"outline"}>Fermer</Button>
          </DialogClose>
          <Button
            onClick={handleCreateConversation}
            disabled={
              selectedUsers.length === 0 ||
              (selectedUsers.length > 1 && !groupName) ||
              isPending
            }
          >
            {isPending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-b-2" />
            ) : (
              "Suivant"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
