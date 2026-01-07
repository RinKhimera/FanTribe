"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "./page-header"

type SplitPanelLayoutProps = {
  /** Titre affiché dans le header sticky */
  title: string
  /** Actions à afficher dans le header */
  headerActions?: React.ReactNode
  /** Contenu du panneau de navigation (gauche) */
  navigationPanel: React.ReactNode
  /** Contenu principal (droite) */
  children: React.ReactNode
  /** Classes additionnelles pour le conteneur */
  className?: string
  /** Afficher le panneau de navigation sur mobile (utile quand pas de contenu principal) */
  showNavigationOnMobile?: boolean
}

/**
 * SplitPanelLayout - Layout à deux panneaux pour pages type messages/user-lists
 *
 * Structure :
 * - Header sticky pleine largeur
 * - Panneau navigation (40%) avec liste/menu - masqué sur mobile quand contenu actif
 * - Panneau contenu (60%) avec le détail
 *
 * Note: Ce composant remplit automatiquement l'espace disponible
 * dans son parent (généralement le <main> de AppLayout)
 *
 * @example
 * <SplitPanelLayout
 *   title="Messages"
 *   navigationPanel={<ConversationsList />}
 * >
 *   <ConversationContent />
 * </SplitPanelLayout>
 */
export const SplitPanelLayout = ({
  title,
  headerActions,
  navigationPanel,
  children,
  className,
  showNavigationOnMobile = false,
}: SplitPanelLayoutProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col",
        "min-h-screen min-[501px]:h-screen",
        "border-muted border-r border-l",
        "max-[500px]:pb-(--mobile-nav-height)",
        className,
      )}
    >
      {/* Header sticky */}
      <PageHeader title={title} actions={headerActions} />

      {/* Panneaux */}
      <div className={cn("flex flex-1", "min-[501px]:overflow-hidden")}>
        {/* Panneau de navigation (gauche) */}
        <div
          className={cn(
            "border-muted border-r",
            "min-[501px]:overflow-y-auto",
            showNavigationOnMobile
              ? "w-full lg:w-(--content-split-nav-width)"
              : "max-lg:hidden lg:block lg:w-(--content-split-nav-width) w-(--content-split-nav-width)",
          )}
        >
          {navigationPanel}
        </div>

        {/* Panneau de contenu (droite) - caché sur mobile si navigation affichée */}
        <div
          className={cn(
            "min-[501px]:overflow-y-auto",
            showNavigationOnMobile
              ? "hidden lg:block lg:w-(--content-split-main-width)"
              : "max-lg:w-full lg:w-(--content-split-main-width) w-(--content-split-main-width)",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export { SplitPanelLayout as default }
