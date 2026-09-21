"use client";

import { memo, useEffect, useRef, useState } from "react";
import { COUCHES_ECLATEES } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { INK, LUME_EDGE, LUME_FILL, METALS, glow, mix, rampAt, shade, tint } from "@/watch/palette";
import { jitter, studioLum } from "@/watch/parts/conic";

/* ───────────────────────────── Géométrie ─────────────────────────────── */

const LARGEUR = 620;
const HAUTEUR = 1020;
const CX = 310;
const CY = 510;
/** Écrasement d'un disque vu de trois quarts (≈ 19° au-dessus de l'horizon). */
const K = 0.33;

type Cle = (typeof COUCHES_ECLATEES)[number]["cle"];

/**
 * Ordre physique, du verre vers le fond. Les textes viennent tels quels de
 * `COUCHES_ECLATEES` ; seul l'ordre est repris ici, parce que les aiguilles se
 * chassent AU-DESSUS du cadran : les dessiner dessous ferait tiquer un horloger.
 */
const ORDRE: readonly Cle[] = ["verre", "lunette", "aiguilles", "cadran", "mouvement", "boitier", "fond"];
const PLANS = ORDRE.map((cle) => COUCHES_ECLATEES.find((couche) => couche.cle === cle)).filter(
  (couche): couche is (typeof COUCHES_ECLATEES)[number] => Boolean(couche),
);

/**
 * Hauteur de chaque pièce (y de sa face supérieure, relatif au centre) : montée
 * puis séparée. Les écarts ne sont pas réguliers — une carrure est dix fois
 * plus épaisse qu'un jeu d'aiguilles. `ancre` : où la légende vise la pièce.
 */
const POSES: Record<Cle, { repos: number; eclate: number; ancre: number }> = {
  verre: { repos: -45, eclate: -402, ancre: 0 },
  lunette: { repos: -41, eclate: -292, ancre: 12 },
  aiguilles: { repos: -27, eclate: -150, ancre: -4 },
  cadran: { repos: -19, eclate: -60, ancre: 4 },
  mouvement: { repos: -5, eclate: 55, ancre: 12 },
  boitier: { repos: -15, eclate: 205, ancre: 26 },
  fond: { repos: 37, eclate: 392, ancre: 6 },
};

const R_VERRE = 180;
const R_LUNETTE = 236;
const R_LUNETTE_INT = 178;
const R_CADRAN = 186;
const R_MOUVEMENT = 168;
const R_BOITIER = 244;
const R_BOITIER_INT = 194;
const R_FOND = 226;

const EP_VERRE = 7;
const EP_LUNETTE = 26;
const EP_CADRAN = 5;
const EP_MOUVEMENT = 26;
const EP_BOITIER = 56;
const EP_FOND = 14;

const ACIER = METALS.acier;
const OR = METALS.dore;
const INSERT = "#1B2E42";
const CADRAN = "#1E3448";
const GRAVURE_CLAIRE = tint(ACIER.light, 0.4);

/** Deux décimales : le serveur et le navigateur doivent écrire le même SVG. */
const a2 = (v: number) => Math.round(v * 100) / 100;

/** Coordonnées « à plat » (avant écrasement) : 0° = midi, sens horaire. */
function polaire(r: number, angle: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [a2(r * Math.cos(rad)), a2(r * Math.sin(rad))];
}

const cercle = (r: number) => `M ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

const ellipse = (r: number, dy = 0) => {
  const ry = a2(r * K);
  return `M ${-r} ${dy} a ${r} ${ry} 0 1 0 ${r * 2} 0 a ${r} ${ry} 0 1 0 ${-r * 2} 0 Z`;
};

/** Tranche visible d'un cylindre : la moitié avant de sa paroi. */
const mur = (r: number, h: number) => {
  const ry = a2(r * K);
  return `M ${-r} 0 A ${r} ${ry} 0 0 0 ${r} 0 L ${r} ${h} A ${r} ${ry} 0 0 1 ${-r} ${h} Z`;
};

/** Arête avant d'un disque, pour y poser un filet de lumière. */
const areteAvant = (r: number, dy = 0) => `M ${-r} ${dy} A ${r} ${a2(r * K)} 0 0 0 ${r} ${dy}`;

/** Paroi intérieure d'une bague : on ne voit que sa moitié arrière. */
const croissant = (r: number, d: number) => {
  const ry = a2(r * K);
  return `M ${-r} 0 A ${r} ${ry} 0 0 1 ${r} 0 L ${r} ${d} A ${r} ${ry} 0 0 0 ${-r} ${d} Z`;
};

function secteur(rInt: number, rExt: number, a0: number, a1: number): string {
  const [x0, y0] = polaire(rExt, a0);
  const [x1, y1] = polaire(rExt, a1);
  const [x2, y2] = polaire(rInt, a1);
  const [x3, y3] = polaire(rInt, a0);
  const grand = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${rExt} ${rExt} 0 ${grand} 1 ${x1} ${y1} L ${x2} ${y2} A ${rInt} ${rInt} 0 ${grand} 0 ${x3} ${y3} Z`;
}

const lisser = (t: number) => t * t * (3 - 2 * t);

/**
 * Lumière reçue par une paroi verticale, de 270° (flanc gauche) à 90° (flanc
 * droit) en passant par 180° (face au spectateur). La boîte principale est en
 * haut à gauche : le flanc gauche prend l'éclat, le droit un simple débouchage.
 */
function lumMur(theta: number): number {
  const lobe = (centre: number, largeur: number) => Math.exp(-(((theta - centre) / largeur) ** 2));
  return Math.min(1, lobe(234, 19) + 0.5 * lobe(132, 13) + 0.16 * lobe(182, 38));
}

/* ─────────────────────── Briques de rendu partagées ──────────────────── */

/**
 * Éventail de secteurs : le « dégradé conique » que SVG n'a pas. Dessiné à
 * plat autour de l'origine ; c'est le groupe écrasé qui le met en perspective.
 */
function Eventail({
  id,
  secteurs,
  couleur,
}: {
  id: string;
  secteurs: number;
  couleur: (angle: number, index: number) => string;
}) {
  const pas = 360 / secteurs;
  const deborde = pas * 0.62; // sans recouvrement, l'anticrénelage laisse un filet
  return (
    <g id={id}>
      {Array.from({ length: secteurs }, (_, i) => {
        const [ax, ay] = polaire(260, i * pas - deborde);
        const [bx, by] = polaire(260, i * pas + deborde);
        return <path key={i} d={`M 0 0 L ${ax} ${ay} L ${bx} ${by} Z`} fill={couleur(i * pas, i)} />;
      })}
    </g>
  );
}

/** Une bague vue en perspective : l'éventail `eventail` à travers un anneau. */
function Bague({
  id,
  eventail,
  rExt,
  rInt = 0,
  tourne = 0,
  opacity,
}: {
  id: string;
  eventail: string;
  rExt: number;
  rInt?: number;
  /** Une pente tournée vers l'intérieur renvoie le côté opposé du studio. */
  tourne?: number;
  opacity?: number;
}) {
  return (
    <>
      <clipPath id={id}>
        <path d={rInt > 0 ? `${cercle(rExt)} ${cercle(rInt)}` : cercle(rExt)} clipRule="evenodd" />
      </clipPath>
      <g transform={`scale(1 ${K})`}>
        <g clipPath={`url(#${id})`} opacity={opacity}>
          <use href={`#${eventail}`} transform={tourne ? `rotate(${tourne})` : undefined} />
        </g>
      </g>
    </>
  );
}

function DegradeMur({ id, couleur }: { id: string; couleur: (lum: number) => string }) {
  const angles = Array.from({ length: 25 }, (_, i) => 270 - i * 7.5);
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      {angles.map((theta) => (
        <stop
          key={theta}
          offset={a2((1 + Math.sin((theta * Math.PI) / 180)) / 2)}
          stopColor={couleur(lumMur(theta))}
        />
      ))}
    </linearGradient>
  );
}

const Definitions = memo(function Definitions() {
  return (
    <defs>
      <Eventail
        id="ecl-ev-brosse"
        secteurs={240}
        couleur={(a, i) => rampAt(ACIER, studioLum(a, "brosse") + (jitter(i) - 0.5) * 0.07)}
      />
      <Eventail id="ecl-ev-poli" secteurs={90} couleur={(a) => rampAt(ACIER, studioLum(a, "poli"))} />
      <Eventail
        id="ecl-ev-ceramique"
        secteurs={90}
        couleur={(a) => mix(INSERT, "#DCE7F8", studioLum(a, "ceramique") * 0.78)}
      />
      <Eventail
        id="ecl-ev-soleil"
        secteurs={144}
        couleur={(a, i) => glow(CADRAN, (studioLum(a, "brosse") - 0.42) * 1.7 + (jitter(i) - 0.5) * 0.14)}
      />

      <DegradeMur id="ecl-mur-brosse" couleur={(l) => rampAt(ACIER, 0.2 + 0.5 * l)} />
      <DegradeMur id="ecl-mur-poli" couleur={(l) => rampAt(ACIER, 0.07 + 0.93 * lisser(Math.min(1, l / 0.85)))} />
      <DegradeMur id="ecl-mur-laiton" couleur={(l) => rampAt(OR, 0.16 + 0.5 * l)} />
      <DegradeMur id="ecl-mur-sombre" couleur={(l) => rampAt(ACIER, 0.08 + 0.3 * l)} />

      {/* Paroi intérieure : elle regarde le spectateur, donc la lumière venue
          de la gauche éclaire son côté droit. */}
      <linearGradient id="ecl-rehaut" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={rampAt(ACIER, 0.16)} />
        <stop offset="0.45" stopColor={rampAt(ACIER, 0.42)} />
        <stop offset="0.72" stopColor={rampAt(ACIER, 0.94)} />
        <stop offset="0.86" stopColor={rampAt(ACIER, 0.6)} />
        <stop offset="1" stopColor={rampAt(ACIER, 0.24)} />
      </linearGradient>
      <linearGradient id="ecl-paroi-boitier" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={rampAt(ACIER, 0.05)} />
        <stop offset="0.5" stopColor={rampAt(ACIER, 0.2)} />
        <stop offset="0.74" stopColor={rampAt(ACIER, 0.46)} />
        <stop offset="1" stopColor={rampAt(ACIER, 0.1)} />
      </linearGradient>
      <linearGradient id="ecl-fuite" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={INK} stopOpacity="0" />
        <stop offset="1" stopColor={INK} stopOpacity="0.55" />
      </linearGradient>

      {/* Verre : presque rien, sauf là où il accroche la boîte à lumière. */}
      <linearGradient id="ecl-verre-dome" x1="0.08" y1="0" x2="0.92" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.3" />
        <stop offset="0.34" stopColor="#DCE8FF" stopOpacity="0.07" />
        <stop offset="0.7" stopColor="#8FA9E0" stopOpacity="0.05" />
        <stop offset="1" stopColor="#B9A8F0" stopOpacity="0.17" />
      </linearGradient>
      <linearGradient id="ecl-verre-mur" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#DDE8F5" stopOpacity="0.3" />
        <stop offset="0.2" stopColor="#FFFFFF" stopOpacity="0.92" />
        <stop offset="0.38" stopColor="#9FB6D6" stopOpacity="0.3" />
        <stop offset="0.74" stopColor="#6F88AC" stopOpacity="0.24" />
        <stop offset="0.87" stopColor="#EAF2FF" stopOpacity="0.62" />
        <stop offset="1" stopColor="#DDE8F5" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="ecl-verre-reflet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.34" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.02" />
      </linearGradient>
      <linearGradient id="ecl-verre-lisere" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="0.4" stopColor="#CFE0FF" stopOpacity="0.2" />
        <stop offset="0.75" stopColor="#CFE0FF" stopOpacity="0.16" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.7" />
      </linearGradient>

      <radialGradient id="ecl-vignette">
        <stop offset="0.55" stopColor={INK} stopOpacity="0" />
        <stop offset="1" stopColor={INK} stopOpacity="0.42" />
      </radialGradient>

      {/* Côtes de Genève : des bandes parallèles, chacune avec son propre dégradé. */}
      <linearGradient id="ecl-cote" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={rampAt(ACIER, 0.78)} />
        <stop offset="0.42" stopColor={rampAt(ACIER, 0.54)} />
        <stop offset="0.58" stopColor={rampAt(ACIER, 0.38)} />
        <stop offset="1" stopColor={rampAt(ACIER, 0.62)} />
      </linearGradient>
      <pattern id="ecl-cotes" width="17" height="17" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
        <rect width="17" height="17" fill="url(#ecl-cote)" />
      </pattern>
      <pattern id="ecl-perlage" width="15" height="15" patternUnits="userSpaceOnUse">
        <circle cx="7.5" cy="7.5" r="6.4" fill="none" stroke={ACIER.hi} strokeOpacity="0.2" strokeWidth="1.2" />
        <circle cx="0" cy="0" r="6.4" fill="none" stroke={ACIER.edge} strokeOpacity="0.22" strokeWidth="1.2" />
        <circle cx="15" cy="15" r="6.4" fill="none" stroke={ACIER.edge} strokeOpacity="0.22" strokeWidth="1.2" />
      </pattern>

      <radialGradient id="ecl-rubis" cx="0.38" cy="0.34" r="0.7">
        <stop offset="0" stopColor="#F9C3D0" />
        <stop offset="0.5" stopColor="#C4486C" />
        <stop offset="1" stopColor="#6B1D38" />
      </radialGradient>

      <linearGradient id="ecl-couronne" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={rampAt(ACIER, 0.5)} />
        <stop offset="0.2" stopColor={rampAt(ACIER, 0.98)} />
        <stop offset="0.46" stopColor={rampAt(ACIER, 0.52)} />
        <stop offset="0.8" stopColor={rampAt(ACIER, 0.12)} />
        <stop offset="1" stopColor={rampAt(ACIER, 0.3)} />
      </linearGradient>

      {/* Cornes : dessus brossé qui s'assombrit en plongeant, bout poli. */}
      <linearGradient id="ecl-corne-dessus" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={rampAt(ACIER, 0.5)} />
        <stop offset="0.45" stopColor={rampAt(ACIER, 0.72)} />
        <stop offset="1" stopColor={rampAt(ACIER, 0.42)} />
      </linearGradient>
      <linearGradient id="ecl-corne-bout" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={rampAt(ACIER, 0.66)} />
        <stop offset="0.5" stopColor={rampAt(ACIER, 0.4)} />
        <stop offset="1" stopColor={rampAt(ACIER, 0.2)} />
      </linearGradient>

      {/* Ombres portées : un disque, ou un anneau pour une pièce ajourée. */}
      <radialGradient id="ecl-ombre-disque">
        <stop offset="0" stopColor="#000" stopOpacity="0.85" />
        <stop offset="0.72" stopColor="#000" stopOpacity="0.7" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ecl-ombre-anneau">
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="0.84" stopColor="#000" stopOpacity="0.75" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <filter id="ecl-flou" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>

      {/* Emboîtage : tant que le mouvement est dans la carrure, sa tranche doit
          rester derrière le rebord avant. On ne le laisse voir qu'au-dessus du
          plan de la carrure, ou à travers son ouverture. */}
      <clipPath id="ecl-clip-emboitage">
        <path
          d={`M -400 -1200 H 400 V 0 H ${R_BOITIER_INT} A ${R_BOITIER_INT} ${a2(R_BOITIER_INT * K)} 0 0 1 ${-R_BOITIER_INT} 0 H -400 Z`}
        />
      </clipPath>
      <clipPath id="ecl-clip-cadran">
        <path d={ellipse(R_CADRAN)} />
      </clipPath>
      <clipPath id="ecl-clip-mouvement">
        <path d={ellipse(R_MOUVEMENT)} />
      </clipPath>
      <clipPath id="ecl-clip-boitier">
        <path d={ellipse(R_BOITIER)} />
      </clipPath>
      <clipPath id="ecl-clip-fond">
        <path d={ellipse(R_FOND)} />
      </clipPath>
    </defs>
  );
});

/* ───────────────────────────── Les sept pièces ───────────────────────── */

const Verre = memo(function Verre() {
  const ry = a2(R_VERRE * K);
  return (
    <g>
      <path d={mur(R_VERRE, EP_VERRE)} fill="url(#ecl-verre-mur)" />
      {/* Le bombé : l'arc arrière monte plus haut que le chant du verre. */}
      <path
        d={`M ${-R_VERRE} 0 A ${R_VERRE} ${ry + 13} 0 0 1 ${R_VERRE} 0 A ${R_VERRE} ${ry} 0 0 1 ${-R_VERRE} 0 Z`}
        fill="url(#ecl-verre-dome)"
      />
      {/* Reflet de la boîte à lumière, en deux pans comme une fenêtre d'atelier. */}
      <g transform={`translate(0 -5) scale(1 ${K})`}>
        <path d="M -132 -78 L -58 -124 L -30 -52 L -112 -6 Z" fill="url(#ecl-verre-reflet)" />
        <path d="M -48 -129 L 6 -148 L 28 -82 L -20 -58 Z" fill="url(#ecl-verre-reflet)" opacity="0.7" />
        <path d="M 96 92 Q 132 66 146 28" fill="none" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" />
      </g>
      <path d={ellipse(R_VERRE)} fill="none" stroke="url(#ecl-verre-lisere)" strokeWidth="1.8" />
      <path d={areteAvant(R_VERRE, EP_VERRE)} fill="none" stroke="#CFE0FF" strokeOpacity="0.35" strokeWidth="1" />
    </g>
  );
});

const Lunette = memo(function Lunette() {
  const ry = R_LUNETTE * K;
  // 120 crans sur le tour, donc 60 sur la moitié visible. Ils se resserrent
  // vers les flancs : c'est ce tassement qui fait lire un cylindre.
  let creux = "";
  let cretes = "";
  for (let i = 0; i < 60; i += 1) {
    for (const [decalage, cible] of [
      [0.6, "creux"],
      [2.1, "cretes"],
    ] as const) {
      const theta = ((90 + i * 3 + decalage) * Math.PI) / 180;
      const x = a2(R_LUNETTE * Math.sin(theta));
      const y = a2(-ry * Math.cos(theta));
      const trait = `M ${x} ${a2(y + 2.5)} V ${a2(y + EP_LUNETTE - 5)} `;
      if (cible === "creux") creux += trait;
      else cretes += trait;
    }
  }

  let minutes = "";
  for (let m = 1; m < 15; m += 1) {
    if (m % 5 === 0) continue;
    const [x0, y0] = polaire(221, m * 6);
    const [x1, y1] = polaire(211, m * 6);
    minutes += `M ${x0} ${y0} L ${x1} ${y1} `;
  }

  return (
    <g>
      <path d={mur(R_LUNETTE, EP_LUNETTE)} fill="url(#ecl-mur-poli)" />
      <path d={creux} fill="none" stroke={ACIER.edge} strokeOpacity="0.62" strokeWidth="1.7" />
      <path d={cretes} fill="none" stroke={ACIER.hi} strokeOpacity="0.34" strokeWidth="1" />
      <path d={areteAvant(R_LUNETTE, EP_LUNETTE - 3)} fill="none" stroke={ACIER.edge} strokeOpacity="0.7" strokeWidth="1.4" />

      {/* Réhaut : la paroi intérieure, polie, qui retombe vers le cadran. */}
      <path d={croissant(R_LUNETTE_INT, EP_LUNETTE - 6)} fill="url(#ecl-rehaut)" />
      <path d={croissant(R_LUNETTE_INT, EP_LUNETTE - 6)} fill="url(#ecl-fuite)" />

      <path d={`${ellipse(R_LUNETTE)} ${ellipse(R_LUNETTE_INT)}`} fillRule="evenodd" fill={INSERT} />
      <Bague id="ecl-b-lun-ext" eventail="ecl-ev-poli" rExt={R_LUNETTE} rInt={227} />
      <Bague id="ecl-b-lun-insert" eventail="ecl-ev-ceramique" rExt={227} rInt={186} />
      <Bague id="ecl-b-lun-int" eventail="ecl-ev-poli" rExt={186} rInt={R_LUNETTE_INT} tourne={180} />

      {/* Graduation de plongée, gravée puis laquée dans la céramique. */}
      <g transform={`scale(1 ${K})`} fill={GRAVURE_CLAIRE}>
        <path d={minutes} fill="none" stroke={GRAVURE_CLAIRE} strokeWidth="2.4" />
        {[5, 15, 25, 35, 45, 55].map((m) => (
          <rect key={m} x="-3" y="-222" width="6" height="26" transform={`rotate(${m * 6})`} />
        ))}
        {[10, 20, 30, 40, 50].map((m) => (
          <text
            key={m}
            transform={`rotate(${m * 6}) translate(0 -197)`}
            textAnchor="middle"
            style={{ fontFamily: "var(--font-title)", fontSize: 27, fontWeight: 500 }}
          >
            {m}
          </text>
        ))}
        <path d="M -17 -222 L 17 -222 L 0 -192 Z" />
        <circle cx="0" cy="-211" r="6.5" fill={LUME_FILL} stroke={LUME_EDGE} strokeWidth="1.2" />
      </g>

      <path d={ellipse(R_LUNETTE)} fill="none" stroke={ACIER.edge} strokeOpacity="0.55" strokeWidth="1" />
      <path d={areteAvant(R_LUNETTE, 0.6)} fill="none" stroke={ACIER.hi} strokeOpacity="0.5" strokeWidth="1" />
    </g>
  );
});

/** Aiguilles des heures et des minutes à 10 h 10 ; `z` : étage sur le canon. */
const AIGUILLES = [
  { cle: "heures", angle: 305, longueur: 104, demi: 11, queue: 17, z: 4 },
  { cle: "minutes", angle: 60, longueur: 153, demi: 9, queue: 19, z: 7 },
] as const;
const TROTTEUSE = { angle: 192, longueur: 164, z: 10 };

function silhouetteAiguille(longueur: number, demi: number, queue: number): string {
  return `M 0 ${queue} L ${a2(-demi * 0.55)} ${a2(queue * 0.4)} L ${-demi} ${a2(-longueur * 0.5)} L 0 ${-longueur} L ${demi} ${a2(-longueur * 0.5)} L ${a2(demi * 0.55)} ${a2(queue * 0.4)} Z`;
}

const SILHOUETTE_TROTTEUSE = `M -1.7 44 L -1.7 ${-TROTTEUSE.longueur} L 1.7 ${-TROTTEUSE.longueur} L 1.7 44 Z M -4.5 24 h 9 v 20 h -9 Z`;

const Aiguilles = memo(function Aiguilles() {
  return (
    <g>
      {/* Le canon : sans lui, les aiguilles flotteraient sans raison. */}
      <path d={mur(6, 20)} fill="url(#ecl-mur-poli)" />

      {AIGUILLES.map(({ cle, angle, longueur, demi, queue, z }) => {
        // Deux facettes : chacune renvoie un côté différent du studio.
        const gauche = rampAt(ACIER, 0.3 + 0.7 * studioLum(angle - 90, "poli"));
        const droite = rampAt(ACIER, 0.3 + 0.7 * studioLum(angle + 90, "poli"));
        const mi = a2(-longueur * 0.5);
        return (
          <g key={cle} transform={`translate(0 ${-z})`}>
            <g transform={`translate(0 1.6) scale(1 ${K}) rotate(${angle})`}>
              <path d={silhouetteAiguille(longueur, demi, queue)} fill={ACIER.edge} />
            </g>
            <g transform={`scale(1 ${K}) rotate(${angle})`}>
              <path d={`M 0 ${queue} L ${a2(-demi * 0.55)} ${a2(queue * 0.4)} L ${-demi} ${mi} L 0 ${-longueur} Z`} fill={gauche} />
              <path d={`M 0 ${queue} L ${a2(demi * 0.55)} ${a2(queue * 0.4)} L ${demi} ${mi} L 0 ${-longueur} Z`} fill={droite} />
              <path
                d={`M 0 ${a2(-longueur * 0.2)} L ${a2(-demi * 0.45)} ${a2(-longueur * 0.3)} L ${a2(-demi * 0.56)} ${a2(-longueur * 0.52)} L 0 ${a2(-longueur * 0.85)} L ${a2(demi * 0.56)} ${a2(-longueur * 0.52)} L ${a2(demi * 0.45)} ${a2(-longueur * 0.3)} Z`}
                fill={LUME_FILL}
                stroke={LUME_EDGE}
                strokeWidth="0.8"
              />
            </g>
          </g>
        );
      })}

      <g transform={`translate(0 ${-TROTTEUSE.z})`}>
        <g transform={`scale(1 ${K}) rotate(${TROTTEUSE.angle})`}>
          <path d={SILHOUETTE_TROTTEUSE} fill={rampAt(ACIER, 0.78)} />
          <circle cx="0" cy={a2(-TROTTEUSE.longueur * 0.74)} r="7" fill={LUME_FILL} stroke={rampAt(ACIER, 0.8)} strokeWidth="2.2" />
        </g>
        {/* Le chapeau de la trotteuse ferme l'empilement. */}
        <path d={mur(8, 3)} fill="url(#ecl-mur-poli)" />
        <path d={ellipse(8)} fill={rampAt(ACIER, 0.86)} stroke={ACIER.edge} strokeOpacity="0.6" strokeWidth="0.6" />
        <ellipse cx="-2" cy="-0.8" rx="3" ry="1" fill={ACIER.hi} />
      </g>
    </g>
  );
});

const Cadran = memo(function Cadran() {
  let minuterie = "";
  for (let m = 0; m < 60; m += 1) {
    const [x0, y0] = polaire(178, m * 6);
    const [x1, y1] = polaire(m % 5 === 0 ? 166 : 171, m * 6);
    minuterie += `M ${x0} ${y0} L ${x1} ${y1} `;
  }

  /** Un index appliqué : `pied` dessine son flanc sombre, sinon son dessus. */
  const index = (pied: boolean) =>
    Array.from({ length: 12 }, (_, i) => {
      const long = i % 3 === 0;
      const haut = long ? 46 : 32;
      const demi = long ? 7 : 5.5;
      const cadre = pied ? ACIER.edge : rampAt(ACIER, 0.62 + 0.38 * studioLum(i * 30 + 300, "poli"));
      const barres = i === 0 ? [-9, 9] : [0];
      return (
        <g key={i} transform={`rotate(${i * 30})`}>
          {barres.map((dx) => (
            <g key={dx}>
              <rect x={dx - demi} y={-160} width={demi * 2} height={haut} rx="1.4" fill={cadre} />
              {!pied && (
                <rect x={dx - demi + 2} y={-157.6} width={demi * 2 - 4} height={haut - 4.8} rx="0.8" fill={LUME_FILL} />
              )}
            </g>
          ))}
        </g>
      );
    });

  return (
    <g>
      {/* La tranche trahit le flan de laiton sous la laque. */}
      <path d={mur(R_CADRAN, EP_CADRAN)} fill="url(#ecl-mur-laiton)" />
      <path d={ellipse(R_CADRAN)} fill={CADRAN} />
      <Bague id="ecl-b-cadran" eventail="ecl-ev-soleil" rExt={R_CADRAN} />
      <path d={ellipse(R_CADRAN)} fill="url(#ecl-vignette)" />

      <g transform={`scale(1 ${K})`}>
        <path d={minuterie} fill="none" stroke={GRAVURE_CLAIRE} strokeOpacity="0.85" strokeWidth="1.8" />
        <text
          x="0"
          y="-62"
          textAnchor="middle"
          fill={GRAVURE_CLAIRE}
          style={{ fontFamily: "var(--font-title)", fontSize: 30, fontWeight: 400, letterSpacing: "0.3em" }}
        >
          CHRONOVA
        </text>
        <circle cx="0" cy="0" r="6" fill={INK} />
      </g>
      <g transform={`translate(0 2.2) scale(1 ${K})`}>{index(true)}</g>
      <g transform={`scale(1 ${K})`}>{index(false)}</g>

      <path d={ellipse(R_CADRAN)} fill="none" stroke={shade(CADRAN, 0.55)} strokeWidth="1.2" />
      <path d={areteAvant(R_CADRAN, 0.5)} fill="none" stroke={OR.light} strokeOpacity="0.45" strokeWidth="0.9" />
    </g>
  );
});

const RUBIS: ReadonlyArray<readonly [number, number]> = [
  [-112, 46],
  [-58, 112],
  [-22, 52],
  [-122, 104],
  [22, 128],
];
const VIS: ReadonlyArray<readonly [number, number]> = [
  [-142, 30],
  [-36, 150],
  [12, 26],
  [-84, 82],
  [146, 46],
];
const BALANCIER: readonly [number, number] = [72, 84];

const Mouvement = memo(function Mouvement() {
  const pontRouage = "M -170 16 L 8 16 L 30 62 Q 6 96 4 176 L -170 176 Z";
  const pontBarillet = "M 20 118 Q 40 150 40 176 L 12 176 Q 10 140 20 118 Z";
  const coq = "M 172 22 L 104 40 Q 58 60 64 86 Q 74 104 98 92 L 172 70 Z";
  const masse = `M -162 0 A 162 162 0 0 1 162 0 Z ${secteur(44, 118, -78, -12)} ${secteur(44, 118, 12, 78)}`;
  const [bx, by] = BALANCIER;

  return (
    <g>
      <path d={mur(R_MOUVEMENT, EP_MOUVEMENT)} fill="url(#ecl-mur-brosse)" />
      <path d={mur(R_MOUVEMENT, EP_MOUVEMENT)} fill={INK} fillOpacity="0.22" />
      <path d={areteAvant(R_MOUVEMENT, 9)} fill="none" stroke={ACIER.edge} strokeOpacity="0.6" strokeWidth="1.2" />
      <path d={areteAvant(R_MOUVEMENT, 10.4)} fill="none" stroke={ACIER.hi} strokeOpacity="0.3" strokeWidth="0.8" />

      {/* Platine perlée : on ne la voit qu'entre les ponts. */}
      <path d={ellipse(R_MOUVEMENT)} fill={rampAt(ACIER, 0.34)} />
      <g transform={`scale(1 ${K})`}>
        <circle r={R_MOUVEMENT} fill="url(#ecl-perlage)" />
      </g>

      {/* Ponts : un pied sombre décalé leur donne leur épaisseur. */}
      <g clipPath="url(#ecl-clip-mouvement)">
        <g transform={`translate(0 2.6) scale(1 ${K})`} fill={ACIER.edge}>
          <circle r="160" fill="none" />
          <path d={pontRouage} />
          <path d={pontBarillet} />
        </g>
        <g transform={`scale(1 ${K})`} stroke={ACIER.hi} strokeOpacity="0.55" strokeWidth="1.4">
          <path d={pontRouage} fill="url(#ecl-cotes)" />
          <path d={pontBarillet} fill="url(#ecl-cotes)" />
        </g>
      </g>

      {/* Balancier doré et son spiral bleui, sous le coq. */}
      <g transform={`scale(1 ${K}) translate(${bx} ${by})`}>
        <circle r="44" fill={rampAt(ACIER, 0.1)} />
        <circle r="37" fill="none" stroke={OR.mid} strokeWidth="6.5" />
        <path d="M -26 -26 A 37 37 0 0 1 26 -26" fill="none" stroke={OR.hi} strokeOpacity="0.85" strokeWidth="2.4" transform="rotate(-50)" />
        <path d="M -34 0 H 34 M 0 -34 V 34" stroke={OR.light} strokeWidth="4" transform="rotate(24)" />
        {[9, 14, 19, 24].map((r) => (
          <circle key={r} r={r} fill="none" stroke={METALS.bleui.light} strokeOpacity="0.8" strokeWidth="1.1" />
        ))}
      </g>
      <g clipPath="url(#ecl-clip-mouvement)">
        <g transform={`translate(0 2.6) scale(1 ${K})`}>
          <path d={coq} fill={ACIER.edge} />
        </g>
        <g transform={`scale(1 ${K})`}>
          <path d={coq} fill="url(#ecl-cotes)" stroke={ACIER.hi} strokeOpacity="0.55" strokeWidth="1.4" />
        </g>
      </g>

      <g transform={`scale(1 ${K})`}>
        {[...RUBIS, BALANCIER].map(([x, y]) => (
          <g key={`${x}/${y}`} transform={`translate(${x} ${y})`}>
            <circle r="9.5" fill={OR.mid} stroke={OR.dark} strokeWidth="1" />
            <circle r="6" fill="url(#ecl-rubis)" />
            <circle cx="-1.8" cy="-2" r="1.6" fill="#FFFFFF" fillOpacity="0.9" />
          </g>
        ))}
        {VIS.map(([x, y], i) => (
          <g key={`${x}/${y}`} transform={`translate(${x} ${y})`}>
            <circle r="8" fill={rampAt(ACIER, 0.9)} stroke={ACIER.edge} strokeWidth="1.4" />
            <path d="M -7 0 H 7" stroke={ACIER.edge} strokeWidth="2.2" transform={`rotate(${Math.round(jitter(i + 3) * 170)})`} />
          </g>
        ))}
      </g>

      {/* Masse oscillante : la demi-lune brossée qui signe un automatique. */}
      <g transform="translate(0 -6)">
        <g transform={`translate(0 4) scale(1 ${K}) rotate(-14)`}>
          <path d={masse} fillRule="evenodd" fill={ACIER.edge} />
        </g>
        <clipPath id="ecl-clip-masse">
          <path d={masse} clipRule="evenodd" />
        </clipPath>
        <g transform={`scale(1 ${K}) rotate(-14)`}>
          <g clipPath="url(#ecl-clip-masse)">
            <use href="#ecl-ev-brosse" transform="rotate(14)" />
            {/* Le segment lourd, en périphérie, est plus épais : il marque un ressaut. */}
            <path d={secteur(126, 162, -90, 90)} fill={INK} fillOpacity="0.2" />
            <path d={secteur(126, 128.5, -90, 90)} fill={ACIER.hi} fillOpacity="0.7" />
          </g>
          <path d={masse} fillRule="evenodd" fill="none" stroke={ACIER.hi} strokeOpacity="0.6" strokeWidth="1.3" />
          <circle r="20" fill={rampAt(ACIER, 0.7)} stroke={ACIER.edge} strokeWidth="1.4" />
          <circle r="9" fill={rampAt(ACIER, 0.94)} stroke={ACIER.edge} strokeWidth="1.2" />
          <path d="M -8 0 H 8" stroke={ACIER.edge} strokeWidth="2.2" transform="rotate(38)" />
        </g>
      </g>

      <path d={ellipse(R_MOUVEMENT)} fill="none" stroke={ACIER.edge} strokeOpacity="0.7" strokeWidth="1" />
      <path d={areteAvant(R_MOUVEMENT, 0.5)} fill="none" stroke={ACIER.hi} strokeOpacity="0.5" strokeWidth="0.9" />
    </g>
  );
});

type Point = readonly [number, number];
const points = (liste: readonly Point[]) => liste.map(([x, y]) => `${a2(x)},${a2(y)}`).join(" ");

/**
 * Une corne, extrudée à la main : dessus, bout et flancs. La projection est
 * orthogonale, donc un flanc n'apparaît que parce que la corne s'affine vers
 * sa pointe ; et elle plonge (`chute`) pour épouser le poignet.
 */
function Corne({ cote, avant }: { cote: 1 | -1; avant: boolean }) {
  const PAS = 4;
  const sens = avant ? 1 : -1;
  const ext: { haut: Point; bas: Point }[] = [];
  const int: { haut: Point; bas: Point }[] = [];
  for (let i = 0; i <= PAS; i += 1) {
    const t = i / PAS;
    const chute = 16 * t * t;
    const epaisseur = EP_BOITIER - 34 * t;
    const ye = sens * (140 + 160 * t) * K + chute;
    const yi = sens * (180 + 120 * t) * K + chute;
    const xe = cote * (188 - 16 * t);
    const xi = cote * (112 + 12 * t);
    ext.push({ haut: [xe, ye], bas: [xe, ye + epaisseur] });
    int.push({ haut: [xi, yi], bas: [xi, yi + epaisseur] });
  }
  const dessus = [...ext.map((p) => p.haut), ...int.map((p) => p.haut).reverse()];
  const flanc = (bord: typeof ext) => [...bord.map((p) => p.haut), ...bord.map((p) => p.bas).reverse()];
  const pointeExt = ext[PAS] as (typeof ext)[number];
  const pointeInt = int[PAS] as (typeof int)[number];
  // Le flanc tourné vers la gauche regarde la boîte à lumière.
  const clair = rampAt(ACIER, 0.7);
  const sombre = rampAt(ACIER, 0.16);

  if (!avant) {
    return <polygon points={points(dessus)} fill={rampAt(ACIER, cote < 0 ? 0.56 : 0.44)} stroke={ACIER.edge} strokeWidth="0.8" />;
  }
  return (
    <g strokeLinejoin="round">
      <polygon points={points(flanc(int))} fill={cote > 0 ? clair : sombre} />
      <polygon points={points(flanc(ext))} fill={cote > 0 ? sombre : clair} />
      <polygon
        points={points([pointeExt.haut, pointeInt.haut, pointeInt.bas, pointeExt.bas])}
        fill="url(#ecl-corne-bout)"
        stroke={ACIER.edge}
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <polygon points={points(dessus)} fill="url(#ecl-corne-dessus)" />
      {cote > 0 && <polygon points={points(dessus)} fill={INK} fillOpacity="0.14" />}
      <polyline
        points={points((cote < 0 ? ext : int).map((p) => p.haut))}
        fill="none"
        stroke={ACIER.hi}
        strokeOpacity="0.85"
        strokeWidth="1.3"
      />
    </g>
  );
}

const Boitier = memo(function Boitier() {
  const milieu = EP_BOITIER / 2;
  // Cannelures de la couronne : parallèles à son axe, tassées vers le haut et
  // le bas du cylindre.
  let cannelures = "";
  for (let phi = -75; phi <= 75; phi += 15) {
    const y = a2(milieu + 20 * Math.sin((phi * Math.PI) / 180));
    cannelures += `M 253 ${y} H 281 `;
  }
  // Brossage des flancs : des filets qui suivent la courbure de la carrure.
  const filets = [7, 13, 18, 24, 29, 35, 40, 46, 50];

  return (
    <g>
      <Corne cote={-1} avant={false} />
      <Corne cote={1} avant={false} />

      {/* Couronne à 3 h : tube, corps cannelé, chapeau poli. */}
      <rect x="240" y={milieu - 10} width="14" height="20" fill={rampAt(ACIER, 0.18)} />
      <path d={`M 251 ${milieu - 20} H 281 Q 288 ${milieu - 20} 288 ${milieu - 13} V ${milieu + 13} Q 288 ${milieu + 20} 281 ${milieu + 20} H 251 Z`} fill="url(#ecl-couronne)" />
      <path d={cannelures} fill="none" stroke={ACIER.edge} strokeOpacity="0.6" strokeWidth="1.5" />
      <path d={`M 282.5 ${milieu - 19} V ${milieu + 19}`} stroke={ACIER.edge} strokeOpacity="0.5" strokeWidth="1" />

      <path d={mur(R_BOITIER, EP_BOITIER)} fill="url(#ecl-mur-brosse)" />
      {filets.map((dy, i) => (
        <path
          key={dy}
          d={areteAvant(R_BOITIER, dy)}
          fill="none"
          stroke={i % 2 ? ACIER.hi : ACIER.edge}
          strokeOpacity={i % 2 ? 0.07 : 0.1}
          strokeWidth="1"
        />
      ))}
      <path d={areteAvant(R_BOITIER, EP_BOITIER - 2)} fill="none" stroke={ACIER.edge} strokeOpacity="0.7" strokeWidth="2.4" />

      <Corne cote={-1} avant />
      <Corne cote={1} avant />

      {/* À travers l'ouverture, on ne voit que la paroi du fond de la carrure. */}
      <path d={croissant(R_BOITIER_INT, EP_BOITIER)} fill="url(#ecl-paroi-boitier)" />
      <path d={croissant(R_BOITIER_INT, EP_BOITIER)} fill="url(#ecl-fuite)" />

      <path d={`${ellipse(R_BOITIER)} ${ellipse(R_BOITIER_INT)}`} fillRule="evenodd" fill={ACIER.mid} />
      <Bague id="ecl-b-boi-plat" eventail="ecl-ev-brosse" rExt={R_BOITIER} rInt={205} />
      <Bague id="ecl-b-boi-chanfrein" eventail="ecl-ev-poli" rExt={205} rInt={R_BOITIER_INT} tourne={180} />
      <path d={ellipse(R_BOITIER)} fill="none" stroke={ACIER.edge} strokeOpacity="0.5" strokeWidth="1" />
      <path d={areteAvant(R_BOITIER, 0.6)} fill="none" stroke={ACIER.hi} strokeOpacity="0.75" strokeWidth="1.2" />
    </g>
  );
});

const Fond = memo(function Fond() {
  const gravure = { fontFamily: "var(--font-ui)", fontSize: 25, fontWeight: 600, letterSpacing: "0.26em" } as const;
  return (
    <g>
      <path d={mur(R_FOND, EP_FOND)} fill="url(#ecl-mur-poli)" />
      <path d={areteAvant(R_FOND, EP_FOND - 1.5)} fill="none" stroke={ACIER.edge} strokeOpacity="0.7" strokeWidth="1.6" />

      <path d={ellipse(R_FOND)} fill={ACIER.mid} />
      <Bague id="ecl-b-fond-plat" eventail="ecl-ev-brosse" rExt={R_FOND} />
      <Bague id="ecl-b-fond-filet" eventail="ecl-ev-poli" rExt={198} rInt={188} tourne={180} />
      <Bague id="ecl-b-fond-centre" eventail="ecl-ev-brosse" rExt={104} tourne={70} />
      <Bague id="ecl-b-fond-centre-filet" eventail="ecl-ev-poli" rExt={108} rInt={104} />

      <g transform={`scale(1 ${K})`}>
        {/* Joint torique, dans sa gorge. */}
        <circle r="213" fill="none" stroke="#0A0B0D" strokeWidth="9" />
        <circle r="215" fill="none" stroke={ACIER.hi} strokeOpacity="0.16" strokeWidth="1.4" />

        {/* Six encoches : la prise de la clé à fond. */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <g key={angle} transform={`rotate(${angle + 30})`}>
            <rect x="-13" y="-181" width="26" height="13" rx="3" fill={ACIER.edge} />
            <rect x="-13" y="-169.5" width="26" height="1.6" fill={ACIER.hi} fillOpacity="0.6" />
          </g>
        ))}

        {/* La mention tourne côté spectateur ; la signature, côté opposé. */}
        <path id="ecl-arc-avant" d="M -139 0 A 139 139 0 0 0 139 0" fill="none" />
        <path id="ecl-arc-arriere" d="M -121 0 A 121 121 0 0 1 121 0" fill="none" />
        {[
          { dy: 0.9, couleur: ACIER.hi, opacite: 0.55 },
          { dy: 0, couleur: shade(ACIER.dark, 0.5), opacite: 1 },
        ].map(({ dy, couleur, opacite }) => (
          <g key={dy} transform={`translate(0 ${dy * 3})`} fill={couleur} fillOpacity={opacite} style={gravure}>
            <text textAnchor="middle">
              <textPath href="#ecl-arc-avant" startOffset="50%">
                ASSEMBLÉE À LA MAIN
              </textPath>
            </text>
            <text textAnchor="middle">
              <textPath href="#ecl-arc-arriere" startOffset="50%">
                CHRONOVA
              </textPath>
            </text>
          </g>
        ))}
      </g>

      <path d={ellipse(R_FOND)} fill="none" stroke={ACIER.edge} strokeOpacity="0.5" strokeWidth="1" />
      <path d={areteAvant(R_FOND, 0.5)} fill="none" stroke={ACIER.hi} strokeOpacity="0.7" strokeWidth="1.1" />
    </g>
  );
});

/* ───────────────────────────── Mise en scène ─────────────────────────── */

function Plan({ y, children }: { y: number; children: React.ReactNode }) {
  return <g transform={`translate(${CX} ${a2(CY + y)})`}>{children}</g>;
}

/**
 * Ombre de la pièce du dessus, rognée sur la face qui la reçoit. La lumière
 * vient du haut à gauche : l'ombre glisse vers l'avant-droit et s'élargit à
 * mesure que les deux pièces s'éloignent.
 */
function Ombre({
  surface,
  rayon,
  ouverture,
  anneau = false,
}: {
  surface: string;
  rayon: number;
  ouverture: number;
  anneau?: boolean;
}) {
  // Montée, les pièces sont emboîtées : aucune ombre à porter.
  const force = Math.min(1, ouverture / 0.18) * (0.6 - 0.28 * ouverture);
  if (force <= 0) return null;
  const r = rayon * (1 + 0.1 * ouverture);
  return (
    <g clipPath={`url(#${surface})`}>
      <ellipse
        cx={a2(8 + 20 * ouverture)}
        cy={a2(4 + 12 * ouverture)}
        rx={a2(r)}
        ry={a2(r * K)}
        fill={`url(#${anneau ? "ecl-ombre-anneau" : "ecl-ombre-disque"})`}
        opacity={a2(force)}
      />
    </g>
  );
}

/** L'ombre des aiguilles garde leur forme : c'est elle qui les décolle du cadran. */
function OmbreAiguilles({ ouverture }: { ouverture: number }) {
  return (
    <g clipPath="url(#ecl-clip-cadran)">
      <g
        transform={`scale(1 ${K}) translate(${a2(5 + 30 * ouverture)} ${a2(7 + 36 * ouverture)})`}
        opacity={a2(0.55 - 0.25 * ouverture)}
        filter="url(#ecl-flou)"
        fill="#000"
      >
        {AIGUILLES.map(({ cle, angle, longueur, demi, queue }) => (
          <path key={cle} d={silhouetteAiguille(longueur, demi, queue)} transform={`rotate(${angle})`} />
        ))}
        <path d={SILHOUETTE_TROTTEUSE} transform={`rotate(${TROTTEUSE.angle})`} />
      </g>
    </g>
  );
}

/** Hauteur du dessin : la colonne des légendes s'y aligne au pixel. */
const HAUTEUR_FIGEE = "h-[30rem] md:h-[38rem] lg:h-[min(72dvh,44rem)]";
const HAUTEUR_ANIMEE = "h-[min(50dvh,30rem)] md:h-[min(58dvh,40rem)] lg:h-[min(72dvh,44rem)]";

/**
 * Section signature : en descendant, la montre se sépare en sept plans. C'est la
 * démonstration visuelle du travail d'assemblage — chaque plan est une pièce que
 * l'horloger pose à la main, légendée comme une nomenclature.
 *
 * Le HTML servi est la vue entièrement séparée, toutes légendes visibles, dans
 * une section de hauteur normale. C'est ce que voient un navigateur sans
 * JavaScript et un lecteur sous `prefers-reduced-motion` : on perd l'effet,
 * jamais l'information. La piste de défilement collante n'est montée qu'une
 * fois le script chargé — la section est loin sous la ligne de flottaison, le
 * changement de hauteur ne se voit pas.
 */
export function ExplodedView() {
  const piste = useRef<HTMLElement>(null);
  const [anime, setAnime] = useState(false);
  const [defilement, setDefilement] = useState(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnime(true);

    let trame = 0;
    const mesurer = () => {
      trame = 0;
      const rect = piste.current?.getBoundingClientRect();
      if (!rect) return;
      const course = rect.height - window.innerHeight;
      if (course <= 0) return;
      setDefilement(Math.max(0, Math.min(1, -rect.top / course)));
    };
    const planifier = () => {
      if (!trame) trame = requestAnimationFrame(mesurer);
    };

    // Mesure différée d'une trame : la piste doit d'abord avoir pris sa hauteur.
    planifier();
    window.addEventListener("scroll", planifier, { passive: true });
    window.addEventListener("resize", planifier);
    return () => {
      window.removeEventListener("scroll", planifier);
      window.removeEventListener("resize", planifier);
      if (trame) cancelAnimationFrame(trame);
    };
  }, []);

  // La séparation s'achève avant la fin de la piste : les dernières légendes
  // se lisent devant une montre immobile.
  const ouverture = lisser(Math.min(1, defilement / 0.82));
  const actif = anime ? Math.min(PLANS.length - 1, Math.floor(defilement * PLANS.length)) : -1;
  const y = (cle: Cle) => POSES[cle].repos + (POSES[cle].eclate - POSES[cle].repos) * ouverture;
  const hauteurDessin = anime ? HAUTEUR_ANIMEE : HAUTEUR_FIGEE;

  return (
    <section
      id="vue-eclatee"
      ref={piste}
      data-theme="night"
      aria-labelledby="titre-eclate"
      className={cn("relative bg-bg text-fg", anime && "h-[170vh] md:h-[220vh] lg:h-[300vh]")}
    >
      {/* La scène se cale SOUS l'en-tête collant, en `dvh` : sur téléphone, `100vh`
          compte la barre d'adresse et le titre partait sous l'en-tête. */}
      <div
        className={cn(
          anime &&
            "sticky top-16 flex h-[calc(100dvh-4rem)] flex-col justify-center overflow-hidden md:top-20 md:h-[calc(100dvh-5rem)]",
        )}
        // La gouttière est portée par la bande, pas par le conteneur centré : le
        // titre part ainsi du même bord gauche que le logo et les autres sections.
        style={{ paddingInline: "var(--gutter)", ...(anime ? {} : { paddingBlock: "var(--section-y)" }) }}
      >
        <div className="mx-auto w-full max-w-wide">
          {/* Trois colonnes en grand écran : l'intitulé à gauche, la pile au
              centre, la nomenclature à droite. Le dessin récupère ainsi toute
              la hauteur d'écran disponible. */}
          <div className="grid items-center gap-4 sm:gap-6 lg:grid-cols-[17rem_minmax(0,1fr)_19rem] lg:gap-10">
            <header>
              <h2 id="titre-eclate" className="type-display-2 lg:max-w-[12ch]">
                Les sept pièces d&apos;une montre
              </h2>
              <p className="type-body mt-3 max-w-[44ch] text-fg-soft lg:mt-6">
                L&apos;Abysse 40, ouverte du verre jusqu&apos;au fond. Je pose chaque pièce à la main, l&apos;une
                sur l&apos;autre.
              </p>
              {anime && (
                <p className="type-caption mt-6 hidden border-l border-accent-ink pl-3 text-fg-soft lg:block">
                  Faites défiler la page pour séparer les pièces.
                </p>
              )}
            </header>

            {/* Un halo froid derrière la pile, comme le fond de studio du héros. */}
            <div
              className={cn("mx-auto max-w-full", hauteurDessin)}
              style={{
                backgroundImage:
                  "radial-gradient(closest-side, color-mix(in srgb, var(--stage-in) 58%, transparent), transparent)",
              }}
            >
              <svg
                viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
                className="h-full w-auto max-w-full"
                role="img"
                aria-label="Vue éclatée de l'Abysse 40 : verre, lunette, aiguilles, cadran, mouvement, boîtier, fond"
              >
                <Definitions />

                {/* Du fond vers le verre : on empile comme on assemble. */}
                <Plan y={y("fond")}>
                  <Fond />
                  <Ombre surface="ecl-clip-fond" rayon={R_BOITIER} ouverture={ouverture} />
                </Plan>
                <Plan y={y("boitier")}>
                  <Boitier />
                  <Ombre surface="ecl-clip-boitier" rayon={R_MOUVEMENT + 8} ouverture={ouverture} />
                </Plan>
                <g transform={`translate(${CX} ${a2(CY + y("boitier"))})`} clipPath="url(#ecl-clip-emboitage)">
                  <g transform={`translate(0 ${a2(y("mouvement") - y("boitier"))})`}>
                    <Mouvement />
                    <Ombre surface="ecl-clip-mouvement" rayon={R_CADRAN} ouverture={ouverture} />
                  </g>
                </g>
                <Plan y={y("cadran")}>
                  <Cadran />
                  <Ombre surface="ecl-clip-cadran" rayon={R_LUNETTE} ouverture={ouverture} anneau />
                  <OmbreAiguilles ouverture={ouverture} />
                </Plan>
                <Plan y={y("aiguilles")}>
                  <Aiguilles />
                </Plan>
                <Plan y={y("lunette")}>
                  <Lunette />
                </Plan>
                <Plan y={y("verre")}>
                  <Verre />
                </Plan>
              </svg>
            </div>

            {/* Grand écran : chaque légende reste à la hauteur de son plan. */}
            <ol className={cn("relative hidden lg:block", hauteurDessin)}>
              {PLANS.map((couche, index) => {
                // Position figée sur celle du plan une fois la montre entièrement
                // séparée : les légendes ne se chevauchent jamais en cours de
                // route, et retombent pile en face de leur plan à l'arrivée.
                const pose = POSES[couche.cle];
                const haut = a2(((CY + pose.eclate + pose.ancre) / HAUTEUR) * 100);
                const visible = !anime || ouverture > 0.1 + index * 0.035;
                const enCours = index === actif;
                return (
                  <li
                    key={couche.cle}
                    className="absolute inset-x-0 flex -translate-y-1/2 items-start gap-4 transition-opacity duration-(--d-base) ease-atelier"
                    style={{ top: `${haut}%`, opacity: visible ? 1 : 0 }}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-[0.55rem] block h-px shrink-0 transition-all duration-(--d-base) ease-atelier",
                        enCours ? "w-10 bg-accent-ink" : anime ? "w-6 bg-rule" : "w-6 bg-accent-ink",
                      )}
                    />
                    <div>
                      <p className={cn("type-mono transition-colors duration-(--d-base) ease-atelier", enCours ? "text-accent-ink" : "text-fg")}>
                        <span className={enCours ? "text-accent-ink" : "text-fg-soft"}>{String(index + 1).padStart(2, "0")}</span>
                        <span className="ml-3">{couche.titre}</span>
                      </p>
                      <p className="type-caption mt-0.5 text-fg-soft">{couche.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* Petit écran : la légende du plan en cours, les autres restant
                lisibles par un lecteur d'écran. Sans animation, la liste entière. */}
            <div className="lg:hidden">
              {anime && (
                <div aria-hidden="true" className="mb-3 flex gap-1.5">
                  {PLANS.map((couche, index) => (
                    <span
                      key={couche.cle}
                      className={cn("h-0.5 flex-1 transition-colors duration-(--d-base) ease-atelier", index === actif ? "bg-accent-ink" : "bg-rule")}
                    />
                  ))}
                </div>
              )}
              <ol className={cn(anime ? "min-h-[3.25rem]" : "grid gap-x-8 gap-y-5 sm:grid-cols-2")}>
                {PLANS.map((couche, index) => (
                  <li key={couche.cle} className={cn(anime && index !== actif && "sr-only")}>
                    <p className="type-mono text-fg">
                      <span className="text-accent-ink">{String(index + 1).padStart(2, "0")}</span>
                      <span className="ml-3">{couche.titre}</span>
                    </p>
                    <p className="type-caption mt-1 text-fg-soft">{couche.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
