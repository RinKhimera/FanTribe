import { Metadata } from "next"
import { CookiesContent } from "@/components/legal"

export const metadata: Metadata = {
  title: "Politique de cookies",
  description:
    "Découvrez comment FanTribe utilise les cookies pour améliorer votre expérience.",
}

const CookiesPage = () => {
  return <CookiesContent />
}

export default CookiesPage
