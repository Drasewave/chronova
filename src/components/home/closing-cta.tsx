import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export function ClosingCta() {
  return (
    <Section fond="nuit">
      <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-mono text-night-soft">Prochaine étape</p>
          <h2 className="type-display-2 mt-4 max-w-[16ch] text-night-ink">
            Commencez par le cadran.
          </h2>
          <p className="type-lead measure mt-6 text-night-soft">
            Le configurateur garde votre choix dans l&apos;adresse de la page : vous pouvez le
            reprendre plus tard ou l&apos;envoyer à quelqu&apos;un avant de vous décider.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/composer">Composer ma montre</ButtonLink>
          <ButtonLink href="/sur-mesure" variant="contour">
            Demander une pièce unique
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
