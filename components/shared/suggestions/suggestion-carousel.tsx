"use client"

import { useState, useCallback, useEffect, useEffectEvent } from "react"
import { motion, AnimatePresence } from "motion/react"
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { SuggestionCard } from "./suggestion-card"
import { SuggestionSkeleton } from "./suggestion-skeleton"
import { SuggestionEmpty } from "./suggestion-empty"
import { cn } from "@/lib/utils"
import { UserProps } from "@/types"

interface SuggestionCarouselProps {
  creators: NonNullable<UserProps>[]
  isLoading: boolean
  onRefresh: () => void
}

// Chunk array into groups of n
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

export const SuggestionCarousel = ({
  creators,
  isLoading,
  onRefresh,
}: SuggestionCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const userGroups = chunkArray(creators, 3)

  const updateCurrent = useEffectEvent((index: number) => {
    setCurrent(index)
  })

  useEffect(() => {
    if (!api) return
    updateCurrent(api.selectedScrollSnap())
    api.on("select", () => updateCurrent(api.selectedScrollSnap()))
  }, [api])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    onRefresh()
    api?.scrollTo(0)
    setCurrent(0)
    setTimeout(() => setIsRefreshing(false), 600)
  }, [onRefresh, api])

  if (isLoading) {
    return <SuggestionSkeleton />
  }

  if (creators.length === 0) {
    return <SuggestionEmpty />
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="relative"
    >
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <h3 className="text-lg font-bold text-foreground tracking-tight">
          Suggestions
        </h3>

        <div className="flex items-center gap-1.5">
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "h-8 w-8 rounded-full",
              "glass-button border-0",
              "hover:bg-primary/15 hover:text-primary",
              "transition-all duration-200"
            )}
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <RotateCcw className="h-4 w-4" />
            </motion.div>
          </Button>

          {/* Navigation arrows */}
          {userGroups.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => api?.scrollPrev()}
                disabled={current === 0}
                className={cn(
                  "h-8 w-8 rounded-full",
                  "glass-button border-0",
                  "hover:bg-primary/15 hover:text-primary",
                  "disabled:opacity-30 disabled:hover:bg-transparent",
                  "transition-all duration-200"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => api?.scrollNext()}
                disabled={current === userGroups.length - 1}
                className={cn(
                  "h-8 w-8 rounded-full",
                  "glass-button border-0",
                  "hover:bg-primary/15 hover:text-primary",
                  "disabled:opacity-30 disabled:hover:bg-transparent",
                  "transition-all duration-200"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Carousel */}
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent className="-ml-3">
          <AnimatePresence mode="wait">
            {userGroups.map((group, groupIndex) => (
              <CarouselItem key={groupIndex} className="pl-3">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {group.map((user, index) => (
                    <SuggestionCard
                      key={user._id}
                      user={user}
                      index={index}
                    />
                  ))}
                </motion.div>
              </CarouselItem>
            ))}
          </AnimatePresence>
        </CarouselContent>
      </Carousel>

      {/* Pagination dots */}
      {userGroups.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-2 mt-5"
        >
          {userGroups.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 ease-out",
                index === current
                  ? "w-7 bg-primary shadow-[0_0_12px_2px_var(--primary)]"
                  : "w-2 bg-muted/60 hover:bg-muted"
              )}
              whileHover={{ scale: index === current ? 1 : 1.2 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Page ${index + 1}`}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
