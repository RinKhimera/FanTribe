"use client"

import { useMutation } from "convex/react"
import {
  BadgeCheck,
  CalendarX,
  CheckCircle,
  Coins,
  Heart,
  ImagePlus,
  MessageSquareText,
  Trash2,
  UserRoundPlus,
  XCircle,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { deleteSwipeVariants, notificationVariants } from "@/lib/animations"
import { logger } from "@/lib/config"
import { formatCustomTimeAgo } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { EnrichedNotification } from "@/types"
import NotificationEllipsis from "./notification-ellipsis"

interface NotificationItemProps {
  notification: EnrichedNotification
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

  const markAsRead = useMutation(api.notifications.markAsRead)
  const deleteNotificationMutation = useMutation(
    api.notifications.deleteNotification,
  )

  const timeAgo = formatCustomTimeAgo(notification.lastActivityAt)
  const primaryActor = notification.actors[0]
  const isGrouped = notification.actorCount > 1

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
      case "subscriptionExpired":
        return (
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10">
            <CalendarX className={cn(iconClasses, "text-amber-500")} />
          </div>
        )
      case "subscriptionConfirmed":
        return (
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <CheckCircle className={cn(iconClasses, "text-emerald-500")} />
          </div>
        )
      case "creatorApplicationApproved":
        return (
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <BadgeCheck className={cn(iconClasses, "text-emerald-500")} />
          </div>
        )
      case "creatorApplicationRejected":
        return (
          <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/10">
            <XCircle className={cn(iconClasses, "text-rose-500")} />
          </div>
        )
      case "tip":
        return (
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10">
            <Coins className={cn(iconClasses, "text-amber-500")} />
          </div>
        )
      default:
        return null
    }
  }

  const getActorNames = (): string => {
    if (!primaryActor) return ""

    if (!isGrouped) return primaryActor.name

    const othersCount = notification.actorCount - 1
    if (notification.actors.length >= 2) {
      return `${primaryActor.name}, ${notification.actors[1].name}${othersCount > 1 ? ` et ${othersCount - 1} autre${othersCount > 2 ? "s" : ""}` : ""}`
    }
    return `${primaryActor.name} et ${othersCount} autre${othersCount > 1 ? "s" : ""}`
  }

  const getMessage = (): string => {
    const plural = isGrouped
    switch (notification.type) {
      case "like":
        return plural
          ? "ont aimé votre publication"
          : "a aimé votre publication"
      case "comment":
        return plural
          ? "ont commenté votre publication"
          : "a commenté votre publication"
      case "newSubscription":
        return plural
          ? "se sont abonnés à vous"
          : "s'est abonné à vous"
      case "renewSubscription":
        return plural
          ? "ont renouvelé leur abonnement"
          : "a renouvelé son abonnement"
      case "newPost":
        return "a partagé une nouvelle publication"
      case "subscriptionExpired":
        return "Votre abonnement a expiré. Renouvelez pour accéder au contenu exclusif."
      case "subscriptionConfirmed":
        return "Votre abonnement a été confirmé avec succès"
      case "creatorApplicationApproved":
        return "Votre demande de créateur a été approuvée ! Bienvenue."
      case "creatorApplicationRejected":
        return "Votre demande de créateur n'a pas été approuvée."
      case "tip":
        return notification.tipAmount
          ? `vous a envoyé un pourboire de ${new Intl.NumberFormat("fr-FR").format(notification.tipAmount)} ${notification.tipCurrency ?? "XAF"}`
          : "vous a envoyé un pourboire"
      default:
        return ""
    }
  }

  // Types where the notification is about the system, not from a specific actor
  const isSystemNotification =
    notification.type === "subscriptionExpired" ||
    notification.type === "subscriptionConfirmed" ||
    notification.type === "creatorApplicationApproved" ||
    notification.type === "creatorApplicationRejected"

  const handleRoute = () => {
    if (isDeleting) return

    startTransition(async () => {
      try {
        if (!notification.isRead) {
          await markAsRead({ notificationId: notification._id })
        }

        switch (notification.type) {
          case "tip":
            router.push("/dashboard/revenue")
            break
          case "creatorApplicationApproved":
          case "creatorApplicationRejected":
            router.push("/account")
            break
          case "subscriptionExpired":
          case "subscriptionConfirmed":
            if (primaryActor?.username) {
              router.push(`/${primaryActor.username}`)
            }
            break
          case "newPost":
            if (notification.postId && primaryActor?.username) {
              router.push(
                `/${primaryActor.username}/post/${notification.postId}`,
              )
            }
            break
          case "like":
          case "comment":
            if (notification.postId) {
              router.push(`/post/${notification.postId}`)
            }
            break
          case "newSubscription":
          case "renewSubscription":
            if (primaryActor?.username) {
              router.push(`/${primaryActor.username}`)
            }
            break
          default:
            if (primaryActor?.username) {
              router.push(`/${primaryActor.username}`)
            }
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
      await deleteNotificationMutation({ notificationId: notification._id })
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

  // Preview content
  const previewText =
    notification.type === "comment"
      ? notification.commentPreview
      : notification.type === "tip"
        ? notification.tipMessage
        : notification.postPreview

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
              "group relative isolate cursor-pointer overflow-hidden rounded-xl transition-colors duration-200",
              notification.isRead
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
            {!notification.isRead && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-primary absolute top-3 right-3 size-2.5 rounded-full"
              />
            )}

            <div
              className={cn("flex gap-3 p-4 sm:gap-4", {
                "opacity-60": notification.isRead,
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
                  {/* Avatar(s) + Text */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {/* Avatar stack */}
                    {!isSystemNotification && primaryActor ? (
                      <div className="relative shrink-0">
                        {isGrouped && notification.actors.length >= 2 ? (
                          // Stacked avatars for grouped notifications
                          <div className="relative size-10">
                            <Link
                              href={`/${notification.actors[1].username}`}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-0 left-0 z-0"
                            >
                              <Avatar className="ring-background size-8 ring-2">
                                <AvatarImage
                                  src={notification.actors[1].image}
                                  alt={notification.actors[1].name}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-muted text-xs">
                                  {notification.actors[1].name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            <Link
                              href={`/${primaryActor.username}`}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 bottom-0 z-10"
                            >
                              <Avatar className="ring-background size-8 ring-2">
                                <AvatarImage
                                  src={primaryActor.image}
                                  alt={primaryActor.name}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-muted text-xs">
                                  {primaryActor.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            {/* Badge count */}
                            {notification.actorCount > 2 && (
                              <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 z-20 flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
                                +{notification.actorCount - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          // Single avatar
                          <Link
                            href={`/${primaryActor.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="relative z-10 shrink-0"
                          >
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <Avatar className="ring-background size-10 ring-2">
                                <AvatarImage
                                  src={primaryActor.image}
                                  alt={primaryActor.name}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-muted">
                                  {primaryActor.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                          </Link>
                        )}
                      </div>
                    ) : (
                      // System notification — show icon on mobile
                      <div className="shrink-0 sm:hidden">{getIcon()}</div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">
                        {!isSystemNotification && primaryActor ? (
                          <>
                            <span className="font-semibold">
                              {getActorNames()}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {getMessage()}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            {getMessage()}
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {timeAgo}
                      </p>
                    </div>
                  </div>

                  {/* Actions - always visible on mobile */}
                  <div className="flex shrink-0 items-center gap-0.5">
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
                        notificationRead={notification.isRead}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview content */}
                {previewText && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-muted/50 mt-3 rounded-lg p-2.5 sm:p-3"
                  >
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                      {previewText}
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
