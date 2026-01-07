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
import { Doc, Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useDebounce } from "@/hooks/useDebounce"
import { MessagingSubscriptionModal } from "./messaging-subscription-modal"

export const UserListDialog = () => {
  const { isAuthenticated } = useConvexAuth()
  const { currentUser } = useCurrentUser()

  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState<Doc<"users"> | null>(
    null,
  )
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const dialogCloseRef = useRef<HTMLButtonElement>(null)

  const router = useRouter()
  const debouncedSearch = useDebounce(searchQuery, 300)

  const isCreator = currentUser?.accountType === "CREATOR"
  const isAdmin = currentUser?.accountType === "SUPERUSER"
  const isRegularUser = currentUser?.accountType === "USER"

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

  // Query pour vérifier le statut d'abonnement (seulement pour les users réguliers)
  const subscriptionStatus = useQuery(
    api.subscriptions.getSubscriptionStatusForMessaging,
    isRegularUser && selectedCreator
      ? { creatorId: selectedCreator._id }
      : "skip",
  )

  // IMPORTANT: Cette fonction doit être définie AVANT les autres handlers qui l'utilisent
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
      setSelectedCreator(null)
    }
  }

  // Handler pour sélectionner un contact
  const handleSelectContact = (contact: {
    _id: Id<"users">
    name: string
    username?: string
    image: string
    isOnline: boolean
    accountType: "USER" | "CREATOR" | "SUPERUSER"
  }) => {
    if (!currentUser?._id) return

    // Créateur ou Admin: démarrer directement la conversation
    if (isCreator || isAdmin) {
      handleStartConversation(contact._id)
      return
    }

    // User régulier: vérifier d'abord le statut d'abonnement
    // On stocke le contact comme créateur sélectionné pour la query
    setSelectedCreator(contact as unknown as Doc<"users">)
  }

  // Effet pour gérer la sélection d'un créateur par un user régulier
  // Quand subscriptionStatus change et qu'on a un créateur sélectionné
  const handleUserSelectCreator = () => {
    if (!selectedCreator || !subscriptionStatus || !isRegularUser) return

    // Si les deux abonnements sont actifs, on peut créer la conversation directement
    if (subscriptionStatus.scenario === "both_active") {
      handleStartConversation(selectedCreator._id)
      setSelectedCreator(null)
    } else {
      // Sinon, afficher la modale de paiement
      setShowSubscriptionModal(true)
    }
  }

  // Appeler handleUserSelectCreator quand le subscriptionStatus change
  // (après que selectedCreator soit défini)
  if (selectedCreator && subscriptionStatus && isRegularUser && !showSubscriptionModal && !isPending) {
    handleUserSelectCreator()
  }

  // Handler pour le succès du paiement dans la modale
  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false)
    if (selectedCreator) {
      handleStartConversation(selectedCreator._id)
    }
  }

  // Handler pour fermer la modale
  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false)
    setSelectedCreator(null)
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
                onClick={() => handleSelectContact(contact)}
                disabled={isPending || selectedCreator?._id === contact._id}
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

      {/* Modale de paiement pour les abonnements messagerie (users uniquement) */}
      {selectedCreator && currentUser && showSubscriptionModal && (
        <MessagingSubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={handleCloseSubscriptionModal}
          creator={selectedCreator}
          currentUser={currentUser}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </Dialog>
  )
}
