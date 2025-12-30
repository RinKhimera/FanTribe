"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const shimmerVariants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear" as const,
    },
  },
}

const SkeletonCard = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.3 }}
    className={cn(
      "relative h-[140px] rounded-xl overflow-hidden",
      "glass-card"
    )}
  >
    {/* Banner skeleton with shimmer */}
    <div className="absolute inset-0 bg-muted/40 overflow-hidden">
      <motion.div
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ width: "50%" }}
      />
    </div>

    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

    {/* Avatar skeleton */}
    <div className="absolute left-4 top-1/2 -translate-y-1/2">
      <div className="relative">
        <div
          className={cn(
            "h-20 w-20 rounded-full",
            "bg-muted/60 ring-2 ring-white/10",
            "overflow-hidden"
          )}
        >
          <motion.div
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>

    {/* Text skeletons */}
    <div className="absolute bottom-4 left-[100px] right-4 space-y-2">
      <div className="h-5 w-28 rounded-md bg-white/10 overflow-hidden relative">
        <motion.div
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ width: "100%" }}
        />
      </div>
      <div className="h-4 w-20 rounded-md bg-white/5 overflow-hidden relative">
        <motion.div
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          style={{ width: "100%" }}
        />
      </div>
    </div>
  </motion.div>
)

export const SuggestionSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded-lg bg-muted/40 overflow-hidden relative">
          <motion.div
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{ width: "100%" }}
          />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-full bg-muted/30 overflow-hidden relative"
            >
              <motion.div
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{ width: "100%" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </div>

      {/* Pagination dots skeleton */}
      <div className="flex justify-center gap-2 pt-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className={cn(
              "h-2 rounded-full bg-muted/40",
              index === 0 ? "w-6" : "w-2"
            )}
          />
        ))}
      </div>
    </div>
  )
}
