import Link from "next/link";
import { basculerOption, enregistrerEtape, enregistrerGroupe } from "@/app/actions/atelier-catalogue";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { BoutonLeger, Bouton, Champ, Saisie, Zone } from "@/components/atelier/formulaire";
import { EditeurOption, type OptionEditable } from "@/components/atelier/editeur-option";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { getCatalogue, getModels } from "@/lib/data/queries";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import { etatPiece } from "@/lib/atelier/stock";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Catalogue" };
export const dynamic = "force-dynamic";

/** Les clés d'un correctif de rendu qui portent une couleur, et non une forme. */
const CLES_COULEUR = ["dialColor", "insertColor", "strapColor"];

/**
 * Le configurateur, modifiable sans toucher au code.
 *
 * Une étape ouverte à la fois : les neuf étapes et leurs soixante-quinze
 * options ne tiennent pas sur un écran, et dérouler tout obligerait à chercher.
 * Ce qui est ici change immédiatement le site public — d'où l'aperçu avant
 * d'enregistrer.
 */
export default async function Catalogue(props: PageProps<"/atelier/catalogue">) {
  const { etape: etapeChoisie } = await props.searchParams;

  const [etapes, pieces, catalogue, modeles] = await Promise.all([
    prisma.configStep.findMany({
      orderBy: { sortIndex: "asc" },
      include: {
        groups: {
          orderBy: { sortIndex: "asc" },
          include: {
            options: {
              orderBy: { sortIndex: "asc" },
              include: { part: { select: { reference: true, quantityOnHand: true, quantityReserved: true, reorderThreshold: true } } },
            },
          },
        },
      },
    }),
    prisma.part.findMany({
      orderBy: [{ category: "asc" }, { reference: "asc" }],
      select: { id: true, reference: true, name: true },
    }),
    getCatalogue(),
    getModels(),
  ]);

  const active = etapes.find((etape) => etape.key === etapeChoisie) ?? etapes[0];
  const premier = modeles[0];
  const apercu = premier ? defaultConfiguration(catalogue, premier).render : undefined;

  const totalOptions = etapes.reduce(
    (somme, etape) => somme + etape.groups.reduce((s, groupe) => s + groupe.options.length, 0),
    0,
  );
  const coupees = etapes.reduce(
    (somme, etape) =>
      somme +
      etape.groups.reduce((s, groupe) => s + groupe.options.filter((o) => !o.isActive).length, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-[84rem]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-display-2">Catalogue</h1>
          <p className="type-body mt-2 text-fg-soft">
            {etapes.length} étapes, {totalOptions} options
            {coupees > 0 ? `, dont ${coupees} coupée(s)` : ""}. Toute modification est visible
            aussitôt sur le site.
          </p>
        </div>
        <div className="flex flex-wrap gap-5">
          <Link href="/atelier/catalogue/regles" className="type-ui lien-atelier link-underline text-accent">
            Règles de compatibilité
          </Link>
          {premier && (
            <Link
              href={`/atelier/catalogue/modeles/${premier.slug}`}
              className="type-ui lien-atelier link-underline text-accent"
            >
              Modèles de base
            </Link>
          )}
        </div>
      </header>

      <BandeauExemple
        nombre={etapes.reduce(
          (somme, etape) =>
            somme +
            etape.groups.reduce((s, groupe) => s + groupe.options.filter((o) => o.isSample).length, 0),
          0,
        )}
        quoi="options du configurateur"
      />

      <nav aria-label="Étapes du configurateur" className="mb-6 flex flex-wrap gap-2">
        {etapes.map((etape) => (
          <Link
            key={etape.id}
            href={`/atelier/catalogue?etape=${etape.key}`}
            aria-current={etape.id === active?.id ? "page" : undefined}
            className={
              etape.id === active?.id
                ? "type-ui flex min-h-11 items-center rounded-field border border-accent bg-accent px-4 text-on-accent"
                : "type-ui flex min-h-11 items-center rounded-field border border-rule px-4 text-fg hover:border-accent-decor hover:text-accent"
            }
          >
            {etape.label}
          </Link>
        ))}
      </nav>

      {active && (
        <div className="flex flex-col gap-4">
          <Panneau titre="L'étape" aide="Titre et phrase d'introduction vus par le client.">
            <form action={enregistrerEtape} className="flex flex-col gap-4">
              <input type="hidden" name="etape" value={active.id} />
              <div className="flex flex-wrap gap-4">
                <Champ label="Titre" className="min-w-[14rem] flex-1">
                  <Saisie name="label" defaultValue={active.label} />
                </Champ>
                <Champ label="Clé" aide="Non modifiable : elle voyage dans les liens partagés." className="w-44">
                  <Saisie value={active.key} readOnly disabled className="type-mono" />
                </Champ>
              </div>
              <Champ label="Introduction">
                <Zone name="intro" rows={2} defaultValue={active.intro} />
              </Champ>
              <Bouton>Enregistrer l&apos;étape</Bouton>
            </form>
          </Panneau>

          {active.groups.map((groupe) => (
            <Panneau
              key={groupe.id}
              titre={groupe.label}
              aide={groupe.help ?? undefined}
              action={
                <span className="type-mono text-fg-soft">
                  {groupe.key} · {groupe.options.length} option(s)
                </span>
              }
            >
              <form action={enregistrerGroupe} className="mb-8 flex flex-wrap items-end gap-4">
                <input type="hidden" name="groupe" value={groupe.id} />
                <Champ label="Intitulé du groupe" className="min-w-[12rem] flex-1">
                  <Saisie name="label" defaultValue={groupe.label} />
                </Champ>
                <Champ label="Aide" className="min-w-[16rem] flex-[2]">
                  <Saisie name="aide" defaultValue={groupe.help ?? ""} />
                </Champ>
                <BoutonLeger>Renommer</BoutonLeger>
              </form>

              <ul className="flex flex-col gap-8">
                {groupe.options.map((option) => {
                  const patch = (option.renderPatch as Record<string, unknown> | null) ?? {};
                  const clesCouleur = CLES_COULEUR.filter((cle) => cle in patch);
                  const etat = option.part ? etatPiece(option.part) : null;

                  const editable: OptionEditable = {
                    id: option.id,
                    key: option.key,
                    label: option.label,
                    description: option.description,
                    colorName: option.colorName,
                    colorHex: option.colorHex,
                    priceDeltaCents: option.priceDeltaCents,
                    leadDaysDelta: option.leadDaysDelta,
                    partId: option.partId,
                    isActive: option.isActive,
                    clesCouleur,
                  };

                  return (
                    <li
                      key={option.id}
                      className="border-t border-rule pt-6 first:border-0 first:pt-0"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="flex flex-wrap items-center gap-3">
                          {option.colorHex && (
                            <span
                              aria-hidden
                              className="size-6 shrink-0 rounded-pill border border-rule"
                              style={{ background: option.colorHex }}
                            />
                          )}
                          <span className="type-mono text-fg-soft">
                            {groupe.key}:{option.key}
                          </span>
                          <span className="type-ui text-fg">{option.label}</span>
                          {option.priceDeltaCents !== 0 && (
                            <span className="type-mono text-fg-soft" data-numeric>
                              {option.priceDeltaCents > 0 ? "+" : ""}
                              {formatPrice(option.priceDeltaCents)}
                            </span>
                          )}
                          {!option.isActive && <Pill ton="alerte">Coupée</Pill>}
                          {etat === "rupture" && <Pill ton="alerte">Pièce en rupture</Pill>}
                        </span>

                        <form action={basculerOption}>
                          <input type="hidden" name="option" value={option.id} />
                          <BoutonLeger>{option.isActive ? "Couper" : "Remettre"}</BoutonLeger>
                        </form>
                      </div>

                      <EditeurOption option={editable} pieces={pieces} apercu={apercu} />
                    </li>
                  );
                })}
              </ul>
            </Panneau>
          ))}
        </div>
      )}
    </div>
  );
}
