"use client";

import Link from "next/link";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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
 * Chronologie d'un passage (1 200 ms, `--d-passage`, voir « Défilé » dans
 * globals.css). Trois plans, qui ne bougent ni de la même amplitude ni au même
 * instant :
 *
 *   −600 ms  lecture auto seulement : la montre suivante est montée, invisible
 *            (`attente`), pour que ses ≈ 1 500 nœuds ne tombent pas dans le
 *            passage
 *      0 ms  `amorce` : la sortante commence à s'éloigner dans la pénombre ; si
 *            l'entrante n'était pas montée, elle l'est maintenant, en `attente`,
 *            et son style est calculé avant le pas suivant
 *     +1 rendu `transition` : l'entrante vient de la lumière et se pose au net
 *            sur la courbe la plus longue ; une bande de reflet la balaie ; la
 *            couronne graduée prend ses 30° sur toute la durée ; le halo et
 *            l'ombre au sol respirent ; nom, style, fiche et prix se relaient en
 *            cascade
 *   1200 ms  la sortante est démontée ; le minuteur de 5 s repart
 *
 * Tout est en transitions CSS : un clic pendant le passage repart de l'état
 * courant, sans saut. Jamais plus de deux montres montées. La première est
 * rendue côté serveur et garde l'entrée du héros (`.entree-montre`) ; sans
 * JavaScript elle reste là, fixe, avec sa fiche.
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
// Ces deux durées doublent `--d-defile` et `--d-passage` de globals.css : le
// minuteur JS et les transitions CSS doivent finir ensemble.
const INTERVALLE_MS = 5000;
/** Durée du passage : `--d-passage` = `--d-scene` (850 ms) + `--d-base` (350 ms). */
const TRANSITION_MS = 1200;
/** Avance avec laquelle la montre suivante est montée, invisible. */
const PREMONTAGE_MS = 600;
/** Attente avant le premier départ : le rideau puis l'entrée du héros (≈ 2,3 s). */
const ATTENTE_RIDEAU_MS = 3000;
const ATTENTE_SANS_RIDEAU_MS = 1500;
const SEUIL_BALAYAGE_PX = 40;

type Sens = 1 | -1;
/** Opacités calculées des deux montres d'un passage, au moment d'un clic. */
type Jauge = () => { sortante: number; entrante: number };
type Frein = "survol" | "focus" | "masque" | "horsEcran";

interface Etat {
  courant: number;
  entrant: { index: number; sens: Sens } | null;
  /** `amorce` : l'entrante est montée en attente, le temps d'un calcul de style. */
  phase: "repos" | "amorce" | "transition";
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
  /** Fin de l'amorce : la scène a calculé le style de l'entrante, le passage peut partir. */
  lancer: () => void;
  /**
   * La scène confie ici sa lecture des opacités à l'écran : un clic pendant un
   * passage garde la montre la plus visible et relaie l'autre.
   */
  jauger: (lecture: Jauge | null) => void;
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
  const jauge = useRef<Jauge | null>(null);

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
    // Un clic pendant un passage le solde depuis l'état courant : tant que la
    // sortante est la plus visible à l'écran, elle continue de partir et c'est
    // l'entrante, à peine là, qui est relayée ; ensuite c'est l'entrante,
    // presque posée, qui devient la sortante. Lu ici, hors de la mise à jour.
    const lu = jauge.current?.();
    const sortanteVisible = lu !== undefined && lu.sortante > lu.entrante;
    setEtat((e) => {
      const enCours = e.phase !== "repos" && e.entrant ? e.entrant : null;
      const jeune = enCours !== null && sortanteVisible;
      const base = enCours && !jeune ? enCours.index : e.courant;
      const index = cible(base);
      if (index === base) {
        // Retour sur la montre qui partait : elle revient de là où elle est.
        if (jeune && enCours) return { ...e, entrant: null, phase: "repos", crans: e.crans + sens };
        return e;
      }
      if (jeune && enCours && index === enCours.index) return e;
      const crans = e.crans + sens;
      if (reduitRef.current) return { courant: index, entrant: null, phase: "repos", crans, vierge: false };
      return { courant: base, entrant: { index, sens }, phase: "amorce", crans, vierge: false };
    });
  }, []);

  const lancer = useCallback(() => {
    setEtat((e) => (e.phase === "amorce" ? { ...e, phase: "transition" } : e));
  }, []);

  const jauger = useCallback((lecture: Jauge | null) => {
    jauge.current = lecture;
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
      const base = etat.phase !== "repos" && etat.entrant ? etat.entrant.index : etat.courant;
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

  const affiche = etat.phase !== "repos" && etat.entrant ? etat.entrant.index : etat.courant;

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
      lancer,
      jauger,
      basculerLecture,
      freiner,
    }),
    [modeles, depart, etat, affiche, enMarche, pauseUtilisateur, reduit, aller, pas, lancer, jauger, basculerLecture, freiner],
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
 *
 * Les plans, du fond vers l'avant : le halo qui respire, la couronne graduée,
 * l'ombre au sol, puis les montres (deux au plus, chacune avec sa bande de
 * reflet). Seuls ces conteneurs HTML bougent : le SVG reste à l'horloge
 * vivante, qui écrit les `transform` de ses aiguilles.
 */
export function DefileScene({ graduation }: { graduation: ReactNode }) {
  const {
    modeles,
    depart,
    etat,
    affiche,
    enMarche,
    pauseUtilisateur,
    reduit,
    aller,
    pas,
    lancer,
    jauger,
    basculerLecture,
    freiner,
  } = useDefile();
  const total = modeles.length;
  const region = useRef<HTMLDivElement>(null);
  const appui = useRef<{ x: number; y: number } | null>(null);
  const passage = etat.phase !== "repos";

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

  // Ce que l'écran montre vraiment des deux montres : une transition composée
  // peut partir une trame après le style, et un montage retenir le fil ; seule
  // l'opacité calculée dit laquelle est la plus visible au moment d'un clic.
  useEffect(() => {
    const opacite = (role: string) => {
      const noeud = region.current?.querySelector<HTMLElement>(`[data-defile="${role}"]`);
      return noeud ? Number(getComputedStyle(noeud).opacity) : 0;
    };
    jauger(() => ({ sortante: opacite("sortante"), entrante: opacite("entrante") }));
    return () => jauger(null);
  }, [jauger]);

  // Amorce : l'entrante vient d'être montée en attente. On force le calcul de
  // son style (pas de mise en page) pour que le pas suivant, `entrante`, parte
  // en transition depuis cet état plutôt que d'apparaître d'un coup.
  useLayoutEffect(() => {
    if (etat.phase !== "amorce") return;
    const attente = region.current?.querySelector<HTMLElement>('[data-defile="attente"]');
    if (attente) void getComputedStyle(attente).opacity;
    lancer();
  }, [etat.phase, lancer]);

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

  const sens: Sens = etat.entrant?.sens ?? 1;
  const couches = [
    { index: etat.courant, role: passage ? ("sortante" as const) : ("courante" as const) },
    ...(etat.entrant
      ? [{ index: etat.entrant.index, role: etat.phase === "transition" ? ("entrante" as const) : ("attente" as const) }]
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
      className="defile-scene"
      data-lecture={enMarche ? "marche" : "arret"}
      data-passage={passage ? "" : undefined}
      style={{ "--sens": sens } as CSSProperties}
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
        {/* Plan de fond : le halo de la scène, qui respire d'un cran pendant le passage. */}
        <span aria-hidden="true" className="defile-halo" />

        <div
          className="defile-graduation pointer-events-none absolute inset-0 -z-10"
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
          {/* L'ombre au sol, qui s'allonge puis se rassemble. */}
          <span aria-hidden="true" className="defile-ombre" />

          {couches.map(({ index, role }) => {
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
                className="defile-couche"
              >
                <MontreCouche modele={modele} />
                {/* Passage de lumière sur l'entrante, masqué à l'ellipse. */}
                <span aria-hidden="true" className="defile-lueur">
                  <span />
                </span>
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
              <Pile valeurs={modeles.map((m) => m.name)} actif={affiche} rang={0} centre />
            </Link>
            <p className="type-mono mt-1 text-fg-soft">
              <Pile valeurs={modeles.map((m) => m.styleLabel)} actif={affiche} rang={1} centre />
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
                          key={`${index}-${passage}-${pauseUtilisateur}`}
                          className={cn(
                            "absolute inset-0 origin-left bg-accent-ink",
                            !(reduit || pauseUtilisateur) && "defile-progression",
                          )}
                          style={
                            reduit || pauseUtilisateur
                              ? undefined
                              : passage
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
              <span className="text-fg">
                <Pile valeurs={modeles.map((_, index) => String(index + 1).padStart(2, "0"))} actif={affiche} rang={1} />
              </span>
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

/**
 * La montre d'une couche, mémoïsée : ses ≈ 1 500 nœuds ne sont pas réconciliés
 * à chaque rendu du défilé (rôle de la couche, freins, phase). Seul le
 * conteneur autour d'elle change de style.
 */
const MontreCouche = memo(function MontreCouche({ modele }: { modele: ModeleDefile }) {
  return <InteractiveWatch id={`hero-${modele.slug}`} render={modele.render} label={modele.label} className="w-full" />;
});

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

/**
 * Fiche de la pièce photographiée : ce que l'on regarde, et son prix. Les
 * colonnes se relaient en vague (`rang` 2 à 2,75), le prix ferme la marche.
 */
export function DefileFiche() {
  const { modeles, affiche } = useDefile();
  const exemple = modeles[affiche]?.isSample ?? false;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 py-6 sm:grid-cols-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
      <Spec terme="Modèle" valeurs={modeles.map((m) => m.name)} actif={affiche} rang={2} />
      <Spec terme="Boîtier" valeurs={modeles.map((m) => `${m.diameterMm} mm, acier 316L`)} actif={affiche} rang={2.25} />
      <Spec terme="Étanchéité" valeurs={modeles.map((m) => `${m.waterResistM} m`)} actif={affiche} rang={2.5} />
      <Spec terme="Calibre" valeurs={modeles.map((m) => m.movement)} actif={affiche} rang={2.75} />
      <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-1 lg:justify-end">
        <dt className="sr-only">Prix</dt>
        <dd className="type-title-2 text-fg" data-numeric>
          <Pile valeurs={modeles.map((m) => `À partir de ${m.priceLabel}`)} actif={affiche} rang={3.25} />
        </dd>
        {exemple && <SamplePill />}
      </div>
    </dl>
  );
}

function Spec({ terme, valeurs, actif, rang }: { terme: string; valeurs: string[]; actif: number; rang: number }) {
  return (
    <div>
      <dt className="type-mono text-fg-soft">{terme}</dt>
      <dd className="type-ui mt-1.5 text-fg" data-numeric>
        <Pile valeurs={valeurs} actif={actif} rang={rang} />
      </dd>
    </div>
  );
}

/**
 * Valeurs superposées dans une même case de grille : la case prend d'emblée la
 * taille de la plus longue, donc rien ne saute quand la valeur change. L'active
 * monte de son masque, celle qu'elle remplace (`data-actif="sort"`) s'efface
 * par le haut (`.defile-texte`), avec le retard de son `rang` dans la cascade.
 * Les valeurs identiques sont fusionnées : « 100 m » vers « 100 m » ne bouge pas.
 */
function Pile({
  valeurs,
  actif,
  rang,
  centre = false,
}: {
  valeurs: string[];
  actif: number;
  rang: number;
  centre?: boolean;
}) {
  const uniques = useMemo(() => Array.from(new Set(valeurs)), [valeurs]);
  const courante = valeurs[actif];
  // La valeur précédente, tenue pendant le rendu (et non dans un effet) pour
  // qu'elle sorte dans le même rendu que celui où l'active entre.
  const [historique, setHistorique] = useState({ courante, avant: undefined as string | undefined });
  if (historique.courante !== courante) setHistorique({ courante, avant: historique.courante });
  const avant = historique.avant;
  return (
    <span className={cn("inline-grid align-bottom", centre && "justify-items-center")} style={{ "--rang": rang } as CSSProperties}>
      {uniques.map((valeur) => {
        const etat = valeur === courante ? "true" : valeur === avant ? "sort" : "false";
        return (
          <span
            key={valeur}
            data-actif={etat}
            aria-hidden={etat === "true" ? undefined : true}
            className="defile-texte col-start-1 row-start-1 whitespace-nowrap"
          >
            {valeur}
          </span>
        );
      })}
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
