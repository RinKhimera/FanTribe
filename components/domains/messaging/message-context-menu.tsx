"use client"

import { useMutation } from "convex/react"
import { motion, AnimatePresence } from "motion/react"
import { Copy, Pencil, Reply, Smile, Trash2 } from "lucide-react"
import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { ReactionPicker } from "./reaction-picker"
import { EditMessageDialog } from "./edit-message-dialog"
import { DeleteMessageDialog } from "./delete-message-dialog"

type MessageContextMenuProps = {
  children: React.ReactNode
  messageId: Id<"messages">
  content?: string
  isFromCurrentUser: boolean
  createdAt: number
  currentUserReactions?: string[]
  onReply?: () => void
}

const EDIT_TIME_LIMIT_MS = 15 * 60 * 1000 // 15 minutes
const EMPTY_REACTIONS: string[] = []

export const MessageContextMenu = ({
  children,
  messageId,
  content,
  isFromCurrentUser,
  createdAt,
  currentUserReactions = EMPTY_REACTIONS,
  onReply,
}: MessageContextMenuProps) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Derived state updated periodically (Date.now() is impure, can't call during render)
  const [canEdit, setCanEdit] = useState(false)
  useEffect(() => {
    const check = () =>
      setCanEdit(isFromCurrentUser && Date.now() - createdAt < EDIT_TIME_LIMIT_MS)
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [isFromCurrentUser, createdAt])

  const handleCopy = useCallback(async () => {
    if (content) {
      await navigator.clipboard.writeText(content)
      toast.success("Message copié")
    }
  }, [content])

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48 border-white/10 bg-black/90 backdrop-blur-xl">
          {/* Réactions rapides en haut */}
          <div className="flex items-center justify-center gap-1 px-2 py-2">
            {["❤️", "😂", "😮", "🔥"].map((emoji) => (
              <QuickReactionButton
                key={emoji}
                emoji={emoji}
                messageId={messageId}
                isActive={currentUserReactions.includes(emoji)}
              />
            ))}
            <button
              onClick={() => setShowReactionPicker(true)}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <Smile size={16} />
            </button>
          </div>

          <ContextMenuSeparator className="bg-white/10" />

          <ContextMenuItem
            onClick={onReply}
            className="gap-2 text-sm focus:bg-white/10"
          >
            <Reply size={16} />
            Répondre
          </ContextMenuItem>

          {content && (
            <ContextMenuItem
              onClick={handleCopy}
              className="gap-2 text-sm focus:bg-white/10"
            >
              <Copy size={16} />
              Copier
            </ContextMenuItem>
          )}

          {isFromCurrentUser && (
            <>
              <ContextMenuSeparator className="bg-white/10" />

              {canEdit && (
                <ContextMenuItem
                  onClick={() => setShowEditDialog(true)}
                  className="gap-2 text-sm focus:bg-white/10"
                >
                  <Pencil size={16} />
                  Modifier
                </ContextMenuItem>
              )}

              <ContextMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 size={16} />
                Supprimer
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Reaction picker popover */}
      <AnimatePresence>
        {showReactionPicker && (
          <div
            className="fixed inset-0 z-50"
            onClick={() => setShowReactionPicker(false)}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              onClick={(e) => e.stopPropagation()}
            >
              <ReactionPicker
                messageId={messageId}
                currentUserReactions={currentUserReactions}
                onClose={() => setShowReactionPicker(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit dialog */}
      <EditMessageDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        messageId={messageId}
        currentContent={content || ""}
      />

      {/* Delete dialog */}
      <DeleteMessageDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        messageId={messageId}
      />
    </>
  )
}

// Quick reaction button dans le menu contextuel
const QuickReactionButton = ({
  emoji,
  messageId,
  isActive,
}: {
  emoji: string
  messageId: Id<"messages">
  isActive: boolean
}) => {
  const toggleReaction = useMutation(api.messaging.toggleReaction)

  const handleClick = async () => {
    await toggleReaction({ messageId, emoji })
  }

  return (
    <motion.button
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-full text-lg transition-colors",
        isActive ? "bg-amber-500/20" : "hover:bg-white/10"
      )}
    >
      {emoji}
    </motion.button>
  )
}

// Version mobile avec long press
type MessageLongPressWrapperProps = {
  children: React.ReactNode
  onLongPress: () => void
  disabled?: boolean
}

export const MessageLongPressWrapper = ({
  children,
  onLongPress,
  disabled,
}: MessageLongPressWrapperProps) => {
  // useRef instead of useState: timer doesn't affect rendering
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = () => {
    if (disabled) return
    pressTimerRef.current = setTimeout(() => {
      onLongPress()
    }, 500)
  }

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="touch-none"
    >
      {children}
    </div>
  )
}
