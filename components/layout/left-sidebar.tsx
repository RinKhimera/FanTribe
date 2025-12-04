"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { PenLine } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { UserInfoPopover } from "@/components/shared/user-info-popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NavLink, navigationLinks } from "@/constants"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { MobileNavigation } from "./mobile-navigation"

type LeftSidebarProps = {
  currentUser: Doc<"users">
}

/**
 * LeftSidebar - Barre de navigation latérale gauche
 *
 * Design moderne avec :
 * - Mode full (icône + texte) sur desktop (xl: 1280px+)
 * - Mode compact (icônes alignées à droite) sur tablet
 * - Animations fluides et hover effects
 * - Séparation claire des sections
 * - Tooltips en mode compact
 */
export const LeftSidebar = ({ currentUser }: LeftSidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()

  // Compteurs de notifications non lues
  const unreadCountsData = useQuery(
    api.notifications.getUnreadCounts,
    isAuthenticated ? undefined : "skip",
  )

  const unreadCounts = {
    unreadMessages: unreadCountsData?.unreadMessagesCount || 0,
    unreadNotifications: unreadCountsData?.unreadNotificationsCount || 0,
  }

  // Filtrer les liens selon le type de compte
  const filteredNavigationLinks = navigationLinks.filter((link) => {
    const superuserOnlyLinks = ["superuser", "messages"]
    const creatorOnlyLinks = ["income"]

    if (superuserOnlyLinks.includes(link.id)) {
      return currentUser?.accountType === "SUPERUSER"
    }

    if (creatorOnlyLinks.includes(link.id)) {
      return (
        currentUser?.accountType === "CREATOR" ||
        currentUser?.accountType === "SUPERUSER"
      )
    }

    return true
  })

  // Résoudre les hrefs dynamiques
  const getHref = (link: NavLink) => {
    if (typeof link.href === "function") {
      return link.href(currentUser?.username)
    }
    return link.href
  }

  // Navigation vers la page de publication
  const handlePublishClick = () => {
    if (
      currentUser?.accountType === "CREATOR" ||
      currentUser?.accountType === "SUPERUSER"
    ) {
      router.push("/new-post")
    } else {
      router.push("/be-creator")
    }
  }

  return (
    <>
      {/* Sidebar Desktop/Tablet */}
      <TooltipProvider delayDuration={100}>
        <aside
          className={cn(
            // Layout de base
            "sticky top-0 z-30 h-screen",
            "flex flex-col",
            "w-(--sidebar-left-width)",
            // Masquer sur mobile
            "max-[500px]:hidden",
            // Mode compact (tablet) : aligner à droite
            "max-xl:items-end max-xl:pr-3",
            // Mode full (desktop xl+) : aligner normalement avec padding
            "xl:items-stretch xl:pr-(--sidebar-left-padding) xl:pl-4",
          )}
        >
          {/* Container de navigation avec flexbox */}
          <div className="flex h-full w-full flex-col xl:max-w-60">
            {/* Section Navigation */}
            <nav
              className={cn(
                "flex flex-1 flex-col",
                "pt-4 pb-2",
                // Mode compact : aligner à droite
                "max-xl:items-end",
                // Mode full : étirer les items
                "xl:items-stretch",
              )}
            >
              {/* Groupe de liens principaux */}
              <div
                className={cn(
                  "flex flex-col",
                  // Espacement uniforme entre les liens
                  "gap-1",
                  // Mode compact : aligner à droite
                  "max-xl:items-end",
                  // Mode full : pleine largeur
                  "xl:w-full",
                )}
              >
                {filteredNavigationLinks.map((link) => {
                  const IconComponent = link.icon
                  const badgeValue = link.badge
                    ? link.badge(unreadCounts)
                    : null
                  const href = getHref(link)
                  const isActive = pathname === href

                  return (
                    <Tooltip key={`nav-${link.id}`}>
                      <TooltipTrigger asChild>
                        <Link
                          href={href}
                          className={cn(
                            // Base styles
                            "group relative flex items-center",
                            "rounded-xl transition-all duration-200",
                            // Padding adaptatif
                            "p-3 xl:px-4 xl:py-3",
                            // Largeur
                            "max-xl:w-12 max-xl:justify-center",
                            "xl:w-full",
                            // États
                            "hover:bg-primary/10",
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {/* Indicateur actif (barre verticale) */}
                          {isActive && (
                            <span
                              className={cn(
                                "absolute top-1/2 left-0 -translate-y-1/2",
                                "bg-primary h-6 w-1 rounded-r-full",
                                "max-xl:hidden",
                              )}
                            />
                          )}

                          {/* Icône avec badge */}
                          <span className="relative shrink-0">
                            <IconComponent
                              className={cn(
                                "size-6 transition-transform duration-200",
                                "group-hover:scale-110",
                              )}
                              strokeWidth={isActive ? 2.5 : 2}
                            />
                            {badgeValue && (
                              <Badge
                                variant="destructive"
                                className={cn(
                                  "absolute -top-1.5 -right-1.5",
                                  "flex h-5 min-w-5 items-center justify-center",
                                  "rounded-full px-1 text-xs font-bold",
                                  "animate-in zoom-in-50 duration-200",
                                )}
                              >
                                {badgeValue > 99 ? "99+" : badgeValue}
                              </Badge>
                            )}
                          </span>

                          {/* Label (visible uniquement en mode full) */}
                          <span
                            className={cn(
                              "ml-4 text-base whitespace-nowrap",
                              "max-xl:hidden",
                              "transition-colors duration-200",
                            )}
                          >
                            {link.title}
                          </span>
                        </Link>
                      </TooltipTrigger>
                      {/* Tooltip uniquement en mode compact */}
                      <TooltipContent
                        side="right"
                        className="xl:hidden"
                        sideOffset={8}
                      >
                        <p className="font-medium">{link.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>

              {/* Séparateur */}
              <div className="bg-border/50 my-3 h-px w-10 xl:w-full" />

              {/* Bouton Publier */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handlePublishClick}
                    className={cn(
                      // Base styles
                      "group relative overflow-hidden",
                      "bg-primary hover:bg-primary/90",
                      "text-primary-foreground font-semibold",
                      "transition-all duration-200",
                      // Mode compact : bouton carré
                      "max-xl:h-12 max-xl:w-12 max-xl:rounded-xl max-xl:p-0",
                      // Mode full : bouton large
                      "xl:w-full xl:rounded-full xl:py-3 xl:text-base",
                      // Hover effect
                      "hover:shadow-primary/25 hover:shadow-lg",
                      "active:scale-95",
                    )}
                  >
                    {/* Icône (toujours visible en compact, cachée en full) */}
                    <PenLine
                      className={cn(
                        "size-5 transition-transform duration-200",
                        "group-hover:rotate-[-8deg]",
                        "xl:hidden",
                      )}
                    />
                    {/* Texte (visible uniquement en full) */}
                    <span className="max-xl:hidden">Publier</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="xl:hidden"
                  sideOffset={8}
                >
                  <p className="font-medium">Publier</p>
                </TooltipContent>
              </Tooltip>
            </nav>

            {/* Section User Info (footer) */}
            <div
              className={cn(
                "mt-auto pb-4",
                // Mode compact : aligner à droite
                "max-xl:flex max-xl:justify-end",
                // Mode full : pleine largeur
                "xl:w-full",
              )}
            >
              {currentUser && (
                <UserInfoPopover currentUser={currentUser} compact />
              )}
            </div>
          </div>
        </aside>
      </TooltipProvider>

      {/* Navigation Mobile (bottom bar) */}
      {isAuthenticated && <MobileNavigation />}
    </>
  )
}
