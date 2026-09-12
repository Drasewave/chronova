"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { seDeconnecter } from "@/app/actions/auth";
import { BasculeTheme } from "@/components/atelier/bascule-theme";
import { RechercheGlobale } from "@/components/atelier/recherche-globale";
import { IconCroix, IconMenu } from "@/components/ui/icons";
import { NAV_CRM } from "@/lib/atelier/navigation";
import { ecrireThemeCookie, type ThemeAtelier } from "@/lib/atelier/theme";
import { cn } from "@/lib/utils";

/**
 * Coquille du CRM.
 *
 * Dense mais calme : filets de 1 px, aucune ombre, un seul accent. Les cibles
 * font 44 px, parce que l'outil sert aussi sur une tablette posée à l'établi,
 * avec les doigts.
 */
export function CrmShell({
  nom,
  theme: themeInitial,
  children,
}: {
  nom: string;
  theme: ThemeAtelier;
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [theme, setTheme] = useState<ThemeAtelier>(themeInitial);
  const chemin = usePathname();

  const changerTheme = (suivant: ThemeAtelier) => {
    setTheme(suivant);
    ecrireThemeCookie(suivant);
  };

  return (
    <div data-theme={theme} className="min-h-dvh bg-bg text-fg">
      <a href="#contenu-atelier" className="skip-link">
        Aller au contenu
      </a>

      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Barre latérale */}
        <aside
          className={cn(
            "border-rule bg-bg-alt lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-r",
            ouvert ? "fixed inset-0 z-50 overflow-y-auto" : "hidden lg:block",
          )}
        >
          <div className="flex items-center justify-between p-5 pb-6">
            <Link
              href="/atelier"
              className="text-[1.05rem] leading-none text-fg"
              style={{ fontFamily: "var(--font-title)", letterSpacing: "0.2em" }}
            >
              CHRONOVA
            </Link>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="inline-flex size-11 items-center justify-center text-fg-soft lg:hidden"
              aria-label="Fermer le menu"
            >
              <IconCroix />
            </button>
          </div>

          <nav aria-label="Navigation de l'atelier" className="pb-8">
            {NAV_CRM.map((groupe) => (
              <div key={groupe.titre} className="mt-6 first:mt-0">
                <p className="type-mono px-5 pb-2 text-fg-soft">{groupe.titre}</p>
                <ul>
                  {groupe.entrees.map((entree) => {
                    const actif =
                      entree.href === "/atelier"
                        ? chemin === entree.href
                        : chemin.startsWith(entree.href);
                    return (
                      <li key={entree.href}>
                        <Link
                          href={entree.href}
                          onClick={() => setOuvert(false)}
                          aria-current={actif ? "page" : undefined}
                          className={cn(
                            "flex min-h-11 flex-col justify-center border-l-2 px-5 py-2 transition-colors duration-200",
                            actif
                              ? "border-accent bg-bg text-accent"
                              : "border-transparent text-fg hover:text-accent",
                          )}
                        >
                          <span className="type-ui">{entree.label}</span>
                          <span className="type-caption text-fg-soft">{entree.aide}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-rule p-5">
            <p className="type-caption text-fg-soft">Connecté</p>
            <p className="type-ui mt-1 break-words text-fg">{nom}</p>
            <div className="mt-4">
              <BasculeTheme theme={theme} onChange={changerTheme} />
            </div>
            <form action={seDeconnecter} className="mt-4">
              <button type="submit" className="type-caption link-underline text-fg-soft hover:text-alert">
                Se déconnecter
              </button>
            </form>
            <Link href="/" className="type-caption link-underline mt-3 block text-fg-soft hover:text-accent">
              Voir le site public
            </Link>
          </div>
        </aside>

        {/* Contenu */}
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-rule bg-bg px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setOuvert(true)}
              className="inline-flex size-11 items-center justify-center text-fg lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <IconMenu />
            </button>
            <RechercheGlobale />
          </header>

          <main id="contenu-atelier" className="px-4 py-8 sm:px-6 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
