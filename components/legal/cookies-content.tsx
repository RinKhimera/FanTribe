"use client"

import {
  Cookie,
  Shield,
  BarChart3,
  Palette,
  Settings,
  Mail,
  Info,
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
    icon: Shield,
    title: "Essentiels",
    description: "Cookies nécessaires au fonctionnement",
  },
  {
    icon: BarChart3,
    title: "Performance",
    description: "Analyse et amélioration du service",
  },
  {
    icon: Palette,
    title: "Préférences",
    description: "Personnalisation de votre expérience",
  },
  {
    icon: Settings,
    title: "Gestion",
    description: "Contrôlez vos préférences",
  },
]

export const CookiesContent = () => {
  return (
    <LegalPageContent
      icon={Cookie}
      title="Politique de cookies"
      description="Cette page explique comment FanTribe utilise les cookies et technologies similaires pour améliorer votre expérience sur notre plateforme."
      quickLinks={quickLinks}
    >
      <LegalSection
        id="section-1"
        icon={Info}
        title="1. Qu'est-ce qu'un cookie ?"
      >
        <LegalText>
          Un cookie est un petit fichier texte stocké sur votre appareil
          (ordinateur, smartphone, tablette) lorsque vous visitez un site web.
          Les cookies permettent au site de reconnaître votre appareil et de
          mémoriser certaines informations sur vos préférences ou actions
          passées.
        </LegalText>
        <LegalText>
          Les cookies peuvent être &quot;de session&quot; (supprimés à la
          fermeture du navigateur) ou &quot;persistants&quot; (conservés pendant
          une période définie). Ils peuvent être placés par FanTribe
          (&quot;cookies propriétaires&quot;) ou par des services tiers
          (&quot;cookies tiers&quot;).
        </LegalText>
      </LegalSection>

      <LegalSection
        id="section-2"
        icon={Shield}
        title="2. Cookies essentiels"
      >
        <LegalText>
          Ces cookies sont indispensables au fonctionnement de FanTribe. Sans
          eux, vous ne pourriez pas utiliser les fonctionnalités de base de la
          plateforme.
        </LegalText>

        <LegalSubSection title="2.1 Authentification (Clerk)">
          <LegalText>
            Nous utilisons Clerk pour gérer l&apos;authentification sécurisée.
            Les cookies suivants sont utilisés :
          </LegalText>
          <LegalList
            items={[
              <>
                <strong className="text-foreground font-mono text-sm">
                  __clerk_session
                </strong>{" "}
                — Maintient votre session de connexion active
              </>,
              <>
                <strong className="text-foreground font-mono text-sm">
                  __client
                </strong>{" "}
                — Identifie votre navigateur pour la sécurité du compte
              </>,
              <>
                <strong className="text-foreground font-mono text-sm">
                  __clerk_db_jwt
                </strong>{" "}
                — Token d&apos;authentification sécurisé
              </>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="2.2 Sécurité">
          <LegalText>
            Des cookies de sécurité protègent contre les attaques CSRF
            (falsification de requête) et assurent l&apos;intégrité de vos
            actions sur la plateforme.
          </LegalText>
        </LegalSubSection>

        <LegalHighlight variant="info">
          <LegalText className="!text-foreground">
            Ces cookies essentiels ne peuvent pas être désactivés car ils sont
            nécessaires au fonctionnement du site. Ils ne collectent aucune
            information à des fins marketing.
          </LegalText>
        </LegalHighlight>
      </LegalSection>

      <LegalSection
        id="section-3"
        icon={BarChart3}
        title="3. Cookies de performance"
      >
        <LegalText>
          Ces cookies nous aident à comprendre comment les visiteurs utilisent
          FanTribe, ce qui nous permet d&apos;améliorer continuellement notre
          plateforme.
        </LegalText>

        <LegalSubSection title="3.1 Vercel Analytics">
          <LegalText>
            Nous utilisons Vercel Analytics pour collecter des données anonymes
            sur l&apos;utilisation du site :
          </LegalText>
          <LegalList
            items={[
              "Pages visitées et parcours de navigation",
              "Temps passé sur chaque page",
              "Performances de chargement des pages",
              "Données géographiques agrégées (pays, région)",
              "Type d'appareil et navigateur utilisé",
            ]}
          />
          <LegalHighlight>
            <LegalText className="!text-foreground">
              Vercel Analytics est conçu pour respecter la vie privée : les
              données sont anonymisées et ne permettent pas de vous identifier
              personnellement.
            </LegalText>
          </LegalHighlight>
        </LegalSubSection>
      </LegalSection>

      <LegalSection
        id="section-4"
        icon={Palette}
        title="4. Cookies de préférences"
      >
        <LegalText>
          Ces cookies mémorisent vos choix pour personnaliser votre expérience
          sur FanTribe.
        </LegalText>

        <LegalSubSection title="4.1 Thème (clair/sombre)">
          <LegalText>
            Un cookie stocke votre préférence de thème visuel pour
            l&apos;appliquer automatiquement lors de vos prochaines visites.
          </LegalText>
          <LegalList
            items={[
              <>
                <strong className="text-foreground font-mono text-sm">
                  theme
                </strong>{" "}
                — Valeur : &quot;light&quot;, &quot;dark&quot; ou
                &quot;system&quot;
              </>,
            ]}
          />
        </LegalSubSection>

        <LegalSubSection title="4.2 Préférences d'interface">
          <LegalText>
            D&apos;autres préférences comme l&apos;état des panneaux repliables
            ou les filtres sélectionnés peuvent être mémorisés localement.
          </LegalText>
        </LegalSubSection>
      </LegalSection>

      <LegalSection
        id="section-5"
        icon={Settings}
        title="5. Gestion de vos préférences"
      >
        <LegalText>
          Vous pouvez contrôler et supprimer les cookies via les paramètres de
          votre navigateur. Voici comment procéder selon votre navigateur :
        </LegalText>

        <LegalSubSection title="5.1 Instructions par navigateur">
          <LegalList
            items={[
              <>
                <strong className="text-foreground">Google Chrome :</strong>{" "}
                Paramètres → Confidentialité et sécurité → Cookies et autres
                données
              </>,
              <>
                <strong className="text-foreground">Mozilla Firefox :</strong>{" "}
                Paramètres → Vie privée et sécurité → Cookies et données de
                sites
              </>,
              <>
                <strong className="text-foreground">Safari :</strong>{" "}
                Préférences → Confidentialité → Gérer les données de sites web
              </>,
              <>
                <strong className="text-foreground">Microsoft Edge :</strong>{" "}
                Paramètres → Cookies et autorisations de site → Gérer et
                supprimer les cookies
              </>,
            ]}
          />
        </LegalSubSection>

        <LegalHighlight variant="warning">
          <LegalText className="!text-foreground">
            La désactivation de certains cookies peut affecter le fonctionnement
            de FanTribe. En particulier, la suppression des cookies essentiels
            vous déconnectera et nécessitera une nouvelle authentification.
          </LegalText>
        </LegalHighlight>
      </LegalSection>

      <LegalSection
        id="section-6"
        icon={Info}
        title="6. Technologies similaires"
      >
        <LegalText>
          En plus des cookies, nous pouvons utiliser d&apos;autres technologies
          de stockage local :
        </LegalText>
        <LegalList
          items={[
            <>
              <strong className="text-foreground">Local Storage :</strong>{" "}
              Stockage de données persistantes dans le navigateur pour améliorer
              les performances
            </>,
            <>
              <strong className="text-foreground">Session Storage :</strong>{" "}
              Données temporaires supprimées à la fermeture de l&apos;onglet
            </>,
            <>
              <strong className="text-foreground">IndexedDB :</strong> Base de
              données locale pour le cache de contenu
            </>,
          ]}
        />
        <LegalText>
          Ces technologies sont soumises aux mêmes règles que les cookies
          concernant votre vie privée.
        </LegalText>
      </LegalSection>

      <LegalSection
        id="section-7"
        icon={Mail}
        title="7. Contact"
      >
        <LegalText>
          Pour toute question concernant notre utilisation des cookies ou pour
          exercer vos droits, contactez-nous :
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
        <LegalText>
          Pour plus d&apos;informations sur la protection de vos données,
          consultez notre{" "}
          <LegalLink href="/privacy">politique de confidentialité</LegalLink>.
        </LegalText>
      </LegalSection>
    </LegalPageContent>
  )
}
