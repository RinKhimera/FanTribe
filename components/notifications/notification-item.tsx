import { useMutation } from "convex/react"
import {
  Heart,
  ImagePlus,
  MessageSquareText,
  UserRoundPlus,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import NotificationEllipsis from "@/components/notifications/notification-ellipsis"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config"
import { formatCustomTimeAgo } from "@/lib/formatters"
import { cn } from "@/lib/utils"

// Define a type `ExtendedNotificationProps` that extends the `Doc<"notifications">` type
// But omits the "sender", "post", and "comment" properties. These properties are then redefined with new types.
type ExtendedNotificationProps = Omit<
  Doc<"notifications">,
  "sender" | "recipientId" | "post" | "comment"
> & {
  sender: Doc<"users"> | null
  recipientId: Doc<"users"> | null
  post: Doc<"posts"> | null | undefined
  comment: Doc<"comments"> | null | undefined
}

export const NotificationItem = ({
  notification,
}: {
  notification: ExtendedNotificationProps
}) => {
  const router = useRouter()

  const [isPending, startTransition] = useTransition()

  const markAsRead = useMutation(api.notifications.markNotificationAsRead)

  const timeAgo = formatCustomTimeAgo(notification._creationTime)

  const getIcon = () => {
    switch (notification.type) {
      case "like":
        return <Heart className="text-rose-500" size={32} fill="red" />
      case "comment":
        return <MessageSquareText className="text-blue-500" size={32} />
      case "newSubscription":
        return <UserRoundPlus className="text-blue-500" size={32} />
      case "renewSubscription":
        return <UserRoundPlus className="text-blue-500" size={32} />
      case "newPost":
        return <ImagePlus className="text-blue-500" size={32} />
      default:
        return null
    }
  }

  const icon = getIcon()

  const getMessage = () => {
    switch (notification.type) {
      case "like":
        return "a aimé votre post"
      case "comment":
        return "a commenté votre post"
      case "newSubscription":
        return "s'est abonné à vous"
      case "renewSubscription":
        return "a renouvelé son abonnement"
      case "newPost":
        return "a partagé une nouvelle publication"
      default:
        return ""
    }
  }

  const message = getMessage()

  const handleRoute = () => {
    startTransition(async () => {
      try {
        await markAsRead({ notificationId: notification._id })

        if (notification.post) {
          router.push(
            `/${notification.recipientId?.username}/post/${notification.post._id}`,
          )
        } else {
          router.push(`/${notification.sender?.username}`)
        }
      } catch (error) {
        logger.error("Erreur lors du marquage de la notification", error, {
          notificationId: notification._id,
        })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <div
      className={cn(
        "relative transition",
        notification.read
          ? "hover:bg-muted/60"
          : "bg-muted/30 hover:bg-muted/60",
      )}
    >
      <button
        className={cn("absolute inset-0")}
        onClick={handleRoute}
        disabled={isPending}
      ></button>

      <div
        className={cn("flex flex-col gap-1 border-b px-3 py-2.5", {
          "text-muted-foreground": notification.read,
        })}
      >
        <div className="flex justify-between gap-3">
          <div className="flex items-center gap-3">
            <>{icon}</>
            <Link href={`/${notification.sender?.username}`}>
              <Avatar className="size-9">
                <AvatarImage
                  src={notification.sender?.image!}
                  width={100}
                  height={100}
                  alt={notification.sender?.name || "Profile image"}
                  className="aspect-square h-full w-full object-cover"
                />
                <AvatarFallback className="size-11">
                  <div className="animate-pulse rounded-full bg-gray-500"></div>
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm">{timeAgo}</div>
            <div className="relative z-10">
              <NotificationEllipsis
                notificationId={notification._id}
                notificationRead={notification.read}
              />
            </div>
          </div>
        </div>

        <div>
          <Link
            href={`/${notification.sender?.username}`}
            className="relative z-10 font-semibold hover:underline"
          >
            {notification.sender?.name}
          </Link>{" "}
          <>{message}</>
        </div>

        <div className="text-sm">
          {notification.type === "comment"
            ? notification.comment?.content
            : notification.post?.content}
        </div>
      </div>
    </div>
  )
}
