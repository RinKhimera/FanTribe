"use client"

import { useQuery } from "convex/react"
import { usePathname } from "next/navigation"
import { SubscriptionSidebar } from "@/components/domains/subscriptions"
import { SuggestionSidebar } from "@/components/shared/suggestion-sidebar"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

// Sidebar de droite dynamique en fonction de la route
// - messages: pas de sidebar (UI full-width dédiée)
// - profil (/[username], /[username]/...): affiche Abonnement si applicable, sinon Suggestions
// - autres pages: Suggestions par défaut
export const RightSidebarRouter = () => {
  const pathname = usePathname()
  const { currentUser } = useCurrentUser()

  const segments = (pathname || "/").split("/").filter(Boolean)
  const first = segments[0] || ""
  const second = segments[1] || ""

  // Routes sans sidebar droite (layouts spécifiques)
  const hiddenRoutes = new Set(["messages", "user-lists"]) // on peut étendre si besoin

  // Réservés (non username)
  const reserved = new Set([
    "",
    "explore",
    "notifications",
    "collections",
    "new-post",
    "user-lists",
    "payment",
    "be-creator",
    "superuser",
  ])

  // Profil: si le premier segment n'est pas réservé, on le considère comme username
  const maybeUsername =
    !reserved.has(first) && !hiddenRoutes.has(first) ? first : undefined

  // Hooks de données (toujours appelés, avec skip si non pertinents)
  const userProfile = useQuery(
    api.users.getUserProfile,
    maybeUsername ? { username: maybeUsername } : "skip",
  )

  const canSubscribeCheck = useQuery(
    api.subscriptions.canUserSubscribe,
    userProfile?._id ? { creatorId: userProfile._id } : "skip",
  )

  // Pages superuser spécifiques sans sidebar (pleine largeur)
  const hiddenSuperuserPages = new Set(["transactions"])

  // Si on est sur superuser/transactions, masquer la sidebar
  if (first === "superuser" && hiddenSuperuserPages.has(second)) return null

  // Rendu
  if (hiddenRoutes.has(first)) return null

  // Non-profil -> suggestions
  if (!maybeUsername) return <SuggestionSidebar />

  // Profil en chargement/introuvable -> suggestions
  if (userProfile === undefined || userProfile === null)
    return <SuggestionSidebar />

  // Son propre profil -> suggestions
  if (currentUser?.username === userProfile.username)
    return <SuggestionSidebar />

  const canSubscribe = !!canSubscribeCheck?.canSubscribe
  if (canSubscribe) {
    return (
      <SubscriptionSidebar
        userProfile={userProfile}
        currentUserId={currentUser?._id}
      />
    )
  }

  return <SuggestionSidebar />
}
