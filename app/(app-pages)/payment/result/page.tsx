import { CircleCheckBig, CircleX, FlaskConical } from "lucide-react"
import Link from "next/link"
import { use } from "react"
import { buttonVariants } from "@/components/ui/button"
import { isPaymentTestMode } from "@/lib/config/payment-test"

const PaymentResultPage = (props: {
  searchParams: Promise<{
    status?: string
    username?: string
    reason?: string
    transaction?: string
    type?: string
  }>
}) => {
  const { status, username, reason, type } = use(props.searchParams)
  const isSuccess = status === "success"
  const testMode = isPaymentTestMode()

  return (
    <main className="border-muted flex h-full min-h-screen w-full flex-col items-center justify-center border-r border-l">
      <div className="flex flex-col items-center gap-8 px-4 text-center">
        {testMode && (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-500">
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            Paiement simulé (mode test)
          </div>
        )}

        {isSuccess ? (
          <>
            <CircleCheckBig
              size={80}
              className="text-green-500"
              aria-hidden="true"
            />
            <div className="text-xl">
              {type === "tip"
                ? "Votre pourboire a été envoyé avec succès !"
                : "Votre paiement a été effectué avec succès !"}
              <br />
              <span className="text-muted-foreground text-base">
                Merci et profitez de votre service.
              </span>
            </div>
          </>
        ) : (
          <>
            <CircleX
              size={80}
              className="text-destructive"
              aria-hidden="true"
            />
            <div className="text-xl">
              Votre paiement a échoué.
              <br />
              <span className="text-muted-foreground text-base">
                {reason === "cancelled"
                  ? "Vous avez annulé le paiement."
                  : reason === "test_force_fail"
                    ? "Échec forcé en mode test."
                    : "Veuillez réessayer plus tard."}
              </span>
            </div>
          </>
        )}

        {username ? (
          <Link
            className={buttonVariants({ variant: "default" })}
            href={`/${username}`}
          >
            Retourner au profil de @{username}
          </Link>
        ) : (
          <Link
            className={buttonVariants({ variant: "default" })}
            href="/"
          >
            Retourner à l&apos;accueil
          </Link>
        )}
      </div>
    </main>
  )
}

export default PaymentResultPage
