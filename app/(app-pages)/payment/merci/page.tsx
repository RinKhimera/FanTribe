import { CircleCheckBig } from "lucide-react"
import Link from "next/link"
import { use } from "react"
import { buttonVariants } from "@/components/ui/button"

const MerciPage = (props: {
  searchParams: Promise<{ username?: string }>
}) => {
  const { username } = use(props.searchParams)
  return (
    <main className="border-muted flex h-full min-h-screen w-full flex-col items-center justify-center border-r border-l">
      <div className="flex flex-col items-center gap-10">
        <CircleCheckBig size={80} aria-hidden="true" />

        <div className="px-3 text-center text-xl">
          Votre paiement a été effectué avec succès !
          <br />
          Merci et profitez de votre service.
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
            href={`/`}
          >
            Retourner à l&apos;accueil
          </Link>
        )}
      </div>
    </main>
  )
}

export default MerciPage
