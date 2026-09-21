import type { ReactNode } from "react";
import { INK, METALS, PAPER, isLight, mix, rampAt, type MetalRamp } from "../palette";
import { C, R_CASE, n, polar } from "../geometry";
import type { WatchRender } from "../types";
import { ConicDisk, Ring, annulus, jitter } from "./conic";
import { CushionBody } from "./cushion";

/**
 * Vue de dos.
 *
 * Fond plein : acier vissé, six encoches de clé, gravure au centre — l'aperçu
 * est direct, c'est là que le texte saisi dans le configurateur apparaît.
 * Fond transparent : saphir, et le mouvement travaille dessous. Le dessin change
 * avec le calibre : les NH sont des automatiques (masse oscillante, balancier),
 * le NH34 porte un rubis de plus pour son rouage GMT, le NH38 décale son
 * balancier, et le VK64 — méca-quartz — n'a ni masse ni balancier mais une
 * pile, une bobine et un pont de chronographe.
 */

/** Étagement du fond, du bord vers le centre. */
const R_FOND = 326; // diamètre hors tout du fond vissé
const R_PLAT_OUT = 317; // début du plat gravé, après le chanfrein extérieur
const R_PLAT_IN = 262;
const R_GLACE = 252; // ouverture : saphir ou médaillon central
const R_MVT = 240;

/** Le mouvement est rhodié quel que soit l'habillage : gris froid, jamais beige. */
const RHODIUM = METALS.acier;
const LAITON = METALS.dore;
const BLEUI = METALS.bleui;
const RUBIS = "#B3204C";
const RUBIS_ECLAT = "#FFC9D8";

export function BackView({ uid, render }: { uid: string; render: WatchRender }) {
  const ramp = METALS[render.caseMetal];
  const transparent = render.caseback === "transparent";
  const coussin = render.caseShape === "coussin";
  // Sur un traitement noir, la gravure laser ressort en clair ; ailleurs elle
  // se lit en creux sombre, avec une lèvre éclairée côté bas-droit.
  const surSombre = !isLight(ramp.mid);
  const trait = surSombre ? rampAt(ramp, 0.86) : rampAt(ramp, 0.07);
  const levre = surSombre ? INK : ramp.hi;

  const texteBas =
    transparent && render.engraving ? render.engraving : `ÉTANCHE 10 ATM · ${render.caseSize} MM`;

  return (
    <g data-view="dos">
      <defs>
        {/* Lignes de base des gravures circulaires : celle du haut tourne dans
            le sens horaire, celle du bas en sens inverse pour rester lisible. */}
        <path id={`${uid}-dos-arc-haut`} d={arc(272, 270, 90)} />
        <path id={`${uid}-dos-arc-bas`} d={arcBas(285)} />
        <clipPath id={`${uid}-dos-glace`}>
          <circle cx={C} cy={C} r={R_GLACE} />
        </clipPath>
        <filter id={`${uid}-dos-flou`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      {coussin ? (
        // Coussin : le dos montre la même silhouette que la face, et le fond
        // vissé rond s'y inscrit largement.
        <CushionBody uid={uid} metal={render.caseMetal} finish={render.caseFinish} prefix="dos-" />
      ) : (
        <>
          {/* Dos de carrure : même finition que les flancs, chanfrein poli au bord. */}
          <circle cx={C} cy={C} r={R_CASE - 1} fill={ramp.mid} />
          <Ring id={`${uid}-dos-clip-carrure`} disk={`${uid}-conic-case`} rOut={R_CASE} rIn={R_FOND - 2} />
          {render.caseFinish === "microbille" && <circle cx={C} cy={C} r={R_CASE} fill={`url(#${uid}-beaded)`} />}
          <Ring
            id={`${uid}-dos-clip-carrure-chanfrein`}
            disk={`${uid}-conic-poli`}
            rOut={R_CASE}
            rIn={R_CASE - 3.5}
            opacity={render.caseFinish === "microbille" ? 0.45 : 0.95}
          />
        </>
      )}
      {/* Le fond dépasse de la carrure : il y porte son ombre. */}
      <circle cx={C + 2} cy={C + 3} r={R_FOND + 1} fill="none" stroke={INK} strokeOpacity="0.42" strokeWidth="4" />

      {/* Fond vissé : chanfrein extérieur poli, plat dans la finition du boîtier. */}
      <Ring id={`${uid}-dos-clip-fond-chanfrein`} disk={`${uid}-conic-poli`} rOut={R_FOND} rIn={R_PLAT_OUT} />
      <Ring id={`${uid}-dos-clip-fond-plat`} disk={`${uid}-conic-case`} rOut={R_PLAT_OUT} rIn={R_PLAT_IN} rotate={38} />
      {render.caseFinish === "microbille" && (
        <path d={annulus(R_PLAT_OUT, R_PLAT_IN)} fillRule="evenodd" fill={`url(#${uid}-beaded)`} />
      )}
      {/* Un fond se brosse au tour : les stries sont des cercles, pas des rayons.
          On calme l'éventail et on pose quelques traits concentriques. */}
      {render.caseFinish === "brosse" && (
        <>
          <path d={annulus(R_PLAT_OUT, R_PLAT_IN)} fillRule="evenodd" fill={ramp.mid} fillOpacity="0.32" />
          {[268, 277, 283, 298, 304, 311].map((r, i) => (
            <circle
              key={r}
              cx={C}
              cy={C}
              r={r}
              fill="none"
              stroke={i % 2 ? INK : PAPER}
              strokeOpacity={i % 2 ? 0.1 : 0.22}
              strokeWidth={1 + jitter(i) * 1.6}
            />
          ))}
        </>
      )}

      {/* Six encoches de clé : un creux sombre, sa paroi bas-droite dans la lumière. */}
      {Array.from({ length: 6 }, (_, i) => {
        const d = sector(R_PLAT_OUT - 2, R_PLAT_OUT - 19, i * 60 + 30 - 4.2, i * 60 + 30 + 4.2);
        return (
          <g key={i}>
            <path d={d} fill={ramp.hi} fillOpacity="0.75" transform="translate(1.4 1.8)" />
            <path d={d} fill={rampAt(ramp, 0.05)} />
          </g>
        );
      })}

      {/* Filet tourné entre les encoches et la gravure. */}
      <circle cx={C} cy={C} r="293" fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="1.2" />
      <circle cx={C + 0.7} cy={C + 0.9} r="293" fill="none" stroke={ramp.hi} strokeOpacity="0.45" strokeWidth="0.8" />

      <Engraved path={`${uid}-dos-arc-haut`} size={13.5} spacing="0.3em" font="mono" fill={trait} lip={levre}>
        CHRONOVA · ACIER 316L · VERRE SAPHIR
      </Engraved>
      <Engraved
        path={`${uid}-dos-arc-bas`}
        size={transparent && render.engraving ? fit(render.engraving, 15, 620, 0.78) : 13.5}
        spacing={transparent && render.engraving ? "0.16em" : "0.3em"}
        font="mono"
        fill={trait}
        lip={levre}
      >
        {texteBas}
      </Engraved>

      {/* Chanfrein intérieur : tourné vers le centre, il renvoie le côté opposé. */}
      <Ring id={`${uid}-dos-clip-fond-gorge`} disk={`${uid}-conic-poli`} rOut={R_PLAT_IN} rIn={R_GLACE} rotate={180} />

      {transparent ? <Movement uid={uid} render={render} /> : <SolidBack uid={uid} render={render} trait={trait} levre={levre} />}

      {[R_GLACE, R_PLAT_IN, R_PLAT_OUT, R_FOND].map((r) => (
        <circle key={r} cx={C} cy={C} r={r} fill="none" stroke={ramp.edge} strokeOpacity={r === R_FOND ? 0.9 : 0.55} strokeWidth={r === R_FOND ? 1.5 : 1} />
      ))}
      {!coussin && <circle cx={C} cy={C} r={R_CASE} fill="none" stroke={ramp.edge} strokeOpacity="0.9" strokeWidth="1.6" />}
    </g>
  );
}

/** Médaillon d'un fond plein : brossage circulaire, filets tournés, gravures. */
function SolidBack({ uid, render, trait, levre }: { uid: string; render: WatchRender; trait: string; levre: string }) {
  const ramp = METALS[render.caseMetal];
  const texte = render.engraving;
  return (
    <g>
      <defs>
        {/* Le médaillon est très légèrement bombé : il prend la lumière en haut
            à gauche et la perd à l'opposé. */}
        <radialGradient id={`${uid}-dos-galbe`} cx="0.34" cy="0.3" r="0.85">
          <stop offset="0" stopColor={PAPER} stopOpacity="0.34" />
          <stop offset="0.45" stopColor={PAPER} stopOpacity="0" />
          <stop offset="1" stopColor={INK} stopOpacity="0.34" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R_GLACE} fill={ramp.mid} />
      <g clipPath={`url(#${uid}-dos-glace)`}>
        <use href={`#${uid}-conic-case`} transform={`rotate(-22 ${C} ${C})`} />
        {render.caseFinish === "microbille" && <circle cx={C} cy={C} r={R_GLACE} fill={`url(#${uid}-beaded)`} />}
      </g>
      {/* Même remarque que pour le plat : brossé au tour, l'éventail se calme. */}
      {render.caseFinish === "brosse" && <circle cx={C} cy={C} r={R_GLACE} fill={ramp.mid} fillOpacity="0.3" />}
      <circle cx={C} cy={C} r={R_GLACE} fill={`url(#${uid}-dos-galbe)`} />

      {/* Filets concentriques : un sillon sombre, son arête claire. */}
      {[236, 229, 178].map((r) => (
        <g key={r}>
          <circle cx={C} cy={C} r={r} fill="none" stroke={INK} strokeOpacity="0.42" strokeWidth="1.3" />
          <circle cx={C + 0.7} cy={C + 0.9} r={r} fill="none" stroke={ramp.hi} strokeOpacity="0.5" strokeWidth="0.8" />
        </g>
      ))}
      {/* Graduation décorative entre les deux filets intérieurs. */}
      <circle cx={C} cy={C} r="203" fill="none" stroke={trait} strokeOpacity="0.5" strokeWidth="10" strokeDasharray="1.4 9.23" />

      <Engraved x={C} y={C - 92} size={30} spacing="0.26em" font="title" fill={trait} lip={levre}>
        CHRONOVA
      </Engraved>
      <Engraved x={C} y={C - 62} size={12.5} spacing="0.26em" font="mono" fill={trait} lip={levre}>
        ASSEMBLÉ À LA MAIN
      </Engraved>

      {texte ? (
        <>
          {/* La gravure personnelle : la plus grande inscription du fond, isolée
              par deux filets pour qu'on ne lise qu'elle. */}
          <Rule y={C - 34} trait={trait} levre={levre} />
          <Engraved x={C} y={C + 17} size={fit(texte, 44, 318, 0.56)} spacing="0.03em" font="title" fill={trait} lip={levre} deep>
            {texte}
          </Engraved>
          <Rule y={C + 46} trait={trait} levre={levre} />
        </>
      ) : (
        <Engraved x={C} y={C + 22} size={46} spacing="0.12em" font="title" fill={trait} lip={levre} deep>
          {render.movement}
        </Engraved>
      )}

      <Engraved x={C} y={C + 84} size={13} spacing="0.24em" font="mono" fill={trait} lip={levre}>
        {texte ? `CALIBRE ${render.movement}` : render.movement === "VK64" ? "MÉCA-QUARTZ" : "AUTOMATIQUE · 24 RUBIS"}
      </Engraved>
      <Engraved x={C} y={C + 108} size={13} spacing="0.24em" font="mono" fill={trait} lip={levre}>
        {render.caseSize} MM
      </Engraved>
    </g>
  );
}

function Rule({ y, trait, levre }: { y: number; trait: string; levre: string }) {
  return (
    <>
      <line x1={C - 118} y1={y + 1.1} x2={C + 118} y2={y + 1.1} stroke={levre} strokeOpacity="0.5" strokeWidth="1" />
      <line x1={C - 118} y1={y} x2={C + 118} y2={y} stroke={trait} strokeOpacity="0.8" strokeWidth="1.2" />
      <circle cx={C} cy={y} r="3" fill={trait} />
    </>
  );
}

/** Mouvement sous saphir. */
function Movement({ uid, render }: { uid: string; render: WatchRender }) {
  const quartz = render.movement === "VK64";
  return (
    <g>
      <defs>
        {/* Perlage de la platine : des œils qui se chevauchent. */}
        <pattern id={`${uid}-dos-perlage`} width="17" height="17" patternUnits="userSpaceOnUse">
          <rect width="17" height="17" fill={rampAt(RHODIUM, 0.36)} />
          {[
            [0, 0],
            [17, 0],
            [0, 17],
            [17, 17],
            [8.5, 8.5],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="8.2"
              fill={rampAt(RHODIUM, i === 4 ? 0.44 : 0.38)}
              stroke={rampAt(RHODIUM, 0.66)}
              strokeOpacity="0.8"
              strokeWidth="0.9"
            />
          ))}
        </pattern>
        {/* Côtes de Genève : des bandes parallèles, chacune dégradée du clair au
            sombre — c'est la fraise qui mord puis relâche. */}
        <linearGradient id={`${uid}-dos-cote`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={rampAt(RHODIUM, 0.8)} />
          <stop offset="0.55" stopColor={rampAt(RHODIUM, 0.64)} />
          <stop offset="0.93" stopColor={rampAt(RHODIUM, 0.5)} />
          <stop offset="1" stopColor={rampAt(RHODIUM, 0.36)} />
        </linearGradient>
        <pattern
          id={`${uid}-dos-cotes`}
          width="13"
          height="13"
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(-32 ${C} ${C})`}
        >
          <rect width="13" height="13" fill={`url(#${uid}-dos-cote)`} />
        </pattern>
        {/* Anglage : l'arête polie des ponts, claire face à la lumière. */}
        <linearGradient id={`${uid}-dos-anglage`} gradientUnits="userSpaceOnUse" x1="330" y1="310" x2="680" y2="700">
          <stop offset="0" stopColor={RHODIUM.hi} />
          <stop offset="0.55" stopColor={RHODIUM.light} />
          <stop offset="1" stopColor={RHODIUM.dark} />
        </linearGradient>
        <Diag id={`${uid}-dos-or`} ramp={LAITON} />
        <Diag id={`${uid}-dos-acier`} ramp={RHODIUM} />
        <Diag id={`${uid}-dos-bleui`} ramp={BLEUI} />
      </defs>

      {/* Cercle d'emboîtage, puis la platine perlée. */}
      <circle cx={C} cy={C} r={R_GLACE} fill={rampAt(RHODIUM, 0.1)} />
      <circle cx={C} cy={C} r={R_MVT} fill={`url(#${uid}-dos-perlage)`} />
      <circle cx={C} cy={C} r={R_MVT} fill={`url(#${uid}-dial-vignette)`} />

      {quartz ? <QuartzModule uid={uid} /> : <Automatic uid={uid} render={render} />}

      {/* Le saphir : ombre de la gorge, fenêtre du studio, liseré en haut à gauche. */}
      <circle cx={C + 3} cy={C + 4} r={R_GLACE} fill="none" stroke={INK} strokeOpacity="0.3" strokeWidth="9" clipPath={`url(#${uid}-dos-glace)`} />
      <g clipPath={`url(#${uid}-dos-glace)`}>
        <rect x="200" y="200" width="600" height="600" fill={`url(#${uid}-sheen)`} transform={`rotate(-38 ${C} ${C})`} />
      </g>
      <path d={arc(R_GLACE - 5, 288, 340)} fill="none" stroke={PAPER} strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/** Calibres NH : ponts côtelés, balancier dégagé, masse oscillante par-dessus. */
function Automatic({ uid, render }: { uid: string; render: WatchRender }) {
  const aBal = render.movement === "NH38" ? 184 : 171;
  const bal = polar(134, aBal);
  const pied = polar(197, aBal + 50);
  const angleMasse = render.movement === "NH34" ? -52 : -34;

  const rubis: Array<[number, number, number]> = [
    [118, 62, 11],
    [168, 90, 10],
    [106, 113, 9],
    [92, 8, 11],
    [96, 262, 9],
    ...(render.movement === "NH34" ? ([[186, 108, 9]] as Array<[number, number, number]>) : []),
    ...(render.movement === "NH38" ? ([[70, 150, 8]] as Array<[number, number, number]>) : []),
  ];
  const vis: Array<[number, number]> = [
    [207, 49],
    [207, 121],
    [82, 86],
    [207, -76],
    [207, 28],
    [207, aBal + 86],
  ];

  // Coq : un bras qui part du bord et vient coiffer l'axe du balancier.
  const dx = bal.x - pied.x;
  const dy = bal.y - pied.y;
  const len = Math.hypot(dx, dy);
  const px = -dy / len;
  const py = dx / len;
  const coq = `M ${n(pied.x + px * 25)} ${n(pied.y + py * 25)} L ${n(bal.x + px * 15)} ${n(bal.y + py * 15)}
    A 15 15 0 0 1 ${n(bal.x - px * 15)} ${n(bal.y - py * 15)} L ${n(pied.x - px * 25)} ${n(pied.y - py * 25)}
    A 25 25 0 0 1 ${n(pied.x + px * 25)} ${n(pied.y + py * 25)} Z`;

  const ponts = [sector(227, 50, -84, 36), sector(227, 62, 42, 126), sector(227, 62, aBal + 72, 274), coq];

  return (
    <g>
      {/* Mobiles en laiton : on ne les voit que dans les jours entre les ponts. */}
      <Gear uid={uid} at={polar(158, 134)} r={44} />
      <Gear uid={uid} at={polar(88, 214)} r={34} />
      <Gear uid={uid} at={polar(176, aBal + 38)} r={22} steel />

      {/* Balancier : serge dorée, trois bras, et le spiral qui respire au centre. */}
      <circle cx={n(bal.x)} cy={n(bal.y)} r="74" fill={INK} fillOpacity="0.4" />
      <path d={spiral(bal.x, bal.y, 7, 40, 8)} fill="none" stroke={mix(RHODIUM.dark, BLEUI.mid, 0.55)} strokeWidth="1.1" />
      {[18, 138, 258].map((a) => (
        <line
          key={a}
          x1={n(bal.x)}
          y1={n(bal.y)}
          x2={n(bal.x + 62 * Math.sin((a * Math.PI) / 180))}
          y2={n(bal.y - 62 * Math.cos((a * Math.PI) / 180))}
          stroke={LAITON.mid}
          strokeWidth="5"
        />
      ))}
      <circle cx={n(bal.x)} cy={n(bal.y)} r="64" fill="none" stroke={`url(#${uid}-dos-or)`} strokeWidth="8" />
      <circle cx={n(bal.x)} cy={n(bal.y)} r="68" fill="none" stroke={LAITON.edge} strokeOpacity="0.7" strokeWidth="0.9" />
      <circle cx={n(bal.x)} cy={n(bal.y)} r="60" fill="none" stroke={LAITON.edge} strokeOpacity="0.6" strokeWidth="0.9" />

      {/* Ponts : posés sur la platine, donc ombre portée ; côtes puis anglage. */}
      <g filter={`url(#${uid}-contact-shadow)`}>
        {ponts.map((d, i) => (
          <path key={i} d={d} fill={rampAt(RHODIUM, 0.6)} strokeLinejoin="round" />
        ))}
      </g>
      {ponts.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={`url(#${uid}-dos-cotes)`}
          stroke={`url(#${uid}-dos-anglage)`}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      ))}
      {/* Rochet : la grande roue d'acier vissée sur le barillet. */}
      <Ratchet uid={uid} at={polar(150, -34)} r={52} />

      {rubis.map(([r, a, size]) => (
        <Jewel key={`${r}-${a}`} uid={uid} at={polar(r, a)} r={size} />
      ))}
      {vis.map(([r, a], i) => (
        <Screw key={`${r}-${a}`} uid={uid} at={polar(r, a)} r={9.5} blued index={i} />
      ))}

      {/* Antichoc du balancier : chaton doré, rubis, et la raquette de réglage. */}
      <line
        x1={n(bal.x)}
        y1={n(bal.y)}
        x2={n(bal.x + px * 46 + (dx / len) * 12)}
        y2={n(bal.y + py * 46 + (dy / len) * 12)}
        stroke={RHODIUM.light}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <Jewel uid={uid} at={bal} r={12} />
      <Screw uid={uid} at={pied} r={10} blued index={9} />

      <Rotor uid={uid} angle={angleMasse} calibre={render.movement} />
    </g>
  );
}

/**
 * Masse oscillante : une demi-lune ajourée, brossée en rayons, lestée d'un
 * segment lourd au pourtour — c'est lui qui la fait tomber au moindre geste.
 */
function Rotor({ uid, angle, calibre }: { uid: string; angle: number; calibre: string }) {
  const rOut = 232;
  const rMasse = 186;
  const silhouette = `M ${C - rOut} ${C} A ${rOut} ${rOut} 0 0 1 ${C + rOut} ${C} Z ${sector(152, 76, -66, -11)} ${sector(152, 76, 11, 66)}`;
  const jours = [sector(152, 76, -66, -11), sector(152, 76, 11, 66)];
  return (
    <g>
      <defs>
        <ConicDisk
          id={`${uid}-dos-conic-masse`}
          count={96}
          radius={rOut + 6}
          colorAt={(a, i) => {
            const bow = 0.5 + 0.5 * Math.cos((2 * (a - 318) * Math.PI) / 180);
            return rampAt(RHODIUM, 0.4 + 0.5 * bow ** 1.5 + (jitter(i) - 0.5) * 0.12);
          }}
        />
        <clipPath id={`${uid}-dos-clip-masse`}>
          <path d={silhouette} clipRule="evenodd" />
        </clipPath>
        <path id={`${uid}-dos-arc-masse`} d={arc(202, 270, 90)} />
      </defs>

      {/* Ombre portée sur le mouvement : la masse vole un bon millimètre au-dessus. */}
      <g transform="translate(6 9)" filter={`url(#${uid}-dos-flou)`} clipPath={`url(#${uid}-dos-glace)`}>
        <path d={silhouette} fillRule="evenodd" fill={INK} fillOpacity="0.55" transform={`rotate(${angle} ${C} ${C})`} />
      </g>

      <g transform={`rotate(${angle} ${C} ${C})`}>
        <g clipPath={`url(#${uid}-dos-clip-masse)`}>
          {/* L'éventail est contre-tourné : la masse pivote, pas le studio. */}
          <use href={`#${uid}-dos-conic-masse`} transform={`rotate(${-angle} ${C} ${C})`} />
          <path d={sector(rOut, rMasse, -90, 90)} fill={INK} fillOpacity="0.16" />
        </g>
        {/* Marche entre le voile et le segment lourd. */}
        <path d={arc(rMasse, 270, 90)} fill="none" stroke={INK} strokeOpacity="0.55" strokeWidth="1.6" />
        <path d={arc(rMasse - 1.8, 270, 90)} fill="none" stroke={RHODIUM.hi} strokeOpacity="0.75" strokeWidth="1.2" />
        {/* Chanfreins polis : pourtour, corde et jours. */}
        <path d={arc(rOut - 2, 270, 90)} fill="none" stroke={RHODIUM.hi} strokeOpacity="0.9" strokeWidth="3" />
        {jours.map((d) => (
          <path key={d} d={d} fill="none" stroke={`url(#${uid}-dos-anglage)`} strokeWidth="2.2" strokeLinejoin="round" />
        ))}
        <line x1={C - rOut} y1={C - 1.4} x2={C + rOut} y2={C - 1.4} stroke={RHODIUM.hi} strokeOpacity="0.7" strokeWidth="1.4" />
        <path d={silhouette} fillRule="evenodd" fill="none" stroke={RHODIUM.edge} strokeOpacity="0.8" strokeWidth="1.2" />

        <Engraved path={`${uid}-dos-arc-masse`} size={14} spacing="0.22em" font="mono" fill={rampAt(RHODIUM, 0.06)} lip={RHODIUM.hi}>
          {`CHRONOVA · CALIBRE ${calibre} · 24 RUBIS`}
        </Engraved>
      </g>

      {/* Roulement à billes et vis centrale. */}
      <circle cx={C} cy={C} r="33" fill={`url(#${uid}-dos-acier)`} stroke={RHODIUM.edge} strokeWidth="1.2" />
      <circle cx={C} cy={C} r="24" fill="none" stroke={INK} strokeOpacity="0.6" strokeWidth="5" strokeDasharray="3.2 4.34" />
      <Screw uid={uid} at={{ x: C, y: C }} r={14} index={4} />
    </g>
  );
}

/**
 * VK64 : un module méca-quartz. Pas d'échappement à voir, mais une pile sous sa
 * bride, la bobine du moteur pas à pas, et le pont du mécanisme de chronographe
 * — la moitié « méca », côtelée comme un calibre mécanique.
 */
function QuartzModule({ uid }: { uid: string }) {
  const pile = polar(126, 221);
  const bobine = polar(150, 298);
  const quartz = polar(112, 330);
  const circuit = mix(INK, "#1D4636", 0.42);
  const ponts = [sector(227, 44, -14, 118), sector(227, 118, 124, 176)];
  return (
    <g>
      <defs>
        <pattern id={`${uid}-dos-spires`} width="2.4" height="8" patternUnits="userSpaceOnUse">
          <line x1="0.6" y1="0" x2="0.6" y2="8" stroke={INK} strokeOpacity="0.4" strokeWidth="0.8" />
          <line x1="1.8" y1="0" x2="1.8" y2="8" stroke={PAPER} strokeOpacity="0.22" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Circuit : vernis sombre, pistes dorées. */}
      <path d={sector(227, 52, 258, 340)} fill={circuit} stroke={INK} strokeOpacity="0.7" strokeWidth="1.5" strokeLinejoin="round" filter={`url(#${uid}-contact-shadow)`} />
      {[208, 196, 84].map((r, i) => (
        <path key={r} d={arc(r, 264 + i * 6, 334 - i * 9)} fill="none" stroke={LAITON.mid} strokeOpacity="0.75" strokeWidth="1.6" />
      ))}
      {[268, 284, 312, 328].map((a) => {
        const p = polar(176, a);
        return <circle key={a} cx={n(p.x)} cy={n(p.y)} r="4" fill={`url(#${uid}-dos-or)`} />;
      })}

      {/* Bobine : fil de cuivre émaillé entre deux joues. */}
      <g transform={`rotate(${298} ${n(bobine.x)} ${n(bobine.y)})`}>
        <rect x={n(bobine.x - 58)} y={n(bobine.y - 17)} width="116" height="34" rx="15" fill="#A4532B" />
        <rect x={n(bobine.x - 58)} y={n(bobine.y - 17)} width="116" height="34" rx="15" fill={`url(#${uid}-dos-spires)`} />
        <rect x={n(bobine.x - 50)} y={n(bobine.y - 12)} width="100" height="7" rx="3.5" fill="#FFD2B0" fillOpacity="0.4" />
        <rect x={n(bobine.x - 58)} y={n(bobine.y + 6)} width="116" height="11" rx="5" fill={INK} fillOpacity="0.3" />
        {[-66, 56].map((o) => (
          <rect key={o} x={n(bobine.x + o)} y={n(bobine.y - 21)} width="10" height="42" rx="2.5" fill={rampAt(RHODIUM, 0.16)} />
        ))}
      </g>
      {/* Résonateur à quartz : le petit cylindre d'acier. */}
      <rect
        x={n(quartz.x - 27)}
        y={n(quartz.y - 9)}
        width="54"
        height="18"
        rx="9"
        fill={`url(#${uid}-metal-acier)`}
        stroke={RHODIUM.edge}
        strokeWidth="1"
        transform={`rotate(330 ${n(quartz.x)} ${n(quartz.y)})`}
      />

      {/* Ponts du chronographe. */}
      <g filter={`url(#${uid}-contact-shadow)`}>
        {ponts.map((d, i) => (
          <path key={i} d={d} fill={rampAt(RHODIUM, 0.6)} />
        ))}
      </g>
      {ponts.map((d, i) => (
        <path key={i} d={d} fill={`url(#${uid}-dos-cotes)`} stroke={`url(#${uid}-dos-anglage)`} strokeWidth="3" strokeLinejoin="round" />
      ))}
      <defs>
        <path id={`${uid}-dos-arc-pont`} d={arc(176, -6, 112)} />
      </defs>
      <Engraved path={`${uid}-dos-arc-pont`} size={14} spacing="0.2em" font="mono" fill={rampAt(RHODIUM, 0.06)} lip={RHODIUM.hi}>
        CALIBRE VK64 · MÉCA-QUARTZ
      </Engraved>
      {(
        [
          [120, 8, 10],
          [132, 58, 10],
          [92, 98, 9],
          [170, 150, 9],
        ] as Array<[number, number, number]>
      ).map(([r, a, size]) => (
        <Jewel key={`${r}-${a}`} uid={uid} at={polar(r, a)} r={size} />
      ))}
      {(
        [
          [208, -6],
          [208, 110],
          [72, 40],
          [206, 132],
          [206, 168],
        ] as Array<[number, number]>
      ).map(([r, a], i) => (
        <Screw key={`${r}-${a}`} uid={uid} at={polar(r, a)} r={9.5} blued index={i + 2} />
      ))}

      {/* Pile bouton sous sa bride vissée. */}
      <circle cx={n(pile.x + 4)} cy={n(pile.y + 6)} r="82" fill={INK} fillOpacity="0.45" filter={`url(#${uid}-dos-flou)`} />
      <circle cx={n(pile.x)} cy={n(pile.y)} r="80" fill={`url(#${uid}-dos-acier)`} stroke={RHODIUM.edge} strokeWidth="1.4" />
      <circle cx={n(pile.x)} cy={n(pile.y)} r="76" fill="none" stroke={RHODIUM.hi} strokeOpacity="0.7" strokeWidth="1.4" />
      <circle cx={n(pile.x)} cy={n(pile.y)} r="66" fill="none" stroke={INK} strokeOpacity="0.22" strokeWidth="1.2" />
      <Engraved x={n(pile.x)} y={n(pile.y - 18)} size={26} spacing="0" font="mono" fill={rampAt(RHODIUM, 0.12)} lip={RHODIUM.hi}>
        +
      </Engraved>
      <Engraved x={n(pile.x)} y={n(pile.y + 12)} size={14} spacing="0.16em" font="mono" fill={rampAt(RHODIUM, 0.12)} lip={RHODIUM.hi}>
        SR936SW
      </Engraved>
      <Engraved x={n(pile.x)} y={n(pile.y + 32)} size={10} spacing="0.2em" font="mono" fill={rampAt(RHODIUM, 0.12)} lip={RHODIUM.hi}>
        1,55 V
      </Engraved>
      {(() => {
        const a = polar(216, 204);
        const b = polar(184, 210);
        return (
          <g filter={`url(#${uid}-contact-shadow)`}>
            <line x1={n(a.x)} y1={n(a.y)} x2={n(b.x)} y2={n(b.y)} stroke={rampAt(RHODIUM, 0.82)} strokeWidth="24" strokeLinecap="round" />
            <line x1={n(a.x)} y1={n(a.y)} x2={n(b.x)} y2={n(b.y)} stroke={RHODIUM.edge} strokeOpacity="0.35" strokeWidth="1" />
          </g>
        );
      })()}
      <Screw uid={uid} at={polar(212, 204)} r={9} index={7} />
    </g>
  );
}

/** Rubis serti : chaton doré, pierre rouge-rosé, éclat, trou de pivot. */
function Jewel({ uid, at, r }: { uid: string; at: { x: number; y: number }; r: number }) {
  const x = n(at.x);
  const y = n(at.y);
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={`url(#${uid}-dos-or)`} stroke={LAITON.edge} strokeOpacity="0.8" strokeWidth="0.9" />
      <circle cx={x} cy={y} r={n(r * 0.62)} fill={RUBIS} stroke={mix(RUBIS, INK, 0.5)} strokeWidth="0.8" />
      <circle cx={n(x - r * 0.2)} cy={n(y - r * 0.24)} r={n(r * 0.2)} fill={RUBIS_ECLAT} fillOpacity="0.9" />
      <circle cx={x} cy={y} r={n(r * 0.14)} fill={INK} fillOpacity="0.75" />
    </g>
  );
}

/** Vis à fente : bleuie au feu sur les ponts, polie sur la masse et la bride. */
function Screw({
  uid,
  at,
  r,
  blued = false,
  index,
}: {
  uid: string;
  at: { x: number; y: number };
  r: number;
  blued?: boolean;
  index: number;
}) {
  const x = n(at.x);
  const y = n(at.y);
  // Aucune vis n'est serrée au même angle : la fente est orientée par l'indice.
  const a = (jitter(index * 7 + 3) * 180 * Math.PI) / 180;
  const ux = Math.cos(a) * r * 0.86;
  const uy = Math.sin(a) * r * 0.86;
  return (
    <g>
      <circle cx={n(x + 1)} cy={n(y + 1.4)} r={r + 1.6} fill={INK} fillOpacity="0.5" />
      <circle cx={x} cy={y} r={r} fill={`url(#${uid}-dos-${blued ? "bleui" : "acier"})`} stroke={(blued ? BLEUI : RHODIUM).edge} strokeWidth="0.9" />
      <line x1={n(x - ux)} y1={n(y - uy)} x2={n(x + ux)} y2={n(y + uy)} stroke={INK} strokeOpacity="0.85" strokeWidth={n(r * 0.3)} />
    </g>
  );
}

/** Mobile denté, vu par transparence : jante, croisillon, et les dents en pointillé. */
function Gear({ uid, at, r, steel = false }: { uid: string; at: { x: number; y: number }; r: number; steel?: boolean }) {
  const x = n(at.x);
  const y = n(at.y);
  const ramp = steel ? RHODIUM : LAITON;
  const fill = `url(#${uid}-dos-${steel ? "acier" : "or"})`;
  const pas = n((2 * Math.PI * r) / Math.round((2 * Math.PI * r) / 5) / 2);
  const jante = n(r * 0.26);
  const bras = n(r * 0.7);
  return (
    <g>
      <circle cx={n(x + 2)} cy={n(y + 3)} r={r} fill={INK} fillOpacity="0.35" />
      <circle cx={x} cy={y} r={r} fill="none" stroke={ramp.dark} strokeWidth="5" strokeDasharray={`${pas} ${pas}`} />
      <circle cx={x} cy={y} r={n(r - 2 - jante / 2)} fill="none" stroke={fill} strokeWidth={jante} />
      <path
        d={`M ${n(x - bras)} ${y} H ${n(x + bras)} M ${x} ${n(y - bras)} V ${n(y + bras)}`}
        stroke={ramp.mid}
        strokeWidth={n(r * 0.16)}
        transform={`rotate(${n(jitter(r) * 90)} ${x} ${y})`}
      />
      <circle cx={x} cy={y} r={n(r * 0.24)} fill={fill} stroke={ramp.edge} strokeOpacity="0.6" strokeWidth="0.8" />
    </g>
  );
}

/** Rochet : roue pleine en acier, dents de loup, vissée au centre. */
function Ratchet({ uid, at, r }: { uid: string; at: { x: number; y: number }; r: number }) {
  const x = n(at.x);
  const y = n(at.y);
  const pas = n((2 * Math.PI * r) / 56 / 2);
  return (
    <g>
      <circle cx={n(x + 2)} cy={n(y + 3)} r={r + 2} fill={INK} fillOpacity="0.4" />
      <circle cx={x} cy={y} r={r - 2} fill={`url(#${uid}-dos-acier)`} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={RHODIUM.dark} strokeWidth="5" strokeDasharray={`${pas} ${pas}`} />
      <Screw uid={uid} at={at} r={n(r * 0.24)} index={r} />
    </g>
  );
}

/** Gravure : le creux, et sa lèvre bas-droite qui accroche la lumière. */
function Engraved({
  children,
  x,
  y,
  path,
  offset = "50%",
  size,
  spacing,
  font,
  fill,
  lip,
  deep = false,
}: {
  children: ReactNode;
  x?: number;
  y?: number;
  path?: string;
  offset?: string;
  size: number;
  spacing: string;
  font: "title" | "mono";
  fill: string;
  lip: string;
  /** Gravure profonde : la lèvre s'écarte davantage. */
  deep?: boolean;
}) {
  const style = { fontFamily: `var(--font-${font})`, fontSize: size, letterSpacing: spacing };
  const body = path ? (
    <textPath href={`#${path}`} startOffset={offset}>
      {children}
    </textPath>
  ) : (
    children
  );
  return (
    <>
      <text x={x} y={y} textAnchor="middle" fill={lip} fillOpacity={deep ? 0.7 : 0.5} transform={deep ? "translate(1.3 1.7)" : "translate(0.8 1)"} style={style}>
        {body}
      </text>
      <text x={x} y={y} textAnchor="middle" fill={fill} style={style}>
        {body}
      </text>
    </>
  );
}

/** Dégradé diagonal d'une petite pièce polie, éclairée du haut-gauche. */
function Diag({ id, ramp }: { id: string; ramp: MetalRamp }) {
  return (
    <linearGradient id={id} x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stopColor={ramp.hi} />
      <stop offset="0.35" stopColor={ramp.light} />
      <stop offset="0.62" stopColor={ramp.mid} />
      <stop offset="0.86" stopColor={ramp.dark} />
      <stop offset="1" stopColor={ramp.mid} />
    </linearGradient>
  );
}

/** Corps de gravure qui tient dans `largeur` : un prénom comme une devise. */
function fit(texte: string, max: number, largeur: number, chasse: number): number {
  return n(Math.max(12, Math.min(max, largeur / (Math.max(1, texte.length) * chasse))));
}

function pt(r: number, a: number): string {
  const p = polar(r, a);
  return `${n(p.x)} ${n(p.y)}`;
}

/** Arc horaire de `a0` à `a1` (degrés, 0° = midi). */
function arc(r: number, a0: number, a1: number): string {
  const span = (((a1 - a0) % 360) + 360) % 360;
  return `M ${pt(r, a0)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${pt(r, a1)}`;
}

/** Demi-cercle inférieur parcouru de gauche à droite : le texte s'y lit à l'endroit. */
function arcBas(r: number): string {
  return `M ${C - r} ${C} A ${r} ${r} 0 0 0 ${C + r} ${C}`;
}

/** Secteur annulaire, de `a0` à `a1` dans le sens horaire. */
function sector(rOut: number, rIn: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${pt(rOut, a0)} A ${rOut} ${rOut} 0 ${large} 1 ${pt(rOut, a1)} L ${pt(rIn, a1)} A ${rIn} ${rIn} 0 ${large} 0 ${pt(rIn, a0)} Z`;
}

/** Spiral d'Archimède, du piton vers la virole. */
function spiral(cx: number, cy: number, rIn: number, rOut: number, turns: number): string {
  const steps = turns * 18;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const r = rIn + (rOut - rIn) * t;
    const a = t * turns * 2 * Math.PI;
    return `${i === 0 ? "M" : "L"} ${n(cx + r * Math.cos(a))} ${n(cy + r * Math.sin(a))}`;
  }).join(" ");
}
