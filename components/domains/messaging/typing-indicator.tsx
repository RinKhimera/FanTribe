"use client"

import { useQuery } from "convex/react"
import { motion, AnimatePresence } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

type TypingIndicatorProps = {
  conversationId: Id<"conversations">
  otherParticipant?: {
    name?: string
    image?: string
  }
}

export const TypingIndicator = ({
  conversationId,
  otherParticipant,
}: TypingIndicatorProps) => {
  const typingData = useQuery(api.messaging.getTypingIndicators, {
    conversationId,
  })

  const isTyping = typingData && typingData.length > 0

  return (
    <AnimatePresence>
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Avatar className="size-6 ring-2 ring-amber-500/20">
            <AvatarImage src={otherParticipant?.image} />
            <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-xs">
              {otherParticipant?.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs text-muted-foreground">
              {otherParticipant?.name ?? "Quelqu'un"} écrit
            </span>
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-amber-500"
                  animate={{
                    y: [0, -4, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
