import { Metadata } from "next"
import { PrivacyContent } from "@/components/legal"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Découvrez comment FanTribe collecte, utilise et protège vos données personnelles.",
}

const PrivacyPage = () => {
  return <PrivacyContent />
}

export default PrivacyPage
