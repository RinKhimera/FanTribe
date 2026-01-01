import { useCallback, useTransition } from "react"
import { toast } from "sonner"
import { logger } from "@/lib/config/logger"

interface AsyncHandlerOptions<T> {
  onSuccess?: (result: T) => void
  successMessage?: string
  successDescription?: string
  errorMessage?: string
  errorDescription?: string
  logContext?: Record<string, unknown>
}

interface AsyncHandlerResult<T> {
  execute: (fn: () => Promise<T>) => Promise<T | undefined>
  isPending: boolean
}

export function useAsyncHandler<T = unknown>(
  options: AsyncHandlerOptions<T> = {}
): AsyncHandlerResult<T> {
  const [isPending, startTransition] = useTransition()

  const execute = useCallback(
    (fn: () => Promise<T>): Promise<T | undefined> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const result = await fn()

            if (options.successMessage) {
              toast.success(options.successMessage, {
                description: options.successDescription,
              })
            }

            options.onSuccess?.(result)
            resolve(result)
          } catch (error) {
            const errorMsg =
              error instanceof Error
                ? error.message
                : "Veuillez vérifier votre connexion internet et réessayer"

            logger.error(
              options.errorMessage || "Operation failed",
              error,
              options.logContext
            )

            toast.error(options.errorMessage || "Une erreur s'est produite !", {
              description: options.errorDescription || errorMsg,
            })

            resolve(undefined)
          }
        })
      })
    },
    [options]
  )

  return { execute, isPending }
}
