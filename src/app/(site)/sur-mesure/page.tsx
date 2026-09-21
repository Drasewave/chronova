import type { Metadata } from "next";
import { FormulaireDemande } from "@/components/formulaires/formulaire-demande";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Demander une pièce unique",
  description:
    "Une montre qui sort du configurateur : cadran particulier, gravure, pièce fournie, projet à deux. Décrivez votre projet, l'horloger vous répond avec un devis.",
  alternates: { canonical: "/sur-mesure" },
};

const ETAPES = [
  {
    numero: "01",
    titre: "Vous décrivez",
    texte:
      "Dites-moi l'usage, le style, ce qui vous plaît et ce dont vous ne voulez pas. Une photo d'inspiration m'en apprend souvent plus qu'un long texte.",
  },
  {
    numero: "02",
    titre: "Je cherche ce qui existe",
    texte:
      "Je réponds à beaucoup de demandes avec des pièces de catalogue que je n'ai pas encore référencées. C'est plus rapide et moins cher qu'une fabrication.",
  },
  {
    numero: "03",
    titre: "Devis, puis décision",
    texte:
      "Je vous envoie un devis chiffré avec les pièces, le délai et ce qui reste incertain. Vous ne vous engagez à rien tant que vous ne l'avez pas accepté.",
  },
];

export default function SurMesure() {
  return (
    <>
      <Section fond="papier" compact>
        <header className="measure">
          <h1 className="type-display-2">Demander une pièce unique</h1>
          <p className="type-lead mt-6 text-fg-soft">
            Le configurateur propose ce que je sais monter à coup sûr. Pour le reste (un cadran
            particulier, une gravure ambitieuse, une pièce que vous fournissez, une montre faite
            pour une occasion), écrivez-moi et nous en parlons.
          </p>
        </header>
      </Section>

      <Section fond="alterne" compact>
        <ol className="grid gap-px bg-rule lg:grid-cols-3">
          {ETAPES.map((etape) => (
            <li key={etape.numero} className="bg-bg-alt p-7">
              <span className="type-mono text-accent-ink">{etape.numero}</span>
              <h2 className="type-title-2 mt-5">{etape.titre}</h2>
              <p className="type-body mt-3 text-fg-soft">{etape.texte}</p>
            </li>
          ))}
        </ol>

        <p className="type-body measure mt-10 text-fg-soft">
          Une montre sur mesure prend plus de temps qu&apos;une montre composée, et son prix dépend
          des pièces que je trouve. Le devis indique l&apos;un et l&apos;autre avant que vous ne
          décidiez.
        </p>
      </Section>

      <Section fond="papier">
        <div className="mx-auto max-w-[46rem] rounded-card border border-rule bg-panel p-7 sm:p-10">
          <h2 className="type-title-1">Votre projet</h2>
          <p className="type-body mt-3 text-fg-soft">
            Indiquez ce que vous savez déjà. Nous déciderons du reste ensemble.
          </p>
          <div className="mt-8">
            <FormulaireDemande type="SUR_MESURE" avecBudget configurationInitiale="" />
          </div>
        </div>
      </Section>
    </>
  );
}
