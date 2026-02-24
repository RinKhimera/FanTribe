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
            className="h-2 flex-1 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={prog}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${prog}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
            {prog}%
          </span>
        </div>
      ))}
    </div>
  )
}
