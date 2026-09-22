import { INK, METALS, PAPER, mix, rampAt, shade, tint, type MetalRamp } from "../palette";
import { C } from "../geometry";
import type { Sheen } from "../parts/conic";
import { FINISH_SHEEN } from "../parts/defs";
import type { WatchRender } from "../types";
import { Z, flankNormal, lum3, type Pose } from "./geometry3d";

/** Teinte du saphir vu par la tranche (voir `parts/profile.tsx`). */
export const SAPHIR = "#C3D3DD";

/** Hauteur des aiguilles au-dessus du cadran, pour l'allongement de leur ombre. */
const HAUTEUR_BASSE = Z.aiguilles - Z.cadran;
const HAUTEUR_HAUTE = HAUTEUR_BASSE + 6;

/**
 * Dégradés propres à la vue projetée. Tous préfixés `${uid}-pj-` : ils
 * cohabitent avec ceux de `parts/defs.tsx`, qui restent utilisés tels quels.
 *
 * Le flanc d'un cylindre debout s'éclaire selon l'azimut de sa normale ; à
 * l'écran cet azimut ne dépend que de la hauteur `y` du point, quel que soit
 * le lacet. Un dégradé vertical par finition suffit donc à toutes les bagues
 * (carrure, fond, lunette), recalculé à chaque pose puisque la normale tourne.
 */
export function Defs3D({ uid, render, p, detail }: { uid: string; render: WatchRender; p: Pose; detail: "full" | "compact" }) {
  const ramp = METALS[render.caseMetal];
  const finish = FINISH_SHEEN[render.caseFinish];
  const insert = render.bezelStyle === "plongee" || render.bezelStyle === "gmt" || render.bezelStyle === "tachymetre";
  const full = detail === "full";
  const stops = full ? 19 : 5;
  const teinteInsert = render.insertColor ?? (render.bezelStyle === "tachymetre" ? "#17191C" : "#1B2B45");
  const ceramique = (render.insertMaterial ?? "ceramique") === "ceramique";
  // Ombre d'une aiguille : la part de studio (5 ; 8) est écrite dans le repère
  // du cadran, la part de parallaxe est exacte — l'ombre reste sur le cadran
  // quand l'aiguille, plus haute, glisse de `z·sin θ`. Le tout dans le repère
  // local, resserré de `cf` à l'écran.
  const dxOmbre = (base: number, hauteur: number) => Math.max(-60, Math.min(60, base + (hauteur * p.s) / p.cf));
  // Facette latérale des index : celle qui regarde vers nous, vers ±x.
  const lumIndex = lum3(p.side * p.c, 0.15, Math.abs(p.s), "poli");

  return (
    <defs>
      <FlankGradient id={`${uid}-pj-flanc`} p={p} stops={stops} colorAt={(l) => rampAt(ramp, l)} sheen={finish} />
      {finish !== "poli" && <FlankGradient id={`${uid}-pj-flanc-poli`} p={p} stops={stops} colorAt={(l) => rampAt(ramp, l)} sheen="poli" />}
      {insert && (
        <FlankGradient
          id={`${uid}-pj-flanc-insert`}
          p={p}
          stops={stops}
          sheen={ceramique ? "ceramique" : "mat"}
          colorAt={(l) => (ceramique ? mix(shade(teinteInsert, 0.38), tint(teinteInsert, 0.6), l) : mix(shade(teinteInsert, 0.12), tint(teinteInsert, 0.2), l))}
        />
      )}
      {/* Verre par la tranche : clair vers le haut, saphir sombre vers le bas. */}
      {full && (
        <linearGradient id={`${uid}-pj-verre`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAPER} stopOpacity="0.8" />
          <stop offset="0.4" stopColor={SAPHIR} stopOpacity="0.55" />
          <stop offset="1" stopColor={mix(SAPHIR, INK, 0.5)} stopOpacity="0.72" />
        </linearGradient>
      )}
      {/* Dôme d'un verre bombé : la lumière glisse sur le galbe. */}
      {full && (
        <linearGradient id={`${uid}-pj-dome`} x1={p.side > 0 ? 0 : 1} y1="0" x2={p.side > 0 ? 1 : 0} y2="0">
          <stop offset="0" stopColor={PAPER} stopOpacity="0.55" />
          <stop offset="0.3" stopColor={SAPHIR} stopOpacity="0.28" />
          <stop offset="1" stopColor={SAPHIR} stopOpacity="0.1" />
        </linearGradient>
      )}
      {/* Ce qui regarde vers le bas perd la lumière. */}
      <linearGradient id={`${uid}-pj-dessous`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={INK} stopOpacity="0.05" />
        <stop offset="1" stopColor={INK} stopOpacity="0.55" />
      </linearGradient>
      {/* Galbe d'une tranche de bracelet ou du rebord du fond : l'arête vers
          le dessus prend la lumière, celle vers le poignet la perd. */}
      {full && (
        <linearGradient id={`${uid}-pj-galbe`} x1={p.s > 0 ? 0 : 1} y1="0" x2={p.s > 0 ? 1 : 0} y2="0">
          <stop offset="0" stopColor={PAPER} stopOpacity="0.28" />
          <stop offset="0.18" stopColor={PAPER} stopOpacity="0" />
          <stop offset="0.75" stopColor={INK} stopOpacity="0" />
          <stop offset="1" stopColor={INK} stopOpacity="0.45" />
        </linearGradient>
      )}
      {/* Paroi intérieure de la lunette, au-dessus du cadran : dans l'ombre. */}
      <linearGradient id={`${uid}-pj-paroi`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={rampAt(ramp, 0.34)} />
        <stop offset="0.5" stopColor={rampAt(ramp, 0.2)} />
        <stop offset="1" stopColor={rampAt(ramp, 0.3)} />
      </linearGradient>
      <HeadGradient id={`${uid}-pj-tete-couronne`} ramp={METALS[render.crownMetal]} />
      {render.movement === "VK64" && <HeadGradient id={`${uid}-pj-tete-boite`} ramp={ramp} />}
      {/* Brossage du flanc : il suit la circonférence, donc horizontal vu de
          côté, quel que soit le lacet — comme sur la vue de profil. */}
      {render.caseFinish === "brosse" && full && (
        <pattern id={`${uid}-pj-stries`} width="40" height="4.2" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0.7" x2="40" y2="0.7" stroke={PAPER} strokeOpacity="0.2" strokeWidth="0.6" />
          <line x1="0" y1="2.1" x2="40" y2="2.1" stroke={INK} strokeOpacity="0.14" strokeWidth="0.6" />
          <line x1="0" y1="3.4" x2="40" y2="3.4" stroke={PAPER} strokeOpacity="0.1" strokeWidth="0.5" />
        </pattern>
      )}
      {/* Ombre de contact des index : elle s'allonge à mesure que le cadran se dérobe. */}
      {full && (
        <filter id={`${uid}-pj-index-shadow`} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx={n2(2 + 10 * Math.abs(p.s))} dy="3" stdDeviation={n2(1.8 + 1.4 * Math.abs(p.s))} floodColor={INK} floodOpacity="0.55" />
        </filter>
      )}
      {/* Épaisseur des index appliqués : leur silhouette, dans le ton de la
          facette latérale, posée au pied de l'index (`Z.cadran`). Vue de biais,
          seule dépasse la facette qui regarde vers nous. */}
      {full && p.s !== 0 && (
        <filter id={`${uid}-pj-index-flanc`} x="-20%" y="-20%" width="140%" height="140%">
          <feFlood floodColor={rampAt(ramp, 0.12 + 0.6 * lumIndex)} />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      )}
      {/* Ombres portées des aiguilles, par étage (voir `HAND_LIFT`). */}
      <filter id={`${uid}-pj-ombre-aiguille-basse`} x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx={n2(dxOmbre(5, HAUTEUR_BASSE))} dy="8" stdDeviation={n2(4 + 2 * Math.abs(p.s))} floodColor={INK} floodOpacity="0.5" />
      </filter>
      {full && (
        <filter id={`${uid}-pj-ombre-aiguille-haute`} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx={n2(dxOmbre(8, HAUTEUR_HAUTE))} dy="13" stdDeviation={n2(5.5 + 2.5 * Math.abs(p.s))} floodColor={INK} floodOpacity="0.42" />
        </filter>
      )}
      {/* Ombre au sol : la silhouette réelle, floutée deux fois — une nappe
          large, et l'occlusion de contact plus serrée, qui s'y superpose. */}
      <filter id={`${uid}-pj-ombre-sol`} x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur in="SourceGraphic" stdDeviation={full ? 22 : 14} result="nappe" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="contact" />
        <feMerge>
          <feMergeNode in="nappe" />
          <feMergeNode in="contact" />
        </feMerge>
      </filter>
      {/* Cornes (rondes ou du coussin) : la partie qui plonge (au-delà du coude) et l'épaule, restée à plat. */}
      {p.s !== 0 && (
        <>
          <clipPath id={`${uid}-pj-corne-haut`}>
            <rect x="-200" y="-200" width="1400" height={C - Z.corneCoude + 200} />
          </clipPath>
          <clipPath id={`${uid}-pj-corne-bas`}>
            <rect x="-200" y={C + Z.corneCoude} width="1400" height="600" />
          </clipPath>
          <clipPath id={`${uid}-pj-corne-epaule`}>
            <rect x="-200" y={C - Z.corneCoude} width="1400" height={2 * Z.corneCoude} />
          </clipPath>
        </>
      )}
    </defs>
  );
}

function n2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Dégradé vertical d'un flanc : un arrêt par tranche d'azimut, resserrés vers les bords. */
function FlankGradient({ id, p, stops, sheen, colorAt }: { id: string; p: Pose; stops: number; sheen: Sheen; colorAt: (lum: number) => string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {Array.from({ length: stops }, (_, i) => {
        const phi = -Math.PI / 2 + (Math.PI * i) / (stops - 1);
        // L'azimut visible est celui du côté qui regarde vers nous.
        const [nx, ny, nz] = flankNormal(p, p.side > 0 ? phi : Math.PI - phi);
        return <stop key={i} offset={n2((Math.sin(phi) + 1) / 2)} stopColor={colorAt(lum3(nx, ny, nz, sheen))} />;
      })}
    </linearGradient>
  );
}

/** Tête polie d'une petite pièce vue de bout (couronne, poussoir). */
function HeadGradient({ id, ramp }: { id: string; ramp: MetalRamp }) {
  return (
    <linearGradient id={id} x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stopColor={ramp.hi} />
      <stop offset="0.3" stopColor={ramp.light} />
      <stop offset="0.52" stopColor={ramp.mid} />
      <stop offset="0.8" stopColor={ramp.dark} />
      <stop offset="1" stopColor={ramp.mid} />
    </linearGradient>
  );
}
