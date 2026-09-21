"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ButtonLink } from "@/components/ui/button";
import { IconChevron } from "@/components/ui/icons";
import { SamplePill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { InteractiveWatch } from "@/watch/interactive-watch";
import type { WatchRender } from "@/watch/types";

/**
 * Défilé des modèles dans le héros.
 *
 * Le héros reste un composant serveur : il calcule la configuration de départ
 * de chaque modèle et passe ici une liste sérialisable. Ce fichier porte l'état
 * (modèle courant, lecture, freins) dans un contexte, et trois vues qui le
 * lisent depuis des endroits différents de la scène :
 *
 *   <DefileScene>          la montre, sa couronne graduée et les commandes
 *   <LienComposerModele>   « Composer ce modèle », à côté des boutons du héros
 *   <DefileFiche>          la fiche de pied de scène
 *
 * Chronologie d'un changement (850 ms, `var(--ease)`, voir globals.css) :
 *
 *   −600 ms  lecture auto seulement : la montre suivante est montée, invisible,
 *            pour que ses ≈ 1 500 nœuds ne tombent pas dans la transition
 *      0 ms  la sortante recule (0,96), glisse de 40 px et s'éteint (700 ms) ;
 *            l'entrante arrive de l'autre côté, 48 px, 0,97 → 1, floue de 6 px
 *            au départ seulement (850 ms) ; la couronne graduée tourne de 30° ;
 *            nom et fiche passent en fondu enchaîné
 *    850 ms  la sortante est démontée ; le minuteur de 5 s repart
 *
 * Jamais plus de deux montres montées. La première est rendue côté serveur et
 * garde l'entrée du héros (`.entree-montre`) ; sans JavaScript elle reste là,
 * fixe, avec sa fiche.
 */

export interface ModeleDefile {
  slug: string;
  name: string;
  styleLabel: string;
  diameterMm: number;
  waterResistM: number;
  /** Calibre tel qu'il s'affiche : « NH35 automatique ». */
  movement: string;
  basePriceCents: number;
  /** Prix formaté côté serveur : `Intl` peut différer entre Node et le navigateur. */
  priceLabel: string;
  isSample: boolean;
  render: WatchRender;
  /** Description de la montre pour les lecteurs d'écran. */
  label: string;
}

/** Temps d'exposition d'un modèle, transition non comprise. */
// Ces deux durées doublent `--d-defile` et `--d-scene` de globals.css : le
// minuteur JS et la barre de progression CSS doivent finir ensemble.
const INTERVALLE_MS = 5000;
/** Durée de la transition : doit couvrir `defile-entre` (globals.css). */
const TRANSITION_MS = 850;
/** Avance avec laquelle la montre suivante est montée, invisible. */
const PREMONTAGE_MS = 600;
/** Attente avant le premier départ : le rideau puis l'entrée du héros (≈ 2,3 s). */
const ATTENTE_RIDEAU_MS = 3000;
const ATTENTE_SANS_RIDEAU_MS = 1500;
const SEUIL_BALAYAGE_PX = 40;

type Sens = 1 | -1;
type Frein = "survol" | "focus" | "masque" | "horsEcran";

interface Etat {
  courant: number;
  entrant: { index: number; sens: Sens } | null;
  phase: "repos" | "transition";
  /** Crans parcourus par la couronne graduée : 30° chacun. */
  crans: number;
  /** Vrai tant qu'aucun changement n'a eu lieu : la première montre garde son entrée. */
  vierge: boolean;
}

interface Defile {
  modeles: ModeleDefile[];
  depart: number;
  etat: Etat;
  /** Modèle que décrivent les textes : l'entrant dès le début de la transition. */
  affiche: number;
  enMarche: boolean;
  pauseUtilisateur: boolean;
  reduit: boolean;
  aller: (index: number, sens: Sens) => void;
  pas: (sens: Sens) => void;
  basculerLecture: () => void;
  freiner: (frein: Frein, actif: boolean) => void;
}

const Contexte = createContext<Defile | null>(null);

function useDefile(): Defile {
  const defile = useContext(Contexte);
  if (!defile) throw new Error("Ce composant doit être rendu dans <DefileModeles>.");
  return defile;
}

export function DefileModeles({
  modeles,
  depart = 0,
  children,
}: {
  modeles: ModeleDefile[];
  depart?: number;
  children: ReactNode;
}) {
  const total = modeles.length;
  const [etat, setEtat] = useState<Etat>({
    courant: depart,
    entrant: null,
    phase: "repos",
    crans: 0,
    vierge: true,
  });
  const [pret, setPret] = useState(false);
  const [reduit, setReduit] = useState(false);
  const [pauseUtilisateur, setPauseUtilisateur] = useState(false);
  const [freins, setFreins] = useState<Record<Frein, boolean>>({
    survol: false,
    focus: false,
    masque: false,
    horsEcran: false,
  });
  const [annonce, setAnnonce] = useState("");
  const reste = useRef(INTERVALLE_MS);
  const reduitRef = useRef(false);

  // Mouvement réduit : ni lecture automatique, ni transition.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lire = () => {
      reduitRef.current = media.matches;
      setReduit(media.matches);
    };
    lire();
    media.addEventListener("change", lire);
    return () => media.removeEventListener("change", lire);
  }, []);

  // Le défilé attend la fin de l'ouverture (rideau, puis entrée du héros).
  useEffect(() => {
    const attente = window.__chronovaIntro === "off" ? ATTENTE_SANS_RIDEAU_MS : ATTENTE_RIDEAU_MS;
    const minuteur = window.setTimeout(() => setPret(true), attente);
    return () => window.clearTimeout(minuteur);
  }, []);

  useEffect(() => {
    const lire = () => setFreins((f) => (f.masque === document.hidden ? f : { ...f, masque: document.hidden }));
    lire();
    document.addEventListener("visibilitychange", lire);
    return () => document.removeEventListener("visibilitychange", lire);
  }, []);

  const freiner = useCallback((frein: Frein, actif: boolean) => {
    setFreins((f) => (f[frein] === actif ? f : { ...f, [frein]: actif }));
  }, []);

  const changer = useCallback((cible: (courant: number) => number, sens: Sens) => {
    setEtat((e) => {
      // Un clic pendant une transition la solde d'abord : on repart de l'entrant.
      const courant = e.phase === "transition" && e.entrant ? e.entrant.index : e.courant;
      const index = cible(courant);
      if (index === courant) return e.phase === "transition" ? { ...e, courant, entrant: null, phase: "repos" } : e;
      const crans = e.crans + sens;
      if (reduitRef.current) return { courant: index, entrant: null, phase: "repos", crans, vierge: false };
      return { courant, entrant: { index, sens }, phase: "transition", crans, vierge: false };
    });
  }, []);

  const annoncer = useCallback(
    (index: number) => {
      const modele = modeles[index];
      if (modele) setAnnonce(`${modele.name}, ${modele.styleLabel.toLowerCase()}, ${index + 1} sur ${total}`);
    },
    [modeles, total],
  );

  // Changements demandés par la personne : les seuls qui sont annoncés.
  const aller = useCallback(
    (index: number, sens: Sens) => {
      changer(() => index, sens);
      annoncer(index);
    },
    [changer, annoncer],
  );

  const pas = useCallback(
    (sens: Sens) => {
      const base = etat.phase === "transition" && etat.entrant ? etat.entrant.index : etat.courant;
      const index = (base + sens + total) % total;
      changer(() => index, sens);
      annoncer(index);
    },
    [etat, total, changer, annoncer],
  );

  const basculerLecture = useCallback(() => {
    if (pauseUtilisateur) {
      // Relance explicite : elle l'emporte sur le survol et le focus en cours,
      // qui se réarmeront à la prochaine entrée dans le carrousel.
      reste.current = INTERVALLE_MS;
      setFreins((f) => ({ ...f, survol: false, focus: false }));
    }
    setPauseUtilisateur(!pauseUtilisateur);
  }, [pauseUtilisateur]);

  const enMarche =
    total > 1 &&
    pret &&
    !reduit &&
    !pauseUtilisateur &&
    !freins.survol &&
    !freins.focus &&
    !freins.masque &&
    !freins.horsEcran;

  // Fin de transition : l'entrant devient le courant, le minuteur repart de zéro.
  useEffect(() => {
    if (etat.phase !== "transition") return;
    const minuteur = window.setTimeout(() => {
      reste.current = INTERVALLE_MS;
      setEtat((e) =>
        e.phase === "transition" && e.entrant ? { ...e, courant: e.entrant.index, entrant: null, phase: "repos" } : e,
      );
    }, TRANSITION_MS);
    return () => window.clearTimeout(minuteur);
  }, [etat.phase, etat.entrant?.index]);

  // Lecture automatique. Une pause garde le temps restant, comme la barre de
  // progression (même horloge : toutes deux s'arrêtent avec `enMarche`).
  useEffect(() => {
    if (!enMarche || etat.phase !== "repos") return;
    const debut = performance.now();
    const duree = reste.current;
    const suivant = (etat.courant + 1) % total;
    const premontage = window.setTimeout(
      () => setEtat((e) => (e.phase === "repos" && !e.entrant ? { ...e, entrant: { index: suivant, sens: 1 } } : e)),
      Math.max(0, duree - PREMONTAGE_MS),
    );
    const changement = window.setTimeout(() => changer(() => suivant, 1), duree);
    return () => {
      window.clearTimeout(premontage);
      window.clearTimeout(changement);
      reste.current = Math.max(0, duree - (performance.now() - debut));
    };
  }, [enMarche, etat.phase, etat.courant, total, changer]);

  const affiche = etat.phase === "transition" && etat.entrant ? etat.entrant.index : etat.courant;

  const valeur = useMemo<Defile>(
    () => ({
      modeles,
      depart,
      etat,
      affiche,
      enMarche,
      pauseUtilisateur,
      reduit,
      aller,
      pas,
      basculerLecture,
      freiner,
    }),
    [modeles, depart, etat, affiche, enMarche, pauseUtilisateur, reduit, aller, pas, basculerLecture, freiner],
  );

  return (
    <Contexte.Provider value={valeur}>
      {children}
      {/* Lue seulement après un changement demandé par la personne. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {annonce}
      </p>
    </Contexte.Provider>
  );
}

/**
 * La montre courante, en grand, dans un carré réservé ; la couronne graduée
 * (fournie par le héros) tourne d'un cran derrière elle ; les commandes dessous.
 */
export function DefileScene({ graduation }: { graduation: ReactNode }) {
  const { modeles, depart, etat, affiche, enMarche, pauseUtilisateur, reduit, aller, pas, basculerLecture, freiner } =
    useDefile();
  const total = modeles.length;
  const region = useRef<HTMLDivElement>(null);
  const appui = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const noeud = region.current;
    if (!noeud || typeof IntersectionObserver === "undefined") return;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree) freiner("horsEcran", !entree.isIntersecting);
      },
      { threshold: 0.2 },
    );
    observateur.observe(noeud);
    return () => observateur.disconnect();
  }, [freiner]);

  const surTouche = (event: KeyboardEvent<HTMLDivElement>) => {
    if (total < 2 || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      pas(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      pas(-1);
    }
  };

  // Balayage tactile. `touch-action: pan-y` laisse la page défiler à la
  // verticale et nous laisse les gestes horizontaux.
  const surAppui = (event: ReactPointerEvent<HTMLDivElement>) => {
    appui.current = event.pointerType === "mouse" ? null : { x: event.clientX, y: event.clientY };
  };
  const surRelache = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origine = appui.current;
    appui.current = null;
    if (!origine || total < 2) return;
    const dx = event.clientX - origine.x;
    const dy = event.clientY - origine.y;
    if (Math.abs(dx) >= SEUIL_BALAYAGE_PX && Math.abs(dx) > Math.abs(dy) * 1.2) pas(dx < 0 ? 1 : -1);
  };

  const couches = [
    { index: etat.courant, role: etat.phase === "transition" ? ("sortante" as const) : ("courante" as const), sens: etat.entrant?.sens ?? 1 },
    ...(etat.entrant
      ? [{ index: etat.entrant.index, role: etat.phase === "transition" ? ("entrante" as const) : ("attente" as const), sens: etat.entrant.sens }]
      : []),
  ];

  const modeleAffiche = modeles[affiche];
  if (!modeleAffiche) return null;

  return (
    <div
      ref={region}
      role="group"
      aria-roledescription="carrousel"
      aria-label="Les modèles de la collection"
      data-lecture={enMarche ? "marche" : "arret"}
      onKeyDown={surTouche}
      onPointerEnter={(event) => event.pointerType === "mouse" && freiner("survol", true)}
      onPointerLeave={() => freiner("survol", false)}
      onFocus={(event) => {
        if (event.target instanceof Element && event.target.matches(":focus-visible")) freiner("focus", true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) freiner("focus", false);
      }}
    >
      {total > 1 && (
        <noscript>
          <style>{"[data-defile-commandes]{display:none}"}</style>
        </noscript>
      )}

      <div className="relative mx-auto w-[min(92%,30rem)] lg:w-[min(100%,35rem)]">
        <div
          className="pointer-events-none absolute inset-0 -z-10 transition-transform duration-(--d-scene) ease-(--ease)"
          style={{ transform: `rotate(${etat.crans * 30}deg)` }}
        >
          {graduation}
        </div>

        {/* Carré réservé : les montres s'y superposent, rien ne bouge autour. */}
        <div
          className="relative aspect-square touch-pan-y"
          onPointerDown={surAppui}
          onPointerUp={surRelache}
          onPointerCancel={() => (appui.current = null)}
        >
          {couches.map(({ index, role, sens }) => {
            const modele = modeles[index];
            if (!modele) return null;
            const visible = role === "courante" || role === "entrante";
            return (
              <div
                key={modele.slug}
                role="group"
                aria-roledescription="diapositive"
                aria-label={`${index + 1} sur ${total} : ${modele.name}`}
                aria-hidden={visible ? undefined : true}
                data-defile={role}
                className={cn(
                  "absolute inset-0",
                  role === "sortante" && "defile-sort",
                  role === "entrante" && "defile-entre z-10",
                  role === "attente" && "invisible opacity-0 will-change-[transform,opacity,filter]",
                )}
                style={{ "--sens": sens } as CSSProperties}
              >
                <InteractiveWatch id={`hero-${modele.slug}`} render={modele.render} label={modele.label} className="w-full" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-5 w-full max-w-[30rem] lg:mt-6 lg:w-[min(100%,35rem)] lg:max-w-none">
        <div className="flex items-center gap-3">
          {total > 1 && (
            <BoutonRond data-defile-commandes="" aria-label="Modèle précédent" onClick={() => pas(-1)}>
              <IconChevron className="rotate-90" />
            </BoutonRond>
          )}

          <div className="min-w-0 flex-1 text-center">
            <Link
              href={`/collection/${modeleAffiche.slug}`}
              aria-label={`${modeleAffiche.name}, voir le modèle`}
              className="type-title-2 inline-block text-fg transition-colors duration-200 ease-atelier hover:text-accent-ink"
            >
              <Pile valeurs={modeles.map((m) => m.name)} actif={affiche} centre />
            </Link>
            <p className="type-mono mt-1 text-fg-soft">
              <Pile valeurs={modeles.map((m) => m.styleLabel)} actif={affiche} centre />
            </p>
          </div>

          {total > 1 && (
            <BoutonRond data-defile-commandes="" aria-label="Modèle suivant" onClick={() => pas(1)}>
              <IconChevron className="-rotate-90" />
            </BoutonRond>
          )}
        </div>

        {total > 1 && (
          <div data-defile-commandes="" className="mt-3 flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center">
              {modeles.map((modele, index) => {
                const actif = index === affiche;
                return (
                  <button
                    key={modele.slug}
                    type="button"
                    aria-label={`Afficher ${modele.name}, modèle ${index + 1} sur ${total}`}
                    aria-current={actif ? "true" : undefined}
                    onClick={() => index !== affiche && aller(index, index > affiche ? 1 : -1)}
                    className="group flex h-11 min-w-0 flex-1 items-center px-[3px]"
                  >
                    <span className="relative block h-0.5 w-full overflow-hidden rounded-pill bg-fg-soft/35 transition-colors duration-200 ease-atelier group-hover:bg-fg-soft">
                      {actif && (
                        <span
                          key={`${index}-${etat.phase}-${pauseUtilisateur}`}
                          className={cn(
                            "absolute inset-0 origin-left bg-accent-ink",
                            !(reduit || pauseUtilisateur) && "defile-progression",
                          )}
                          style={
                            reduit || pauseUtilisateur
                              ? undefined
                              : etat.phase === "transition"
                                ? { animationName: "none", transform: "scaleX(0)" }
                                : { animationPlayState: enMarche ? "running" : "paused" }
                          }
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="type-mono hidden whitespace-nowrap text-fg-soft min-[480px]:block" data-numeric>
              <span className="sr-only">Modèle </span>
              <span className="text-fg">{String(affiche + 1).padStart(2, "0")}</span>
              <span aria-hidden="true"> / </span>
              <span className="sr-only"> sur </span>
              {String(total).padStart(2, "0")}
            </p>

            {/* Sans lecture automatique (mouvement réduit), rien à mettre en pause. */}
            {!reduit && (
              <BoutonRond
                aria-label={pauseUtilisateur ? "Relancer le défilé des modèles" : "Mettre le défilé des modèles en pause"}
                onClick={basculerLecture}
              >
                {pauseUtilisateur ? <IconLecture /> : <IconPause />}
              </BoutonRond>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** « Composer ce modèle » : suit le modèle affiché, sans changer de largeur. */
export function LienComposerModele() {
  const { modeles, affiche } = useDefile();
  const modele = modeles[affiche];
  if (!modele) return null;
  return (
    <ButtonLink href={`/composer/${modele.slug}`} variant="contour" aria-label={`Composer ce modèle : ${modele.name}`}>
      Composer ce modèle
    </ButtonLink>
  );
}

/** Fiche de la pièce photographiée : ce que l'on regarde, et son prix. */
export function DefileFiche() {
  const { modeles, affiche } = useDefile();
  const exemple = modeles[affiche]?.isSample ?? false;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 py-6 sm:grid-cols-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
      <Spec terme="Modèle" valeurs={modeles.map((m) => m.name)} actif={affiche} />
      <Spec terme="Boîtier" valeurs={modeles.map((m) => `${m.diameterMm} mm, acier 316L`)} actif={affiche} />
      <Spec terme="Étanchéité" valeurs={modeles.map((m) => `${m.waterResistM} m`)} actif={affiche} />
      <Spec terme="Calibre" valeurs={modeles.map((m) => m.movement)} actif={affiche} />
      <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-1 lg:justify-end">
        <dt className="sr-only">Prix</dt>
        <dd className="type-title-2 text-fg" data-numeric>
          <Pile valeurs={modeles.map((m) => `À partir de ${m.priceLabel}`)} actif={affiche} />
        </dd>
        {exemple && <SamplePill />}
      </div>
    </dl>
  );
}

function Spec({ terme, valeurs, actif }: { terme: string; valeurs: string[]; actif: number }) {
  return (
    <div>
      <dt className="type-mono text-fg-soft">{terme}</dt>
      <dd className="type-ui mt-1.5 text-fg" data-numeric>
        <Pile valeurs={valeurs} actif={actif} />
      </dd>
    </div>
  );
}

/**
 * Valeurs superposées dans une même case de grille : la case prend d'emblée la
 * taille de la plus longue, donc rien ne saute quand la valeur change, et le
 * fondu enchaîné se résume à une opacité (`.defile-texte`). Les valeurs
 * identiques sont fusionnées : « 100 m » vers « 100 m » ne clignote pas.
 */
function Pile({ valeurs, actif, centre = false }: { valeurs: string[]; actif: number; centre?: boolean }) {
  const uniques = useMemo(() => Array.from(new Set(valeurs)), [valeurs]);
  const courante = valeurs[actif];
  return (
    <span className={cn("inline-grid align-bottom", centre && "justify-items-center")}>
      {uniques.map((valeur) => (
        <span
          key={valeur}
          data-actif={valeur === courante}
          aria-hidden={valeur === courante ? undefined : true}
          className="defile-texte col-start-1 row-start-1 whitespace-nowrap"
        >
          {valeur}
        </span>
      ))}
    </span>
  );
}

function BoutonRond({ className, children, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-rule text-fg transition-[border-color,color,transform] duration-200 ease-atelier hover:border-accent-ink hover:text-accent-ink active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Pictos de lecture, dans la grille du jeu maison : 24, trait 1,5 px, sans remplissage. */
function Picto({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const IconPause = () => (
  <Picto>
    <path d="M9 6v12M15 6v12" />
  </Picto>
);

const IconLecture = () => (
  <Picto>
    <path d="M8.5 6v12l9.5-6z" />
  </Picto>
);
