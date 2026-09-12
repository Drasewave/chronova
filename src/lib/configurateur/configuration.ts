import { STEPS } from "@/lib/data/catalogue";
import { excludedOptionsFor, type SampleModel } from "@/lib/data/models";
import type { WatchRender } from "@/watch/types";
import { buildBom, partsCost, type BomLine } from "./bom";
import { computeLeadTime, computePrice, type LeadTime, type PriceBreakdown } from "./price";
import { normalizeSelections } from "./rules";
import { describeSelection, resolveRender } from "./resolve";
import { encodeConfig } from "./url";
import type { Selections } from "./types";

export interface SummaryLine {
  stepLabel: string;
  groupKey: string;
  groupLabel: string;
  value: string;
}

export interface Configuration {
  modelSlug: string;
  /** Sélections remises d'aplomb : c'est la version qui fait foi partout. */
  selections: Selections;
  render: WatchRender;
  price: PriceBreakdown;
  leadTime: LeadTime;
  bom: BomLine[];
  partsCostCents: number;
  /** Valeur du paramètre `?c=` : le lien de partage. */
  shareParam: string;
  summary: SummaryLine[];
}

/**
 * Assemble tout ce qu'une configuration doit savoir dire d'elle-même.
 *
 * Cette fonction est le point d'entrée unique : configurateur, panier, e-mails
 * et CRM en dépendent tous, ce qui garantit qu'un même choix donne partout le
 * même prix, le même délai et la même nomenclature.
 */
export function buildConfiguration(model: SampleModel, brutes: Selections): Configuration {
  const selections = normalizeSelections(brutes, excludedOptionsFor(model));
  const bom = buildBom(selections);

  const summary: SummaryLine[] = [];
  for (const step of STEPS) {
    for (const group of step.groups) {
      const valeur = selections[group.key];
      if (!valeur) continue;
      const libelle = describeSelection(group.key, valeur);
      if (!libelle) continue;
      summary.push({
        stepLabel: step.label,
        groupKey: group.key,
        groupLabel: group.label,
        value: group.selection === "mesure" ? `${libelle}` : libelle,
      });
    }
  }

  return {
    modelSlug: model.slug,
    selections,
    render: resolveRender(selections),
    price: computePrice(model.basePriceCents, selections),
    leadTime: computeLeadTime(model.assemblyDays, selections),
    bom,
    partsCostCents: partsCost(bom),
    shareParam: encodeConfig(selections),
    summary,
  };
}

/** Configuration de départ d'un modèle, et sa variante de survol. */
export function defaultConfiguration(model: SampleModel): Configuration {
  return buildConfiguration(model, model.defaultSelections);
}

export function altConfiguration(model: SampleModel): Configuration {
  return buildConfiguration(model, { ...model.defaultSelections, ...model.altSelections });
}
