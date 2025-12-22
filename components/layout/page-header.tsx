"use client"

import React from "react"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  /** Titre principal de la page */
  title?: string
  /** Contenu personnalisé (remplace le titre si fourni) */
  children?: React.ReactNode
  /** Actions à afficher à droite du header */
  actions?: React.ReactNode
  /** Classes additionnelles */
  className?: string
}

/**
 * PageHeader - Header sticky réutilisable pour les pages
 *
 * Features :
 * - Sticky au scroll avec backdrop blur
 * - Bordure inférieure cohérente
 * - Support pour titre simple ou contenu custom
 * - Slot pour actions (boutons, etc.)
 *
 * @example
 * // Header simple avec titre
 * <PageHeader title="Notifications" />
 *
 * @example
 * // Header avec actions
 * <PageHeader title="Messages" actions={<NewConversationButton />} />
 *
 * @example
 * // Header avec contenu personnalisé
 * <PageHeader>
 *   <div className="flex items-center gap-2">
 *     <BackButton />
 *     <h1>Conversation avec @user</h1>
 *   </div>
 * </PageHeader>
 */
export const PageHeader = ({
  title,
  children,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-20",
        "flex items-center justify-between",
        "min-h-(--header-height)",
        "border-muted border-b",
        "px-(--header-padding) py-3",
        "bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      {/* Contenu principal (titre ou children) */}
      <div className="flex flex-1 items-center">
        {children ??
          (title && (
            <h1 className="text-2xl leading-none font-bold">{title}</h1>
          ))}
      </div>

      {/* Actions optionnelles */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
