"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { IconChevron } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Une étape repliable. Bouton + région, avec `aria-expanded` et `aria-controls` :
 * le repli est annoncé, et la région reste dans l'ordre de tabulation naturel.
 *
 * La région reste montée : elle s'ouvre et se ferme en hauteur (`.repli`, une
 * rangée de grille de 0fr à 1fr — aucune hauteur mesurée). Fermée,
 * `visibility: hidden` la sort de la tabulation, comme le faisait `hidden`.
 *
 * À l'ouverture, si l'en-tête de l'étape est trop bas pour que ses options se
 * voient (sur téléphone, il reste peu de place entre la montre collée et la
 * barre de prix), la page remonte l'étape juste sous la zone collante. La cible
 * se calcule tout de suite : l'étape s'ouvre VERS LE BAS, son en-tête ne bouge
 * pas pendant la transition — un seul mouvement, sans correction après coup.
 */

/** Hauteur masquée en haut de la fenêtre, au droit de `section`. */
function zoneCollante(section: HTMLElement): number {
  const scene = document.querySelector<HTMLElement>("[data-scene-collante]");
  if (!scene) return 96;
  const style = getComputedStyle(scene);
  const haut = Number.parseFloat(style.top) || 0;
  if (style.position !== "sticky") return document.querySelector("header")?.getBoundingClientRect().height ?? 80;
  const a = scene.getBoundingClientRect();
  const b = section.getBoundingClientRect();
  // Sur téléphone la scène passe AU-DESSUS des options ; en colonnes, à côté.
  const auDessus = a.left < b.right && b.left < a.right;
  return haut + (auDessus ? a.height : 0);
}

function remonterSiBesoin(section: HTMLElement) {
  const masque = zoneCollante(section);
  const barre = document.querySelector<HTMLElement>("[data-barre-prix]");
  // `offsetHeight` vaut 0 quand la barre est en `display: none` (grand écran haut).
  const bas = window.innerHeight - (barre?.offsetHeight ?? 0);
  const haut = section.getBoundingClientRect().top;
  // Dans la moitié haute de la zone lisible : on ne touche à rien. (Glissé sous
  // la zone collante — atteint au clavier —, l'en-tête est ramené en vue.)
  if (haut >= masque && haut <= masque + (bas - masque) * 0.45) return;
  const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: window.scrollY + haut - masque - 12, behavior: doux ? "smooth" : "instant" });
}

export function StepSection({
  index,
  label,
  intro,
  resume,
  defaultOpen = false,
  children,
}: {
  index: number;
  label: string;
  intro: string;
  /** Résumé des choix en cours, visible quand l'étape est repliée. */
  resume: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(defaultOpen);
  const id = useId();
  const section = useRef<HTMLElement>(null);

  const basculer = () => {
    const suivant = !ouvert;
    setOuvert(suivant);
    const noeud = section.current;
    if (suivant && noeud) requestAnimationFrame(() => remonterSiBesoin(noeud));
  };

  return (
    <section ref={section} className="border-b border-rule">
      <h2>
        <button
          type="button"
          onClick={basculer}
          aria-expanded={ouvert}
          aria-controls={id}
          className="flex w-full items-center gap-4 py-5 text-left"
        >
          <span className="type-mono shrink-0 text-accent-ink">{String(index).padStart(2, "0")}</span>
          <span className="min-w-0 flex-1">
            <span className="type-title-2 block text-fg">{label}</span>
            {!ouvert && resume && (
              <span className="type-caption mt-1 block truncate text-fg-soft">{resume}</span>
            )}
          </span>
          <IconChevron
            className={cn(
              "shrink-0 text-accent-ink transition-transform duration-(--d-base) ease-atelier",
              ouvert && "rotate-180",
            )}
            width={22}
            height={22}
          />
        </button>
      </h2>

      <div id={id} data-ouvert={ouvert} className="repli">
        <div className="pb-8">
          <p className="type-body measure mb-7 text-fg-soft">{intro}</p>
          <div className="flex flex-col gap-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
