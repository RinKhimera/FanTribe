import { renderHook, act } from "@testing-library/react"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"

// ============================================================================
// Mocks
// ============================================================================

const mockGetToken = vi.fn()

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    clientEnv: {
      NEXT_PUBLIC_CONVEX_URL: "https://test.convex.cloud",
    },
  },
}))

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}))

vi.mock("@/lib/config/env.client", () => mockEnv)

// Must be imported AFTER vi.mock
import { useBunnyUpload } from "@/hooks/useBunnyUpload"

// ============================================================================
// Helpers
// ============================================================================

function createMockFile(
  name: string,
  type: string,
  size = 1024,
): File {
  const content = new Uint8Array(size)
  return new File([content], name, { type })
}

// Mock Image constructor for extractImageDimensions
function setupImageMock(width = 800, height = 600) {
  const originalImage = window.Image

  class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    naturalWidth = width
    naturalHeight = height

    set src(_url: string) {
      // Trigger onload asynchronously
      setTimeout(() => this.onload?.(), 0)
    }
  }

  // @ts-expect-error — replacing Image constructor for testing
  window.Image = MockImage
  return () => {
    window.Image = originalImage
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("useBunnyUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock URL.createObjectURL / revokeObjectURL
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // ==========================================================================
  // uploadMedia — images
  // ==========================================================================
  describe("uploadMedia — images", () => {
    it("should return error when not authenticated", async () => {
      mockGetToken.mockResolvedValue(null)

      const { result } = renderHook(() => useBunnyUpload())

      let uploadResult: Awaited<ReturnType<typeof result.current.uploadMedia>>
      await act(async () => {
        uploadResult = await result.current.uploadMedia({
          file: createMockFile("photo.jpg", "image/jpeg"),
          fileName: "photo.jpg",
          userId: "user_123",
        })
      })

      expect(uploadResult!.success).toBe(false)
      expect(uploadResult!.error).toBe("Non authentifie")
      expect(uploadResult!.type).toBe("image")
    })

    it("should upload image and return success with url and dimensions", async () => {
      mockGetToken.mockResolvedValue("test-token")
      const restoreImage = setupImageMock(1920, 1080)

      // Mock fetch for image upload
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            url: "https://cdn.bunny.net/img_123.jpg",
            mediaId: "img_123",
          }),
      })
      vi.stubGlobal("fetch", mockFetch)

      const { result } = renderHook(() => useBunnyUpload())

      let uploadResult: Awaited<ReturnType<typeof result.current.uploadMedia>>
      await act(async () => {
        const promise = result.current.uploadMedia({
          file: createMockFile("photo.jpg", "image/jpeg"),
          fileName: "photo.jpg",
          userId: "user_123",
        })
        // Advance timers for simulated progress + Image.onload
        await vi.advanceTimersByTimeAsync(2000)
        uploadResult = await promise
      })

      expect(uploadResult!.success).toBe(true)
      expect(uploadResult!.url).toBe("https://cdn.bunny.net/img_123.jpg")
      expect(uploadResult!.mediaId).toBe("img_123")
      expect(uploadResult!.type).toBe("image")
      expect(uploadResult!.width).toBe(1920)
      expect(uploadResult!.height).toBe(1080)

      // Verify fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.convex.site/api/bunny/upload-image",
        expect.objectContaining({
          method: "POST",
          headers: { Authorization: "Bearer test-token" },
        }),
      )

      restoreImage()
    })

    it("should return error on HTTP failure", async () => {
      mockGetToken.mockResolvedValue("test-token")
      const restoreImage = setupImageMock()

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ error: "Upload failed" }),
        }),
      )

      const { result } = renderHook(() => useBunnyUpload())

      let uploadResult: Awaited<ReturnType<typeof result.current.uploadMedia>>
      await act(async () => {
        const promise = result.current.uploadMedia({
          file: createMockFile("photo.jpg", "image/jpeg"),
          fileName: "photo.jpg",
          userId: "user_123",
        })
        await vi.advanceTimersByTimeAsync(2000)
        uploadResult = await promise
      })

      expect(uploadResult!.success).toBe(false)
      expect(uploadResult!.error).toBe("Upload failed")

      restoreImage()
    })
  })

  // ==========================================================================
  // uploadMedia — videos
  // ==========================================================================
  describe("uploadMedia — videos", () => {
    it("should return error when not authenticated", async () => {
      mockGetToken.mockResolvedValue(null)

      const { result } = renderHook(() => useBunnyUpload())

      let uploadResult: Awaited<ReturnType<typeof result.current.uploadMedia>>
      await act(async () => {
        uploadResult = await result.current.uploadMedia({
          file: createMockFile("video.mp4", "video/mp4"),
          fileName: "video.mp4",
          userId: "user_123",
        })
      })

      expect(uploadResult!.success).toBe(false)
      expect(uploadResult!.error).toBe("Non authentifie")
      expect(uploadResult!.type).toBe("video")
    })

    it("should complete 2-step video upload", async () => {
      // Use real timers for this test — XHR mock is incompatible with fake timers
      vi.useRealTimers()
      mockGetToken.mockResolvedValue("test-token")

      // Step 1: token request
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            videoId: "vid_123",
            accessKey: "ak_test",
            libraryId: "lib_1",
            embedUrl: "https://iframe.mediadelivery.net/embed/lib_1/vid_123",
            thumbnailUrl: "https://cdn.bunny.net/thumb_123.jpg",
          }),
      })
      vi.stubGlobal("fetch", mockFetch)

      // Mock XMLHttpRequest for step 2 — must use a class (not vi.fn arrow)
      // so that `new XMLHttpRequest()` works as a proper constructor
      const xhrInstances: Array<InstanceType<typeof MockXHR>> = []
      class MockXHR {
        open = vi.fn()
        setRequestHeader = vi.fn()
        upload = { onprogress: null as ((e: unknown) => void) | null }
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        status = 200

        send = vi.fn(() => {
          // Arrow fn captures `this` from class instance via lexical scope
          queueMicrotask(() => this.onload?.())
        })

        constructor() {
          xhrInstances.push(this)
        }
      }
      vi.stubGlobal("XMLHttpRequest", MockXHR)

      // Mock AbortController
      vi.stubGlobal("AbortController", class {
        signal = { addEventListener: vi.fn() }
        abort = vi.fn()
      })

      const { result } = renderHook(() => useBunnyUpload())

      let uploadResult: Awaited<ReturnType<typeof result.current.uploadMedia>>
      await act(async () => {
        uploadResult = await result.current.uploadMedia({
          file: createMockFile("video.mp4", "video/mp4"),
          fileName: "video.mp4",
          userId: "user_123",
        })
      })

      expect(uploadResult!.success).toBe(true)
      expect(uploadResult!.url).toBe(
        "https://iframe.mediadelivery.net/embed/lib_1/vid_123",
      )
      expect(uploadResult!.mediaId).toBe("vid_123")
      expect(uploadResult!.type).toBe("video")
      expect(uploadResult!.thumbnailUrl).toBe(
        "https://cdn.bunny.net/thumb_123.jpg",
      )

      // Verify XHR was called correctly
      const xhr = xhrInstances[0]
      expect(xhr.open).toHaveBeenCalledWith(
        "PUT",
        "https://video.bunnycdn.com/library/lib_1/videos/vid_123",
      )
      expect(xhr.setRequestHeader).toHaveBeenCalledWith(
        "AccessKey",
        "ak_test",
      )

      // Restore fake timers for subsequent tests
      vi.useFakeTimers()
    })
  })

  // ==========================================================================
  // deleteMedia
  // ==========================================================================
  describe("deleteMedia", () => {
    it("should delete media successfully", async () => {
      mockGetToken.mockResolvedValue("test-token")

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        }),
      )

      const { result } = renderHook(() => useBunnyUpload())

      let deleteResult: Awaited<ReturnType<typeof result.current.deleteMedia>>
      await act(async () => {
        deleteResult = await result.current.deleteMedia({
          mediaId: "img_123",
          type: "image",
        })
      })

      expect(deleteResult!.success).toBe(true)
    })

    it("should return success: false when not authenticated", async () => {
      mockGetToken.mockResolvedValue(null)

      const { result } = renderHook(() => useBunnyUpload())

      let deleteResult: Awaited<ReturnType<typeof result.current.deleteMedia>>
      await act(async () => {
        deleteResult = await result.current.deleteMedia({
          mediaId: "img_123",
          type: "image",
        })
      })

      expect(deleteResult!.success).toBe(false)
    })

    it("should return success: false on network error", async () => {
      mockGetToken.mockResolvedValue("test-token")

      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      )

      const { result } = renderHook(() => useBunnyUpload())

      let deleteResult: Awaited<ReturnType<typeof result.current.deleteMedia>>
      await act(async () => {
        deleteResult = await result.current.deleteMedia({
          mediaId: "img_123",
          type: "image",
        })
      })

      expect(deleteResult!.success).toBe(false)
    })
  })

  // ==========================================================================
  // State
  // ==========================================================================
  describe("state", () => {
    it("should set isUploading during upload", async () => {
      mockGetToken.mockResolvedValue(null) // Will fail fast

      const { result } = renderHook(() => useBunnyUpload())

      expect(result.current.isUploading).toBe(false)

      await act(async () => {
        await result.current.uploadMedia({
          file: createMockFile("photo.jpg", "image/jpeg"),
          fileName: "photo.jpg",
          userId: "user_123",
        })
      })

      // After upload completes (even with error), isUploading should be false
      expect(result.current.isUploading).toBe(false)
    })
  })
})
