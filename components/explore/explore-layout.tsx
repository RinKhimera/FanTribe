"use client"

import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"

export const ExploreLayout = () => {
  const router = useRouter()

  const apiURL =
    process.env.NODE_ENV === "production"
      ? "https://fantribe.io/api/deposits"
      : "http://localhost:3000/api/deposits"

  const handleClick = async () => {
    try {
      const depositId = uuidv4()

      const resp = await fetch(apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          depositId: depositId,
          returnUrl: "https://fantribe.io/notifications",
          statementDescription: "Note of 4 to 22 chars",
          amount: "500",
          // msisdn: "233593456789",
          country: "CMR",
          reason: "Abonnement mensuel Fantribe",
        }),
      })

      const data = await resp.json()
      console.log(data, depositId)

      router.push(data.data.redirectUrl)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-lg:w-[80%] max-sm:w-full">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Explorer
      </h1>

      <Button onClick={handleClick}>Payer</Button>
    </main>
  )
}
