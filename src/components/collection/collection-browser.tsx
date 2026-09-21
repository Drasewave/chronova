"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EntreeCollection {
  slug: string;
  /** Diamètres proposés par le modèle : un 38/39 apparaît dans les deux filtres. */
  sizes: string[];
  movement: string;
  basePriceCents: number;
  carte: ReactNode;
}

/** Pas de filtre « style » : les gammes ont leur page, au-dessus de cette liste. */
type Filtres = { taille: string; mouvement: string; prix: string };

const TOUS = "tous";

const TRANCHES: { key: string; label: string; test: (cents: number) => boolean }[] = [
  { key: "sous-1200", label: "Moins de 1 200 €", test: (c) => c < 120000 },
  { key: "1200-1400", label: "1 200 – 1 400 €", test: (c) => c >= 120000 && c < 140000 },
  { key: "plus-1400", label: "1 400 € et plus", test: (c) => c >= 140000 },
];

/**
 * Filtres de collection.
 *
 * Les cartes sont rendues côté serveur — SVG compris — et transmises telles
 * quelles : le filtrage ne fait que choisir lesquelles afficher. La page reste
 * donc prérendue, tout en gardant des filtres instantanés et partageables : ils
 * sont recopiés dans l'adresse par `replaceState`, sans rechargement.
 */
export function CollectionBrowser({
  entrees,
  initial,
}: {
  entrees: EntreeCollection[];
  initial: Partial<Filtres>;
}) {
  const [filtres, setFiltres] = useState<Filtres>({
    taille: initial.taille ?? TOUS,
    mouvement: initial.mouvement ?? TOUS,
    prix: initial.prix ?? TOUS,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (valeur !== TOUS) params.set(cle, valeur);
    }
    const requete = params.toString();
    window.history.replaceState(null, "", requete ? `?${requete}` : window.location.pathname);
  }, [filtres]);

  const facettes = useMemo(() => {
    const tailles = new Set<string>();
    const mouvements = new Set<string>();
    for (const entree of entrees) {
      for (const taille of entree.sizes) tailles.add(taille);
      mouvements.add(entree.movement);
    }
    return {
      tailles: [...tailles].sort().map((key) => ({ key, label: `${key} mm` })),
      mouvements: [...mouvements].sort().map((key) => ({ key, label: key })),
    };
  }, [entrees]);

  const visibles = useMemo(
    () =>
      entrees.filter((entree) => {
        if (filtres.taille !== TOUS && !entree.sizes.includes(filtres.taille)) return false;
        if (filtres.mouvement !== TOUS && entree.movement !== filtres.mouvement) return false;
        if (filtres.prix !== TOUS) {
          const tranche = TRANCHES.find((t) => t.key === filtres.prix);
          if (tranche && !tranche.test(entree.basePriceCents)) return false;
        }
        return true;
      }),
    [entrees, filtres],
  );

  const actifs = Object.values(filtres).filter((valeur) => valeur !== TOUS).length;

  return (
    <div>
      <div className="flex flex-wrap gap-x-14 gap-y-6 border-y border-rule py-7">
        <GroupeFiltre
          label="Diamètre"
          valeur={filtres.taille}
          choix={facettes.tailles}
          onChange={(taille) => setFiltres((f) => ({ ...f, taille }))}
        />
        <GroupeFiltre
          label="Mouvement"
          valeur={filtres.mouvement}
          choix={facettes.mouvements}
          onChange={(mouvement) => setFiltres((f) => ({ ...f, mouvement }))}
        />
        <GroupeFiltre
          label="Prix de départ"
          valeur={filtres.prix}
          choix={TRANCHES.map(({ key, label }) => ({ key, label }))}
          onChange={(prix) => setFiltres((f) => ({ ...f, prix }))}
        />
      </div>

      <p className="type-mono mt-6 flex flex-wrap items-center gap-4 text-fg-soft" aria-live="polite">
        <span>
          {visibles.length} modèle{visibles.length > 1 ? "s" : ""}
        </span>
        {actifs > 0 && (
          <button
            type="button"
            onClick={() => setFiltres({ taille: TOUS, mouvement: TOUS, prix: TOUS })}
            className="link-underline text-gold"
          >
            Tout afficher
          </button>
        )}
      </p>

      {visibles.length === 0 ? (
        <p className="type-body measure mt-12 text-fg-soft">
          Aucun modèle ne réunit ces critères. Élargissez un filtre : vous choisissez la plupart
          des variantes ensuite, dans le configurateur.
        </p>
      ) : (
        <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibles.map((entree) => (
            <div key={entree.slug}>{entree.carte}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupeFiltre({
  label,
  valeur,
  choix,
  onChange,
}: {
  label: string;
  valeur: string;
  choix: { key: string; label: string }[];
  onChange: (valeur: string) => void;
}) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="type-mono mb-3 p-0 text-fg-soft">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        <Puce actif={valeur === TOUS} onClick={() => onChange(TOUS)}>
          Tous
        </Puce>
        {choix.map((item) => (
          <Puce key={item.key} actif={valeur === item.key} onClick={() => onChange(item.key)}>
            {item.label}
          </Puce>
        ))}
      </div>
    </fieldset>
  );
}

function Puce({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={cn(
        "type-ui min-h-11 rounded-pill border px-5 transition-colors duration-200 ease-atelier",
        actif
          ? "border-gold bg-accent text-on-accent"
          : "border-rule bg-panel text-fg hover:border-fg",
      )}
    >
      {children}
    </button>
  );
}
