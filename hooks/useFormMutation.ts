import { useMutation } from "convex/react"
import { useAsyncHandler } from "./useAsyncHandler"
import type { FunctionReference } from "convex/server"

interface FormMutationOptions<T> {
  successMessage?: string
  successDescription?: string
  errorMessage?: string
  onSuccess?: (result: T) => void
  onError?: (error: Error) => void
}

export function useFormMutation<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Mutation extends FunctionReference<"mutation", "public", any, any>,
>(mutation: Mutation, options: FormMutationOptions<Mutation["_returnType"]> = {}) {
  const mutationFn = useMutation(mutation)
  const { execute, isPending } = useAsyncHandler<Mutation["_returnType"]>({
    successMessage: options.successMessage,
    successDescription: options.successDescription,
    errorMessage: options.errorMessage,
    onSuccess: options.onSuccess,
  })

  const mutate = async (
    args: Mutation["_args"]
  ): Promise<Mutation["_returnType"] | undefined> => {
    return execute(() => mutationFn(args))
  }

  return {
    mutate,
    isPending,
  }
}
