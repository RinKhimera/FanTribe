"use client"

import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { Loader2, MailPlus, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useDebounce } from "@/hooks/useDebounce"

export const UserListDialog = () => {
  const { isAuthenticated } = useConvexAuth()
  const { currentUser } = useCurrentUser()

  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, setIsPending] = useState(false)
  const dialogCloseRef = useRef<HTMLButtonElement>(null)

  const router = useRouter()
  const debouncedSearch = useDebounce(searchQuery, 300)

  const isCreator = currentUser?.accountType === "CREATOR"
  const isAdmin = currentUser?.accountType === "SUPERUSER"

  // Pour les créateurs: récupérer leurs abonnés
  // Pour les utilisateurs: récupérer les créateurs auxquels ils sont abonnés
  const contacts = useQuery(
    api.messaging.getMessagingContacts,
    isAuthenticated ? { search: debouncedSearch } : "skip",
  )

  const startConversation = useMutation(api.messaging.startConversation)
  const startConversationAsCreator = useMutation(
    api.messaging.startConversationAsCreator,
  )

  const handleStartConversation = async (userId: Id<"users">) => {
    if (!currentUser?._id) return

    setIsPending(true)
    try {
      let conversationId: Id<"conversations">

      if (isCreator || isAdmin) {
        // Créateur/Admin démarre une conversation avec un utilisateur
        conversationId = await startConversationAsCreator({ userId })
      } else {
        // Utilisateur démarre une conversation avec un créateur
        conversationId = await startConversation({ creatorId: userId })
      }

      dialogCloseRef.current?.click()
      router.push(`/messages/${conversationId}`)
    } catch (error) {
      console.error(error)
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue"

      if (
        errorMessage.includes("abonnement") ||
        errorMessage.includes("subscription")
      ) {
        toast.error("Abonnement requis", {
          description:
            "Vous devez être abonné pour envoyer des messages à ce créateur.",
        })
      } else {
        toast.error("Erreur", {
          description: "Impossible de démarrer la conversation. Réessayez.",
        })
      }
    } finally {
      setIsPending(false)
    }
  }

  const getDialogDescription = () => {
    if (isCreator) {
      return "Sélectionnez un abonné pour démarrer une conversation"
    }
    if (isAdmin) {
      return "Sélectionnez un utilisateur pour démarrer une conversation"
    }
    return "Sélectionnez un créateur pour démarrer une conversation"
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <MailPlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogClose ref={dialogCloseRef} />
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        {/* Barre de recherche */}
        <Input
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-2"
        />

        {/* Liste des contacts */}
        <div className="flex max-h-80 flex-col gap-2 overflow-auto">
          {contacts === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isCreator
                ? "Aucun abonné trouvé"
                : "Aucun créateur trouvé. Abonnez-vous à un créateur pour pouvoir lui envoyer des messages."}
            </div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact._id}
                className="flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
                onClick={() => handleStartConversation(contact._id)}
                disabled={isPending}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={contact.image}
                      alt={contact.name || "Profile"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted">
                      {contact.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  {contact.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">{contact.name}</p>
                  {contact.username && (
                    <p className="truncate text-sm text-muted-foreground">
                      @{contact.username}
                    </p>
                  )}
                </div>

                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2">
          <DialogClose asChild>
            <Button variant="outline">Fermer</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
