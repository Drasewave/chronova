import { ButtonLink } from "@/components/ui/button";
import { IconFleche } from "@/components/ui/icons";
import { Section } from "@/components/ui/section";

export function ClosingCta() {
  return (
    <Section fond="nuit" className="relative isolate overflow-hidden">
      <Minuterie />
      <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-mono surtitre text-onyx-soft">Prochaine étape</p>
          <h2 className="type-display-2 mt-5 max-w-[16ch] text-onyx-ink">
            Commencez par le cadran.
          </h2>
          <p className="type-lead measure mt-6 text-onyx-soft">
            Le configurateur garde votre choix dans l&apos;adresse de la page : vous pouvez le
            reprendre plus tard ou l&apos;envoyer à quelqu&apos;un avant de vous décider.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/composer">
            Composer ma montre
            <IconFleche className="fleche-glisse" />
          </ButtonLink>
          <ButtonLink href="/sur-mesure" variant="contour">
            Demander une pièce unique
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}

/**
 * Un cadran au trait, à demi hors champ : la section nuit n'est plus un aplat.
 * Décoratif, sous le texte, et assez pâle pour ne jamais gêner sa lecture.
 */
function Minuterie() {
  return (
    <svg
      viewBox="0 0 1000 1000"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute -right-[12%] top-1/2 -z-10 hidden w-[min(62vw,52rem)] -translate-y-1/2 text-accent-decor md:block"
    >
      <circle cx="500" cy="500" r="490" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="500" cy="500" r="392" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="500"
          y1={i % 5 === 0 ? 24 : 34}
          x2="500"
          y2="58"
          stroke="currentColor"
          strokeOpacity={i % 5 === 0 ? 0.85 : 0.4}
          strokeWidth={i % 5 === 0 ? 2.5 : 1}
          transform={`rotate(${i * 6} 500 500)`}
        />
      ))}
      {/* 10 h 10. */}
      <line x1="500" y1="500" x2="330" y2="402" stroke="currentColor" strokeOpacity="0.55" strokeWidth="4" />
      <line x1="500" y1="500" x2="760" y2="350" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2.5" />
      <circle cx="500" cy="500" r="9" fill="currentColor" fillOpacity="0.6" />
    </svg>
  );
}
