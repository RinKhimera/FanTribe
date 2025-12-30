"use client"

import { useQuery } from "convex/react"
import {
  AlertTriangle,
  FileText,
  Loader2,
  Search,
  User,
  Users,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

type SearchCategory = "all" | "users" | "applications" | "reports"

const categoryConfig = {
  users: {
    label: "Utilisateurs",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  applications: {
    label: "Candidatures",
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  reports: {
    label: "Signalements",
    icon: AlertTriangle,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  approved: { label: "Approuvé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
  resolved: { label: "Résolu", variant: "default" },
  reviewing: { label: "En revue", variant: "outline" },
}

export function SuperuserSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [category, setCategory] = useState<SearchCategory>("all")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Search results
  const searchResults = useQuery(
    api.superuser.globalSearch,
    debouncedQuery.length >= 2
      ? { searchQuery: debouncedQuery, category, limit: 5 }
      : "skip",
  )

  const isSearching = debouncedQuery.length >= 2 && searchResults === undefined

  // Create stable key for results to avoid unstable deps
  const resultsKey =
    (searchResults?.users?.map((u) => u._id).join(",") ?? "") +
    "|" +
    (searchResults?.applications?.map((a) => a._id).join(",") ?? "") +
    "|" +
    (searchResults?.reports?.map((r) => r._id).join(",") ?? "")

  // Flatten results for keyboard navigation (memoized to avoid recreating on every render)
  const flatResults = useMemo(
    () => [
      ...(searchResults?.users?.map((u) => ({ ...u, type: "user" as const })) ?? []),
      ...(searchResults?.applications?.map((a) => ({ ...a, type: "application" as const })) ?? []),
      ...(searchResults?.reports?.map((r) => ({ ...r, type: "report" as const })) ?? []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resultsKey],
  )

  const hasResults = flatResults.length > 0
  const showNoResults = debouncedQuery.length >= 2 && !isSearching && !hasResults

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Navigate to result
  const navigateToResult = useCallback(
    (result: (typeof flatResults)[0]) => {
      setIsOpen(false)
      setQuery("")

      switch (result.type) {
        case "user":
          router.push(`/${(result as { username: string }).username}`)
          break
        case "application":
          router.push(`/superuser/creator-applications/${result._id}`)
          break
        case "report":
          router.push(`/superuser/reports/${result._id}`)
          break
      }
    },
    [router],
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === "ArrowDown") {
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : prev,
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && flatResults[selectedIndex]) {
            navigateToResult(flatResults[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          setSelectedIndex(-1)
          break
      }
    },
    [isOpen, flatResults, selectedIndex, navigateToResult],
  )

  // Reset selected index when results change (during render to avoid cascading effects)
  const prevResultsKeyRef = useRef(resultsKey)
  if (prevResultsKeyRef.current !== resultsKey) {
    prevResultsKeyRef.current = resultsKey
    if (selectedIndex !== -1) {
      setSelectedIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5",
          "bg-muted/50 transition-all duration-200",
          "focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20",
          isOpen && "ring-2 ring-primary/20 bg-background",
        )}
      >
        <Search className="text-muted-foreground h-4 w-4 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "bg-transparent text-sm outline-none",
            "placeholder:text-muted-foreground/60",
            "w-32 focus:w-48 transition-all duration-200",
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {isSearching && (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-80",
            "bg-popover border rounded-xl shadow-xl",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            "overflow-hidden",
          )}
        >
          {/* Category Tabs */}
          <div className="border-b p-1.5">
            <div className="flex gap-1">
              {(["all", "users", "applications", "reports"] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                      category === cat
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {cat === "all" ? "Tout" : categoryConfig[cat].label}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              </div>
            )}

            {showNoResults && (
              <div className="py-8 text-center">
                <Search className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  Aucun résultat pour &quot;{debouncedQuery}&quot;
                </p>
              </div>
            )}

            {/* Users Section */}
            {searchResults?.users && searchResults.users.length > 0 && (
              <ResultSection title="Utilisateurs" icon={Users} color="blue">
                {searchResults.users.map((user, idx) => {
                  const globalIdx = idx
                  return (
                    <ResultItem
                      key={user._id}
                      isSelected={selectedIndex === globalIdx}
                      onClick={() =>
                        navigateToResult({ ...user, type: "user" })
                      }
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback className="text-xs">
                          {user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          @{user.username}
                        </p>
                      </div>
                    </ResultItem>
                  )
                })}
              </ResultSection>
            )}

            {/* Applications Section */}
            {searchResults?.applications &&
              searchResults.applications.length > 0 && (
                <ResultSection
                  title="Candidatures"
                  icon={FileText}
                  color="orange"
                >
                  {searchResults.applications.map((app, idx) => {
                    const globalIdx =
                      (searchResults?.users?.length ?? 0) + idx
                    const status = statusLabels[app.status] ?? {
                      label: app.status,
                      variant: "secondary" as const,
                    }
                    return (
                      <ResultItem
                        key={app._id}
                        isSelected={selectedIndex === globalIdx}
                        onClick={() =>
                          navigateToResult({ ...app, type: "application" })
                        }
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10">
                          <User className="h-3.5 w-3.5 text-orange-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {app.fullName}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {app.email}
                          </p>
                        </div>
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </ResultItem>
                    )
                  })}
                </ResultSection>
              )}

            {/* Reports Section */}
            {searchResults?.reports && searchResults.reports.length > 0 && (
              <ResultSection
                title="Signalements"
                icon={AlertTriangle}
                color="rose"
              >
                {searchResults.reports.map((report, idx) => {
                  const globalIdx =
                    (searchResults?.users?.length ?? 0) +
                    (searchResults?.applications?.length ?? 0) +
                    idx
                  const status = statusLabels[report.status] ?? {
                    label: report.status,
                    variant: "secondary" as const,
                  }
                  return (
                    <ResultItem
                      key={report._id}
                      isSelected={selectedIndex === globalIdx}
                      onClick={() =>
                        navigateToResult({ ...report, type: "report" })
                      }
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-500/10">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium capitalize">
                          {report.type} - {report.reason.replace(/_/g, " ")}
                        </p>
                      </div>
                      <Badge variant={status.variant} className="text-[10px]">
                        {status.label}
                      </Badge>
                    </ResultItem>
                  )
                })}
              </ResultSection>
            )}
          </div>

          {/* Footer hint */}
          {hasResults && (
            <div className="border-t px-3 py-2">
              <p className="text-muted-foreground text-[10px]">
                <kbd className="bg-muted rounded px-1 py-0.5 font-mono">↑↓</kbd>{" "}
                naviguer •{" "}
                <kbd className="bg-muted rounded px-1 py-0.5 font-mono">↵</kbd>{" "}
                sélectionner •{" "}
                <kbd className="bg-muted rounded px-1 py-0.5 font-mono">esc</kbd>{" "}
                fermer
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultSection({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string
  icon: React.ElementType
  color: "blue" | "orange" | "rose"
  children: React.ReactNode
}) {
  const colorClasses = {
    blue: "text-blue-500",
    orange: "text-orange-500",
    rose: "text-rose-500",
  }

  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 flex items-center gap-1.5 px-2">
        <Icon className={cn("h-3 w-3", colorClasses[color])} />
        <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function ResultItem({
  isSelected,
  onClick,
  children,
}: {
  isSelected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5",
        "text-left transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
