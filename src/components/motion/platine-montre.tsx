"use client";

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { IconRotation, IconTournerDroite, IconTournerGauche } from "@/components/ui/icons";
import type { WatchView } from "@/watch/types";
import { cn } from "@/lib/utils";

/** Côté du profil montré : celui de la couronne (3 h), ou le flanc opposé (9 h). */
export type CotePlatine = "3h" | "9h";

/** Commandes offertes au parent (sélecteur Face / Profil / Dos, vignettes). */
export interface CommandesPlatine {
  /** Tourne jusqu'à la vue demandée, par le plus court chemin. */
  montrer: (vue: WatchView) => void;
  /** Quart de tour : `1` vers la gauche (on découvre le flanc de 3 h), `-1` vers la droite. */
  tourner: (sens: 1 | -1) => void;
}

/* ───────────────────────────── Géométrie ─────────────────────────────────
   L'angle court dans le sens où l'on pousse la montre VERS LA GAUCHE :
   0° face, 90° flanc de 3 h, 180° dos, 270° flanc de 9 h. C'est le lacet
   `yaw` de la vue projetée du moteur (`src/watch/projection`) : à chaque
   angle correspond un vrai dessin de l'objet tourné, pas trois cartes. */
const CRANS = [
  { angle: 0, vue: "face", cote: "3h" },
  { angle: 90, vue: "profil", cote: "3h" },
  { angle: 180, vue: "dos", cote: "3h" },
  { angle: 270, vue: "profil", cote: "9h" },
] as const satisfies readonly { angle: number; vue: WatchView; cote: CotePlatine }[];

/* ─────────────────────────────── Poses ───────────────────────────────────
   Un dessin fait 1 500 à 2 500 nœuds : en redessiner un à chaque image du
   geste serait trop lourd. La platine ne monte donc que des POSES à pas fixe
   de 15° (24 par tour) : la pose la plus proche de l'angle courant, et sa
   voisine dans le sens du mouvement, prémontée. Entre deux poses, le passage
   se fait en CSS : la pose voisine se fond par-dessus (au plus 0,5 à
   mi-chemin, où les rôles s'échangent — la composition est la même des deux
   côtés, rien ne saute) et chaque pose s'étire un peu en largeur (≤ 4 %) pour
   suivre la silhouette. Au repos une seule pose est montée. */
const PAS = 15;
/**
 * Le fondu croisé commence à cet écart de la pose et est à mi-chemin à `PAS / 2` :
 * quatre degrés de trajet en tout. Plus large, deux poses à 15° d'écart se
 * dédoublent visiblement (signature, guichet) sur un glisser lent ; plus court,
 * le passage claque. Le `scaleX` porte le reste de la continuité.
 */
const FONDU_DEBUT = 5.5;
const ETIREMENT_MAX = 0.04;

const PERSPECTIVE = 1200;
const INCLINAISON_MAX = 18;
/** Constante de temps de la friction (ms) : la lancée parcourt `vitesse × FRICTION`. */
const FRICTION = 325;
const LANCEE_MAX = 540;
/** Pulsation du rappel de l'inclinaison (rad/s), amortissement critique : aucun rebond. */
const RAPPEL = 11;
const SEUIL_GESTE = 6;
const CLE_INDICE = "chronova:platine-indice";

type Courbe = readonly [number, number, number, number];
const REPLI: { ease: Courbe; passage: Courbe; scene: number } = { ease: [0.16, 1, 0.3, 1], passage: [0.6, 0, 0.2, 1], scene: 850 };

const LIBELLES: Record<WatchView, string> = { face: "Face", profil: "Profil", dos: "Dos" };

function mod(valeur: number, base: number): number {
  return ((valeur % base) + base) % base;
}

/** Écart signé `angle − cran`, ramené dans ]−180, 180]. */
function ecart(angle: number, cran: number): number {
  return mod(angle - cran + 180, 360) - 180;
}

function borne(x: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, x));
}

function arrondi(valeur: number, decimales = 2): number {
  const k = 10 ** decimales;
  return Math.round(valeur * k) / k;
}

function cranProche(angle: number) {
  return CRANS[mod(Math.round(angle / 90), 4)] ?? CRANS[0];
}

function poseProche(angle: number): number {
  return mod(Math.round(angle / PAS) * PAS, 360);
}

function angleDe(vue: WatchView, cote: CotePlatine): number {
  return vue === "face" ? 0 : vue === "dos" ? 180 : cote === "9h" ? 270 : 90;
}

/**
 * Largeur relative de la silhouette à un angle : la tête de montre de face,
 * son épaisseur par la tranche (voir `Z` dans `geometry3d.ts` : ~0,3 du diamètre).
 */
function largeur(angle: number): number {
  const r = (angle * Math.PI) / 180;
  return Math.abs(Math.cos(r)) + 0.3 * Math.abs(Math.sin(r));
}

/** Courbe de Bézier cubique de CSS, résolue en x par Newton puis dichotomie. */
function bezier([x1, y1, x2, y2]: Courbe): (x: number) => number {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const enX = (t: number) => ((ax * t + bx) * t + cx) * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const pente = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(pente) < 1e-6) break;
      t -= (enX(t) - x) / pente;
    }
    if (t < 0 || t > 1 || Math.abs(enX(t) - x) > 1e-4) {
      let bas = 0;
      let haut = 1;
      for (let i = 0; i < 24; i += 1) {
        t = (bas + haut) / 2;
        if (enX(t) < x) bas = t;
        else haut = t;
      }
    }
    return ((ay * t + by) * t + cy) * t;
  };
}

function lireBezier(style: CSSStyleDeclaration, nom: string, repli: Courbe): Courbe {
  const [x1, y1, x2, y2, ...reste] = style.getPropertyValue(nom).match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined || reste.length > 0) return repli;
  return [x1, y1, x2, y2].every(Number.isFinite) ? [x1, y1, x2, y2] : repli;
}

function lireDuree(style: CSSStyleDeclaration, nom: string, repli: number): number {
  const brut = style.getPropertyValue(nom).trim();
  const valeur = Number.parseFloat(brut);
  if (!Number.isFinite(valeur)) return repli;
  return brut.endsWith("ms") ? valeur : valeur * 1000;
}

interface Animation {
  de: number;
  vers: number;
  debut: number;
  duree: number;
  courbe: (x: number) => number;
}

interface Couche {
  noeud: HTMLDivElement;
  /** Dernières valeurs écrites : on n'écrit que ce qui change. */
  opacite: string;
  transform: string;
  ordre: string;
  cache: string;
}

/**
 * Platine tournante : la montre se manipule comme un objet.
 *
 * Glisser horizontalement la fait tourner autour de son axe 12 h – 6 h, dans le
 * sens du geste et sans limite de tours ; glisser verticalement l'incline un
 * peu (±18°), puis elle se redresse sans rebond. Au relâchement elle continue
 * sur sa lancée et se cale sur la vue la plus proche, d'UN seul mouvement : la
 * courbe `--ease` part à la vitesse du geste et se pose sans dépassement.
 *
 * Le dessin est la vue projetée du moteur, demandée à `children(vue, yaw)`
 * pour chaque pose montée (voir « Poses »). Pendant le geste rien ne passe par
 * React : l'état vit dans des refs, une boucle `requestAnimationFrame` n'écrit
 * que des `transform` et des `opacity` sur des conteneurs HTML — jamais dans
 * le SVG, dont les aiguilles continuent de battre. React n'intervient qu'aux
 * changements de pose (montage, démontage), et les rendus déjà faits restent
 * en cache tant que `children` ne change pas.
 *
 * Clavier : ← → d'un quart de tour, Maj + ← → par pas de 15°, Origine pour la
 * face. `touch-action: pan-y` laisse la page défiler au doigt. Sous
 * `prefers-reduced-motion` : ni inertie ni fondu, on passe d'une vue à l'autre.
 *
 * `children` doit être stable (`useCallback`) : ses rendus sont mis en cache,
 * pour qu'un changement de pose ne redessine pas le SVG déjà en place.
 */
export function PlatineMontre({
  vue,
  cote,
  surVue,
  surClic,
  children,
  libelle,
  actions,
  className,
  classeCouche,
  commandes,
}: {
  vue: WatchView;
  /** Flanc voulu quand `vue` vaut « profil ». Absent : celui où la montre s'est calée. */
  cote?: CotePlatine;
  /** La vue sur laquelle la montre va se caler (geste, clavier, boutons). */
  surVue: (vue: WatchView, cote: CotePlatine) => void;
  /** Clic ou tap sans glisser. */
  surClic?: () => void;
  /** Rendu d'une pose : la vue cardinale la plus proche, et le lacet exact (multiple de 15°). */
  children: (vue: WatchView, yaw: number) => ReactNode;
  /** Nom du groupe, lu par les lecteurs d'écran. */
  libelle: string;
  /** Boutons posés en haut à droite du cadre (agrandir…). */
  actions?: ReactNode;
  className?: string;
  /** Classes du conteneur de chaque dessin : de quoi transmettre la hauteur. */
  classeCouche?: string;
  commandes?: Ref<CommandesPlatine>;
}) {
  const angleInitial = angleDe(vue, cote ?? "3h");
  const [montees, setMontees] = useState<number[]>([angleInitial]);
  const [annonce, setAnnonce] = useState("");
  const [indice, setIndice] = useState(false);
  const idConsigne = useId();

  const racine = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const couches = useRef(new Map<number, Couche>());
  const refsCouches = useRef(new Map<number, (noeud: HTMLDivElement | null) => void>());
  const monteesRef = useRef<number[]>([angleInitial]);
  const rendus = useRef<{ source: unknown; noeuds: Map<number, ReactNode> }>({ source: null, noeuds: new Map() });
  const surVueRef = useRef(surVue);
  const surClicRef = useRef(surClic);
  useEffect(() => {
    surVueRef.current = surVue;
    surClicRef.current = surClic;
  });

  const etat = useRef({
    angle: angleInitial,
    inclinaison: 0,
    /** Sens du mouvement en cours (+1, −1) ou 0 au repos : décide de la pose prémontée. */
    sens: 0,
    taille: 0,
    calme: false,
    glisse: false,
    anim: null as Animation | null,
    rappel: null as { de: number; debut: number } | null,
    trame: 0,
    actif: false,
  });

  /* ─────────────────────────── Écriture d'une image ─────────────────────── */
  const appliquer = useCallback(() => {
    const e = etat.current;
    const a = mod(e.angle, 360);
    const proche = poseProche(a);
    const d = ecart(a, proche);
    // Entre deux poses, la voisine est celle vers laquelle on va ; sur une
    // pose, celle du sens du mouvement — aucune au repos ou en mouvement réduit.
    const sens = Math.sign(d) || e.sens;
    const voisine = sens && !e.calme ? mod(proche + sens * PAS, 360) : null;
    // Ordre stable (croissant) : l'empilement se règle par `z-index`, React ne
    // déplace donc jamais un dessin déjà monté dans le DOM.
    const voulues = voisine === null ? [proche] : [proche, voisine].sort((a, b) => a - b);
    if (voulues.join() !== monteesRef.current.join()) {
      monteesRef.current = voulues;
      setMontees(voulues);
    }

    const cran = cranProche(e.angle);
    racine.current?.setAttribute("data-vue", cran.vue);
    racine.current?.setAttribute("data-cote", cran.cote);
    if (scene.current) scene.current.style.transform = Math.abs(e.inclinaison) < 0.01 ? "" : `rotateX(${arrondi(e.inclinaison)}deg)`;

    // Part de la voisine à cet écart : nulle jusqu'à FONDU_DEBUT, la moitié à mi-chemin.
    const fondu = 0.5 * borne((Math.abs(d) - FONDU_DEBUT) / (PAS / 2 - FONDU_DEBUT), 0, 1);
    for (const [pose, couche] of couches.current) {
      const opacite = pose === proche ? 1 : pose === voisine ? fondu : 0;
      const k = borne(largeur(a) / largeur(pose), 1 - ETIREMENT_MAX, 1 + ETIREMENT_MAX);
      const transform = Math.abs(k - 1) < 0.0005 ? "" : `scaleX(${arrondi(k, 4)})`;
      const ordre = pose === voisine ? "2" : "1";
      const texteOpacite = opacite >= 0.999 ? "" : String(arrondi(opacite, 3));
      if (texteOpacite !== couche.opacite) {
        couche.opacite = texteOpacite;
        couche.noeud.style.opacity = texteOpacite;
      }
      if (transform !== couche.transform) {
        couche.transform = transform;
        couche.noeud.style.transform = transform;
      }
      if (ordre !== couche.ordre) {
        couche.ordre = ordre;
        couche.noeud.style.zIndex = ordre;
      }
      const cache = opacite < 0.5 ? "true" : "";
      if (cache !== couche.cache) {
        couche.cache = cache;
        if (cache) couche.noeud.setAttribute("aria-hidden", "true");
        else couche.noeud.removeAttribute("aria-hidden");
        couche.noeud.style.pointerEvents = cache ? "none" : "";
      }
    }
  }, []);

  /* ─────────────────────────────── Boucle ───────────────────────────────── */
  const reposer = useCallback(() => {
    const e = etat.current;
    e.actif = false;
    e.sens = 0;
    e.angle = mod(e.angle, 360);
    racine.current?.removeAttribute("data-mouvement");
    // Au repos, seule la pose courante reste montée.
    appliquer();
  }, [appliquer]);

  const battre = useCallback(
    (instant: number) => {
      const e = etat.current;
      e.trame = 0;
      if (e.anim) {
        const p = Math.min(1, (instant - e.anim.debut) / e.anim.duree);
        e.angle = e.anim.de + (e.anim.vers - e.anim.de) * e.anim.courbe(p);
        if (p >= 1) {
          e.angle = e.anim.vers;
          e.anim = null;
        }
      }
      if (e.rappel) {
        const t = Math.max(0, instant - e.rappel.debut) / 1000;
        e.inclinaison = e.rappel.de * (1 + RAPPEL * t) * Math.exp(-RAPPEL * t);
        if (Math.abs(e.inclinaison) < 0.03) {
          e.inclinaison = 0;
          e.rappel = null;
        }
      }
      appliquer();
      if (e.anim || e.rappel) e.trame = requestAnimationFrame(battre);
      else if (!e.glisse) reposer();
    },
    [appliquer, reposer],
  );

  const reveiller = useCallback(() => {
    const e = etat.current;
    if (!e.actif) {
      e.actif = true;
      // `will-change` (posé par `[data-mouvement]`) ne vit que le temps du mouvement.
      racine.current?.setAttribute("data-mouvement", "");
    }
    if (!e.trame) e.trame = requestAnimationFrame(battre);
  }, [battre]);

  const congedierIndice = useCallback(() => {
    try {
      sessionStorage.setItem(CLE_INDICE, "vu");
    } catch {
      /* Navigation privée : l'indice reviendra, rien de grave. */
    }
    setIndice(false);
  }, []);

  /** Lance l'angle vers une cible ; `vitesse` (°/ms) est celle du geste, s'il y en a un. */
  const viser = useCallback(
    (cible: number, vitesse = 0) => {
      const e = etat.current;
      const cran = cranProche(cible);
      if (mod(cible, 90) === 0) {
        surVueRef.current(cran.vue, cran.cote);
        setAnnonce(`Vue affichée : ${LIBELLES[cran.vue]}${cran.vue === "profil" ? (cran.cote === "3h" ? ", côté couronne" : ", côté opposé à la couronne") : ""}`);
      }
      const distance = cible - e.angle;
      // Cadre invisible (dialogue fermé) ou mouvement réduit : on y est, sans trajet.
      if (e.calme || e.taille === 0 || Math.abs(distance) < 0.05) {
        e.anim = null;
        e.angle = cible;
        e.inclinaison = 0;
        e.rappel = null;
        e.sens = 0;
        appliquer();
        if (!e.glisse) reposer();
        return;
      }
      const tokens = getComputedStyle(document.documentElement);
      const enRoute = e.anim !== null || Math.abs(vitesse) > 0.02;
      // En route (lancée, touche répétée) : `--ease`, qui part vite et se pose.
      // Depuis l'arrêt (sélecteur, bouton) : `--ease-passage`, qui démarre en douceur.
      const points = enRoute ? lireBezier(tokens, "--ease", REPLI.ease) : lireBezier(tokens, "--ease-passage", REPLI.passage);
      const duree0 = lireDuree(tokens, "--d-scene", REPLI.scene);
      const a = Math.abs(distance);
      let duree = duree0 * (0.62 + a / 240);
      if (Math.abs(vitesse) > 0.02 && Math.sign(vitesse) === Math.sign(distance) && points[0] > 0) {
        // La pente initiale de la courbe vaut y1/x1 : on choisit la durée pour
        // que l'animation parte exactement à la vitesse du doigt.
        const accordee = ((points[1] / points[0]) * a) / Math.abs(vitesse);
        duree = Math.min(Math.max(accordee, duree0 * 0.5), duree0 * 0.6 + a * 4.2);
      }
      e.sens = Math.sign(distance);
      e.anim = { de: e.angle, vers: cible, debut: performance.now(), duree, courbe: bezier(points) };
      reveiller();
    },
    [appliquer, reposer, reveiller],
  );

  const cibleCourante = useCallback(() => {
    const e = etat.current;
    return e.anim ? e.anim.vers : e.angle;
  }, []);

  const montrer = useCallback(
    (voulue: WatchView, coteVoulu?: CotePlatine) => {
      const e = etat.current;
      const candidats = voulue === "profil" ? (coteVoulu ? [angleDe("profil", coteVoulu)] : [90, 270]) : [angleDe(voulue, "3h")];
      // Le plus court chemin depuis l'angle courant ; à égalité, le côté couronne.
      let meilleur = ecart(candidats[0] ?? 0, e.angle);
      for (const candidat of candidats.slice(1)) {
        const trajet = ecart(candidat, e.angle);
        if (Math.abs(trajet) < Math.abs(meilleur) - 0.01) meilleur = trajet;
      }
      // Demi-tour : les deux chemins se valent, on passe par le côté couronne.
      if (Math.abs(meilleur) > 179.9) meilleur = 180;
      viser(e.angle + meilleur);
    },
    [viser],
  );

  const tourner = useCallback(
    (sens: 1 | -1, pas = 90) => {
      congedierIndice();
      const depart = cibleCourante();
      // Un quart de tour part du cran ; un pas de 15° de là où l'on est.
      const cible = pas === 90 ? (sens > 0 ? Math.floor(depart / 90 + 1.001) : Math.ceil(depart / 90 - 1.001)) * 90 : depart + sens * pas;
      viser(cible, etat.current.anim ? sens * 0.05 : 0);
    },
    [cibleCourante, congedierIndice, viser],
  );

  useImperativeHandle(
    commandes,
    () => ({
      montrer: (voulue) => {
        congedierIndice();
        montrer(voulue);
      },
      tourner: (sens) => tourner(sens),
    }),
    [congedierIndice, montrer, tourner],
  );

  /* La vue demandée par le parent (sélecteur, autre platine) : on y tourne,
     sauf si l'on y est déjà ou qu'on y va. */
  useEffect(() => {
    const cran = cranProche(cibleCourante());
    const calee = mod(cibleCourante(), 90) === 0;
    if (calee && cran.vue === vue && (vue !== "profil" || cote === undefined || cran.cote === cote)) return;
    montrer(vue, vue === "profil" ? cote : undefined);
  }, [vue, cote, cibleCourante, montrer]);

  /* ─────────────────────── Mesure, mouvement réduit, indice ─────────────── */
  useLayoutEffect(() => {
    const noeud = zone.current;
    if (!noeud) return;
    const mesurer = () => {
      etat.current.taille = Math.min(noeud.clientWidth, noeud.clientHeight);
      appliquer();
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(noeud);
    return () => observateur.disconnect();
  }, [appliquer]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lire = () => {
      etat.current.calme = media.matches;
    };
    lire();
    media.addEventListener("change", lire);
    let vu = true;
    try {
      vu = sessionStorage.getItem(CLE_INDICE) === "vu";
    } catch {
      /* Pas de stockage : pas d'indice, plutôt qu'un indice qui reviendrait sans cesse. */
    }
    if (!vu) setIndice(true);
    const e = etat.current;
    return () => {
      media.removeEventListener("change", lire);
      if (e.trame) cancelAnimationFrame(e.trame);
      e.trame = 0;
    };
  }, []);

  // Une pose qui vient d'être montée reçoit son opacité et son étirement avant la première image.
  useLayoutEffect(() => {
    appliquer();
  }, [montees, appliquer]);

  /* ─────────────────────────────── Geste ────────────────────────────────── */
  useEffect(() => {
    const noeud = zone.current;
    if (!noeud) return;
    const e = etat.current;
    let appui: { id: number; x: number; y: number; angle: number; tactile: boolean; attrape: boolean } | null = null;
    let avalerClic = false;
    let echantillons: { t: number; angle: number }[] = [];

    const lacher = (vitesse: number, dx: number) => {
      e.glisse = false;
      noeud.removeAttribute("data-geste");
      if (Math.abs(e.inclinaison) > 0.03) e.rappel = { de: e.inclinaison, debut: performance.now() };
      else e.inclinaison = 0;
      if (e.calme) {
        // Mouvement réduit : le geste vaut un quart de tour, sans trajet.
        const depart = cranProche(e.angle).angle + Math.round((e.angle - cranProche(e.angle).angle) / 360) * 360;
        viser(Math.abs(dx) > 24 ? depart + (dx < 0 ? 90 : -90) : depart);
        return;
      }
      const elan = Math.max(-LANCEE_MAX, Math.min(LANCEE_MAX, vitesse * FRICTION));
      viser(Math.round((e.angle + elan) / 90) * 90, vitesse);
      reveiller();
    };

    const surAppui = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (!event.isPrimary) return;
      const attrape = e.anim !== null;
      // Rattraper la montre en pleine lancée l'arrête net, sous le doigt.
      e.anim = null;
      appui = { id: event.pointerId, x: event.clientX, y: event.clientY, angle: e.angle, tactile: event.pointerType === "touch", attrape };
      echantillons = [];
      avalerClic = attrape;
    };

    const surMouvement = (event: PointerEvent) => {
      if (!appui || event.pointerId !== appui.id) return;
      const dx = event.clientX - appui.x;
      const dy = event.clientY - appui.y;
      if (!e.glisse) {
        if (Math.hypot(dx, dy) < SEUIL_GESTE) return;
        // Au doigt, un départ vertical appartient à la page : on la laisse défiler.
        if (appui.tactile && Math.abs(dx) <= Math.abs(dy)) {
          const attrape = appui.attrape;
          appui = null;
          if (attrape) lacher(0, 0);
          return;
        }
        e.glisse = true;
        avalerClic = true;
        e.rappel = null;
        appui = { ...appui, x: event.clientX, y: event.clientY, angle: e.angle };
        try {
          noeud.setPointerCapture(event.pointerId);
        } catch {
          /* Pointeur déjà relâché. */
        }
        noeud.setAttribute("data-geste", "");
        congedierIndice();
        reveiller();
        return;
      }
      // Le reflet d'`InteractiveWatch` écoute `pointermove` sur `window` : pendant
      // le geste il ne reçoit rien, et ne redessine donc pas le SVG à chaque image.
      event.stopPropagation();
      const taille = e.taille || 1;
      if (!e.calme) {
        // La surface suit le doigt : un cadre de large ≈ 170°.
        const angle = appui.angle - (dx * 170) / taille;
        if (angle !== e.angle) e.sens = Math.sign(angle - e.angle);
        e.angle = angle;
        const brut = (-dy * 60) / taille;
        e.inclinaison = INCLINAISON_MAX * Math.tanh(brut / INCLINAISON_MAX);
      }
      echantillons.push({ t: event.timeStamp, angle: e.angle });
      if (echantillons.length > 8) echantillons.shift();
      reveiller();
    };

    const surRelache = (event: PointerEvent) => {
      if (!appui || event.pointerId !== appui.id) return;
      const { attrape, x } = appui;
      appui = null;
      if (!e.glisse) {
        if (attrape) lacher(0, 0);
        return;
      }
      const dernier = echantillons[echantillons.length - 1];
      let vitesse = 0;
      // Doigt immobile depuis plus de 120 ms : il a posé la montre, pas lancé.
      if (dernier && event.timeStamp - dernier.t < 120) {
        const premier = echantillons.find((echantillon) => dernier.t - echantillon.t <= 140) ?? dernier;
        if (dernier.t > premier.t) vitesse = (dernier.angle - premier.angle) / (dernier.t - premier.t);
      }
      lacher(event.type === "pointercancel" ? 0 : vitesse, event.clientX - x);
    };

    const surClicNatif = (event: MouseEvent) => {
      if (avalerClic) {
        avalerClic = false;
        event.preventDefault();
        return;
      }
      surClicRef.current?.();
    };

    noeud.addEventListener("pointerdown", surAppui);
    noeud.addEventListener("pointermove", surMouvement);
    noeud.addEventListener("pointerup", surRelache);
    noeud.addEventListener("pointercancel", surRelache);
    noeud.addEventListener("click", surClicNatif);
    return () => {
      noeud.removeEventListener("pointerdown", surAppui);
      noeud.removeEventListener("pointermove", surMouvement);
      noeud.removeEventListener("pointerup", surRelache);
      noeud.removeEventListener("pointercancel", surRelache);
      noeud.removeEventListener("click", surClicNatif);
    };
  }, [congedierIndice, reveiller, viser]);

  const surTouche = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      tourner(event.key === "ArrowLeft" ? 1 : -1, event.shiftKey && !etat.current.calme ? 15 : 90);
    } else if (event.key === "Home") {
      event.preventDefault();
      congedierIndice();
      montrer("face");
    }
  };

  /* ─────────────────────────────── Rendu ────────────────────────────────── */
  // Les rendus sont gardés par pose tant que `children` ne change pas : revenir
  // sur une pose déjà vue ne la redessine pas, et monter la voisine ne touche
  // pas à celle qui est là.
  if (rendus.current.source !== children) rendus.current = { source: children, noeuds: new Map() };
  const rendre = (pose: number) => {
    const cache = rendus.current.noeuds;
    if (!cache.has(pose)) cache.set(pose, children(cranProche(pose).vue, pose));
    return cache.get(pose);
  };
  const refCouche = (pose: number) => {
    let ref = refsCouches.current.get(pose);
    if (!ref) {
      ref = (noeud) => {
        if (!noeud) {
          couches.current.delete(pose);
          return;
        }
        couches.current.set(pose, { noeud, opacite: "\u0000", transform: "\u0000", ordre: "\u0000", cache: "\u0000" });
      };
      refsCouches.current.set(pose, ref);
    }
    return ref;
  };

  return (
    <div ref={racine} className={cn("platine", className)} data-vue={vue}>
      <div
        ref={zone}
        className="platine-zone"
        role="group"
        tabIndex={0}
        aria-label={libelle}
        aria-describedby={idConsigne}
        onKeyDown={surTouche}
        style={{ perspective: `${PERSPECTIVE}px` }}
        data-lenis-prevent=""
      >
        <div ref={scene} className="platine-scene">
          {montees.map((pose) => (
            <div key={pose} ref={refCouche(pose)} className="platine-pose" data-pose={pose}>
              <div className={cn("platine-dessin", classeCouche)}>{rendre(pose)}</div>
            </div>
          ))}
        </div>
      </div>

      <p id={idConsigne} className="sr-only">
        Glissez ou utilisez les flèches pour tourner la montre. Majuscule et flèche : par pas de 15 degrés. Origine : retour de face.
      </p>
      <p className="sr-only" aria-live="polite">
        {annonce}
      </p>

      <span aria-hidden="true" className="platine-indice type-mono rounded-pill border border-rule bg-panel text-fg-soft" data-visible={indice ? "" : undefined}>
        <IconRotation width={16} height={16} />
        Glissez pour tourner
      </span>

      <button type="button" className="platine-bouton rounded-pill border border-rule bg-panel text-fg-soft" data-sens="gauche" aria-label="Tourner la montre d'un quart de tour vers la gauche" onClick={() => tourner(1)}>
        <IconTournerGauche />
      </button>
      <button type="button" className="platine-bouton rounded-pill border border-rule bg-panel text-fg-soft" data-sens="droite" aria-label="Tourner la montre d'un quart de tour vers la droite" onClick={() => tourner(-1)}>
        <IconTournerDroite />
      </button>
      {actions ? <div className="platine-actions">{actions}</div> : null}
    </div>
  );
}
