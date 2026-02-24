"use client"

import type { LucideIcon } from "lucide-react"
import React from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "./page-header"

/**
 * Variants du conteneur de page
 * - default: Largeur standard avec bordures
 * - wide: Pour les layouts type messages/subscriptions
 * - full: Pleine largeur sans bordures
 */
export type PageContainerVariant = "default" | "wide" | "full"

export type PageContainerProps = {
  children: React.ReactNode
  /** Titre affiché dans le header sticky (optionnel) */
  title?: string
  /** Icône optionnelle affichée à côté du titre */
  headerIcon?: LucideIcon
  /** Contenu personnalisé pour le header (remplace le titre) */
  headerContent?: React.ReactNode
  /** Action à afficher à gauche du header (bouton retour, etc.) */
  headerLeftAction?: React.ReactNode
  /** Actions à afficher à droite du header */
  headerRightAction?: React.ReactNode
  /** @deprecated Utiliser headerRightAction à la place */
  headerActions?: React.ReactNode
  /** Barre secondaire sticky sous le header (tabs, filtres) */
  secondaryBar?: React.ReactNode
  /** Classes pour la barre secondaire */
  secondaryBarClassName?: string
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
 * - La barre secondaire (tabs, filtres)
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
 * // Page avec header et barre secondaire
 * <PageContainer
 *   title="Messages"
 *   headerRightAction={<NewMessageButton />}
 *   secondaryBar={<FilterTabs />}
 * >
 *   <MessagesList />
 * </PageContainer>
 *
 * @example
 * // Page avec bouton retour
 * <PageContainer
 *   title="Détails"
 *   headerLeftAction={<BackButton />}
 * >
 *   <Content />
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
  headerIcon,
  headerContent,
  headerLeftAction,
  headerRightAction,
  headerActions,
  secondaryBar,
  secondaryBarClassName,
  variant = "default",
  hideHeader = false,
  className,
  contentClassName,
}: PageContainerProps) => {
  // Support pour l'ancien prop "headerActions" (rétrocompatibilité)
  const resolvedRightAction = headerRightAction ?? headerActions

  return (
    <div
      className={cn(
        // Base styles - prend toute la largeur disponible
        "flex min-h-screen w-full flex-col",
        // Bordures latérales (sauf variant full)
        variant !== "full" && "border-muted border-r border-l",
        // Note: padding mobile géré par AppLayout (single source of truth)
        className,
      )}
    >
      {/* Header sticky optionnel */}
      {!hideHeader && (title || headerContent) && (
        <PageHeader
          title={title}
          icon={headerIcon}
          leftAction={headerLeftAction}
          rightAction={resolvedRightAction}
          secondaryBar={secondaryBar}
          secondaryBarClassName={secondaryBarClassName}
        >
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
