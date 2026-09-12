import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireDemande } from "@/components/formulaires/formulaire-demande";
import { FillMe } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Écrire à l'atelier Chronova : questions sur une montre, une commande en cours, une révision ou une demande particulière.",
  alternates: { canonical: "/contact" },
};

const SUJETS = [
  "Question avant commande",
  "Commande en cours",
  "Entretien ou révision",
  "Problème sur une montre",
  "Autre",
];

export default function Contact() {
  return (
    <Section fond="papier">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <p className="type-mono text-fg-soft">Écrire à l&apos;atelier</p>
          <h1 className="type-display-2 mt-4">Contact</h1>
          <p className="type-lead measure mt-6 text-fg-soft">
            C&apos;est l&apos;horloger qui lit et qui répond. Il n&apos;y a ni formulaire trié par
            un robot, ni numéro de ticket.
          </p>

          <dl className="mt-12 flex flex-col gap-8">
            <div>
              <dt className="type-mono text-fg-soft">Délai de réponse</dt>
              <dd className="type-body mt-2 text-fg">
                Un à deux jours ouvrés. Au-delà, votre message est passé à côté : réécrivez sans
                hésiter.
              </dd>
            </div>
            <div>
              <dt className="type-mono text-fg-soft">L&apos;atelier</dt>
              <dd className="mt-2 flex flex-col gap-3">
                <FillMe>adresse de l&apos;atelier</FillMe>
                <FillMe>téléphone et horaires</FillMe>
                <FillMe>adresse e-mail de contact</FillMe>
              </dd>
            </div>
            <div>
              <dt className="type-mono text-fg-soft">Une montre sur mesure ?</dt>
              <dd className="type-body mt-2 text-fg-soft">
                Pour une pièce qui sort du configurateur, passez plutôt par{" "}
                <Link href="/sur-mesure" className="link-underline text-accent">
                  la demande de pièce unique
                </Link>{" "}
                : le formulaire est fait pour ça.
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-card border border-rule bg-panel p-7 sm:p-9">
          <FormulaireDemande type="CONTACT" sujets={SUJETS} />
        </div>
      </div>
    </Section>
  );
}
