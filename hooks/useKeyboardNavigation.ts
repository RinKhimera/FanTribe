import { useCallback, useState } from "react"

interface UseKeyboardNavigationOptions<T> {
  items: T[]
  onSelect: (item: T) => void
  onClose?: () => void
  isOpen: boolean
}

export function useKeyboardNavigation<T>(
  options: UseKeyboardNavigationOptions<T>
) {
  const { items, onSelect, onClose, isOpen } = options
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < items.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && items[selectedIndex]) {
            onSelect(items[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          onClose?.()
          setSelectedIndex(-1)
          break
      }
    },
    [isOpen, items, selectedIndex, onSelect, onClose]
  )

  const resetSelection = useCallback(() => {
    setSelectedIndex(-1)
  }, [])

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    resetSelection,
  }
}
