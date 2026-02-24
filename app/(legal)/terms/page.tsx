import { Metadata } from "next"
import { TermsContent } from "@/components/legal"

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Consultez les conditions générales d'utilisation de la plateforme FanTribe.",
}

const TermsPage = () => {
  return <TermsContent />
}

export default TermsPage
