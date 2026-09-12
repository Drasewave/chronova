import { METALS, shade } from "../palette";
import type { WatchRender } from "../types";

/**
 * Vue de profil.
 *
 * Elle montre ce qu'une vue de face cache : l'épaisseur de la carrure, le galbe
 * du verre — un saphir bombé change réellement la silhouette —, la courbe des
 * cornes qui décide du confort au poignet, et la couronne vue de côté.
 */
export function ProfileView({ uid, render }: { uid: string; render: WatchRender }) {
  const ramp = METALS[render.caseMetal];
  const couronne = METALS[render.crownMetal];
  const bombe = render.crystal === "bombe";
  const hautVerre = bombe ? 372 : 400;
  const hautLunette = render.bezelStyle === "plongee" ? 404 : 414;
  const basFond = render.caseback === "plein" ? 574 : 562;
  const acier = render.strapKind === "acier-3-maillons" || render.strapKind === "acier-jubile";
  const brin = acier ? ramp.mid : render.strapColor;

  return (
    <g data-view="profil">
      {/* Brins : ils prolongent les cornes et s'incurvent vers le poignet. */}
      {[-1, 1].map((sens) => (
        <g key={sens}>
          <path
            d={`M ${500 + sens * 118} 566
                C ${500 + sens * 198} 594 ${500 + sens * 250} 706 ${500 + sens * 262} 1010
                L ${500 + sens * 182} 1010
                C ${500 + sens * 172} 726 ${500 + sens * 138} 634 ${500 + sens * 82} 604 Z`}
            fill={brin}
            stroke={shade(brin, 0.34)}
            strokeWidth="2.5"
          />
          {acier &&
            Array.from({ length: 6 }, (_, i) => {
              const t = 0.12 + i * 0.15;
              const xExt = 500 + sens * (118 + (262 - 118) * t * t);
              const xInt = 500 + sens * (82 + (182 - 82) * t * t);
              const y = 566 + (1010 - 566) * t;
              return (
                <line
                  key={i}
                  x1={xExt}
                  y1={y}
                  x2={xInt}
                  y2={y + 14}
                  stroke={shade(brin, 0.32)}
                  strokeOpacity="0.75"
                  strokeWidth="3"
                />
              );
            })}
        </g>
      ))}

      {/* Cornes. */}
      {[-1, 1].map((sens) => (
        <path
          key={sens}
          d={`M ${500 + sens * 72} 520
              C ${500 + sens * 146} 522 ${500 + sens * 190} 548 ${500 + sens * 196} 600
              L ${500 + sens * 96} 612
              C ${500 + sens * 92} 576 ${500 + sens * 78} 560 ${500 + sens * 44} 552 Z`}
          fill={`url(#${uid}-case)`}
          stroke={ramp.edge}
          strokeWidth="3"
        />
      ))}

      {/* Fond : plein et légèrement bombé, ou saphir plus plat. */}
      <path
        d={`M 338 528 L 662 528 C 658 ${basFond - 26} 596 ${basFond} 500 ${basFond}
            C 404 ${basFond} 342 ${basFond - 26} 338 528 Z`}
        fill={render.caseback === "plein" ? `url(#${uid}-case)` : "#96A0A4"}
        stroke={ramp.edge}
        strokeWidth="2.5"
      />

      {/* Couronne, vue de côté : la même forme que sur la vue de face. */}
      <g data-layer="couronne">
        <rect x="690" y="476" width="26" height="48" fill={couronne.dark} stroke={couronne.edge} strokeWidth="1.5" />
        <path
          d={`M 706 462 L 768 470 L 768 530 L 706 538 Z`}
          fill={`url(#${uid}-metal-${render.crownMetal})`}
          stroke={couronne.edge}
          strokeWidth="2"
        />
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={i}
            x1="712"
            y1={474 + i * 10.5}
            x2="762"
            y2={479 + i * 10.5}
            stroke={i % 2 ? couronne.light : couronne.dark}
            strokeOpacity="0.8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Carrure. */}
      <path
        d="M 306 442 L 694 442 C 702 480 698 512 684 532 L 316 532 C 302 512 298 480 306 442 Z"
        fill={`url(#${uid}-case)`}
        stroke={ramp.edge}
        strokeWidth="2.5"
      />
      {render.caseFinish === "brosse" && (
        <path
          d="M 306 442 L 694 442 C 702 480 698 512 684 532 L 316 532 C 302 512 298 480 306 442 Z"
          fill={`url(#${uid}-brushed)`}
        />
      )}
      {render.caseFinish === "microbille" && (
        <path
          d="M 306 442 L 694 442 C 702 480 698 512 684 532 L 316 532 C 302 512 298 480 306 442 Z"
          fill={`url(#${uid}-beaded)`}
        />
      )}

      {/* Lunette : elle déborde légèrement de la carrure. */}
      <path
        d={`M 302 ${hautLunette} L 698 ${hautLunette} L 694 442 L 306 442 Z`}
        fill={ramp.mid}
        stroke={ramp.edge}
        strokeWidth="2.5"
      />
      {render.bezelStyle === "plongee" && render.insertColor && (
        <rect x="306" y={hautLunette + 4} width="388" height="16" fill={render.insertColor} />
      )}
      {render.bezelStyle === "cannelee" &&
        Array.from({ length: 26 }, (_, i) => (
          <line
            key={i}
            x1={312 + i * 15}
            y1={hautLunette + 3}
            x2={312 + i * 15}
            y2="439"
            stroke={i % 2 ? ramp.dark : ramp.light}
            strokeOpacity="0.85"
            strokeWidth="4"
          />
        ))}

      {/* Verre. Tout l'intérêt de la vue est là : plat ou bombé. */}
      <path
        d={`M 326 ${hautLunette} C 368 ${hautVerre} 632 ${hautVerre} 674 ${hautLunette} Z`}
        fill="#E7EEEC"
        fillOpacity={render.antiGlare ? 0.48 : 0.68}
        stroke={ramp.edge}
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <path
        d={`M 382 ${hautVerre + (bombe ? 20 : 9)} C 440 ${hautVerre + (bombe ? 2 : 3)} 520 ${hautVerre + (bombe ? 0 : 2)} 576 ${hautVerre + (bombe ? 10 : 5)}`}
        fill="none"
        stroke="#FBF8F3"
        strokeWidth="5"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
    </g>
  );
}
