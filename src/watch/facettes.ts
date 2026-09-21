import { METALS, rampAt } from "./palette";
import type { MetalTone } from "./types";
import { studioLum } from "./parts/conic";

/**
 * Ombrage des facettes d'aiguille, en fonction de l'angle réel de l'aiguille
 * dans le studio. Module pur, partagé : le serveur s'en sert pour la pose de
 * catalogue (`parts/hands.tsx`), le navigateur pour faire suivre la facette
 * éclairée quand l'aiguille tourne (`horloge-vivante.tsx`). Une seule formule,
 * donc aucune saute de teinte au moment où l'horloge prend la main.
 */

/** Aiguille pliée en deux facettes : teintes gauche et droite du dégradé à rupture franche. */
export function teintesFacettes(metal: MetalTone, angle: number): readonly [gauche: string, droite: string] {
  const ramp = METALS[metal];
  return [
    rampAt(ramp, 0.3 + 0.7 * studioLum(angle - 90, "poli")),
    rampAt(ramp, 0.3 + 0.7 * studioLum(angle + 90, "poli")),
  ];
}

/**
 * Dauphine : l'écart entre le versant qui prend la lumière et celui qui renvoie
 * le noir du studio est forcé, comme le ferait un photographe en tournant la
 * montre d'un degré.
 */
export function teintesDauphine(metal: MetalTone, angle: number): readonly [gauche: string, droite: string] {
  const ramp = METALS[metal];
  const lumG = studioLum(angle - 90, "poli");
  const lumD = studioLum(angle + 90, "poli");
  const gaucheClair = lumG >= lumD;
  const clair = (l: number) => rampAt(ramp, 0.62 + 0.38 * l);
  const sombre = (l: number) => rampAt(ramp, 0.1 + 0.26 * l);
  return [gaucheClair ? clair(lumG) : sombre(lumG), gaucheClair ? sombre(lumD) : clair(lumD)];
}
