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
}: SplitPanelLayoutProps) => {
  return (
    <div
      className={cn(
        // Prend toute la largeur disponible
        "flex h-screen w-full flex-col",
        "border-muted border-r border-l",
        "max-[500px]:pb-(--mobile-nav-height)",
        className,
      )}
    >
      {/* Header sticky */}
      <PageHeader title={title} actions={headerActions} />

      {/* Panneaux */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panneau de navigation (gauche) */}
        <div
          className={cn(
            "w-(--content-split-nav-width)",
            "border-muted border-r",
            "overflow-y-auto",
            // Sur mobile, toujours visible (la logique de masquage sera dans les pages)
            "max-lg:w-full lg:w-(--content-split-nav-width)",
          )}
        >
          {navigationPanel}
        </div>

        {/* Panneau de contenu (droite) */}
        <div
          className={cn(
            "w-(--content-split-main-width)",
            "overflow-y-auto",
            // Sur mobile/tablet, prend toute la largeur quand visible
            "max-lg:hidden lg:block lg:w-(--content-split-main-width)",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export { SplitPanelLayout as default }
