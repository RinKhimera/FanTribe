"use client"

import {
  Shield,
  Database,
  Eye,
  Lock,
  UserCog,
  Cookie,
  Share2,
  Clock,
  Globe,
  Baby,
  Bell,
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
    icon: Database,
    title: "Collecte des données",
    description: "Ce que nous collectons et pourquoi",
  },
  {
    icon: Eye,
    title: "Utilisation",
    description: "Comment nous utilisons vos données",
  },
  {
    icon: Lock,
    title: "Protection",
    description: "Comment nous sécurisons vos données",
  },
  {
    icon: UserCog,
    title: "Vos droits",
    description: "Contrôlez vos informations",
  },
  {
    icon: Cookie,
    title: "Cookies",
    description: "Notre utilisation des cookies",
    href: "/cookies",
  },
]

export const PrivacyContent = () => {
  return (
    <LegalPageContent
      icon={Shield}
      title="Politique de confidentialité"
      description="Chez FanTribe, nous prenons la protection de vos données personnelles très au sérieux. Cette politique explique comment nous collectons, utilisons et protégeons vos informations."
      quickLinks={quickLinks}
    >
      <LegalSection
        id="section-1"
        icon={Database}
        title="1. Informations que nous collectons"
      >
        <LegalSubSection title="1.1 Informations que vous nous fournissez">
          <LegalText>
            Lorsque vous utilisez FanTribe, nous collectons les informations
            suivantes :
          </LegalText>
          <LegalList
            items={[
              <>
                <strong className="text-foreground">
                  Informations de compte :
                </strong>{" "}
                nom, adresse email, nom d&apos;utilisateur, photo de profil
              </>,
              <>
                <strong className="text-foreground">
                  Informations de profil :
                </strong>{" "}
                biographie, liens vers vos réseaux sociaux, préférences
              </>,
              <>
                <strong className="text-foreground">Contenu :</strong>{" "}
                publications, commentaires, messages que vous créez
              </>,
              <>
                <strong className="text-foreground">
                  Informations de paiement :
                </strong>{" "}
                traitées de manière sécurisée par nos partenaires (CinetPay,
                Stripe)
              </>,
              <>
                <strong className="text-foreground">
                  Documents de vérification :
                </strong>{" "}
                pour les créateurs souhaitant être vérifiés
              </>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="1.2 Informations collectées automatiquement">
          <LegalText>
            Nous collectons automatiquement certaines informations techniques :
          </LegalText>
          <LegalList
            items={[
              "Adresse IP et données de localisation approximative",
              "Type de navigateur et système d'exploitation",
              "Pages visitées et temps passé sur la plateforme",
              "Identifiants d'appareil",
              "Données de connexion et horodatages",
            ]}
          />
        </LegalSubSection>
      </LegalSection>

      <LegalSection
        id="section-2"
        icon={Eye}
        title="2. Comment nous utilisons vos informations"
      >
        <LegalText>Nous utilisons vos données pour :</LegalText>
        <LegalList
          items={[
            "Fournir et améliorer nos services",
            "Personnaliser votre expérience utilisateur",
            "Traiter les paiements et gérer les abonnements",
            "Communiquer avec vous (notifications, mises à jour, support)",
            "Assurer la sécurité et prévenir les fraudes",
            "Respecter nos obligations légales",
            "Analyser l'utilisation de la plateforme pour l'améliorer",
          ]}
        />
      </LegalSection>

      <LegalSection
        id="section-3"
        icon={Share2}
        title="3. Partage des informations"
      >
        <LegalSubSection title="3.1 Informations publiques">
          <LegalText>
            Certaines informations de votre profil sont publiques par défaut :
            nom d&apos;utilisateur, photo de profil, biographie et publications
            publiques.
          </LegalText>
        </LegalSubSection>

        <LegalSubSection title="3.2 Partage avec des tiers">
          <LegalText>
            Nous pouvons partager vos informations avec :
          </LegalText>
          <LegalList
            items={[
              <>
                <strong className="text-foreground">
                  Prestataires de services :
                </strong>{" "}
                hébergement (Convex), paiement (CinetPay, Stripe), CDN (Bunny),
                authentification (Clerk)
              </>,
              <>
                <strong className="text-foreground">Autorités légales :</strong>{" "}
                si requis par la loi ou pour protéger nos droits
              </>,
              <>
                <strong className="text-foreground">Autres utilisateurs :</strong>{" "}
                selon vos paramètres de confidentialité
              </>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="3.3 Ce que nous ne faisons pas">
          <LegalHighlight variant="info">
            <LegalText className="!text-foreground">
              Nous ne vendons jamais vos données personnelles à des tiers. Nous
              ne partageons pas vos informations à des fins publicitaires
              tierces sans votre consentement explicite.
            </LegalText>
          </LegalHighlight>
        </LegalSubSection>
      </LegalSection>

      <LegalSection
        id="section-4"
        icon={Lock}
        title="4. Sécurité des données"
      >
        <LegalText>
          Nous mettons en œuvre des mesures de sécurité techniques et
          organisationnelles pour protéger vos données :
        </LegalText>
        <LegalList
          items={[
            "Chiffrement des données en transit (HTTPS/TLS)",
            "Chiffrement des données sensibles au repos",
            "Authentification sécurisée via Clerk",
            "Accès restreint aux données personnelles",
            "Surveillance et détection des activités suspectes",
            "Audits de sécurité réguliers",
          ]}
        />
      </LegalSection>

      <LegalSection
        id="section-5"
        icon={Clock}
        title="5. Conservation des données"
      >
        <LegalText>
          Nous conservons vos données aussi longtemps que votre compte est actif
          ou selon les besoins pour vous fournir nos services. Après suppression
          de votre compte :
        </LegalText>
        <LegalList
          items={[
            "Vos données personnelles sont supprimées dans un délai de 30 jours",
            "Certaines données peuvent être conservées plus longtemps si requis par la loi",
            "Les données anonymisées peuvent être conservées à des fins statistiques",
          ]}
        />
      </LegalSection>

      <LegalSection id="section-6" icon={UserCog} title="6. Vos droits">
        <LegalText>
          Conformément aux lois applicables en matière de protection des
          données, vous disposez des droits suivants :
        </LegalText>
        <LegalList
          items={[
            <>
              <strong className="text-foreground">Droit d&apos;accès :</strong>{" "}
              obtenir une copie de vos données personnelles
            </>,
            <>
              <strong className="text-foreground">
                Droit de rectification :
              </strong>{" "}
              corriger des données inexactes
            </>,
            <>
              <strong className="text-foreground">
                Droit à l&apos;effacement :
              </strong>{" "}
              demander la suppression de vos données
            </>,
            <>
              <strong className="text-foreground">
                Droit à la portabilité :
              </strong>{" "}
              recevoir vos données dans un format structuré
            </>,
            <>
              <strong className="text-foreground">
                Droit d&apos;opposition :
              </strong>{" "}
              vous opposer à certains traitements
            </>,
            <>
              <strong className="text-foreground">
                Droit de limitation :
              </strong>{" "}
              limiter le traitement de vos données
            </>,
          ]}
        />
        <LegalHighlight variant="info">
          <LegalText>
            Pour exercer ces droits, contactez-nous à{" "}
            <LegalLink href="mailto:privacy@fantribe.com">
              privacy@fantribe.com
            </LegalLink>
          </LegalText>
        </LegalHighlight>
      </LegalSection>

      <LegalSection
        id="section-7"
        icon={Cookie}
        title="7. Cookies et technologies similaires"
      >
        <LegalText>Nous utilisons des cookies pour :</LegalText>
        <LegalList
          items={[
            <>
              <strong className="text-foreground">Cookies essentiels :</strong>{" "}
              fonctionnement de base de la plateforme, authentification
            </>,
            <>
              <strong className="text-foreground">
                Cookies de performance :
              </strong>{" "}
              analyse de l&apos;utilisation pour améliorer nos services
            </>,
            <>
              <strong className="text-foreground">
                Cookies de préférences :
              </strong>{" "}
              mémoriser vos choix (thème, langue)
            </>,
          ]}
        />
        <LegalText>
          Pour plus de détails, consultez notre{" "}
          <LegalLink href="/cookies">politique de cookies</LegalLink>.
        </LegalText>
      </LegalSection>

      <LegalSection
        id="section-8"
        icon={Globe}
        title="8. Transferts internationaux"
      >
        <LegalText>
          Vos données peuvent être transférées et traitées dans des pays autres
          que votre pays de résidence. Nous nous assurons que ces transferts
          sont effectués conformément aux lois applicables et avec des garanties
          appropriées.
        </LegalText>
      </LegalSection>

      <LegalSection
        id="section-9"
        icon={Baby}
        title="9. Protection des mineurs"
      >
        <LegalHighlight variant="warning">
          <LegalText className="!text-foreground">
            FanTribe n&apos;est pas destiné aux personnes de moins de 18 ans.
            Nous ne collectons pas sciemment des données personnelles de
            mineurs. Si nous apprenons qu&apos;un mineur nous a fourni des
            données, nous les supprimerons immédiatement.
          </LegalText>
        </LegalHighlight>
      </LegalSection>

      <LegalSection
        id="section-10"
        icon={Bell}
        title="10. Modifications de cette politique"
      >
        <LegalText>
          Nous pouvons mettre à jour cette politique de confidentialité de temps
          à autre. Nous vous informerons de tout changement important par email
          ou via une notification sur la plateforme. La date de la dernière mise
          à jour est indiquée en haut de cette page.
        </LegalText>
      </LegalSection>

      <LegalSection id="section-11" icon={Mail} title="11. Contact">
        <LegalText>
          Pour toute question concernant cette politique de confidentialité ou
          vos données personnelles, contactez-nous :
        </LegalText>
        <LegalHighlight variant="info">
          <div className="space-y-2">
            <LegalText>
              <span className="font-medium text-foreground">
                Email confidentialité :
              </span>{" "}
              <LegalLink href="mailto:privacy@fantribe.com">
                privacy@fantribe.com
              </LegalLink>
            </LegalText>
            <LegalText>
              <span className="font-medium text-foreground">
                Support général :
              </span>{" "}
              <LegalLink href="mailto:support@fantribe.com">
                support@fantribe.com
              </LegalLink>
            </LegalText>
          </div>
        </LegalHighlight>
      </LegalSection>
    </LegalPageContent>
  )
}
