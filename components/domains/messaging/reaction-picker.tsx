"use client"

import { useMutation } from "convex/react"
import { motion } from "motion/react"
import { Plus } from "lucide-react"
import { Theme } from "emoji-picker-react"
import dynamic from "next/dynamic"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-[320px] items-center justify-center rounded-xl bg-black/80">
      <div className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
    </div>
  ),
})
import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👍"]

type ReactionPickerProps = {
  messageId: Id<"messages">
  currentUserReactions?: string[]
  onClose?: () => void
  align?: "start" | "center" | "end"
}

export const ReactionPicker = ({
  messageId,
  currentUserReactions = [],
  onClose,
  align = "center",
}: ReactionPickerProps) => {
  const [showFullPicker, setShowFullPicker] = useState(false)

  const toggleReaction = useMutation(api.messaging.toggleReaction)

  const handleReaction = async (emoji: string) => {
    await toggleReaction({ messageId, emoji })
    onClose?.()
  }

  const handleEmojiSelect = async (emojiData: { emoji: string }) => {
    await toggleReaction({ messageId, emoji: emojiData.emoji })
    setShowFullPicker(false)
    onClose?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 5 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-white/10 bg-black/80 p-1 shadow-xl backdrop-blur-xl",
        align === "end" && "origin-right",
        align === "start" && "origin-left"
      )}
    >
      {QUICK_REACTIONS.map((emoji, index) => {
        const hasReacted = currentUserReactions.includes(emoji)
        return (
          <motion.button
            key={emoji}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => handleReaction(emoji)}
            className={cn(
              "relative flex size-8 items-center justify-center rounded-full text-lg transition-all hover:scale-125 hover:bg-white/10",
              hasReacted && "bg-amber-500/20"
            )}
          >
            {emoji}
            {hasReacted && (
              <motion.div
                layoutId={`reaction-ring-${emoji}`}
                className="absolute inset-0 rounded-full ring-2 ring-amber-500"
              />
            )}
          </motion.button>
        )
      })}

      <div className="mx-0.5 h-5 w-px bg-white/10" />

      <Popover open={showFullPicker} onOpenChange={setShowFullPicker}>
        <PopoverTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <Plus size={16} />
          </motion.button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto border-0 bg-transparent p-0 shadow-2xl"
          sideOffset={8}
          align={align}
        >
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiSelect}
            width={320}
            height={400}
          />
        </PopoverContent>
      </Popover>
    </motion.div>
  )
}

// Composant pour afficher les réactions existantes sur un message
type MessageReactionsDisplayProps = {
  reactions: Array<{ emoji: string; userId: string; createdAt: number }>
  currentUserId?: string
  messageId: Id<"messages">
  isFromCurrentUser?: boolean
}

export const MessageReactionsDisplay = ({
  reactions,
  currentUserId,
  messageId,
  isFromCurrentUser,
}: MessageReactionsDisplayProps) => {
  const toggleReaction = useMutation(api.messaging.toggleReaction)

  // Grouper les réactions par emoji
  const grouped = reactions.reduce(
    (acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { count: 0, userIds: [], hasCurrentUser: false }
      }
      acc[r.emoji].count++
      acc[r.emoji].userIds.push(r.userId)
      if (r.userId === currentUserId) {
        acc[r.emoji].hasCurrentUser = true
      }
      return acc
    },
    {} as Record<
      string,
      { count: number; userIds: string[]; hasCurrentUser: boolean }
    >
  )

  const handleReactionClick = async (emoji: string) => {
    await toggleReaction({ messageId, emoji })
  }

  if (Object.keys(grouped).length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-wrap gap-1",
        isFromCurrentUser && "justify-end"
      )}
    >
      {Object.entries(grouped).map(([emoji, data]) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleReactionClick(emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-sm transition-colors",
            data.hasCurrentUser
              ? "bg-amber-500/20 ring-1 ring-amber-500/50"
              : "bg-white/5 hover:bg-white/10"
          )}
        >
          <span>{emoji}</span>
          {data.count > 1 && (
            <span className="text-xs text-muted-foreground">{data.count}</span>
          )}
        </motion.button>
      ))}
    </motion.div>
  )
}
