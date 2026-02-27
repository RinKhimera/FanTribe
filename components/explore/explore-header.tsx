"use client"

import { Clock, TrendingUp } from "lucide-react"
import { motion } from "motion/react"
import { SuggestionSearch } from "@/components/shared/suggestions/suggestion-search"
import { cn } from "@/lib/utils"
import type { ExploreSortMode } from "./use-explore"

interface ExploreHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearchClear: () => void
  isSearchLoading: boolean
  sortBy: ExploreSortMode
  onSortChange: (sort: ExploreSortMode) => void
}

const sortOptions: {
  value: ExploreSortMode
  label: string
  icon: typeof Clock
}[] = [
  { value: "recent", label: "Récents", icon: Clock },
  { value: "trending", label: "Tendances", icon: TrendingUp },
]

export const ExploreHeader = ({
  searchTerm,
  onSearchChange,
  onSearchClear,
  isSearchLoading,
  sortBy,
  onSortChange,
}: ExploreHeaderProps) => {
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <SuggestionSearch
        value={searchTerm}
        onChange={onSearchChange}
        onClear={onSearchClear}
        isLoading={isSearchLoading}
        placeholder="Rechercher sur Explorer…"
      />

      <div className="flex items-center gap-2">
        {sortOptions.map(({ value, label, icon: Icon }) => {
          const isActive = sortBy === value
          return (
            <motion.button
              key={value}
              onClick={() => onSortChange(value)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
                "cursor-pointer text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_-3px_var(--primary)]"
                  : "glass-button text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
