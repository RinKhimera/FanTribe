"use node"

import { v } from "convex/values"
import { internal } from "../_generated/api"
import { internalAction } from "../_generated/server"

// ============================================================================
// Action: orchestrator — fetch images, extract dimensions with EXIF fix
// Needs "use node" for Buffer + image-size + exif-reader
// ============================================================================

/**
 * EXIF orientations 5-8 mean the image is rotated 90° or 270°,
 * so width and height must be swapped.
 */
function getExifOrientation(buffer: Buffer): number {
  // JPEG files start with FF D8
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return 1

  let offset = 2
  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) break
    const marker = buffer[offset + 1]

    // APP1 marker (EXIF)
    if (marker === 0xe1) {
      const exifHeader = buffer.toString("ascii", offset + 4, offset + 8)
      if (exifHeader !== "Exif") return 1

      const tiffOffset = offset + 10
      const isLittleEndian = buffer.readUInt16BE(tiffOffset) === 0x4949

      const readUint16 = (pos: number) =>
        isLittleEndian ? buffer.readUInt16LE(pos) : buffer.readUInt16BE(pos)

      const ifdOffset =
        tiffOffset +
        (isLittleEndian
          ? buffer.readUInt32LE(tiffOffset + 4)
          : buffer.readUInt32BE(tiffOffset + 4))

      const numEntries = readUint16(ifdOffset)

      for (let i = 0; i < numEntries; i++) {
        const entryOffset = ifdOffset + 2 + i * 12
        const tag = readUint16(entryOffset)
        if (tag === 0x0112) {
          // Orientation tag
          return readUint16(entryOffset + 8)
        }
      }
      return 1
    }

    // Skip other markers
    if (
      marker === 0xd0 ||
      marker === 0xd1 ||
      marker === 0xd2 ||
      marker === 0xd3 ||
      marker === 0xd4 ||
      marker === 0xd5 ||
      marker === 0xd6 ||
      marker === 0xd7 ||
      marker === 0x01
    ) {
      offset += 2
    } else {
      const segLen = buffer.readUInt16BE(offset + 2)
      offset += 2 + segLen
    }
  }

  return 1
}

export const backfillImageDimensions = internalAction({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 25
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { imageSize } = require("image-size")

    const { posts, continueCursor, isDone } = await ctx.runQuery(
      internal.migrations.backfillImageDimensions.getPostsNeedingDimensions,
      { cursor: args.cursor, batchSize },
    )

    let patchedCount = 0

    for (const post of posts) {
      let changed = false
      const updatedMedias = await Promise.all(
        post.medias.map(async (media) => {
          if (media.type !== "image") return media
          try {
            const res = await fetch(media.url)
            const buffer = Buffer.from(await res.arrayBuffer())
            const dims = imageSize(buffer)
            if (!dims.width || !dims.height) return media

            let { width, height } = dims
            // Check EXIF orientation — swap for rotated images
            const orientation = getExifOrientation(buffer)
            if (orientation >= 5 && orientation <= 8) {
              ;[width, height] = [height, width]
            }

            if (width !== media.width || height !== media.height) {
              changed = true
            }
            return { ...media, width, height }
          } catch (e) {
            console.error(`Failed for ${media.url}:`, e)
            return media
          }
        }),
      )

      if (changed) {
        await ctx.runMutation(
          internal.migrations.backfillImageDimensions.patchPostMediaDimensions,
          { postId: post._id, medias: updatedMedias },
        )
        patchedCount++
      }
    }

    console.log(`Batch done: ${patchedCount} posts updated. isDone: ${isDone}`)

    if (!isDone) {
      await ctx.scheduler.runAfter(
        1000,
        internal.migrations.backfillImageDimensionsAction
          .backfillImageDimensions,
        { cursor: continueCursor, batchSize },
      )
    } else {
      console.log("EXIF fix complete! All dimensions corrected.")
    }

    return null
  },
})
