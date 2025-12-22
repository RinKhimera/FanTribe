"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "./page-header"

/**
 * Variants du conteneur de page
 * - default: Largeur standard avec bordures
 * - wide: Pour les layouts type messages/user-lists
 * - full: Pleine largeur sans bordures
 */
export type PageContainerVariant = "default" | "wide" | "full"

export type PageContainerProps = {
  children: React.ReactNode
  /** Titre affiché dans le header sticky (optionnel) */
  title?: string
  /** Contenu personnalisé pour le header (remplace le titre) */
  headerContent?: React.ReactNode
  /** Actions à afficher à droite du header */
  headerActions?: React.ReactNode
  /** Variant de largeur du conteneur */
  variant?: PageContainerVariant
  /** Masquer le header sticky */
  hideHeader?: boolean
  /** Classes additionnelles */
  className?: string
  /** Classes pour le conteneur de contenu (sous le header) */
  contentClassName?: string
}

/**
 * PageContainer - Conteneur réutilisable pour le contenu des pages
 *
 * Gère :
 * - Les bordures latérales cohérentes
 * - Le header sticky avec titre
 * - L'espacement pour la navigation mobile
 *
 * Note: Ce composant remplit automatiquement l'espace disponible
 * dans son parent (généralement le <main> de AppLayout)
 *
 * @example
 * // Page standard avec titre simple
 * <PageContainer title="Notifications">
 *   <NotificationsList />
 * </PageContainer>
 *
 * @example
 * // Page avec header personnalisé et actions
 * <PageContainer
 *   title="Messages"
 *   headerActions={<NewMessageButton />}
 * >
 *   <MessagesList />
 * </PageContainer>
 *
 * @example
 * // Page sans header (gestion manuelle)
 * <PageContainer hideHeader>
 *   <CustomHeader />
 *   <Content />
 * </PageContainer>
 */
export const PageContainer = ({
  children,
  title,
  headerContent,
  headerActions,
  variant = "default",
  hideHeader = false,
  className,
  contentClassName,
}: PageContainerProps) => {
  return (
    <div
      className={cn(
        // Base styles - prend toute la largeur disponible
        "flex min-h-screen w-full flex-col",
        // Bordures latérales (sauf variant full)
        variant !== "full" && "border-muted border-r border-l",
        // Mobile padding pour la navigation bottom
        "max-[500px]:pb-(--mobile-nav-height)",
        className,
      )}
    >
      {/* Header sticky optionnel */}
      {!hideHeader && (title || headerContent) && (
        <PageHeader title={title} actions={headerActions}>
          {headerContent}
        </PageHeader>
      )}

      {/* Contenu de la page */}
      <div className={cn("flex flex-1 flex-col", contentClassName)}>
        {children}
      </div>
    </div>
  )
}
