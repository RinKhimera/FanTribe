"use client"

import { frFR } from "@clerk/localizations"
import { ClerkProvider, useAuth } from "@clerk/nextjs"
import { dark, shadesOfPurple } from "@clerk/themes"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ReactNode } from "react"
import { env } from "@/lib/env"

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL)

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ClerkProvider
      localization={frFR}
      appearance={{
        baseTheme: [dark, shadesOfPurple],
      }}
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
