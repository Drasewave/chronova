"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { WatchView } from "@/watch/types";
import { cn } from "@/lib/utils";

/** Replis si les tokens de `globals.css` ne sont pas lisibles (tests, vieux moteur). */
const REPLI = { scene: 700, entree: "cubic-bezier(0.16, 1, 0.3, 1)", sortie: "cubic-bezier(0.5, 0, 0.9, 0.4)", passage: "cubic-bezier(0.6, 0, 0.2, 1)" };

const POSE = { opacity: "1", transform: "scale(1)", filter: "blur(0px)" };
const AVANT_ENTREE = { opacity: "0", transform: "scale(1.03)", filter: "blur(4px)" };
const APRES_SORTIE = { opacity: "0", transform: "scale(0.97)", filter: "blur(0px)" };

/** Sépare l'opacité du reste : les deux ne suivent pas la même courbe. */
function scinder(etat: typeof POSE) {
  return { lumiere: { opacity: etat.opacity }, matiere: { transform: etat.transform, filter: etat.filter } };
}

/** Lit une durée (`700ms`, `0.7s`) dans un token CSS. */
function lireDuree(style: CSSStyleDeclaration, nom: string, repli: number): number {
  const brut = style.getPropertyValue(nom).trim();
  const valeur = Number.parseFloat(brut);
  if (!Number.isFinite(valeur)) return repli;
  return brut.endsWith("ms") ? valeur : valeur * 1000;
}

function lireCourbe(style: CSSStyleDeclaration, nom: string, repli: string): string {
  return style.getPropertyValue(nom).trim() || repli;
}

/**
 * Fondu enchaîné « de studio » entre deux prises de vue.
 *
 * La vue sortante recule à peine (1 → 0,97) et s'éteint ; la vue entrante se
 * pose (1,03 → 1, de 4 px de flou à la netteté) avec un léger retard, pour que
 * les deux se croisent ; une bande de lumière traverse le cadre pendant le
 * croisement, comme un éclairage qui passe sur la pièce. `--d-reveal` en tout.
 *
 * Chaque vue vit dans sa propre couche, empilée dans la même cellule de grille :
 * la hauteur du cadre ne dépend jamais de la vue montrée. Au repos une seule
 * couche est montée, sans transformation ni filtre ; la seconde n'existe que le
 * temps du croisement. Une couche n'est jamais remontée tant qu'elle est
 * visible : un `InteractiveWatch` garde ses écouteurs et son reflet.
 *
 * Interruption : un nouveau choix en cours de route relit l'opacité, l'échelle
 * et le flou COURANTS de chaque couche et repart de là — revenir sur ses pas
 * inverse simplement le croisement. Rien ne saute.
 *
 * Deux couches pouvant coexister, les rendus doivent porter un `id` propre à
 * leur vue (`id={`zoom-${vue}`}`), sans quoi leurs dégradés SVG se mélangent.
 *
 * Sous `prefers-reduced-motion`, la substitution est immédiate.
 */
export function FonduStudio<Cle extends string>({
  cle,
  children,
  className,
  classeCouche,
  carre = false,
}: {
  cle: Cle;
  children: (cle: Cle) => ReactNode;
  className?: string;
  /** Classes de chaque couche : de quoi transmettre la hauteur au rendu. */
  classeCouche?: string;
  /** Réserve un carré (les rendus font 1000 × 1000) quand le parent ne borne rien. */
  carre?: boolean;
}) {
  const [couches, setCouches] = useState<Cle[]>([cle]);
  const noeuds = useRef(new Map<Cle, HTMLDivElement>());
  const animations = useRef(new Map<Cle, Animation[]>());
  const precedente = useRef<Cle>(cle);
  const voulue = useRef<Cle>(cle);
  const lueur = useRef<HTMLSpanElement>(null);
  const balayage = useRef<Animation | null>(null);

  // La couche voulue est montée dans le même rendu que le changement de prop :
  // l'effet ci-dessous la trouve déjà dans le DOM, avant la première image.
  if (!couches.includes(cle)) setCouches([...couches, cle]);

  useLayoutEffect(() => {
    voulue.current = cle;
    const depart = precedente.current;
    if (depart === cle) return;
    precedente.current = cle;

    const entrante = noeuds.current.get(cle);
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!entrante || calme || typeof entrante.animate !== "function") {
      for (const jeu of animations.current.values()) for (const animation of jeu) animation.cancel();
      animations.current.clear();
      setCouches([cle]);
      return;
    }

    const tokens = getComputedStyle(document.documentElement);
    const total = lireDuree(tokens, "--d-reveal", REPLI.scene);
    const retard = Math.round(total * 0.16);
    const easeEntree = lireCourbe(tokens, "--ease", REPLI.entree);
    const easeSortie = lireCourbe(tokens, "--ease-sortie", REPLI.sortie);
    const easePassage = lireCourbe(tokens, "--ease-passage", REPLI.passage);

    for (const [vue, noeud] of noeuds.current) {
      const enCours = animations.current.get(vue);
      // État courant, lu AVANT d'annuler : c'est de là que tout repart.
      const style = getComputedStyle(noeud);
      const courant = scinder({
        opacity: style.opacity,
        transform: style.transform === "none" ? POSE.transform : style.transform,
        filter: style.filter === "none" ? POSE.filter : style.filter,
      });
      for (const animation of enCours ?? []) animation.cancel();

      const entre = vue === cle;
      const neuve = entre && !enCours && vue !== depart;
      const de = neuve ? scinder(AVANT_ENTREE) : courant;
      const vers = scinder(entre ? POSE : APRES_SORTIE);
      const attente = neuve ? retard : 0;
      // L'opacité suit un fondu régulier, comme un fondu enchaîné de cinéma ;
      // l'échelle et la netteté, elles, se POSENT (entrée) ou filent (sortie).
      // La sortante reste dense plus longtemps que l'entrante ne met à la
      // couvrir : le fond ne transparaît jamais entre les deux.
      const jeu = entre
        ? [
            noeud.animate([de.lumiere, vers.lumiere], {
              duration: Math.round(total * 0.64),
              delay: attente,
              easing: easePassage,
              fill: "both",
            }),
            noeud.animate([de.matiere, vers.matiere], {
              duration: total - attente,
              delay: attente,
              easing: easeEntree,
              fill: "both",
            }),
          ]
        : [
            noeud.animate([de.lumiere, vers.lumiere], {
              duration: Math.round(total * 0.8),
              easing: easeSortie,
              fill: "both",
            }),
            noeud.animate([de.matiere, vers.matiere], {
              duration: Math.round(total * 0.8),
              easing: easePassage,
              fill: "both",
            }),
          ];
      animations.current.set(vue, jeu);

      Promise.all(jeu.map((animation) => animation.finished))
        .then(() => {
          if (animations.current.get(vue) !== jeu) return;
          animations.current.delete(vue);
          if (entre) {
            // Au repos, la couche ne garde ni transformation ni filtre.
            for (const animation of jeu) animation.cancel();
          } else {
            setCouches((liste) => liste.filter((autre) => autre !== vue || autre === voulue.current));
          }
        })
        // `cancel()` rejette `finished` : c'est l'interruption prévue, pas une erreur.
        .catch(() => {});
    }

    // Le passage de lumière : s'il est déjà en route, on le laisse finir.
    const bande = lueur.current;
    if (bande && balayage.current?.playState !== "running") {
      balayage.current = bande.animate(
        [
          { transform: "translateX(-120%) skewX(-16deg)", opacity: 0 },
          { opacity: 1, offset: 0.3 },
          { opacity: 1, offset: 0.7 },
          { transform: "translateX(260%) skewX(-16deg)", opacity: 0 },
        ],
        { duration: total, easing: easePassage },
      );
    }
  }, [cle]);

  useLayoutEffect(() => {
    const enCours = animations.current;
    return () => {
      for (const jeu of enCours.values()) for (const animation of jeu) animation.cancel();
      enCours.clear();
      balayage.current?.cancel();
    };
  }, []);

  return (
    <div
      className={cn(
        "relative grid grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]",
        carre && "aspect-square",
        className,
      )}
      data-vue={cle}
    >
      {couches.map((vue) => (
        <div
          key={vue}
          ref={(noeud) => {
            if (noeud) noeuds.current.set(vue, noeud);
            else noeuds.current.delete(vue);
          }}
          data-couche={vue}
          aria-hidden={vue === cle ? undefined : true}
          className={cn(
            "col-start-1 row-start-1 min-h-0 min-w-0",
            vue !== cle && "pointer-events-none",
            classeCouche,
          )}
        >
          {children(vue)}
        </div>
      ))}
      <span aria-hidden="true" className="passage-lumiere">
        <span ref={lueur} />
      </span>
    </div>
  );
}

/**
 * Les trois vues d'une montre, reliées par le fondu de studio.
 *
 *   <VueMontre vue={vue}>{(v) => <WatchSvg id={`zoom-${v}`} view={v} … />}</VueMontre>
 */
export function VueMontre({
  vue,
  children,
  className,
  classeCouche,
  carre = false,
}: {
  vue: WatchView;
  children: (vueAffichee: WatchView) => ReactNode;
  className?: string;
  classeCouche?: string;
  carre?: boolean;
}) {
  return (
    <FonduStudio cle={vue} className={className} classeCouche={classeCouche} carre={carre}>
      {children}
    </FonduStudio>
  );
}
