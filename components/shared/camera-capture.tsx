"use client"

import { useCallback, useRef, useState } from "react"
import Webcam from "react-webcam"
import { Camera, RefreshCw, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onError?: (error: string) => void
  children: ({ open }: { open: () => void }) => React.ReactNode
  facingMode?: "user" | "environment"
  className?: string
}

export const CameraCapture = ({
  onCapture,
  onError,
  children,
  facingMode = "environment",
  className,
}: CameraCaptureProps) => {
  const webcamRef = useRef<Webcam>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [currentFacingMode, setCurrentFacingMode] = useState<
    "user" | "environment"
  >(facingMode)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const handleOpen = useCallback(() => {
    setCameraError(null)
    setIsOpen(true)

    // Check for multiple cameras
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        )
        setHasMultipleCameras(videoDevices.length > 1)
      })
      .catch(() => {
        setHasMultipleCameras(false)
      })
  }, [])

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return

    setIsCapturing(true)

    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) {
      setCameraError("Impossible de capturer l'image")
      setIsCapturing(false)
      return
    }

    // Convert base64 to File
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        })
        onCapture(file)
        setIsOpen(false)
        toast.success("Photo capturée avec succès")
      })
      .catch(() => {
        setCameraError("Erreur lors de la capture")
        onError?.("Erreur lors de la capture")
      })
      .finally(() => {
        setIsCapturing(false)
      })
  }, [onCapture, onError])

  const handleSwitchCamera = useCallback(() => {
    setCurrentFacingMode((prev) =>
      prev === "user" ? "environment" : "user"
    )
  }, [])

  const handleUserMediaError = useCallback(
    (error: string | DOMException) => {
      let errorMessage: string

      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
            errorMessage =
              "L'accès à la caméra a été refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
            break
          case "NotFoundError":
            errorMessage = "Aucune caméra n'a été détectée sur cet appareil."
            break
          case "NotReadableError":
            errorMessage =
              "La caméra est déjà utilisée par une autre application."
            break
          default:
            errorMessage = "Erreur lors de l'accès à la caméra. Veuillez réessayer."
        }
      } else {
        errorMessage = "Erreur lors de l'accès à la caméra. Veuillez réessayer."
      }

      setCameraError(errorMessage)
      onError?.(errorMessage)
    },
    [onError]
  )

  const videoConstraints = {
    facingMode: currentFacingMode,
    width: { ideal: 1280 },
    height: { ideal: 720 },
  }

  return (
    <>
      {children({ open: handleOpen })}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={cn("sm:max-w-lg", className)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="size-5" />
              Prendre une photo
            </DialogTitle>
            <DialogDescription>
              Positionnez votre document ou vous-même dans le cadre puis
              capturez la photo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {cameraError ? (
              <div className="flex flex-col items-center justify-center rounded-lg bg-destructive/10 p-8 text-center">
                <X className="mb-4 size-12 text-destructive" />
                <p className="text-sm text-destructive">{cameraError}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setCameraError(null)
                  }}
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg bg-black">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.9}
                  videoConstraints={videoConstraints}
                  onUserMediaError={handleUserMediaError}
                  className="aspect-[4/3] w-full object-cover"
                  mirrored={currentFacingMode === "user"}
                />

                {/* Camera switch button overlay */}
                {hasMultipleCameras && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-3 top-3 bg-black/50 hover:bg-black/70"
                    onClick={handleSwitchCamera}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleCapture}
                disabled={!!cameraError || isCapturing}
              >
                {isCapturing ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Capture...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 size-4" />
                    Capturer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
