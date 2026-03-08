"use client"

import { motion } from "motion/react"

interface UploadProgressProps {
  progress: Record<string, number>
  isUploading: boolean
}

export const UploadProgress = ({
  progress,
  isUploading,
}: UploadProgressProps) => {
  if (!isUploading || Object.keys(progress).length === 0) return null

  return (
    <div className="mt-4 space-y-2" aria-live="polite">
      {Object.entries(progress).map(([key, prog]) => (
        <div key={key} className="flex items-center gap-3">
          <div
            className="bg-muted h-2 flex-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={prog}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${prog}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
            {prog}%
          </span>
        </div>
      ))}
    </div>
  )
}
