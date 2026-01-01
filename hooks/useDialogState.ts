import { useState, useTransition, useCallback } from "react"

interface DialogState {
  isOpen: boolean
  isPending: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: (open: boolean) => void
  startTransition: React.TransitionStartFunction
}

export function useDialogState(initialOpen = false): DialogState {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [isPending, startTransition] = useTransition()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const setOpen = useCallback((value: boolean) => setIsOpen(value), [])

  return {
    isOpen,
    isPending,
    open,
    close,
    toggle,
    setOpen,
    startTransition,
  }
}
