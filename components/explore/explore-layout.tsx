"use client"

import { AnimatePresence, motion } from "motion/react"
import { Compass } from "lucide-react"
import { SuggestionSearchResults } from "@/components/shared/suggestions/suggestion-search-results"
import { PageContainer } from "@/components/layout"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { ExploreFeed } from "./explore-feed"
import { ExploreHeader } from "./explore-header"
import { ExploreSuggestions } from "./explore-suggestions"
import { useExplore } from "./use-explore"

export const ExploreLayout = () => {
  const { currentUser } = useCurrentUser()
  const user = currentUser ?? undefined
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    clearSearch,
    isSearching,
    isSearchLoading,
    searchResults,
    suggestedCreators,
    isSuggestionsLoading,
    sortBy,
    setSortBy,
    refresh,
  } = useExplore()

  return (
    <PageContainer
      title="Explorer"
      headerIcon={Compass}
      secondaryBar={
        <ExploreHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchClear={clearSearch}
          isSearchLoading={isSearchLoading}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      }
    >
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3"
          >
            <SuggestionSearchResults
              results={searchResults}
              searchTerm={debouncedSearchTerm}
              isLoading={isSearchLoading}
            />
          </motion.div>
        ) : (
          <motion.div
            key="explore-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ExploreSuggestions
              creators={suggestedCreators}
              isLoading={isSuggestionsLoading}
              onRefresh={refresh}
            />

            <ExploreFeed currentUser={user} sortBy={sortBy} />
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}
