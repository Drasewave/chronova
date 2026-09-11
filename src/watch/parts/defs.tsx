import { METALS, mix, shade, tint } from "../palette";
import type { MetalTone, WatchRender } from "../types";

/**
 * Dégradés et filtres du rendu. Tous les identifiants sont préfixés par `uid`
 * pour que plusieurs montres puissent cohabiter sur une même page (collection,
 * panier, CRM) sans se voler leurs références.
 */
export function Defs({ uid, render }: { uid: string; render: WatchRender }) {
  const dial = render.dialColor;
  return (
    <defs>
      {(["acier", "dore", "noir", "bleui"] as MetalTone[]).map((tone) => (
        <MetalGradient key={tone} id={`${uid}-metal-${tone}`} tone={tone} />
      ))}

      {/* Flanc du boîtier : lumière rasante venant du haut-gauche. */}
      <linearGradient id={`${uid}-case`} x1="0.12" y1="0" x2="0.88" y2="1">
        <stop offset="0" stopColor={METALS[render.caseMetal].light} />
        <stop offset="0.34" stopColor={METALS[render.caseMetal].mid} />
        <stop offset="0.62" stopColor={METALS[render.caseMetal].dark} />
        <stop offset="1" stopColor={METALS[render.caseMetal].mid} />
      </linearGradient>

      {/* Le cadran n'est jamais plat : léger creux vers l'extérieur. */}
      <radialGradient id={`${uid}-dial`} cx="0.42" cy="0.34" r="0.82">
        <stop offset="0" stopColor={tint(dial, render.dialTexture === "mat" ? 0.05 : 0.16)} />
        <stop offset="0.58" stopColor={dial} />
        <stop offset="1" stopColor={shade(dial, 0.26)} />
      </radialGradient>

      {/* Vignettage du bord de cadran, sous la lunette. */}
      <radialGradient id={`${uid}-dial-vignette`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.72" stopColor={shade(dial, 0.3)} stopOpacity="0" />
        <stop offset="1" stopColor={shade(dial, 0.45)} stopOpacity="0.55" />
      </radialGradient>

      {/* Reflet du saphir : c'est ce dégradé que le pointeur fait glisser. */}
      <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FBF8F3" stopOpacity="0" />
        <stop offset="0.36" stopColor="#FBF8F3" stopOpacity="0.34" />
        <stop offset="0.5" stopColor="#FBF8F3" stopOpacity="0.1" />
        <stop offset="0.64" stopColor="#FBF8F3" stopOpacity="0.22" />
        <stop offset="1" stopColor="#FBF8F3" stopOpacity="0" />
      </linearGradient>

      {/* Voile antireflet : une pointe de bleu-vert, comme un vrai traitement. */}
      <radialGradient id={`${uid}-ar`} cx="0.32" cy="0.28" r="0.75">
        <stop offset="0" stopColor="#7FA096" stopOpacity="0.16" />
        <stop offset="0.7" stopColor="#7FA096" stopOpacity="0.04" />
        <stop offset="1" stopColor="#7FA096" stopOpacity="0" />
      </radialGradient>

      <radialGradient id={`${uid}-shadow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.45" stopColor="#34302A" stopOpacity="0.26" />
        <stop offset="0.8" stopColor="#34302A" stopOpacity="0.08" />
        <stop offset="1" stopColor="#34302A" stopOpacity="0" />
      </radialGradient>

      {/* Brossage circulaire : trame très fine, opacité faible. */}
      <pattern
        id={`${uid}-brushed`}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(28)"
      >
        <rect width="6" height="6" fill="none" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="#F5F0E8" strokeOpacity="0.22" strokeWidth="1" />
        <line x1="3" y1="0" x2="3" y2="6" stroke="#211E1B" strokeOpacity="0.1" strokeWidth="1" />
      </pattern>

      {/* Microbillé : grain mat, sans brillance. */}
      <pattern id={`${uid}-beaded`} width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="0.7" fill="#211E1B" fillOpacity="0.09" />
        <circle cx="3.8" cy="3.6" r="0.6" fill="#F5F0E8" fillOpacity="0.16" />
      </pattern>

      <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="7" />
      </filter>

      <clipPath id={`${uid}-dial-clip`}>
        <circle cx="500" cy="500" r="289" />
      </clipPath>
    </defs>
  );
}

function MetalGradient({ id, tone }: { id: string; tone: MetalTone }) {
  const m = METALS[tone];
  return (
    <linearGradient id={id} x1="0.1" y1="0.05" x2="0.9" y2="0.95">
      <stop offset="0" stopColor={m.light} />
      <stop offset="0.28" stopColor={m.mid} />
      <stop offset="0.52" stopColor={mix(m.mid, m.dark, 0.7)} />
      <stop offset="0.74" stopColor={m.mid} />
      <stop offset="1" stopColor={mix(m.light, m.mid, 0.4)} />
    </linearGradient>
  );
}
