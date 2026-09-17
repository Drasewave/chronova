"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { IconCompte, IconCroix, IconMenu, IconPanier } from "@/components/ui/icons";
import { Wordmark } from "@/components/layout/wordmark";
import { NAV_PRINCIPALE } from "@/lib/navigation";
import { useCart } from "@/lib/panier/cart";
import { cn } from "@/lib/utils";

export function Header() {
  const [ouvert, setOuvert] = useState(false);
  const [defile, setDefile] = useState(false);
  const chemin = usePathname();
  const panier = useCart();

  useEffect(() => setOuvert(false), [chemin]);

  useEffect(() => {
    const onScroll = () => setDefile(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  return (
    <header
      // L'en-tête ne bouge pas pendant une transition de page : c'est le seul
      // point fixe qui dit au lecteur que le contenu a changé, pas l'écran.
      style={{ viewTransitionName: "entete-site" }}
      className={cn(
        "sticky top-0 z-40 bg-bg transition-[border-color] duration-300",
        defile ? "border-b border-rule" : "border-b border-transparent",
      )}
    >
      <div
        className="mx-auto flex h-16 max-w-wide items-center justify-between gap-6 md:h-20"
        style={{ paddingInline: "var(--gutter)" }}
      >
        <Wordmark />

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV_PRINCIPALE.map((lien) => (
              <li key={lien.href}>
                <Link
                  href={lien.href}
                  aria-current={chemin.startsWith(lien.href) ? "page" : undefined}
                  className={cn(
                    "type-ui link-underline py-2 transition-colors duration-200",
                    chemin.startsWith(lien.href) ? "text-accent" : "text-fg hover:text-accent",
                  )}
                >
                  {lien.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          <Link
            href="/compte"
            className="inline-flex size-11 items-center justify-center text-fg transition-colors duration-200 hover:text-accent"
            aria-label="Mon compte"
          >
            <IconCompte />
          </Link>
          <button
            type="button"
            onClick={panier.open}
            className="relative inline-flex size-11 items-center justify-center text-fg transition-colors duration-200 hover:text-accent"
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

      {/* Tiroir mobile : pleine hauteur, cibles de 44 px, un seul niveau. */}
      <div
        id="menu-mobile"
        hidden={!ouvert}
        className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-rule bg-bg md:top-20 lg:hidden"
      >
        <nav aria-label="Navigation principale (mobile)" style={{ padding: "var(--gutter)" }}>
          <ul className="flex flex-col">
            {NAV_PRINCIPALE.map((lien) => (
              <li key={lien.href} className="border-b border-rule">
                <Link href={lien.href} className="type-title-2 block py-5 text-fg">
                  {lien.label}
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/composer" className="mt-8 w-full">
            Composer ma montre
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
