import type { Area } from "react-easy-crop"

/**
 * Creates a cropped image blob from a source image and pixel crop area.
 * Modern browsers auto-correct EXIF orientation when drawing to canvas.
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  mimeType: string = "image/jpeg",
  quality: number = 0.92
): Promise<Blob> {
  const image = await loadImage(imageSrc)

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Canvas toBlob returned null"))
        }
      },
      mimeType,
      quality
    )
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error(`Image load failed: ${e}`))
    img.src = src
  })
}
