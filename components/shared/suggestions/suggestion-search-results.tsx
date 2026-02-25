"use client"

import { motion, AnimatePresence } from "motion/react"
import { Search, Loader2 } from "lucide-react"
import { SuggestionCard } from "./suggestion-card"
import { UserProps } from "@/types"
import { pluralize } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface SuggestionSearchResultsProps {
  results: NonNullable<UserProps>[]
  searchTerm: string
  isLoading: boolean
}

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export const SuggestionSearchResults = ({
  results,
  searchTerm,
  isLoading,
}: SuggestionSearchResultsProps) => {
  return (
    <div className="space-y-4">
      {/* Header with search term */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2"
      >
        <h3 className="text-base font-semibold text-foreground">
          Resultats pour{" "}
        </h3>
        <span className={cn(
          "px-2.5 py-1 rounded-lg text-sm font-medium",
          "bg-primary/15 text-primary",
          "border border-primary/20"
        )}>
          &quot;{searchTerm}&quot;
        </span>
      </motion.div>

      {/* Loading state */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg" />
            <Loader2 className="h-8 w-8 text-primary relative" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground mt-4 font-medium"
          >
            Recherche en cours…
          </motion.p>
        </motion.div>
      ) : results.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex flex-col items-center justify-center py-12 px-6",
            "glass-card rounded-xl text-center"
          )}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
            className="relative mb-4"
          >
            <div className="absolute inset-0 rounded-full bg-muted/50 blur-lg scale-150" />
            <div className={cn(
              "relative h-14 w-14 rounded-full",
              "bg-muted/60",
              "flex items-center justify-center"
            )}>
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
          </motion.div>

          <motion.h4
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-semibold text-foreground mb-1"
          >
            Aucun utilisateur trouve
          </motion.h4>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            Essayez avec un autre nom ou username
          </motion.p>
        </motion.div>
      ) : (
        /* Results list */
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {results.map((user, index) => (
              <SuggestionCard
                key={user._id}
                user={user}
                searchTerm={searchTerm}
                variant="compact"
                index={index}
              />
            ))}
          </AnimatePresence>

          {/* Results count */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-muted-foreground text-center pt-2"
          >
            {results.length} {pluralize(results.length, "resultat")} {pluralize(results.length, "trouve")}
          </motion.p>
        </motion.div>
      )}
    </div>
  )
}
