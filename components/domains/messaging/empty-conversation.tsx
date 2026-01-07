"use client"

import { motion } from "motion/react"
import { MessageSquare } from "lucide-react"

export const EmptyConversation = () => {
  return (
    <div className="hidden h-full w-full items-center justify-center lg:flex">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        {/* Illustration animée */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 15 }}
          className="relative mb-8"
        >
          {/* Cercles décoratifs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 -m-8 rounded-full bg-amber-500/10 blur-2xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            className="absolute inset-0 -m-4 rounded-full bg-orange-500/10 blur-xl"
          />

          {/* Icône principale */}
          <div className="relative flex size-24 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-white/[0.02] shadow-2xl backdrop-blur-sm">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <MessageSquare
                size={40}
                className="text-amber-500"
                strokeWidth={1.5}
              />
            </motion.div>

            {/* Notification dot */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -right-1 -top-1"
            >
              <span className="relative flex size-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-4 rounded-full bg-linear-to-br from-amber-500 to-orange-500" />
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Texte */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-sm space-y-3"
        >
          <h3 className="text-xl font-semibold text-foreground">
            Bienvenue dans vos messages
          </h3>
          <p className="text-sm text-muted-foreground">
            Sélectionnez une conversation dans la liste ou démarrez une nouvelle
            discussion avec un créateur
          </p>
        </motion.div>

        {/* Indicateur de sélection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <div className="h-px w-8 bg-linear-to-r from-transparent to-white/20" />
          <span>Choisissez une conversation</span>
          <div className="h-px w-8 bg-linear-to-l from-transparent to-white/20" />
        </motion.div>
      </motion.div>
    </div>
  )
}
