"use client"

import { motion } from "motion/react"
import { ImageIcon, Lock, Pin, VideoIcon, Volume2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { ConversationProps } from "@/types"

export const ConversationBox = ({
  conversation,
}: {
  conversation: ConversationProps
}) => {
  const params = useParams()
  const router = useRouter()

  const isSelected = conversation._id === params.conversationId

  // Déterminer le contenu du preview
  const getPreviewContent = () => {
    // Si la conversation est verrouillée, masquer le preview
    if (conversation.isLocked) {
      return (
        <span className="flex items-center gap-1.5 italic text-muted-foreground/70">
          <Lock size={12} />
          <span>Conversation verrouillée</span>
        </span>
      )
    }

    if (!conversation.lastMessagePreview) {
      return (
        <span className="italic text-muted-foreground/70">
          Démarrer une conversation
        </span>
      )
    }

    // Détecter les médias dans le preview
    if (conversation.lastMessagePreview === "[Photo]") {
      return (
        <span className="flex items-center gap-1.5">
          <ImageIcon size={14} className="text-amber-500" />
          <span>Photo</span>
        </span>
      )
    }
    if (conversation.lastMessagePreview === "[Vidéo]") {
      return (
        <span className="flex items-center gap-1.5">
          <VideoIcon size={14} className="text-amber-500" />
          <span>Vidéo</span>
        </span>
      )
    }
    if (conversation.lastMessagePreview === "[Audio]") {
      return (
        <span className="flex items-center gap-1.5">
          <Volume2 size={14} className="text-amber-500" />
          <span>Audio</span>
        </span>
      )
    }

    // Texte tronqué
    return conversation.lastMessagePreview.length > 40
      ? `${conversation.lastMessagePreview.slice(0, 40)}…`
      : conversation.lastMessagePreview
  }

  return (
    <motion.div
      onClick={() => router.push(`/messages/${conversation._id}`)}
      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex cursor-pointer items-center gap-3 border-b border-white/5 p-4 transition-[background-color,opacity]",
        isSelected && "bg-white/5",
        conversation.isLocked && "opacity-60"
      )}
    >
      {/* Indicateur de sélection */}
      {isSelected && (
        <motion.div
          layoutId="conversation-indicator"
          className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-linear-to-b from-amber-500 to-orange-500"
        />
      )}

      {/* Indicateur non-lu */}
      {conversation.hasUnread && !isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-amber-500"
        />
      )}

      {/* Avatar avec indicateur online */}
      <div className="relative">
        <Avatar
          className={cn(
            "size-12 ring-2 transition-shadow",
            conversation.hasUnread ? "ring-amber-500/30" : "ring-white/5"
          )}
        >
          <AvatarImage
            src={conversation.otherParticipant?.image}
            alt=""
            className="object-cover"
          />
          <AvatarFallback className="bg-linear-to-br from-amber-500/20 to-orange-500/20 text-sm font-medium">
            {conversation.otherParticipant?.name?.charAt(0) ?? "?"}
          </AvatarFallback>
        </Avatar>

        {/* Online indicator */}
        {conversation.otherParticipant?.isOnline && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-0.5 -right-0.5"
          >
            <span className="inline-flex size-3.5 rounded-full border-2 border-background bg-green-500" />
          </motion.div>
        )}
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* Nom */}
          <h3
            className={cn(
              "truncate text-sm",
              conversation.hasUnread
                ? "font-semibold text-foreground"
                : "font-medium text-foreground/90"
            )}
          >
            {conversation.otherParticipant?.name ?? "Utilisateur"}
          </h3>

          {/* Badges */}
          <div className="flex items-center gap-1">
            {conversation.isPinned && (
              <motion.div
                initial={{ rotate: -45, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
              >
                <Pin size={12} className="text-amber-500" />
              </motion.div>
            )}
            {conversation.isLocked && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Lock size={12} className="text-destructive" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Preview du dernier message */}
        <p
          className={cn(
            "mt-0.5 truncate text-sm",
            conversation.hasUnread
              ? "font-medium text-foreground/80"
              : "text-muted-foreground"
          )}
        >
          {getPreviewContent()}
        </p>
      </div>

      {/* Timestamp et Badge */}
      <div className="flex flex-col items-end gap-1.5">
        {/* Badge non-lus */}
        {conversation.unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex min-w-[20px] items-center justify-center rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-xs font-semibold text-black"
          >
            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
          </motion.span>
        )}

        {/* Timestamp */}
        {conversation.lastMessageAt && (
          <span
            className={cn(
              "text-xs",
              conversation.hasUnread
                ? "font-medium text-amber-500"
                : "text-muted-foreground"
            )}
          >
            {formatDate(conversation.lastMessageAt)}
          </span>
        )}
      </div>
    </motion.div>
  )
}
