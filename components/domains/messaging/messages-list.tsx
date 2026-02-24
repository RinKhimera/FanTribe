"use client"

import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { useMessagesPagination } from "@/hooks/useMessagesPagination"
import { MessageBox } from "./message-box"

type MessagesListProps = {
  conversationId: Id<"conversations">
  currentUser: Doc<"users"> | null
}

export const MessagesList = ({
  conversationId,
  currentUser,
}: MessagesListProps) => {
  const {
    messages,
    hasMore,
    isLoadingMore,
    isReady,
    reachedOldest,
    loadMoreMessages,
    scrollToBottom,
    messagesEndRef,
    containerRef,
    showScrollToBottom,
  } = useMessagesPagination({ conversationId })

  const containerStyle = {
    visibility: isReady ? ("visible" as const) : ("hidden" as const),
    transition: "visibility 0s",
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full flex-1 overflow-auto"
      style={containerStyle}
    >
      <div className="mx-4 flex flex-col gap-2 py-4">
        {/* Bouton pour charger plus de messages */}
        <AnimatePresence>
          {hasMore && !reachedOldest && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center py-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMoreMessages}
                disabled={isLoadingMore}
                className="gap-2 rounded-full border border-white/10 bg-white/5 text-xs hover:bg-white/10"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Chargement…
                  </>
                ) : (
                  <>
                    <ChevronUp size={14} />
                    Messages précédents
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicateur début de conversation */}
        {reachedOldest && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 py-6 text-center"
          >
            <div className="h-px w-16 bg-linear-to-r from-transparent via-amber-500/30 to-transparent" />
            <span className="text-xs text-muted-foreground">
              Début de la conversation
            </span>
          </motion.div>
        )}

        {/* Liste des messages */}
        {messages.map((message, index) => (
          <motion.div
            key={message._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MessageBox
              currentUser={currentUser}
              message={message}
              previousMessage={index > 0 ? messages[index - 1] : undefined}
            />
          </motion.div>
        ))}

        {/* Référence pour le scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Bouton scroll to bottom */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToBottom}
            aria-label="Défiler vers le bas"
            className="absolute bottom-4 right-4 z-10 flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/80 text-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-black/90"
          >
            <ChevronDown size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
