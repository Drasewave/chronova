"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";
import { ButtonLink } from "@/components/ui/button";
import { IconChevron, IconCompte, IconCroix, IconMenu, IconPanier } from "@/components/ui/icons";
import { Wordmark } from "@/components/layout/wordmark";
import { NAV_PRINCIPALE, type EntreeNav } from "@/lib/navigation";
import { useCart } from "@/lib/panier/cart";
import { cn } from "@/lib/utils";

export function Header() {
  const [ouvert, setOuvert] = useState(false);
  const [defile, setDefile] = useState(false);
  const chemin = usePathname();
  // Une page de gamme s'ouvre sur une scène nuit : on part de cet état dès le
  // rendu serveur, pour ne pas voir l'en-tête clair virer au sombre au
  // chargement. La mesure ci-dessous corrige aussitôt si la page est autre.
  const [surNuit, setSurNuit] = useState(() => chemin.startsWith("/gammes/"));
  const panier = useCart();

  // Sur l'accueil, l'en-tête flotte sur la scène nuit du héros tant que la page
  // n'a pas défilé : il en prend le thème, sans fond.
  const surScene = chemin === "/" && !defile && !ouvert;
  // Plus bas, il suit le thème de la section qui passe dessous : un en-tête
  // clair posé sur une scène nuit couperait la page en deux palettes.
  const nuit = surScene || (surNuit && !ouvert);

  useEffect(() => setOuvert(false), [chemin]);

  useEffect(() => {
    const onScroll = () => {
      setDefile(window.scrollY > 12);
      // Ce qui se trouve juste sous le bord bas de l'en-tête.
      // On ne regarde que le contenu de la page : le panneau des gammes, lui
      // aussi sous l'en-tête quand il est ouvert, ne doit pas fausser la mesure.
      const dessous = document
        .elementsFromPoint(window.innerWidth / 2, 88)
        .find((element) => element.closest("main"));
      setSurNuit(Boolean(dessous?.closest('main [data-theme="night"]')));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chemin]);

  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  return (
    <>
    <header
      // L'en-tête ne bouge pas pendant une transition de page : c'est le seul
      // point fixe qui dit au lecteur que le contenu a changé, pas l'écran.
      // La gouttière est portée par l'en-tête lui-même, comme par chaque section :
      // le logo s'aligne ainsi sur le bord gauche des contenus.
      style={{ viewTransitionName: "entete-site", paddingInline: "var(--gutter)" }}
      data-theme={nuit ? "night" : undefined}
      className={cn(
        "sticky top-0 z-40 text-fg transition-[border-color,background-color,color] duration-(--d-slow) ease-atelier",
        // Le voile ne vaut que menu fermé : ouvert, le panneau mobile doit
        // reposer sur un fond plein.
        surScene
          ? "border-b border-transparent bg-transparent"
          : defile && !ouvert
            ? "entete-voile border-b border-rule"
            : "border-b border-transparent bg-bg",
      )}
    >
      <div
        className="mx-auto flex h-16 max-w-wide items-center justify-between gap-6 md:h-20"
      >
        <Wordmark />

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-10">
            {NAV_PRINCIPALE.map((lien) =>
              lien.sousLiens ? (
                <EntreeAvecPanneau key={lien.href} lien={lien} chemin={chemin} />
              ) : (
                <li key={lien.href}>
                  <Link
                    href={lien.href}
                    aria-current={estActif(lien, chemin) ? "page" : undefined}
                    className={cn(
                      "type-ui link-underline py-2 transition-colors duration-(--d-fast) ease-atelier",
                      estActif(lien, chemin) ? "text-accent-ink" : "text-fg hover:text-accent-ink",
                    )}
                  >
                    {lien.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          <Link
            href="/compte"
            className="inline-flex size-11 items-center justify-center rounded-pill text-fg transition-colors duration-(--d-fast) ease-atelier hover:text-accent-ink"
            aria-label="Mon compte"
          >
            <IconCompte />
          </Link>
          <button
            type="button"
            onClick={panier.open}
            className="relative inline-flex size-11 items-center justify-center rounded-pill text-fg transition-colors duration-(--d-fast) ease-atelier hover:text-accent-ink"
            aria-label={
              panier.count === 0
                ? "Panier, vide"
                : `Panier, ${panier.count} montre${panier.count > 1 ? "s" : ""}`
            }
          >
            <IconPanier />
            {panier.count > 0 && (
              /* 13 px, le plancher typographique du projet : la pastille
                 s'agrandit plutôt que le texte ne rétrécisse. */
              <span
                aria-hidden="true"
                className="type-mono absolute -right-0.5 top-0.5 grid size-5 place-items-center rounded-pill bg-accent text-on-accent"
              >
                {panier.count}
              </span>
            )}
          </button>
          <ButtonLink href="/composer" className="ml-2 hidden md:inline-flex" size="sm">
            Composer ma montre
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            aria-expanded={ouvert}
            aria-controls="menu-mobile"
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            className="inline-flex size-11 items-center justify-center text-fg lg:hidden"
          >
            {ouvert ? <IconCroix /> : <IconMenu />}
          </button>
        </div>
      </div>

    </header>

      {/* Tiroir mobile : pleine hauteur, cibles de 44 px. Les gammes sont
          dépliées d'office sous « Collection » : rien à ouvrir pour les voir.
          Il vit À CÔTÉ de l'en-tête, pas dedans : le voile de l'en-tête
          (`backdrop-filter`) deviendrait son bloc conteneur et l'écraserait
          pendant qu'il se referme. Toujours monté, il entre et sort en fondu
          (`.volet`) ; fermé, `visibility` le retire de la tabulation. */}
      <div
        id="menu-mobile"
        data-ouvert={ouvert}
        style={{ "--volet-y": "0px" } as CSSProperties}
        className="volet fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-rule bg-bg md:top-20 lg:hidden"
      >
        <nav aria-label="Navigation principale (mobile)" className="volet-contenu" style={{ padding: "var(--gutter)" }}>
          <ul className="flex flex-col">
            {NAV_PRINCIPALE.map((lien) => (
              <li key={lien.href} className="border-b border-rule">
                <Link href={lien.href} className="type-title-2 block py-5 text-fg">
                  {lien.label}
                </Link>
                {lien.sousLiens && (
                  <ul aria-label={`${lien.label} : les gammes`} className="-mt-2 grid grid-cols-2 gap-x-6 pb-4">
                    {lien.sousLiens.map((sousLien) => (
                      <li key={sousLien.href}>
                        <Link
                          href={sousLien.href}
                          aria-current={chemin === sousLien.href ? "page" : undefined}
                          className={cn(
                            "type-body flex min-h-11 items-center",
                            chemin === sousLien.href ? "text-accent-ink" : "text-fg-soft",
                          )}
                        >
                          {sousLien.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <ButtonLink href="/composer" className="mt-8 w-full">
            Composer ma montre
          </ButtonLink>
        </nav>
      </div>
    </>
  );
}

/** Une entrée est active sur sa page, ses sous-pages et celles de ses sous-entrées. */
function estActif(lien: EntreeNav, chemin: string): boolean {
  if (chemin.startsWith(lien.href)) return true;
  return (lien.sousLiens ?? []).some((sousLien) => chemin === sousLien.href);
}

/**
 * Entrée de navigation à panneau (« Collection » et ses gammes).
 *
 * Le lien reste un lien : on va toujours à la page Collection d'un clic. Le
 * panneau s'ouvre au survol de la souris et quand le focus clavier entre dans
 * l'entrée ; le bouton à chevron le commande aussi, pour le tactile et les
 * lecteurs d'écran. Il se ferme quand la souris ou le focus s'en va, et sur
 * Échap, qui rend le focus au bouton. Aucun piège : Tab traverse le panneau et
 * poursuit vers l'entrée suivante.
 */
function EntreeAvecPanneau({ lien, chemin }: { lien: EntreeNav; chemin: string }) {
  const [deplie, setDeplie] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);
  const delai = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retourFocus = useRef(false);
  const idPanneau = "panneau-gammes";
  const actif = estActif(lien, chemin);

  const annulerFermeture = () => {
    if (delai.current) clearTimeout(delai.current);
    delai.current = null;
  };

  useEffect(() => setDeplie(false), [chemin]);
  useEffect(() => annulerFermeture, []);

  // Le survol ne vaut que pour une souris : au doigt, l'événement précède le
  // clic et rouvrirait le panneau que le bouton vient de fermer.
  const surEntree = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    annulerFermeture();
    setDeplie(true);
  };
  const surSortie = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    annulerFermeture();
    // Un court délai pardonne une trajectoire de souris en diagonale.
    delai.current = setTimeout(() => setDeplie(false), 140);
  };
  const surFocus = (event: FocusEvent) => {
    // Le focus rendu au bouton par Échap ne doit pas rouvrir ce qu'on ferme.
    if (retourFocus.current) {
      retourFocus.current = false;
      return;
    }
    if (event.target.matches(":focus-visible")) setDeplie(true);
  };
  const surPerteFocus = (event: FocusEvent<HTMLLIElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setDeplie(false);
  };
  const surTouche = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key !== "Escape" || !deplie) return;
    event.stopPropagation();
    setDeplie(false);
    if (event.currentTarget.contains(document.activeElement) && document.activeElement !== bouton.current) {
      retourFocus.current = true;
      bouton.current?.focus();
    }
  };

  return (
    <li
      className="relative flex items-center"
      onPointerEnter={surEntree}
      onPointerLeave={surSortie}
      onFocus={surFocus}
      onBlur={surPerteFocus}
      onKeyDown={surTouche}
    >
      <Link
        href={lien.href}
        aria-current={actif ? "page" : undefined}
        className={cn(
          "type-ui link-underline py-2 transition-colors duration-(--d-fast) ease-atelier",
          actif ? "text-accent-ink" : "text-fg hover:text-accent-ink",
        )}
      >
        {lien.label}
      </Link>
      <button
        ref={bouton}
        type="button"
        aria-expanded={deplie}
        aria-controls={idPanneau}
        aria-label={`${lien.label} : afficher les gammes`}
        onClick={() => setDeplie((valeur) => !valeur)}
        className="-ml-1.5 -mr-3 inline-flex size-11 items-center justify-center rounded-pill text-fg transition-colors duration-(--d-fast) ease-atelier hover:text-accent-ink"
      >
        <IconChevron
          width="16"
          height="16"
          className={cn("transition-transform duration-(--d-base) ease-atelier", deplie && "rotate-180")}
        />
      </button>

      {/* Le retrait haut fait partie de la zone survolée : la souris passe du
          lien au panneau sans jamais sortir de l'entrée. */}
      {/* Toujours monté : il entre et sort en fondu glissé (`.volet`). Fermé,
          `visibility: hidden` le retire de la tabulation comme le faisait `hidden`. */}
      <div id={idPanneau} data-ouvert={deplie} className="volet absolute left-0 top-full z-50 -ml-5 pt-2">
        <ul className="w-64 rounded-card border border-rule bg-panel p-2 text-fg">
          {(lien.sousLiens ?? []).map((sousLien, index, tous) => (
            <li key={sousLien.href} className={cn(index === tous.length - 1 && "mt-2 border-t border-rule pt-2")}>
              <Link
                href={sousLien.href}
                aria-current={chemin === sousLien.href ? "page" : undefined}
                onClick={() => setDeplie(false)}
                className={cn(
                  "type-ui flex min-h-11 items-center rounded-field px-3 transition-colors duration-(--d-fast) ease-atelier hover:bg-bg-alt hover:text-accent-ink",
                  chemin === sousLien.href ? "text-accent-ink" : "text-fg",
                )}
              >
                {sousLien.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
