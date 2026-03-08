"use client"

import { Cookie, FileText, Shield } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SuggestionCarousel } from "./suggestion-carousel"
import { SuggestionSearch } from "./suggestion-search"
import { SuggestionSearchResults } from "./suggestion-search-results"
import { useSuggestions } from "./use-suggestions"

const legalLinks = [
  { href: "/terms", label: "Conditions", icon: FileText },
  { href: "/privacy", label: "Confidentialité", icon: Shield },
  { href: "/cookies", label: "Cookies", icon: Cookie },
]

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

export const SuggestionSidebar = () => {
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    isSearchLoading,
    isSuggestionsLoading,
    suggestedCreators,
    searchResults,
    refresh,
    clearSearch,
  } = useSuggestions()

  return (
    <motion.div
      className="mt-3 space-y-5"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Search input */}
      <motion.div variants={itemVariants}>
        <SuggestionSearch
          value={searchTerm}
          onChange={setSearchTerm}
          onClear={clearSearch}
          isLoading={isSearchLoading}
        />
      </motion.div>

      {/* Content: Search results or Suggestions carousel */}
      <motion.div variants={itemVariants}>
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <SuggestionSearchResults
                results={searchResults}
                searchTerm={debouncedSearchTerm}
                isLoading={isSearchLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="carousel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <SuggestionCarousel
                creators={suggestedCreators}
                isLoading={isSuggestionsLoading}
                onRefresh={refresh}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Legal Links */}
      <motion.div
        variants={itemVariants}
        className="border-border/40 border-t pt-4"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {legalLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5",
                  "text-muted-foreground text-xs",
                  "hover:text-primary transition-colors duration-200",
                )}
              >
                <Icon className="h-3 w-3" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
