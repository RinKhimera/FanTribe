"use client"

import { CircleX } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"

const CancelledPage = () => {
  const search = useSearchParams()
  const username = search.get("username")
  return (
    <main className="border-muted flex h-full min-h-screen w-[50%] flex-col items-center justify-center border-r border-l max-lg:w-full">
      <div className="flex flex-col items-center gap-10">
        <CircleX size={80} />

        <div className="px-3 text-center text-xl">
          Votre paiement a échoué. Veuillez réessayer plus tard.
        </div>

        {username ? (
          <Link
            className={`${buttonVariants({ variant: "default" })}`}
            href={`/${username}`}
          >
            Retourner au profil de @{username}
          </Link>
        ) : (
          <Link
            className={`${buttonVariants({ variant: "default" })}`}
            href={"/"}
          >
            Retourner à l&apos;accueil
          </Link>
        )}
      </div>
    </main>
  )
}

export default CancelledPage
