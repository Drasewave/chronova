"use client";

import { useEffect } from "react";
import { teintesDauphine, teintesFacettes } from "./facettes";
import { METALS } from "./palette";
import type { MetalTone } from "./types";

/**
 * L'horloge du site. Toutes les montres dessinées par `WatchSvg` sortent du
 * serveur à 10 h 10 min 37 s — la pose de catalogue, identique pour tout le
 * monde, donc sans écart d'hydratation. Une fois la page montée, ce composant
 * (un seul, dans le layout racine) les met à l'heure du visiteur et les y tient.
 *
 * Il ne rend rien et ne passe pas par React : il retrouve dans le DOM les
 * groupes tournants (`data-aiguille`, posés par `parts/hands.tsx` et
 * `parts/dial.tsx`) et écrit leur attribut `transform`. `WatchSvg` reste un
 * composant pur ; comme ses props ne changent pas, React ne réécrit jamais
 * par-dessus, même quand `InteractiveWatch` re-rend pour le reflet.
 *
 * Une seule boucle `requestAnimationFrame`, une seule lecture de `Date.now()`
 * par image, une seule table d'angles partagée : toutes les montres battent
 * donc ensemble, au degré près. La boucle ne fait rien entre deux battements
 * (une comparaison d'entiers), n'écrit que dans les montres visibles
 * (`IntersectionObserver`) et s'arrête quand l'onglet est masqué.
 *
 * Ce que chaque calibre montre :
 *  - NH35, NH36, NH34, NH38 (automatiques, 21 600 alternances/heure ; le NH36
 *    est un NH35 à disque des jours, il bat donc comme lui) : la trotteuse
 *    avance de six pas par seconde, un degré par pas — ni continue, ni saccadée
 *    à la seconde. C'est le « glissé » d'un mécanique japonais.
 *  - VK64 (méca-quartz) : la grande aiguille centrale est celle du
 *    chronographe ; arrêté et remis à zéro, il la tient à midi, et le
 *    totalisateur « MIN » avec elle. La seconde courante vit dans le compteur
 *    « SEC », qui bat une fois par seconde, comme un quartz. Le serveur rend
 *    déjà cet état (`parts/hands.tsx`, `parts/dial.tsx`) : seule l'heure change.
 *  - Heures et minutes : recalées à chaque seconde (0,1° pour la minute, moins
 *    d'un quart de pixel : l'œil lit un mouvement continu), sur la même valeur
 *    pour toutes les montres.
 *  - GMT (NH34) : un tour en 24 h, réglé sur l'heure locale du visiteur, comme
 *    une GMT sortie de sa boîte avant qu'on ne règle un second fuseau. En
 *    afficher un autre serait inventer un voyage. (La pose de catalogue, elle,
 *    montre un second fuseau comme une photographie : `POSE_GMT_OFFSET_DEG`.)
 *  - Guichets : jour et quantième du jour, en français ; la loupe suit.
 *
 * Arrivée : les montres visibles au chargement rejoignent l'heure par un
 * balayage amorti, dans le sens le plus court, puis passent en temps réel. Dans
 * le héros, ce balayage attend la fin du retard d'entrée (`arrivee-montre`,
 * voir « Ouverture » dans globals.css) pour se jouer sous le volet qui se lève.
 * Toute montre montée plus tard (défilé du héros, navigation, zoom) est posée à
 * l'heure avant sa première image : pas de balayage à chaque diapositive.
 *
 * `prefers-reduced-motion` : pas de balayage, pas de boucle. Heures, minutes,
 * GMT et guichets sont posés directement puis recalés à chaque minute ; les
 * aiguilles de seconde gardent leur pose de catalogue, immobiles.
 */

type Role = "heure" | "minute" | "seconde" | "gmt" | "petite-seconde" | "compteur-minutes";

const ROLES: readonly Role[] = ["heure", "minute", "seconde", "gmt", "petite-seconde", "compteur-minutes"];
const JOURS = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"] as const;

/** Durée du balayage d'arrivée. */
const DUREE_BALAYAGE_MS = 1200;
/**
 * Pas de marge d'observation : faire battre une montre, c'est la faire repeindre
 * six fois par seconde, et ce coût-là (celui du navigateur, pas du script) se
 * paie par montre. On ne le paie donc que dans la fenêtre. Le premier pixel
 * qui entre est un bout de bracelet : les aiguilles, recalées à chaque minute
 * même hors champ, sont remises à la seconde bien avant d'être vues.
 */
const MARGE_VISIBILITE = "0px";
/** Rotation au-delà de laquelle la facette éclairée est recalculée. */
const SEUIL_FACETTE_DEG = 1;

interface Aiguille {
  el: SVGElement;
  role: Role;
  /** Dernier `transform` écrit : on ne touche au DOM que s'il change. */
  ecrit: string;
  /** Angle posé dans le DOM, source du balayage d'arrivée. */
  angle: number;
  /** Chemin restant au départ du balayage, sens le plus court ; NaN tant qu'il n'est pas lancé. */
  ecart: number;
}

interface Facette {
  role: Role;
  /** Porte `data-metal` : le dégradé, ou le premier versant d'une dauphine. */
  porteur: Element;
  gauche: Element;
  droite: Element;
  attribut: "stop-color" | "fill";
  dauphine: boolean;
  metal: string;
  /** Angle du dernier calcul ; NaN force le premier. */
  angle: number;
}

interface Montre {
  svg: SVGSVGElement;
  /** VK64 : seconde au compteur, chronographe à zéro. */
  quartz: boolean;
  aiguilles: Aiguille[];
  facettes: Facette[];
  guichets: { el: Element; genre: "jour" | "quantieme" }[];
  visible: boolean;
  /** Pas encore vue par l'observateur d'intersection. */
  nouvelle: boolean;
  /** Présente au chargement : elle a droit au balayage si elle est visible. */
  balayageVoulu: boolean;
  /** Début du balayage (horloge `Date.now()`), 0 quand il n'y en a pas. */
  arrivee: number;
}

/** Démarre l'horloge ; renvoie de quoi tout arrêter. */
function demarrer(calme: boolean, avecBalayage: boolean): () => void {
  const montres = new Map<Element, Montre>();
  const balayages = new Set<Montre>();
  let visibles = 0;
  let trame = 0;
  let minuteur = 0;

  // La table partagée : recalculée au plus une fois par battement, lue par toutes les montres.
  let battement = -1;
  let seconde = -1;
  let minute = -1;
  let decalageMs = 0;
  let jour = "";
  let quantieme = "";
  const angles: Record<Role, number> = { heure: 0, minute: 0, seconde: 0, gmt: 0, "petite-seconde": 0, "compteur-minutes": 0 };
  const textes: Record<Role, string> = { heure: "", minute: "", seconde: "", gmt: "", "petite-seconde": "", "compteur-minutes": "rotate(0)" };

  /** Met la table à l'heure `t`. Renvoie ce qui a changé : 0 rien, 1 battement, 2 seconde, 3 minute. */
  const lireHeure = (t: number): 0 | 1 | 2 | 3 => {
    const m = Math.floor(t / 60000);
    let change: 0 | 1 | 2 | 3 = 0;
    if (m !== minute) {
      // Fuseau et date ne bougent qu'à la minute : on ne construit un `Date` qu'ici.
      minute = m;
      const d = new Date(t);
      decalageMs = -d.getTimezoneOffset() * 60000;
      jour = JOURS[d.getDay()] ?? "";
      quantieme = String(d.getDate());
      change = 3;
    }
    const local = t + decalageMs;
    // Sous mouvement réduit, l'heure avance par minutes entières.
    const s = calme ? Math.floor(local / 60000) * 60 : Math.floor(local / 1000);
    if (s !== seconde) {
      seconde = s;
      const jourS = ((s % 86400) + 86400) % 86400;
      angles.heure = (jourS % 43200) / 120;
      angles.minute = (jourS % 3600) / 10;
      angles.gmt = jourS / 240;
      angles["petite-seconde"] = (jourS % 60) * 6;
      for (const role of ["heure", "minute", "gmt", "petite-seconde"] as const) textes[role] = rotation(angles[role]);
      if (change < 2) change = 2;
    }
    // 21 600 alternances/heure : six pas par seconde, soit un degré par pas.
    const b = Math.floor((local * 6) / 1000);
    if (b !== battement) {
      battement = b;
      angles.seconde = ((b % 360) + 360) % 360;
      textes.seconde = rotation(angles.seconde);
      if (change < 1) change = 1;
    }
    return change;
  };

  /** Angle que doit montrer une aiguille ; NaN = on n'y touche pas. */
  const cible = (montre: Montre, role: Role): number => {
    if (role === "seconde") return montre.quartz ? 0 : calme ? Number.NaN : angles.seconde;
    if (role === "petite-seconde") return calme ? Number.NaN : angles["petite-seconde"];
    if (role === "compteur-minutes") return 0;
    return angles[role];
  };

  const ecrire = (aiguille: Aiguille, angle: number, texte: string) => {
    aiguille.angle = angle;
    if (texte === aiguille.ecrit) return;
    aiguille.ecrit = texte;
    aiguille.el.setAttribute("transform", texte);
  };

  /** La facette éclairée suit l'aiguille : mêmes formules que le rendu serveur. */
  const ombrer = (montre: Montre, seuil: number) => {
    for (const f of montre.facettes) {
      let angle = Number.NaN;
      for (const a of montre.aiguilles) if (a.role === f.role) angle = a.angle;
      if (Number.isNaN(angle)) continue;
      // Le configurateur peut changer le métal sous nos pieds : React réécrit alors la teinte de catalogue.
      const metal = f.porteur.getAttribute("data-metal") ?? "";
      if (metal === f.metal && Math.abs(plusCourt(angle - f.angle)) < seuil) continue;
      if (!(metal in METALS)) continue;
      f.metal = metal;
      f.angle = angle;
      const [gauche, droite] = f.dauphine ? teintesDauphine(metal as MetalTone, angle) : teintesFacettes(metal as MetalTone, angle);
      f.gauche.setAttribute(f.attribut, gauche);
      f.droite.setAttribute(f.attribut, droite);
    }
  };

  const dater = (montre: Montre) => {
    for (const g of montre.guichets) {
      const texte = g.genre === "jour" ? jour : quantieme;
      if (!texte || g.el.textContent === texte) continue;
      // On réécrit le nœud de texte en place plutôt que de le remplacer : React
      // garde le sien, et notre propre observateur de mutations n'est pas réveillé.
      const noeud = g.el.firstChild;
      if (noeud && noeud.nodeType === Node.TEXT_NODE) noeud.nodeValue = texte;
      else g.el.textContent = texte;
    }
  };

  /** Pose directe à l'heure de la table. */
  const poser = (montre: Montre, facettes: boolean) => {
    for (const a of montre.aiguilles) {
      const angle = cible(montre, a.role);
      if (Number.isNaN(angle)) continue;
      const texte = a.role === "seconde" && montre.quartz ? "rotate(0)" : textes[a.role];
      ecrire(a, angle, texte);
    }
    if (facettes) ombrer(montre, calme ? 0 : SEUIL_FACETTE_DEG);
  };

  /** Une image du balayage d'arrivée ; renvoie `true` quand il est fini. */
  const balayer = (montre: Montre, t: number): boolean => {
    const p = (t - montre.arrivee) / DUREE_BALAYAGE_MS;
    if (p < 0) return false; // le héros est encore sous le rideau
    if (p >= 1) {
      montre.arrivee = 0;
      poser(montre, true);
      return true;
    }
    // Départ et arrivée à vitesse nulle, l'essentiel du chemin fait au premier tiers :
    // l'aiguille s'élance puis se pose, comme sous les doigts qui lâchent la couronne.
    const reste = (1 - p) ** 3 * (1 + 3 * p);
    for (const a of montre.aiguilles) {
      const but = cible(montre, a.role);
      if (Number.isNaN(but)) continue;
      if (Number.isNaN(a.ecart)) a.ecart = plusCourt(but - a.angle);
      const angle = but - a.ecart * reste;
      ecrire(a, angle, rotation(angle));
    }
    ombrer(montre, 2);
    return false;
  };

  // `battreHorloge` : le nom sert aux mesures de performance (scripts Playwright).
  const battreHorloge = () => {
    trame = requestAnimationFrame(battreHorloge);
    const t = Date.now();
    const change = lireHeure(t);
    if (change === 0 && balayages.size === 0) return;

    for (const montre of balayages) if (balayer(montre, t)) balayages.delete(montre);
    if (change === 0) return;

    for (const montre of montres.values()) {
      if (montre.arrivee) continue;
      // Hors champ, un recalage par minute suffit : la montre n'est jamais loin
      // de l'heure quand elle réapparaît (tiroir du panier, retour d'onglet).
      if (!montre.visible && change < 3) continue;
      poser(montre, change >= 2);
      if (change === 3) dater(montre);
    }
  };

  /** Mouvement réduit : pas de boucle, un recalage à chaque minute ronde. */
  const battreMinute = () => {
    const t = Date.now();
    lireHeure(t);
    for (const montre of montres.values()) {
      poser(montre, true);
      dater(montre);
    }
    minuteur = window.setTimeout(battreMinute, 60000 - (t % 60000) + 50);
  };

  const regler = () => {
    if (calme) return;
    const utile = !document.hidden && (visibles > 0 || balayages.size > 0);
    if (utile && !trame) trame = requestAnimationFrame(battreHorloge);
    if (!utile && trame) {
      cancelAnimationFrame(trame);
      trame = 0;
    }
  };

  /** Relève les pièces mobiles d'une montre. Refait après chaque retouche de son SVG par React. */
  const inventorier = (montre: Montre) => {
    const anciennes = new Map(montre.aiguilles.map((a) => [a.el, a]));
    montre.aiguilles = [];
    for (const el of montre.svg.querySelectorAll<SVGElement>("[data-aiguille]")) {
      const role = el.getAttribute("data-aiguille") as Role;
      if (!ROLES.includes(role)) continue;
      const connue = anciennes.get(el);
      if (connue) {
        montre.aiguilles.push(connue);
        continue;
      }
      const lu = /rotate\(\s*(-?[\d.]+)/.exec(el.getAttribute("transform") ?? "");
      montre.aiguilles.push({ el, role, ecrit: "", angle: lu ? Number(lu[1]) : 0, ecart: Number.NaN });
    }
    montre.facettes = [];
    for (const degrade of montre.svg.querySelectorAll("[data-facette]")) {
      const stops = degrade.querySelectorAll("stop");
      const [gauche, droite] = [stops[0], stops[1]];
      if (!gauche || !droite) continue;
      const role = degrade.getAttribute("data-facette") as Role;
      montre.facettes.push({ role, porteur: degrade, gauche, droite, attribut: "stop-color", dauphine: false, metal: "", angle: Number.NaN });
    }
    for (const gauche of montre.svg.querySelectorAll('[data-versant="gauche"]')) {
      const groupe = gauche.closest("[data-aiguille]");
      const droite = groupe?.querySelector('[data-versant="droit"]');
      if (!groupe || !droite) continue;
      const role = groupe.getAttribute("data-aiguille") as Role;
      montre.facettes.push({ role, porteur: gauche, gauche, droite, attribut: "fill", dauphine: true, metal: "", angle: Number.NaN });
    }
    montre.guichets = [];
    for (const el of montre.svg.querySelectorAll("[data-guichet]")) {
      const genre = el.getAttribute("data-guichet");
      if (genre === "jour" || genre === "quantieme") montre.guichets.push({ el, genre });
    }
  };

  const observateur = new IntersectionObserver(
    (entrees) => {
      const t = Date.now();
      lireHeure(t);
      for (const entree of entrees) {
        const montre = montres.get(entree.target);
        if (!montre) continue;
        if (montre.visible !== entree.isIntersecting) visibles += entree.isIntersecting ? 1 : -1;
        montre.visible = entree.isIntersecting;
        const premiere = montre.nouvelle;
        montre.nouvelle = false;
        if (premiere && montre.visible && montre.balayageVoulu && !calme) {
          montre.arrivee = t + retardEntree(montre.svg);
          balayages.add(montre);
        } else if (!montre.arrivee && (montre.visible || premiere)) {
          poser(montre, true);
        }
        if (premiere) dater(montre);
      }
      regler();
    },
    { rootMargin: MARGE_VISIBILITE },
  );

  const oublier = (svg: Element) => {
    const montre = montres.get(svg);
    if (!montre) return;
    observateur.unobserve(svg);
    balayages.delete(montre);
    if (montre.visible) visibles -= 1;
    montres.delete(svg);
  };

  /** Enregistre (ou relève à nouveau) la montre d'un SVG qui porte des aiguilles vivantes. */
  const adopter = (svg: SVGSVGElement, auChargement: boolean) => {
    const groupe = svg.querySelector('[data-layer="aiguilles"][data-heure="vivante"]');
    if (!groupe) {
      // Le même SVG peut passer de la face au dos (configurateur) : plus d'aiguilles, plus de montre à tenir.
      oublier(svg);
      return;
    }
    const quartz = groupe.getAttribute("data-calibre") === "VK64";
    let montre = montres.get(svg);
    if (montre) {
      montre.quartz = quartz;
      inventorier(montre);
    } else {
      montre = { svg, quartz, aiguilles: [], facettes: [], guichets: [], visible: false, nouvelle: true, balayageVoulu: auChargement, arrivee: 0 };
      inventorier(montre);
      montres.set(svg, montre);
      observateur.observe(svg);
    }
    // Une montre qui arrive après coup est mise à l'heure tout de suite — le
    // `MutationObserver` rappelle avant la première image, elle n'est donc
    // jamais vue à 10 h 10. Celles du chargement attendent de savoir si elles
    // sont visibles : balayage pour celles-ci, pose directe pour les autres.
    if (!auChargement && !montre.arrivee) {
      lireHeure(Date.now());
      poser(montre, true);
      dater(montre);
    }
  };

  const mutations = new MutationObserver((lots) => {
    const aRevoir = new Set<SVGSVGElement>();
    let retraits = false;
    for (const lot of lots) {
      if (lot.removedNodes.length) retraits = true;
      for (const noeud of lot.addedNodes) {
        if (!(noeud instanceof Element)) continue;
        const svg = noeud.closest("svg");
        if (svg) aRevoir.add(svg);
        else for (const g of noeud.querySelectorAll<SVGGElement>('[data-layer="aiguilles"]')) if (g.ownerSVGElement) aRevoir.add(g.ownerSVGElement);
      }
    }
    // Ménage : sans lui, vingt navigations laisseraient vingt pages de montres en mémoire.
    if (retraits) {
      for (const svg of [...montres.keys()]) if (!svg.isConnected) oublier(svg);
    }
    for (const svg of aRevoir) if (svg.isConnected) adopter(svg, false);
    if (retraits || aRevoir.size) regler();
  });

  const surVisibilite = () => regler();

  for (const g of document.querySelectorAll<SVGGElement>('[data-layer="aiguilles"][data-heure="vivante"]')) {
    if (g.ownerSVGElement) adopter(g.ownerSVGElement, avecBalayage && !calme);
  }
  mutations.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("visibilitychange", surVisibilite);
  if (calme) minuteur = window.setTimeout(battreMinute, 60000 - (Date.now() % 60000) + 50);

  return () => {
    mutations.disconnect();
    observateur.disconnect();
    document.removeEventListener("visibilitychange", surVisibilite);
    if (trame) cancelAnimationFrame(trame);
    if (minuteur) window.clearTimeout(minuteur);
    montres.clear();
    balayages.clear();
  };
}

/**
 * Temps qu'il reste avant que le héros n'entre en scène. Son entrée
 * (`arrivee-montre`) est retardée quand le rideau joue ; les aiguilles
 * attendent ce moment pour balayer, sinon elles le feraient dans le noir.
 */
function retardEntree(svg: SVGSVGElement): number {
  const scene = svg.closest(".entree-montre");
  if (!scene || typeof scene.getAnimations !== "function") return 0;
  for (const animation of scene.getAnimations()) {
    if (!(animation instanceof CSSAnimation) || animation.animationName !== "arrivee-montre") continue;
    const retard = Number(animation.effect?.getComputedTiming().delay ?? 0);
    const ecoule = Number(animation.currentTime ?? retard);
    return Math.max(0, retard - ecoule);
  }
  return 0;
}

/** Écart ramené entre -180° et 180° : le sens le plus court. */
function plusCourt(degres: number): number {
  return ((((degres + 180) % 360) + 360) % 360) - 180;
}

function rotation(angle: number): string {
  return `rotate(${Math.round(angle * 100) / 100})`;
}

/** À monter une seule fois, dans le layout racine : site public et atelier lisent la même horloge. */
export function HorlogeVivante() {
  useEffect(() => {
    const requete = window.matchMedia("(prefers-reduced-motion: reduce)");
    let arreter = demarrer(requete.matches, true);
    // Le réglage système peut changer en cours de visite : on repart, sans rejouer l'arrivée.
    const surChangement = () => {
      arreter();
      arreter = demarrer(requete.matches, false);
    };
    requete.addEventListener("change", surChangement);
    return () => {
      requete.removeEventListener("change", surChangement);
      arreter();
    };
  }, []);
  return null;
}
