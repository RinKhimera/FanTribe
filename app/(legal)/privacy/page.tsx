import { Cookie, Database, Eye, Lock, Shield, UserCog } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité | FanTribe",
  description:
    "Découvrez comment FanTribe collecte, utilise et protège vos données personnelles.",
}

const PrivacyPage = () => {
  return (
    <article className="max-w-none">
      {/* Header */}
      <div className="border-border/50 mb-12 border-b pb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
            <Shield className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Politique de confidentialité
            </h1>
            <p className="text-muted-foreground mt-1">
              Dernière mise à jour :{" "}
              {new Date().toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground text-lg">
          Chez FanTribe, nous prenons la protection de vos données personnelles
          très au sérieux. Cette politique explique comment nous collectons,
          utilisons et protégeons vos informations.
        </p>
      </div>

      {/* Quick navigation */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border-border/50 bg-background/50 rounded-xl border p-4">
          <Database className="text-primary mb-2 h-5 w-5" />
          <h3 className="font-semibold">Collecte des données</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Ce que nous collectons et pourquoi
          </p>
        </div>
        <div className="border-border/50 bg-background/50 rounded-xl border p-4">
          <Eye className="text-primary mb-2 h-5 w-5" />
          <h3 className="font-semibold">Utilisation</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Comment nous utilisons vos données
          </p>
        </div>
        <div className="border-border/50 bg-background/50 rounded-xl border p-4">
          <Lock className="text-primary mb-2 h-5 w-5" />
          <h3 className="font-semibold">Protection</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Comment nous sécurisons vos données
          </p>
        </div>
        <div className="border-border/50 bg-background/50 rounded-xl border p-4">
          <UserCog className="text-primary mb-2 h-5 w-5" />
          <h3 className="font-semibold">Vos droits</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Contrôlez vos informations
          </p>
        </div>
        <div className="border-border/50 bg-background/50 rounded-xl border p-4">
          <Cookie className="text-primary mb-2 h-5 w-5" />
          <h3 className="font-semibold">Cookies</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Notre utilisation des cookies
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            1. Informations que nous collectons
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-foreground mb-3 text-lg font-semibold">
                1.1 Informations que vous nous fournissez
              </h3>
              <p className="text-muted-foreground mb-3">
                Lorsque vous utilisez FanTribe, nous collectons les informations
                suivantes :
              </p>
              <ul className="text-muted-foreground ml-6 list-disc space-y-2">
                <li>
                  <strong className="text-foreground">
                    Informations de compte :
                  </strong>{" "}
                  nom, adresse email, nom d&apos;utilisateur, photo de profil
                </li>
                <li>
                  <strong className="text-foreground">
                    Informations de profil :
                  </strong>{" "}
                  biographie, liens vers vos réseaux sociaux, préférences
                </li>
                <li>
                  <strong className="text-foreground">Contenu :</strong>{" "}
                  publications, commentaires, messages que vous créez
                </li>
                <li>
                  <strong className="text-foreground">
                    Informations de paiement :
                  </strong>{" "}
                  traitées de manière sécurisée par nos partenaires (CinetPay,
                  Stripe)
                </li>
                <li>
                  <strong className="text-foreground">
                    Documents de vérification :
                  </strong>{" "}
                  pour les créateurs souhaitant être vérifiés
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-lg font-semibold">
                1.2 Informations collectées automatiquement
              </h3>
              <p className="text-muted-foreground mb-3">
                Nous collectons automatiquement certaines informations
                techniques :
              </p>
              <ul className="text-muted-foreground ml-6 list-disc space-y-2">
                <li>Adresse IP et données de localisation approximative</li>
                <li>Type de navigateur et système d&apos;exploitation</li>
                <li>Pages visitées et temps passé sur la plateforme</li>
                <li>Identifiants d&apos;appareil</li>
                <li>Données de connexion et horodatages</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            2. Comment nous utilisons vos informations
          </h2>
          <div className="text-muted-foreground space-y-4">
            <p>Nous utilisons vos données pour :</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Fournir et améliorer nos services</li>
              <li>Personnaliser votre expérience utilisateur</li>
              <li>Traiter les paiements et gérer les abonnements</li>
              <li>
                Communiquer avec vous (notifications, mises à jour, support)
              </li>
              <li>Assurer la sécurité et prévenir les fraudes</li>
              <li>Respecter nos obligations légales</li>
              <li>
                Analyser l&apos;utilisation de la plateforme pour
                l&apos;améliorer
              </li>
            </ul>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            3. Partage des informations
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-foreground mb-3 text-lg font-semibold">
                3.1 Informations publiques
              </h3>
              <p className="text-muted-foreground">
                Certaines informations de votre profil sont publiques par défaut
                : nom d&apos;utilisateur, photo de profil, biographie et
                publications publiques.
              </p>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-lg font-semibold">
                3.2 Partage avec des tiers
              </h3>
              <p className="text-muted-foreground mb-3">
                Nous pouvons partager vos informations avec :
              </p>
              <ul className="text-muted-foreground ml-6 list-disc space-y-2">
                <li>
                  <strong className="text-foreground">
                    Prestataires de services :
                  </strong>{" "}
                  hébergement (Convex), paiement (CinetPay, Stripe), CDN
                  (Bunny), authentification (Clerk)
                </li>
                <li>
                  <strong className="text-foreground">
                    Autorités légales :
                  </strong>{" "}
                  si requis par la loi ou pour protéger nos droits
                </li>
                <li>
                  <strong className="text-foreground">
                    Autres utilisateurs :
                  </strong>{" "}
                  selon vos paramètres de confidentialité
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-lg font-semibold">
                3.3 Ce que nous ne faisons pas
              </h3>
              <p className="text-muted-foreground">
                Nous ne vendons jamais vos données personnelles à des tiers.
                Nous ne partageons pas vos informations à des fins publicitaires
                tierces sans votre consentement explicite.
              </p>
            </div>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            4. Sécurité des données
          </h2>
          <div className="text-muted-foreground space-y-4">
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et
              organisationnelles pour protéger vos données :
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Chiffrement des données sensibles au repos</li>
              <li>Authentification sécurisée via Clerk</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Surveillance et détection des activités suspectes</li>
              <li>Audits de sécurité réguliers</li>
            </ul>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            5. Conservation des données
          </h2>
          <div className="text-muted-foreground space-y-4">
            <p>
              Nous conservons vos données aussi longtemps que votre compte est
              actif ou selon les besoins pour vous fournir nos services. Après
              suppression de votre compte :
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                Vos données personnelles sont supprimées dans un délai de 30
                jours
              </li>
              <li>
                Certaines données peuvent être conservées plus longtemps si
                requis par la loi
              </li>
              <li>
                Les données anonymisées peuvent être conservées à des fins
                statistiques
              </li>
            </ul>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            6. Vos droits
          </h2>
          <div className="text-muted-foreground space-y-4">
            <p>
              Conformément aux lois applicables en matière de protection des
              données, vous disposez des droits suivants :
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-foreground">
                  Droit d&apos;accès :
                </strong>{" "}
                obtenir une copie de vos données personnelles
              </li>
              <li>
                <strong className="text-foreground">
                  Droit de rectification :
                </strong>{" "}
                corriger des données inexactes
              </li>
              <li>
                <strong className="text-foreground">
                  Droit à l&apos;effacement :
                </strong>{" "}
                demander la suppression de vos données
              </li>
              <li>
                <strong className="text-foreground">
                  Droit à la portabilité :
                </strong>{" "}
                recevoir vos données dans un format structuré
              </li>
              <li>
                <strong className="text-foreground">
                  Droit d&apos;opposition :
                </strong>{" "}
                vous opposer à certains traitements
              </li>
              <li>
                <strong className="text-foreground">
                  Droit de limitation :
                </strong>{" "}
                limiter le traitement de vos données
              </li>
            </ul>
            <div className="bg-background/50 mt-4 rounded-lg p-4">
              <p>
                Pour exercer ces droits, contactez-nous à{" "}
                <a
                  href="mailto:privacy@fantribe.com"
                  className="text-primary hover:underline"
                >
                  privacy@fantribe.com
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            7. Cookies et technologies similaires
          </h2>
          <div className="text-muted-foreground space-y-4">
            <p>Nous utilisons des cookies pour :</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-foreground">
                  Cookies essentiels :
                </strong>{" "}
                fonctionnement de base de la plateforme, authentification
              </li>
              <li>
                <strong className="text-foreground">
                  Cookies de performance :
                </strong>{" "}
                analyse de l&apos;utilisation pour améliorer nos services
              </li>
              <li>
                <strong className="text-foreground">
                  Cookies de préférences :
                </strong>{" "}
                mémoriser vos choix (thème, langue)
              </li>
            </ul>
            <p>
              Vous pouvez gérer vos préférences de cookies via les paramètres de
              votre navigateur.
            </p>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            8. Transferts internationaux
          </h2>
          <div className="text-muted-foreground">
            <p>
              Vos données peuvent être transférées et traitées dans des pays
              autres que votre pays de résidence. Nous nous assurons que ces
              transferts sont effectués conformément aux lois applicables et
              avec des garanties appropriées.
            </p>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            9. Protection des mineurs
          </h2>
          <div className="text-muted-foreground">
            <p>
              FanTribe n&apos;est pas destiné aux personnes de moins de 18 ans.
              Nous ne collectons pas sciemment des données personnelles de
              mineurs. Si nous apprenons qu&apos;un mineur nous a fourni des
              données, nous les supprimerons immédiatement.
            </p>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            10. Modifications de cette politique
          </h2>
          <div className="text-muted-foreground">
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité de
              temps à autre. Nous vous informerons de tout changement important
              par email ou via une notification sur la plateforme. La date de la
              dernière mise à jour est indiquée en haut de cette page.
            </p>
          </div>
        </section>

        <section className="border-border/30 bg-muted/20 rounded-xl border p-6">
          <h2 className="text-primary mb-4 text-xl font-bold sm:text-2xl">
            11. Contact
          </h2>
          <div className="text-muted-foreground space-y-4">
            <p>
              Pour toute question concernant cette politique de confidentialité
              ou vos données personnelles, contactez-nous :
            </p>
            <div className="bg-background/50 space-y-2 rounded-lg p-4">
              <p>
                <span className="text-foreground font-medium">
                  Email confidentialité :
                </span>{" "}
                <a
                  href="mailto:privacy@fantribe.com"
                  className="text-primary hover:underline"
                >
                  privacy@fantribe.com
                </a>
              </p>
              <p>
                <span className="text-foreground font-medium">
                  Support général :
                </span>{" "}
                <a
                  href="mailto:support@fantribe.com"
                  className="text-primary hover:underline"
                >
                  support@fantribe.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </article>
  )
}

export default PrivacyPage
