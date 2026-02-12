"use client"

import { motion, AnimatePresence } from "motion/react"
import { Check, Crop, Loader2, SkipForward, X, ZoomIn, ZoomOut } from "lucide-react"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useState } from "react"
import type { Area, Point } from "react-easy-crop"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { logger } from "@/lib/config/logger"
import { cn } from "@/lib/utils"
import type { AspectRatioPreset } from "./aspect-ratio-presets"
import { getCroppedImage } from "./crop-utils"

const Cropper = dynamic(() => import("react-easy-crop").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square items-center justify-center rounded-xl bg-black">
      <Loader2 className="size-8 animate-spin text-white/40" />
    </div>
  ),
})

type CropShape = "round" | "rect"

type ImageCropDialogProps = {
  imageSrc: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (croppedBlob: Blob) => void
  onCancel: () => void
  onSkip?: () => void
  showSkip?: boolean
  cropShape?: CropShape
  aspectRatio?: number
  presets?: AspectRatioPreset[]
  outputMimeType?: string
  outputQuality?: number
  title?: string
}

export function ImageCropDialog({
  imageSrc,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  onSkip,
  showSkip = false,
  cropShape = "rect",
  aspectRatio,
  presets,
  outputMimeType = "image/jpeg",
  outputQuality = 0.92,
  title,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [activeAspect, setActiveAspect] = useState<number>(
    aspectRatio ?? presets?.[0]?.value ?? 1
  )
  const [isProcessing, setIsProcessing] = useState(false)

  // Reset internal state when a new image enters (e.g., crop queue advancing)
  useEffect(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setActiveAspect(aspectRatio ?? presets?.[0]?.value ?? 1)
  }, [imageSrc, aspectRatio, presets])

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImage(
        imageSrc,
        croppedAreaPixels,
        outputMimeType,
        outputQuality
      )
      onConfirm(croppedBlob)
    } catch (error) {
      logger.error("Image crop failed", error)
      toast.error("Erreur lors du recadrage de l'image")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePresetChange = (preset: AspectRatioPreset) => {
    setActiveAspect(preset.value)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const dialogTitle =
    title ?? (cropShape === "round" ? "Recadrer la photo" : "Recadrer l'image")

  const showPresets = presets && presets.length > 0 && !aspectRatio

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-md p-0 overflow-hidden",
          "bg-background/95 backdrop-blur-xl",
          "border-primary/10",
          "shadow-2xl"
        )}
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="relative px-5 pt-5 pb-1">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-x-0 -top-8 mx-auto h-24 w-24 rounded-full bg-primary/8 blur-3xl" />

          <DialogTitle className="flex items-center justify-center gap-2 text-base">
            <Crop className="size-4 text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Ajustez le cadrage de votre image
          </DialogDescription>
        </DialogHeader>

        {/* Crop area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="relative mx-4"
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-xl bg-black",
              cropShape === "round" ? "aspect-square" : "aspect-[4/3]"
            )}
            style={{ touchAction: "none" }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={0}
              aspect={activeAspect}
              cropShape={cropShape}
              showGrid={cropShape === "rect"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              minZoom={1}
              maxZoom={3}
              zoomSpeed={1}
              restrictPosition={true}
              keyboardStep={3}
              objectFit="contain"
              style={{}}
              classes={{
                containerClassName: "rounded-xl",
              }}
              mediaProps={{}}
              cropperProps={{}}
            />
          </div>
        </motion.div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-5">
          <ZoomOut className="size-3.5 shrink-0 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={([v]) => setZoom(v)}
            className="flex-1"
            aria-label="Zoom"
          />
          <ZoomIn className="size-3.5 shrink-0 text-muted-foreground" />
        </div>

        {/* Aspect ratio presets */}
        <AnimatePresence>
          {showPresets && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap justify-center gap-1.5 px-5"
            >
              {presets.map((preset) => {
                const isActive = activeAspect === preset.value
                return (
                  <motion.button
                    key={preset.label}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handlePresetChange(preset)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "glass-button text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {preset.label}
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <DialogFooter className="border-t border-border/50 px-5 py-4 bg-muted/20">
          <div className="flex w-full items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isProcessing}
              className="text-muted-foreground"
            >
              <X className="size-3.5 mr-1.5" />
              Annuler
            </Button>

            <div className="flex-1" />

            {showSkip && onSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                disabled={isProcessing}
                className="text-muted-foreground"
              >
                <SkipForward className="size-3.5 mr-1.5" />
                Passer
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isProcessing || !croppedAreaPixels}
              className="btn-premium rounded-full px-5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Traitement…
                </>
              ) : (
                <>
                  <Check className="size-3.5 mr-1.5" />
                  Recadrer
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
