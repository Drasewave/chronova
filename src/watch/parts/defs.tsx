import { INK, METALS, PAPER, glow, isLight, mix, rampAt, shade, tint } from "../palette";
import type { CaseFinish, MetalTone, WatchRender } from "../types";
import { ConicDisk, jitter, studioLum, type Sheen } from "./conic";

/** Ce que renvoie une carrure selon sa finition. */
export const FINISH_SHEEN: Record<CaseFinish, Sheen> = {
  brosse: "brosse",
  poli: "poli",
  microbille: "mat",
};

/**
 * Dégradés, éventails de reflets et filtres du rendu. Tous les identifiants
 * sont préfixés par `uid` pour que plusieurs montres puissent cohabiter sur une
 * même page (collection, panier, CRM) sans se voler leurs références.
 */
export function Defs({
  uid,
  render,
  detail = "full",
}: {
  uid: string;
  render: WatchRender;
  detail?: "full" | "compact";
}) {
  const dial = render.dialColor;
  const ramp = METALS[render.caseMetal];
  const full = detail === "full";
  const finish = FINISH_SHEEN[render.caseFinish];
  const insert = render.insertColor ?? "#1B2B45";
  const ceramic = (render.insertMaterial ?? "ceramique") === "ceramique";

  // Seuls les métaux réellement montés ont besoin de leur cylindre poli :
  // canon des aiguilles, couronne, poussoirs — et l'acier des passants et de
  // la pile, toujours.
  const tones = [...new Set<MetalTone>(["acier", render.caseMetal, render.crownMetal, render.handMetal])];

  return (
    <defs>
      {tones.map((tone) => (
        <MetalGradient key={tone} id={`${uid}-metal-${tone}`} tone={tone} />
      ))}

      {/* Éventail de la carrure : sa finition décide de la dureté des reflets.
          Le brossé reçoit en plus un grain de stries, secteur par secteur. */}
      <ConicDisk
        id={`${uid}-conic-case`}
        count={finish === "brosse" ? (full ? 240 : 48) : full ? 120 : 40}
        colorAt={(angle, i) =>
          rampAt(ramp, studioLum(angle, finish) + (finish === "brosse" ? (jitter(i) - 0.5) * 0.16 : 0))
        }
      />
      {/* Éventail poli : lunette, chanfreins, réhaut — toujours polis, quelle
          que soit la finition des flancs. */}
      <ConicDisk
        id={`${uid}-conic-poli`}
        count={full ? 120 : 36}
        colorAt={(angle) => rampAt(ramp, studioLum(angle, "poli"))}
      />
      {(render.bezelStyle === "plongee" || render.bezelStyle === "gmt" || render.bezelStyle === "tachymetre") &&
        [
          [`${uid}-conic-insert`, render.bezelStyle === "tachymetre" ? (render.insertColor ?? "#17191C") : insert] as const,
          // Insert bicolore (demi-lunette de jour d'un GMT, secteur des vingt
          // minutes d'une plongeuse) : la seconde teinte a son propre éventail.
          ...(render.bezelStyle !== "tachymetre" && render.insertColor2
            ? [[`${uid}-conic-insert-jour`, render.insertColor2] as const]
            : []),
        ].map(([id, teinte]) => (
          <ConicDisk
            key={id}
            id={id}
            count={full ? 120 : 36}
            colorAt={(angle) =>
              ceramic
                ? mix(shade(teinte, 0.38), tint(teinte, 0.6), studioLum(angle, "ceramique"))
                : mix(shade(teinte, 0.12), tint(teinte, 0.2), studioLum(angle, "mat"))
            }
          />
        ))}
      {/* Soleillage : le brossage rayonnant renvoie la lumière en papillon, deux
          secteurs clairs dans l'axe de la boîte à lumière, deux sombres en travers. */}
      {render.dialTexture === "soleille" && (
        <ConicDisk
          id={`${uid}-conic-dial`}
          count={full ? 240 : 48}
          radius={300}
          colorAt={(angle, i) => {
            const bow = 0.5 + 0.5 * Math.cos((2 * (angle - 318) * Math.PI) / 180);
            const lum = bow ** 1.6 + (jitter(i) - 0.5) * 0.14;
            // Un cadran clair se creuse surtout dans l'ombre ; un sombre s'allume.
            const bright = isLight(dial) ? tint(dial, 0.35) : glow(dial, 0.95);
            return mix(shade(dial, isLight(dial) ? 0.3 : 0.5), bright, Math.max(0, Math.min(1, lum)));
          }}
        />
      )}

      {/* Soleil profond : le cadran des habillées japonaises. Même papillon de
          lumière, mais poussé — les rayons clairs flambent, les sombres tombent
          presque au noir — et gaufré : un rayon sur deux est en relief, ce qui
          hache le reflet en fines lames quand le poignet tourne. */}
      {render.dialTexture === "soleil-profond" && (
        <ConicDisk
          id={`${uid}-conic-dial`}
          count={full ? 360 : 72}
          radius={300}
          colorAt={(angle, i) => {
            const bow = 0.5 + 0.5 * Math.cos((2 * (angle - 318) * Math.PI) / 180);
            const pli = full ? (i % 6 < 3 ? 0.085 : -0.085) : i % 2 ? 0.05 : -0.05;
            const lum = bow ** 2.1 + pli + (jitter(i) - 0.5) * 0.07;
            const bright = isLight(dial) ? tint(dial, 0.62) : glow(dial, 1.55);
            return mix(shade(dial, isLight(dial) ? 0.4 : 0.66), bright, Math.max(0, Math.min(1, lum)));
          }}
        />
      )}

      {/* Cornes : un seul dégradé dans le repère de la montre, pour que les
          quatre partagent la même lumière — la corne haut-gauche est la plus
          claire, la corne bas-droite la plus sombre. */}
      <linearGradient id={`${uid}-lugs`} gradientUnits="userSpaceOnUse" x1="180" y1="40" x2="820" y2="960">
        <stop offset="0" stopColor={rampAt(ramp, finish === "poli" ? 0.95 : 0.8)} />
        <stop offset="0.22" stopColor={ramp.light} />
        <stop offset="0.5" stopColor={ramp.mid} />
        <stop offset="0.78" stopColor={mix(ramp.mid, ramp.dark, 0.8)} />
        <stop offset="1" stopColor={ramp.mid} />
      </linearGradient>
      <linearGradient id={`${uid}-lug-fall-haut`} gradientUnits="userSpaceOnUse" x1="0" y1="230" x2="0" y2="62">
        <stop offset="0.3" stopColor={INK} stopOpacity="0" />
        <stop offset="1" stopColor={INK} stopOpacity="0.42" />
      </linearGradient>
      <linearGradient id={`${uid}-lug-fall-bas`} gradientUnits="userSpaceOnUse" x1="0" y1="770" x2="0" y2="938">
        <stop offset="0.3" stopColor={INK} stopOpacity="0" />
        <stop offset="1" stopColor={INK} stopOpacity="0.5" />
      </linearGradient>
      {/* Chanfrein poli des cornes : un éclat franc bordé de sombre. */}
      <linearGradient id={`${uid}-lug-bevel`} gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="920">
        <stop offset="0" stopColor={ramp.hi} />
        <stop offset="0.3" stopColor={ramp.light} />
        <stop offset="0.52" stopColor={ramp.dark} />
        <stop offset="0.7" stopColor={ramp.light} />
        <stop offset="1" stopColor={ramp.mid} />
      </linearGradient>

      {/* Flancs rapportés (protège-couronne, poussoirs) : même lumière que la carrure. */}
      <linearGradient id={`${uid}-case`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ramp.mid} />
        <stop offset="0.2" stopColor={ramp.light} />
        <stop offset="0.5" stopColor={ramp.mid} />
        <stop offset="1" stopColor={ramp.dark} />
      </linearGradient>

      {/* Le cadran n'est jamais plat : la lumière tombe du haut-gauche. */}
      <radialGradient id={`${uid}-dial`} cx="0.4" cy="0.32" r="0.9">
        <stop offset="0" stopColor={tint(dial, render.dialTexture === "mat" ? 0.06 : 0.14)} />
        <stop offset="0.5" stopColor={dial} />
        <stop offset="1" stopColor={shade(dial, 0.34)} />
      </radialGradient>

      {/* Fumé du soleil profond : la teinte s'assombrit vers le réhaut. */}
      {render.dialTexture === "soleil-profond" && (
        <radialGradient id={`${uid}-dial-fume`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.38" stopColor={shade(dial, 0.8)} stopOpacity="0" />
          <stop offset="0.74" stopColor={shade(dial, 0.8)} stopOpacity="0.42" />
          <stop offset="1" stopColor={shade(dial, 0.88)} stopOpacity="0.86" />
        </radialGradient>
      )}

      {/* Pente d'un réhaut imprimé : tournée vers le centre, elle est dans
          l'ombre en haut à gauche et reçoit la lumière en bas à droite. */}
      <linearGradient id={`${uid}-rehaut-pente`} gradientUnits="userSpaceOnUse" x1="296" y1="296" x2="704" y2="704">
        <stop offset="0" stopColor={INK} stopOpacity="0.5" />
        <stop offset="0.5" stopColor={INK} stopOpacity="0.12" />
        <stop offset="1" stopColor={PAPER} stopOpacity="0.16" />
      </linearGradient>

      {/* Ombre du réhaut sur le pourtour du cadran. */}
      <radialGradient id={`${uid}-dial-vignette`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.7" stopColor={INK} stopOpacity="0" />
        <stop offset="0.92" stopColor={INK} stopOpacity="0.22" />
        <stop offset="1" stopColor={INK} stopOpacity="0.6" />
      </radialGradient>
      {/* La même ombre, décentrée : le réhaut masque la lumière en haut à gauche. */}
      <radialGradient id={`${uid}-rehaut-cast`} cx="0.53" cy="0.545" r="0.5">
        <stop offset="0.86" stopColor={INK} stopOpacity="0" />
        <stop offset="1" stopColor={INK} stopOpacity="0.5" />
      </radialGradient>

      {/* Nappe de lumière d'un cadran laqué ou émaillé. */}
      <radialGradient id={`${uid}-gloss`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={PAPER} stopOpacity="0.5" />
        <stop offset="0.6" stopColor={PAPER} stopOpacity="0.12" />
        <stop offset="1" stopColor={PAPER} stopOpacity="0" />
      </radialGradient>

      {/* Reflet du saphir : deux bandes, la fenêtre d'une boîte à lumière. C'est
          ce dégradé que le pointeur fait glisser. */}
      <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={PAPER} stopOpacity="0" />
        <stop offset="0.18" stopColor={PAPER} stopOpacity={render.antiGlare ? 0.1 : 0.2} />
        <stop offset="0.46" stopColor={PAPER} stopOpacity={render.antiGlare ? 0.03 : 0.07} />
        <stop offset="0.5" stopColor={PAPER} stopOpacity="0" />
        <stop offset="0.58" stopColor={PAPER} stopOpacity="0" />
        <stop offset="0.64" stopColor={PAPER} stopOpacity={render.antiGlare ? 0.06 : 0.13} />
        <stop offset="1" stopColor={PAPER} stopOpacity="0" />
      </linearGradient>

      {/* Voile antireflet : le bleu-violet d'un traitement multicouche, au bord. */}
      <radialGradient id={`${uid}-ar`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.55" stopColor="#5A6CFF" stopOpacity="0" />
        <stop offset="0.9" stopColor="#5A6CFF" stopOpacity="0.04" />
        <stop offset="1" stopColor="#7A5CFF" stopOpacity="0.09" />
      </radialGradient>

      {/* Point chaud du saphir : le spot studio, concentré. */}
      <radialGradient id={`${uid}-hotspot`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0.25" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>

      {/* Ombre au sol : une nappe large et douce, et l'occlusion de contact. */}
      <radialGradient id={`${uid}-shadow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.5" stopColor={INK} stopOpacity="0.3" />
        <stop offset="0.78" stopColor={INK} stopOpacity="0.1" />
        <stop offset="1" stopColor={INK} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-shadow-contact`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.78" stopColor={INK} stopOpacity="0.5" />
        <stop offset="0.9" stopColor={INK} stopOpacity="0.2" />
        <stop offset="1" stopColor={INK} stopOpacity="0" />
      </radialGradient>

      {/* Brossage droit des cornes, dans le sens du bracelet. */}
      <pattern id={`${uid}-brushed`} width="7" height="40" patternUnits="userSpaceOnUse">
        <line x1="1" y1="0" x2="1" y2="40" stroke={PAPER} strokeOpacity="0.2" strokeWidth="0.9" />
        <line x1="3.4" y1="0" x2="3.4" y2="40" stroke={INK} strokeOpacity="0.13" strokeWidth="0.9" />
        <line x1="5.6" y1="0" x2="5.6" y2="40" stroke={PAPER} strokeOpacity="0.1" strokeWidth="0.7" />
      </pattern>

      {/* Microbillé : grain mat, sans brillance. */}
      <pattern id={`${uid}-beaded`} width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="0.7" fill={INK} fillOpacity="0.12" />
        <circle cx="3.8" cy="3.6" r="0.6" fill={PAPER} fillOpacity="0.16" />
      </pattern>

      {/* Grain d'un cadran mat : une laque granuleuse, à peine plus fine que le
          microbillage, qui casse l'aplat sans le salir. Plein détail seulement. */}
      {full && render.dialTexture === "mat" && (
        <pattern id={`${uid}-dial-grain`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(17)">
          <circle cx="1" cy="1.2" r="0.55" fill={INK} fillOpacity="0.09" />
          <circle cx="2.9" cy="3" r="0.5" fill={PAPER} fillOpacity="0.11" />
          <circle cx="3.2" cy="0.6" r="0.35" fill={INK} fillOpacity="0.06" />
        </pattern>
      )}

      <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="7" />
      </filter>

      {/* Ombre de contact : index et guichet posés sur le cadran. */}
      <filter id={`${uid}-contact-shadow`} x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="2" dy="3" stdDeviation="1.8" floodColor={INK} floodOpacity="0.55" />
      </filter>

      {/* Ombres portées des aiguilles : plus une aiguille est haute sur le
          canon, plus son ombre s'écarte et s'adoucit. */}
      <filter id={`${uid}-hand-shadow`} x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="5" dy="8" stdDeviation="4" floodColor={INK} floodOpacity="0.5" />
      </filter>
      <filter id={`${uid}-hand-shadow-haut`} x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="8" dy="13" stdDeviation="5.5" floodColor={INK} floodOpacity="0.42" />
      </filter>

      <clipPath id={`${uid}-dial-clip`}>
        <circle cx="500" cy="500" r="289" />
      </clipPath>
    </defs>
  );
}

/** Dégradé de cylindre poli : pour les petites pièces (couronne, canon, poussoirs). */
function MetalGradient({ id, tone }: { id: string; tone: MetalTone }) {
  const m = METALS[tone];
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={m.dark} />
      <stop offset="0.14" stopColor={m.mid} />
      <stop offset="0.3" stopColor={m.hi} />
      <stop offset="0.42" stopColor={m.light} />
      <stop offset="0.66" stopColor={m.mid} />
      <stop offset="0.86" stopColor={m.dark} />
      <stop offset="1" stopColor={m.edge} />
    </linearGradient>
  );
}
