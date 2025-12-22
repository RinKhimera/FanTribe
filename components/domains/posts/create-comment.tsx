import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { LoaderCircle } from "lucide-react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"
import { z } from "zod"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"
import { commentFormSchema } from "@/schemas/comment"

export const CreateComment = ({
  currentUser,
  postId,
}: {
  currentUser: Doc<"users">
  postId: Id<"posts">
}) => {
  const [isPending, startTransition] = useTransition()
  const addComment = useMutation(api.comments.addComment)
  const form = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: "",
    },
  })

  const onSubmit = async (data: z.infer<typeof commentFormSchema>) => {
    startTransition(async () => {
      try {
        await addComment({
          postId: postId,
          content: data.content,
        })

        form.reset({
          content: "",
        })

        toast.success("Votre réponse a été publiée")
      } catch (error) {
        logger.error("Failed to create comment", error, { postId })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <div className="border-muted relative flex items-stretch space-x-3 border-b px-4 py-5 max-sm:px-1">
      {/* Avatar version desktop et tablette */}
      <div className="hidden sm:block">
        <Avatar className="overflow-hidden">
          <AvatarImage
            src={currentUser?.image}
            alt={currentUser?.username || "Avatar"}
            width={44}
            height={44}
          />
          <AvatarFallback className="size-11">
            <div className="animate-pulse rounded-full bg-gray-500"></div>
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Avatar version mobile (plus petit) */}
      <div className="block sm:hidden">
        <Avatar className="size-8 overflow-hidden">
          <AvatarImage
            src={currentUser?.image}
            alt={currentUser?.username || "Avatar"}
            width={32}
            height={32}
          />
          <AvatarFallback className="size-8">
            <div className="animate-pulse rounded-full bg-gray-500"></div>
          </AvatarFallback>
        </Avatar>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex h-full w-full flex-col">
                    <TextareaAutosize
                      placeholder="Poster votre réponse"
                      className="mt-1 h-full w-full resize-none border-none bg-transparent text-xl outline-hidden max-sm:text-base"
                      minRows={2}
                      maxRows={8}
                      {...field}
                    />

                    <div className="mt-2 flex w-full justify-end">
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-primary hover:bg-primary/80 w-fit rounded-full px-4 py-2 font-bold max-sm:px-3 max-sm:py-1.5 max-sm:text-sm"
                      >
                        {isPending ? (
                          <LoaderCircle className="animate-spin" />
                        ) : (
                          "Répondre"
                        )}
                      </Button>
                    </div>
                  </div>
                </FormControl>
                {field.value && <FormMessage />}
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )
}
