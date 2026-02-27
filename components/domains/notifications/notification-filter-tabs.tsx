"use client"

import {
  Check,
  ChevronDown,
  Coins,
  CreditCard,
  Heart,
  ImagePlus,
  LayoutGrid,
  MessageSquareText,
  UserPlus,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type NotificationFilterType =
  | "all"
  | "like"
  | "comment"
  | "subscriptions"
  | "follow"
  | "newPost"
  | "tip"

interface FilterOption {
  id: NotificationFilterType
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const filterOptions: FilterOption[] = [
  {
    id: "all",
    label: "Toutes les notifications",
    shortLabel: "Tous",
    icon: LayoutGrid,
    color: "text-primary",
  },
  {
    id: "like",
    label: "J'aime",
    shortLabel: "J'aime",
    icon: Heart,
    color: "text-rose-500",
  },
  {
    id: "comment",
    label: "Commentaires",
    shortLabel: "Commentaires",
    icon: MessageSquareText,
    color: "text-sky-500",
  },
  {
    id: "subscriptions",
    label: "Abonnements",
    shortLabel: "Abonnements",
    icon: CreditCard,
    color: "text-emerald-500",
  },
  {
    id: "follow",
    label: "Nouveaux suiveurs",
    shortLabel: "Suiveurs",
    icon: UserPlus,
    color: "text-violet-500",
  },
  {
    id: "newPost",
    label: "Nouvelles publications",
    shortLabel: "Publications",
    icon: ImagePlus,
    color: "text-violet-500",
  },
  {
    id: "tip",
    label: "Pourboires",
    shortLabel: "Pourboires",
    icon: Coins,
    color: "text-amber-500",
  },
]

interface NotificationFilterTabsProps {
  activeFilter: NotificationFilterType
  onFilterChange: (filter: NotificationFilterType) => void
}

export const NotificationFilterTabs = ({
  activeFilter,
  onFilterChange,
}: NotificationFilterTabsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeOption = filterOptions.find((opt) => opt.id === activeFilter)!
  const ActiveIcon = activeOption.icon

  const handleSelect = useCallback(
    (id: NotificationFilterType) => {
      onFilterChange(id)
      setIsOpen(false)
    },
    [onFilterChange],
  )

  // Close on click outside or escape key
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "glass-button flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-colors",
          "border border-white/10 hover:border-white/20",
          isOpen && "ring-primary/30 border-primary/50 ring-2",
        )}
        whileTap={{ scale: 0.98 }}
      >
        <span
          className={cn("flex items-center justify-center", activeOption.color)}
        >
          <ActiveIcon className="size-4" />
        </span>
        <span className="text-sm font-medium">{activeOption.shortLabel}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-muted-foreground"
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "absolute top-full left-0 z-50 mt-2 min-w-[240px] origin-top-left",
              "bg-popover overflow-hidden rounded-xl border p-1.5",
              "shadow-xl shadow-black/20",
            )}
          >
            {filterOptions.map((option, index) => {
              const Icon = option.icon
              const isActive = activeFilter === option.id

              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.15 }}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {/* Icon */}
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/20"
                        : "bg-muted group-hover:bg-muted-foreground/10",
                      option.color,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>

                  {/* Label */}
                  <span className="flex-1 text-sm font-medium">
                    {option.label}
                  </span>

                  {/* Check indicator */}
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="text-primary"
                    >
                      <Check className="size-4" />
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
