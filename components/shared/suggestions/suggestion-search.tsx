"use client"

import { motion, AnimatePresence } from "motion/react"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SuggestionSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  isLoading?: boolean
  placeholder?: string
}

export const SuggestionSearch = ({
  value,
  onChange,
  onClear,
  isLoading,
  placeholder = "Rechercher des créateurs…",
}: SuggestionSearchProps) => {
  return (
    <div className="relative group">
      {/* Main search container */}
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "glass-card transition-[border-color,box-shadow] duration-300",
          "border border-transparent",
          value && "border-primary/20 shadow-[0_0_20px_-5px_var(--primary)]"
        )}
        whileTap={{ scale: 0.995 }}
      >
        {/* Search icon with subtle animation */}
        <motion.label
          htmlFor="suggestion-search"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 cursor-text"
          animate={{
            color: value ? "var(--primary)" : "var(--muted-foreground)",
            scale: value ? 1.05 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <Search className="h-[18px] w-[18px]" />
        </motion.label>

        {/* Input field */}
        <input
          id="suggestion-search"
          type="text"
          name="search"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-12 bg-transparent",
            "pl-11 pr-11 py-3",
            "text-sm font-medium placeholder:text-muted-foreground/60",
            "border-none",
            "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden",
            "transition-colors duration-200"
          )}
        />

        {/* Right side: Loading spinner or clear button */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Loader2 className="h-[18px] w-[18px] text-primary animate-spin" />
            </motion.div>
          ) : value ? (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
              onClick={onClear}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "p-1.5 rounded-full",
                "bg-muted/50 hover:bg-primary/20",
                "text-muted-foreground hover:text-primary",
                "transition-colors duration-200"
              )}
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* Animated underline */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary/60 via-primary to-primary/60"
          initial={{ width: "0%" }}
          animate={{ width: value ? "100%" : "0%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </motion.div>

      {/* Ambient glow effect */}
      <motion.div
        className={cn(
          "absolute inset-0 -z-10 rounded-2xl blur-2xl",
          "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: value ? 0.6 : 0 }}
        transition={{ duration: 0.4 }}
      />
    </div>
  )
}
