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
   0° face, 90° flanc de 3 h, 180° dos, 270° flanc de 9 h.

   Les trois dessins sont les faces d'une boîte qui tourne autour de l'axe
   12 h – 6 h : face et dos à une demi-épaisseur de l'axe, le profil sur le
   flanc, à un rayon de boîte. Chaque dessin est donc tourné de son angle
   résiduel (`angle − cran`) PUIS poussé le long de sa normale : en tournant,
   la face se décale du côté du verre et laisse paraître le flanc derrière
   elle, comme sur un objet épais. */
const CRANS = [
  { angle: 0, vue: "face", cote: "3h" },
  { angle: 90, vue: "profil", cote: "3h" },
  { angle: 180, vue: "dos", cote: "3h" },
  { angle: 270, vue: "profil", cote: "9h" },
] as const satisfies readonly { angle: number; vue: WatchView; cote: CotePlatine }[];

const PERSPECTIVE = 1200;
/** Distances à l'axe, en fraction du côté du cadre. */
const D_PLAT = 0.085;
const D_PROFIL = 0.23;
/** Le profil est dessiné plus petit que la face (`CADRAGE` × 0,58 contre `FRAME_SCALE`). */
const ECHELLE_PROFIL = 1.19;
/** Mi-épaisseur de la carrure dans le dessin de profil : c'est elle qui se pose sur l'axe. */
const CENTRE_PROFIL = { x: 500, y: 485 };
const CENTRE = { x: 500, y: 500 };

/** Une vue à plat s'efface entre 64° et 86° d'écart, sur un profil déjà opaque :
    le fond ne transparaît jamais. Le profil, lui, n'a presque pas besoin de
    fondu : il passe DERRIÈRE la vue à plat et n'en dépasse vraiment que vers
    35°. Un fondu court (60° → 46° d'écart au sien, soit 30° → 44° de rotation)
    couvre son arrivée ; avant, seuls ses bouts de cornes dépasseraient. */
const FONDU_PLAT = [64, 86] as const;
const FONDU_PROFIL = [46, 60] as const;
/** Au-delà, la vue est démontée : le profil est donc prémonté vers 25° de rotation. */
const MONTE_PLAT = 87;
const MONTE_PROFIL = 65;

/** Fenêtre du profil : elle déborde la couche de 3 rem de chaque côté (`.platine-fenetre`),
    et son masque reste opaque jusqu'à 86 % de sa largeur. */
const MARGE_FENETRE = 48;
const BORD_FENETRE = 0.86;

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

function lisse(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function arrondi(valeur: number, decimales = 2): number {
  const k = 10 ** decimales;
  return Math.round(valeur * k) / k;
}

function cranProche(angle: number) {
  return CRANS[mod(Math.round(angle / 90), 4)] ?? CRANS[0];
}

function angleDe(vue: WatchView, cote: CotePlatine): number {
  return vue === "face" ? 0 : vue === "dos" ? 180 : cote === "9h" ? 270 : 90;
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
  contenu: HTMLDivElement | null;
  miroir: HTMLDivElement | null;
  fenetre: HTMLDivElement | null;
  contre: HTMLDivElement | null;
  voile: HTMLElement | null;
  reflet: HTMLElement | null;
  /** Recadrage du SVG (`viewBox`), lu une fois au montage. */
  cadrage: { x: number; y: number; largeur: number } | null;
  /** Dernières valeurs écrites : on n'écrit que ce qui change. */
  plan: string;
  ouverture: number;
  cote: string;
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
 * Il n'y a pas de moteur 3D : ce sont les trois dessins existants (face,
 * profil, dos), montés comme les faces d'une boîte en CSS 3D — voir
 * « Géométrie ». Au plus DEUX dessins sont montés : celui qu'on regarde et, dès
 * ~25°, son voisin. Le profil passe DERRIÈRE la vue à plat : il paraît d'abord
 * comme le flanc qui dépasse, puis la vue à plat s'efface sur lui (jamais les
 * deux translucides à la fois : le fond ne transparaît pas). Un voile côté
 * fuyant, un reflet qui glisse et l'ombre portée suivent l'angle.
 *
 * Pendant le geste rien ne passe par React : l'état vit dans des refs, une
 * boucle `requestAnimationFrame` n'écrit que des `transform` et des `opacity`
 * sur des conteneurs HTML — jamais dans le SVG, dont les aiguilles continuent
 * de tourner. React n'intervient qu'aux seuils de montage.
 *
 * Clavier : ← → d'un quart de tour, Maj + ← → par pas de 15°, Origine pour la
 * face. `touch-action: pan-y` laisse la page défiler au doigt. Sous
 * `prefers-reduced-motion` : ni 3D ni inertie, on passe d'une vue à l'autre.
 *
 * `children` doit être stable (`useCallback`) : ses rendus sont mis en cache,
 * pour qu'un seuil de montage ne redessine pas le SVG déjà en place.
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
  children: (vue: WatchView) => ReactNode;
  /** Nom du groupe, lu par les lecteurs d'écran. */
  libelle: string;
  /** Boutons posés en haut à droite du cadre (agrandir…). */
  actions?: ReactNode;
  className?: string;
  /** Classes du conteneur de chaque dessin : de quoi transmettre la hauteur. */
  classeCouche?: string;
  commandes?: Ref<CommandesPlatine>;
}) {
  const [montees, setMontees] = useState<WatchView[]>([vue]);
  const [annonce, setAnnonce] = useState("");
  const [indice, setIndice] = useState(false);
  const idConsigne = useId();

  const racine = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const ombre = useRef<HTMLSpanElement>(null);
  const couches = useRef(new Map<WatchView, Couche>());
  const refsCouches = useRef<Partial<Record<WatchView, (noeud: HTMLDivElement | null) => void>>>({});
  const monteesRef = useRef<WatchView[]>([vue]);
  const rendus = useRef<{ source: unknown; noeuds: Map<WatchView, ReactNode> }>({ source: null, noeuds: new Map() });
  const surVueRef = useRef(surVue);
  const surClicRef = useRef(surClic);
  useEffect(() => {
    surVueRef.current = surVue;
    surClicRef.current = surClic;
  });

  const etat = useRef({
    angle: angleDe(vue, cote ?? "3h"),
    inclinaison: 0,
    taille: 0,
    largeur: 0,
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
    const cote_ = e.taille;
    const voulues: WatchView[] = [];
    for (const cran of CRANS) {
      const a = Math.abs(ecart(e.angle, cran.angle));
      if (a < (cran.vue === "profil" ? MONTE_PROFIL : MONTE_PLAT) && !voulues.includes(cran.vue)) voulues.push(cran.vue);
    }
    if (voulues.join() !== monteesRef.current.join()) {
      monteesRef.current = voulues;
      setMontees(voulues);
    }

    const proche = cranProche(e.angle);
    racine.current?.setAttribute("data-vue", proche.vue);
    racine.current?.setAttribute("data-cote", proche.cote);

    for (const [vueCouche, couche] of couches.current) {
      const plat = vueCouche !== "profil";
      const cran = plat ? (vueCouche === "face" ? 0 : 180) : Math.abs(ecart(e.angle, 90)) <= Math.abs(ecart(e.angle, 270)) ? 90 : 270;
      const delta = ecart(e.angle, cran);
      const a = Math.abs(delta);
      const [debut, fin] = plat ? FONDU_PLAT : FONDU_PROFIL;
      const opacite = a >= 90 ? 0 : 1 - lisse(debut, fin, a);
      const d = (plat ? D_PLAT : D_PROFIL) * cote_;
      const auRepos = a < 0.01 && Math.abs(e.inclinaison) < 0.01;

      couche.noeud.style.opacity = opacite >= 0.999 ? "" : String(arrondi(opacite, 3));
      couche.noeud.style.transform = auRepos
        ? ""
        : `rotateX(${arrondi(e.inclinaison)}deg) rotateY(${arrondi(-delta)}deg) translateZ(${arrondi(d, 1)}px) scale(${arrondi((PERSPECTIVE - d) / PERSPECTIVE, 4)})`;
      const cache = opacite < 0.5 ? "true" : "";
      if (cache !== couche.cache) {
        couche.cache = cache;
        if (cache) couche.noeud.setAttribute("aria-hidden", "true");
        else couche.noeud.removeAttribute("aria-hidden");
        couche.noeud.style.pointerEvents = cache ? "none" : "";
      }

      // Mise à plat du dessin : miroir (flanc de 9 h), quart de tour du profil
      // (12 h en haut, verre du côté de la face), recadrage défait.
      const coteCouche = plat ? "" : cran === 270 ? "9h" : "3h";
      if (coteCouche !== couche.cote) {
        couche.cote = coteCouche;
        if (coteCouche) couche.noeud.setAttribute("data-cote", coteCouche);
        if (couche.miroir) couche.miroir.style.transform = coteCouche === "9h" ? "scaleX(-1)" : "";
      }
      if (couche.contenu) {
        const cadrage = couche.cadrage ?? { x: 500, y: 500, largeur: 1000 };
        const centre = plat ? CENTRE : CENTRE_PROFIL;
        const k = (plat ? 1 : ECHELLE_PROFIL) * (cadrage.largeur / 1000);
        const parUnite = (cote_ / cadrage.largeur) * k;
        const tx = arrondi(-(centre.x - cadrage.x) * parUnite, 1);
        const ty = arrondi(-(centre.y - cadrage.y) * parUnite, 1);
        const neutre = k === 1 && tx === 0 && ty === 0;
        const plan = plat
          ? neutre
            ? ""
            : `translate(${tx}px, ${ty}px) scale(${arrondi(k, 4)})`
          : `rotate(-90deg) translate(${tx}px, ${ty}px) scale(${arrondi(k, 4)})`;
        if (plan !== couche.plan) {
          couche.plan = plan;
          couche.contenu.style.transform = plan;
        }
      }

      // Le bracelet du profil est fermé, celui de la face posé à plat : montrés
      // ensemble, ils se contredisent. La fenêtre du profil (masque fondu, voir
      // `.platine-fenetre`) ne laisse d'abord voir que la carrure, puis s'ouvre
      // vers le fond : les brins sortent de derrière la boîte à mesure qu'elle
      // tourne. Fenêtre mise à l'échelle, contenu à l'échelle inverse : rien que
      // des `transform`.
      if (!plat && couche.fenetre && couche.contre) {
        const boite = e.largeur + 2 * MARGE_FENETRE;
        const ferme = Math.min(1, (boite / 2 + 0.13 * cote_) / (BORD_FENETRE * boite));
        const ouverture = arrondi(ferme + (1 - ferme) * (1 - lisse(14, 50, a)), 4);
        if (ouverture !== couche.ouverture) {
          couche.ouverture = ouverture;
          couche.fenetre.style.transform = ouverture >= 0.9999 ? "" : `scaleX(${ouverture})`;
          couche.contre.style.transform = ouverture >= 0.9999 ? "" : `scaleX(${arrondi(1 / ouverture, 4)})`;
        }
      }

      // Lumière : le côté qui fuit s'assombrit, un reflet traverse la pièce.
      const fuite = Math.sin((Math.min(a, 90) * Math.PI) / 180);
      if (couche.voile) {
        // La lumière du studio vient de la gauche : tournée vers la droite, la pièce s'assombrit davantage.
        couche.voile.style.opacity = String(arrondi(fuite * (delta < 0 ? 1 : 0.72), 3));
        couche.voile.style.transform = delta < 0 ? "scaleX(-1)" : "";
      }
      if (couche.reflet) {
        couche.reflet.style.opacity = String(arrondi(Math.sin((Math.min(a, 90) * Math.PI) / 90) * opacite, 3));
        couche.reflet.style.transform = `translateX(${arrondi((-delta / 90) * (plat ? 85 : 24), 1)}%) skewX(-14deg)`;
      }
    }

    // L'ombre portée épouse la silhouette : large de face, mince de profil. Les
    // vues à plat portent déjà la leur dans le dessin : celle-ci prend le relais
    // à mesure que le profil s'installe.
    if (ombre.current) {
      const rad = (e.angle * Math.PI) / 180;
      const largeur = Math.abs(Math.cos(rad)) + (D_PLAT / D_PROFIL) * 1.4 * Math.abs(Math.sin(rad));
      ombre.current.style.opacity = String(arrondi(Math.sin(rad) ** 2, 3));
      ombre.current.style.transform = `translate(3%, 4%) scaleX(${arrondi(Math.min(1, largeur), 3)})`;
    }
  }, []);

  /* ─────────────────────────────── Boucle ───────────────────────────────── */
  const reposer = useCallback(() => {
    const e = etat.current;
    e.actif = false;
    e.angle = mod(e.angle, 360);
    racine.current?.removeAttribute("data-mouvement");
  }, []);

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
        appliquer();
        if (!e.glisse) reposer();
        return;
      }
      const tokens = getComputedStyle(document.documentElement);
      const enRoute = e.anim !== null || Math.abs(vitesse) > 0.02;
      // En route (lancée, touche répétée) : `--ease`, qui part vite et se pose.
      // Depuis l'arrêt (sélecteur, bouton) : `--ease-passage`, qui démarre en douceur.
      const points = enRoute ? lireBezier(tokens, "--ease", REPLI.ease) : lireBezier(tokens, "--ease-passage", REPLI.passage);
      const scene = lireDuree(tokens, "--d-scene", REPLI.scene);
      const a = Math.abs(distance);
      let duree = scene * (0.62 + a / 240);
      if (Math.abs(vitesse) > 0.02 && Math.sign(vitesse) === Math.sign(distance) && points[0] > 0) {
        // La pente initiale de la courbe vaut y1/x1 : on choisit la durée pour
        // que l'animation parte exactement à la vitesse du doigt.
        const accordee = ((points[1] / points[0]) * a) / Math.abs(vitesse);
        duree = Math.min(Math.max(accordee, scene * 0.5), scene * 0.6 + a * 4.2);
      }
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
      etat.current.largeur = noeud.clientWidth;
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

  // Une couche qui vient d'être montée reçoit sa pose avant la première image.
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
        e.angle = appui.angle - (dx * 170) / taille;
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
  // Les rendus sont gardés tant que `children` ne change pas : monter la vue
  // voisine ne redessine pas celle qui est déjà là.
  if (rendus.current.source !== children) rendus.current = { source: children, noeuds: new Map() };
  const rendre = (vueCouche: WatchView) => {
    const cache = rendus.current.noeuds;
    if (!cache.has(vueCouche)) cache.set(vueCouche, children(vueCouche));
    return cache.get(vueCouche);
  };
  const refCouche = (vueCouche: WatchView) =>
    (refsCouches.current[vueCouche] ??= (noeud) => {
      if (!noeud) {
        couches.current.delete(vueCouche);
        return;
      }
      const svg = noeud.querySelector("svg[viewBox]");
      const boite = svg instanceof SVGSVGElement ? svg.viewBox.baseVal : null;
      couches.current.set(vueCouche, {
        noeud,
        contenu: noeud.querySelector<HTMLDivElement>(".platine-dessin"),
        miroir: noeud.querySelector<HTMLDivElement>(":scope > .platine-miroir"),
        fenetre: noeud.querySelector<HTMLDivElement>(".platine-fenetre"),
        contre: noeud.querySelector<HTMLDivElement>(".platine-contre"),
        voile: noeud.querySelector<HTMLElement>(":scope > .platine-voile"),
        reflet: noeud.querySelector<HTMLElement>(":scope > .platine-reflet"),
        cadrage: boite && boite.width > 0 ? { x: boite.x + boite.width / 2, y: boite.y + boite.height / 2, largeur: boite.width } : null,
        plan: "\u0000",
        ouverture: -1,
        cote: "\u0000",
        cache: "\u0000",
      });
    });

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
      >
        <span ref={ombre} aria-hidden="true" className="platine-ombre" />
        {montees.map((vueCouche) => (
          <div key={vueCouche} ref={refCouche(vueCouche)} className="platine-couche" data-couche={vueCouche}>
            <div className="platine-miroir">
              <div className="platine-fenetre">
                <div className="platine-contre">
                  <div className={cn("platine-dessin", classeCouche)}>{rendre(vueCouche)}</div>
                </div>
              </div>
            </div>
            <span aria-hidden="true" className="platine-voile" />
            <span aria-hidden="true" className="platine-reflet" />
          </div>
        ))}
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
