import type { Metadata } from "next";
import { FormulaireDemande } from "@/components/formulaires/formulaire-demande";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Demander une pièce unique",
  description:
    "Une montre qui sort du configurateur : cadran particulier, gravure, pièce fournie, projet à deux. Décrivez, l'atelier répond avec un devis.",
  alternates: { canonical: "/sur-mesure" },
};

const ETAPES = [
  {
    numero: "01",
    titre: "Vous décrivez",
    texte:
      "L'usage, le style, ce qui vous plaît et ce que vous ne voulez surtout pas. Une photo d'inspiration vaut souvent trois paragraphes.",
  },
  {
    numero: "02",
    titre: "Je cherche ce qui existe",
    texte:
      "Beaucoup de demandes se résolvent avec des pièces de catalogue que je n'ai pas encore référencées. C'est plus rapide et bien moins cher qu'une fabrication.",
  },
  {
    numero: "03",
    titre: "Devis, puis décision",
    texte:
      "Vous recevez un devis chiffré avec les pièces, le délai et ce qui reste incertain. Rien n'est engagé tant que vous ne l'acceptez pas.",
  },
];

export default function SurMesure() {
  return (
    <>
      <Section fond="papier" compact>
        <header className="measure">
          <p className="type-mono text-fg-soft">Hors configurateur</p>
          <h1 className="type-display-2 mt-4">Demander une pièce unique</h1>
          <p className="type-lead mt-6 text-fg-soft">
            Le configurateur couvre ce que l&apos;atelier sait monter à coup sûr. Pour le reste — un
            cadran particulier, une gravure ambitieuse, une pièce que vous fournissez, une montre
            faite pour une occasion — il faut en parler.
          </p>
        </header>
      </Section>

      <Section fond="alterne" compact>
        <ol className="grid gap-px bg-rule lg:grid-cols-3">
          {ETAPES.map((etape) => (
            <li key={etape.numero} className="bg-bg-alt p-7">
              <span className="type-mono text-accent">{etape.numero}</span>
              <h2 className="type-title-2 mt-5">{etape.titre}</h2>
              <p className="type-body mt-3 text-fg-soft">{etape.texte}</p>
            </li>
          ))}
        </ol>

        <p className="type-body measure mt-10 text-fg-soft">
          Une précision utile : une montre sur mesure prend plus de temps qu&apos;une montre
          composée, et son prix dépend entièrement des pièces trouvées. Le devis le dit clairement,
          et il n&apos;y a pas de mauvaise surprise après.
        </p>
      </Section>

      <Section fond="papier">
        <div className="mx-auto max-w-[46rem] rounded-card border border-rule bg-panel p-7 sm:p-10">
          <h2 className="type-title-1">Votre projet</h2>
          <p className="type-body mt-3 text-fg-soft">
            Tout ce que vous savez déjà est utile ; tout ce que vous ignorez encore se décidera
            ensemble.
          </p>
          <div className="mt-8">
            <FormulaireDemande type="SUR_MESURE" avecBudget configurationInitiale="" />
          </div>
        </div>
      </Section>
    </>
  );
}
