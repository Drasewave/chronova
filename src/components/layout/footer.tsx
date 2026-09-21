import Link from "next/link";
import { FillMe } from "@/components/ui/placeholder";
import { Wordmark } from "@/components/layout/wordmark";
import { lireIdentiteLegale, mediateurChoisi } from "@/lib/content/legal";
import { NAV_PIED } from "@/lib/navigation";

const COLONNES = [
  { titre: "Gammes", liens: NAV_PIED.gammes },
  { titre: "La maison", liens: NAV_PIED.maison },
  { titre: "Aide", liens: NAV_PIED.aide },
  { titre: "Informations", liens: NAV_PIED.legal },
];

/**
 * Pied de page, identique sur toutes les pages (gabarit du site et 404).
 *
 * L'identité affichée vient du même réglage que les mentions légales et les
 * CGV : nom, adresse et SIRET ne peuvent pas diverger d'une page à l'autre.
 */
export async function Footer() {
  const identite = await lireIdentiteLegale();

  return (
    <footer
      data-theme="night"
      className="border-t border-rule bg-bg text-fg"
      style={{ paddingInline: "var(--gutter)" }}
    >
      <div className="mx-auto max-w-wide" style={{ paddingBlock: "clamp(56px, 7vw, 104px)" }}>
        <div className="grid gap-12 lg:grid-cols-[1fr_2.4fr]">
          <div>
            <Wordmark />
            <p className="type-body measure mt-6 text-fg-soft">
              Vous composez votre montre mécanique en ligne. Je l&apos;assemble et je la règle à la
              main, dans mon atelier indépendant.
            </p>
            {/* Pas de formulaire d'inscription à la lettre ici : aucun envoi n'existe
                encore. L'inscription se fait depuis le profil, case décochée par
                défaut et consentement horodaté. */}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {COLONNES.map((colonne) => (
              <nav key={colonne.titre} aria-label={colonne.titre}>
                <h2 className="type-mono mb-3 text-fg-soft md:mb-4">{colonne.titre}</h2>
                {/* Le lien est une boîte de 44 px de haut sur écran tactile (cible
                    confortable au pouce) ; le soulignement reste sous le texte, porté
                    par le libellé et non par la boîte. */}
                <ul className="flex flex-col md:gap-1">
                  {colonne.liens.map((lien) => (
                    <li key={lien.href}>
                      <Link
                        href={lien.href}
                        className="group/lien flex min-h-11 items-center text-fg transition-colors duration-(--d-fast) ease-atelier hover:text-accent-ink md:min-h-8"
                      >
                        <span className="type-body link-underline group-hover/lien:bg-[length:100%_1px] group-focus-visible/lien:bg-[length:100%_1px]">
                          {lien.label}
                        </span>
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
            {identite.adresse ? (
              <p className="type-caption whitespace-pre-line text-fg">{identite.adresse}</p>
            ) : (
              <FillMe>adresse de l&apos;atelier</FillMe>
            )}
            {identite.telephone ? (
              <p className="type-caption text-fg" data-numeric>
                {identite.telephone}
              </p>
            ) : (
              <FillMe>téléphone</FillMe>
            )}
            {identite.email ? (
              <a
                href={`mailto:${identite.email}`}
                className="group/lien -my-2.5 inline-flex min-h-11 items-center self-start text-fg hover:text-accent-ink"
              >
                <span className="type-caption link-underline group-hover/lien:bg-[length:100%_1px] group-focus-visible/lien:bg-[length:100%_1px]">
                  {identite.email}
                </span>
              </a>
            ) : (
              <FillMe>adresse e-mail de contact</FillMe>
            )}
          </div>
          <div className="flex flex-col gap-3 md:items-end md:text-right">
            <h2 className="type-mono text-fg-soft">Mentions</h2>
            {identite.raisonSociale && identite.siret ? (
              <p className="type-caption text-fg">
                {identite.raisonSociale}, EI · SIRET <span data-numeric>{identite.siret}</span>
                {identite.tva ? (
                  <>
                    {" "}
                    · TVA <span data-numeric>{identite.tva}</span>
                  </>
                ) : null}
              </p>
            ) : (
              <FillMe>nom de l&apos;entrepreneur, SIRET, TVA</FillMe>
            )}
            {mediateurChoisi(identite) ? (
              <p className="type-caption text-fg-soft">
                Médiateur de la consommation :{" "}
                <a
                  href={identite.mediateurSite}
                  rel="noopener noreferrer"
                  className="link-underline text-fg hover:text-accent-ink"
                >
                  {identite.mediateurNom}
                </a>
              </p>
            ) : (
              <FillMe>[MÉDIATEUR À CHOISIR] médiateur de la consommation</FillMe>
            )}
            <p className="type-caption text-fg-soft">
              © {new Date().getFullYear()} Chronova. Montres assemblées à la main en France.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
