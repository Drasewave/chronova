import { ButtonLink } from "@/components/ui/button";
import { FillMe } from "@/components/ui/placeholder";
import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/components/ui/section";

export function Watchmaker() {
  return (
    <Section fond="alterne" id="l-horloger">
      <div className="grid items-start gap-12">
        <Reveal delay={60}>
          <h2 className="type-display-2 max-w-[20ch]">L&apos;horloger et son atelier</h2>

          <div className="measure mt-8 flex flex-col gap-5">
            <FillMe>
              parcours de l&apos;horloger : formation, années de métier, ce qui l&apos;a amené à
              monter ses propres montres
            </FillMe>
            <FillMe>
              parti pris de l&apos;atelier : pourquoi ces calibres, ces fournisseurs, ce refus de la
              série
            </FillMe>
            <p className="type-body-lg text-fg">
              Je ne monte aucune montre à l&apos;avance. Je commence l&apos;assemblage après votre
              commande, avec les pièces que vous avez choisies, et je le termine par
              soixante-douze heures de contrôle de marche.
            </p>
          </div>

          <dl className="mt-12 grid gap-y-8 border-t border-rule pt-8 sm:grid-cols-3 sm:gap-x-8">
            <Chiffre terme="Assemblage" valeur="À la main" detail="Pièce par pièce, à l'unité" />
            <Chiffre terme="Contrôle" valeur="72 h" detail="Marche mesurée en s/jour" />
            <Chiffre terme="Étanchéité" valeur="Testée" detail="Sous pression, avant envoi" />
          </dl>

          <ButtonLink href="/l-horloger" variant="contour" className="mt-10">
            L&apos;atelier en détail
          </ButtonLink>
        </Reveal>
      </div>
    </Section>
  );
}

function Chiffre({ terme, valeur, detail }: { terme: string; valeur: string; detail: string }) {
  return (
    <div>
      <dt className="type-mono text-fg-soft">{terme}</dt>
      <dd className="mt-3">
        <span className="type-title-1 block text-fg">{valeur}</span>
        <span className="type-caption mt-1 block text-fg-soft">{detail}</span>
      </dd>
    </div>
  );
}
