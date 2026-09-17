import { Reveal } from "@/components/motion/reveal";
import { Section, SectionHeader } from "@/components/ui/section";
import { IconColis, IconEtancheite, IconMouvement, IconTournevis } from "@/components/ui/icons";
import { ETAPES } from "@/lib/content/home";

const ICONES = {
  mouvement: IconMouvement,
  colis: IconColis,
  tournevis: IconTournevis,
  etancheite: IconEtancheite,
} as const;

export function Process() {
  return (
    <Section fond="papier" id="comment-ca-marche">
      <SectionHeader
        surtitre="De votre écran à votre poignet"
        titre="Comment ça se passe"
        intro="Quatre étapes, sans intermédiaire. Vous savez à tout moment où en est votre montre : chaque changement d'étape vous est notifié et reste consultable depuis votre compte."
      />

      <ol className="mt-16 grid gap-px bg-rule md:grid-cols-2 xl:grid-cols-4">
        {ETAPES.map((etape, index) => {
          const Icone = ICONES[etape.icone];
          return (
            <Reveal as="li" key={etape.numero} delay={index * 60} className="bg-bg p-7 xl:p-8">
              <div className="flex items-center justify-between">
                <span className="type-mono text-accent">{etape.numero}</span>
                <Icone className="text-accent-decor" width={26} height={26} />
              </div>
              <h3 className="type-title-2 mt-6">{etape.titre}</h3>
              <p className="type-body mt-3 text-fg-soft">{etape.texte}</p>
            </Reveal>
          );
        })}
      </ol>
    </Section>
  );
}
