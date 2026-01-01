"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface ViewerControlsProps {
  index: number
  total: number
  onClose: () => void
  onNavigate: (dir: 1 | -1) => void
}

export const ViewerControls = ({
  index,
  total,
  onClose,
  onNavigate,
}: ViewerControlsProps) => {
  return (
    <>
      {/* Close button - glass style */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        onClick={onClose}
        aria-label="Fermer"
        className={cn(
          "absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex size-10 items-center justify-center rounded-full",
          "bg-white/10 backdrop-blur-md border border-white/20",
          "transition-all duration-300",
          "hover:scale-105 hover:bg-white/20"
        )}
      >
        <X className="size-4 text-white/90" />
      </motion.button>

      {/* Counter badge */}
      {total > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
          className={cn(
            "absolute top-3 sm:top-4 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2",
            "bg-black/50 backdrop-blur-md border border-white/20"
          )}
        >
          <span className="text-xs sm:text-sm font-medium tracking-wide">
            <span className="text-white">{index + 1}</span>
            <span className="text-white/50 mx-1">/</span>
            <span className="text-white/80">{total}</span>
          </span>
        </motion.div>
      )}

      {/* Navigation - Prev */}
      {total > 1 && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(-1)
          }}
          aria-label="Précédent"
          disabled={index === 0}
          className={cn(
            "absolute top-1/2 left-3 sm:left-6 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full",
            "bg-white/10 backdrop-blur-md border border-white/20",
            "transition-all duration-300",
            index === 0
              ? "cursor-not-allowed opacity-30"
              : "hover:scale-105 hover:bg-white/20"
          )}
        >
          <ChevronLeft
            className={cn(
              "size-5 transition-colors duration-300",
              index === 0 ? "text-white/50" : "text-white/90"
            )}
          />
        </motion.button>
      )}

      {/* Navigation - Next */}
      {total > 1 && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(1)
          }}
          aria-label="Suivant"
          disabled={index === total - 1}
          className={cn(
            "absolute top-1/2 right-3 sm:right-6 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full",
            "bg-white/10 backdrop-blur-md border border-white/20",
            "transition-all duration-300",
            index === total - 1
              ? "cursor-not-allowed opacity-30"
              : "hover:scale-105 hover:bg-white/20"
          )}
        >
          <ChevronRight
            className={cn(
              "size-5 transition-colors duration-300",
              index === total - 1 ? "text-white/50" : "text-white/90"
            )}
          />
        </motion.button>
      )}
    </>
  )
}
