"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { PaymentStatus } from "@/types"

export const PaymentCheckLayout = () => {
  // const followUser = useMutation(api.subscriptions.followUser)

  const searchParams = useSearchParams()
  const depositId = searchParams.get("depositId")
  const apiURL =
    process.env.NODE_ENV === "production"
      ? "https://fantribe.io/api/status"
      : "http://localhost:3000/api/status"

  const fetchPaymentStatus = async () => {
    const resp = await fetch(`${apiURL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        depositId: depositId,
      }),
    })

    const data = await resp.json()

    return data.data[0]
  }

  const { data, isPending, error } = useQuery<PaymentStatus>({
    queryKey: ["paymentStatus", depositId],
    queryFn: fetchPaymentStatus,
    // refetchInterval: 1000,
  })

  if (isPending)
    return (
      <main className="border-muted flex h-full min-h-screen w-[50%] flex-col items-center justify-center border-r border-l max-lg:w-[80%]">
        <div className="px-3 text-center text-xl">
          Veuillez patienter. Nous interrogeons le statut de votre paiement...
        </div>
      </main>
    )

  if (error)
    return (
      <main className="border-muted flex h-full min-h-screen w-[50%] flex-col items-center justify-center border-r border-l max-lg:w-[80%]">
        <div className="px-3 text-center text-xl">
          Une erreur s&apos;est produite : {error.message}
          <br />
          <br />
          Pas de souci, veuillez contacter le support technique si vous avez été
          débité. Prenez une capture d&apos;écran et faites nous la parvenir
          ainsi que l&apos;identifiant de la transaction suivante :{" "}
          <span className="font-bold">{depositId}</span>
        </div>
      </main>
    )

  // if (data.status === "COMPLETED") {
  //   followUser({
  //     creatorId: data.metadata.creatorId,
  //     startDate: data.created,
  //   })
  // }

  return (
    <main className="border-muted flex h-full min-h-screen w-[50%] flex-col items-center justify-center border-r border-l max-lg:w-[80%]">
      <div>
        {data.status === "COMPLETED" && (
          <div className="flex flex-col items-center gap-4">
            <div className="px-3 text-center text-xl">
              Bonne nouvelle, Votre paiement a été effectué avec succès !
              <br />
              Merci et profitez de votre service.
            </div>

            <Link
              className={`${buttonVariants({ variant: "default" })}`}
              href={`/${data.metadata.creatorUsername}`}
            >
              Retourner au profil
            </Link>
          </div>
        )}
      </div>

      <div>
        {data.status === "FAILED" && (
          <div className="flex flex-col items-center gap-4">
            <div className="px-3 text-center text-xl">
              Votre paiement a échoué. Veuillez réessayer plus tard.
            </div>

            <Link
              className={`${buttonVariants({ variant: "default" })}`}
              href={"/"}
            >
              Retourner à l&apos;accueil
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
