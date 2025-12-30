"use client"

import { motion, AnimatePresence } from "motion/react"
import { SuggestionSearch } from "./suggestion-search"
import { SuggestionCarousel } from "./suggestion-carousel"
import { SuggestionSearchResults } from "./suggestion-search-results"
import { useSuggestions } from "./use-suggestions"

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
    </motion.div>
  )
}
