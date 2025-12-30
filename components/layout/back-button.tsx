"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BackButtonProps = {
  /** URL de destination (si non fourni, utilise router.back()) */
  href?: string
  /** Callback personnalisé au clic */
  onClick?: () => void
  /** Classes additionnelles */
  className?: string
  /** Label accessible (default: "Retour") */
  ariaLabel?: string
}

/**
 * BackButton - Bouton retour réutilisable pour le slot leftAction des headers
 *
 * @example
 * // Retour à la page précédente (history)
 * <BackButton />
 *
 * @example
 * // Retour vers une URL spécifique
 * <BackButton href="/home" />
 *
 * @example
 * // Action personnalisée
 * <BackButton onClick={() => closeModal()} />
 */
export const BackButton = ({
  href,
  onClick,
  className,
  ariaLabel = "Retour",
}: BackButtonProps) => {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn("size-9 rounded-full", className)}
      aria-label={ariaLabel}
    >
      <ArrowLeft className="size-4" />
    </Button>
  )
}
