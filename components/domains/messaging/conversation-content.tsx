"use client"

import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { motion } from "motion/react"
import {
  ArrowLeft,
  Bell,
  BellOff,
  Lock,
  MoreVertical,
  Pin,
  PinOff,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { LockedConversationOverlay } from "./locked-conversation-overlay"
import { MessageForm } from "./message-form"
import { MessagesList } from "./messages-list"
import { TypingIndicator } from "./typing-indicator"

export const ConversationContent = () => {
  const { currentUser } = useCurrentUser()
  const { isAuthenticated } = useConvexAuth()

  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as Id<"conversations"> | undefined

  // Query pour récupérer la conversation
  const conversation = useQuery(
    api.messaging.getConversation,
    isAuthenticated && conversationId ? { conversationId } : "skip"
  )

  // Query pour les permissions
  const permissions = useQuery(
    api.messaging.getConversationPermissionsQuery,
    isAuthenticated && conversationId ? { conversationId } : "skip"
  )

  // Mutations
  const markAsRead = useMutation(api.messaging.markAsRead)
  const togglePin = useMutation(api.messaging.togglePin)
  const toggleMute = useMutation(api.messaging.toggleMute)

  // Marquer les messages comme lus quand la conversation est ouverte
  const conversationExists = !!conversation
  const canRead = permissions?.canRead ?? false
  useEffect(() => {
    if (isAuthenticated && conversationExists && conversationId && canRead) {
      markAsRead({ conversationId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, conversationExists, conversationId, canRead])

  // Redirection si conversation non trouvée
  const conversationNotFound = conversation === null
  useEffect(() => {
    if (conversationNotFound) {
      router.push("/messages")
    }
  }, [conversationNotFound, router])

  // Handlers
  const handleTogglePin = async () => {
    if (!conversationId) return
    try {
      await togglePin({ conversationId })
      toast.success(
        conversation?.isPinned
          ? "Conversation désépinglée"
          : "Conversation épinglée"
      )
    } catch {
      toast.error("Erreur lors de l'action")
    }
  }

  const handleToggleMute = async () => {
    if (!conversationId) return
    try {
      await toggleMute({ conversationId })
      toast.success(
        conversation?.isMuted
          ? "Notifications activées"
          : "Notifications désactivées"
      )
    } catch {
      toast.error("Erreur lors de l'action")
    }
  }

  // Loading state
  if (
    conversation === undefined ||
    !currentUser ||
    permissions === undefined
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center lg:w-3/5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative size-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-amber-500/20 border-t-amber-500"
            />
          </div>
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </motion.div>
      </div>
    )
  }

  // Conversation not found
  if (!conversation) {
    return null
  }

  const otherParticipant = conversation.otherParticipant
  const isLocked = conversation.isLocked && !permissions.canSend

  return (
    <div className="relative flex h-full w-full flex-col lg:w-3/5">
      {/* Header avec glass effect */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between p-3">
          {/* Left section */}
          <div className="flex items-center gap-3">
            {/* Back button (mobile) */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 lg:hidden"
              onClick={() => router.push("/messages")}
            >
              <ArrowLeft size={18} />
            </Button>

            {/* Avatar */}
            <Link
              href={`/${otherParticipant?.username}`}
              className="relative"
            >
              <Avatar className="size-10 ring-2 ring-white/10 transition-all hover:ring-amber-500/30">
                <AvatarImage
                  src={otherParticipant?.image}
                  className="object-cover"
                />
                <AvatarFallback className="bg-linear-to-br from-amber-500/20 to-orange-500/20 text-sm">
                  {otherParticipant?.name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>

              {/* Online indicator */}
              {otherParticipant?.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-3 rounded-full border-2 border-background bg-green-500" />
              )}
            </Link>

            {/* Name and status */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/${otherParticipant?.username}`}
                  className="font-medium transition-colors hover:text-amber-500"
                >
                  {otherParticipant?.name ?? "Utilisateur"}
                </Link>

                {conversation.isPinned && (
                  <Pin size={12} className="text-amber-500" />
                )}
                {conversation.isLocked && (
                  <Lock size={12} className="text-destructive" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {otherParticipant?.isOnline ? (
                  <span className="text-green-500">En ligne</span>
                ) : otherParticipant?.username ? (
                  `@${otherParticipant.username}`
                ) : (
                  "Hors ligne"
                )}
              </span>
            </div>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-white/10 bg-black/90 backdrop-blur-xl"
              >
                <DropdownMenuItem
                  onClick={handleTogglePin}
                  className="gap-2 focus:bg-white/10"
                >
                  {conversation.isPinned ? (
                    <>
                      <PinOff size={16} />
                      Désépingler
                    </>
                  ) : (
                    <>
                      <Pin size={16} />
                      Épingler
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleToggleMute}
                  className="gap-2 focus:bg-white/10"
                >
                  {conversation.isMuted ? (
                    <>
                      <Bell size={16} />
                      Activer notifications
                    </>
                  ) : (
                    <>
                      <BellOff size={16} />
                      Désactiver notifications
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="gap-2 focus:bg-white/10">
                  <Link href={`/${otherParticipant?.username}`}>
                    Voir le profil
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Typing indicator */}
        {conversationId && (
          <TypingIndicator
            conversationId={conversationId}
            otherParticipant={otherParticipant ?? undefined}
          />
        )}
      </motion.div>

      {/* Messages list */}
      <div className="relative flex-1 overflow-hidden">
        <MessagesList
          conversationId={conversation._id}
          currentUser={currentUser}
        />

        {/* Locked overlay */}
        {isLocked && (
          <LockedConversationOverlay
            reason={conversation.lockedReason}
            creator={
              currentUser?.accountType === "CREATOR"
                ? null
                : (otherParticipant as Doc<"users"> | null)
            }
            currentUser={currentUser}
          />
        )}
      </div>

      {/* Message input */}
      <MessageForm
        conversationId={conversation._id}
        currentUser={currentUser}
        permissions={permissions}
      />
    </div>
  )
}
