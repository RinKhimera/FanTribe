"use client"

import React from "react"
import { cn } from "@/lib/utils"

type SecondaryBarProps = {
  /** Contenu de la barre secondaire (tabs, filtres, etc.) */
  children: React.ReactNode
  /** Classes additionnelles */
  className?: string
  /** Offset depuis le haut (default: var(--header-height)) */
  topOffset?: string
}

/**
 * SecondaryBar - Barre sticky positionnée sous le header principal
 *
 * Utilisée pour afficher des éléments secondaires comme :
 * - Onglets de navigation
 * - Filtres
 * - Actions contextuelles
 *
 * @example
 * <SecondaryBar>
 *   <NavigationTabs items={tabs} />
 * </SecondaryBar>
 *
 * @example
 * // Avec offset personnalisé (ex: sous un header de profil)
 * <SecondaryBar topOffset="53px">
 *   <FilterTabs />
 * </SecondaryBar>
 */
export const SecondaryBar = ({
  children,
  className,
  topOffset = "var(--header-height)",
}: SecondaryBarProps) => {
  return (
    <div
      className={cn(
        "sticky isolate z-30",
        "border-muted border-b",
        "bg-background/95 backdrop-blur-md",
        className,
      )}
      style={{ top: topOffset }}
    >
      {children}
    </div>
  )
}
