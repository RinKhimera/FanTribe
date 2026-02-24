import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockUseConvexAuth, mockUseQuery } = vi.hoisted(() => ({
  mockUseConvexAuth: vi.fn(),
  mockUseQuery: vi.fn(),
}))

vi.mock("convex/react", () => ({
  useConvexAuth: mockUseConvexAuth,
  useQuery: mockUseQuery,
}))

// Must be imported AFTER vi.mock
import { useCurrentUser } from "@/hooks/useCurrentUser"

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return isLoading true while auth is loading", () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    })
    mockUseQuery.mockReturnValue(undefined)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.currentUser).toBeUndefined()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("should return isLoading true while authenticated but user not yet loaded", () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseQuery.mockReturnValue(undefined)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.currentUser).toBeUndefined()
  })

  it("should return user data when authenticated and loaded", () => {
    const mockUser = {
      _id: "user_123",
      name: "Test User",
      email: "test@test.com",
    }
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })
    mockUseQuery.mockReturnValue(mockUser)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.currentUser).toBe(mockUser)
    expect(result.current.currentUser!.name).toBe("Test User")
  })

  it("should skip query when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })
    mockUseQuery.mockReturnValue(undefined)

    renderHook(() => useCurrentUser())

    // useQuery should be called with "skip" as second arg
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(), // api.users.getCurrentUser
      "skip",
    )
  })

  it("should return isAuthenticated false when not authenticated", () => {
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })
    mockUseQuery.mockReturnValue(undefined)

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.currentUser).toBeUndefined()
  })
})
