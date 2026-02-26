"use client"

import { AnimatePresence, motion } from "motion/react"
import { Sparkles } from "lucide-react"

interface UsernameSuggestionsProps {
  suggestions: string[]
  onSelect: (username: string) => void
}

export const UsernameSuggestions = ({
  suggestions,
  onSelect,
}: UsernameSuggestionsProps) => {
  if (!suggestions.length) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        className="overflow-hidden"
      >
        <div className="pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Sparkles className="size-3" />
              Suggestions :
            </span>
            {suggestions.map((s, i) => (
              <motion.button
                key={s}
                type="button"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(s)}
                className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors"
              >
                @{s}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
