import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FillMe } from "@/components/ui/placeholder";
import { Wordmark } from "@/components/layout/wordmark";
import { NAV_PIED } from "@/lib/navigation";

const COLONNES = [
  { titre: "La maison", liens: NAV_PIED.maison },
  { titre: "Aide", liens: NAV_PIED.aide },
  { titre: "Informations", liens: NAV_PIED.legal },
];

export function Footer() {
  return (
    <footer className="border-t border-rule bg-bg-alt" style={{ paddingInline: "var(--gutter)" }}>
      <div className="mx-auto max-w-content" style={{ paddingBlock: "clamp(48px, 6vw, 88px)" }}>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Wordmark />
            <p className="type-body measure mt-6 text-fg-soft">
              Une lettre occasionnelle : les montres en cours d&apos;assemblage, les pièces qui
              arrivent, les coloris qui s&apos;arrêtent. Quelques envois par an, désinscription en un
              clic, aucune adresse transmise à qui que ce soit.
            </p>

            <form className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="pied-email" className="sr-only">
                  Votre adresse e-mail
                </label>
                <input
                  id="pied-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="prenom@exemple.fr"
                  className="type-ui h-11 w-full rounded-field border border-rule bg-panel px-4 text-fg placeholder:text-fg-soft"
                />
              </div>
              <Button type="submit" variant="contour" className="shrink-0">
                S&apos;inscrire
              </Button>
            </form>
            <p className="type-caption mt-3 text-fg-soft">
              Votre adresse sert uniquement à l&apos;envoi de cette lettre. Vous pouvez demander sa
              suppression à tout moment.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {COLONNES.map((colonne) => (
              <nav key={colonne.titre} aria-label={colonne.titre}>
                <h2 className="type-mono mb-5 text-fg-soft">{colonne.titre}</h2>
                <ul className="flex flex-col gap-3">
                  {colonne.liens.map((lien) => (
                    <li key={lien.href}>
                      <Link
                        href={lien.href}
                        className="type-body link-underline text-fg transition-colors duration-200 hover:text-accent"
                      >
                        {lien.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <hr className="my-12 border-rule" />

        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="type-mono text-fg-soft">L&apos;atelier</h2>
            <FillMe>adresse de l&apos;atelier</FillMe>
            <FillMe>téléphone et horaires d&apos;ouverture</FillMe>
            <FillMe>adresse e-mail de contact</FillMe>
          </div>
          <div className="flex flex-col gap-3 md:items-end md:text-right">
            <h2 className="type-mono text-fg-soft">Mentions</h2>
            <FillMe>raison sociale, SIRET, TVA intracommunautaire</FillMe>
            <p className="type-caption text-fg-soft">
              © {new Date().getFullYear()} Chronova. Montres assemblées à la main en France.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
