"use client"

import { useQuery } from "convex/react"
import { usePathname } from "next/navigation"
import { SubscriptionSidebar } from "@/components/domains/subscriptions"
import { SuggestionSidebar } from "@/components/shared/suggestions"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { cn } from "@/lib/utils"

// Styles partagés pour le wrapper de sidebar
const sidebarWrapperClasses = cn(
  "sticky top-0 h-screen overflow-auto",
  "w-(--sidebar-right-width)",
  "pl-(--sidebar-right-padding) pr-2",
  // Masquer sous xl (1280px) pour cohérence avec left sidebar
  "max-xl:hidden",
)

/**
 * RightSidebar - Barre latérale droite contextuelle
 *
 * Affiche différents contenus selon la route :
 * - Page profil d'un créateur : Widget d'abonnement
 * - Autres pages : Suggestions de créateurs + recherche
 *
 * Masquée automatiquement sur :
 * - Mobile et tablet (< 1280px / xl breakpoint)
 * - Pages spéciales (messages, subscriptions, superuser/transactions)
 */
export const RightSidebar = () => {
  const pathname = usePathname()
  const { currentUser } = useCurrentUser()

  const segments = (pathname || "/").split("/").filter(Boolean)
  const first = segments[0] || ""

  // Routes sans sidebar droite
  const hiddenRoutes = new Set(["messages", "subscriptions", "dashboard"])


  // Routes réservées (non-username)
  const reserved = new Set([
    "",
    "explore",
    "notifications",
    "collections",
    "new-post",
    "subscriptions",
    "payment",
    "be-creator",
    "superuser",
    "dashboard",
    "income",
    "account",
  ])

  // Déterminer si on est sur un profil utilisateur
  const maybeUsername =
    !reserved.has(first) && !hiddenRoutes.has(first) ? first : undefined

  // Queries pour le contenu contextuel
  const userProfile = useQuery(
    api.users.getUserProfile,
    maybeUsername ? { username: maybeUsername } : "skip",
  )

  const canSubscribeCheck = useQuery(
    api.subscriptions.canUserSubscribe,
    userProfile?._id ? { creatorId: userProfile._id } : "skip",
  )

  // Conditions de masquage
  if (hiddenRoutes.has(first)) return null
  // Masquer pour toutes les pages superuser
  if (first === "superuser") return null

  // Pas sur un profil → suggestions
  if (!maybeUsername) {
    return (
      <aside className={sidebarWrapperClasses}>
        <SuggestionSidebar />
      </aside>
    )
  }

  // Profil en chargement ou introuvable → suggestions
  if (userProfile === undefined || userProfile === null) {
    return (
      <aside className={sidebarWrapperClasses}>
        <SuggestionSidebar />
      </aside>
    )
  }

  // Son propre profil → suggestions
  if (currentUser?.username === userProfile.username) {
    return (
      <aside className={sidebarWrapperClasses}>
        <SuggestionSidebar />
      </aside>
    )
  }

  // Profil d'un autre créateur → widget d'abonnement si applicable
  const canSubscribe = !!canSubscribeCheck?.canSubscribe
  if (canSubscribe) {
    return (
      <aside className={sidebarWrapperClasses}>
        <SubscriptionSidebar
          userProfile={userProfile}
          currentUserId={currentUser?._id}
        />
      </aside>
    )
  }

  // Fallback → suggestions
  return (
    <aside className={sidebarWrapperClasses}>
      <SuggestionSidebar />
    </aside>
  )
}
