"use client"

import { Check, ChevronDown, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSuperuserFilters } from "@/hooks/useSuperuserFilters"
import { cn } from "@/lib/utils"

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDefinition {
  key: string
  label: string
  type: "select" | "multi-select"
  options: FilterOption[]
}

interface SuperuserFiltersBarProps {
  filters: FilterDefinition[]
  className?: string
}

export function SuperuserFiltersBar({
  filters,
  className,
}: SuperuserFiltersBarProps) {
  const {
    getFilter,
    getFilterAll,
    setFilter,
    toggleFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useSuperuserFilters()

  // Get active filter pills data
  const activePills: Array<{
    filterKey: string
    value: string
    label: string
    filterLabel: string
  }> = []

  filters.forEach((filter) => {
    if (filter.type === "select") {
      const value = getFilter(filter.key)
      if (value) {
        const option = filter.options.find((o) => o.value === value)
        if (option) {
          activePills.push({
            filterKey: filter.key,
            value: value,
            label: option.label,
            filterLabel: filter.label,
          })
        }
      }
    } else {
      const values = getFilterAll(filter.key)
      values.forEach((value) => {
        const option = filter.options.find((o) => o.value === value)
        if (option) {
          activePills.push({
            filterKey: filter.key,
            value: value,
            label: option.label,
            filterLabel: filter.label,
          })
        }
      })
    }
  })

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter icon with count */}
        <div className="text-muted-foreground flex items-center gap-1.5 pr-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtres</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 justify-center px-1.5 text-[10px] font-bold"
            >
              {activeFilterCount}
            </Badge>
          )}
        </div>

        {/* Filter dropdowns */}
        {filters.map((filter) => (
          <FilterDropdown
            key={filter.key}
            filter={filter}
            value={
              filter.type === "select"
                ? getFilter(filter.key)
                : getFilterAll(filter.key)
            }
            onChange={(value) => {
              if (filter.type === "select") {
                setFilter(filter.key, value as string | null)
              } else {
                toggleFilter(filter.key, value as string)
              }
            }}
          />
        ))}

        {/* Clear all button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-destructive h-8 gap-1.5 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Effacer tout
          </Button>
        )}
      </div>

      {/* Active filter pills */}
      {activePills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activePills.map((pill, idx) => (
            <Badge
              key={`${pill.filterKey}-${pill.value}-${idx}`}
              variant="secondary"
              className="group gap-1 py-1 pl-2 pr-1 text-xs"
            >
              <span className="text-muted-foreground font-normal">
                {pill.filterLabel}:
              </span>
              <span className="font-medium">{pill.label}</span>
              <button
                onClick={() => toggleFilter(pill.filterKey, pill.value)}
                className="hover:bg-muted ml-0.5 rounded p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterDropdown({
  filter,
  value,
  onChange,
}: {
  filter: FilterDefinition
  value: string | string[] | null
  onChange: (value: string | null) => void
}) {
  const isMulti = filter.type === "multi-select"
  const selectedValues = isMulti
    ? (value as string[]) ?? []
    : value
      ? [value as string]
      : []
  const hasSelection = selectedValues.length > 0

  const getDisplayLabel = () => {
    if (!hasSelection) return filter.label

    if (isMulti && selectedValues.length > 1) {
      return `${filter.label} (${selectedValues.length})`
    }

    const option = filter.options.find((o) => o.value === selectedValues[0])
    return option?.label ?? filter.label
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs font-normal",
            hasSelection && "border-primary/50 bg-primary/5",
          )}
        >
          {getDisplayLabel()}
          <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1">
        {/* Clear option for single select */}
        {!isMulti && hasSelection && (
          <>
            <button
              onClick={() => onChange(null)}
              className="hover:bg-muted text-muted-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Effacer
            </button>
            <div className="bg-border my-1 h-px" />
          </>
        )}

        {/* Options */}
        {filter.options.map((option) => {
          const isSelected = selectedValues.includes(option.value)

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                isSelected
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted",
              )}
            >
              {isMulti && (
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
              )}
              <span className="flex-1 truncate">{option.label}</span>
              {!isMulti && isSelected && (
                <Check className="text-primary h-4 w-4 shrink-0" />
              )}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
