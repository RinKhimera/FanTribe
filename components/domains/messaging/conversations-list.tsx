"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { motion, AnimatePresence } from "motion/react"
import { api } from "@/convex/_generated/api"
import { ConversationBox } from "./conversation-box"
import { Skeleton } from "@/components/ui/skeleton"

export const ConversationsList = () => {
  const { isAuthenticated } = useConvexAuth()

  const conversations = useQuery(
    api.messaging.getMyConversations,
    isAuthenticated ? {} : "skip"
  )

  // Loading state avec skeleton amélioré
  if (conversations === undefined) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 border-b border-white/5 p-4"
          >
            <Skeleton className="size-12 rounded-full bg-white/5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28 bg-white/5" />
              <Skeleton className="h-3 w-44 bg-white/5" />
            </div>
            <Skeleton className="h-3 w-10 bg-white/5" />
          </motion.div>
        ))}
      </div>
    )
  }

  // État vide
  if (conversations.length === 0) {
    return <EmptyConversationsList />
  }

  return (
    <div className="flex flex-col">
      <AnimatePresence mode="popLayout">
        {conversations.map((conversation, index) => (
          <motion.div
            key={conversation._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{
              delay: index * 0.03,
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
          >
            <ConversationBox conversation={conversation} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// État vide stylisé
const EmptyConversationsList = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center px-6 py-16"
    >
      {/* Illustration animée */}
      <motion.div
        initial={{ y: 10 }}
        animate={{ y: [10, 0, 10] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 blur-2xl" />
        <div className="relative flex size-24 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl"
          >
            💬
          </motion.span>
        </div>
      </motion.div>

      {/* Texte */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        Aucune conversation
      </h3>
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        Vos conversations avec les créateurs apparaîtront ici. Commencez par
        vous abonner à un créateur !
      </p>

      {/* Effet décoratif */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            className="size-2 rounded-full bg-amber-500/50"
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
