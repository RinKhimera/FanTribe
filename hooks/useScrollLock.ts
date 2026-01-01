import { useEffect, useCallback, useRef } from "react"

interface ScrollLockOptions {
  enabled: boolean
  preventKeyboardScroll?: boolean
}

interface OriginalStyles {
  overflow: string
  paddingRight: string
}

export function useScrollLock(options: ScrollLockOptions) {
  const { enabled, preventKeyboardScroll = true } = options
  const originalStylesRef = useRef<OriginalStyles | null>(null)

  const lock = useCallback(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    originalStylesRef.current = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    }

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.body.style.overflow = "hidden"
  }, [])

  const unlock = useCallback(() => {
    if (originalStylesRef.current) {
      document.body.style.overflow = originalStylesRef.current.overflow
      document.body.style.paddingRight = originalStylesRef.current.paddingRight
      originalStylesRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      unlock()
      return
    }

    lock()

    const preventDefault = (e: Event) => e.preventDefault()
    const preventWheel = (e: WheelEvent) => e.preventDefault()
    const preventKeyScroll = (e: KeyboardEvent) => {
      const scrollKeys = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        "Space",
      ]
      if (scrollKeys.includes(e.key)) {
        e.preventDefault()
      }
    }

    window.addEventListener("wheel", preventWheel, { passive: false })
    window.addEventListener("touchmove", preventDefault, { passive: false })

    if (preventKeyboardScroll) {
      window.addEventListener("keydown", preventKeyScroll, { passive: false })
    }

    return () => {
      unlock()
      window.removeEventListener("wheel", preventWheel)
      window.removeEventListener("touchmove", preventDefault)
      if (preventKeyboardScroll) {
        window.removeEventListener("keydown", preventKeyScroll)
      }
    }
  }, [enabled, lock, unlock, preventKeyboardScroll])

  return { lock, unlock }
}
