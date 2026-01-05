"use client"

import {
  CheckCircle,
  Users,
  FileText,
  CreditCard,
  UserCheck,
  Shield,
  Scale,
  AlertTriangle,
  Globe,
  Mail,
} from "lucide-react"
import {
  LegalSection,
  LegalSubSection,
  LegalText,
  LegalList,
  LegalHighlight,
  LegalLink,
} from "./legal-section"
import { LegalPageContent } from "./legal-page-content"

const quickLinks = [
  {
    icon: Scale,
    title: "Vos droits",
    description: "Comprenez vos droits en tant qu'utilisateur",
  },
  {
    icon: UserCheck,
    title: "Vos responsabilités",
    description: "Ce que nous attendons de vous",
  },
  {
    icon: Shield,
    title: "Protection",
    description: "Comment nous protégeons la communauté",
  },
]

export const TermsContent = () => {
  return (
    <LegalPageContent
      icon={FileText}
      title="Conditions d'utilisation"
      description="Veuillez lire attentivement ces conditions avant d'utiliser FanTribe. En accédant à notre plateforme, vous acceptez d'être lié par ces conditions."
      quickLinks={quickLinks}
    >
      <LegalSection
        id="section-1"
        icon={CheckCircle}
        title="1. Acceptation des conditions"
      >
        <LegalText>
          En créant un compte ou en utilisant FanTribe, vous confirmez avoir lu,
          compris et accepté ces conditions d&apos;utilisation dans leur
          intégralité. Si vous n&apos;acceptez pas ces conditions, veuillez ne
          pas utiliser notre plateforme.
        </LegalText>
        <LegalText>
          FanTribe se réserve le droit de modifier ces conditions à tout moment.
          Les modifications entreront en vigueur dès leur publication sur la
          plateforme. Votre utilisation continue de FanTribe après ces
          modifications constitue votre acceptation des nouvelles conditions.
        </LegalText>
      </LegalSection>

      <LegalSection id="section-2" icon={Users} title="2. Éligibilité">
        <LegalText>Pour utiliser FanTribe, vous devez :</LegalText>
        <LegalList
          items={[
            "Avoir au moins 18 ans ou l'âge de la majorité dans votre pays",
            "Être juridiquement capable de conclure un contrat contraignant",
            "Ne pas être interdit d'utiliser nos services en vertu des lois applicables",
            "Fournir des informations exactes et à jour lors de votre inscription",
          ]}
        />
      </LegalSection>

      <LegalSection
        id="section-3"
        icon={UserCheck}
        title="3. Création de compte"
      >
        <LegalText>
          Lors de la création de votre compte, vous vous engagez à fournir des
          informations véridiques, exactes et complètes. Vous êtes responsable
          de la confidentialité de vos identifiants de connexion et de toutes
          les activités effectuées sous votre compte.
        </LegalText>
        <LegalText>
          Vous devez nous informer immédiatement de toute utilisation non
          autorisée de votre compte ou de toute autre violation de sécurité.
        </LegalText>
      </LegalSection>

      <LegalSection id="section-4" icon={FileText} title="4. Contenu utilisateur">
        <LegalSubSection title="4.1 Propriété du contenu">
          <LegalText>
            Vous conservez tous les droits de propriété intellectuelle sur le
            contenu que vous publiez sur FanTribe. En publiant du contenu, vous
            nous accordez une licence mondiale, non exclusive, libre de
            redevances pour utiliser, reproduire et distribuer ce contenu dans
            le cadre de nos services.
          </LegalText>
        </LegalSubSection>

        <LegalSubSection title="4.2 Responsabilité du contenu">
          <LegalText>
            Vous êtes entièrement responsable du contenu que vous publiez. Vous
            garantissez que votre contenu :
          </LegalText>
          <LegalList
            items={[
              "Ne viole aucun droit de propriété intellectuelle",
              "Ne contient pas de contenu illégal, diffamatoire ou offensant",
              "Ne contient pas de virus ou de code malveillant",
              "Respecte les lois applicables en matière de protection des mineurs",
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="4.3 Contenu interdit">
          <LegalHighlight variant="warning">
            <LegalText className="!text-foreground">
              Les contenus suivants sont strictement interdits :
            </LegalText>
            <LegalList
              items={[
                "Contenu impliquant des mineurs de quelque manière que ce soit",
                "Nudité complète ou exposition des parties génitales",
                "Contenu promouvant la violence, la haine ou la discrimination",
                "Contenu frauduleux ou trompeur",
                "Spam ou contenu commercial non autorisé",
                "Contenu portant atteinte à la vie privée d'autrui",
              ]}
            />
          </LegalHighlight>
        </LegalSubSection>
      </LegalSection>

      <LegalSection
        id="section-5"
        icon={CreditCard}
        title="5. Abonnements et paiements"
      >
        <LegalSubSection title="5.1 Abonnements créateurs">
          <LegalText>
            Les créateurs peuvent proposer des abonnements payants pour accéder
            à leur contenu exclusif. Les prix sont fixés par les créateurs
            conformément à nos directives.
          </LegalText>
        </LegalSubSection>

        <LegalSubSection title="5.2 Traitement des paiements">
          <LegalText>
            Les paiements sont traités par nos partenaires de paiement
            sécurisés (CinetPay et Stripe). En effectuant un achat, vous
            acceptez également les conditions de ces prestataires de services de
            paiement.
          </LegalText>
        </LegalSubSection>

        <LegalSubSection title="5.3 Remboursements">
          <LegalText>
            Les abonnements sont généralement non remboursables, sauf dans les
            cas prévus par la loi ou notre politique de remboursement
            spécifique. Contactez notre support pour toute demande de
            remboursement.
          </LegalText>
        </LegalSubSection>
      </LegalSection>

      <LegalSection
        id="section-6"
        icon={UserCheck}
        title="6. Comportement des utilisateurs"
      >
        <LegalText>En utilisant FanTribe, vous vous engagez à :</LegalText>
        <LegalList
          items={[
            "Respecter les autres utilisateurs et créateurs",
            "Ne pas harceler, intimider ou menacer quiconque",
            "Ne pas usurper l'identité d'une autre personne",
            "Ne pas tenter de contourner les mesures de sécurité",
            "Ne pas utiliser la plateforme à des fins illégales",
          ]}
        />
      </LegalSection>

      <LegalSection
        id="section-7"
        icon={Shield}
        title="7. Propriété intellectuelle"
      >
        <LegalText>
          FanTribe et tout son contenu original, fonctionnalités et
          fonctionnalités sont la propriété exclusive de FanTribe et sont
          protégés par les lois internationales sur le droit d&apos;auteur, les
          marques et autres lois sur la propriété intellectuelle.
        </LegalText>
      </LegalSection>

      <LegalSection
        id="section-8"
        icon={AlertTriangle}
        title="8. Résiliation"
      >
        <LegalText>
          Nous pouvons suspendre ou résilier votre compte immédiatement, sans
          préavis ni responsabilité, pour quelque raison que ce soit, notamment
          si vous violez ces conditions d&apos;utilisation.
        </LegalText>
        <LegalText>
          Vous pouvez supprimer votre compte à tout moment via les paramètres de
          votre profil. La suppression de votre compte entraînera la perte de
          tout contenu et données associés.
        </LegalText>
      </LegalSection>

      <LegalSection
        id="section-9"
        icon={Scale}
        title="9. Limitation de responsabilité"
      >
        <LegalText>
          FanTribe est fourni &quot;tel quel&quot; sans garantie d&apos;aucune
          sorte. Nous ne serons pas responsables des dommages indirects,
          accessoires, spéciaux ou consécutifs résultant de votre utilisation de
          la plateforme.
        </LegalText>
      </LegalSection>

      <LegalSection id="section-10" icon={Globe} title="10. Droit applicable">
        <LegalText>
          Ces conditions sont régies par les lois du Cameroun. Tout litige
          relatif à ces conditions sera soumis à la compétence exclusive des
          tribunaux camerounais.
        </LegalText>
      </LegalSection>

      <LegalSection id="section-11" icon={Mail} title="11. Contact">
        <LegalText>
          Pour toute question concernant ces conditions d&apos;utilisation,
          veuillez nous contacter à :
        </LegalText>
        <LegalHighlight variant="info">
          <LegalText>
            <span className="font-medium text-foreground">Email :</span>{" "}
            <LegalLink href="mailto:support@fantribe.com">
              support@fantribe.com
            </LegalLink>
          </LegalText>
        </LegalHighlight>
      </LegalSection>
    </LegalPageContent>
  )
}
