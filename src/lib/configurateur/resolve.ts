import type { WatchRender } from "@/watch/types";
import type { Catalogue } from "./catalogue";
import type { Selections } from "./types";

/**
 * Point de départ du rendu. Aucune de ces valeurs n'est « la marque » : chacune
 * est écrasée par l'option correspondante. Elles servent de filet si une option
 * venait à manquer (catalogue en cours d'édition, lien ancien).
 */
export const BASE_RENDER: WatchRender = {
  caseSize: 40,
  caseFinish: "brosse",
  caseMetal: "acier",
  bezelStyle: "lisse",
  dialColor: "#1E3448",
  dialTexture: "soleille",
  indexStyle: "batons",
  handShape: "glaive",
  handMetal: "acier",
  lume: true,
  crownStyle: "signee",
  crownMetal: "acier",
  strapKind: "acier-3-maillons",
  strapColor: "#B0A899",
  crystal: "plat",
  antiGlare: true,
  movement: "NH35",
  caseback: "plein",
  showDate: true,
};

/**
 * Sélections → configuration dessinable.
 *
 * Chaque option porte un correctif partiel ; on les empile dans l'ordre des
 * étapes. Le moteur SVG n'a donc jamais connaissance du catalogue, et le
 * catalogue n'a jamais connaissance du dessin.
 */
export function resolveRender(catalogue: Catalogue, selections: Selections): WatchRender {
  let render: WatchRender = { ...BASE_RENDER };

  for (const step of catalogue.steps) {
    for (const group of step.groups) {
      const value = selections[group.key];
      if (!value) continue;

      if (group.selection === "texte") {
        if (group.key === "gravure") {
          render = { ...render, engraving: value.slice(0, group.maxLength ?? 30) };
        }
        continue;
      }

      const patch = catalogue.optionIndex.get(`${group.key}:${value}`)?.option.render;
      if (patch) render = { ...render, ...patch };
    }
  }

  return render;
}

/** Libellé lisible d'une sélection, pour le récapitulatif et le panier. */
export function describeSelection(
  catalogue: Catalogue,
  groupKey: string,
  value: string,
): string | undefined {
  const groupe = catalogue.groupIndex.get(groupKey);
  if (!groupe) return undefined;
  if (groupe.group.selection === "texte") return value;
  return catalogue.optionIndex.get(`${groupKey}:${value}`)?.option.label;
}
