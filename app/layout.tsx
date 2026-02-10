import type { Metadata, Viewport } from "next"
import { Open_Sans as FontSans } from "next/font/google"
import "@/app/globals.css"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import ConvexClientProvider from "@/providers/convex-client-provider"
import TanstackClientProvider from "@/providers/tanstack-provider"
import { ThemeProvider } from "@/providers/theme-provider"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://fantribe.io"),
  title: {
    default: "FanTribe",
    template: "%s | FanTribe",
  },
  description: "Le réseau social des créateurs de contenus",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "FanTribe",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen overflow-y-scroll bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <TanstackClientProvider>{children}</TanstackClientProvider>
          </ConvexClientProvider>
        </ThemeProvider>
        <Toaster richColors />
      </body>
    </html>
  )
}
