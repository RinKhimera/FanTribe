"use client"

import { motion } from "motion/react"
import type { LucideIcon } from "lucide-react"
import React from "react"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  /** Titre principal de la page */
  title?: string
  /** Icône optionnelle affichée à gauche du titre */
  icon?: LucideIcon
  /** Contenu personnalisé (remplace le titre si fourni) */
  children?: React.ReactNode
  /** Action à afficher à gauche (bouton retour, etc.) */
  leftAction?: React.ReactNode
  /** Actions à afficher à droite du header */
  rightAction?: React.ReactNode
  /** @deprecated Utiliser rightAction à la place */
  actions?: React.ReactNode
  /** Barre secondaire sticky (tabs, filtres) affichée sous le header */
  secondaryBar?: React.ReactNode
  /** Classes additionnelles pour la barre secondaire */
  secondaryBarClassName?: string
  /** Masquer la bordure inférieure */
  hideBottomBorder?: boolean
  /** Classes additionnelles */
  className?: string
}

/**
 * PageHeader - Header sticky réutilisable pour les pages
 *
 * Design unifié "Refined Glass" :
 * - Effet frosted glass cohérent
 * - Typographie: text-xl font-semibold tracking-tight
 * - Animation d'entrée subtile
 * - Support icône optionnelle
 *
 * @example
 * // Header simple avec titre
 * <PageHeader title="Notifications" />
 *
 * @example
 * // Header avec icône
 * <PageHeader title="Notifications" icon={Bell} />
 *
 * @example
 * // Header avec actions
 * <PageHeader
 *   title="Messages"
 *   leftAction={<BackButton />}
 *   rightAction={<NewConversationButton />}
 * />
 */
export const PageHeader = ({
  title,
  icon: Icon,
  children,
  leftAction,
  rightAction,
  actions,
  secondaryBar,
  secondaryBarClassName,
  hideBottomBorder = false,
  className,
}: PageHeaderProps) => {
  // Support pour l'ancien prop "actions" (rétrocompatibilité)
  const resolvedRightAction = rightAction ?? actions

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "sticky top-0 z-20",
          "flex items-center justify-between",
          "min-h-[var(--header-height)]",
          !hideBottomBorder && "border-b border-border",
          "px-[var(--header-padding)] py-3",
          "frosted",
          className,
        )}
      >
        {/* Section gauche: leftAction + icon + contenu principal */}
        <div className="flex flex-1 items-center gap-2.5">
          {leftAction}
          {Icon && (
            <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
          )}
          {children ??
            (title && (
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            ))}
        </div>

        {/* Section droite: rightAction */}
        {resolvedRightAction && (
          <div className="flex items-center gap-2">{resolvedRightAction}</div>
        )}
      </motion.header>

      {/* Barre secondaire sticky (tabs, filtres) */}
      {secondaryBar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className={cn(
            "sticky top-[var(--header-height)] z-20",
            "border-b border-white/[0.08]",
            "frosted",
            secondaryBarClassName,
          )}
        >
          {secondaryBar}
        </motion.div>
      )}
    </>
  )
}
