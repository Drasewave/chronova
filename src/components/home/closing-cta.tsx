import { ButtonLink } from "@/components/ui/button";
import { IconFleche } from "@/components/ui/icons";
import { WatchSvg } from "@/watch/watch-svg";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import type { Catalogue } from "@/lib/configurateur/catalogue";
import type { WatchModelView } from "@/lib/data/models";

/**
 * Dernière scène : une autre pièce de la collection, à demi hors champ, comme
 * un second plan de studio. Elle rappelle que le cadran bleu du héros n'était
 * qu'un point de départ.
 */
export function ClosingCta({ catalogue, modele }: { catalogue: Catalogue; modele: WatchModelView }) {
  const { render } = defaultConfiguration(catalogue, modele);

  return (
    <section
      data-theme="night"
      className="scene-nuit relative isolate overflow-hidden text-fg"
      style={{ paddingInline: "var(--gutter)", paddingBlock: "var(--section-y)" }}
    >
      <div className="mx-auto grid max-w-wide items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div>
          <h2 className="type-display-1 max-w-[12ch]">Composez votre montre</h2>
          <p className="type-lead measure mt-7 max-w-[46ch] text-fg-soft">
            Votre configuration est enregistrée dans l&apos;adresse de la page. Vous pouvez la
            reprendre plus tard, ou envoyer le lien à quelqu&apos;un avant de vous décider.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href="/composer">
              Composer ma montre
              <IconFleche className="fleche-glisse" />
            </ButtonLink>
            <ButtonLink href="/sur-mesure" variant="contour">
              Demander une pièce unique
            </ButtonLink>
          </div>
        </div>

        <div className="pointer-events-none relative -mb-[30%] hidden lg:block" aria-hidden="true">
          <WatchSvg id="cloture" render={render} label="" className="h-auto w-full -rotate-12" />
        </div>
      </div>
    </section>
  );
}
