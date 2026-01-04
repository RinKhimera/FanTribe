"use client"

import { useMutation } from "convex/react"
import {
  CalendarX,
  Heart,
  ImagePlus,
  MessageSquareText,
  Trash2,
  UserRoundPlus,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { deleteSwipeVariants, notificationVariants } from "@/lib/animations"
import { logger } from "@/lib/config"
import { formatCustomTimeAgo } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import NotificationEllipsis from "./notification-ellipsis"

export type ExtendedNotificationProps = Omit<
  Doc<"notifications">,
  "sender" | "recipientId" | "post" | "comment"
> & {
  sender: Doc<"users"> | null
  recipientId: Doc<"users"> | null
  post: Doc<"posts"> | null | undefined
  comment: Doc<"comments"> | null | undefined
}

interface NotificationItemProps {
  notification: ExtendedNotificationProps
  onDelete?: () => void
}

export const NotificationItem = ({
  notification,
  onDelete,
}: NotificationItemProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const markAsRead = useMutation(api.notifications.markNotificationAsRead)
  const deleteNotification = useMutation(api.notifications.deleteNotification)

  const timeAgo = formatCustomTimeAgo(notification._creationTime)

  const getIcon = () => {
    const iconClasses = "size-7 transition-transform group-hover:scale-110"
    switch (notification.type) {
      case "like":
        return (
          <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/10">
            <Heart
              className={cn(iconClasses, "text-rose-500")}
              fill="currentColor"
            />
          </div>
        )
      case "comment":
        return (
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10">
            <MessageSquareText className={cn(iconClasses, "text-blue-500")} />
          </div>
        )
      case "newSubscription":
      case "renewSubscription":
        return (
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <UserRoundPlus className={cn(iconClasses, "text-emerald-500")} />
          </div>
        )
      case "newPost":
        return (
          <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
            <ImagePlus className={cn(iconClasses, "text-primary")} />
          </div>
        )
      case "subscription_expired":
        return (
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10">
            <CalendarX className={cn(iconClasses, "text-amber-500")} />
          </div>
        )
      default:
        return null
    }
  }

  const getMessage = () => {
    switch (notification.type) {
      case "like":
        return "a aimé votre publication"
      case "comment":
        return "a commenté votre publication"
      case "newSubscription":
        return "s'est abonné à vous"
      case "renewSubscription":
        return "a renouvelé son abonnement"
      case "newPost":
        return "a partagé une nouvelle publication"
      case "subscription_expired":
        return "Votre abonnement a expiré"
      default:
        return ""
    }
  }

  const handleRoute = () => {
    if (isDeleting) return

    startTransition(async () => {
      try {
        await markAsRead({ notificationId: notification._id })

        if (notification.post) {
          const postOwnerUsername =
            notification.type === "newPost"
              ? notification.sender?.username
              : notification.recipientId?.username

          router.push(`/${postOwnerUsername}/post/${notification.post._id}`)
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)

    try {
      await deleteNotification({ notificationId: notification._id })
      onDelete?.()
      toast.success("Notification supprimée")
    } catch (error) {
      logger.error("Failed to delete notification", error, {
        notificationId: notification._id,
      })
      toast.error("Erreur lors de la suppression")
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence mode="popLayout">
      {!isDeleting && (
        <motion.div
          variants={deleteSwipeVariants}
          initial="initial"
          animate="initial"
          exit="exit"
          layout
        >
          <motion.div
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            className={cn(
              "group relative isolate cursor-pointer overflow-hidden rounded-xl transition-all duration-200",
              notification.read
                ? "glass-notification"
                : "glass-notification glass-notification-unread",
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleRoute}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Unread indicator dot */}
            {!notification.read && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-primary absolute top-3 right-3 size-2.5 rounded-full"
              />
            )}

            <div
              className={cn("flex gap-3 p-4 sm:gap-4", {
                "opacity-60": notification.read,
              })}
            >
              {/* Icon - hidden on very small screens, visible on sm+ */}
              <motion.div
                className="hidden shrink-0 sm:block"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {getIcon()}
              </motion.div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  {/* Avatar + Text */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Link
                      href={`/${notification.sender?.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className="relative z-10 shrink-0"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Avatar className="ring-background size-10 ring-2">
                          <AvatarImage
                            src={notification.sender?.image || ""}
                            alt={notification.sender?.name || "Profile"}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-muted">
                            {notification.sender?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    </Link>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">
                        <Link
                          href={`/${notification.sender?.username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="relative z-10 font-semibold hover:underline"
                        >
                          <span className="line-clamp-1 inline">
                            {notification.sender?.name}
                          </span>
                        </Link>{" "}
                        <span className="text-muted-foreground">
                          {getMessage()}
                        </span>
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {timeAgo}
                      </p>
                    </div>
                  </div>

                  {/* Actions - always visible on mobile */}
                  <div className="flex shrink-0 items-center gap-0.5">
                    {/* Delete button - always visible on mobile, hover on desktop */}
                    <motion.button
                      initial={false}
                      animate={{
                        opacity: isHovered ? 1 : undefined,
                        scale: isHovered ? 1 : undefined,
                      }}
                      onClick={handleDelete}
                      className={cn(
                        "relative z-10 rounded-lg p-2 transition-colors",
                        "hover:bg-destructive/10 hover:text-destructive",
                        "text-muted-foreground/60 sm:text-muted-foreground",
                        // Visible sur mobile, caché sur desktop sauf hover
                        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                      )}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                    </motion.button>

                    <div
                      className="relative z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <NotificationEllipsis
                        notificationId={notification._id}
                        notificationRead={notification.read}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview content */}
                {(notification.comment?.content ||
                  notification.post?.content) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-muted/50 mt-3 rounded-lg p-2.5 sm:p-3"
                  >
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                      {notification.type === "comment"
                        ? notification.comment?.content
                        : notification.post?.content}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
