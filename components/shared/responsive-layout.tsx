"use client"

import React from "react"
import { LeftSidebar } from "@/components/shared/left-sidebar"
import { RightSidebarRouter } from "@/components/shared/right-sidebar-router"
import { Doc } from "@/convex/_generated/dataModel"

type Props = {
  currentUser: Doc<"users">
  children: React.ReactNode
}

// Conteneur 3-colonnes moderne, responsive, avec barres latérales sticky
export const ResponsiveLayout = ({ currentUser, children }: Props) => {
  return (
    <section className="relative w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-(--breakpoint-xl) gap-0">
        {/* Colonne gauche */}
        <LeftSidebar currentUser={currentUser} />

        {/* Contenu principal (laisse les pages gérer largeur/bordures) */}
        {children}

        {/* Colonne droite */}
        <RightSidebarRouter />
      </div>
    </section>
  )
}
