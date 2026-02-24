"use client"

import { motion } from "motion/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, ZoomIn } from "lucide-react"

interface DocumentPreviewProps {
  url: string
  onRemove: () => void
  onViewFullscreen: () => void
}

export const DocumentPreview = ({
  url,
  onRemove,
  onViewFullscreen,
}: DocumentPreviewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative"
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-lg">
        <Image
          src={url}
          alt="Document uploadé"
          fill
          sizes="(max-width: 640px) 100vw, 600px"
          className="object-cover"
        />

        {/* Bouton supprimer - top right, toujours visible */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-black/60 hover:bg-red-500"
          onClick={onRemove}
          aria-label="Supprimer le document"
        >
          <X className="size-4 text-white" />
        </Button>

        {/* Bouton agrandir - bottom right, visible au hover */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onViewFullscreen}
        >
          <ZoomIn className="mr-1.5 size-3.5 text-white" />
          <span className="text-white text-xs">Agrandir</span>
        </Button>
      </div>

      {/* Indicateur de succès */}
      <div className="mt-2 flex items-center gap-2">
        <CheckCircle className="size-4 text-green-500" />
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          Document vérifié
        </span>
      </div>
    </motion.div>
  )
}
