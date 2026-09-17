import { ButtonLink } from "@/components/ui/button";
import { PhotoPlaceholder, FillMe } from "@/components/ui/placeholder";
import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/components/ui/section";

export function Watchmaker() {
  return (
    <Section fond="alterne" id="l-horloger">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <Reveal className="flex flex-col gap-5">
          <PhotoPlaceholder
            description="portrait à l'établi, lumière naturelle, loupe d'horloger relevée"
            ratio="4 / 5"
          />
          <PhotoPlaceholder
            description="plan large de l'établi : tapis vert, brucelles, boîtes à pièces"
            ratio="16 / 10"
          />
        </Reveal>

        <Reveal delay={60}>
          <p className="type-mono text-fg-soft">L&apos;horloger</p>
          <h2 className="type-display-2 mt-3 max-w-[20ch]">Une paire de mains, un établi.</h2>

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
              Ce que vous pouvez déjà savoir : aucune montre n&apos;est montée à l&apos;avance.
              L&apos;assemblage commence après votre commande, avec les pièces que vous avez
              choisies, et se termine par soixante-douze heures de contrôle de marche.
            </p>
          </div>

          <dl className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-3">
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
    <div className="bg-bg-alt p-5">
      <dt className="type-mono text-fg-soft">{terme}</dt>
      <dd className="mt-3">
        <span className="type-title-2 block text-fg">{valeur}</span>
        <span className="type-caption mt-1 block text-fg-soft">{detail}</span>
      </dd>
    </div>
  );
}
