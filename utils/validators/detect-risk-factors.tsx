import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Application } from "@/types"

const normalizeFullName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD") // Décompose les accents (José → Jose)
    .replace(/[\u0300-\u036f]/g, "") // Supprime les diacritiques
    .replace(/[^a-z\s]/g, " ") // Remplace tout sauf lettres et espaces par des espaces
    .replace(/\s+/g, " ") // Multiple espaces → un seul espace
    .trim()
    .split(" ")
    .filter((word) => word.length > 0) // Supprime les mots vides
    .sort() // Trie les mots alphabétiquement
    .join(" ")
}

export const detectRiskFactors = (app: Application, allApps: Application[]) => {
  const riskFactors: Array<{
    message: string
    level: "FAIBLE" | "MODÉRÉ" | "GRAVE"
  }> = []

  // 1. Vérifier les doublons de nom + date de naissance
  const duplicates = allApps.filter((otherApp) => {
    return (
      otherApp._id !== app._id &&
      normalizeFullName(app.personalInfo.fullName) ===
        normalizeFullName(otherApp.personalInfo.fullName) &&
      app.personalInfo.dateOfBirth === otherApp.personalInfo.dateOfBirth
    )
  })

  if (duplicates.length > 0) {
    // Vérifier si ce sont des candidatures du même utilisateur
    const sameUserDuplicates = duplicates.filter(
      (dup) => dup.userId === app.userId,
    )
    const differentUserDuplicates = duplicates.filter(
      (dup) => dup.userId !== app.userId,
    )

    if (sameUserDuplicates.length > 0) {
      // Même utilisateur = candidatures multiples après refus
      riskFactors.push({
        message: `Identité déjà utilisée dans ${sameUserDuplicates.length} candidature(s) précédente(s)`,
        level: "MODÉRÉ",
      })
    }

    if (differentUserDuplicates.length > 0) {
      // Utilisateurs différents = fraude potentielle
      riskFactors.push({
        message: `Identité identique à ${differentUserDuplicates.length} autre(s) utilisateur(s) - FRAUDE POTENTIELLE`,
        level: "GRAVE",
      })
    }
  }

  // 2. Vérifier les doublons de nom seulement (utilisateurs différents)
  const nameOnlyDuplicates = allApps.filter((otherApp) => {
    return (
      otherApp._id !== app._id &&
      otherApp.userId !== app.userId && // Seulement différents utilisateurs
      normalizeFullName(app.personalInfo.fullName) ===
        normalizeFullName(otherApp.personalInfo.fullName) &&
      app.personalInfo.dateOfBirth !== otherApp.personalInfo.dateOfBirth
    )
  })

  if (nameOnlyDuplicates.length > 0) {
    riskFactors.push({
      message: `Nom identique à ${nameOnlyDuplicates.length} autre(s) utilisateur(s) avec dates différentes`,
      level: "MODÉRÉ",
    })
  }

  // 3. Vérifier si le compte est très récent (24h)
  if (app.user) {
    const accountAge = app.submittedAt - app.user._creationTime
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)

    if (daysSinceCreation < 1) {
      riskFactors.push({
        message: "Candidature soumise moins de 24h après création du compte",
        level: "FAIBLE",
      })
    }
  }

  // 4. Vérifier les candidatures multiples du même utilisateur
  const userApplications = allApps.filter((otherApp) => {
    return otherApp.userId === app.userId && otherApp._id !== app._id
  })

  if (userApplications.length > 0) {
    const previousRejected = userApplications.filter((otherApp) => {
      return (
        otherApp.status === "rejected" && otherApp.submittedAt < app.submittedAt
      )
    })

    if (previousRejected.length > 0) {
      riskFactors.push({
        message: `${previousRejected.length} candidature(s) précédente(s) refusée(s)`,
        level: "MODÉRÉ",
      })
    }

    // Candidature multiple générale
    const totalPrevious = userApplications.filter((otherApp) => {
      return otherApp.submittedAt < app.submittedAt
    })

    if (totalPrevious.length > 0) {
      riskFactors.push({
        message: `Candidature multiple (${totalPrevious.length + 1}e tentative)`,
        level: "MODÉRÉ",
      })
    }
  }

  // 5. NOUVELLE: Vérifier si l'utilisateur a changé d'informations personnelles
  if (userApplications.length > 0) {
    const previousApplications = userApplications.filter(
      (prevApp) => prevApp.submittedAt < app.submittedAt, // Fix: utiliser prevApp au lieu de app
    )

    previousApplications.forEach((prevApp) => {
      if (
        normalizeFullName(prevApp.personalInfo.fullName) !==
        normalizeFullName(app.personalInfo.fullName)
      ) {
        riskFactors.push({
          message: "Nom différent par rapport aux candidatures précédentes",
          level: "GRAVE",
        })
      }

      if (prevApp.personalInfo.dateOfBirth !== app.personalInfo.dateOfBirth) {
        riskFactors.push({
          message:
            "Date de naissance différente par rapport aux candidatures précédentes",
          level: "GRAVE",
        })
      }
    })
  }

  // 6. Vérifier la rapidité de soumission après création (30 min) - différent de la condition 3
  if (app.user) {
    const submissionSpeed = app.submittedAt - app.user._creationTime
    const minutesSinceCreation = submissionSpeed / (1000 * 60)

    if (minutesSinceCreation < 30) {
      riskFactors.push({
        message:
          "Candidature soumise moins de 30 minutes après création du compte",
        level: "MODÉRÉ",
      })
    }
  }

  // 7. Vérifier la longueur des champs (ancienne condition 8)
  if (app.personalInfo.fullName.length < 5) {
    riskFactors.push({
      message: "Nom complet très court (potentiellement faux)",
      level: "FAIBLE",
    })
  }

  if (app.personalInfo.address.length < 10) {
    riskFactors.push({
      message: "Adresse très courte (information incomplète)",
      level: "FAIBLE",
    })
  }

  return riskFactors
}

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-xs text-yellow-800"
        >
          <Clock className="mr-1 h-3 w-3" />
          <span className="hidden sm:inline">En attente</span>
          <span className="sm:hidden">Attente</span>
        </Badge>
      )
    case "approved":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-xs text-green-800"
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          <span className="hidden sm:inline">Approuvé</span>
          <span className="sm:hidden">OK</span>
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="secondary" className="bg-red-100 text-xs text-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          <span className="hidden sm:inline">Rejeté</span>
          <span className="sm:hidden">KO</span>
        </Badge>
      )
    default:
      return null
  }
}

export const getRiskBadge = (
  riskFactors: Array<{
    message: string
    level: "FAIBLE" | "MODÉRÉ" | "GRAVE"
  }>,
) => {
  if (riskFactors.length === 0) return null

  const hasGrave = riskFactors.some((factor) => factor.level === "GRAVE")
  const hasModere = riskFactors.some((factor) => factor.level === "MODÉRÉ")

  const globalRiskLevel = hasGrave ? "CRITIQUE" : hasModere ? "ÉLEVÉ" : "MODÉRÉ"

  const colorClass =
    globalRiskLevel === "CRITIQUE"
      ? "bg-red-900 text-red-200 border-red-700"
      : globalRiskLevel === "ÉLEVÉ"
        ? "bg-orange-900 text-orange-200 border-orange-700"
        : "bg-yellow-900 text-yellow-200 border-yellow-700"

  return (
    <Badge variant="outline" className={`${colorClass} text-xs`}>
      <AlertTriangle className="mr-1 h-3 w-3" />
      <span className="hidden sm:inline">Risque {globalRiskLevel}</span>
      <span className="sm:hidden">{globalRiskLevel}</span>
    </Badge>
  )
}
