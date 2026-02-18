"use client"

import Lightbox from "yet-another-react-lightbox"
import Counter from "yet-another-react-lightbox/plugins/counter"
import "yet-another-react-lightbox/plugins/counter.css"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"

// ---------------------------------------------------------------------------
// MediaLightbox — main export
// ---------------------------------------------------------------------------

export interface MediaLightboxSlide {
  src: string
  alt?: string
  width?: number
  height?: number
}

interface MediaLightboxProps {
  slides: MediaLightboxSlide[]
  index: number
  open: boolean
  onClose: () => void
  onIndexChange?: (index: number) => void
}

const plugins = [Counter, Zoom, Fullscreen]

export function MediaLightbox({
  slides,
  index,
  open,
  onClose,
  onIndexChange,
}: MediaLightboxProps) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={plugins}
      carousel={{ finite: true, preload: 2, imageFit: "contain" }}
      animation={{ fade: 200, swipe: 300 }}
      controller={{
        closeOnBackdropClick: true,
        closeOnPullDown: true,
        closeOnPullUp: true,
      }}
      counter={{ separator: " / " }}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
        doubleClickMaxStops: 2,
      }}
      labels={{
        Previous: "Précédent",
        Next: "Suivant",
        Close: "Fermer",
        "Photo gallery": "Galerie photos",
      }}
      on={{
        view: ({ index: i }) => onIndexChange?.(i),
      }}
      styles={{
        slide: { padding: 0 },
      }}
    />
  )
}
