"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React, { ReactNode } from "react"

const TanstackClientProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export default TanstackClientProvider
