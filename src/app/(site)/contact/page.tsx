import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireDemande } from "@/components/formulaires/formulaire-demande";
import { FillMe } from "@/components/ui/placeholder";
import { Section } from "@/components/ui/section";
import { lireIdentiteLegale } from "@/lib/content/legal";

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

export const revalidate = 86400;

export default async function Contact() {
  const identite = await lireIdentiteLegale();

  return (
    <Section fond="papier">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <h1 className="type-display-2">Écrire à l&apos;atelier</h1>
          <p className="type-lead measure mt-6 text-fg-soft">
            Je lis chaque message et j&apos;y réponds moi-même.
          </p>

          <dl className="mt-12 flex flex-col gap-8">
            <div>
              <dt className="type-mono text-fg-soft">Délai de réponse</dt>
              <dd className="type-body mt-2 text-fg">
                Un à deux jours ouvrés. Sans réponse au-delà, réécrivez-moi : votre message
                m&apos;a échappé.
              </dd>
            </div>
            <div>
              <dt className="type-mono text-fg-soft">L&apos;atelier</dt>
              <dd className="mt-2 flex flex-col gap-3">
                {identite.adresse ? (
                  <span className="type-body whitespace-pre-line text-fg">{identite.adresse}</span>
                ) : (
                  <FillMe>adresse de l&apos;atelier</FillMe>
                )}
                {identite.telephone ? (
                  <span className="type-body text-fg" data-numeric>
                    {identite.telephone}
                  </span>
                ) : (
                  <FillMe>téléphone</FillMe>
                )}
                {identite.email ? (
                  <a
                    href={`mailto:${identite.email}`}
                    className="type-body link-underline self-start text-accent-ink"
                  >
                    {identite.email}
                  </a>
                ) : (
                  <FillMe>adresse e-mail de contact</FillMe>
                )}
              </dd>
            </div>
            <div>
              <dt className="type-mono text-fg-soft">Une montre sur mesure ?</dt>
              <dd className="type-body mt-2 text-fg-soft">
                Pour une pièce qui sort du configurateur, passez plutôt par{" "}
                <Link href="/sur-mesure" className="link-underline text-accent-ink">
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
