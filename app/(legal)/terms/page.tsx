import { Metadata } from "next"
import { FileText, Scale, ShieldCheck, UserCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Conditions d'utilisation | FanTribe",
  description:
    "Consultez les conditions générales d'utilisation de la plateforme FanTribe.",
}

const TermsPage = () => {
  return (
    <article className="max-w-none">
      {/* Header */}
      <div className="mb-12 border-b border-border/50 pb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Conditions d&apos;utilisation
            </h1>
            <p className="mt-1 text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          Veuillez lire attentivement ces conditions avant d&apos;utiliser
          FanTribe. En accédant à notre plateforme, vous acceptez d&apos;être lié
          par ces conditions.
        </p>
      </div>

      {/* Quick navigation */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
          <Scale className="mb-2 h-5 w-5 text-primary" />
          <h3 className="font-semibold">Vos droits</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comprenez vos droits en tant qu&apos;utilisateur
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
          <UserCheck className="mb-2 h-5 w-5 text-primary" />
          <h3 className="font-semibold">Vos responsabilités</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ce que nous attendons de vous
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
          <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
          <h3 className="font-semibold">Protection</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comment nous protégeons la communauté
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            1. Acceptation des conditions
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              En créant un compte ou en utilisant FanTribe, vous confirmez avoir lu,
              compris et accepté ces conditions d&apos;utilisation dans leur
              intégralité. Si vous n&apos;acceptez pas ces conditions, veuillez ne
              pas utiliser notre plateforme.
            </p>
            <p>
              FanTribe se réserve le droit de modifier ces conditions à tout moment.
              Les modifications entreront en vigueur dès leur publication sur la
              plateforme. Votre utilisation continue de FanTribe après ces
              modifications constitue votre acceptation des nouvelles conditions.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            2. Éligibilité
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>Pour utiliser FanTribe, vous devez :</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Avoir au moins 18 ans ou l&apos;âge de la majorité dans votre pays</li>
              <li>Être juridiquement capable de conclure un contrat contraignant</li>
              <li>Ne pas être interdit d&apos;utiliser nos services en vertu des lois applicables</li>
              <li>Fournir des informations exactes et à jour lors de votre inscription</li>
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            3. Création de compte
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Lors de la création de votre compte, vous vous engagez à fournir des
              informations véridiques, exactes et complètes. Vous êtes responsable de
              la confidentialité de vos identifiants de connexion et de toutes les
              activités effectuées sous votre compte.
            </p>
            <p>
              Vous devez nous informer immédiatement de toute utilisation non
              autorisée de votre compte ou de toute autre violation de sécurité.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            4. Contenu utilisateur
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                4.1 Propriété du contenu
              </h3>
              <p className="text-muted-foreground">
                Vous conservez tous les droits de propriété intellectuelle sur le
                contenu que vous publiez sur FanTribe. En publiant du contenu, vous nous
                accordez une licence mondiale, non exclusive, libre de redevances pour
                utiliser, reproduire et distribuer ce contenu dans le cadre de nos
                services.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                4.2 Responsabilité du contenu
              </h3>
              <p className="mb-3 text-muted-foreground">
                Vous êtes entièrement responsable du contenu que vous publiez. Vous
                garantissez que votre contenu :
              </p>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>Ne viole aucun droit de propriété intellectuelle</li>
                <li>Ne contient pas de contenu illégal, diffamatoire ou offensant</li>
                <li>Ne contient pas de virus ou de code malveillant</li>
                <li>Respecte les lois applicables en matière de protection des mineurs</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                4.3 Contenu interdit
              </h3>
              <p className="mb-3 text-muted-foreground">Les contenus suivants sont strictement interdits :</p>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>Contenu impliquant des mineurs de quelque manière que ce soit</li>
                <li>Contenu promouvant la violence, la haine ou la discrimination</li>
                <li>Contenu frauduleux ou trompeur</li>
                <li>Spam ou contenu commercial non autorisé</li>
                <li>Contenu portant atteinte à la vie privée d&apos;autrui</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            5. Abonnements et paiements
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                5.1 Abonnements créateurs
              </h3>
              <p className="text-muted-foreground">
                Les créateurs peuvent proposer des abonnements payants pour accéder à
                leur contenu exclusif. Les prix sont fixés par les créateurs
                conformément à nos directives.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                5.2 Traitement des paiements
              </h3>
              <p className="text-muted-foreground">
                Les paiements sont traités par nos partenaires de paiement sécurisés
                (CinetPay et Stripe). En effectuant un achat, vous acceptez également
                les conditions de ces prestataires de services de paiement.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                5.3 Remboursements
              </h3>
              <p className="text-muted-foreground">
                Les abonnements sont généralement non remboursables, sauf dans les cas
                prévus par la loi ou notre politique de remboursement spécifique.
                Contactez notre support pour toute demande de remboursement.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            6. Comportement des utilisateurs
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>En utilisant FanTribe, vous vous engagez à :</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Respecter les autres utilisateurs et créateurs</li>
              <li>Ne pas harceler, intimider ou menacer quiconque</li>
              <li>Ne pas usurper l&apos;identité d&apos;une autre personne</li>
              <li>Ne pas tenter de contourner les mesures de sécurité</li>
              <li>Ne pas utiliser la plateforme à des fins illégales</li>
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            7. Propriété intellectuelle
          </h2>
          <div className="text-muted-foreground">
            <p>
              FanTribe et tout son contenu original, fonctionnalités et
              fonctionnalités sont la propriété exclusive de FanTribe et sont protégés
              par les lois internationales sur le droit d&apos;auteur, les marques et
              autres lois sur la propriété intellectuelle.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            8. Résiliation
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Nous pouvons suspendre ou résilier votre compte immédiatement, sans
              préavis ni responsabilité, pour quelque raison que ce soit, notamment
              si vous violez ces conditions d&apos;utilisation.
            </p>
            <p>
              Vous pouvez supprimer votre compte à tout moment via les paramètres de
              votre profil. La suppression de votre compte entraînera la perte de
              tout contenu et données associés.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            9. Limitation de responsabilité
          </h2>
          <div className="text-muted-foreground">
            <p>
              FanTribe est fourni &quot;tel quel&quot; sans garantie d&apos;aucune sorte. Nous
              ne serons pas responsables des dommages indirects, accessoires,
              spéciaux ou consécutifs résultant de votre utilisation de la
              plateforme.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            10. Droit applicable
          </h2>
          <div className="text-muted-foreground">
            <p>
              Ces conditions sont régies par les lois du Cameroun. Tout litige
              relatif à ces conditions sera soumis à la compétence exclusive des
              tribunaux camerounais.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border/30 bg-muted/20 p-6">
          <h2 className="mb-4 text-xl font-bold text-primary sm:text-2xl">
            11. Contact
          </h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Pour toute question concernant ces conditions d&apos;utilisation,
              veuillez nous contacter à :
            </p>
            <div className="rounded-lg bg-background/50 p-4">
              <p>
                <span className="font-medium text-foreground">Email :</span>{" "}
                <a href="mailto:support@fantribe.com" className="text-primary hover:underline">
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

export default TermsPage
