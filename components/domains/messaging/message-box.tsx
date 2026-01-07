"use client"

import { motion } from "motion/react"
import {
  FileText,
  Info,
  Lock,
  MessageSquare,
  Pencil,
  Play,
  RefreshCw,
  Reply,
  Trash2,
  Unlock,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { FullscreenImageViewer } from "@/components/shared/fullscreen-image-viewer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { MessageProps } from "@/types"
import { DateIndicator } from "./date-indicator"
import { MessageContextMenu } from "./message-context-menu"
import { MessageReactionsDisplay } from "./reaction-picker"

type MessageBoxProps = {
  currentUser: Doc<"users"> | null
  message: MessageProps
  previousMessage?: MessageProps
}

export const MessageBox = ({
  currentUser,
  message,
  previousMessage,
}: MessageBoxProps) => {
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const isFromCurrentUser = message.sender?._id === currentUser?._id
  const isDeleted = message.isDeleted
  const isSystemMessage = message.messageType === "system"

  // Get current user's reactions on this message
  const currentUserReactions =
    message.reactions
      ?.filter((r) => r.userId === currentUser?._id)
      .map((r) => r.emoji) ?? []

  // Message système
  if (isSystemMessage) {
    return (
      <>
        <DateIndicator message={message} previousMessage={previousMessage} />
        <SystemMessage message={message} />
      </>
    )
  }

  // Message supprimé
  if (isDeleted) {
    return (
      <>
        <DateIndicator message={message} previousMessage={previousMessage} />
        <DeletedMessage isFromCurrentUser={isFromCurrentUser} />
      </>
    )
  }

  const time = formatMessageTime(message._creationTime)
  const imageMedias = message.medias?.filter((m) => m.type === "image") ?? []

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setImageViewerOpen(true)
  }

  // Message reçu (de l'autre participant)
  if (!isFromCurrentUser) {
    return (
      <>
        <DateIndicator message={message} previousMessage={previousMessage} />
        <div className="group flex max-w-[85%] gap-2 sm:max-w-[75%]">
          {/* Avatar */}
          <Avatar className="size-8 shrink-0 ring-1 ring-white/10">
            <AvatarImage src={message.sender?.image} className="object-cover" />
            <AvatarFallback className="bg-linear-to-br from-amber-500/20 to-orange-500/20 text-xs">
              {message.sender?.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            {/* Reply preview */}
            {message.replyToMessage && (
              <ReplyPreview reply={message.replyToMessage} />
            )}

            {/* Bulle de message avec context menu */}
            <MessageContextMenu
              messageId={message._id}
              content={message.content}
              isFromCurrentUser={false}
              createdAt={message._creationTime}
              currentUserReactions={currentUserReactions}
            >
              <div className="relative cursor-default rounded-2xl rounded-tl-sm border border-white/5 bg-white/5 px-3 py-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/[0.07]">
                <MessageContent
                  message={message}
                  onImageClick={handleImageClick}
                />
                <MessageFooter
                  time={time}
                  isEdited={message.isEdited}
                  isFromCurrentUser={false}
                />
              </div>
            </MessageContextMenu>

            {/* Réactions */}
            {message.reactions && message.reactions.length > 0 && (
              <MessageReactionsDisplay
                reactions={message.reactions}
                currentUserId={currentUser?._id}
                messageId={message._id}
                isFromCurrentUser={false}
              />
            )}
          </div>
        </div>

        {imageMedias.length > 0 && (
          <FullscreenImageViewer
            medias={imageMedias.map((m) => m.url)}
            index={selectedImageIndex}
            open={imageViewerOpen}
            onClose={() => setImageViewerOpen(false)}
          />
        )}
      </>
    )
  }

  // Message envoyé (par l'utilisateur courant)
  return (
    <>
      <DateIndicator message={message} previousMessage={previousMessage} />
      <div className="group ml-auto flex max-w-[85%] flex-col items-end gap-1 sm:max-w-[75%]">
        {/* Reply preview */}
        {message.replyToMessage && (
          <ReplyPreview reply={message.replyToMessage} alignRight />
        )}

        {/* Bulle de message avec context menu */}
        <MessageContextMenu
          messageId={message._id}
          content={message.content}
          isFromCurrentUser={true}
          createdAt={message._creationTime}
          currentUserReactions={currentUserReactions}
        >
          <div className="relative cursor-default rounded-2xl rounded-tr-sm bg-linear-to-br from-amber-500/20 to-orange-500/15 px-3 py-2 shadow-sm transition-colors hover:from-amber-500/25 hover:to-orange-500/20">
            <MessageContent
              message={message}
              onImageClick={handleImageClick}
            />
            <MessageFooter
              time={time}
              isEdited={message.isEdited}
              isFromCurrentUser={true}
            />
          </div>
        </MessageContextMenu>

        {/* Réactions */}
        {message.reactions && message.reactions.length > 0 && (
          <MessageReactionsDisplay
            reactions={message.reactions}
            currentUserId={currentUser?._id}
            messageId={message._id}
            isFromCurrentUser={true}
          />
        )}
      </div>

      {imageMedias.length > 0 && (
        <FullscreenImageViewer
          medias={imageMedias.map((m) => m.url)}
          index={selectedImageIndex}
          open={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </>
  )
}

// ============================================
// Sous-composants
// ============================================

const MessageContent = ({
  message,
  onImageClick,
}: {
  message: MessageProps
  onImageClick: (index: number) => void
}) => {
  const hasText = message.content && message.content.trim().length > 0
  const hasMedia = message.medias && message.medias.length > 0

  return (
    <div className="space-y-2">
      {/* Médias */}
      {hasMedia && (
        <div
          className={cn(
            "grid gap-1.5",
            message.medias!.length === 1
              ? "grid-cols-1"
              : message.medias!.length === 2
                ? "grid-cols-2"
                : "grid-cols-2"
          )}
        >
          {message.medias!.map((media, index) => (
            <MediaItem
              key={index}
              media={media}
              onClick={() => media.type === "image" && onImageClick(index)}
              isGrid={message.medias!.length > 1}
            />
          ))}
        </div>
      )}

      {/* Texte */}
      {hasText && <TextContent content={message.content!} />}
    </div>
  )
}

const TextContent = ({ content }: { content: string }) => {
  const isLink = /^(ftp|http|https):\/\/[^ "]+$/.test(content)

  if (isLink) {
    return (
      <Link
        href={content}
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-400 underline decoration-amber-400/30 underline-offset-2 transition-colors hover:text-amber-300 hover:decoration-amber-300/50 break-all"
      >
        {content}
      </Link>
    )
  }

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
      {content}
    </p>
  )
}

const MediaItem = ({
  media,
  onClick,
  isGrid,
}: {
  media: { type: string; url: string; thumbnailUrl?: string }
  onClick: () => void
  isGrid?: boolean
}) => {
  if (media.type === "image") {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden rounded-lg"
      >
        <Image
          src={media.url}
          alt="Image"
          width={isGrid ? 200 : 300}
          height={isGrid ? 200 : 300}
          className={cn(
            "cursor-pointer object-cover transition-all",
            isGrid ? "aspect-square" : "max-h-80 w-auto"
          )}
          onClick={onClick}
        />
      </motion.div>
    )
  }

  if (media.type === "video") {
    return (
      <div className="relative overflow-hidden rounded-lg">
        <video
          src={media.url}
          poster={media.thumbnailUrl}
          controls
          className="max-h-80 w-full rounded-lg"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity">
          <Play size={48} className="text-white" fill="white" />
        </div>
      </div>
    )
  }

  if (media.type === "audio") {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-2">
        <audio src={media.url} controls className="w-full" />
      </div>
    )
  }

  // Document
  return (
    <Link
      href={media.url}
      target="_blank"
      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/20">
        <FileText size={20} className="text-amber-500" />
      </div>
      <span className="text-sm">Document</span>
    </Link>
  )
}

const ReplyPreview = ({
  reply,
  alignRight = false,
}: {
  reply: { content?: string; senderId: string }
  alignRight?: boolean
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border-l-2 border-amber-500/50 bg-white/5 px-2.5 py-1.5 text-xs text-muted-foreground",
        alignRight && "ml-auto"
      )}
    >
      <Reply size={12} className="shrink-0 text-amber-500" />
      <span className="truncate max-w-[200px]">
        {reply.content || "[Message supprimé]"}
      </span>
    </motion.div>
  )
}

const MessageFooter = ({
  time,
  isEdited,
  isFromCurrentUser,
}: {
  time: string
  isEdited?: boolean
  isFromCurrentUser: boolean
}) => {
  return (
    <div
      className={cn(
        "mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/70",
        isFromCurrentUser && "justify-end"
      )}
    >
      {isEdited && (
        <span className="flex items-center gap-0.5 text-amber-500/70">
          <Pencil size={9} />
          modifié
        </span>
      )}
      <span>{time}</span>
    </div>
  )
}

const SystemMessage = ({ message }: { message: MessageProps }) => {
  const getSystemConfig = () => {
    switch (message.systemMessageType) {
      case "conversation_started":
        return {
          text: "Conversation démarrée",
          icon: MessageSquare,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        }
      case "subscription_expired":
        return {
          text: "Abonnement messagerie expiré",
          icon: Lock,
          color: "text-destructive",
          bg: "bg-destructive/10",
        }
      case "subscription_renewed":
        return {
          text: "Abonnement renouvelé",
          icon: RefreshCw,
          color: "text-green-500",
          bg: "bg-green-500/10",
        }
      case "conversation_locked":
        return {
          text: "Conversation verrouillée",
          icon: Lock,
          color: "text-destructive",
          bg: "bg-destructive/10",
        }
      case "conversation_unlocked":
        return {
          text: "Conversation déverrouillée",
          icon: Unlock,
          color: "text-green-500",
          bg: "bg-green-500/10",
        }
      default:
        return {
          text: "Message système",
          icon: Info,
          color: "text-muted-foreground",
          bg: "bg-muted",
        }
    }
  }

  const config = getSystemConfig()
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="my-3 flex justify-center"
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs",
          config.bg
        )}
      >
        <Icon size={12} className={config.color} />
        <span className={config.color}>{config.text}</span>
      </div>
    </motion.div>
  )
}

const DeletedMessage = ({
  isFromCurrentUser,
}: {
  isFromCurrentUser: boolean
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex max-w-[85%] sm:max-w-[75%]",
        isFromCurrentUser ? "ml-auto justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-dashed px-3 py-2 text-sm italic",
          isFromCurrentUser
            ? "rounded-tr-sm border-amber-500/20 text-muted-foreground/50"
            : "rounded-tl-sm border-white/10 text-muted-foreground/50"
        )}
      >
        <Trash2 size={14} />
        Message supprimé
      </div>
    </motion.div>
  )
}

// ============================================
// Helpers
// ============================================

const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}
