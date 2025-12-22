"use client"

import React from "react"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { LeftSidebar } from "./left-sidebar"
import { RightSidebar } from "./right-sidebar"

/**
 * Layout variants pour différents types de pages
 * - default: Feed standard (50% content, sidebars visibles)
 * - wide: Contenu élargi sans sidebar droite (messages, user-lists)
 * - full: Pleine largeur sans sidebars (superuser/transactions)
 */
export type LayoutVariant = "default" | "wide" | "full"

type AppLayoutProps = {
  currentUser: Doc<"users">
  children: React.ReactNode
  /** Variant du layout - détermine la largeur du contenu et les sidebars visibles */
  variant?: LayoutVariant
  /** Masquer la sidebar droite même en mode default */
  hideRightSidebar?: boolean
  /** Classes additionnelles pour le conteneur principal */
  className?: string
}

/**
 * AppLayout - Composant de layout principal à 3 colonnes
 *
 * Architecture:
 * - Utilise CSS Grid pour un layout moderne et flexible
 * - Les sidebars utilisent des CSS custom properties pour leurs dimensions
 * - Le contenu central s'adapte automatiquement à l'espace disponible
 *
 * @example
 * // Page standard (feed, notifications, etc.)
 * <AppLayout currentUser={user} variant="default">
 *   <PageContainer title="Accueil">...</PageContainer>
 * </AppLayout>
 *
 * @example
 * // Page avec contenu élargi (messages, user-lists)
 * <AppLayout currentUser={user} variant="wide">
 *   <PageContainer title="Messages" variant="wide">...</PageContainer>
 * </AppLayout>
 */
export const AppLayout = ({
  currentUser,
  children,
  variant = "default",
  hideRightSidebar = false,
  className,
}: AppLayoutProps) => {
  const showRightSidebar = variant === "default" && !hideRightSidebar

  return (
    <div className={cn("relative min-h-screen w-full", className)}>
      <div
        className={cn(
          "mx-auto flex min-h-screen w-full gap-(--layout-gap)",
          "max-w-(--layout-max-width)",
        )}
      >
        {/* Sidebar gauche - toujours visible sauf sur mobile */}
        <LeftSidebar currentUser={currentUser} />

        {/* Zone de contenu principal - flex-1 pour prendre l'espace restant */}
        <main
          className={cn(
            "flex min-h-screen flex-1 flex-col",
            // Sur mobile, prend toute la largeur
            "max-[500px]:w-full max-[500px]:pb-(--mobile-nav-height)",
          )}
        >
          {children}
        </main>

        {/* Sidebar droite - conditionnelle selon le variant */}
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  )
}
